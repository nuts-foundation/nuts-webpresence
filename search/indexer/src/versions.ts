import { hash, type SearchRecord } from "./crawl.ts"

// Links the records of a section that occurs in several versions of a source (e.g. the same Nuts node page in
// v6.2 and v5.4). They get the same group, so the search shows them as one result, and each record lists all
// versions with their URL. jobs must be in the order of the source's versions in sources.yaml, newest first.
// A record that already has a group keeps it (API operations are grouped by method and path).
export function linkVersions(jobs: { version?: string, records: SearchRecord[], complete: boolean }[]) {
  const groups = new Map<string, SearchRecord[]>()
  jobs.forEach((job, i) => {
    for (const record of job.records) {
      if (!job.version) {
        record.group ??= record.id
        continue
      }
      // 0 for the newest version: the search shows the newest version of a group, and puts it first among results
      // that match equally well.
      record.versionAge = i
      record.group ??= hash(`${record.source}|${record.url.split(`/${job.version}/`).join("/")}|${record.hierarchy.join(">")}`)
      groups.set(record.group, [...groups.get(record.group) ?? [], record])
    }
  })
  const newest = jobs[0]
  for (const records of groups.values()) {
    // An API operation is as current as its newest version, also where an older version matches a search: it is
    // outdated when the newest version deprecates it, or when the newest version no longer has it. The latter is only
    // certain when the newest version was indexed without errors. Pages are not marked: a renamed heading also starts
    // a new group.
    if (records[0].method && newest?.version) {
      const current = records.find(r => r.version === newest.version)
      if (current?.status === "archief" || (!current && newest.complete)) records.forEach(r => r.status = "archief")
    }
    if (records.length < 2) continue
    const versions = records.map(r => ({ version: r.version!, url: r.url }))
    records.forEach(r => r.versions = versions)
  }
}
