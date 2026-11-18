import type { VariantPrice } from "types/global"

export default function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  const parts = new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: price.currency_code,
  }).formatToParts(price.calculated_price_number)

  const currency = parts.find((part) => part.type === "currency")?.value
  const integer = parts
    .filter((part) => part.type === "integer" || part.type === "group")
    .map((part) => part.value)
    .join("")
  const decimal = parts.find((part) => part.type === "decimal")?.value || ""
  const fraction = parts.find((part) => part.type === "fraction")?.value || ""

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span
        className="flex items-start font-medium text-brand-ink"
        data-testid="price"
        data-value={price.calculated_price_number}
        aria-label={price.calculated_price}
      >
        {currency && <span className="mr-0.5 mt-0.5 text-xs">{currency}</span>}
        <span className="text-2xl leading-7">{integer}</span>
        {(decimal || fraction) && (
          <span className="mt-0.5 text-xs">
            {decimal}
            {fraction}
          </span>
        )}
      </span>
      {price.price_type === "sale" && (
        <span
          className="text-xs text-gray-500 line-through"
          data-testid="original-price"
        >
          {price.original_price}
        </span>
      )}
    </div>
  )
}
