import { getProductPrice } from "@lib/util/get-product-price"
import { isVariantInStock } from "@lib/util/inventory"
import { HttpTypes } from "@medusajs/types"
import { StarSolid, TruckFast } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default function ProductPreview({
  product,
  isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const seed = Array.from(product.id).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  )
  const demoRating = (4.6 + (seed % 4) / 10).toFixed(1)
  const demoReviewCount = 32 + (seed % 268)
  const inStock = product.variants?.some(isVariantInStock) ?? false

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block h-full rounded-lg focus-visible:ring-offset-4"
      aria-label={`查看商品：${product.title}`}
    >
      <article
        data-testid="product-wrapper"
        className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-gray-300 group-hover:shadow-card-hover"
      >
        <div className="relative">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            alt={product.title}
            size="square"
            className="rounded-md border-0 bg-[#F7F7F7] p-3 shadow-none group-hover:shadow-none"
          />
          <span
            className={`absolute left-2 top-2 rounded px-2 py-1 text-[10px] font-bold shadow-sm ${
              cheapestPrice?.price_type === "sale"
                ? "bg-[#CC0C39] text-white"
                : "bg-brand-navy text-white"
            }`}
          >
            {cheapestPrice?.price_type === "sale"
              ? "限时优惠"
              : isFeatured
              ? "知选精选"
              : "品质好物"}
          </span>
        </div>

        <h3
          className="mt-4 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-brand-ink group-hover:text-[#C7511F]"
          data-testid="product-title"
        >
          {product.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
          <span
            className="flex items-center text-[#FFA41C]"
            aria-label={`演示评分 ${demoRating} 分`}
          >
            {Array.from({ length: 5 }, (_, index) => (
              <StarSolid key={index} className="h-3.5 w-3.5" />
            ))}
          </span>
          <span className="font-semibold text-brand-ink">{demoRating}</span>
          <span className="text-gray-500">({demoReviewCount})</span>
          <span className="text-[10px] text-gray-400">演示评分</span>
        </div>

        <div className="mt-3">
          {cheapestPrice ? (
            <PreviewPrice price={cheapestPrice} />
          ) : (
            <span className="text-sm text-gray-500">价格以详情页为准</span>
          )}
        </div>

        <div className="mt-auto pt-3 text-xs">
          <p
            className={inStock ? "font-medium text-[#007600]" : "text-gray-500"}
          >
            {inStock ? "现货供应" : "库存以详情页为准"}
          </p>
          <p className="mt-1.5 flex items-center gap-1 text-gray-500">
            <TruckFast className="h-4 w-4" />
            配送时效以结算页为准
          </p>
        </div>
      </article>
    </LocalizedClientLink>
  )
}
