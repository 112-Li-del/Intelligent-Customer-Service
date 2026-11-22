import { readdir } from "node:fs/promises"
import { resolve } from "node:path"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { createInventoryLevelsWorkflow, createProductsWorkflow } from "@medusajs/medusa/core-flows"
import previewCatalog from "./catalog-preview-products.json"
import { catalog as newHuaweiModels, expectedVariants } from "./import-new-huawei-products"
import { huaweiVariants } from "./seed-catalog-preview"
import { COLORS } from "./update-huawei-colors-safe"

const baseHandle = "huawei-pura-90-pro-max"
const baseModel = previewCatalog.find(({ handle }) => handle === baseHandle)!

const products = [
  {
    ...baseModel,
    thumbnail: `${baseHandle}.webp`,
    versionTitle: "存储容量",
    variants: COLORS.flatMap((color, index) => huaweiVariants.map(({ sku, value, price }) => ({
      color, version: value, price, sku: index === 0 ? sku : `${sku}-C${index + 1}`,
    }))),
    details: { specs: baseModel.specs, reviews: baseModel.reviews },
  },
  ...newHuaweiModels.map((item) => ({
    ...item,
    material: undefined,
    thumbnail: `${item.handle}-black-main.webp`,
    variants: expectedVariants(item),
    details: { specs: item.specs, reviews: [] },
  })),
]

export default async function importHuaweiPreview({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const handles = products.map(({ handle }) => handle)
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.sku"],
    filters: { handle: handles },
  })

  for (const product of existing) {
    const expected = products.find(({ handle }) => handle === product.handle)!
    const actualSkus = new Set(product.variants?.map(({ sku }) => sku))
    if (product.variants?.length !== expected.variants.length ||
        expected.variants.some(({ sku }) => !actualSkus.has(sku))) {
      throw new Error(`Existing product has different variants: ${product.handle}`)
    }
  }

  const imageRoot = resolve("../storefront/public/catalog-preview")
  const [mainFiles, galleryFiles] = await Promise.all([
    readdir(imageRoot), readdir(resolve(imageRoot, "gallery")),
  ])
  const plans = products.map((product) => {
    if (!mainFiles.includes(product.thumbnail)) throw new Error(`Missing image: ${product.thumbnail}`)
    const related = (file: string) => file.toLowerCase().startsWith(`${product.handle}-`) && file.endsWith(".webp")
    const paths = [
      product.thumbnail,
      ...mainFiles.filter((file) => related(file) && file !== product.thumbnail).sort(),
      ...galleryFiles.filter(related).sort().map((file) => `gallery/${file}`),
    ]
    const images = paths.map((path) => ({ url: `/catalog-preview/${path.split("/").map(encodeURIComponent).join("/")}` }))
    return { product, images, exists: existing.some(({ handle }) => handle === product.handle) }
  })

  const { data: [store] } = await query.graph({ entity: "store", fields: ["default_sales_channel_id"] })
  const { data: [category] } = await query.graph({
    entity: "product_category", fields: ["id"], filters: { handle: "digital-accessories" },
  })
  const { data: [profile] } = await query.graph({
    entity: "shipping_profile", fields: ["id"], filters: { type: "default" },
  })
  const { data: [warehouse] } = await query.graph({
    entity: "stock_location", fields: ["id"], filters: { name: "European Warehouse" },
  })
  const salesChannelId = store?.default_sales_channel_id
  if (!salesChannelId || !category || !profile || !warehouse) {
    throw new Error("Missing preview catalog category, sales channel, shipping profile or warehouse")
  }

  console.log(plans.map(({ product, images, exists }) => ({
    handle: product.handle, exists, variants: product.variants.length, images: images.length,
  })))
  if (process.env.HUAWEI_PREVIEW_IMPORT_APPLY !== "YES") return

  for (const { product, images, exists } of plans) {
    if (exists) continue
    const versions = [...new Set(product.variants.map(({ version }) => version))]
    const colors = [...new Set(product.variants.map(({ color }) => color))]
    await createProductsWorkflow(container).run({
      input: { products: [{
        handle: product.handle,
        title: product.title ?? product.handle,
        description: product.description,
        material: product.material,
        status: ProductStatus.PUBLISHED,
        thumbnail: images[0].url,
        images,
        category_ids: [category.id],
        sales_channels: [{ id: salesChannelId }],
        shipping_profile_id: profile.id,
        metadata: { preview_details: product.details },
        options: [
          { title: product.versionTitle, values: versions },
          { title: "颜色", values: colors },
        ],
        variants: product.variants.map(({ sku, price, color, version }) => ({
          title: `${color} ${version}`,
          sku,
          manage_inventory: true,
          options: { [product.versionTitle]: version, 颜色: color },
          prices: [{ currency_code: "cny", amount: price }],
        })),
      }] },
    })
  }

  const skus = products.flatMap(({ variants }) => variants.map(({ sku }) => sku))
  const { data: inventory } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku", "location_levels.location_id"],
    filters: { sku: skus },
  })
  if (inventory.length !== skus.length || new Set(inventory.map(({ sku }) => sku)).size !== skus.length) {
    throw new Error("One inventory item per Huawei SKU is required")
  }
  const missingLevels = inventory.filter(({ location_levels }) =>
    !location_levels?.some((level) => level?.location_id === warehouse.id)
  )
  if (missingLevels.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: missingLevels.map(({ id }) => ({
        inventory_item_id: id, location_id: warehouse.id, stocked_quantity: 30,
      })) },
    })
  }
  console.log(`Verified ${skus.length} inventory items. Created ${missingLevels.length} stock levels.`)
}
