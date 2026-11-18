import React, { Suspense } from "react"

import { HttpTypes } from "@medusajs/types"
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

  return (
    <>
      <div
        className="content-container grid grid-cols-1 gap-6 py-6 small:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_300px] small:gap-8 medium:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_330px]"
        data-testid="product-container"
      >
        <div className="min-w-0 small:sticky small:top-32 small:self-start">
          <VariantImageGallery product={product} />
        </div>

        <div className="min-w-0">
          <div className="store-card p-5 small:p-7">
            <ProductInfo product={product} />
            <div className="mt-7 border-t border-gray-100 pt-2">
              <ProductTabs product={product} />
            </div>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-y-4 small:sticky small:top-32 small:self-start">
          <ProductOnboardingCta />
          <ProductActions product={product} region={region} />
        </aside>
      </div>

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
