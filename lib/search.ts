// Client for the documentation search (Typesense), used by pages/zoeken.tsx and the search field in the menu. The
// browser queries Typesense directly with a key that can only search the documentation collection.

// The production search. The key is public by design: it can only search this collection, and it ends up in the
// browser anyway. To use another Typesense for development, set both in .env.local.
const host = process.env.NEXT_PUBLIC_TYPESENSE_URL || "https://search.nuts.nl"
const searchKey = process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || "227267f512711afa988319ce8e379024"
const collection = "nuts-docs"

// Highlight markers that cannot occur in indexed text, so results can be rendered without innerHTML.
export const HIGHLIGHT_START = "\u0001"
export const HIGHLIGHT_END = "\u0002"

export const TABS = [
  { id: "api", label: "API" },
  { id: "documentatie", label: "Documentatie" },
  { id: "specificatie", label: "Specificaties" },
  { id: "toepassing", label: "Toepassingen" },
  { id: "website", label: "Website" },
  { id: "wiki", label: "Wiki" },
]

export interface Filters {
  // One of TABS, or undefined for all.
  tab?: string
  language?: string
  hideOutdated: boolean
}

export interface Version {
  version: string
  url: string
}

export interface Hit {
  id: string
  url: string
  title: string
  hierarchy: string[]
  source: string
  sourceName: string
  category?: string
  audience?: string[]
  language?: string
  version?: string
  status?: string
  // 0 for the newest version of a source, and for sources without versions.
  versionAge: number
  versions?: Version[]
  method?: string
  path?: string
  apiName?: string
  // With highlight markers; content is a snippet around the match, empty when the match is elsewhere.
  highlighted: { title: string, content: string }
}

// One result: the same section or API operation in one or more versions, best text match first.
export type Group = Hit[]

export interface SearchResult {
  // In text-match order, best first.
  groups: Group[]
  total: number
  // Number of results per tab, ignoring the selected tab.
  tabCounts: Record<string, number>
}

interface TypesenseHit {
  document: Omit<Hit, "highlighted">
  highlight?: Record<string, { snippet?: string }>
}

// The version of a result that is shown: the chosen version when the result has it, otherwise the newest. The text
// comes from a version that matched the search; the link and version label also cover versions that didn't match,
// because `versions` lists all of them, newest first.
export function representative(group: Group, version: string): Hit {
  const hit = group.find(h => version && h.version === version)
    ?? group.reduce((newest, h) => h.versionAge < newest.versionAge ? h : newest)
  const target = hit.versions?.find(v => version && v.version === version) ?? hit.versions?.[0]
  return target ? { ...hit, version: target.version, url: target.url } : hit
}

function quote(value: string): string {
  return "`" + value.replaceAll("`", "") + "`"
}

function filterFor(filters: Filters, withTab: boolean): string {
  const parts: string[] = []
  if (withTab && filters.tab) parts.push(`tab:=${quote(filters.tab)}`)
  if (filters.language) parts.push(`language:=${quote(filters.language)}`)
  if (filters.hideOutdated) parts.push("status:!=archief")
  return parts.join(" && ")
}

// Fetches up to `limit` results in text-match order (the page re-orders them), plus the counts per tab. Among results
// that match equally well, `version` goes first, otherwise the newest version.
export async function search(q: string, filters: Filters, limit: number, signal?: AbortSignal, version = ""): Promise<SearchResult> {
  const base = {
    collection,
    q,
    query_by: "title,path,terms,hierarchy,content",
    query_by_weights: "8,6,6,3,1",
    // Without these, results that match equally well are in the order of the index.
    sort_by: `_text_match:desc,${version ? `_eval(version:=${quote(version)}):desc,` : ""}versionAge:asc`,
    // A section or operation in several versions is one result; all its versions are returned.
    group_by: "group",
    group_limit: 5,
  }
  const searches = [
    {
      ...base,
      filter_by: filterFor(filters, true),
      per_page: limit,
      exclude_fields: "content,terms",
      highlight_fields: "title,content",
      highlight_start_tag: HIGHLIGHT_START,
      highlight_end_tag: HIGHLIGHT_END,
      highlight_affix_num_tokens: 12,
      // Only the current highlight format; the old one doubles the response.
      enable_highlight_v1: false,
    },
    { ...base, filter_by: filterFor(filters, false), facet_by: "tab", per_page: 0 },
  ]
  const response = await fetch(`${host}/multi_search`, {
    method: "POST",
    headers: { "X-TYPESENSE-API-KEY": searchKey, "Content-Type": "application/json" },
    body: JSON.stringify({ searches }),
    signal,
  })
  if (!response.ok) throw new Error(`zoeken mislukt (HTTP ${response.status})`)
  const { results } = await response.json() as {
    results: {
      error?: string
      found: number
      grouped_hits?: { hits: TypesenseHit[] }[]
      facet_counts?: { field_name: string, counts: { value: string, count: number }[] }[]
    }[]
  }
  const failed = results.find(r => r.error)
  if (failed) throw new Error(`zoeken mislukt (${failed.error})`)
  const [main, counts] = results
  // Only links to https pages, so even a tampered index can't put a javascript: link on this site.
  const groups = (main.grouped_hits ?? []).map(group => group.hits.filter(({ document }) => isHttps(document.url)).map(({ document, highlight }) => ({
    ...document,
    versions: document.versions?.filter(v => isHttps(v.url)),
    highlighted: { title: highlight?.title?.snippet ?? document.title, content: highlight?.content?.snippet ?? "" },
  }))).filter(group => group.length)
  const tabCounts = Object.fromEntries(counts.facet_counts?.find(f => f.field_name === "tab")?.counts.map(c => [c.value, c.count]) ?? [])
  return { groups, total: main.found, tabCounts }
}

function isHttps(url: string): boolean {
  try {
    return new URL(url).protocol === "https:"
  } catch {
    return false
  }
}
