// What a crawl may change in the index.
import type { CrawlResult } from "./crawl.ts"

// A record in the index, as far as removing it is concerned.
export interface IndexedRecord {
  id: string
  url: string
  // API operations only.
  method?: string
}

// What a complete crawl would remove from the index: the records it didn't find. Allowed when they're few, or by force.
export interface Removal {
  stale: IndexedRecord[]
  // Not found either, but kept: their page is in the repository, so it may only have failed to publish.
  waiting: IndexedRecord[]
  existing: number
  allowed: boolean
}

// Complete: the crawl found records, no page failed, and none was left out unindexed (maxPages, content not found, a
// redirect to a missing page, a response that isn't a page). Pages that are gone (HTTP 404 or 410) don't count against
// it: their earlier records may go.
export function isComplete(result: CrawlResult): boolean {
  return result.records.length > 0 && !result.errors.length && !result.skipped.some(s => s.incomplete)
}

// Indexed: complete, and no page is waiting to be published, so --if-changed may skip the source until its next commit.
export function isIndexed(result: CrawlResult): boolean {
  return isComplete(result) && !result.skipped.some(s => s.retry)
}

// Why the run should fail for this crawl: it found nothing, or many of its pages failed or were left out.
export function failure(result: CrawlResult): string | undefined {
  if (!result.records.length) return "nothing indexed"
  const problems = result.errors.length + result.skipped.filter(s => s.incomplete).length
  if (isMany(problems, result.pages + problems)) return `${problems} of ${result.pages + problems} pages failed or were left out`
  return undefined
}

// Compares the index as it was before this run's import with what the crawl found, so newly found pages don't make
// removing many old ones look like removing a few. Records of the pages in `unpublished` (in the repository, but not
// published) stay unless forced.
export function planRemoval(indexed: IndexedRecord[], found: { id: string }[], unpublished: string[], force: boolean): Removal {
  const current = new Set(found.map(r => r.id))
  const missing = indexed.filter(r => !current.has(r.id))
  const unpublishedPages = new Set(unpublished)
  const waiting = force ? [] : missing.filter(r => unpublishedPages.has(r.url.split("#")[0]))
  const stale = missing.filter(r => !waiting.includes(r))
  return { stale, waiting, existing: indexed.length, allowed: force || mayPrune(stale.length, indexed.length) }
}

// Removing many records at once more likely means a partial outage than that the pages are gone. A few records, or up
// to a quarter of a source's records, may go.
export function mayPrune(stale: number, existing: number): boolean {
  return !isMany(stale, existing)
}

// More than a few and more than a quarter: at once, that more likely means an outage or a changed site than pages that
// were removed or broke one by one.
function isMany(part: number, whole: number): boolean {
  return part > 5 && part > whole * 0.25
}

// The pages, or API operations, of records, for the log. An API operation's URL is the API page plus the operation's
// anchor; a page's other anchors are its sections.
export function locations(records: IndexedRecord[]): string[] {
  return [...new Set(records.map(r => r.method ? r.url : r.url.split("#")[0]))]
}

// What makes an OpenAPI operation incomplete, such as a spec cut off halfway through it. Responses need at least one
// response code, and each response is a reference (a string $ref) or has a description. OpenAPI 3.0 requires responses;
// 3.1 makes them optional.
export function operationProblem(op: unknown, version: string): string | undefined {
  if (!isObject(op)) return "not an operation"
  if (op.responses === undefined && version.startsWith("3.1")) return undefined
  if (!isObject(op.responses)) return "no responses"
  const responses = Object.entries(op.responses).filter(([code]) => !code.startsWith("x-"))
  if (!responses.length) return "no responses"
  for (const [code, response] of responses) {
    if (!isObject(response)) return `response ${code} is not a response`
    if ("$ref" in response && typeof response.$ref !== "string") return `response ${code} has a $ref that isn't a string`
    if (!("$ref" in response) && typeof response.description !== "string") return `response ${code} has no description`
  }
  return undefined
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

// The description of an OpenAPI response, also when it refers to the document's own components.
export function responseDescription(
  response: { description?: unknown, $ref?: unknown } | undefined,
  components: { responses?: Record<string, { description?: unknown } | undefined> } | undefined,
): string | undefined {
  if (typeof response?.description === "string") return response.description
  const prefix = "#/components/responses/"
  if (typeof response?.$ref !== "string" || !response.$ref.startsWith(prefix)) return undefined
  const description = components?.responses?.[response.$ref.slice(prefix.length)]?.description
  return typeof description === "string" ? description : undefined
}

// Why a source is incomplete, for the log: at most `max` lines of at most 300 characters, also when a reason spans
// several lines (such as a YAML error).
export function diagnostics(result: CrawlResult, max = 20): string[] {
  const entries = [...result.errors, ...result.skipped.filter(s => s.incomplete)]
  const lines = entries.slice(0, max).map(({ url, reason }) => `${url}: ${reason}`.replace(/\s+/g, " ").trim().slice(0, 300))
  if (entries.length > max) lines.push(`… and ${entries.length - max} more (out/report.json)`)
  return lines
}
