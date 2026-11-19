import { getProductPrice } from "@lib/util/get-product-price"
import { getPreviewProductDetails, summarizePreviewReviews } from "@lib/util/preview-product-details"
import { HttpTypes } from "@medusajs/types"
import { ReactNode } from "react"
import ProductReviewSummary from "../product-review-summary"
import ProductCard from "./product-card"
import PreviewPrice from "./price"

export default function ProductPreview({
  product,
  isFeatured,
  region: _region,
  fallbackPrice,
  indexedReviews,
  isLoading,
}: {
  product: Pick<HttpTypes.StoreProduct, "id" | "title" | "handle" | "thumbnail"> &
    Partial<Pick<HttpTypes.StoreProduct, "images" | "tags" | "variants" | "metadata">>
  isFeatured?: boolean
  region?: HttpTypes.StoreRegion
  fallbackPrice?: ReactNode
  indexedReviews?: { rating?: number | null; count?: number | null }
  isLoading?: boolean
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const { reviews } = getPreviewProductDetails(product.metadata)
  const reviewSummary = product.metadata === undefined && indexedReviews
    ? indexedReviews
    : summarizePreviewReviews(reviews)
  const badge = cheapestPrice?.price_type === "sale"
    ? "限时优惠"
    : isFeatured || product.tags?.some(({ value }) => /^(bestseller|热销)$/i.test(value))
    ? "热销"
    : "来财精选"

  return (
    <ProductCard
      product={product}
      badge={badge}
      isLoading={isLoading}
      review={<ProductReviewSummary {...reviewSummary} />}
      price={cheapestPrice ? <PreviewPrice price={cheapestPrice} /> : fallbackPrice}
    />
  )
}
