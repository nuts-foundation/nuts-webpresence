import { createHash } from "node:crypto"

import type { Settings, Source } from "./config.ts"
import { extractPage } from "./extract.ts"
import type { Fetcher } from "./fetcher.ts"
import { labelsFor, languageFor } from "./labels.ts"
import { parseSitemap, type Sitemap } from "./sitemap.ts"

export interface SearchRecord {
  id: string
  url: string
  title: string
  pageTitle: string
  hierarchy: string[]
  content: string
  source: string
  sourceName: string
  category?: string
  type?: string
  audience?: string[]
  language?: string
  version?: string
  status?: string
  // Set by linkVersions: records of the same section in other versions share the group.
  group?: string
  versionAge?: number
  versions?: { version: string, url: string }[]
  // API operations only (see openapi.ts).
  method?: string
  path?: string
  apiName?: string
  terms?: string
}

export interface Skipped {
  url: string
  reason: string
  // The page may exist but wasn't indexed: its earlier records must stay.
  incomplete?: boolean
  // In a repository but not published (yet, or it failed to): may be indexed on a later run, and its earlier records stay.
  retry?: boolean
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
      result.skipped.push({ url, reason: `maxPages (${maxPages}) reached`, incomplete: true })
      continue
    }
    let response
    try {
      response = await fetcher.get(url)
    } catch (e) {
      result.errors.push({ url, reason: (e as Error).message })
      continue
    }
    // A dead link: the page is gone, so its earlier records may go too. A redirect to a missing page more likely means a
    // broken redirect than a removed page.
    if (response.status === 404 || response.status === 410) {
      if (response.redirected) result.skipped.push({ url, reason: `redirects to ${response.url}, which returns HTTP ${response.status}`, incomplete: true })
      else result.skipped.push({ url, reason: `HTTP ${response.status}` })
      continue
    }
    if (response.status !== 200) {
      result.errors.push({ url, reason: `HTTP ${response.status}` })
      continue
    }
    // Within the source, anything but a page is unexpected: an error message as plain text, say, or a download that
    // belongs in exclude.
    if (!response.contentType.includes("html")) {
      result.skipped.push({ url, reason: `not HTML (${response.contentType})`, incomplete: true })
      continue
    }
    // Redirects may land outside the prefix (e.g. a versioned docs link that resolves to another version),
    // or on a page that is also linked directly (e.g. /page redirecting to /page/).
    const finalUrl = normalize(response.url)
    if (finalUrl !== url && !allowed(finalUrl)) {
      result.skipped.push({ url, reason: `redirects outside the source to ${finalUrl}` })
      continue
    }
    if (indexed.has(finalUrl)) {
      result.skipped.push({ url, reason: `duplicate of ${finalUrl}` })
      continue
    }
    seen.add(finalUrl)

    const page = extractPage(response.body, finalUrl, source.selectors!)
    if (source.discovery !== "sitemap") page.links.forEach(enqueue)

    if (index && !index.some(r => r.test(finalUrl))) continue
    // Also when the content has no text at all: more likely a page that failed to render than one that was emptied.
    if (!page.hasContent || page.empty) {
      const problem = page.hasContent ? "has no text" : "not found"
      result.skipped.push({ url, reason: `content selector "${source.selectors!.content}" ${problem}`, incomplete: true })
      continue
    }
    indexed.add(finalUrl)
    result.pages++

    const labels = labelsFor(source, finalUrl)
    const language = languageFor(source, finalUrl, page.lang, page.sections.map(s => s.content).join(" "))
    for (const [i, section] of page.sections.entries()) {
      // Sections without text only add noise; keep one record per page so its title stays findable, also when only
      // headings have text (an empty roadmap page).
      if (!section.content && (i > 0 || page.sections.some(s => s.content))) continue
      const recordUrl = section.anchor ? `${finalUrl}#${section.anchor}` : finalUrl
      result.records.push({
        // The section number keeps headings with the same text on one page (same text-fragment URL) apart.
        id: hash(`${source.id}|${finalUrl}|${i}`),
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
  let sitemap: Sitemap
  try {
    sitemap = parseSitemap(response.body)
  } catch (e) {
    throw new Error(`sitemap ${url}: ${(e as Error).message}`)
  }
  const urls = [...sitemap.urls]
  for (const child of sitemap.sitemaps) urls.push(...await readSitemap(child, fetcher))
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
