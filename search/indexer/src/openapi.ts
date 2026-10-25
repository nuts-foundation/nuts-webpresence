import { parse } from "yaml"

import { Source } from "./config.ts"
import { CrawlResult, hash } from "./crawl.ts"
import { Fetcher } from "./fetcher.ts"
import { labelsFor } from "./labels.ts"

const METHODS = ["get", "put", "post", "delete", "patch", "head", "options"]

interface Operation {
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
  deprecated?: boolean
  parameters?: { name?: string, description?: string }[]
}

// Indexes the OpenAPI specs listed on an API reference page (Swagger UI config with {url: "...", name: "..."} entries).
// The page renders the specs in the browser, so crawling it as HTML finds no operations. One record per operation.
export async function indexOpenApi(source: Source, fetcher: Fetcher, log: (msg: string) => void): Promise<CrawlResult> {
  const result: CrawlResult = { pages: 0, records: [], errors: [], skipped: [] }
  if (!source.apiPage) throw new Error(`source ${source.id}: openapi source needs apiPage`)
  const page = await fetcher.get(source.apiPage)
  if (page.status !== 200) throw new Error(`${source.apiPage}: HTTP ${page.status}`)

  const specs = [...page.body.matchAll(/\{\s*url:\s*"([^"]+)",\s*name:\s*"([^"]+)"\s*\}/g)]
    .map(m => ({ url: new URL(m[1], page.url).toString(), name: m[2] }))
  const labels = labelsFor(source, source.apiPage)

  for (const spec of specs) {
    let doc
    try {
      const response = await fetcher.get(spec.url)
      if (response.status !== 200) throw new Error(`HTTP ${response.status}`)
      doc = parse(response.body) as { info?: { description?: string }, paths?: Record<string, Record<string, Operation>> }
    } catch (e) {
      result.errors.push({ url: spec.url, reason: (e as Error).message })
      continue
    }
    result.pages++
    const status = spec.name.includes("DEPRECATED") ? "archief" : labels.status
    for (const [path, item] of Object.entries(doc.paths ?? {})) {
      for (const method of METHODS) {
        const op = item[method]
        if (!op) continue
        const title = `${method.toUpperCase()} ${path}`
        const params = (op.parameters ?? []).map(p => [p.name, p.description].filter(Boolean).join(": "))
        result.records.push({
          id: hash(`${source.id}|${labels.version}|${spec.url}|${title}`),
          // Swagger UI on this page has no deep links, so results link to the API page itself.
          url: page.url,
          title: op.summary ? `${op.summary} (${title})` : title,
          pageTitle: spec.name,
          hierarchy: [spec.name, ...(op.tags?.slice(0, 1) ?? []), title],
          content: [op.description, op.operationId, ...params].filter(Boolean).join("\n").slice(0, 20_000),
          source: source.id,
          sourceName: source.name,
          ...labels,
          status,
          language: "en",
        })
      }
    }
    log(`  ${spec.url} (${spec.name})`)
  }
  return result
}
