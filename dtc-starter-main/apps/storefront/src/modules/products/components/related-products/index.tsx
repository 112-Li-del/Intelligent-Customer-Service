import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // edit this function to define your related products logic
  const queryParams: HttpTypes.StoreProductListParams = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  if (product.tags) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return response.products.filter(
      (responseProduct) => responseProduct.id !== product.id
    )
  })

  if (!products.length) {
    return null
  }

  return (
    <section
      className="product-page-constraint"
      aria-labelledby="related-products-title"
    >
      <div className="mb-6 flex items-end justify-between border-b border-gray-200 pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B12704]">
            继续逛逛
          </span>
          <h2
            id="related-products-title"
            className="mt-1 text-2xl font-bold text-brand-ink"
          >
            相关商品推荐
          </h2>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-5 small:grid-cols-3 small:gap-x-5 medium:grid-cols-4">
        {products.map((product) => (
          <li key={product.id}>
            <Product region={region} product={product} />
          </li>
        ))}
      </ul>
    </section>
  )
}
