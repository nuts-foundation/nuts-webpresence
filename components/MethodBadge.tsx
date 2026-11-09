const METHOD_COLORS: Record<string, string> = {
  GET: "bg-[#0F7B3F]", POST: "bg-[#1D5FC2]", PUT: "bg-[#9A5B00]", PATCH: "bg-[#9A5B00]", DELETE: "bg-[#B42318]",
}

export default function MethodBadge({ method }: { method: string }) {
  return (
    <span className={`self-center font-mono font-bold text-[11px] leading-none text-white px-1.5 py-1 rounded ${METHOD_COLORS[method] ?? "bg-dark-gray"}`}>
      {method}
    </span>
  )
}
