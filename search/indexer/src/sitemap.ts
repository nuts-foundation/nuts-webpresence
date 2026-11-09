import { SaxesParser } from "saxes"

export interface Sitemap {
  // Pages, from a urlset.
  urls: string[]
  // Other sitemaps, from a sitemap index.
  sitemaps: string[]
}

// The elements that list a page or a sitemap; each has exactly one loc (sitemaps.org protocol).
const ENTRIES = new Set(["urlset/url", "sitemapindex/sitemap"])

// Reads a sitemap or sitemap index. Throws unless it's well-formed XML with a urlset or sitemapindex root and a loc in
// every entry, so an error page served with HTTP 200, or a sitemap cut off halfway, can't leave pages out unnoticed.
export function parseSitemap(xml: string): Sitemap {
  const sitemap: Sitemap = { urls: [], sitemaps: [] }
  const open: string[] = []
  let root: { name: string, local: string } | undefined
  let text = ""
  let locs = 0
  let problem: string | undefined
  const parser = new SaxesParser({ xmlns: true })
  parser.on("opentag", node => {
    root ??= node
    open.push(node.local)
    if (ENTRIES.has(open.join("/"))) locs = 0
    text = ""
  })
  parser.on("text", data => text += data)
  parser.on("cdata", data => text += data)
  parser.on("closetag", () => {
    const path = open.join("/")
    if (path === "urlset/url/loc" || path === "sitemapindex/sitemap/loc") {
      locs++
      if (!text.trim()) problem ??= "a loc without a URL"
      else if (path === "urlset/url/loc") sitemap.urls.push(text.trim())
      else sitemap.sitemaps.push(text.trim())
    }
    if (ENTRIES.has(path) && locs !== 1) problem ??= `a ${open.at(-1)} with ${locs} locs`
    open.pop()
    text = ""
  })
  try {
    parser.write(xml).close()
  } catch (e) {
    throw new Error(`not well-formed XML: ${(e as Error).message}`)
  }
  if (root?.local !== "urlset" && root?.local !== "sitemapindex") throw new Error(`not a sitemap: the root is ${root?.name}`)
  if (problem) throw new Error(`not a valid sitemap: ${problem}`)
  return sitemap
}
