import { isVariantInStock } from "@lib/util/inventory"
import { StarSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ReactNode } from "react"
import Thumbnail from "../thumbnail"
import CardCartAction from "./card-cart-action"

export default function ProductCard({
  product,
  badge,
  price,
  isLoading,
}: {
  product: Pick<HttpTypes.StoreProduct, "id" | "title" | "handle" | "thumbnail"> &
    Partial<Pick<HttpTypes.StoreProduct, "images" | "variants">>
  badge: string
  price: ReactNode
  isLoading?: boolean
}) {
  const href = `/products/${product.handle}`
  const seed = Array.from(product.id).reduce(
    (total, character) => total + character.charCodeAt(0), 0
  )
  const rating = (4.6 + (seed % 4) / 10).toFixed(1)
  const variants = product.variants
  const inStock = variants?.some(isVariantInStock)
  const onHand = variants?.some(
    (variant) => !variant.manage_inventory || (variant.inventory_quantity ?? 0) > 0
  )

  return (
    <article
      data-testid="product-wrapper"
      className="flex h-full min-w-0 flex-col rounded-lg border border-gray-200 bg-white p-2.5 transition-shadow hover:shadow-md small:p-3.5"
    >
      <LocalizedClientLink href={href} className="group block rounded-md">
        <div className="relative">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            alt=""
            size="square"
            className="rounded-md border-0 bg-[#F7F8F8] shadow-none group-hover:shadow-none [&_img]:object-contain"
          />
          <span className={`absolute left-1.5 top-1.5 rounded px-2 py-1 text-[10px] font-bold text-white ${badge === "AI 严选" ? "bg-brand-navy" : "bg-[#B12704]"}`}>
            {badge}
          </span>
        </div>
        <h3 className="mt-2.5 line-clamp-2 h-10 break-words text-sm font-semibold leading-5 group-hover:text-[#B12704]" data-testid="product-title">
          {product.title}
        </h3>
      </LocalizedClientLink>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
        <span className="flex text-[#E98A0C]" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <StarSolid key={index} className="h-3 w-3" />
          ))}
        </span>
        <span className="font-semibold text-brand-ink">{rating}</span>
        <span className="text-[10px] text-gray-500">演示评分</span>
      </div>
      <div className="mt-2 flex-1">
        {price ?? <span className="text-xs text-gray-500">价格见详情</span>}
      </div>
      <p className={`mb-2 mt-1 text-xs font-medium ${inStock ? "text-[#007600]" : "text-gray-500"}`}>
        {onHand ? "现货速发" : inStock ? "可预订" : isLoading ? "正在确认库存" : variants ? "暂时缺货" : "库存见详情"}
      </p>
      <CardCartAction
        href={href}
        variantId={variants?.length === 1 && inStock ? variants[0].id : undefined}
        label={inStock ? variants?.length === 1 ? "加入购物车" : "选规格加入购物车" : "查看详情"}
      />
    </article>
  )
}
