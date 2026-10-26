import { hash, SearchRecord } from "./crawl.ts"

// Links the records of a section that occurs in several versions of a source (e.g. the same Nuts node page in
// v6.2 and v5.4). They get the same group, so the search shows them as one result, and each record lists all
// versions with their URL. jobs must be in the order of the source's versions in sources.yaml, newest first.
export function linkVersions(jobs: { version?: string, records: SearchRecord[] }[]) {
  const groups = new Map<string, SearchRecord[]>()
  jobs.forEach((job, i) => {
    for (const record of job.records) {
      if (!job.version) {
        record.group = record.id
        continue
      }
      // Newer versions rank higher, so the search shows the newest version of a group by default.
      record.versionOrder = jobs.length - i
      record.group = hash(`${record.source}|${record.url.split(`/${job.version}/`).join("/")}|${record.hierarchy.join(">")}`)
      groups.set(record.group, [...groups.get(record.group) ?? [], record])
    }
  })
  for (const records of groups.values()) {
    if (records.length < 2) continue
    const versions = records.map(r => ({ version: r.version!, url: r.url }))
    records.forEach(r => r.versions = versions)
  }
}
