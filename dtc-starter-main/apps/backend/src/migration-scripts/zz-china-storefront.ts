import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createRegionsWorkflow,
  createServiceZonesWorkflow,
  createShippingOptionsWorkflow,
  createTaxRegionsWorkflow,
  updateProductCategoriesWorkflow,
  updateProductOptionsWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import { DEFAULT_REGION_STORE_POLICIES } from "../lib/region-store-policies"

const REGION_NAME = "中国大陆"
const CURRENCY = "cny"
const COUNTRY = "cn"

const catalog = {
  "t-shirt": { title: "经典棉质短袖 T 恤", description: "经典棉质圆领短袖，提供黑色和白色，适合日常搭配。", price: 69 },
  sweatshirt: { title: "圆领套头卫衣", description: "圆领套头款，适合日常休闲和叠穿。", price: 129 },
  sweatpants: { title: "休闲运动长裤", description: "休闲运动长裤，适合日常通勤、散步和轻量运动。", price: 99 },
  shorts: { title: "休闲短裤", description: "日常休闲短裤，提供多种尺码。", price: 79 },
}

const categories = {
  shirts: "短袖上衣",
  sweatshirts: "卫衣",
  pants: "裤装",
  merch: "周边",
}

const colors = { Black: "黑色", White: "白色" }

export default async function chinaStorefront({ container }: { container: MedusaContainer }) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pricing = container.resolve(Modules.PRICING)
  const productModule = container.resolve(Modules.PRODUCT)

  const { data: regions } = await query.graph({
    entity: "region", fields: ["id", "countries.iso_2"],
  })
  let regionId = regions.find((region) => region.countries?.some((country) => country?.iso_2 === COUNTRY))?.id
  if (!regionId) {
    const { result: [region] } = await createRegionsWorkflow(container).run({
      input: { regions: [{
        name: REGION_NAME,
        currency_code: CURRENCY,
        countries: [COUNTRY],
        payment_providers: ["pp_system_default"],
        metadata: DEFAULT_REGION_STORE_POLICIES,
      }] },
    })
    regionId = region.id
  }

  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "name", "supported_currencies.currency_code"],
    filters: { name: ["Default Store", "知选商城"] },
  })
  for (const store of stores) {
    const otherCurrencies = (store.supported_currencies ?? []).flatMap((entry) =>
      entry?.currency_code && entry.currency_code !== CURRENCY
        ? [{ currency_code: entry.currency_code, is_default: false }]
        : []
    )
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: {
          name: "知选商城",
          supported_currencies: [{ currency_code: CURRENCY, is_default: true }, ...otherCurrencies],
        },
      },
    })
  }

  const { data: taxRegions } = await query.graph({
    entity: "tax_region", fields: ["id"], filters: { country_code: COUNTRY },
  })
  if (!taxRegions.length) {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: COUNTRY, provider_id: "tp_system" }],
    })
  }

  const { data: [fulfillmentSet] } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "service_zones.id", "service_zones.name", "service_zones.shipping_options.id"],
    filters: { name: "European Warehouse delivery" },
  })
  const { data: [profile] } = await query.graph({
    entity: "shipping_profile", fields: ["id"], filters: { type: "default" },
  })
  if (!fulfillmentSet || !profile) {
    throw new Error("Missing starter fulfillment set or default shipping profile")
  }

  const zone = fulfillmentSet.service_zones?.find((entry) => entry?.name === REGION_NAME)
  let zoneId = zone?.id
  if (!zoneId) {
    const { result: [created] } = await createServiceZonesWorkflow(container).run({
      input: { data: [{
        name: REGION_NAME,
        fulfillment_set_id: fulfillmentSet.id,
        geo_zones: [{ type: "country", country_code: COUNTRY }],
      }] },
    })
    zoneId = created.id
  }
  if (!zone?.shipping_options?.length) {
    await createShippingOptionsWorkflow(container).run({
      input: [{
        name: "标准快递",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: zoneId,
        shipping_profile_id: profile.id,
        type: { label: "标准快递", description: "模拟配送，预计发货后 2–3 个工作日送达。", code: "cn-standard" },
        prices: [{ currency_code: CURRENCY, amount: 10 }, { region_id: regionId, amount: 10 }],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      }],
    })
  }

  const { data: productCategories } = await query.graph({
    entity: "product_category", fields: ["id", "handle"],
    filters: { handle: Object.keys(categories) },
  })
  for (const category of productCategories) {
    await updateProductCategoriesWorkflow(container).run({
      input: { selector: { id: category.id }, update: { name: categories[category.handle as keyof typeof categories] } },
    })
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id", "handle", "options.id", "options.title", "options.values.id", "options.values.value",
      "variants.id", "variants.title", "variants.price_set.id", "variants.price_set.prices.currency_code",
    ],
    filters: { handle: Object.keys(catalog) },
  })
  const translatedOptions = new Set<string>()
  for (const product of products) {
    const { price, ...copy } = catalog[product.handle as keyof typeof catalog]
    await updateProductsWorkflow(container).run({
      input: { selector: { id: product.id }, update: copy },
    })
    for (const option of product.options ?? []) {
      if (!option || translatedOptions.has(option.id)) continue
      translatedOptions.add(option.id)
      const title = option.title === "Size" ? "尺码" : option.title === "Color" ? "颜色" : null
      if (title) {
        await updateProductOptionsWorkflow(container).run({
          input: { selector: { id: option.id }, update: { title } },
        })
      }
      for (const value of option.values ?? []) {
        const translated = value && colors[value.value as keyof typeof colors]
        if (value && translated) {
          await productModule.updateProductOptionValues(value.id, { value: translated })
        }
      }
    }

    const variants = (product.variants ?? []).flatMap((variant) => variant ? [variant] : [])
    const newPrices = variants.flatMap((variant) => {
      const priceSet = variant.price_set
      return priceSet && !priceSet.prices?.some((entry) => entry?.currency_code === CURRENCY)
        ? [{ priceSetId: priceSet.id, prices: [{ currency_code: CURRENCY, amount: price }] }]
        : []
    })
    if (newPrices.length) await pricing.addPrices(newPrices)

    const translatedVariants = variants.flatMap(({ id, title }) => {
      const translated = title.replace(/\b(Black|White)\b/g, (color) => colors[color as keyof typeof colors])
      return title === translated ? [] : [{ id, title: translated }]
    })
    if (translatedVariants.length) {
      await updateProductVariantsWorkflow(container).run({ input: { product_variants: translatedVariants } })
    }
  }
}
