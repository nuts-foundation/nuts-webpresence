// Tests of what a crawl may change in the index (indexer/src/rules.ts). Run with: npm run test:search
import assert from "node:assert/strict"
import { test } from "node:test"

import type { CrawlResult, SearchRecord, Skipped } from "./indexer/src/crawl.ts"
import {
  diagnostics, failure, isComplete, isIndexed, locations, mayPrune, operationProblem, planRemoval, responseDescription,
} from "./indexer/src/rules.ts"
import { parseSitemap } from "./indexer/src/sitemap.ts"

const record = { id: "1" } as SearchRecord
const result = (extra: Partial<CrawlResult> = {}): CrawlResult => ({ pages: 1, records: [record], errors: [], skipped: [], ...extra })
const skip = (reason: string, extra: Partial<Skipped> = {}): Skipped => ({ url: "https://example.org/page", reason, ...extra })

test("a crawl without failures is complete and indexed", () => {
  assert.equal(isComplete(result()), true)
  assert.equal(isIndexed(result()), true)
})

test("a crawl that found nothing is never complete", () => {
  assert.equal(isComplete(result({ pages: 0, records: [] })), false)
})

test("a failed page or a page left out makes the crawl incomplete", () => {
  assert.equal(isComplete(result({ errors: [skip("HTTP 500")] })), false)
  assert.equal(isComplete(result({ skipped: [skip("maxPages (500) reached", { incomplete: true })] })), false)
})

test("pages that are gone or not indexed on purpose don't count against completeness", () => {
  assert.equal(isComplete(result({ skipped: [skip("HTTP 404"), skip("excluded"), skip("duplicate of https://example.org/")] })), true)
})

test("a page waiting to be published keeps a complete crawl from counting as indexed", () => {
  const waiting = result({ skipped: [skip("in org/repo@main (page.md) but not published", { retry: true })] })
  assert.equal(isComplete(waiting), true)
  assert.equal(isIndexed(waiting), false)
})

test("a crawl fails when it found nothing or many of its pages failed at once", () => {
  const failed = (n: number) => Array.from({ length: n }, () => skip("HTTP 500"))
  assert.equal(failure(result()), undefined)
  assert.equal(failure(result({ pages: 0, records: [] })), "nothing indexed")
  assert.equal(failure(result({ pages: 10, errors: failed(5) })), undefined)
  assert.equal(failure(result({ pages: 10, errors: failed(6) })), "6 of 16 pages failed or were left out")
  assert.equal(failure(result({ pages: 100, errors: failed(6) })), undefined)
  assert.equal(failure(result({ pages: 1, skipped: Array.from({ length: 6 }, () => skip("maxPages (1) reached", { incomplete: true })) })), "6 of 7 pages failed or were left out")
  assert.equal(failure(result({ pages: 1, skipped: Array.from({ length: 6 }, () => skip("HTTP 404")) })), undefined)
})

test("a few records, or up to a quarter of a source, may be pruned", () => {
  assert.equal(mayPrune(0, 0), true)
  assert.equal(mayPrune(5, 5), true)
  assert.equal(mayPrune(6, 24), true)
  assert.equal(mayPrune(7, 24), false)
  assert.equal(mayPrune(250, 1000), true)
  assert.equal(mayPrune(251, 1000), false)
})

test("removal is planned against the index as it was, so new pages don't make it look smaller", () => {
  const indexed = Array.from({ length: 20 }, (_, i) => ({ id: `old-${i}`, url: `https://example.org/${i}` }))
  const found = [...indexed.slice(6), ...Array.from({ length: 4 }, (_, i) => ({ id: `new-${i}` }))]
  const plan = planRemoval(indexed, found, [], false)
  assert.deepEqual(plan.stale.map(r => r.id), ["old-0", "old-1", "old-2", "old-3", "old-4", "old-5"])
  assert.equal(plan.existing, 20)
  assert.equal(plan.allowed, false)
  assert.equal(planRemoval(indexed, found, [], true).allowed, true)
  assert.equal(planRemoval(indexed, indexed.slice(5), [], false).allowed, true)
})

test("records of a page in the repository that isn't published stay, unless forced", () => {
  const indexed = [
    { id: "1", url: "https://example.org/a.html" },
    { id: "2", url: "https://example.org/a.html#details" },
    { id: "3", url: "https://example.org/b.html" },
  ]
  const plan = planRemoval(indexed, [], ["https://example.org/a.html"], false)
  assert.deepEqual(plan.waiting.map(r => r.id), ["1", "2"])
  assert.deepEqual(plan.stale.map(r => r.id), ["3"])
  const forced = planRemoval(indexed, [], ["https://example.org/a.html"], true)
  assert.deepEqual([forced.waiting.length, forced.stale.length], [0, 3])
})

