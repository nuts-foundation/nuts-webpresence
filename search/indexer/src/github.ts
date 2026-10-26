import { execFile } from "node:child_process"
import { readdir, readFile, rm } from "node:fs/promises"
import { join, sep } from "node:path"
import { promisify } from "node:util"

import { marked } from "marked"

import { Source } from "./config.ts"
import { CrawlResult, hash } from "./crawl.ts"
import { extractPage, KnownAnchors, readRenderedPage } from "./extract.ts"
import { Fetcher } from "./fetcher.ts"
import { labelsFor, languageFor } from "./labels.ts"

const git = promisify(execFile)

// Returns the latest commit of the configured branch. Uses git instead of the GitHub API, which allows only
// 60 unauthenticated requests per hour.
export async function latestCommit(source: Source): Promise<string> {
  const gh = source.github!
  const { stdout } = await git("git", ["ls-remote", `https://github.com/${gh.repo}.git`, `refs/heads/${gh.branch}`])
  const commit = stdout.split("\t")[0]
  if (!commit) throw new Error(`${gh.repo}: branch ${gh.branch} not found`)
  return commit
}

// Indexes markdown files from a GitHub repository, while results link to the site that publishes them
// (GitBook, GitHub Pages). The markdown has no navigation or other site noise and lists every page; the
// published page is still fetched for its heading anchors, so deep links match what the site renders.
// The repository is cloned (shallow) into workDir; the result includes the indexed commit.
export async function indexGitHub(source: Source, fetcher: Fetcher, workDir: string, log: (msg: string) => void): Promise<CrawlResult & { commit: string }> {
  const gh = source.github
  if (!gh) throw new Error(`source ${source.id}: github source needs github settings`)

  const dir = join(workDir, gh.repo.replace("/", "_"))
  await rm(dir, { recursive: true, force: true })
  await git("git", ["clone", "--quiet", "--depth", "1", "--single-branch", "--branch", gh.branch, `https://github.com/${gh.repo}.git`, dir])
  const commit = (await git("git", ["-C", dir, "rev-parse", "HEAD"])).stdout.trim()
  const result = { pages: 0, records: [], errors: [], skipped: [], commit } as CrawlResult & { commit: string }

  const include = new RegExp(gh.include)
  const exclude = (source.exclude ?? []).map(p => new RegExp(p))
  const files = (await readdir(dir, { recursive: true }))
    .map(f => f.split(sep).join("/"))
    .filter(f => !f.startsWith(".git/") && include.test(f))
    .sort()

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
      markdown = await readFile(join(dir, path), "utf8")
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
