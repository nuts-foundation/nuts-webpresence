import { readFile } from "node:fs/promises"
import { parse } from "yaml"

export type DocType = "concept" | "guide" | "reference" | "specification" | "use-case"
export type Audience = "developer" | "architect" | "devops" | "toepassingsontwerper" | "algemeen"
export type Language = "nl" | "en"
export type Status = "actueel" | "draft" | "archief"

export interface Labels {
  type?: DocType
  audience?: Audience[]
  language?: Language
  version?: string
  status?: Status
}

export interface Override {
  // Regular expression, tested against the page URL.
  match: string
  labels: Labels
}

export interface Selectors {
  // Element that holds the main content of a page.
  content: string
  // Elements inside the content that must be dropped (buttons, edit links, ...).
  remove?: string[]
}

export interface SourceVersion {
  version: string
  startUrls?: string[]
  urlPrefix?: string
  labels?: Labels
  // openapi only: page that lists the OpenAPI specs of this version.
  apiPage?: string
}

export interface Source {
  id: string
  name: string
  owner: string
  kind?: "html" | "openapi"
  discovery?: "links" | "sitemap"
  startUrls?: string[]
  urlPrefix?: string
  // Pages within urlPrefix that are indexed (regex, default: all). Other pages are only followed.
  index?: string[]
  // Pages that are neither followed nor indexed (regex).
  exclude?: string[]
  selectors?: Selectors
  // Derive language from page text instead of <html lang> (for sources where lang is unreliable).
  detectLanguage?: boolean
  labels: Labels
  overrides?: Override[]
  versions?: SourceVersion[]
  maxPages?: number
  // openapi only
  apiPage?: string
}

export interface Settings {
  userAgent: string
  rateLimitMs: number
  maxPages: number
  timeoutMs: number
}

export interface SourcesFile {
  settings: Settings
  sources: Source[]
}

export async function loadSources(path: string): Promise<SourcesFile> {
  const file = parse(await readFile(path, "utf8"), { merge: true }) as SourcesFile
  for (const source of file.sources) {
    for (const field of ["id", "name", "owner", "labels"] as const) {
      if (!source[field]) throw new Error(`source ${source.id ?? "?"}: missing ${field}`)
    }
  }
  return file
}

// Synonyms are written as groups of equivalent terms; Meilisearch wants a map term -> synonyms.
export async function loadSynonyms(path: string): Promise<Record<string, string[]>> {
  const file = parse(await readFile(path, "utf8")) as { groups: string[][] }
  const result: Record<string, string[]> = {}
  for (const group of file.groups) {
    for (const term of group) {
      const key = term.toLowerCase()
      const others = group.filter(t => t !== term).map(t => t.toLowerCase())
      result[key] = [...new Set([...(result[key] ?? []), ...others])]
    }
  }
  return result
}

// A source with versions is crawled once per version, each with its own start URLs, prefix and version label.
export function expandVersions(source: Source): Source[] {
  const jobs = !source.versions?.length ? [source] : source.versions.map(v => ({
    ...source,
    startUrls: v.startUrls,
    urlPrefix: v.urlPrefix,
    apiPage: v.apiPage ?? source.apiPage,
    labels: { ...source.labels, version: v.version, ...v.labels },
  }))
  for (const job of jobs) {
    const missing = job.kind === "openapi"
      ? (job.apiPage ? [] : ["apiPage"])
      : (["startUrls", "urlPrefix", "selectors"] as const).filter(f => !job[f])
    if (missing.length) throw new Error(`source ${source.id}${job.labels.version ? "@" + job.labels.version : ""}: missing ${missing.join(", ")}`)
  }
  return jobs
}
