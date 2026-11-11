import React, { useEffect, useId, useMemo, useState } from "react"
import Head from "next/head"
import { useRouter } from "next/router"

import Layout from "../components/Layout"
import Highlighted from "../components/Highlighted"
import MethodBadge from "../components/MethodBadge"
import { SearchPageField } from "../components/SearchField"
import { CATEGORIES, Category, RankingConfig, rerank, suggestsFunctional, Weights } from "../lib/ranking"
import { Filters, Group, Hit, optInParams, representative, search, SearchResult, TABS, useSearchEnabled } from "../lib/search"
import ranking from "../search/ranking.yaml"

const config = ranking as RankingConfig
const PAGE_SIZE = 20
const DEBOUNCE_MS = 250

const TAB_NAMES: Record<string, string> = {
  api: "API", documentatie: "Documentatie", specificatie: "Specificatie", toepassing: "Toepassing", website: "Website", wiki: "Wiki",
}
const CATEGORY_LABELS: Record<Category, string> = {
  documentation: "Documentatie & API", specification: "Specificaties", toepassing: "Toepassingen", wiki: "Wiki", website: "Website",
}
const INFLUENCE_LABELS: Record<string, string> = { laag: "Laag", normaal: "Normaal", sterk: "Sterk" }
const VERSIONS = [{ id: "", label: "Nieuwste" }, { id: "v6.2", label: "v6.2" }, { id: "v5.4", label: "v5.4" }]
const LANGUAGES = [{ id: "", label: "Alle talen" }, { id: "nl", label: "Nederlands" }, { id: "en", label: "Engels" }]

// The search state that is kept in the URL, so a search (including its ranking) can be shared.
interface State {
  q: string
  filters: Filters
  preset: string
  // Weights that differ from the preset ("Aangepast").
  weights: Partial<Weights>
  influence: string
  // Version whose link a result shows first; empty for the newest.
  version: string
}

function readState(query: Record<string, string | string[] | undefined>, config: RankingConfig): State {
  const one = (key: string) => {
    const value = query[key]
    return (Array.isArray(value) ? value[0] : value) ?? ""
  }
  const weights: Partial<Weights> = {}
  for (const category of CATEGORIES) {
    const value = Number(one(`gewicht-${category}`))
    if (one(`gewicht-${category}`) && Number.isFinite(value) && value >= 0 && value <= 2) weights[category] = value
  }
  return {
    q: one("q"),
    filters: {
      tab: TABS.some(t => t.id === one("bron")) ? one("bron") : undefined,
      language: LANGUAGES.some(l => l.id && l.id === one("taal")) ? one("taal") : undefined,
      hideOutdated: one("verouderd") === "verbergen",
    },
    // Own properties only: `in` would also accept names like __proto__.
    preset: Object.hasOwn(config.presets, one("voorrang")) ? one("voorrang") : config.defaultPreset,
    weights,
    influence: Object.hasOwn(config.influence, one("invloed")) ? one("invloed") : config.defaultInfluence,
    version: VERSIONS.some(v => v.id === one("versie")) ? one("versie") : "",
  }
}

function writeState(state: State, config: RankingConfig): Record<string, string> {
  const query: Record<string, string> = {}
  if (state.q) query.q = state.q
  if (state.filters.tab) query.bron = state.filters.tab
  if (state.filters.language) query.taal = state.filters.language
  if (state.filters.hideOutdated) query.verouderd = "verbergen"
  if (state.preset !== config.defaultPreset) query.voorrang = state.preset
  for (const [category, value] of Object.entries(state.weights)) query[`gewicht-${category}`] = String(value)
  if (state.influence !== config.defaultInfluence) query.invloed = state.influence
  if (state.version) query.versie = state.version
  return query
}

