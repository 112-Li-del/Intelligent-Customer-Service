import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { ReactNode } from "react"
import ProductCard from "./product-card"
import PreviewPrice from "./price"

export default function ProductPreview({
  product,
  isFeatured,
  region: _region,
  fallbackPrice,
  isLoading,
}: {
  product: Pick<HttpTypes.StoreProduct, "id" | "title" | "handle" | "thumbnail"> &
    Partial<Pick<HttpTypes.StoreProduct, "images" | "tags" | "variants">>
  isFeatured?: boolean
  region?: HttpTypes.StoreRegion
  fallbackPrice?: ReactNode
  isLoading?: boolean
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const badge = cheapestPrice?.price_type === "sale"
    ? "限时优惠"
    : isFeatured || product.tags?.some(({ value }) => /^(bestseller|热销)$/i.test(value))
    ? "热销"
    : "AI 严选"

  return (
    <ProductCard
      product={product}
      badge={badge}
      isLoading={isLoading}
      price={cheapestPrice ? <PreviewPrice price={cheapestPrice} /> : fallbackPrice}
    />
  )
}
