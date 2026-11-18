import { StarSolid } from "@medusajs/icons"

export default function ProductReviewSummary({
  rating,
  count,
}: {
  rating?: number | null
  count?: number | null
}) {
  return (
    <span
      className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs"
      data-testid="product-review-summary"
    >
      {typeof rating === "number" && count ? (
        <>
          <StarSolid aria-hidden="true" className="h-3.5 w-3.5 text-[#FFA41C]" />
          <span className="font-semibold text-brand-ink">{rating.toFixed(1)} / 5</span>
          <span className="text-gray-500">{count} 条样例评价</span>
        </>
      ) : (
        <span className="text-gray-500">暂无评价</span>
      )}
    </span>
  )
}
