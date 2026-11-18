import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import DiscoveryCards from "@modules/home/components/discovery-cards"
import ProductRail from "@modules/home/components/featured-products/product-rail"
import Hero from "@modules/home/components/hero"

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
  const taggedBestsellers = featuredProducts.filter((product) =>
    product.tags?.some(({ value }) => /^(bestseller|热销)$/i.test(value))
  )
  const demoBestsellers = taggedBestsellers.length === 0
  const bestsellerProducts = demoBestsellers
    ? ["sweatshirt", "sweatpants", "t-shirt", "shorts"]
        .flatMap((handle) => featuredProducts.filter((product) => product.handle === handle))
    : taggedBestsellers
  const heroProducts = Array.from(new Map(
    [...bestsellerProducts, ...featuredProducts].map((product) => [product.id, product])
  ).values()).flatMap((product) => {
    const image = product.thumbnail || product.images?.[0]?.url
    return image ? [{
      handle: product.handle,
      title: product.title,
      image,
      price: getProductPrice({ product }).cheapestPrice?.calculated_price,
    }] : []
  }).slice(0, 3)

  return (
    <>
      <Hero products={heroProducts} />
      <DiscoveryCards products={featuredProducts} newestProducts={newestProducts} collections={collections} />
      <div className="mt-8 space-y-8 pb-2">
        <ProductRail
          id="popular-products"
          title="本周热销榜单"
          description={demoBestsellers ? "演示榜单 · 展示店内人气款式" : "商城热销商品精选"}
          products={bestsellerProducts.length ? bestsellerProducts : featuredProducts.slice(0, 4)}
          region={region}
          href="/store"
          isFeatured
          horizontal
        />
        <ProductRail
          id="ai-products"
          title="AI 为你精选"
          description="浏览商城精选，或向 AI 导购咨询搭配与尺码"
          products={featuredProducts}
          region={region}
          href="/store"
          horizontal
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
