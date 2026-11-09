import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { parseArgs } from "node:util"

import { expandVersions, loadSources, loadSynonyms } from "./config.ts"
import { crawl, CrawlResult } from "./crawl.ts"
import { Fetcher } from "./fetcher.ts"
import { indexGitHub, latestCommit } from "./github.ts"
import { indexOpenApi } from "./openapi.ts"
import { diagnostics, failure, isComplete, isIndexed, locations, planRemoval } from "./rules.ts"
import { Typesense } from "./typesense.ts"
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
    // Also remove the records of pages that are gone when that's many at once (see mayPrune), after a restructured site.
    "force-prune": { type: "boolean", default: false },
  },
})

const config = await loadSources(join(SEARCH_DIR, "sources.yaml"))
const synonyms = await loadSynonyms(join(SEARCH_DIR, "synonyms.yaml"))
const selected = config.sources.filter(s => !args.source || args.source.includes(s.id))
if (!selected.length) throw new Error(`no sources match ${args.source}`)

let typesense: Typesense | undefined
if (!args["dry-run"]) {
  const apiKey = process.env.TYPESENSE_API_KEY
  if (!apiKey) throw new Error("TYPESENSE_API_KEY is not set (use --dry-run to crawl without indexing)")
  typesense = new Typesense(process.env.TYPESENSE_HOST ?? "http://localhost:8108", apiKey, process.env.TYPESENSE_COLLECTION ?? "nuts-docs")
  await typesense.configure(synonyms)
}

const fetcher = new Fetcher(config.settings)
let jobs = selected.flatMap(expandVersions)
const jobName = (job: (typeof jobs)[number]) => job.labels.version ? `${job.id}@${job.labels.version}` : job.id

if (args["if-changed"]) {
  const changed = await Promise.all(jobs.filter(job => job.kind === "github").map(async job => {
    const [latest, indexed] = await Promise.all([latestCommit(job), typesense?.indexedCommit(jobName(job))])
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
  // Right away: report.json is gone with the nightly job's pod, and a later step may fail.
  for (const line of diagnostics(result)) console.error(`[${name}] ${line}`)
  return { name, job, result }
}))

// Only after a complete crawl are the records of pages that disappeared removed, so search results don't go missing
// because of a failed page. Planned against the index as it was, before linkVersions: a newest version whose missing
// records may not be removed mustn't mark older versions' operations as removed either.
const removals = await Promise.all(results.map(async ({ job, result }) => typesense && isComplete(result)
  ? planRemoval(await typesense.records(job.id, job.labels.version), result.records,
    result.skipped.filter(s => s.retry).map(s => s.url), args["force-prune"])
  : undefined))

for (const source of selected) {
  linkVersions(results.flatMap(({ job, result }, i) => job.id !== source.id ? [] : [{
    version: job.labels.version,
    records: result.records,
    complete: isComplete(result) && removals[i]?.allowed !== false,
  }]))
}

const failures = results.flatMap(({ name, result }) => {
  const reason = failure(result)
  return reason ? [`${name}: ${reason}`] : []
})
for (const [i, { name, job, result }] of results.entries()) {
  if (!typesense) continue
  const removal = removals[i]
  if (!removal && args["force-prune"]) console.error(`[${name}] --force-prune removed nothing: the crawl was incomplete`)
  // Too much went missing to trust this crawl, so it changes nothing: the next run compares with the same records, and
  // keeps refusing until the pages are back or --force-prune.
  if (removal && !removal.allowed) {
    console.error(`[${name}] ${removal.stale.length} of ${removal.existing} records weren't found: too many to remove without --force-prune, so the source is left as it was. Such as:`)
    for (const url of locations(removal.stale).slice(0, 5)) console.error(`[${name}]   ${url}`)
    failures.push(`${name}: left as it was, as ${removal.stale.length} of its ${removal.existing} records weren't found`)
    continue
  }
  // A crawl that found nothing must not wipe the records of an earlier, successful run.
  if (!result.records.length) continue
  // --if-changed skips a source only while the index holds all of its saved commit. So the commit is forgotten before the
  // index changes, in case the run fails halfway, and saved again once all of it is indexed.
  if (result.commit) await typesense.forgetIndexedCommit(name)
  await typesense.upsert(job.id, result.records)
  if (removal) await typesense.remove(removal.stale)
  if (removal?.waiting.length) {
    console.error(`[${name}] kept ${removal.waiting.length} records of pages that aren't published (--force-prune removes them):`)
    for (const url of locations(removal.waiting).slice(0, 5)) console.error(`[${name}]   ${url}`)
  }
  if (result.commit && isIndexed(result)) await typesense.setIndexedCommit(name, result.commit)
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

const searchKey = process.env.TYPESENSE_SEARCH_KEY
if (typesense && searchKey) {
  await typesense.ensureSearchKey(searchKey)
  console.log("\nSearch-only key TYPESENSE_SEARCH_KEY is ready for the frontend (NEXT_PUBLIC_TYPESENSE_SEARCH_KEY).")
}

// Single pages that fail don't fail the run, but a source that yielded nothing (unreachable, or its content selector
// no longer matches) or of which many pages failed does, and so does keeping records that may be stale, so the nightly
// job reports them. The earlier records stay in the index.
if (failures.length) {
  console.error(`\nFailed:\n${failures.map(f => `- ${f}`).join("\n")}`)
  process.exitCode = 1
}
