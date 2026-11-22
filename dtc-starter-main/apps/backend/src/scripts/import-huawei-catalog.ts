import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  setProductProductOptionsWorkflow,
  updateProductVariantsWorkflow,
  createProductVariantsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"

// Default is preview. Set HUAWEI_CATALOG_APPLY=YES to create products/variants.
const APPLY = process.env.HUAWEI_CATALOG_APPLY === "YES"
const COLOR_OPTION_ID = "opt_01M7QRB8WQ8V1EA069FWGAE83Q"
const STOCK = 30
const BATCH = "huawei-new-2026-11"

const catalog = [
  {
    "handle": "huawei-changxiang-100-pro",
    "title": "HUAWEI 畅享 100 Pro",
    "description": "HUAWEI 畅享 100 Pro 于 2026 年 10 月发布，主打长续航与耐用性，搭载麒麟 8020A 芯片及 6100mAh 大电池。",
    "versionTitle": "存储空间",
    "defaultColor": "幻夜黑",
    "colors": [
      {
        "value": "幻夜黑",
        "key": "black"
      },
      {
        "value": "雀翎蓝",
        "key": "blue"
      },
      {
        "value": "羽砂紫",
        "key": "purple"
      },
      {
        "value": "羽砂白",
        "key": "white"
      }
    ],
    "versions": [
      {
        "value": "128GB",
        "key": "128",
        "price": 1799
      },
      {
        "value": "256GB",
        "key": "256",
        "price": 2199
      },
      {
        "value": "512GB",
        "key": "512",
        "price": 2699
      }
    ],
    "specs": [
      [
        "屏幕",
        "6.7 英寸 OLED 直屏，120Hz，2160Hz 高频 PWM 调光"
      ],
      [
        "性能",
        "麒麟 8020A，HarmonyOS 7.0"
      ],
      [
        "影像",
        "5000 万像素 RYYB 主摄，前置 3200 万像素"
      ],
      [
        "续航",
        "6100mAh，40W 有线快充"
      ],
      [
        "耐用性",
        "CQC 与 SGS 双五星耐摔认证；512GB 版本配备昆仑玻璃"
      ]
    ]
  },
  {
    "handle": "huawei-changxiang-90-pro-max",
    "title": "HUAWEI 畅享 90 Pro Max",
    "description": "HUAWEI 畅享 90 Pro Max 于 2026 年 4 月开售，主打 8500mAh 巨鲸长续航。商品售价按资料中的版本价格录入，国补参考价不作为商城售价。",
    "versionTitle": "存储空间",
    "defaultColor": "曜金黑",
    "colors": [
      {
        "value": "曜金黑",
        "key": "black"
      },
      {
        "value": "晨曦金",
        "key": "golden"
      },
      {
        "value": "飞天青",
        "key": "green"
      },
      {
        "value": "雪域白",
        "key": "white"
      }
    ],
    "versions": [
      {
        "value": "128GB",
        "key": "128",
        "price": 1699
      },
      {
        "value": "256GB",
        "key": "256",
        "price": 1999
      },
      {
        "value": "512GB",
        "key": "512",
        "price": 2399
      }
    ],
    "specs": [
      [
        "屏幕",
        "6.84 英寸 1.5K OLED 直屏，120Hz"
      ],
      [
        "性能",
        "麒麟 8000，HarmonyOS 6.0"
      ],
      [
        "影像",
        "5000 万像素 RYYB 主摄，前置 800 万像素"
      ],
      [
        "续航",
        "8500mAh，40W 有线快充"
      ],
      [
        "防护",
        "IP65，SGS 五星抗跌耐摔认证"
      ]
    ]
  },
  {
    "handle": "huawei-mate-90-pro-max",
    "title": "HUAWEI Mate 90 Pro Max",
    "description": "HUAWEI Mate 90 Pro Max 于 2026 年 10 月发布，分为标准版与典藏版；典藏版独享玄武昆仑玻璃及外接镜头能力，并提供 1TB 存储选项。",
    "versionTitle": "版本容量",
    "defaultColor": "曜石黑",
    "colors": [
      {
        "value": "曜石黑",
        "key": "black"
      },
      {
        "value": "玫瑰金",
        "key": "gold"
      },
      {
        "value": "翡冷翠",
        "key": "green"
      },
      {
        "value": "晶钻白",
        "key": "white"
      }
    ],
    "versions": [
      {
        "value": "标准版 12GB+512GB",
        "key": "STD-12-512",
        "price": 9499
      },
      {
        "value": "标准版 16GB+512GB",
        "key": "STD-16-512",
        "price": 9999
      },
      {
        "value": "典藏版 16GB+512GB",
        "key": "COL-16-512",
        "price": 10999
      },
      {
        "value": "典藏版 16GB+1TB",
        "key": "COL-16-1TB",
        "price": 12999
      }
    ],
    "specs": [
      [
        "屏幕",
        "6.9 英寸双层 OLED，1–120Hz 自适应刷新率"
      ],
      [
        "影像",
        "5000 万像素可变光圈主摄、4000 万超广角、2 亿长焦"
      ],
      [
        "电池",
        "6800mAh"
      ],
      [
        "防护",
        "IP68/IP69；典藏版玄武昆仑玻璃"
      ]
    ]
  },
  {
    "handle": "huawei-nova-16-se",
    "title": "HUAWEI nova 16 SE",
    "description": "HUAWEI nova 16 SE 于 2026 年 8 月发布，主打超大电池与长续航。商品价格采用 2026 年 10 月调价后的售价。",
    "versionTitle": "存储空间",
    "defaultColor": "星空黑",
    "colors": [
      {
        "value": "星空黑",
        "key": "black"
      },
      {
        "value": "天际白",
        "key": "white"
      },
      {
        "value": "破晓橙",
        "key": "orange"
      },
      {
        "value": "樱雪晴空",
        "key": "color"
      }
    ],
    "versions": [
      {
        "value": "128GB",
        "key": "128",
        "price": 2699
      },
      {
        "value": "256GB",
        "key": "256",
        "price": 2899
      },
      {
        "value": "512GB",
        "key": "512",
        "price": 3399
      }
    ],
    "specs": [
      [
        "屏幕",
        "6.84 英寸 OLED 直屏，120Hz"
      ],
      [
        "性能",
        "麒麟 8020，HarmonyOS 6.1"
      ],
      [
        "影像",
        "5000 万像素 RYYB 主摄，前置 3200 万像素"
      ],
      [
        "续航",
        "8500mAh，66W 有线快充"
      ],
      [
        "防护",
        "IP65，双向北斗卫星消息"
      ]
    ]
  },
  {
    "handle": "huawei-nova-16",
    "title": "HUAWEI nova 16",
    "description": "HUAWEI nova 16 于 2026 年 6 月发布，定位年轻用户群体，主打轻薄直屏与长焦影像。价格按商品资料中的版本价格录入。",
    "versionTitle": "存储空间",
    "defaultColor": "星空黑",
    "colors": [
      {
        "value": "星空黑",
        "key": "black"
      },
      {
        "value": "晴空蓝",
        "key": "blue"
      },
      {
        "value": "幻彩贝母",
        "key": "color"
      },
      {
        "value": "天际白",
        "key": "white"
      }
    ],
    "versions": [
      {
        "value": "12GB+256GB",
        "key": "12-256",
        "price": 2999
      },
      {
        "value": "12GB+512GB",
        "key": "12-512",
        "price": 3499
      }
    ],
    "specs": [
      [
        "屏幕",
        "6.68 英寸 OLED 直屏，120Hz"
      ],
      [
        "性能",
        "麒麟 9010S，HarmonyOS 6.1"
      ],
      [
        "影像",
        "5000 万像素主摄、5000 万像素 RYYB 潜望长焦、红枫原色镜头"
      ],
      [
        "续航",
        "7000mAh，100W 有线快充"
      ],
      [
        "防护",
        "IP65"
      ]
    ]
  },
  {
    "handle": "huawei-osta-o1-pro",
    "title": "HUAWEI OSTA O1 Pro",
    "description": "HUAWEI OSTA O1 Pro 是华为全新子品牌“星芒”的首款机型，定位鸿蒙 AI 手机。两个 16GB 高配版本仅提供星芒紫。",
    "versionTitle": "版本容量",
    "defaultColor": "星芒紫",
    "colors": [
      {
        "value": "星芒紫",
        "key": "purple"
      },
      {
        "value": "星云白",
        "key": "white"
      },
      {
        "value": "星空黑",
        "key": "black"
      }
    ],
    "versions": [
      {
        "value": "12GB+256GB",
        "key": "12-256",
        "price": 5699
      },
      {
        "value": "12GB+512GB",
        "key": "12-512",
        "price": 6699
      },
      {
        "value": "16GB+512GB",
        "key": "16-512",
        "price": 7499
      },
      {
        "value": "16GB+1TB",
        "key": "16-1TB",
        "price": 8999
      }
    ],
    "specs": [
      [
        "屏幕",
        "6.39 英寸 1.5K LTPS 阔直屏，120Hz"
      ],
      [
        "性能",
        "麒麟 9030S，HarmonyOS 7 AI 先锋版"
      ],
      [
        "影像",
        "2 亿像素 RYYB 主摄、5000 万像素潜望长焦、第二代红枫镜头"
      ],
      [
        "续航",
        "7000mAh，66W 有线、50W 无线充电"
      ],
      [
        "防护",
        "IP68/IP69"
      ]
    ],
    "restricted": {
      "16-512": [
        "星芒紫"
      ],
      "16-1TB": [
        "星芒紫"
      ]
    }
  },
  {
    "handle": "huawei-pura-90-pro",
    "title": "HUAWEI Pura 90 Pro",
    "description": "HUAWEI Pura 90 Pro 于 2026 年 4 月发布，首发搭载麒麟 9030S 芯片，主打影像与直屏体验。",
    "versionTitle": "版本容量",
    "defaultColor": "桑果黑",
    "colors": [
      {
        "value": "桑果黑",
        "key": "black"
      },
      {
        "value": "橘子汽水",
        "key": "orange"
      },
      {
        "value": "粉红芭乐",
        "key": "pink"
      },
      {
        "value": "椰青白",
        "key": "white"
      }
    ],
    "versions": [
      {
        "value": "12GB+256GB",
        "key": "12-256",
        "price": 5499
      },
      {
        "value": "12GB+512GB",
        "key": "12-512",
        "price": 5999
      },
      {
        "value": "16GB+512GB",
        "key": "16-512",
        "price": 6499
      },
      {
        "value": "16GB+1TB",
        "key": "16-1TB",
        "price": 7499
      }
    ],
    "specs": [
      [
        "屏幕",
        "6.6 英寸 OLED 直屏，1–120Hz LTPO"
      ],
      [
        "影像",
        "5000 万像素可变光圈主摄、5000 万微距长焦、1250 万超广角"
      ],
      [
        "续航",
        "6000mAh，66W 有线、50W 无线快充"
      ],
      [
        "性能",
        "麒麟 9030S，HarmonyOS 6.1"
      ]
    ]
  },
  {
    "handle": "huawei-pura-x-max",
    "title": "HUAWEI Pura X Max",
    "description": "HUAWEI Pura X Max 是一款阔折叠手机，分为标准版与典藏版，核心差异在于内存和存储配置。",
    "versionTitle": "版本容量",
    "defaultColor": "幻夜黑",
    "colors": [
      {
        "value": "幻夜黑",
        "key": "black"
      },
      {
        "value": "零度白",
        "key": "white"
      },
      {
        "value": "星际蓝",
        "key": "blue"
      },
      {
        "value": "橄榄金",
        "key": "golden"
      },
      {
        "value": "活力橙",
        "key": "orange"
      }
    ],
    "versions": [
      {
        "value": "标准版 12GB+256GB",
        "key": "STD-12-256",
        "price": 10999
      },
      {
        "value": "标准版 12GB+512GB",
        "key": "STD-12-512",
        "price": 11999
      },
      {
        "value": "典藏版 16GB+512GB",
        "key": "COL-16-512",
        "price": 12999
      },
      {
        "value": "典藏版 16GB+1TB",
        "key": "COL-16-1TB",
        "price": 13999
      }
    ],
    "specs": [
      [
        "屏幕",
        "外屏 5.4 英寸、内屏 7.7 英寸，均支持 1–120Hz LTPO"
      ],
      [
        "性能",
        "麒麟 9030 Pro，HarmonyOS 6.1"
      ],
      [
        "影像",
        "5000 万像素可变光圈主摄、5000 万潜望长焦、1250 万超广角"
      ],
      [
        "续航",
        "5300mAh，66W 有线、50W 无线快充"
      ],
      [
        "防护",
        "IP58 + IP59"
      ]
    ]
  },
  {
    "handle": "huawei-pura-x-view",
    "title": "HUAWEI Pura X View",
    "description": "HUAWEI Pura X View 主打阔直板形态，搭载 6.39 英寸 OLED 阔型屏、2 亿像素主摄和 7000mAh 电池。",
    "versionTitle": "存储空间",
    "defaultColor": "幻夜黑",
    "colors": [
      {
        "value": "幻夜黑",
        "key": "black"
      },
      {
        "value": "跃影红",
        "key": "red"
      },
      {
        "value": "亚麻灰",
        "key": "grey"
      },
      {
        "value": "零度白",
        "key": "white"
      }
    ],
    "versions": [
      {
        "value": "12GB+256GB",
        "key": "12-256",
        "price": 5999
      },
      {
        "value": "12GB+512GB",
        "key": "12-512",
        "price": 6999
      },
      {
        "value": "12GB+1TB",
        "key": "12-1TB",
        "price": 8499
      }
    ],
    "specs": [
      [
        "屏幕",
        "6.39 英寸 OLED 阔型屏，120Hz"
      ],
      [
        "性能",
        "麒麟 9030S，HarmonyOS 7"
      ],
      [
        "影像",
        "2 亿像素 OIS 主摄、5000 万像素潜望长焦、800 万超广角微距"
      ],
      [
        "续航",
        "7000mAh，66W 有线、50W 无线快充"
      ],
      [
        "防护",
        "IP68/IP69，北斗卫星消息及 eSIM"
      ]
    ]
  }
] as const

