import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { parseArgs } from "node:util"

import { expandVersions, loadSources, loadSynonyms } from "./config.ts"
import { crawl, CrawlResult } from "./crawl.ts"
import { Fetcher } from "./fetcher.ts"
import { Meili } from "./meili.ts"
import { indexGitHub, latestCommit } from "./github.ts"
import { indexOpenApi } from "./openapi.ts"
import { linkVersions } from "./versions.ts"

const SEARCH_DIR = join(import.meta.dirname, "..", "..")
const OUT_DIR = join(import.meta.dirname, "..", "out")

const { values: args } = parseArgs({
  options: {
    source: { type: "string", multiple: true },
    "dry-run": { type: "boolean", default: false },
    verbose: { type: "boolean", default: false },
    // Index only GitHub sources whose latest commit differs from the last indexed one; other sources are skipped.
    "if-changed": { type: "boolean", default: false },
  },
})

const config = await loadSources(join(SEARCH_DIR, "sources.yaml"))
const synonyms = await loadSynonyms(join(SEARCH_DIR, "synonyms.yaml"))
const selected = config.sources.filter(s => !args.source || args.source.includes(s.id))
if (!selected.length) throw new Error(`no sources match ${args.source}`)

let meili: Meili | undefined
if (!args["dry-run"]) {
  const masterKey = process.env.MEILI_MASTER_KEY
  if (!masterKey) throw new Error("MEILI_MASTER_KEY is not set (use --dry-run to crawl without indexing)")
  meili = new Meili(process.env.MEILI_HOST ?? "http://localhost:7700", masterKey, process.env.MEILI_INDEX ?? "nuts-docs")
  await meili.configure(synonyms)
}

const fetcher = new Fetcher(config.settings)
let jobs = selected.flatMap(expandVersions)
const jobName = (job: (typeof jobs)[number]) => job.labels.version ? `${job.id}@${job.labels.version}` : job.id

if (args["if-changed"]) {
  const changed = await Promise.all(jobs.filter(job => job.kind === "github").map(async job => {
    const [latest, indexed] = await Promise.all([latestCommit(job), meili?.indexedCommit(jobName(job))])
    if (latest !== indexed) return job
    console.log(`[${jobName(job)}] unchanged (${latest.slice(0, 7)}), skipped`)
  }))
  jobs = changed.filter(job => job !== undefined)
}

// All jobs run at once; the fetcher spaces out requests per host, so sources on different hosts crawl in parallel.
const results = await Promise.all(jobs.map(async job => {
  const name = jobName(job)
  const log = (msg: string) => args.verbose && console.log(`[${name}]${msg}`)
  console.log(`[${name}] start`)
  let result: CrawlResult & { commit?: string }
  try {
    result = job.kind === "openapi" ? await indexOpenApi(job, fetcher, log)
      : job.kind === "github" ? await indexGitHub(job, fetcher, join(OUT_DIR, "repos"), log)
      : await crawl(job, config.settings, fetcher, log)
  } catch (e) {
    result = { pages: 0, records: [], errors: [{ url: job.startUrls?.[0] ?? job.apiPage ?? job.github?.repo ?? "", reason: (e as Error).message }], skipped: [] }
  }
  console.log(`[${name}] done: ${result.pages} pages, ${result.records.length} records, ${result.errors.length} errors, ${result.skipped.length} skipped`)
  return { name, job, result }
}))

for (const source of selected) {
  linkVersions(results.filter(r => r.job.id === source.id).map(r => ({ version: r.job.labels.version, records: r.result.records })))
}

for (const { name, job, result } of results) {
  // A crawl that found nothing must not wipe the records of an earlier, successful run.
  if (meili && result.records.length) await meili.replace(job.id, job.labels.version, result.records)
  // Only a run without errors counts as indexed, so --if-changed retries a source that partly failed.
  if (meili && result.commit && result.records.length && !result.errors.length) await meili.setIndexedCommit(name, result.commit)
}

await mkdir(OUT_DIR, { recursive: true })
await writeFile(join(OUT_DIR, "records.json"), JSON.stringify(results.flatMap(r => r.result.records), null, 2))
await writeFile(join(OUT_DIR, "report.json"), JSON.stringify(results.map(({ name, result }) => ({
  name, pages: result.pages, records: result.records.length, errors: result.errors, skipped: result.skipped,
})), null, 2))

console.log("\nSource                     Pages  Records  Errors  Skipped")
for (const { name, result } of results) {
  console.log(`${name.padEnd(26)} ${String(result.pages).padStart(5)} ${String(result.records.length).padStart(8)} ${String(result.errors.length).padStart(7)} ${String(result.skipped.length).padStart(8)}`)
}
console.log(`\nDetails (errors and skipped pages with reasons): ${join(OUT_DIR, "report.json")}`)

if (meili) {
  console.log(`\nSearch-only key for the frontend (NEXT_PUBLIC_MEILI_SEARCH_KEY): ${await meili.searchKey()}`)
}