test("an operation cut off halfway is incomplete", () => {
  const ok = { summary: "Get a thing", responses: { "200": { description: "OK" }, "404": { $ref: "#/components/responses/NotFound" } } }
  assert.equal(operationProblem(ok, "3.0.0"), undefined)
  assert.equal(operationProblem(null, "3.0.0"), "not an operation")
  assert.equal(operationProblem({ summary: "Get a thing", tags: ["fx"] }, "3.0.0"), "no responses")
  assert.equal(operationProblem({ responses: null }, "3.0.0"), "no responses")
  assert.equal(operationProblem({ responses: { "x-note": "only an extension" } }, "3.0.0"), "no responses")
  assert.equal(operationProblem({ responses: { "200": null } }, "3.0.0"), "response 200 is not a response")
  assert.equal(operationProblem({ responses: { "200": { description: null } } }, "3.0.0"), "response 200 has no description")
  assert.equal(operationProblem({ responses: { "404": { $ref: null } } }, "3.0.0"), "response 404 has a $ref that isn't a string")
  assert.equal(operationProblem({ summary: "Get a thing" }, "3.1.0"), undefined)
  assert.equal(operationProblem({ responses: {} }, "3.1.0"), "no responses")
  assert.equal(operationProblem({ responses: { "200": {} } }, "3.1.0"), "response 200 has no description")
})

test("records are located by page, and API operations by their own URL", () => {
  assert.deepEqual(locations([
    { id: "1", url: "https://example.org/page#intro" },
    { id: "2", url: "https://example.org/page#details" },
    { id: "3", url: "https://example.org/api/#tag/auth/GET/token", method: "GET" },
    { id: "4", url: "https://example.org/api/#tag/auth/POST/token", method: "POST" },
  ]), ["https://example.org/page", "https://example.org/api/#tag/auth/GET/token", "https://example.org/api/#tag/auth/POST/token"])
})

test("a sitemap lists pages, a sitemap index lists sitemaps", () => {
  const urlset = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc> https://example.org/a?x=1&amp;y=2 </loc></url></urlset>`
  assert.deepEqual(parseSitemap(`${urlset}\n<!-- generated by a plugin -->\n`), { urls: ["https://example.org/a?x=1&y=2"], sitemaps: [] })
  assert.deepEqual(parseSitemap(`<sm:sitemapindex xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"><sm:sitemap><sm:loc>https://example.org/b.xml</sm:loc></sm:sitemap></sm:sitemapindex>`),
    { urls: [], sitemaps: ["https://example.org/b.xml"] })
})

test("anything but a well-formed sitemap is an error", () => {
  const cut = `<urlset><url><loc>https://example.org/a</loc></url><url><loc>https://example.org/b`
  const unterminatedComment = `<urlset><url><loc>https://example.org/a</loc></url><!-- <url><loc>https://example.org/b</loc></url></urlset>`
  for (const xml of [cut, unterminatedComment, "<!doctype html><html><body>Something went wrong</body></html>", "<html></html>", "", `<urlset></urlset>junk`]) {
    assert.throws(() => parseSitemap(xml), undefined, xml)
  }
  assert.throws(() => parseSitemap("<html></html>"), /not a sitemap: the root is html/)
})

test("every sitemap entry has exactly one location", () => {
  assert.throws(() => parseSitemap(`<urlset><url><loc>https://example.org/a</loc></url><url><lastmod>2026-01-01</lastmod></url></urlset>`),
    /not a valid sitemap: a url with 0 locs/)
  assert.throws(() => parseSitemap(`<urlset><url><loc>https://example.org/a</loc><loc>https://example.org/b</loc></url></urlset>`),
    /a url with 2 locs/)
  assert.throws(() => parseSitemap(`<urlset><url><loc> </loc></url></urlset>`), /a loc without a URL/)
  assert.throws(() => parseSitemap(`<sitemapindex><sitemap><lastmod>2026-01-01</lastmod></sitemap></sitemapindex>`), /a sitemap with 0 locs/)
})

test("a response's description is read inline or from the document's components", () => {
  const components = { responses: { NotFound: { description: "Not found" }, Broken: { description: 42 } } }
  assert.equal(responseDescription({ description: "Conflict" }, components), "Conflict")
  assert.equal(responseDescription({ $ref: "#/components/responses/NotFound" }, components), "Not found")
  assert.equal(responseDescription({ $ref: "#/components/responses/Missing" }, components), undefined)
  assert.equal(responseDescription({ $ref: "#/components/responses/Broken" }, components), undefined)
  assert.equal(responseDescription({ $ref: "../common/error_response.yaml" }, components), undefined)
  assert.equal(responseDescription({ $ref: "#/components/responses/NotFound" }, undefined), undefined)
  assert.equal(responseDescription(undefined, components), undefined)
})

test("diagnostics list failed and left-out pages, not pages that are gone", () => {
  const lines = diagnostics(result({
    errors: [skip("HTTP 500")],
    skipped: [skip("HTTP 404"), skip("content selector \"main\" not found", { incomplete: true })],
  }))
  assert.deepEqual(lines, ["https://example.org/page: HTTP 500", "https://example.org/page: content selector \"main\" not found"])
})

test("diagnostics are capped in number and length", () => {
  const lines = diagnostics(result({ errors: Array.from({ length: 25 }, (_, i) => skip(`${i} ${"x".repeat(400)}`)) }))
  assert.equal(lines.length, 21)
  assert.ok(lines.slice(0, 20).every(line => line.length === 300))
  assert.equal(lines[20], "… and 5 more (out/report.json)")
})

test("a reason that spans several lines takes one line of the log", () => {
  const [line] = diagnostics(result({ errors: [skip("Implicit keys need to be on a single line at line 3:\n\n  bad: [\n  ^\n")] }))
  assert.equal(line, "https://example.org/page: Implicit keys need to be on a single line at line 3: bad: [ ^")
})
