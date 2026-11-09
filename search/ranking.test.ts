// Tests of the search page's ranking (lib/ranking.ts). Run with: npm run test:search
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import { parse } from "yaml"

import { type Candidate, candidatesFor, type RankingConfig, rerank, suggestsFunctional } from "../lib/ranking.ts"

const config = parse(readFileSync(new URL("ranking.yaml", import.meta.url), "utf8")) as RankingConfig
const technisch = { weights: config.presets.technisch.weights, halfLife: config.influence.normaal }
const functioneel = { weights: config.presets.functioneel.weights, halfLife: config.influence.normaal }

const doc = (title: string, category: string, extra: Partial<Candidate> = {}): Candidate => ({ title, category, status: "actueel", ...extra })
const titles = (candidates: Candidate[]) => candidates.map(c => c.title)

test("re-orders by source type without leaving results out", () => {
  const candidates = [doc("site", "website"), doc("wiki", "wiki"), doc("docs", "documentation")]
  const ranked = rerank(candidates, "x", technisch, config)
  assert.deepEqual(titles(ranked), ["docs", "wiki", "site"])
  assert.deepEqual(titles(rerank(candidates, "x", functioneel, config)), ["site", "wiki", "docs"])
})

test("text match still wins over source type when the gap is large", () => {
  const candidates = [doc("best match", "website"), ...Array.from({ length: 30 }, (_, i) => doc(`filler ${i}`, "website")), doc("docs", "documentation")]
  assert.equal(rerank(candidates, "x", technisch, config)[0].title, "best match")
})

test("an exact title match in the top 3 keeps its position", () => {
  const candidates = [doc("Wat is Nuts?", "website"), doc("Wat er al ligt", "documentation")]
  assert.deepEqual(titles(rerank(candidates, "wat is nuts", technisch, config)), ["Wat is Nuts?", "Wat er al ligt"])
})

test("an outdated or draft exact title match is not pinned", () => {
  const outdated = [doc("DID document", "documentation", { status: "archief" }), doc("Resolve a DID document", "documentation")]
  assert.equal(rerank(outdated, "did document", technisch, config)[0].title, "Resolve a DID document")
  const draft = [doc("Access token", "wiki", { status: "draft" }), doc("Access token request", "specification")]
  assert.equal(rerank(draft, "access token", technisch, config)[0].title, "Access token request")
})

test("outdated results rank lower", () => {
  const candidates = [doc("deprecated", "documentation", { status: "archief" }), doc("current", "documentation")]
  assert.deepEqual(titles(rerank(candidates, "x", technisch, config)), ["current", "deprecated"])
})

test("drafts are not penalized", () => {
  const candidates = [doc("draft guide", "toepassing", { status: "draft" }), doc("current guide", "toepassing")]
  assert.deepEqual(titles(rerank(candidates, "x", technisch, config)), ["draft guide", "current guide"])
})

test("the top results only need the best text matches", () => {
  for (const preset of Object.values(config.presets)) {
    for (const halfLife of Object.values(config.influence)) {
      const ranking = { weights: preset.weights, halfLife }
      const needed = candidatesFor(8, ranking, config)
      // The worst case: outdated results of the lowest weight first, then results of the highest weight.
      const byWeight = Object.entries(preset.weights).sort((a, b) => a[1] - b[1]).map(([category]) => category)
      const candidates = Array.from({ length: config.candidates }, (_, i) => i < needed - 1
        ? doc(`low ${i}`, byWeight[0], { status: "archief" })
        : doc(`high ${i}`, byWeight[byWeight.length - 1]))
      const top = (list: Candidate[]) => titles(rerank(list, "x", ranking, config).slice(0, 8))
      assert.deepEqual(top(candidates.slice(0, needed)), top(candidates))
    }
  }
  assert.ok(candidatesFor(8, technisch, config) < config.candidates)
})

test("the top results need at least as many candidates as are shown", () => {
  const equal = Object.fromEntries(Object.keys(technisch.weights).map(category => [category, 1])) as typeof technisch.weights
  assert.equal(candidatesFor(8, { weights: equal, halfLife: 20 }, { ...config, archivedFactor: 1 }), 8)
})

test("suggests the functional order when it brings functional results to the top", () => {
  const functional = { audience: ["algemeen"] }
  const candidates = [
    doc("site 1", "website", functional), doc("site 2", "website", functional),
    ...Array.from({ length: 6 }, (_, i) => doc(`docs ${i}`, "documentation", { audience: ["developer"] })),
  ]
  const shown = rerank(candidates, "x", technisch, config)
  assert.equal(suggestsFunctional(shown, rerank(candidates, "x", functioneel, config), config), true)
  const technical = candidates.map(c => ({ ...c, audience: ["developer"] }))
  assert.equal(suggestsFunctional(rerank(technical, "x", technisch, config), rerank(technical, "x", functioneel, config), config), false)
})