type CatalogItem = (typeof catalog)[number]

function expectedVariants(item: CatalogItem) {
  const restricted = "restricted" in item
    ? item.restricted as Record<string, string[]>
    : undefined
  return item.versions.flatMap((version) =>
    item.colors
      .filter((color) => !restricted?.[version.key] || restricted[version.key].includes(color.value))
      .map((color) => ({
        sku: `ZX-${item.handle.toUpperCase()}-${version.key}-${color.key.toUpperCase()}`,
        color: color.value,
        version: version.value,
        price: version.price,
      }))
  )
}

export default async function importNewHuaweiProducts({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const handles = catalog.map((item) => item.handle)
  const { data: existing } = await query.graph({
    entity: "product", fields: ["id", "handle", "metadata"], filters: { handle: handles },
  })
  const existingHandles = new Set(existing.map((product) => product.handle))
  // Existing products are deliberately left untouched. This batch only creates missing handles.
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
    new_products: preview.filter((p) => !p.existing).length,
    skipped_existing_products: preview.filter((p) => p.existing).length,
    inventory_per_variant: STOCK }, null, 2))
  if (!APPLY) {
    console.log("PREVIEW ONLY: 数据库未修改。已有商品会在正式执行时跳过，不会更新或覆盖。")
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

  for (const item of catalog.filter((item) => !existingHandles.has(item.handle))) {
    let { data: products } = await query.graph({
      entity: "product", fields: ["id", "handle", "metadata", "options.id", "options.title", "options.values.id", "options.values.value", "variants.id", "variants.sku", "variants.options.option.title", "variants.options.value"],
      filters: { handle: item.handle },
    })
    if (!products.length) {
      // Start with one variant, then link the already-existing shared 颜色 option.
      const first = expectedVariants(item)[0]
      const defaultColorKey = item.colors.find((color) => color.value === item.defaultColor)?.key
      if (!defaultColorKey) throw new Error(`默认颜色没有图片映射: ${item.handle}`)
      const thumb = `/catalog-preview/${item.handle}-${defaultColorKey}-main.webp`
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

  const allSkus = catalog
    .filter((item) => !existingHandles.has(item.handle))
    .flatMap((item) => expectedVariants(item).map((v) => v.sku))
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
  console.log(`DONE: 新增 ${catalog.filter((item) => !existingHandles.has(item.handle)).length} 款商品，共 ${allSkus.length} 个规格；已有 ${existingHandles.size} 款商品已跳过；新增缺失库存记录 ${noLevels.length} 个。`)
  console.log("请在管理后台核对商品、价格、库存与销售渠道，然后在前端测试图片切换和下单。")
}
