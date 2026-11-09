// Tests of how the indexer reads broken or partial sources (indexer/src/crawl.ts, openapi.ts, versions.ts), with a fake
// fetcher instead of the network. Run with: npm run test:search
import assert from "node:assert/strict"
import { test } from "node:test"

import type { Settings, Source } from "./indexer/src/config.ts"
import { crawl, type SearchRecord } from "./indexer/src/crawl.ts"
import type { Fetcher, FetchResult } from "./indexer/src/fetcher.ts"
import { indexOpenApi } from "./indexer/src/openapi.ts"
import { isComplete } from "./indexer/src/rules.ts"
import { linkVersions } from "./indexer/src/versions.ts"

const settings: Settings = { userAgent: "test", rateLimitMs: 0, maxPages: 100, timeoutMs: 1000 }
const noLog = () => {}

// Serves the given responses, as HTML with status 200 unless they say otherwise; any other URL is a 404.
function fetcher(responses: Record<string, Partial<FetchResult>>): Fetcher {
  const get = async (url: string): Promise<FetchResult> =>
    ({ url, redirected: false, status: url in responses ? 200 : 404, contentType: "text/html", body: "", ...responses[url] })
  return { get } as unknown as Fetcher
}

const site = (extra: Partial<Source> = {}): Source => ({
  id: "site", name: "Site", owner: "test", startUrls: ["https://example.org/"], urlPrefix: "https://example.org/",
  selectors: { content: "main" }, labels: { category: "website" }, ...extra,
})
const page = (content: string) => `<html lang="en"><head><title>Page</title></head><body><main>${content}</main></body></html>`
const home = (...links: string[]) => ({ body: page(`<h1>Home</h1><p>Start.</p>${links.map(l => `<a href="${l}">${l}</a>`).join("")}`) })

test("a page whose content element has no text makes the crawl incomplete", async () => {
  const result = await crawl(site(), settings, fetcher({
    "https://example.org/": home("/a"),
    "https://example.org/a": { body: page(" \n ") },
  }), noLog)
  assert.equal(isComplete(result), false)
  assert.deepEqual(result.skipped, [{ url: "https://example.org/a", reason: 'content selector "main" has no text', incomplete: true }])
})

test("a page with only a heading keeps one record, so its title stays findable", async () => {
  const result = await crawl(site(), settings, fetcher({
    "https://example.org/": home("/roadmap"),
    "https://example.org/roadmap": { body: page("<h1>Roadmap</h1>") },
  }), noLog)
  assert.equal(isComplete(result), true)
  assert.deepEqual(result.records.filter(r => r.url.includes("roadmap")).map(r => r.title), ["Roadmap"])
})

test("a redirect to a missing page makes the crawl incomplete; a missing page doesn't", async () => {
  const result = await crawl(site(), settings, fetcher({
    "https://example.org/": home("/a", "/b"),
    "https://example.org/a": { status: 404, redirected: true, url: "https://example.org/a?gone=1" },
  }), noLog)
  assert.deepEqual(result.skipped.map(s => [s.url, s.reason, s.incomplete ?? false]), [
    ["https://example.org/a", "redirects to https://example.org/a?gone=1, which returns HTTP 404", true],
    ["https://example.org/b", "HTTP 404", false],
  ])
})

test("a response that isn't a page makes the crawl incomplete", async () => {
  const result = await crawl(site(), settings, fetcher({
    "https://example.org/": home("/a"),
    "https://example.org/a": { contentType: "text/plain", body: "upstream unavailable" },
  }), noLog)
  assert.equal(isComplete(result), false)
  assert.equal(result.skipped[0].reason, "not HTML (text/plain)")
})

test("a sitemap with an entry without a location fails the crawl", async () => {
  const sitemap = `<urlset><url><loc>https://example.org/</loc></url><url><lastmod>2026-01-01</lastmod></url></urlset>`
  await assert.rejects(crawl(site({ discovery: "sitemap", startUrls: ["https://example.org/sitemap.xml"] }), settings,
    fetcher({ "https://example.org/sitemap.xml": { body: sitemap, contentType: "application/xml" } }), noLog),
    /not a valid sitemap: a url with 0 locs/)
})

const api: Source = {
  id: "api", name: "API", owner: "test", kind: "openapi", labels: { category: "documentation", version: "latest" },
  apiPage: "https://docs.example.org/api.html", apiManifest: "https://docs.example.org/js/api.js",
}
const manifest = `// The APIs.\nconst apis = [\n    // In menu order.\n    {file: "a.yaml", name: "A", slug: "a"},\n    {file: "b.yaml", name: "B", slug: "b", deprecated: true},\n];\n`
const spec = (paths: string) => `openapi: 3.0.0\ninfo: {title: X, version: "1"}\npaths:\n${paths}`
const operation = (path: string, rest = `      responses:\n        "200": {description: OK}\n`) =>
  `  ${path}:\n    get:\n      summary: Get ${path}\n      tags: [x]\n${rest}`

test("every API in a complete manifest is indexed", async () => {
  const result = await indexOpenApi(api, fetcher({
    "https://docs.example.org/js/api.js": { body: manifest },
    "https://docs.example.org/a.yaml": { body: spec(operation("/a")) },
    "https://docs.example.org/b.yaml": { body: spec(operation("/b")) },
  }), noLog)
  assert.equal(isComplete(result), true)
  assert.deepEqual(result.records.map(r => r.url), ["https://docs.example.org/api.html#tag/a/GET/a", "https://docs.example.org/api.html#tag/b/GET/b"])
})

test("a manifest cut off halfway fails the source", async () => {
  await assert.rejects(indexOpenApi(api, fetcher({
    "https://docs.example.org/js/api.js": { body: manifest.slice(0, manifest.indexOf("b.yaml")) },
  }), noLog), /no complete list of APIs/)
})

test("a spec cut off halfway through an operation is an error", async () => {
  const result = await indexOpenApi(api, fetcher({
    "https://docs.example.org/js/api.js": { body: manifest },
    "https://docs.example.org/a.yaml": { body: spec(operation("/a")) },
    "https://docs.example.org/b.yaml": { body: spec(operation("/b", "")) },
  }), noLog)
  assert.equal(isComplete(result), false)
  assert.deepEqual(result.errors.map(e => [e.url, e.reason]), [["https://docs.example.org/b.yaml", "GET /b: no responses"]])
})

test("only a complete newest version marks the operations it lacks as removed", () => {
  const op = (version: string, path: string): SearchRecord => ({
    id: version + path, url: path, title: path, pageTitle: "API", hierarchy: [], content: "", source: "api",
    sourceName: "API", method: "GET", path, version, group: path, status: "actueel",
  })
  for (const complete of [true, false]) {
    const older = [op("v1", "/a"), op("v1", "/old")]
    linkVersions([{ version: "latest", records: [op("latest", "/a")], complete }, { version: "v1", records: older, complete: true }])
    assert.deepEqual(older.map(r => r.status), ["actueel", complete ? "archief" : "actueel"])
  }
})
