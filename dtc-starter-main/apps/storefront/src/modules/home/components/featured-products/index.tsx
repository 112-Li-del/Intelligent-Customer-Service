import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import DiscoveryCards from "@modules/home/components/discovery-cards"
import ProductRail from "@modules/home/components/featured-products/product-rail"

export default async function FeaturedProducts({
  collections,
  region,
}: {
  collections: HttpTypes.StoreCollection[]
  region: HttpTypes.StoreRegion
}) {
  const [featuredResult, newestResult] = await Promise.all([
    listProducts({
      regionId: region.id,
      queryParams: { limit: 8 },
    }),
    listProducts({
      regionId: region.id,
      queryParams: { limit: 8, order: "-created_at" },
    }),
  ])

  const featuredProducts = featuredResult.response.products
  const newestProducts = newestResult.response.products

  return (
    <>
      <DiscoveryCards products={featuredProducts} collections={collections} />
      <div className="mt-8 space-y-8 pb-2">
        <ProductRail
          id="popular-products"
          title="好物优选 · 为你精选"
          description="从商城真实商品中精选，价格与规格一目了然"
          products={featuredProducts}
          region={region}
          href="/store"
        />
        <ProductRail
          id="new-products"
          title="新品速递 · 抢先逛"
          description="按上架时间排序，看看最近有哪些新选择"
          products={newestProducts}
          region={region}
          href="/store"
        />
      </div>
    </>
  )
}
