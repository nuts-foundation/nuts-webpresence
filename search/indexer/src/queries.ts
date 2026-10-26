// Prints the top results per query, to check search quality after indexing.
// Usage: npm run queries [-- "query" ...]   (default: the PoC test queries)

const DEFAULT_QUERIES = [
  "access token", "X509 credential", "toepassing", "use case", "Azure Key Vault",
  "CRL", "discovery service", "hoe werkt Nuts", "configuratie", "deployment",
]

const host = process.env.MEILI_HOST ?? "http://localhost:7700"
const key = process.env.MEILI_MASTER_KEY ?? ""
const index = process.env.MEILI_INDEX ?? "nuts-docs"
const queries = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_QUERIES

for (const q of queries) {
  const response = await fetch(`${host}/indexes/${index}/search`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ q, limit: 3, facets: ["language", "source"], attributesToRetrieve: ["url", "title", "source", "language", "version"] }),
  })
  const result = await response.json() as {
    estimatedTotalHits: number
    facetDistribution: Record<string, Record<string, number>>
    hits: { url: string, title: string, source: string, language: string, version?: string }[]
  }
  const languages = Object.entries(result.facetDistribution.language ?? {}).map(([l, n]) => `${l}: ${n}`).join(", ")
  console.log(`\n"${q}": ${result.estimatedTotalHits} hits (${languages})`)
  result.hits.forEach((hit, i) => {
    console.log(`  ${i + 1}. [${hit.source}${hit.version ? "@" + hit.version : ""}, ${hit.language}] ${hit.title}\n     ${hit.url}`)
  })
}
