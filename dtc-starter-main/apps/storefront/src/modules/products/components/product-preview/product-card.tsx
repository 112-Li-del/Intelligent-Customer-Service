import { isVariantInStock } from "@lib/util/inventory"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ReactNode } from "react"
import Thumbnail from "../thumbnail"
import CardCartAction from "./card-cart-action"

export default function ProductCard({
  product,
  badge,
  price,
  review,
  isLoading,
}: {
  product: Pick<HttpTypes.StoreProduct, "id" | "title" | "handle" | "thumbnail"> &
    Partial<Pick<HttpTypes.StoreProduct, "images" | "variants">>
  badge: string
  price: ReactNode
  review: ReactNode
  isLoading?: boolean
}) {
  const href = `/products/${product.handle}`
  const variants = product.variants
  const inStock = variants?.some(isVariantInStock)
  const onHand = variants?.some(
    (variant) => !variant.manage_inventory || (variant.inventory_quantity ?? 0) > 0
  )

  const badgeStyle = badge === "热销"
    ? "from-[#AC3529] to-[#C54332] text-white"
    : badge === "限时优惠"
    ? "from-brand-amber to-brand-action-hover text-brand-navy"
    : "from-brand-navy to-brand-navy-light text-brand-orange"

  return (
    <article
      data-testid="product-wrapper"
      className="flex h-full min-w-0 flex-col rounded-xl border border-transparent bg-white p-2.5 shadow-card transition-[transform,box-shadow] duration-300 ease-out hover:shadow-card-hover focus-within:shadow-card-hover motion-safe:hover:-translate-y-[3px] small:p-3.5"
    >
      <LocalizedClientLink href={href} className="group block rounded-md">
        <div className="relative">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            alt=""
            size="square"
            fit="contain"
            className="rounded-lg border-0 bg-gradient-to-b from-[#FAFAFA] to-[#F0EDE8] shadow-none group-hover:shadow-none [&_img]:transition-transform [&_img]:duration-[400ms] motion-safe:group-hover:[&_img]:scale-[1.08]"
          />
          <span className={`absolute left-1.5 top-1.5 rounded-full bg-gradient-to-r px-2 py-1 text-[10px] font-bold ${badgeStyle}`}>
            {badge === "热销" && <span aria-hidden="true">🔥 </span>}{badge}
          </span>
        </div>
        <h3 className="mt-3 line-clamp-2 h-12 break-words text-sm font-semibold leading-6 group-hover:text-gradient-amber [--amber-start:#955800] [--amber-end:#784400]" data-testid="product-title">
          {product.title}
        </h3>
      </LocalizedClientLink>
      <div className="mt-1.5">{review}</div>
      <div className="mt-2 flex-1">
        {price ?? <span className="text-xs text-gray-500">价格见详情</span>}
      </div>
      <p className={`mb-2 mt-1 text-xs font-medium ${inStock ? "text-[#007600]" : "text-gray-500"}`}>
        {onHand && <span aria-hidden="true" className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#27AE60] align-middle motion-safe:animate-pulse" />}
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
