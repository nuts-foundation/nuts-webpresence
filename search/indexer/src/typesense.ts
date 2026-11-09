import { SearchRecord } from "./crawl.ts"
import { IndexedRecord } from "./rules.ts"

const SYNONYM_SET = "nuts-docs-synonyms"
const STATE_COLLECTION_SUFFIX = "-state"

// Fields not listed here (url, pageTitle, versions) are stored and returned, but not indexed.
const FIELDS = [
  { name: "title", type: "string" },
  { name: "hierarchy", type: "string[]" },
  { name: "content", type: "string" },
  // API operations only: operationId split into words, plus the API name and tags, so "request service access token"
  // finds POST .../request-service-access-token.
  { name: "terms", type: "string", optional: true },
  { name: "source", type: "string", facet: true },
  { name: "sourceName", type: "string", facet: true },
  { name: "tab", type: "string", facet: true },
  { name: "category", type: "string", facet: true, optional: true },
  { name: "type", type: "string", facet: true, optional: true },
  { name: "audience", type: "string[]", facet: true, optional: true },
  { name: "language", type: "string", facet: true, optional: true },
  { name: "version", type: "string", facet: true, optional: true },
  { name: "status", type: "string", facet: true, optional: true },
  { name: "group", type: "string", facet: true },
  { name: "versionAge", type: "int32" },
  { name: "method", type: "string", optional: true },
  { name: "path", type: "string", optional: true },
  { name: "apiName", type: "string", optional: true },
]

// The tab a record is listed under on the search page. API operations get their own tab, apart from the rest of the
// Nuts node documentation.
const TABS: Record<string, string> = {
  documentation: "documentatie",
  specification: "specificatie",
  toepassing: "toepassing",
  website: "website",
  wiki: "wiki",
}

export function tabFor(record: SearchRecord): string {
  if (record.method) return "api"
  const tab = TABS[record.category ?? ""]
  if (!tab) throw new Error(`record ${record.url}: no tab for category ${record.category}`)
  return tab
}

export class Typesense {
  private stateCollection: string

  constructor(private host: string, private apiKey: string, private collection: string) {
    this.stateCollection = collection + STATE_COLLECTION_SUFFIX
  }

  // Creates the collections when they don't exist and (re)links the synonyms. An existing collection keeps its
  // schema; drop it to apply schema changes.
  async configure(synonyms: string[][]) {
    await this.call("PUT", `/synonym_sets/${SYNONYM_SET}`, {
      items: synonyms.map((group, i) => ({ id: `group-${i}`, synonyms: group })),
    })
    await this.call("POST", "/collections", {
      name: this.collection,
      fields: FIELDS,
      // Paths and identifiers are words, so "/internal/discovery/v1" and "request-service-access-token" are found
      // word by word, in the API and in the documentation.
      token_separators: ["/", "-", "_", "{", "}"],
      synonym_sets: [SYNONYM_SET],
    }, [409])
    await this.call("PATCH", `/collections/${this.collection}`, { synonym_sets: [SYNONYM_SET] })
    await this.call("POST", "/collections", {
      name: this.stateCollection,
      fields: [{ name: "commit", type: "string", index: false, optional: true }],
    }, [409])
  }

  // The records of one source (and version) in the index.
  async records(source: string, version: string | undefined): Promise<IndexedRecord[]> {
    const filter = [`source:=${quote(source)}`]
    if (version) filter.push(`version:=${quote(version)}`)
    const response = await this.request("GET", `/collections/${this.collection}/documents/export?filter_by=${encodeURIComponent(filter.join(" && "))}&include_fields=id,url,method`, undefined, "application/json")
    return (await response.text()).split("\n").filter(Boolean).map(line => JSON.parse(line) as IndexedRecord)
  }

  // Adds records, or replaces those with the same id. Throws when any record fails, before anything is removed.
  async upsert(source: string, records: SearchRecord[]) {
    for (let i = 0; i < records.length; i += 1000) {
      const lines = records.slice(i, i + 1000).map(r => JSON.stringify({ ...r, tab: tabFor(r), versionAge: r.versionAge ?? 0, group: r.group ?? r.id }))
      const response = await this.request("POST", `/collections/${this.collection}/documents/import?action=upsert`, lines.join("\n"), "text/plain")
      const failed = (await response.text()).split("\n").map(line => JSON.parse(line)).filter(r => !r.success)
      if (failed.length) throw new Error(`Typesense import of ${source}: ${failed.length} failed, first: ${failed[0].error}`)
    }
  }

  async remove(records: IndexedRecord[]) {
    for (const { id } of records) await this.call("DELETE", `/collections/${this.collection}/documents/${encodeURIComponent(id)}`, undefined, [404])
  }

  async indexedCommit(job: string): Promise<string | undefined> {
    const doc = await this.call("GET", `/collections/${this.stateCollection}/documents/${encodeURIComponent(stateId(job))}`, undefined, [404]) as { commit?: string }
    return doc.commit
  }

  async setIndexedCommit(job: string, commit: string) {
    await this.call("POST", `/collections/${this.stateCollection}/documents?action=upsert`, { id: stateId(job), commit })
  }

  async forgetIndexedCommit(job: string) {
    await this.call("DELETE", `/collections/${this.stateCollection}/documents/${encodeURIComponent(stateId(job))}`, undefined, [404])
  }

  // Makes sure the search-only key for the frontend exists. Typesense only reveals a key's value when it is created,
  // so the value is chosen here (from the environment) instead of generated.
  async ensureSearchKey(value: string) {
    // Typesense also answers 409 when the value is its admin key, which would then end up in the browser.
    if (value === this.apiKey) throw new Error("TYPESENSE_SEARCH_KEY must differ from TYPESENSE_API_KEY: it ends up in the browser")
    await this.call("POST", "/keys", {
      description: "Search-only key for the nuts.nl search page",
      actions: ["documents:search"],
      collections: [this.collection],
      value,
    }, [409])
  }

  private async call(method: string, path: string, body?: unknown, okStatus: number[] = []): Promise<unknown> {
    const response = await this.request(method, path, body === undefined ? undefined : JSON.stringify(body), "application/json", okStatus)
    return response.json().catch(() => ({}))
  }

  private async request(method: string, path: string, body: string | undefined, contentType: string, okStatus: number[] = []): Promise<Response> {
    const response = await fetch(this.host + path, {
      method,
      headers: { "X-TYPESENSE-API-KEY": this.apiKey, "Content-Type": contentType },
      body,
    })
    if (!response.ok && !okStatus.includes(response.status)) {
      throw new Error(`Typesense ${method} ${path}: HTTP ${response.status} ${await response.text()}`)
    }
    return response
  }
}

// Filter values in backticks, so values with spaces or commas are taken literally.
function quote(value: string): string {
  if (value.includes("`")) throw new Error(`unsupported filter value: ${value}`)
  return "`" + value + "`"
}

// Document ids may only contain letters, digits, - and _.
function stateId(job: string): string {
  return job.replace(/[^A-Za-z0-9_-]/g, "_")
}
