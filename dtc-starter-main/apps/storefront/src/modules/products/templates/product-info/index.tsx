import { HttpTypes } from "@medusajs/types"
import { ArrowPath, ShieldCheck, StarSolid, TruckFast } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const seed = Array.from(product.id).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  )
  const demoRating = (4.6 + (seed % 4) / 10).toFixed(1)
  const demoReviewCount = 32 + (seed % 268)

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {product.collection && (
            <LocalizedClientLink
              href={`/collections/${product.collection.handle}`}
              className="font-medium text-[#007185] hover:text-[#C7511F] hover:underline"
            >
              {product.collection.title}
            </LocalizedClientLink>
          )}
          <span className="rounded-full bg-[#FFF3E0] px-2.5 py-1 text-xs font-semibold text-[#8A4B08]">
            知选精选
          </span>
        </div>

        <h1
          className="text-2xl font-semibold leading-9 text-brand-ink small:text-3xl small:leading-[42px]"
          data-testid="product-title"
        >
          {product.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-gray-100 pb-4 text-sm">
          <span
            className="flex items-center text-[#FFA41C]"
            aria-label={`演示评分 ${demoRating} 分`}
          >
            {Array.from({ length: 5 }, (_, index) => (
              <StarSolid key={index} className="h-4 w-4" />
            ))}
          </span>
          <span className="font-semibold text-brand-ink">{demoRating}</span>
          <span className="text-gray-500">{demoReviewCount} 条演示评价</span>
        </div>

        <div className="grid gap-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-600 xsmall:grid-cols-3">
          <div className="flex items-center gap-2">
            <TruckFast className="h-5 w-5 shrink-0 text-brand-navy-light" />
            <span>配送时效以结算页为准</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0 text-brand-navy-light" />
            <span>交易与售后保障</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowPath className="h-5 w-5 shrink-0 text-brand-navy-light" />
            <span>退换以商城政策为准</span>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-brand-ink">商品介绍</h2>
          <p
            className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600"
            data-testid="product-description"
          >
            {product.description ||
              "商家暂未提供商品介绍，可查看下方规格或咨询 AI 客服。"}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProductInfo
