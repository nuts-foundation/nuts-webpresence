import React, { useEffect, useId, useRef, useState } from "react"
import { useCombobox } from "downshift"

import Highlighted from "./Highlighted"
import MethodBadge from "./MethodBadge"
import { candidatesFor, RankingConfig, rerank } from "../lib/ranking"
import { Hit, representative, search } from "../lib/search"
import ranking from "../search/ranking.yaml"

const config = ranking as RankingConfig
// The order of the search page with its default settings.
const order = { weights: config.presets[config.defaultPreset].weights, halfLife: config.influence[config.defaultInfluence] }
const SHOWN = 8
const DEBOUNCE_MS = 250
const { ItemClick, InputBlur: Blur } = useCombobox.stateChangeTypes
// The last row of the suggestions, which opens the search page.
const MORE = "more"
type Item = Hit | typeof MORE
// The key that, with Enter, opens the search page: ⌘ on Apple devices, Ctrl elsewhere. Only the open list shows it,
// which the server never renders, so the server's Ctrl doesn't conflict with the browser's ⌘.
const MODIFIER = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl"
const KBD = "min-w-6 rounded border border-stroke bg-light px-1.5 text-center text-xs font-normal text-dark-gray"
const FIELD = "w-full rounded-full text-sm font-inter px-4 py-1.5 bg-white text-text border border-stroke focus:outline-none focus:ring-2 focus:ring-button"

const searchPage = (q: string) => `/zoeken/?${new URLSearchParams({ q })}`

// Search field in the menu: a plain GET form that opens the search page, so it also works without JavaScript. While
// typing, it suggests the top results of the search page; the arrow keys and Enter, or a click, open a result in a
// new tab. The last row, and Cmd or Ctrl+Enter, open the search page.
export default function SearchField() {
  const [hits, setHits] = useState<Hit[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const items: Item[] = hits.length ? [...hits, MORE] : []
  const { isOpen, highlightedIndex, inputValue, getLabelProps, getInputProps, getMenuProps, getItemProps, setInputValue, openMenu } = useCombobox<Item>({
    items,
    itemToString: item => item && item !== MORE ? item.title : "",
    selectedItem: null,
    // The field keeps what was typed when a suggestion is clicked or the field loses focus. A click follows the link.
    stateReducer: (state, { type, changes }) =>
      type === ItemClick || type === Blur ? { ...changes, inputValue: state.inputValue } : changes,
  })

  // Text typed before the page became interactive is in the field but not in the state, which would clear it.
  useEffect(() => {
    const typed = inputRef.current?.value
    if (!typed) return
    setInputValue(typed)
    if (document.activeElement === inputRef.current) openMenu()
  }, [setInputValue, openMenu])

  useEffect(() => {
    if (!inputValue.trim()) {
      setHits([])
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      search(inputValue, { hideOutdated: false }, candidatesFor(SHOWN, order, config), controller.signal)
        .then(r => setHits(rerank(r.groups.map(group => representative(group, "")), inputValue, order, config).slice(0, SHOWN)))
        // Without suggestions the form still works.
        .catch(e => { if (e.name !== "AbortError") setHits([]) })
    }, DEBOUNCE_MS)
    return () => { clearTimeout(timer); controller.abort() }
  }, [inputValue])

  const open = isOpen && items.length > 0
  const row = (index: number) => `border-l-[3px] ${index === highlightedIndex ? "border-l-dark bg-light" : "border-l-transparent bg-white"}`
  return (<form action="/zoeken/" method="get" role="search" className="relative min-w-0">
    <label {...getLabelProps()} className="sr-only">Zoeken</label>
    <input
      {...getInputProps({
        ref: inputRef,
        name: "q",
        type: "search",
        placeholder: "Zoeken…",
        // Enter on a highlighted result opens it in a new tab, here rather than after Downshift's update, which some
        // browsers would block as a popup. Enter on anything else, and Cmd or Ctrl+Enter, open the search page.
        onKeyDown: event => {
          // keyCode 229: Enter that confirms IME input can arrive after compositionend, so isComposing is false then.
          if (event.key !== "Enter" || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
          (event.nativeEvent as { preventDownshiftDefault?: boolean }).preventDownshiftDefault = true
          event.preventDefault()
          const item = event.metaKey || event.ctrlKey ? undefined : items[highlightedIndex]
          if (item && item !== MORE) window.open(item.url, "_blank", "noopener")
          else event.currentTarget.form?.requestSubmit()
        },
      })}
      className={`${FIELD} md:w-40`} />
    <ul
      {...getMenuProps()}
      className={`${open ? "" : "hidden"} z-30 mt-2 md:absolute md:right-0 md:top-full md:w-[30rem] max-h-[70vh] overflow-y-auto rounded-lg border border-stroke bg-white pt-1 shadow-lg font-inter`}>
      {/* The links are not in the tab order: the arrow keys move through the rows. */}
      {open && items.map((item, index) => item === MORE ? (
        // Stays in view when the suggestions scroll.
        <li key={MORE} {...getItemProps({ item, index })} className={`sticky bottom-0 border-t border-t-stroke ${row(index)}`}>
          <a href={searchPage(inputValue)} tabIndex={-1} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm font-semibold text-link">
            Uitgebreid zoeken
            <span className="hidden md:flex gap-1"><kbd className={KBD}>{MODIFIER}</kbd><kbd className={KBD}>↵</kbd></span>
          </a>
        </li>
      ) : (
        <li key={item.id} {...getItemProps({ item, index })} className={row(index)}>
          <a href={item.url} target="_blank" rel="noopener" tabIndex={-1} className="block px-4 py-2">
            {item.method ? (<>
              <span className="flex items-center gap-2">
                <MethodBadge method={item.method} />
                <span className="font-mono text-[13px] font-semibold text-link break-all">{item.path}</span>
              </span>
              <span className="block mt-0.5 truncate text-sm text-dark-gray"><Highlighted text={item.highlighted.title} /></span>
            </>) : (
              <span className="block text-sm font-semibold text-link"><Highlighted text={item.highlighted.title} /></span>
            )}
            <span className="block mt-0.5 text-xs text-text/80">
              {[item.method ? item.apiName?.replace(/ - DEPRECATED$/, "") : item.sourceName, item.version, item.status === "archief" && "Verouderd"]
                .filter(Boolean).join(" · ")}
            </span>
          </a>
        </li>
      ))}
    </ul>
  </form>)
}

export interface SearchQuery {
  value: string
  onChange: (q: string) => void
}

// The search page's own search field, in the menu and, on phones, on the page: results update while typing, so it
// needs no suggestions.
export function SearchPageField({ value, onChange }: SearchQuery) {
  const id = useId()
  return (<form role="search" onSubmit={e => e.preventDefault()} className="min-w-0">
    <label htmlFor={id} className="sr-only">Zoeken</label>
    <input
      id={id}
      type="search"
      autoComplete="off"
      autoFocus
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Zoeken…"
      className={`${FIELD} md:w-40 lg:w-64`} />
  </form>)
}
