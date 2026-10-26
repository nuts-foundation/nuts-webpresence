// Client for the documentation search (Meilisearch), used by pages/zoeken.tsx.

export const searchEnabled = process.env.NEXT_PUBLIC_SEARCH_ENABLED === "true"

const host = process.env.NEXT_PUBLIC_MEILI_HOST ?? "http://localhost:7700"
const searchKey = process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY ?? ""
const index = "nuts-docs"

// Highlight markers that cannot occur in indexed text, so results can be rendered without innerHTML.
export const HIGHLIGHT_START = "\u0001"
export const HIGHLIGHT_END = "\u0002"

export interface Facet {
  // Field in the index
  field: string
  // Parameter in the page URL
  param: string
  label: string
}

export const FACETS: Facet[] = [
  { field: "sourceName", param: "bron", label: "Bron" },
  { field: "type", param: "soort", label: "Soort" },
  { field: "language", param: "taal", label: "Taal" },
  { field: "version", param: "versie", label: "Versie" },
]

export interface Hit {
  id: string
  url: string
  title: string
  hierarchy: string[]
  sourceName: string
  category?: string
  type?: string
  language?: string
  version?: string
  status?: string
  // All versions of this section, when it occurs in more than one (newest first).
  versions?: { version: string, url: string }[]
  _formatted: { title: string, content: string, hierarchy: string[] }
}

export interface SearchResult {
  hits: Hit[]
  total: number
  facets: Record<string, Record<string, number>>
}

// Selected values per facet field; values within a facet are OR-ed, facets are AND-ed.
export type Selection = Record<string, string[]>

function filterFor(selection: Selection, except?: string): string[][] {
  return Object.entries(selection)
    .filter(([field, values]) => field !== except && values.length)
    .map(([field, values]) => values.map(v => `${field} = ${JSON.stringify(v)}`))
}

// Runs the search plus one extra query per active facet without its own filter, so the counts of a facet
// still show the other values you can add (instead of only the selected one).
export async function search(q: string, selection: Selection, limit: number, signal?: AbortSignal): Promise<SearchResult> {
  const fields = FACETS.map(f => f.field)
  const active = fields.filter(f => selection[f]?.length)
  const queries = [
    {
      indexUid: index,
      q,
      filter: filterFor(selection),
      facets: fields,
      limit,
      // One result per section; the same section in another version is listed in versions.
      distinct: "group",
      attributesToRetrieve: ["id", "url", "title", "hierarchy", "sourceName", "category", "type", "language", "version", "status", "versions"],
      attributesToHighlight: ["title", "hierarchy"],
      attributesToCrop: ["content"],
      cropLength: 40,
      highlightPreTag: HIGHLIGHT_START,
      highlightPostTag: HIGHLIGHT_END,
    },
    ...active.map(field => ({ indexUid: index, q, filter: filterFor(selection, field), facets: [field], limit: 0 })),
  ]
  const response = await fetch(`${host}/multi-search`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${searchKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ queries }),
    signal,
  })
  if (!response.ok) throw new Error(`zoeken mislukt (HTTP ${response.status})`)
  const { results } = await response.json() as {
    results: { hits: Hit[], estimatedTotalHits: number, facetDistribution?: Record<string, Record<string, number>> }[]
  }
  const facets = { ...results[0].facetDistribution }
  active.forEach((field, i) => facets[field] = results[i + 1].facetDistribution?.[field] ?? {})
  return { hits: results[0].hits, total: results[0].estimatedTotalHits, facets }
}
