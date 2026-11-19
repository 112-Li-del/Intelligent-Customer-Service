import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { listSynonymProducts } from "@lib/data/search-synonyms"
import { getProductPrice } from "@lib/util/get-product-price"
import { match } from "pinyin-pro"
import type { SearchPreviewProduct } from "types/search-preview"

const PREVIEW_LIMIT = 4
const hanCharacter = new RegExp("\\p{Script=Han}", "u")

async function findPinyinProductIds(
  countryCode: string,
  query: string,
  categoryIds: string[] | undefined,
  directIds: string[]
) {
  const remaining = PREVIEW_LIMIT - directIds.length
  const ids: string[] = []
  let page: number | null = 1

  while (page !== null && ids.length < remaining) {
    const { response, nextPage } = await listProducts({
      countryCode,
      pageParam: page,
      queryParams: { fields: "id,title", limit: 100, category_id: categoryIds },
    })

    for (const { id, title } of response.products) {
      if (directIds.includes(id) || !hanCharacter.test(title)) continue
      if (match(title, query, { continuous: true, precision: "start", lastPrecision: "start", v: true })) {
        ids.push(id)
        if (ids.length === remaining) break
      }
    }
    page = nextPage
  }

  return ids
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const query = params.get("q")?.trim().slice(0, 200)
  const countryCode = params.get("countryCode") ?? ""
  const category = params.get("category")?.trim().slice(0, 200)

  if (!/^[a-z]{2}$/.test(countryCode)) {
    return Response.json({ error: "Invalid country code" }, { status: 400 })
  }
  if (!query) return Response.json([])

  try {
    const [scope] = category
      ? await listCategories({ fields: "id", handle: category, limit: 1 })
      : []
    if (category && !scope) return Response.json([])

    const categoryIds = scope ? [scope.id] : undefined
    const expanded = await listSynonymProducts(countryCode, query, PREVIEW_LIMIT, scope?.id)
    const response = expanded ?? (await listProducts({
      countryCode,
      queryParams: { q: query, limit: PREVIEW_LIMIT, category_id: categoryIds },
    })).response
    const matched = response.products.filter(({ handle }) => Boolean(handle))
    const pinyinQuery = query.normalize("NFKC").toLowerCase().replace(/['’]/g, " ").replace(/u:/g, "v")

    if (params.get("composing") === "1" && /[a-zü]/.test(pinyinQuery) && matched.length < PREVIEW_LIMIT) {
      const ids = await findPinyinProductIds(countryCode, pinyinQuery, categoryIds, matched.map(({ id }) => id))
      if (ids.length) {
        const { response } = await listProducts({
          countryCode,
          queryParams: { id: ids, limit: ids.length, category_id: categoryIds },
        })
        const byId = new Map(response.products.map((product) => [product.id, product]))
        for (const id of ids) {
          const product = byId.get(id)
          if (product?.handle) matched.push(product)
        }
      }
    }

    const products: SearchPreviewProduct[] = matched
      .map((product) => ({
        id: product.id,
        handle: product.handle,
        title: product.title,
        image: product.thumbnail || product.images?.[0]?.url || null,
        price: getProductPrice({ product }).cheapestPrice?.calculated_price ?? null,
        inStock: product.variants?.some(
          ({ manage_inventory, inventory_quantity }) => !manage_inventory || (inventory_quantity ?? 0) > 0
        ) ?? false,
      }))

    return Response.json(products)
  } catch {
    return Response.json({ error: "Search unavailable" }, { status: 503 })
  }
}
