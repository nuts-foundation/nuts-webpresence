// Prints the top results per query by text match only (before the search page's ranking), to check search quality
// after indexing. Usage: npm run queries [-- "query" ...]   (default: a set of test queries)

const DEFAULT_QUERIES = [
  "access token", "X509 credential", "toepassing", "use case", "Azure Key Vault",
  "CRL", "discovery service", "hoe werkt Nuts", "configuratie", "deployment",
]

const host = process.env.TYPESENSE_HOST ?? "http://localhost:8108"
const key = process.env.TYPESENSE_API_KEY ?? ""
const collection = process.env.TYPESENSE_COLLECTION ?? "nuts-docs"
const queries = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_QUERIES

for (const q of queries) {
  const params = new URLSearchParams({
    q, query_by: "title,path,terms,hierarchy,content", query_by_weights: "8,6,6,3,1", group_by: "group", group_limit: "1",
    per_page: "3", facet_by: "language,tab", include_fields: "url,title,source,language,version",
  })
  const response = await fetch(`${host}/collections/${collection}/documents/search?${params}`, { headers: { "X-TYPESENSE-API-KEY": key } })
  const result = await response.json() as {
    found: number
    facet_counts: { field_name: string, counts: { value: string, count: number }[] }[]
    grouped_hits: { hits: { document: { url: string, title: string, source: string, language: string, version?: string } }[] }[]
  }
  const facets = result.facet_counts.map(f => `${f.field_name}: ${f.counts.map(c => `${c.value} ${c.count}`).join(", ")}`).join("; ")
  console.log(`\n"${q}": ${result.found} results (${facets})`)
  result.grouped_hits.forEach(({ hits: [hit] }, i) => {
    const d = hit.document
    console.log(`  ${i + 1}. [${d.source}${d.version ? "@" + d.version : ""}, ${d.language}] ${d.title}\n     ${d.url}`)
  })
}
