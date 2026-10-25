import { Labels, Language, Source } from "./config.ts"

// Labels come from the source config; overrides whose pattern matches the URL are applied in order, so later ones win.
export function labelsFor(source: Source, url: string): Labels {
  let labels: Labels = { ...source.labels }
  for (const override of source.overrides ?? []) {
    if (new RegExp(override.match).test(url)) labels = { ...labels, ...override.labels }
  }
  return labels
}

// Language order: language set by an override, then <html lang> (or text detection for sources where
// lang is unreliable), then the source default.
export function languageFor(source: Source, url: string, htmlLang: string | undefined, text: string): Language | undefined {
  const fromOverride = (source.overrides ?? []).filter(o => o.labels.language && new RegExp(o.match).test(url)).pop()
  if (fromOverride) return fromOverride.labels.language
  if (source.detectLanguage) return detectLanguage(text) ?? source.labels.language
  const lang = htmlLang?.toLowerCase().split("-")[0]
  if (lang === "nl" || lang === "en") return lang
  return source.labels.language
}

const STOPWORDS: Record<Language, Set<string>> = {
  nl: new Set(["de", "het", "een", "en", "van", "is", "niet", "voor", "met", "zijn", "op", "dat", "die", "wordt", "worden", "naar", "ook", "bij", "deze", "kan", "als", "aan", "er", "om"]),
  en: new Set(["the", "and", "of", "is", "to", "for", "with", "are", "this", "that", "be", "on", "by", "can", "an", "as", "it", "from", "which", "should", "must", "not", "or", "when"]),
}

// Counts common function words per language; good enough to tell Dutch from English prose.
export function detectLanguage(text: string): Language | undefined {
  const words = text.toLowerCase().match(/\p{L}+/gu) ?? []
  const score = { nl: 0, en: 0 }
  for (const word of words) {
    if (STOPWORDS.nl.has(word)) score.nl++
    if (STOPWORDS.en.has(word)) score.en++
  }
  if (score.nl + score.en < 5) return undefined
  return score.nl > score.en ? "nl" : "en"
}
