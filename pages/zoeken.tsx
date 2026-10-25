import React, { useEffect, useId, useState } from "react"
import Head from "next/head"
import { useRouter } from "next/router"

import Layout from "../components/Layout"
import Header from "../components/Header"
import { FACETS, HIGHLIGHT_END, HIGHLIGHT_START, Hit, search, searchEnabled, SearchResult, Selection } from "../lib/search"

const PAGE_SIZE = 20
const DEBOUNCE_MS = 250

const VALUE_LABELS: Record<string, Record<string, string>> = {
  type: { concept: "Concept", guide: "Handleiding", reference: "Naslag", specification: "Specificatie", "use-case": "Toepassing" },
  language: { nl: "Nederlands", en: "Engels" },
  status: { actueel: "Actueel", draft: "Concept", archief: "Archief" },
}

function valueLabel(field: string, value: string): string {
  return VALUE_LABELS[field]?.[value] ?? value
}

function readQuery(query: Record<string, string | string[] | undefined>): { q: string, selection: Selection } {
  const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean)
  const selection: Selection = {}
  for (const facet of FACETS) selection[facet.field] = list(query[facet.param])
  return { q: list(query.q)[0] ?? "", selection }
}

export default function Zoeken() {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [selection, setSelection] = useState<Selection>({})
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const inputId = useId()

  // Start from the search term and filters in the URL, so searches can be shared.
  useEffect(() => {
    if (!router.isReady || initialized) return
    const state = readQuery(router.query)
    setQ(state.q)
    setSelection(state.selection)
    setInitialized(true)
  }, [router.isReady, router.query, initialized])

  // Keep the URL in sync with the search term and filters.
  useEffect(() => {
    if (!initialized) return
    const query: Record<string, string | string[]> = {}
    if (q) query.q = q
    for (const facet of FACETS) {
      if (selection[facet.field]?.length) query[facet.param] = selection[facet.field]
    }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, selection, initialized])

  // Search while typing, debounced; a newer search cancels the previous one.
  useEffect(() => {
    if (!initialized || !searchEnabled) return
    if (!q.trim()) {
      setResult(null)
      setError(null)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setLoading(true)
      search(q, selection, limit, controller.signal)
        .then(r => { setResult(r); setError(null) })
        .catch(e => { if (e.name !== "AbortError") setError(e.message) })
        .finally(() => setLoading(false))
    }, DEBOUNCE_MS)
    return () => { clearTimeout(timer); controller.abort() }
  }, [q, selection, limit, initialized])

  function toggle(field: string, value: string) {
    const current = selection[field] ?? []
    setSelection({ ...selection, [field]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] })
    setLimit(PAGE_SIZE)
  }

  const activeCount = Object.values(selection).reduce((n, values) => n + values.length, 0)

  return (
    <Layout>
      <Head>
        <title>Zoeken in de documentatie — Nuts</title>
        <meta name="robots" content="noindex" />
      </Head>

      <Header>
        <div className="container mx-auto max-w-5xl px-4">
          <h1 className="font-redhat font-bold text-white text-3xl md:text-4xl mb-6">Zoeken in de documentatie</h1>
          <form role="search" onSubmit={e => e.preventDefault()}>
            <label htmlFor={inputId} className="sr-only">Zoekterm</label>
            <input
              id={inputId}
              type="search"
              autoComplete="off"
              autoFocus
              value={q}
              onChange={e => { setQ(e.target.value); setLimit(PAGE_SIZE) }}
              placeholder="Bijvoorbeeld: access token, toepassing, configuratie"
              aria-describedby={`${inputId}-description`}
              className="w-full rounded-full text-base font-inter px-6 py-3 bg-white text-text border border-button focus:outline-none focus:ring-4 focus:ring-button"
            />
          </form>
        </div>
      </Header>

      <div className="container mx-auto max-w-5xl px-4 py-10 md:py-16">
        <p id={`${inputId}-description`} className="font-inter text-text mb-8">
          Zoek in nuts.nl, de Nuts node-documentatie, de specificaties, de toepassingen (IG&apos;s) en de wiki.
        </p>
        {!searchEnabled ? (
          <p className="font-inter text-text">Zoeken is (nog) niet beschikbaar.</p>
        ) : (
          <div className="md:grid md:grid-cols-[14rem_1fr] md:gap-10">
            <aside aria-label="Filters" className="mb-8 md:mb-0">
              <button
                type="button"
                className="md:hidden w-full flex justify-between items-center px-4 py-2 rounded-lg border border-stroke font-inter text-sm text-text"
                aria-expanded={filtersOpen}
                aria-controls="search-filters"
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <span>Filters{activeCount > 0 && ` (${activeCount} actief)`}</span>
                <span aria-hidden="true">{filtersOpen ? "−" : "+"}</span>
              </button>
              <div id="search-filters" className={`${filtersOpen ? "block" : "hidden"} md:block mt-4 md:mt-0 space-y-6`}>
                {FACETS.map(facet => (
                  <FacetGroup
                    key={facet.field}
                    label={facet.label}
                    field={facet.field}
                    counts={result?.facets[facet.field] ?? {}}
                    selected={selection[facet.field] ?? []}
                    onToggle={value => toggle(facet.field, value)}
                  />
                ))}
                {activeCount > 0 && (
                  <button type="button" onClick={() => setSelection({})} className="font-inter text-sm text-darker underline hover:no-underline">
                    Wis alle filters
                  </button>
                )}
              </div>
            </aside>

            <section aria-label="Zoekresultaten">
              <p aria-live="polite" className="font-inter text-sm text-text mb-6 min-h-5">
                {error ? `Er ging iets mis: ${error}`
                  : !q.trim() ? "Typ een zoekterm om te beginnen."
                  : loading && !result ? "Zoeken…"
                  : result && result.total === 0 ? ""
                  : result ? `${result.total} ${result.total === 1 ? "resultaat" : "resultaten"} voor “${q}”` : ""}
              </p>

              {result && q.trim() && result.total === 0 && (
                <div className="rounded-xl border border-stroke p-6 bg-light font-inter text-text">
                  <p className="font-redhat font-bold text-dark-gray text-lg mb-2">Geen resultaten voor “{q}”</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Controleer de spelling of probeer een ander woord, ook in het Engels.</li>
                    {activeCount > 0 && <li>Zet een of meer filters uit.</li>}
                    <li>Staat het er echt niet bij? Laat het ons weten via <a className="text-darker underline" href="/contact">contact</a>.</li>
                  </ul>
                </div>
              )}

              {result && result.hits.length > 0 && (
                <ol className="space-y-4">
                  {result.hits.map(hit => <ResultCard key={hit.id} hit={hit} />)}
                </ol>
              )}

              {result && result.hits.length < result.total && (
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => setLimit(limit + PAGE_SIZE)}
                    className="inline-block px-6 py-3 rounded-full text-sm font-inter transition-colors bg-button hover:bg-button-hover text-dark-gray"
                  >
                    Meer resultaten
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </Layout>
  )
}

interface FacetGroupProps {
  label: string
  field: string
  counts: Record<string, number>
  selected: string[]
  onToggle: (value: string) => void
}

function FacetGroup({ label, field, counts, selected, onToggle }: FacetGroupProps) {
  // Selected values stay visible even when the current search has no hits for them.
  const values = [...new Set([...Object.keys(counts), ...selected])].sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))
  if (!values.length) return null
  return (
    <fieldset>
      <legend className="font-redhat font-bold text-dark-gray mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map(value => {
          const active = selected.includes(value)
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(value)}
              className={`px-3 py-1 rounded-full text-sm font-inter border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dark ${
                active ? "bg-dark text-white border-dark" : "bg-white text-text border-stroke hover:border-dark hover:text-darker"
              }`}
            >
              {valueLabel(field, value)} <span className={active ? "" : "text-text/70"}>({counts[value] ?? 0})</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function ResultCard({ hit }: { hit: Hit }) {
  const crumbs = hit._formatted.hierarchy.slice(0, -1)
  return (
    <li className="group relative rounded-xl border border-stroke hover:shadow-md transition-all p-5 md:p-6 bg-white focus-within:ring-2 focus-within:ring-dark">
      {crumbs.length > 0 && (
        <p className="text-xs font-inter text-text/80 mb-1">
          {crumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span aria-hidden="true"> › </span>}
              <Highlighted text={crumb} />
            </React.Fragment>
          ))}
        </p>
      )}
      <h2 className="font-redhat font-bold text-dark-gray text-lg leading-snug group-hover:text-darker transition-colors">
        {/* The link covers the whole card; the title is its accessible name. */}
        <a href={hit.url} className="after:absolute after:inset-0 focus:outline-none">
          <Highlighted text={hit._formatted.title} />
        </a>
      </h2>
      {hit._formatted.content && (
        <p className="mt-2 text-text font-inter text-sm leading-relaxed">
          <Highlighted text={hit._formatted.content} />
        </p>
      )}
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Kenmerken">
        <Badge>{hit.sourceName}</Badge>
        {hit.language && <Badge>{valueLabel("language", hit.language)}</Badge>}
        {hit.type && <Badge>{valueLabel("type", hit.type)}</Badge>}
        {hit.version && <Badge>Versie {hit.version}</Badge>}
        {hit.status && hit.status !== "actueel" && <Badge>{valueLabel("status", hit.status)}</Badge>}
      </ul>
    </li>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return <li className="text-xs font-inter font-medium text-text bg-light px-2.5 py-1 rounded-full">{children}</li>
}

// Renders text with highlight markers from Meilisearch as <mark>, without using innerHTML.
function Highlighted({ text }: { text: string }) {
  const parts = text.split(new RegExp(`(${HIGHLIGHT_START}[^${HIGHLIGHT_END}]*${HIGHLIGHT_END})`))
  return <>{parts.map((part, i) => part.startsWith(HIGHLIGHT_START)
    ? <mark key={i} className="bg-menu-hover text-dark-gray rounded-sm px-0.5">{part.slice(1, -1)}</mark>
    : <React.Fragment key={i}>{part}</React.Fragment>)}</>
}
