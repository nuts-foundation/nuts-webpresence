import React from "react"

import { HIGHLIGHT_END, HIGHLIGHT_START } from "../lib/search"

// Renders text with highlight markers as <mark>, without using innerHTML.
export default function Highlighted({ text }: { text: string }) {
  const parts = text.split(new RegExp(`(${HIGHLIGHT_START}[^${HIGHLIGHT_END}]*${HIGHLIGHT_END})`))
  return <>{parts.map((part, i) => part.startsWith(HIGHLIGHT_START)
    ? <mark key={i} className="bg-menu-hover text-dark-gray rounded-sm px-0.5">{part.slice(1, -1)}</mark>
    : <React.Fragment key={i}>{part}</React.Fragment>)}</>
}
