import React, { Suspense } from "react"
import { getPreviewProductDetails } from "@lib/util/preview-product-details"

import { HttpTypes } from "@medusajs/types"
import { ChevronRight } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ImageGallery from "@modules/products/components/image-gallery"
import VariantImageGallery from "@modules/products/components/image-gallery/variant-image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductBreadcrumbBack from "@modules/products/components/product-breadcrumb-back"
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
  const category = product.categories?.find((entry) =>
    entry.handle && entry.name &&
    !("is_active" in entry && entry.is_active === false) &&
    !("is_internal" in entry && entry.is_internal === true)
  )
  const breadcrumbs = [
    { title: "商城首页", href: "/" },
    { title: "全部商品", href: "/store" },
    ...(category ? [{
      title: category.name,
      href: `/categories/${category.handle.split("/").map(encodeURIComponent).join("/")}`,
    }] : []),
  ]

  return (
    <>
      <nav
        aria-label="商品面包屑"
        className="content-container flex flex-col items-start gap-y-1 pb-3 pt-2 text-xs leading-5 text-gray-600 xsmall:flex-row xsmall:items-center xsmall:gap-x-3 small:text-[13px]"
      >
        <ProductBreadcrumbBack countryCode={countryCode} />
        <span aria-hidden="true" className="hidden h-3.5 w-px shrink-0 bg-gray-300 xsmall:block" />
        <ol className="flex max-w-full min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
          {breadcrumbs.map(({ title, href }) => (
            <li key={href} className="inline-flex max-w-full min-w-0 items-center gap-1.5">
              <LocalizedClientLink href={href} className="min-w-0 truncate rounded-sm hover:text-[#C7511F] hover:underline">
                {title}
              </LocalizedClientLink>
              <ChevronRight aria-hidden="true" className="h-3 w-3 shrink-0 text-gray-400" />
            </li>
          ))}
          <li aria-current="page" className="min-w-0 max-w-[min(100%,200px)] truncate text-gray-500 small:max-w-xs" title={product.title}>
            {product.title}
          </li>
        </ol>
      </nav>
      <div
        className="content-container grid grid-cols-1 gap-5 pb-6 small:grid-cols-2 medium:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_300px] xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_330px]"
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
