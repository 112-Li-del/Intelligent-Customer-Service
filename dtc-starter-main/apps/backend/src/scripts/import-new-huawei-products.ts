import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  setProductProductOptionsWorkflow,
  updateProductVariantsWorkflow,
  createProductVariantsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"

// Default is preview. Set NEW_HUAWEI_APPLY=YES to create products/variants.
const APPLY = process.env.NEW_HUAWEI_APPLY === "YES"
const COLOR_OPTION_ID = "opt_01M7QRB8WQ8V1EA069FWGAE83Q"
const STOCK = 30
const BATCH = "huawei-new-2026-11"

export const catalog = [
  {
    handle: "huawei-mate-90-pro-max",
    title: "HUAWEI Mate 90 Pro Max",
    description: "华为 Mate 90 Pro Max，6.9 英寸双层 OLED 屏幕，配备可变光圈主摄、超广角和长焦影像系统，支持有线及无线充电。标准版与典藏版提供不同的内存及存储配置。",
    versionTitle: "版本容量",
    defaultColor: "曜石黑",
    colors: [
      { value: "曜石黑", key: "black" },
      { value: "玫瑰金", key: "gold" },
      { value: "翡冷翠", key: "green" },
      { value: "晶钻白", key: "white" },
    ],
    versions: [
      { value: "标准版 12GB+512GB", key: "STD-12-512", price: 9499 },
      { value: "标准版 16GB+512GB", key: "STD-16-512", price: 9999 },
      { value: "典藏版 16GB+512GB", key: "COL-16-512", price: 10999 },
      { value: "典藏版 16GB+1TB", key: "COL-16-1TB", price: 12999 },
    ],
    specs: [
      ["屏幕", "6.9 英寸双层 OLED，1–120Hz 自适应刷新率"],
      ["影像", "5000 万像素可变光圈主摄、4000 万超广角、2 亿长焦"],
      ["电池", "6800mAh"],
      ["防护", "IP68/IP69"],
    ],
  },
  {
    handle: "huawei-pura-x-view",
    title: "HUAWEI Pura X View",
    description: "华为 Pura X View，搭载 6.39 英寸 OLED 阔型屏，支持 120Hz 刷新率，后置 2 亿像素主摄，配备 7000mAh 电池，提供四种配色和三档存储容量。",
    versionTitle: "存储空间",
    defaultColor: "幻夜黑",
    colors: [
      { value: "幻夜黑", key: "black" },
      { value: "跃影红", key: "red" },
      { value: "亚麻灰", key: "grey" },
      { value: "零度白", key: "white" },
    ],
    versions: [
      { value: "12GB+256GB", key: "12-256", price: 5999 },
      { value: "12GB+512GB", key: "12-512", price: 6999 },
      { value: "12GB+1TB", key: "12-1TB", price: 8499 },
    ],
    specs: [
      ["屏幕", "6.39 英寸 OLED 阔型屏，120Hz"],
      ["主摄", "2 亿像素，支持 OIS"],
      ["电池", "7000mAh，66W 有线、50W 无线快充"],
      ["防护", "IP68/IP69"],
    ],
  },
] as const

type CatalogItem = (typeof catalog)[number]

export function expectedVariants(item: CatalogItem) {
  return item.colors.flatMap((color) => item.versions.map((version) => ({
    sku: `ZX-${item.handle.toUpperCase().replace(/-/g, "-")}-${version.key}-${color.key.toUpperCase()}`,
    color: color.value,
    version: version.value,
    price: version.price,
  })))
}

