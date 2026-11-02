// Re-orders search results by source type, without leaving any out. The defaults live in search/ranking.yaml, which
// also explains the formula.

export const CATEGORIES = ["documentation", "specification", "toepassing", "wiki", "website"] as const
export type Category = typeof CATEGORIES[number]
export type Weights = Record<Category, number>

export interface RankingConfig {
  candidates: number
  presets: Record<string, { label: string, weights: Weights }>
  defaultPreset: string
  influence: Record<string, number>
  defaultInfluence: string
  archivedFactor: number
  titleGuard: number
  hint: { top: number, min: number, audiences: string[] }
}

export interface Ranking {
  weights: Weights
  // Half-life of the text rank, see search/ranking.yaml.
  halfLife: number
}

export interface Candidate {
  title: string
  category?: string
  status?: string
  audience?: string[]
}

// candidates must be in text-match order, best first.
export function rerank<T extends Candidate>(candidates: T[], query: string, ranking: Ranking, config: RankingConfig): T[] {
  const scored = candidates.map((candidate, i) => ({
    candidate,
    rank: i + 1,
    score: 2 ** (-i / ranking.halfLife)
      * (ranking.weights[candidate.category as Category] ?? 1)
      * (candidate.status === "archief" ? config.archivedFactor : 1),
  }))
  const term = normalize(query)
  const pinned = new Map(scored
    .filter(s => s.rank <= config.titleGuard && s.candidate.status === "actueel" && normalize(s.candidate.title) === term)
    .map(s => [s.rank, s]))
  const rest = scored.filter(s => !pinned.has(s.rank)).sort((a, b) => b.score - a.score || a.rank - b.rank)
  return scored.map((_, i) => (pinned.get(i + 1) ?? rest.shift()!).candidate)
}

// True when the functional order would show results for a functional audience at the top that the given order
// doesn't, so it is worth suggesting.
export function suggestsFunctional<T extends Candidate>(shown: T[], functional: T[], config: RankingConfig): boolean {
  const top = new Set(shown.slice(0, config.hint.top))
  const extra = functional.slice(0, config.hint.top)
    .filter(c => !top.has(c) && c.audience?.some(a => config.hint.audiences.includes(a)))
  return extra.length >= config.hint.min
}

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim()
}
