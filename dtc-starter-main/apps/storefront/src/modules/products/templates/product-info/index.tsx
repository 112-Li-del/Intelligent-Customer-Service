import { HttpTypes } from "@medusajs/types"
import { ArrowPath, ShieldCheck, TruckFast } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getPreviewProductDetails, summarizePreviewReviews } from "@lib/util/preview-product-details"
import ProductReviewSummary from "@modules/products/components/product-review-summary"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const { specs, reviews } = getPreviewProductDetails(product.metadata)
  const reviewSummary = summarizePreviewReviews(reviews)

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

        {reviewSummary.count ? (
          <a href="#product-reviews" className="flex w-fit items-center gap-2 text-sm hover:underline">
            <ProductReviewSummary {...reviewSummary} />
          </a>
        ) : (
          <ProductReviewSummary {...reviewSummary} />
        )}

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

        {specs.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-brand-ink">商品参数与使用说明</h2>
            <dl className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-100 text-sm">
              {specs.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[5.5rem_1fr] gap-2 p-3">
                  <dt className="font-medium text-brand-ink">{label}</dt>
                  <dd className="leading-6 text-gray-600">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductInfo
