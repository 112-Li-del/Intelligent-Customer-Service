import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  setProductProductOptionsWorkflow,
  updateProductVariantsWorkflow,
  createProductVariantsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"

const HANDLE = "huawei-pura-90-pro-max"
const COLOR_OPTION_ID = "opt_01M7QRB8WQ8V1EA069FWGAE83Q"
export const COLORS = ["曜石黑", "晨曦金", "霞光紫", "橘子海", "翡翠湖"]
const CONFIG = [
  { size: "12GB+256GB", suffix: "12-256", price: 6499 },
  { size: "12GB+512GB", suffix: "12-512", price: 6999 },
  { size: "16GB+512GB", suffix: "16-512", price: 7499 },
  { size: "16GB+1TB", suffix: "16-1TB", price: 8499 },
] as const
const PREFIX = "ZX-HUAWEI-PURA-90-PRO-MAX"
const apply = process.env.HUAWEI_APPLY === "YES"

export default async function updateHuaweiColors({ container }: Pick<ExecArgs, "container">) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  async function load() {
    const { data } = await query.graph({
      entity: "product",
      fields: [
        "id", "title", "handle", "options.id", "options.title", "options.values.id", "options.values.value",
        "variants.id", "variants.sku", "variants.title", "variants.options.value", "variants.options.option.title",
        "variants.price_set.prices.currency_code", "variants.price_set.prices.amount",
        "variants.inventory_items.inventory_item_id",
      ],
      filters: { handle: HANDLE },
    })
    if (data.length !== 1) throw new Error(`Expected one product for ${HANDLE}; found ${data.length}`)
    return data[0]
  }

  const product = await load()
  const storageOption = product.options?.find((o) => o.title === "存储容量")
  if (!storageOption) throw new Error("Missing storage option")
  const colorOption = product.options?.find((o) => o.title === "颜色")
  if (colorOption && colorOption.id !== COLOR_OPTION_ID) {
    throw new Error(`Unexpected color option ${colorOption.id}`)
  }

  const expectedOriginal = new Set(CONFIG.map((c) => `${PREFIX}-${c.suffix}`))
  for (const conf of CONFIG) {
    const sku = `${PREFIX}-${conf.suffix}`
    const matches = (product.variants ?? []).filter((v) => v.sku === sku)
    if (matches.length !== 1) throw new Error(`Original variant not unique: ${sku}`)
    const variant = matches[0]
    const fields = Object.fromEntries((variant.options ?? []).map((v) => [v.option?.title, v.value]))
    if (fields["存储容量"] !== conf.size) throw new Error(`Storage mismatch: ${sku}`)
    if (fields["颜色"] && fields["颜色"] !== "曜石黑") throw new Error(`Original variant color mismatch: ${sku}`)
    const cny = (variant.price_set?.prices ?? []).find((p) => p.currency_code === "cny")
    if (Number(cny?.amount) !== conf.price) throw new Error(`Original price mismatch: ${sku}`)
    if ((variant.inventory_items ?? []).length < 1) throw new Error(`Original inventory link missing: ${sku}`)
  }

  // Refuse unknown variants rather than silently altering an unexpected catalog.
  for (const variant of product.variants ?? []) {
    if (expectedOriginal.has(variant.sku ?? "")) continue
    const match = COLORS.slice(1).some((color, index) => CONFIG.some((c) =>
      variant.sku === `${PREFIX}-${c.suffix}-C${index + 2}`
    ))
    if (!match) throw new Error(`Unexpected SKU: ${variant.sku}`)
  }

  const expected = COLORS.flatMap((color, colorIndex) => CONFIG.map((conf) => ({
    color,
    size: conf.size,
    price: conf.price,
    sku: colorIndex === 0 ? `${PREFIX}-${conf.suffix}` : `${PREFIX}-${conf.suffix}-C${colorIndex + 1}`,
  })))
  const existingSkus = new Set((product.variants ?? []).map((v) => v.sku))
  const missing = expected.filter((e) => !existingSkus.has(e.sku))
  const blackWithoutColor = (product.variants ?? []).filter((v) => expectedOriginal.has(v.sku ?? "") && !(v.options ?? []).some((o) => o.option?.title === "颜色"))

  console.log(JSON.stringify({ mode: apply ? "APPLY" : "PREVIEW", product_id: product.id,
    current_variants: product.variants?.length, color_linked: !!colorOption,
    black_variants_to_update: blackWithoutColor.length, new_variants_to_create: missing.length,
    planned_skus: missing.map((m) => m.sku), new_inventory_quantity_each: 30 }, null, 2))

  if (!apply) {
    console.log("PREVIEW ONLY: no database changes. Run with HUAWEI_APPLY=YES only after verifying this plan and DB backup.")
    return
  }

  // Link the existing shared global option, not a duplicate option with the same title.
  if (!colorOption) {
    await setProductProductOptionsWorkflow(container).run({
      input: { product_id: product.id, add: [{ product_option_id: COLOR_OPTION_ID, product_option_value_ids: [] }] },
    })
  }

  // Add phone-specific values to this product, and exclude T-shirt values from this product only.
  let current = await load()
  let selected = current.options?.find((o) => o.title === "颜色")
  if (!selected) throw new Error("Color option link was not established")
  const phoneValues = new Set((selected.values ?? []).map((v) => v.value))
  const toAdd = COLORS.filter((v) => !phoneValues.has(v)).map((value) => ({ value }))
  const toRemove = (selected.values ?? []).filter((v) => !COLORS.includes(v.value)).map((v) => v.id)
  if (toAdd.length || toRemove.length) {
    await setProductProductOptionsWorkflow(container).run({
      input: { product_id: product.id,
        update: [{ product_option_id: COLOR_OPTION_ID, add: toAdd, remove: toRemove }],
      },
    })
  }

  current = await load()
  selected = current.options?.find((o) => o.title === "颜色")
  const currentColors = (selected?.values ?? []).map((v) => v.value)
  if (currentColors.length !== COLORS.length || !COLORS.every((v) => currentColors.includes(v))) {
    throw new Error(`Unexpected phone color values: ${currentColors.join(", ")}`)
  }

  const updates = (current.variants ?? []).filter((v) => expectedOriginal.has(v.sku ?? "") &&
    !(v.options ?? []).some((o) => o.option?.title === "颜色"))
    .map((v) => ({ id: v.id, options: { "存储容量": CONFIG.find((c) => v.sku === `${PREFIX}-${c.suffix}`)!.size, "颜色": "曜石黑" } }))
  if (updates.length) {
    await updateProductVariantsWorkflow(container).run({ input: { product_variants: updates } })
  }

  current = await load()
  const present = new Set((current.variants ?? []).map((v) => v.sku))
  const toCreate = expected.filter((e) => !present.has(e.sku))
  if (toCreate.length) {
    await createProductVariantsWorkflow(container).run({
      input: { product_variants: toCreate.map((v) => ({
        product_id: product.id, title: `${v.color} ${v.size}`, sku: v.sku,
        manage_inventory: true,
        options: { "存储容量": v.size, "颜色": v.color },
        prices: [{ currency_code: "cny", amount: v.price }],
      })) },
    })
  }

  // Like the preview seed, create a stock level only where one doesn't exist.
  const { data: warehouses } = await query.graph({
    entity: "stock_location", fields: ["id", "name"], filters: { name: "European Warehouse" },
  })
  if (warehouses.length !== 1) throw new Error("Expected exactly one European Warehouse")
  const warehouseId = warehouses[0].id
  const fresh = await load()
  const createdSkus = expected.filter((e) => !expectedOriginal.has(e.sku)).map((e) => e.sku)
  const { data: inventory } = await query.graph({
    entity: "inventory_item", fields: ["id", "sku", "location_levels.location_id"],
    filters: { sku: createdSkus },
  })
  const missingInventory = createdSkus.filter((sku) => !inventory.some((i) => i.sku === sku))
  if (missingInventory.length) throw new Error(`Created variants missing inventory items: ${missingInventory.join(", ")}`)
  const noLevels = inventory.filter((i) => !(i.location_levels ?? []).some((level) => level.location_id === warehouseId))
  if (noLevels.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: noLevels.map((i) => ({
        inventory_item_id: i.id, location_id: warehouseId, stocked_quantity: 30,
      })) },
    })
  }
  if (fresh.variants?.length !== 20) throw new Error(`Expected 20 variants, found ${fresh.variants?.length}`)
  console.log("DONE: 20 variants. Re-run inspect-huawei.ts to verify variants and original IDs/prices.")
}

