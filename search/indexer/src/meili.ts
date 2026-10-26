import { SearchRecord } from "./crawl.ts"

export const FACETS = ["source", "sourceName", "category", "type", "audience", "language", "version", "status"]
const SEARCH_KEY_NAME = "nuts-search-frontend"

export class Meili {
  constructor(private host: string, private masterKey: string, private index: string) {}

  async configure(synonyms: Record<string, string[]>) {
    await this.call("POST", "/indexes", { uid: this.index, primaryKey: "id" }, [409])
    await this.call("PATCH", `/indexes/${this.index}/settings`, {
      searchableAttributes: ["title", "hierarchy", "content"],
      filterableAttributes: FACETS,
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
