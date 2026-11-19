"use server"

import { listProducts } from "@lib/data/products"
import { expandSearchKeywords, normalizeSearchText } from "@lib/util/search-synonyms"

export async function getSynonymProductIds(
  countryCode: string,
  query: string,
  categoryId?: string
): Promise<string[] | null> {
  if (!/^[a-z]{2}$/.test(countryCode) || typeof query !== "string") return null
  const keywords = expandSearchKeywords(query.slice(0, 200)).map(normalizeSearchText)
  if (keywords.length < 2) return null

  const [original, ...alternatives] = keywords
  const exact = new Set<string>()
  const byTitleOrCategory = new Set<string>()
  const byDescription = new Set<string>()
  let page: number | null = 1

  while (page !== null) {
    const { response, nextPage } = await listProducts({
      countryCode,
      pageParam: page,
      queryParams: {
        fields: "id,handle,title,subtitle,description,*categories",
        limit: 100,
        ...(categoryId && { category_id: [categoryId] }),
      },
    })

    for (const product of response.products) {
      if (!product.handle) continue
      const names = [product.title, ...(product.categories ?? []).map(({ name }) => name)].map(normalizeSearchText)
      const details = [product.subtitle ?? "", product.description ?? ""].map(normalizeSearchText)
      if ([...names, ...details].some((field) => field.includes(original))) {
        exact.add(product.id)
      } else if (alternatives.some((term) => names.some((field) => field.includes(term)))) {
        byTitleOrCategory.add(product.id)
      } else if (alternatives.some((term) => details.some((field) => field.includes(term)))) {
        byDescription.add(product.id)
      }
    }

    page = nextPage
  }

  return Array.from(new Set(Array.from(exact).concat(Array.from(byTitleOrCategory), Array.from(byDescription))))
}

export async function listSynonymProducts(countryCode: string, query: string, limit: number, categoryId?: string) {
  const ids = await getSynonymProductIds(countryCode, query, categoryId)
  if (!ids) return null
  if (!ids.length) return { products: [], count: 0 }

  const shownIds = ids.slice(0, Math.min(limit, 24))
  if (!shownIds.length) return { products: [], count: ids.length }
  const { response } = await listProducts({
    countryCode,
    queryParams: { id: shownIds, limit: shownIds.length, ...(categoryId && { category_id: [categoryId] }) },
  })
  const byId = new Map(response.products.map((product) => [product.id, product]))
  return {
    products: shownIds.flatMap((id) => {
      const product = byId.get(id)
      return product ? [product] : []
    }),
    count: ids.length,
  }
}
