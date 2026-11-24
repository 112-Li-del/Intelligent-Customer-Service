export function stockTone(label: string) {
  if (/^(?:out of stock|sold out|暂时缺货|缺货)$/i.test(label)) return "out"
  if (/^(?:low stock|only \d+ left|库存紧张|仅剩\d+件)$/i.test(label))
    return "low"
  if (/^(?:in stock|有货|可下单)$/i.test(label)) return "in"
}

export function StatusBadge({ label }: { label: string }) {
  const tone = stockTone(label)
  const color =
    tone === "in"
      ? "bg-green-50 text-green-800"
      : tone === "low"
      ? "bg-amber-100 text-amber-900"
      : tone === "out"
      ? "bg-red-50 text-red-800"
      : "bg-stone-100 text-stone-700"
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 align-baseline text-[11px] font-semibold leading-4 ${color}`}
    >
      {label}
    </span>
  )
}
