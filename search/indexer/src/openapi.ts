import { parse } from "yaml"

import { Source } from "./config.ts"
import { CrawlResult, hash } from "./crawl.ts"
import { Fetcher } from "./fetcher.ts"
import { labelsFor } from "./labels.ts"

const METHODS = ["get", "put", "post", "delete", "patch", "head", "options", "trace"]

interface Operation {
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
  deprecated?: boolean
  parameters?: { name?: string, description?: string }[]
}

interface Spec {
  url: string
  name: string
}

// Indexes the OpenAPI specs of an API reference page, one record per operation. The page renders the specs in the
// browser, so crawling it as HTML finds no operations. Two kinds of pages:
// - Scalar (apiManifest set): the specs are listed in nuts-node-api.js, which combines them in the browser. Results
//   link to the operation itself.
// - Swagger UI: the specs are listed in the page's config as {url: "...", name: "..."}. Swagger UI on these pages has
//   no deep links, so results link to the page.
export async function indexOpenApi(source: Source, fetcher: Fetcher, log: (msg: string) => void): Promise<CrawlResult> {
  const result: CrawlResult = { pages: 0, records: [], errors: [], skipped: [] }
  if (!source.apiPage) throw new Error(`source ${source.id}: openapi source needs apiPage`)
  const labels = labelsFor(source, source.apiPage)
  const specs = source.apiManifest ? await specsFromManifest(source.apiManifest, fetcher) : await specsFromSwaggerPage(source.apiPage, fetcher)
  if (!specs.length) throw new Error(`${source.apiManifest ?? source.apiPage}: no OpenAPI specs found`)

  for (const spec of specs) {
    let doc
    try {
      const response = await fetcher.get(spec.url)
      if (response.status !== 200) throw new Error(`HTTP ${response.status}`)
      doc = parse(response.body) as { paths?: Record<string, Record<string, Operation>> }
    } catch (e) {
      result.errors.push({ url: spec.url, reason: (e as Error).message })
      continue
    }
    result.pages++
    const operations = Object.entries(doc.paths ?? {}).flatMap(([path, item]) =>
      METHODS.filter(method => item[method]).map(method => ({ path, method: method.toUpperCase(), op: item[method] })))
    const tag = scalarTagNames(spec, operations.map(o => o.op))

    for (const { path, method, op } of operations) {
      const deprecated = spec.name.includes("DEPRECATED") || op.deprecated === true
      result.records.push({
        id: hash(`${source.id}|${labels.version}|${method} ${path}`),
        url: source.apiManifest ? `${source.apiPage}#tag/${slug(tag(op))}/${method}${path}` : source.apiPage,
        title: op.summary?.trim() || `${method} ${path}`,
        pageTitle: `${spec.name} API`,
        hierarchy: [source.name, spec.name],
        content: [op.description, ...(op.parameters ?? []).map(p => [p.name, p.description].filter(Boolean).join(": "))]
          .filter(Boolean).join("\n").slice(0, 20_000),
        terms: [...words(op.operationId ?? ""), spec.name, ...(op.tags ?? [])].join(" "),
        method,
        path,
        apiName: spec.name,
        // The same operation in other versions of the API is one result.
        group: hash(`${source.id}|${method} ${path}`),
        source: source.id,
        sourceName: source.name,
        ...labels,
        status: deprecated ? "archief" : labels.status,
        language: "en",
      })
    }
    log(`  ${spec.url} (${spec.name})`)
  }
  return result
}

async function specsFromSwaggerPage(apiPage: string, fetcher: Fetcher): Promise<Spec[]> {
  const page = await fetcher.get(apiPage)
  if (page.status !== 200) throw new Error(`${apiPage}: HTTP ${page.status}`)
  return [...page.body.matchAll(/\{\s*url:\s*"([^"]+)",\s*name:\s*"([^"]+)"\s*\}/g)]
    .map(m => ({ url: new URL(m[1], page.url).toString(), name: m[2] }))
}

// nuts-node-api.js lists the APIs as {file: "auth/v2.yaml", name: "Auth (v2)", ...}; the files are relative to the
// parent directory of the script.
async function specsFromManifest(manifest: string, fetcher: Fetcher): Promise<Spec[]> {
  const script = await fetcher.get(manifest)
  if (script.status !== 200) throw new Error(`${manifest}: HTTP ${script.status}`)
  return [...script.body.matchAll(/\{\s*file:\s*"([^"]+)",\s*name:\s*"([^"]+)"/g)]
    .map(m => ({ url: new URL(`../${m[1]}`, script.url).toString(), name: m[2] }))
}

// The tag names nuts-node-api.js gives the operations of one API in the combined document: the API name when the API
// has one tag, otherwise "<API name>: <tag>". Scalar links an operation under its first tag.
function scalarTagNames(spec: Spec, operations: Operation[]): (op: Operation) => string {
  const names = new Set(operations.flatMap(op => op.tags ?? []))
  return op => {
    const first = op.tags?.[0]
    if (!first) throw new Error(`${spec.url}: operation ${op.operationId} has no tags`)
    return names.size === 1 ? spec.name : `${spec.name}: ${first}`
  }
}

// Scalar's anchor for a tag: lower case, every run of other characters than letters and digits becomes one dash.
export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

// Splits identifiers into words: "requestServiceAccessToken" becomes request, service, access, token.
export function words(identifier: string): string[] {
  return identifier
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map(w => w.toLowerCase())
}
