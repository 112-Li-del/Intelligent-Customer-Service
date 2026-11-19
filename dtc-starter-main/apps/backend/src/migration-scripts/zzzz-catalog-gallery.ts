import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import catalog from "../scripts/catalog-preview-products.json"

const galleryViews = ["angle", "detail", "context"]

export default async function expandCatalogGallery({ container }: { container: MedusaContainer }) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "images.id", "images.url", "images.rank"],
    filters: { handle: catalog.map(({ handle }) => handle) },
  })

  for (const product of products) {
    const images = (product.images ?? []).flatMap((image) => image ? [image] : [])
    const existingUrls = new Set(images.map(({ url }) => url))
    const firstNewRank = Math.max(-1, ...images.map(({ rank }) => rank ?? 0)) + 1
    const additions = galleryViews
      .map((view) => `/catalog-preview/gallery/${product.handle}-${view}.webp`)
      .filter((url) => !existingUrls.has(url))
      .map((url, index) => ({ url, rank: firstNewRank + index }))

    if (additions.length) {
      await updateProductsWorkflow(container).run({
        input: {
          selector: { id: product.id },
          update: { images: [...images, ...additions] },
        },
      })
    }
  }
}