export default async function importNewHuaweiProducts({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const handles = catalog.map((item) => item.handle)
  const { data: existing } = await query.graph({
    entity: "product", fields: ["id", "handle", "metadata"], filters: { handle: handles },
  })
  for (const product of existing) {
    if (product.metadata?.import_batch !== BATCH) {
      throw new Error(`商品 ${product.handle} 已存在、但不是本脚本创建的。为保护旧商品，已停止。`)
    }
  }
  const preview = catalog.map((item) => ({
    title: item.title,
    handle: item.handle,
    existing: !!existing.find((p) => p.handle === item.handle),
    colors: item.colors.map((c) => c.value),
    versions: item.versions.map((v) => ({ label: v.value, cny: v.price })),
    expected_variants: expectedVariants(item).length,
  }))
  console.log(JSON.stringify({ mode: APPLY ? "APPLY" : "PREVIEW", items: preview,
    total_expected_variants: preview.reduce((n, p) => n + p.expected_variants, 0),
    inventory_per_variant: STOCK }, null, 2))
  if (!APPLY) {
    console.log("PREVIEW ONLY: 数据库未修改。确认图片和价格以及数据库备份后，再设置 NEW_HUAWEI_APPLY=YES。")
    return
  }

  // Use same sales channel / category as existing HUAWEI Pura 90 Pro Max.
  const { data: baseProducts } = await query.graph({
    entity: "product", fields: ["id", "categories.id"],
    filters: { handle: "huawei-pura-90-pro-max" },
  })
  const categoryId = baseProducts[0]?.categories?.[0]?.id
  const { data: stores } = await query.graph({
    entity: "store", fields: ["id", "default_sales_channel_id"],
  })
  const { data: profiles } = await query.graph({
    entity: "shipping_profile", fields: ["id"], filters: { type: "default" },
  })
  const { data: warehouses } = await query.graph({
    entity: "stock_location", fields: ["id", "name"], filters: { name: "European Warehouse" },
  })
  if (!categoryId || !stores[0]?.default_sales_channel_id || !profiles[0]?.id || warehouses.length !== 1) {
    throw new Error("缺少既有华为商品分类、销售渠道、默认物流配置或 European Warehouse 仓库，已停止。")
  }

  // Verify the existing shared color option before changing anything.
  const { data: sharedOptions } = await query.graph({
    entity: "product_option", fields: ["id", "title", "is_exclusive", "values.id", "values.value"],
    filters: { id: COLOR_OPTION_ID },
  })
  if (sharedOptions.length !== 1 || sharedOptions[0].title !== "颜色" || sharedOptions[0].is_exclusive === true) {
    throw new Error("共享颜色选项不符合预期，已停止。")
  }

  for (const item of catalog) {
    let { data: products } = await query.graph({
      entity: "product", fields: ["id", "handle", "metadata", "options.id", "options.title", "options.values.id", "options.values.value", "variants.id", "variants.sku", "variants.options.option.title", "variants.options.value"],
      filters: { handle: item.handle },
    })
    if (!products.length) {
      // Start with one variant, then link the already-existing shared 颜色 option.
      const first = expectedVariants(item)[0]
      const thumb = `/catalog-preview/${item.handle}-black-main.webp`
      await createProductsWorkflow(container).run({ input: {
        products: [{
          title: item.title, handle: item.handle, description: item.description,
          status: ProductStatus.PUBLISHED, thumbnail: thumb, images: [{ url: thumb }],
          category_ids: [categoryId],
          sales_channels: [{ id: stores[0].default_sales_channel_id }],
          shipping_profile_id: profiles[0].id,
          metadata: { import_batch: BATCH, preview_details: { specs: item.specs.map(([a, b]) => [a, b]), reviews: [] } },
          options: [{ title: item.versionTitle, values: item.versions.map((v) => v.value) }],
          variants: [{ title: first.version, sku: first.sku, manage_inventory: true,
            options: { [item.versionTitle]: first.version },
            prices: [{ currency_code: "cny", amount: first.price }] }],
        }],
      } })
    }
    const reload = async () => (await query.graph({
      entity: "product", fields: ["id", "handle", "metadata", "options.id", "options.title", "options.values.id", "options.values.value", "variants.id", "variants.sku", "variants.options.option.title", "variants.options.value"],
      filters: { handle: item.handle },
    })).data[0]
    let product = await reload()
    if (product.metadata?.import_batch !== BATCH) throw new Error(`商品 ${item.handle} 标记不符`)
    if (!product.options?.some((o) => o.title === item.versionTitle)) throw new Error(`缺少规格选项 ${item.versionTitle}`)
    if (!product.options?.some((o) => o.title === "颜色")) {
      await setProductProductOptionsWorkflow(container).run({
        input: { product_id: product.id,
          add: [{ product_option_id: COLOR_OPTION_ID, product_option_value_ids: [] }] },
      })
    }
    product = await reload()
    const colorOption = product.options?.find((o) => o.title === "颜色")
    if (colorOption?.id !== COLOR_OPTION_ID) throw new Error(`颜色选项关联异常: ${item.handle}`)
    const linkedValues = new Set((colorOption.values ?? []).map((v) => v.value))
    const needColors = item.colors.map((c) => c.value).filter((value) => !linkedValues.has(value))
    if (needColors.length) {
      // Query ALL option values to reuse globally existing ones without duplicates.
      const { data: globalOptions } = await query.graph({
        entity: "product_option", fields: ["id", "values.id", "values.value"],
        filters: { id: COLOR_OPTION_ID },
      })
      const allValues = globalOptions[0]?.values ?? []
      const toAdd = needColors.map((value) => {
        const existingValue = allValues.find((v) => v.value === value)
        return existingValue ? existingValue.id : { value }
      })
      await setProductProductOptionsWorkflow(container).run({
        input: { product_id: product.id,
          update: [{ product_option_id: COLOR_OPTION_ID, add: toAdd }] },
      })
    }
    product = await reload()
    const desired = expectedVariants(item)
    const allowedSkus = new Set(desired.map((v) => v.sku))
    for (const variant of product.variants ?? []) {
      if (!allowedSkus.has(variant.sku ?? "")) throw new Error(`意外 SKU，停止写入: ${variant.sku}`)
    }
    const existingSkuMap = new Map((product.variants ?? []).map((v) => [v.sku, v]))
    const needsColor = desired.filter((v) => {
      const current = existingSkuMap.get(v.sku)
      return current && !(current.options ?? []).some((o) => o.option?.title === "颜色")
    }).map((v) => ({
      id: existingSkuMap.get(v.sku)!.id,
      options: { [item.versionTitle]: v.version, "颜色": v.color },
    }))
    if (needsColor.length) {
      await updateProductVariantsWorkflow(container).run({ input: { product_variants: needsColor } })
    }
    const missing = desired.filter((v) => !existingSkuMap.has(v.sku))
    if (missing.length) {
      await createProductVariantsWorkflow(container).run({ input: { product_variants: missing.map((v) => ({
        product_id: product.id, title: `${v.color} ${v.version}`, sku: v.sku,
        manage_inventory: true,
        options: { [item.versionTitle]: v.version, "颜色": v.color },
        prices: [{ currency_code: "cny", amount: v.price }],
      })) } })
    }
    const fresh = await reload()
    if (fresh.variants?.length !== desired.length) throw new Error(`${item.handle} 规格数量异常：${fresh.variants?.length}`)
    console.log(`创建完成: ${item.handle} / ${desired.length} 个规格`)
  }

  const allSkus = catalog.flatMap((item) => expectedVariants(item).map((v) => v.sku))
  const { data: inventory } = await query.graph({
    entity: "inventory_item", fields: ["id", "sku", "location_levels.location_id"],
    filters: { sku: allSkus },
  })
  const missingItems = allSkus.filter((sku) => !inventory.some((i) => i.sku === sku))
  if (missingItems.length) throw new Error(`缺少库存项: ${missingItems.join(", ")}`)
  const noLevels = inventory.filter((i) => !(i.location_levels ?? []).some((lvl) => lvl.location_id === warehouses[0].id))
  if (noLevels.length) {
    await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: noLevels.map((i) => ({
      inventory_item_id: i.id, location_id: warehouses[0].id, stocked_quantity: STOCK,
    })) } })
  }
  console.log(`DONE: 两款商品，共 ${allSkus.length} 个规格；新增缺失库存记录 ${noLevels.length} 个。`)
  console.log("请在管理后台核对商品、价格、库存与销售渠道，然后在前端测试图片切换和下单。")
}
