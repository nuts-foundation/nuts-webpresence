import { marked } from "marked"

import { Source } from "./config.ts"
import { CrawlResult, hash } from "./crawl.ts"
import { extractPage, KnownAnchors, readRenderedPage } from "./extract.ts"
import { Fetcher } from "./fetcher.ts"
import { labelsFor, languageFor } from "./labels.ts"

// Indexes markdown files from a GitHub repository, while results link to the site that publishes them
// (GitBook, GitHub Pages). The markdown has no navigation or other site noise and lists every page; the
// published page is still fetched for its heading anchors, so deep links match what the site renders.
export async function indexGitHub(source: Source, fetcher: Fetcher, log: (msg: string) => void): Promise<CrawlResult> {
  const result: CrawlResult = { pages: 0, records: [], errors: [], skipped: [] }
  const gh = source.github
  if (!gh) throw new Error(`source ${source.id}: github source needs github settings`)

  const tree = await fetcher.get(`https://api.github.com/repos/${gh.repo}/git/trees/${gh.branch}?recursive=1`)
  if (tree.status !== 200) throw new Error(`${gh.repo}@${gh.branch}: HTTP ${tree.status} listing files`)
  const include = new RegExp(gh.include)
  const exclude = (source.exclude ?? []).map(p => new RegExp(p))
  const files = (JSON.parse(tree.body) as { tree: { path: string, type: string }[] }).tree
    .filter(f => f.type === "blob" && include.test(f.path))
    .map(f => f.path)

  for (const path of files) {
    if (exclude.some(r => r.test(path))) {
      result.skipped.push({ url: path, reason: "excluded" })
      continue
    }
    const pageUrl = gh.url
      .replace("{path}", path.replace(/\.md$/, ""))
      .replace("{name}", path.split("/").pop()!.replace(/\.md$/, ""))

    let markdown, rendered
    try {
      const raw = await fetcher.get(`https://raw.githubusercontent.com/${gh.repo}/${gh.branch}/${path}`)
      if (raw.status !== 200) throw new Error(`HTTP ${raw.status} for the markdown`)
      markdown = raw.body
      const live = await fetcher.get(pageUrl)
      if (live.status === 404) {
        result.skipped.push({ url: pageUrl, reason: `in ${gh.repo}@${gh.branch} (${path}) but not published` })
        continue
      }
      if (live.status !== 200) throw new Error(`HTTP ${live.status} for the published page ${pageUrl}`)
      rendered = readRenderedPage(live.body)
    } catch (e) {
      result.errors.push({ url: pageUrl, reason: (e as Error).message })
      continue
    }

    // The published page's title names the page when the markdown has no h1 (e.g. IG pages).
    const title = gh.titleSeparator ? rendered.title.split(gh.titleSeparator)[0] : rendered.title
    const html = `<html><head><title>${escape(title)}</title></head><body>${await marked.parse(stripTemplating(markdown))}</body></html>`
    const page = extractPage(html, pageUrl, { content: "body" }, rendered.anchors as KnownAnchors)
    result.pages++

    const labels = labelsFor(source, pageUrl)
    const language = languageFor(source, pageUrl, rendered.lang, page.sections.map(s => s.content).join(" "))
    for (const [i, section] of page.sections.entries()) {
      if (!section.content && page.sections.length > 1) continue
      const recordUrl = section.anchor ? `${pageUrl}#${section.anchor}` : pageUrl
      result.records.push({
        id: hash(`${source.id}|${pageUrl}|${i}`),
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
    log(`  ${path} -> ${pageUrl} (${page.sections.length} sections)`)
  }
  return result
}

// Removes front matter and GitBook/Liquid template tags ({% hint %}, {{ site.data... }}), which are not content.
function stripTemplating(markdown: string): string {
  return markdown
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .replace(/\{%[\s\S]*?%\}/g, "")
    .replace(/\{\{[\s\S]*?\}\}/g, "")
}

function escape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;")
}
