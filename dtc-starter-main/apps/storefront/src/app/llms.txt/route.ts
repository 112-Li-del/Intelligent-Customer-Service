import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listRegions } from "@lib/data/regions"
import { UCP_MCP_PATH, UCP_REST_BASE_PATH } from "@lib/ucp/ucp"
import {
  getDefaultCountryCode,
  getRequestOrigin,
  listCountryCodes,
  STORE_NAME,
} from "@lib/util/site"

export async function GET(request: Request) {
  const origin = getRequestOrigin(request)

  const [regions, categories, { collections }] = await Promise.all([
    listRegions(),
    listCategories({ fields: "name,handle,parent_category_id", limit: 50 }),
    listCollections({ fields: "title,handle", limit: "50" }),
  ])

  const countries = listCountryCodes(regions)
  const base = `${origin}/${getDefaultCountryCode(regions)}`
  const currencies = Array.from(
    new Set(regions.map((r) => r.currency_code?.toUpperCase()).filter(Boolean))
  )

  const links = [
    ...categories
      .filter((c) => !c.parent_category_id)
      .map((c) => `- [${c.name}](${base}/categories/${c.handle})`),
    ...collections.map((c) => `- [${c.title}](${base}/collections/${c.handle})`),
  ]

  const body = `# ${STORE_NAME}

> 中国大陆演示商城，币种为 ${currencies.join("、")}。

地址中的地区代码决定展示的币种和价格，例如 \`${base}\`。可用地区代码为 ${countries.join("、")}。

## 商品
- [全部商品](${base}/store)
${links.join("\n")}
- 搜索： ${base}/search?q={query}

## 购物
- 商品详情页通过 POST 将 \`variant_id\` 和 \`quantity\` 提交到 ${base}/cart/add。
- 商品地址可使用 \`?v_id={variant_id}\` 预选规格。
- 在商品地址末尾加 \`.md\`，或发送 \`Accept: text/markdown\`，可查看包含规格 ID、价格和库存的 Markdown 内容。
- 结算链接： ${origin}/buy/{variant_id}:{quantity},{variant_id}:{quantity}
- [购物车](${base}/cart)

## 商城说明
- [配送说明](${base}/shipping)
- [退货政策](${base}/returns)
- [服务条款](${base}/terms)
- [隐私政策](${base}/privacy)
- [联系我们](${base}/contact)

## 接口与站点索引
- [站点地图](${origin}/sitemap.xml)
- [UCP 配置](${origin}/.well-known/ucp)
- UCP MCP 接口：${origin}${UCP_MCP_PATH}
- UCP REST 接口：${origin}${UCP_REST_BASE_PATH}
`

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
