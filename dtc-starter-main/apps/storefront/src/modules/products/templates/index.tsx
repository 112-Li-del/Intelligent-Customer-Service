import React, { Suspense } from "react"
import { getPreviewProductDetails } from "@lib/util/preview-product-details"

import { HttpTypes } from "@medusajs/types"
import ImageGallery from "@modules/products/components/image-gallery"
import VariantImageGallery from "@modules/products/components/image-gallery/variant-image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const { reviews } = getPreviewProductDetails(product.metadata)

  return (
    <>
      <div
        className="content-container grid grid-cols-1 gap-5 py-6 small:grid-cols-2 medium:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_300px] xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_330px]"
        data-testid="product-container"
      >
        <div className="min-w-0 medium:sticky medium:top-32 medium:self-start">
          <Suspense fallback={<ImageGallery images={product.images ?? []} thumbnail={product.thumbnail} title={product.title} />}>
            <VariantImageGallery product={product} />
          </Suspense>
        </div>

        <div className="min-w-0">
          <div className="store-card p-5 small:p-7">
            <ProductInfo product={product} />
            <div className="mt-7 border-t border-gray-100 pt-2">
              <ProductTabs product={product} />
            </div>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-y-4 small:col-start-2 medium:sticky medium:top-32 medium:col-start-auto medium:self-start">
          <ProductOnboardingCta />
          <ProductActions product={product} region={region} />
        </aside>
      </div>

      {reviews.length > 0 && (
        <div className="content-container my-8">
          <section id="product-reviews" className="store-card scroll-mt-32 p-5 small:p-7">
            <h2 className="text-xl font-semibold text-brand-ink">商品评价</h2>
            <p className="mt-1 text-sm text-gray-500">以下为模拟购物场景的样例评价。</p>
            <ul className="mt-4 divide-y divide-gray-100">
              {reviews.map(({ author, rating, text }) => (
                <li key={`${author}-${text}`} className="py-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-medium text-brand-ink">{author}</span>
                    <span className="font-medium text-[#8A4B08]">{rating} / 5</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-700">{text}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <div
        className="content-container my-8 small:my-12"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