export default function Zoeken() {
  const router = useRouter()
  const [state, setState] = useState<State>(() => readState({}, config))
  const [shown, setShown] = useState(PAGE_SIZE)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const enabled = useSearchEnabled()
  const { q, filters } = state

  const update = (change: Partial<State>) => {
    setState(current => ({ ...current, ...change }))
    setShown(PAGE_SIZE)
  }

  // Start from the URL, so searches can be shared; open Geavanceerd when the URL changes something in it.
  useEffect(() => {
    if (!router.isReady || initialized) return
    const initial = readState(router.query, config)
    setState(initial)
    setAdvancedOpen(Object.keys(initial.weights).length > 0 || initial.influence !== config.defaultInfluence
      || initial.filters.hideOutdated || !!initial.filters.language || !!initial.version)
    setInitialized(true)
  }, [router.isReady, router.query, initialized])

  useEffect(() => {
    if (!initialized) return
    router.replace({ pathname: router.pathname, query: { ...writeState(state, config), ...optInParams() } }, undefined, { shallow: true, scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, initialized])

  // Search while typing, debounced; a newer search cancels the previous one. The ranking is applied afterwards, so
  // changing it needs no new search.
  useEffect(() => {
    if (!initialized || !enabled) return
    if (!q.trim()) {
      setResult(null)
      setError(null)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setLoading(true)
      search(q, filters, config.candidates, controller.signal, state.version)
        .then(r => { setResult(r); setError(null) })
        // The results of an earlier search would look like the answer to this one.
        .catch(e => { if (e.name !== "AbortError") { setError(e.message); setResult(null) } })
        .finally(() => setLoading(false))
    }, DEBOUNCE_MS)
    return () => { clearTimeout(timer); controller.abort() }
  }, [q, filters, state.version, initialized, enabled])

  const weights: Weights = { ...config.presets[state.preset].weights, ...state.weights }
  const customized = Object.keys(state.weights).length > 0 || state.influence !== config.defaultInfluence
  const halfLife = config.influence[state.influence]

  const { ranked, hint } = useMemo(() => {
    if (!result) return { ranked: [], hint: false }
    const candidates = result.groups.map(group => ({ ...representative(group, state.version), group }))
    const ranked = rerank(candidates, q, { weights, halfLife }, config)
    const functional = config.presets.functioneel
    const hint = state.preset !== "functioneel" && !!functional
      && suggestsFunctional(ranked, rerank(candidates, q, { weights: functional.weights, halfLife }, config), config)
    return { ranked, hint }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, state.version, state.preset, JSON.stringify(weights), halfLife])

  const allCount = Object.values(result?.tabCounts ?? {}).reduce((a, b) => a + b, 0)

  return (
    <Layout>
      <Head>
        <title>Zoeken — Nuts</title>
        <meta name="robots" content="noindex" />
      </Head>
      <h1 className="sr-only">Zoeken</h1>

      {enabled === undefined ? null : !enabled ? (
        <p className="container mx-auto max-w-4xl px-4 py-10 font-inter text-text">Zoeken is (nog) niet beschikbaar.</p>
      ) : (<>
        <div className="container mx-auto max-w-4xl px-4 pt-4 md:pt-6">
          <SearchPageField value={q} onChange={value => update({ q: value })} />
        </div>
        <nav aria-label="Bron" className="border-b border-stroke">
          <ul className="container mx-auto max-w-4xl px-4 flex gap-1 overflow-x-auto">
            {[{ id: undefined, label: "Alles", count: allCount }, ...TABS.map(t => ({ ...t, count: result?.tabCounts[t.id] ?? 0 }))].map(tab => {
              const active = filters.tab === tab.id
              return (
                <li key={tab.label}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => update({ filters: { ...filters, tab: tab.id } })}
                    className={`px-3 pt-3 pb-2.5 border-b-[3px] whitespace-nowrap font-inter text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dark ${
                      active ? "border-dark text-dark-gray font-semibold" : "border-transparent text-text/80 hover:text-dark-gray"
                    }`}
                  >
                    {tab.label}{result && q.trim() && <span className="ml-1 text-xs text-text/60">{tab.count}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="container mx-auto max-w-4xl px-4 py-6 md:py-8">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 mb-4">
            <p aria-live="polite" className="font-inter text-sm text-text min-h-5">
              {error ? `Er ging iets mis: ${error}`
                : !q.trim() ? "Typ een zoekterm om te beginnen."
                : loading && !result ? "Zoeken…"
                : result ? `${result.total} ${result.total === 1 ? "resultaat" : "resultaten"}` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <RadioPills
                legend="Voorrang voor"
                options={Object.entries(config.presets).map(([id, p]) => ({ id, label: p.label }))}
                value={state.preset}
                onChange={preset => update({ preset, weights: {} })}
              />
              <button
                type="button"
                aria-expanded={advancedOpen}
                aria-controls="search-advanced"
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="font-inter text-sm text-darker underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-dark rounded"
              >
                Geavanceerd{customized && " (aangepast)"} <span aria-hidden="true">{advancedOpen ? "▴" : "▾"}</span>
              </button>
            </div>
          </div>

          {advancedOpen && (
            <Advanced
              config={config}
              state={state}
              weights={weights}
              customized={customized}
              onChange={update}
            />
          )}

          {hint && (
            <p className="font-inter text-sm bg-light rounded-lg px-4 py-3 mb-4">
              Zoekt u meer functionele resultaten?{" "}
              <button type="button" onClick={() => update({ preset: "functioneel", weights: {} })} className="font-semibold text-link underline underline-offset-2 hover:no-underline">
                Toon functioneel eerst
              </button>
            </p>
          )}

          {result && q.trim() && result.total === 0 && (
            <div className="rounded-xl border border-stroke p-6 bg-light font-inter text-text">
              <p className="font-redhat font-bold text-dark-gray text-lg mb-2">Geen resultaten voor “{q}”</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Controleer de spelling of probeer een ander woord, ook in het Engels.</li>
                {(filters.tab || filters.language || filters.hideOutdated) && <li>Zoek in alle bronnen, of zet de filters onder Geavanceerd uit.</li>}
                <li>Staat het er echt niet bij? Laat het ons weten via <a className="text-darker underline" href="/contact">contact</a>.</li>
              </ul>
            </div>
          )}

          {ranked.length > 0 && (
            <ol aria-label="Zoekresultaten">
              {ranked.slice(0, shown).map(hit => hit.method
                ? <ApiResult key={hit.group[0].id} hit={hit} group={hit.group} />
                : <Result key={hit.group[0].id} hit={hit} group={hit.group} />)}
            </ol>
          )}

          {ranked.length > shown && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setShown(shown + PAGE_SIZE)}
                className="inline-block px-6 py-3 rounded-full text-sm font-inter transition-colors bg-button hover:bg-button-hover text-dark-gray"
              >
                Meer resultaten
              </button>
            </div>
          )}
          {result && shown >= ranked.length && result.total > ranked.length && (
            <p className="mt-8 font-inter text-sm text-text text-center">
              Meer dan {ranked.length} resultaten; maak je zoekopdracht specifieker.
            </p>
          )}
        </div>
      </>)}
    </Layout>
  )
}

interface AdvancedProps {
  config: RankingConfig
  state: State
  weights: Weights
  customized: boolean
  onChange: (change: Partial<State>) => void
}

function Advanced({ config, state, weights, customized, onChange }: AdvancedProps) {
  const id = useId()
  const preset = config.presets[state.preset].weights
  return (
    <section id="search-advanced" aria-labelledby={`${id}-title`} className="rounded-xl border border-stroke bg-white p-5 md:p-6 mb-6 font-inter text-sm text-text">
      <h2 id={`${id}-title`} className="font-redhat font-bold text-dark-gray text-lg">Geavanceerd</h2>
      <p className="mb-5 text-text/80">Bepaal welke bronnen voorrang krijgen. Niets wordt verborgen, alleen anders gesorteerd.</p>
      <div className="grid gap-8 md:grid-cols-2">
        {/* min-w-0: a fieldset is at least as wide as its content by default, too wide for a phone. */}
        <fieldset className="min-w-0">
          <legend className="text-xs font-semibold uppercase tracking-wide text-dark-gray mb-3">Gewicht per brontype</legend>
          {CATEGORIES.map(category => (
            <div key={category} className="grid grid-cols-[7rem_minmax(0,1fr)_2.5rem] md:grid-cols-[9.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 mb-2">
              <label htmlFor={`${id}-${category}`}>{CATEGORY_LABELS[category]}</label>
              <input
                id={`${id}-${category}`}
                type="range"
                min={0}
                max={1.5}
                step={0.05}
                value={weights[category]}
                onChange={e => {
                  const value = Number(e.target.value)
                  const changed = { ...state.weights, [category]: value }
                  if (value === preset[category]) delete changed[category]
                  onChange({ weights: changed })
                }}
                className="min-w-0 w-full accent-dark"
              />
              <output htmlFor={`${id}-${category}`} className="text-right tabular-nums text-text/80">{weights[category].toFixed(2)}</output>
            </div>
          ))}
          <div className="mt-4">
            <RadioPills
              legend="Invloed van brontype"
              options={Object.keys(config.influence).map(key => ({ id: key, label: INFLUENCE_LABELS[key] ?? key }))}
              value={state.influence}
              onChange={influence => onChange({ influence })}
              stacked
            />
            <p className="mt-1 text-xs text-text/70">Laag: de tekstovereenkomst telt het zwaarst. Sterk: het brontype weegt zwaar.</p>
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="text-xs font-semibold uppercase tracking-wide text-dark-gray mb-3">Filters</legend>
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={state.filters.hideOutdated}
              onChange={e => onChange({ filters: { ...state.filters, hideOutdated: e.target.checked } })}
              className="accent-dark w-4 h-4"
            />
            Verberg verouderde resultaten
          </label>
          <label htmlFor={`${id}-language`} className="block mb-1">Taal</label>
          <select
            id={`${id}-language`}
            value={state.filters.language ?? ""}
            onChange={e => onChange({ filters: { ...state.filters, language: e.target.value || undefined } })}
            className="w-full mb-3 rounded-lg border border-stroke px-3 py-2 bg-white"
          >
            {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          <label htmlFor={`${id}-version`} className="block mb-1">Versie Nuts node</label>
          <select
            id={`${id}-version`}
            value={state.version}
            onChange={e => onChange({ version: e.target.value })}
            aria-describedby={`${id}-version-help`}
            className="w-full rounded-lg border border-stroke px-3 py-2 bg-white"
          >
            {VERSIONS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
          <p id={`${id}-version-help`} className="mt-1 text-xs text-text/70">Gaat voor bij resultaten die even goed overeenkomen. Staat een resultaat in meerdere versies, dan toont het deze versie.</p>
        </fieldset>
      </div>
      {customized && (
        <button
          type="button"
          onClick={() => onChange({ weights: {}, influence: config.defaultInfluence })}
          className="mt-5 text-darker underline underline-offset-2 hover:no-underline"
        >
          Herstel standaard rangschikking
        </button>
      )}
    </section>
  )
}

interface RadioPillsProps {
  legend: string
  options: { id: string, label: string }[]
  value: string
  onChange: (value: string) => void
  // Legend above the options instead of next to them.
  stacked?: boolean
}

// A choice of a few options, shown as a segmented control; native radio buttons, so it works with the keyboard.
function RadioPills({ legend, options, value, onChange, stacked }: RadioPillsProps) {
  const name = useId()
  return (
    <fieldset className={stacked ? "" : "flex items-center gap-2"}>
      <legend className={stacked ? "text-xs font-semibold uppercase tracking-wide text-dark-gray mb-2" : "float-left mr-2 font-inter text-sm text-text/80"}>{legend}</legend>
      <div className="inline-flex rounded-full border border-stroke bg-white p-0.5">
        {options.map(option => (
          <label key={option.id} className={`cursor-pointer rounded-full px-3.5 py-1.5 font-inter text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-dark ${
            value === option.id ? "bg-dark-gray text-white font-semibold" : "text-text hover:text-dark-gray"
          }`}>
            <input type="radio" name={name} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} className="sr-only" />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

interface ResultProps {
  hit: Hit
  group: Group
}

function Meta({ hit, children }: { hit: Hit, children?: React.ReactNode }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mb-1 text-xs font-inter text-text/80">
      <span className="font-semibold text-text">{hit.method ? "API" : TAB_NAMES[tabOf(hit)]}</span>
      {children}
      {hit.status === "archief" && <Pill className="border-[#e7b46a] bg-[#fff6e6] text-[#8a4b00]">Verouderd</Pill>}
      {hit.status === "draft" && <Pill className="border-stroke bg-light text-text">Concept</Pill>}
      {hit.category === "wiki" && <CommunityNote id={hit.id} />}
    </p>
  )
}

function tabOf(hit: Hit): string {
  return ({ documentation: "documentatie", specification: "specificatie" } as Record<string, string>)[hit.category ?? ""] ?? hit.category ?? ""
}

function Dot() {
  return <span aria-hidden="true" className="text-text/40">·</span>
}

function Result({ hit, group }: ResultProps) {
  const crumbs = hit.hierarchy.slice(0, -1)
  return (
    <li className="py-4 border-b border-stroke/70">
      <Meta hit={hit}>
        <Dot /><span>{hit.sourceName}</span>
        {hit.version && <><Dot /><span>{hit.version}</span></>}
      </Meta>
      <h2 className="font-redhat font-bold text-lg leading-snug">
        <a href={hit.url} target="_blank" rel="noopener" className="text-link hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-dark rounded">
          <Highlighted text={hit.highlighted.title} />
        </a>
      </h2>
      {crumbs.length > 0 && (
        <p className="text-xs font-inter text-text/70 mt-0.5">{crumbs.join(" › ")}</p>
      )}
      {hit.highlighted.content && (
        <p className="mt-1.5 text-text font-inter text-sm leading-relaxed break-words line-clamp-2">
          <Highlighted text={hit.highlighted.content} />
        </p>
      )}
      <OtherVersions hit={hit} group={group} />
    </li>
  )
}

function ApiResult({ hit, group }: ResultProps) {
  return (
    <li className="py-4 border-b border-stroke/70">
      <Meta hit={hit}>
        <Dot /><span>{hit.apiName?.replace(/ - DEPRECATED$/, "")}</span>
        <Dot /><span>{hit.version}</span>
      </Meta>
      <h2 className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <MethodBadge method={hit.method!} />
        <a href={hit.url} target="_blank" rel="noopener" className="font-mono font-semibold text-[15px] text-link break-all hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-dark rounded">
          {hit.path}
          <span className="sr-only">: {hit.title}</span>
        </a>
      </h2>
      <p className="mt-1.5 text-dark-gray font-inter text-sm"><Highlighted text={hit.highlighted.title} /></p>
      {/* Why it matched when that's not the title: the description, a parameter or an error response. */}
      {hit.highlighted.content && (
        <p className="mt-1 text-text font-inter text-sm leading-relaxed break-words line-clamp-2">
          <Highlighted text={hit.highlighted.content} />
        </p>
      )}
      <OtherVersions hit={hit} group={group} />
    </li>
  )
}

// Links to the result in other versions; the API reference of released versions has no links to operations.
function OtherVersions({ hit, group }: ResultProps) {
  const versions = (hit.versions ?? group.map(h => ({ version: h.version!, url: h.url })))
    .filter(v => v.version && v.version !== hit.version)
  if (!versions.length) return null
  return (
    <p className="mt-2 text-xs font-inter text-text/80">
      Ook in:{" "}
      {versions.map((v, i) => (
        <React.Fragment key={v.version}>
          {i > 0 && " · "}
          <a href={v.url} target="_blank" rel="noopener" className="text-link hover:underline">{v.version}</a>
        </React.Fragment>
      ))}
    </p>
  )
}

function Pill({ className, children }: { className: string, children: React.ReactNode }) {
  return <span className={`ml-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${className}`}>{children}</span>
}

// Focusable, so the explanation is also reachable by keyboard. Hidden rather than invisible, so the explanations take
// no room. On phones the explanation shows at the bottom of the screen, so it never makes the page wider.
function CommunityNote({ id }: { id: string }) {
  return (
    <span tabIndex={0} aria-describedby={`community-${id}`} className="group/tag relative ml-1 px-2 py-0.5 rounded-full border border-stroke bg-light text-[11px] font-semibold text-text cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-dark">
      Communitybijdrage
      <span id={`community-${id}`} role="tooltip" className="hidden group-hover/tag:block group-focus/tag:block fixed inset-x-4 bottom-4 z-20 md:absolute md:inset-x-auto md:bottom-auto md:left-0 md:top-full md:mt-1 md:w-64 rounded-lg bg-dark-gray text-white text-xs font-normal leading-snug p-2 shadow-md">
        Bijdrage van de community. Hierop heeft beperkte kwaliteitscontrole plaatsgevonden.
      </span>
    </span>
  )
}
