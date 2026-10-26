import { createHash } from "node:crypto"

import * as cheerio from "cheerio"

import { Settings, Source } from "./config.ts"
import { extractPage } from "./extract.ts"
import { Fetcher } from "./fetcher.ts"
import { labelsFor, languageFor } from "./labels.ts"

export interface SearchRecord {
  id: string
  url: string
  title: string
  pageTitle: string
  hierarchy: string[]
  content: string
  source: string
  sourceName: string
  type?: string
  audience?: string[]
  language?: string
  version?: string
  status?: string
}

export interface Skipped {
  url: string
  reason: string
}

export interface CrawlResult {
  pages: number
  records: SearchRecord[]
  errors: Skipped[]
  skipped: Skipped[]
}

const NON_HTML = /\.(png|jpe?g|gif|svg|webp|ico|pdf|zip|tgz|gz|json|ya?ml|xml|txt|csv|ttl|mp3|mp4|woff2?|css|js|pem)$/i

export async function crawl(source: Source, settings: Settings, fetcher: Fetcher, log: (msg: string) => void): Promise<CrawlResult> {
  const result: CrawlResult = { pages: 0, records: [], errors: [], skipped: [] }
  const maxPages = source.maxPages ?? settings.maxPages
  const exclude = (source.exclude ?? []).map(p => new RegExp(p))
  const index = source.index?.map(p => new RegExp(p))
  const prefix = source.urlPrefix!
  const allowed = (url: string) => url.startsWith(prefix) && !NON_HTML.test(new URL(url).pathname) && !exclude.some(r => r.test(url))

  const queue: string[] = []
  const seen = new Set<string>()
  const enqueue = (url: string) => {
    const normalized = normalize(url)
    if (seen.has(normalized) || !allowed(normalized)) return
    seen.add(normalized)
    queue.push(normalized)
  }

  if (source.discovery === "sitemap") {
    for (const start of source.startUrls!) {
      for (const url of await readSitemap(start, fetcher)) enqueue(url)
    }
  } else {
    source.startUrls!.forEach(enqueue)
  }

  const indexed = new Set<string>()
  while (queue.length) {
    const url = queue.shift()!
    if (result.pages >= maxPages) {
      result.skipped.push({ url, reason: `maxPages (${maxPages}) reached` })
      continue
    }
    let response
    try {
      response = await fetcher.get(url)
    } catch (e) {
      result.errors.push({ url, reason: (e as Error).message })
      continue
    }
    if (response.status !== 200) {
      result.errors.push({ url, reason: `HTTP ${response.status}` })
      continue
    }
    if (!response.contentType.includes("html")) {
      result.skipped.push({ url, reason: `not HTML (${response.contentType})` })
      continue
    }
    // Redirects may land outside the prefix (e.g. a versioned docs link that resolves to another version).
    const finalUrl = normalize(response.url)
    if (finalUrl !== url && (!allowed(finalUrl) || indexed.has(finalUrl))) {
      result.skipped.push({ url, reason: `redirects to ${finalUrl}` })
      continue
    }

    const page = extractPage(response.body, finalUrl, source.selectors!)
    if (source.discovery !== "sitemap") page.links.forEach(enqueue)

    if (index && !index.some(r => r.test(finalUrl))) continue
    if (!page.hasContent) {
      result.skipped.push({ url, reason: `content selector "${source.selectors!.content}" not found` })
      continue
    }
    indexed.add(finalUrl)
    result.pages++

    const labels = labelsFor(source, finalUrl)
    const language = languageFor(source, finalUrl, page.lang, page.sections.map(s => s.content).join(" "))
    for (const section of page.sections) {
      // Sections without text only add noise; keep one record per page so its title stays findable.
      if (!section.content && page.sections.length > 1) continue
      const recordUrl = section.anchor ? `${finalUrl}#${section.anchor}` : finalUrl
      result.records.push({
        id: hash(`${source.id}|${recordUrl}`),
        url: recordUrl,
        title: section.hierarchy[section.hierarchy.length - 1],
        pageTitle: page.title,
        hierarchy: section.hierarchy,
        content: section.content,
        source: source.id,
        sourceName: source.name,
        ...labels,
        language,
      })
    }
    log(`  ${finalUrl} (${page.sections.length} sections)`)
  }
  return result
}

async function readSitemap(url: string, fetcher: Fetcher): Promise<string[]> {
  const response = await fetcher.get(url)
  if (response.status !== 200) throw new Error(`sitemap ${url}: HTTP ${response.status}`)
  const $ = cheerio.load(response.body, { xml: true })
  const nested = $("sitemapindex > sitemap > loc").map((_, el) => $(el).text().trim()).get()
  const urls = $("urlset > url > loc").map((_, el) => $(el).text().trim()).get()
  for (const child of nested) urls.push(...await readSitemap(child, fetcher))
  return urls
}

function normalize(url: string): string {
  const u = new URL(url)
  u.hash = ""
  u.search = ""
  return u.toString()
}

export function hash(value: string): string {
  return createHash("sha1").update(value).digest("hex")
}
