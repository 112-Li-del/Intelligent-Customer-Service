import { HttpTypes } from "@medusajs/types"
import { ArrowPath, ShieldCheck, TruckFast } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getPreviewProductDetails, summarizePreviewReviews } from "@lib/util/preview-product-details"
import ProductReviewSummary from "@modules/products/components/product-review-summary"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const specification = (key: string) => {
    const value = product.metadata?.[key]
    return typeof value === "string" ? value.trim() : ""
  }
  const materials = product.options?.find(({ title }) => /^(材质|面料|material)$/i.test(title))
  const coreSpecs = [
    ["材质", product.material || specification("material") || materials?.values?.map(({ value }) => value).join(" / ")],
    ["版型", specification("fit")],
    ["适用季节", specification("season")],
    ["发货地", specification("shipping_origin")],
  ]
  const { specs: previewSpecs, reviews } = getPreviewProductDetails(product.metadata)
  const specs = previewSpecs.length ? previewSpecs : coreSpecs
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
          <span className="rounded-full border border-[#FDDFA0] bg-gradient-to-r from-[#FFF3E0] to-[#FDE8C0] px-2.5 py-1 text-xs font-semibold text-[#8A5010]">
            <span aria-hidden="true">✦ </span>来财精选
          </span>
        </div>

        <h1
          className="font-serif text-2xl font-bold leading-9 tracking-[-0.02em] text-brand-ink small:text-3xl small:leading-[42px]"
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

        <div className="grid gap-3 rounded-xl border border-[#EDE8DF] bg-gradient-to-r from-[#F7F5F0] to-[#FAFAF8] p-4 text-sm text-gray-600 xsmall:grid-cols-3">
          <div className="flex items-center gap-2">
            <TruckFast className="h-5 w-5 shrink-0 text-brand-amber" />
            <span>配送时效以结算页为准</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0 text-brand-amber" />
            <span>交易与售后保障</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowPath className="h-5 w-5 shrink-0 text-brand-amber" />
            <span>退换以商城政策为准</span>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-brand-ink">商品介绍</h2>
          <p
            className="mt-3 whitespace-pre-line text-sm leading-8 text-[#4A4A4A]"
            data-testid="product-description"
          >
            {product.description ||
              "商家暂未提供商品介绍，可查看下方规格或咨询 AI 客服。"}
          </p>
        </div>
        <section aria-labelledby="core-specs-title">
          <h2 id="core-specs-title" className="text-sm font-semibold text-brand-ink">核心规格速览</h2>
          <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#EDE8DF] bg-[#EDE8DF]">
            {specs.map(([label, value]) => (
              <div key={label} className="min-w-0 bg-gradient-to-b from-white to-[#FAFAF8] px-3 py-2.5">
                <dt className="text-xs font-medium text-brand-navy/65">{label}</dt>
                <dd className="mt-1 break-words text-sm font-medium text-brand-ink">{value || "商家待补充"}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )
}

export default ProductInfo
