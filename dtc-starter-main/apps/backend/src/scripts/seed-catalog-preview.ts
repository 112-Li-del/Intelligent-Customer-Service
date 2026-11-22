import { isDeepStrictEqual } from "node:util"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import catalog from "./catalog-preview-products.json"

const categories = {
  kitchen: "厨房餐饮",
  "home-care": "家居清洁",
  "digital-accessories": "数码配件",
  "office-supplies": "办公文具",
  "sports-outdoors": "运动户外",
  "pet-supplies": "宠物用品",
}

const skuFor = (handle: string) => `ZX-${handle.toUpperCase()}`

export const huaweiVariants = [
  { value: "12GB+256GB", sku: "ZX-HUAWEI-PURA-90-PRO-MAX-12-256", price: 6499 },
  { value: "12GB+512GB", sku: "ZX-HUAWEI-PURA-90-PRO-MAX-12-512", price: 6999 },
  { value: "16GB+512GB", sku: "ZX-HUAWEI-PURA-90-PRO-MAX-16-512", price: 7499 },
  { value: "16GB+1TB", sku: "ZX-HUAWEI-PURA-90-PRO-MAX-16-1TB", price: 8499 },
]

export default async function seedCatalogPreview({ container }: Pick<ExecArgs, "container">) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { data: [store] } = await query.graph({
    entity: "store",
    fields: ["default_sales_channel_id"],
  })
  const { data: [warehouse] } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
    filters: { name: "European Warehouse" },
  })
  const { data: [shippingProfile] } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    filters: { type: "default" },
  })
  if (!store?.default_sales_channel_id || !warehouse || !shippingProfile) {
    throw new Error("Run the starter database migrations before seeding the preview catalog.")
  }

  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
    filters: { handle: Object.keys(categories) },
  })
  const categoryIds = new Map(existingCategories.map(({ id, handle }) => [handle, id]))
  const missing = Object.entries(categories)
    .filter(([handle]) => !categoryIds.has(handle))
    .map(([handle, name]) => ({ handle, name, is_active: true }))
  if (missing.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: missing },
    })
    result.forEach(({ id, handle }) => categoryIds.set(handle, id))
  }

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata"],
    filters: { handle: catalog.map(({ handle }) => handle) },
  })
  const existingByHandle = new Map(existingProducts.map((product) => [product.handle, product]))

  for (const item of catalog) {
    const existing = existingByHandle.get(item.handle)
    const previewDetails = { specs: item.specs, reviews: item.reviews }
    if (existing) {
      if (!isDeepStrictEqual(existing.metadata?.preview_details, previewDetails)) {
        await updateProductsWorkflow(container).run({
          input: {
            selector: { id: existing.id },
            update: { metadata: { ...existing.metadata, preview_details: previewDetails } },
          },
        })
      }
      continue
    }
    if (!item.category || !item.title || !item.price) {
      continue
    }

    const categoryId = categoryIds.get(item.category)
    if (!categoryId) {
      throw new Error(`Missing category ${item.category}`)
    }
    const thumbnail = `/catalog-preview/${item.handle}.webp`
    await createProductsWorkflow(container).run({
      input: {
        products: [{
          title: item.title,
          handle: item.handle,
          description: item.description,
          material: item.material,
          status: ProductStatus.PUBLISHED,
          thumbnail,
          images: [{ url: thumbnail }],
          category_ids: [categoryId],
          sales_channels: [{ id: store.default_sales_channel_id }],
          shipping_profile_id: shippingProfile.id,
          metadata: { preview_details: previewDetails },
          options: item.handle === "huawei-pura-90-pro-max"
            ? [{
                title: "存储容量",
                values: huaweiVariants.map(({ value }) => value),
              }]
            : [{ title: "款式", values: ["标准款"] }],
          variants: item.handle === "huawei-pura-90-pro-max"
            ? huaweiVariants.map(({ value, sku, price }) => ({
                title: value,
                sku,
                manage_inventory: true,
                options: { 存储容量: value },
                prices: [{ currency_code: "cny", amount: price }],
              }))
            : [{
                title: "标准款",
                sku: skuFor(item.handle),
                manage_inventory: true,
                options: { 款式: "标准款" },
                prices: [{ currency_code: "cny", amount: item.price }],
              }],
        }],
      },
    })
  }

  const previewSkus = catalog
    .filter((item) => item.category)
    .flatMap(({ handle }) =>
      handle === "huawei-pura-90-pro-max"
        ? huaweiVariants.map(({ sku }) => sku)
        : [skuFor(handle)]
    )
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "location_levels.location_id"],
    filters: { sku: previewSkus },
  })
  const unstockedItems = inventoryItems.filter(
    (item) => !item.location_levels?.some((level) => level?.location_id === warehouse.id)
  )
  if (unstockedItems.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: unstockedItems.map(({ id }) => ({
          inventory_item_id: id,
          location_id: warehouse.id,
          stocked_quantity: 30,
        })),
      },
    })
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle: catalog.map(({ handle }) => handle) },
  })
  const search = container.resolve(Modules.SEARCH)
  const indexes = await search.listIndexes()
  // On a fresh database, Medusa seeds the product index at backend startup.
  if (indexes.some((index) => index.name === "product" && index.status === "ready")) {
    await search.ingest({
      name: "product.created",
      data: products.map(({ id }) => ({ id })),
    })
  }
  logger.info(`Preview catalog ready: ${products.length} products.`)
}
