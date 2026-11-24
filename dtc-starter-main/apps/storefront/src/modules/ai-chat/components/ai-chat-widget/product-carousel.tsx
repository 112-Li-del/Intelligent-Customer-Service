import type { AiProductRecommendation } from "../../types"
import ProductCard from "./product-card"

export default function ProductCarousel({
  products,
}: {
  products?: AiProductRecommendation[]
}) {
  if (!products?.length) return null
  return (
    <div
      role="region"
      aria-label="推荐商品"
      tabIndex={0}
      onKeyDown={(event) => {
        if (
          event.target !== event.currentTarget ||
          !["ArrowLeft", "ArrowRight"].includes(event.key)
        )
          return
        const rail = event.currentTarget
        if (rail.scrollWidth <= rail.clientWidth) return
        event.preventDefault()
        rail.scrollBy({
          left:
            (event.key === "ArrowRight" ? 1 : -1) *
            ((rail.firstElementChild?.clientWidth ?? rail.clientWidth) + 8),
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        })
      }}
      className="mt-3 grid auto-cols-[min(85%,14rem)] grid-flow-col snap-x snap-mandatory gap-2 overflow-x-auto pb-2 small:grid-flow-row small:grid-cols-2"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
