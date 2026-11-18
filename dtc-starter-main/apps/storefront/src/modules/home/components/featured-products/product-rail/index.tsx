import { HttpTypes } from "@medusajs/types"
import { ArrowRight, Sparkles } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

type ProductRailProps = {
  id: string
  title: string
  description: string
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  href: string
}

export default function ProductRail({
  id,
  title,
  description,
  products,
  region,
  href,
}: ProductRailProps) {
  if (!products.length) {
    return null
  }

  return (
    <section
      id={id}
      className="content-container scroll-mt-32"
      aria-labelledby={`${id}-title`}
    >
      <div className="store-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 xsmall:flex-row xsmall:items-center xsmall:justify-between small:px-7">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#B12704]" />
              <h2
                id={`${id}-title`}
                className="text-xl font-bold text-brand-ink small:text-2xl"
              >
                {title}
              </h2>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 small:text-sm">
              {description}
            </p>
          </div>
          <LocalizedClientLink
            href={href}
            className="flex w-fit shrink-0 items-center gap-1.5 text-sm font-semibold text-[#007185] hover:text-[#C7511F] hover:underline"
          >
            查看全部
            <ArrowRight className="h-4 w-4" />
          </LocalizedClientLink>
        </div>

        <ul className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto p-4 small:grid small:grid-cols-3 small:overflow-visible small:p-6 medium:grid-cols-4">
          {products.map((product) => (
            <li
              key={product.id}
              className="w-[76vw] max-w-[310px] shrink-0 snap-start xsmall:w-[42vw] small:w-auto small:max-w-none"
            >
              <ProductPreview product={product} region={region} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
