import { SearchRecord } from "./crawl.ts"

export const FACETS = ["source", "sourceName", "category", "type", "audience", "language", "version", "status"]
const SEARCH_KEY_NAME = "nuts-search-frontend"

export class Meili {
  // Holds the last indexed commit per GitHub source. Separate from the search index, so the search-only key
  // cannot read it.
  private stateIndex: string

  constructor(private host: string, private masterKey: string, private index: string) {
    this.stateIndex = `${index}-state`
  }

  async configure(synonyms: Record<string, string[]>) {
    await this.call("POST", "/indexes", { uid: this.index, primaryKey: "id" }, [409])
    await this.call("POST", "/indexes", { uid: this.stateIndex, primaryKey: "id" }, [409])
    await this.call("PATCH", `/indexes/${this.index}/settings`, {
      searchableAttributes: ["title", "hierarchy", "content"],
      filterableAttributes: [...FACETS, "group"],
      // Default rules, plus: of otherwise equal results (the same section in several versions), the newest first.
      rankingRules: ["words", "typo", "proximity", "attributeRank", "sort", "wordPosition", "exactness", "versionOrder:desc"],
      synonyms,
      // Restricts language detection to Dutch and English; the default would also consider unrelated languages.
      localizedAttributes: [{ attributePatterns: ["title", "hierarchy", "content"], locales: ["nld", "eng"] }],
      faceting: { maxValuesPerFacet: 100 },
    })
  }

  // Replaces all records of one source (and version), so pages that disappeared are removed too.
  async replace(source: string, version: string | undefined, records: SearchRecord[]) {
    const filter = [`source = ${JSON.stringify(source)}`]
    if (version) filter.push(`version = ${JSON.stringify(version)}`)
    await this.call("POST", `/indexes/${this.index}/documents/delete`, { filter: filter.join(" AND ") })
    for (let i = 0; i < records.length; i += 1000) {
      await this.call("POST", `/indexes/${this.index}/documents`, records.slice(i, i + 1000))
    }
  }

  async indexedCommit(job: string): Promise<string | undefined> {
    const doc = await this.call("GET", `/indexes/${this.stateIndex}/documents/${stateId(job)}`, undefined, [404]) as { commit?: string }
    return doc.commit
  }

  async setIndexedCommit(job: string, commit: string) {
    await this.call("POST", `/indexes/${this.stateIndex}/documents`, [{ id: stateId(job), commit }])
  }

  // Returns the search-only key for the frontend, creating it on first run.
  async searchKey(): Promise<string> {
    const keys = await this.call("GET", "/keys?limit=100") as { results: { name: string, key: string }[] }
    const existing = keys.results.find(k => k.name === SEARCH_KEY_NAME)
    if (existing) return existing.key
    const created = await this.call("POST", "/keys", {
      name: SEARCH_KEY_NAME,
      description: "Search-only key for the nuts.nl search page",
      actions: ["search"],
      indexes: [this.index],
      expiresAt: null,
    }) as { key: string }
    return created.key
  }

  private async call(method: string, path: string, body?: unknown, okStatus: number[] = []): Promise<unknown> {
    const response = await fetch(this.host + path, {
      method,
      headers: { "Authorization": `Bearer ${this.masterKey}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const json = await response.json().catch(() => ({})) as { taskUid?: number, message?: string }
    if (!response.ok && !okStatus.includes(response.status)) {
      throw new Error(`Meilisearch ${method} ${path}: HTTP ${response.status} ${json.message ?? ""}`)
    }
    if (response.status === 202 && json.taskUid !== undefined) await this.waitForTask(json.taskUid)
    return json
  }

  private async waitForTask(uid: number) {
    for (;;) {
      const response = await fetch(`${this.host}/tasks/${uid}`, { headers: { "Authorization": `Bearer ${this.masterKey}` } })
      const task = await response.json() as { status: string, error?: { message: string } }
      if (task.status === "succeeded") return
      // Creating an index that already exists is fine.
      if (task.status === "failed" && task.error?.message.includes("already exists")) return
      if (task.status === "failed" || task.status === "canceled") throw new Error(`Meilisearch task ${uid} ${task.status}: ${task.error?.message}`)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
}

// Document ids may only contain letters, digits, - and _.
function stateId(job: string): string {
  return job.replace(/[^A-Za-z0-9_-]/g, "_")
}
