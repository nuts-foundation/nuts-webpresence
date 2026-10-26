import * as cheerio from "cheerio"
import type { AnyNode, Element } from "domhandler"

import { Selectors } from "./config.ts"

export interface Section {
  // Fragment (without '#') that jumps to the section, or undefined for the top of the page.
  anchor?: string
  hierarchy: string[]
  content: string
}

export interface Page {
  // False when the content selector matched nothing (e.g. an overview page that is only crawled for its links).
  hasContent: boolean
  title: string
  lang?: string
  sections: Section[]
  links: string[]
}

const BLOCK = new Set([
  "p", "div", "li", "ul", "ol", "dl", "dt", "dd", "table", "tr", "td", "th", "pre", "blockquote",
  "section", "article", "h4", "h5", "h6", "br", "hr", "figure", "figcaption", "details", "summary",
  "button", "label", "option",
])
const HEADING_LEVEL: Record<string, number> = { h1: 1, h2: 2, h3: 3 }
const MAX_CONTENT = 20_000

export function extractPage(html: string, url: string, selectors: Selectors): Page {
  const $ = cheerio.load(html)
  const lang = $("html").attr("lang")?.trim() || undefined
  const links = $("a[href]").map((_, a) => $(a).attr("href")!).get()
    .map(href => { try { return new URL(href, url).toString() } catch { return undefined } })
    .filter((href): href is string => !!href)

  const context = (selectors.context ?? []).map(sel => clean($(sel).first().text())).filter(Boolean)
  const root = $(selectors.content).first()
  if (!root.length) return { hasContent: false, title: "", lang, links, sections: [] }
  root.find(["script", "style", "noscript", "svg", "template", ...(selectors.remove ?? [])].join(",")).remove()

  const documentTitle = $("title").first().text().trim()
  const title = clean(root.find("h1").first().text()) || documentTitle

  const sections: Section[] = []
  const levels: string[] = []
  let current: Section = { hierarchy: [title], content: "" }
  let buffer: string[] = []

  const flush = () => {
    current.content = clean(buffer.join("")).slice(0, MAX_CONTENT)
    sections.push(current)
    buffer = []
  }

  const walk = (node: AnyNode) => {
    if (node.type === "text") {
      buffer.push(node.data)
      return
    }
    if (node.type !== "tag") return
    const level = HEADING_LEVEL[node.name]
    if (level) {
      const text = clean($(node).text())
      if (!text) return
      flush()
      levels.length = level - 1
      levels[level - 1] = text
      const hierarchy = levels.filter(Boolean)
      if (level > 1 && !levels[0]) hierarchy.unshift(title)
      current = { anchor: anchorFor($, node, text), hierarchy, content: "" }
      return
    }
    node.children.forEach(walk)
    if (BLOCK.has(node.name)) buffer.push("\n")
  }
  root.contents().each((_, node) => walk(node))
  flush()
  if (context.length) sections.forEach(section => section.hierarchy.unshift(...context))

  return { hasContent: true, title, lang, links, sections }
}

// Finds the fragment the source site itself uses for a heading. When it has none, falls back to a
// text fragment (#:~:text=...), which modern browsers scroll to and highlight.
function anchorFor($: cheerio.CheerioAPI, heading: Element, text: string): string {
  const el = $(heading)
  const id = el.attr("id")
    ?? el.find("a.headerlink[href^='#']").attr("href")?.slice(1)
    ?? el.find("a[id], a[name]").first().attr("id")
    ?? el.find("a[name]").first().attr("name")
    ?? (el.parent().is("section[id]") && el.parent().children(":header").first().is(el) ? el.parent().attr("id") : undefined)
  if (id) return id
  return ":~:text=" + encodeURIComponent(text).replace(/-/g, "%2D")
}

function clean(text: string): string {
  return text.replace(/ /g, " ").replace(/[ \t\r\f\v]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/\n{2,}/g, "\n").trim()
}
