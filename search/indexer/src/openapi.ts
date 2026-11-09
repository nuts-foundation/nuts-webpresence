import { parse } from "yaml"

import type { Source } from "./config.ts"
import { type CrawlResult, hash } from "./crawl.ts"
import type { Fetcher } from "./fetcher.ts"
import { labelsFor } from "./labels.ts"
import { isObject, operationProblem, responseDescription } from "./rules.ts"

const METHODS = ["get", "put", "post", "delete", "patch", "head", "options", "trace"]

interface Operation {
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
  deprecated?: boolean
  parameters?: { name?: string, description?: string }[]
  responses?: Record<string, { description?: string, $ref?: string }>
}

interface Document {
  openapi?: string
  swagger?: string
  paths: Record<string, Record<string, Operation>>
  components?: { responses?: Record<string, { description?: string }> }
}

interface Spec {
  url: string
  name: string
}

// Indexes the OpenAPI specs of a Scalar API reference page, one record per operation, linking to the operation itself.
// The page renders the specs in the browser, so crawling it as HTML finds no operations: the specs are listed in
// nuts-node-api.js (apiManifest), which combines them in the browser.
export async function indexOpenApi(source: Source, fetcher: Fetcher, log: (msg: string) => void): Promise<CrawlResult> {
  const result: CrawlResult = { pages: 0, records: [], errors: [], skipped: [] }
  if (!source.apiPage || !source.apiManifest) throw new Error(`source ${source.id}: openapi source needs apiPage and apiManifest`)
  const labels = labelsFor(source, source.apiPage)
  const specs = await specsFromManifest(source.apiManifest, fetcher)

  for (const spec of specs) {
    let doc: Document
    let operations: { path: string, method: string, op: Operation }[]
    try {
      const response = await fetcher.get(spec.url)
      if (response.status !== 200) throw new Error(`HTTP ${response.status}`)
      doc = parse(response.body)
      // A broken spec is an error, so the operations it lacks aren't removed: an error page served with HTTP 200 (parses
      // as a string), a spec cut off halfway through an operation, or one without operations.
      if (!isObject(doc?.paths)) throw new Error("not an OpenAPI document: no paths")
      const version = String(doc.openapi ?? doc.swagger ?? "")
      operations = Object.entries(doc.paths).filter(([path]) => !path.startsWith("x-")).flatMap(([path, item]) => {
        if (!isObject(item)) throw new Error(`${path}: not a path item`)
        return METHODS.filter(method => method in item).map(method => {
          const problem = operationProblem(item[method], version)
          if (problem) throw new Error(`${method.toUpperCase()} ${path}: ${problem}`)
          return { path, method: method.toUpperCase(), op: item[method] }
        })
      })
      if (!operations.length) throw new Error("no operations")
    } catch (e) {
      result.errors.push({ url: spec.url, reason: (e as Error).message })
      continue
    }
    result.pages++
    const tag = scalarTagNames(spec, operations.map(o => o.op))

    for (const { path, method, op } of operations) {
      const deprecated = spec.name.includes("DEPRECATED") || op.deprecated === true
      result.records.push({
        id: hash(`${source.id}|${labels.version}|${method} ${path}`),
        url: `${source.apiPage}#tag/${slug(tag(op))}/${method}${path}`,
        title: op.summary?.trim() || `${method} ${path}`,
        pageTitle: `${spec.name} API`,
        hierarchy: [source.name, spec.name],
        // Error responses carry their reason, such as "409: Credential has already been revoked".
        content: [
          op.description,
          ...(op.parameters ?? []).map(p => [p.name, p.description].filter(Boolean).join(": ")),
          ...Object.entries(op.responses ?? {}).filter(([code]) => /^[45]/.test(code))
            .map(([code, r]) => [code, responseDescription(r, doc.components)])
            .filter(([, description]) => description).map(([code, description]) => `${code}: ${description}`),
        ].filter(Boolean).join("\n").slice(0, 20_000),
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

// nuts-node-api.js lists the APIs in `const apis = [...];`, as {file: "auth/v2.yaml", name: "Auth (v2)", ...}; the files
// are relative to the parent directory of the script. Anything else in the list than such entries and comment lines,
// or a list cut off before its end, is an error: the operations of the APIs it misses would be removed.
async function specsFromManifest(manifest: string, fetcher: Fetcher): Promise<Spec[]> {
  const script = await fetcher.get(manifest)
  if (script.status !== 200) throw new Error(`${manifest}: HTTP ${script.status}`)
  const list = script.body.match(/\bconst apis = \[([\s\S]*?)\];/)?.[1]?.replace(/^\s*\/\/.*$/gm, "")
  const entry = /\{\s*file:\s*"([^"]+)",\s*name:\s*"([^"]+)"[^{}]*\}/g
  if (list === undefined || !list.match(entry) || list.replace(entry, "").replace(/[\s,]/g, "")) {
    throw new Error(`${manifest}: no complete list of APIs in "const apis = [...];"`)
  }
  return [...list.matchAll(entry)].map(m => ({ url: new URL(`../${m[1]}`, script.url).toString(), name: m[2] }))
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
