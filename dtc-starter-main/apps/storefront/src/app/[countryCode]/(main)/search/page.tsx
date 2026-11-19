import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { listSynonymProducts } from "@lib/data/search-synonyms"
import { PRODUCT_INDEX_NAME, searchClient } from "@lib/search-client"
import ProductPreview from "@modules/products/components/product-preview"
import AskSearchAi from "@modules/search/components/ask-ai"
import SearchForm from "@modules/search/components/search-form"
import { CATEGORY_ATTRIBUTE } from "@modules/store/components/store-refinements/attributes"

const RESULT_LIMIT = 24

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string | string[]; category?: string | string[] }>
}

const getQuery = (q?: string | string[]) =>
  (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 200) ?? ""

async function searchCategoryProducts(
  countryCode: string,
  query: string,
  category: { id: string; name: string }
) {
  const search = await searchClient.search([{
    indexName: PRODUCT_INDEX_NAME,
    params: {
      query,
      hitsPerPage: RESULT_LIMIT,
      attributesToRetrieve: ["id"],
      facetFilters: [`${CATEGORY_ATTRIBUTE}:${category.name.trim()}`],
    },
  }])
  const result = search.results[0]
  const ids = result.hits.map((hit) => hit.objectID)

  if (!ids.length) return { products: [], count: 0 }

  const { response } = await listProducts({
    countryCode,
    queryParams: { id: ids, category_id: [category.id], limit: ids.length },
  })
  const productsById = new Map(response.products.map((product) => [product.id, product]))

  return {
    products: ids.flatMap((id) => {
      const product = productsById.get(id)
      return product ? [product] : []
    }),
    count: Math.max(0, result.nbHits - (ids.length - response.products.length)),
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const query = getQuery((await props.searchParams).q)
  return {
    title: query ? `“${query}”的搜索结果` : "搜索",
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage(props: Props) {
  const { countryCode } = await props.params
  const searchParams = await props.searchParams
  const query = getQuery(searchParams.q)
  const handle = getQuery(searchParams.category)
  const [category] = handle
    ? await listCategories({ fields: "id,name,handle", handle, limit: 1 })
    : []

  if (handle && !category) notFound()

  if (!query) {
    if (category) {
      const categoryPath = category.handle.split("/").map(encodeURIComponent).join("/")
      redirect(`/${countryCode}/categories/${categoryPath}`)
    }
    if (searchParams.q !== undefined) redirect(`/${countryCode}/store`)
  }

  const region = await getRegion(countryCode)
  if (!region) {
    notFound()
  }

  const expanded = query ? await listSynonymProducts(countryCode, query, RESULT_LIMIT, category?.id) : null
  const response = expanded ?? (!query
    ? { products: [], count: 0 }
    : category
      ? await searchCategoryProducts(countryCode, query, category)
      : (await listProducts({ countryCode, queryParams: { q: query, limit: RESULT_LIMIT } })).response)

  return (
    <div className="content-container py-6" data-testid="search-container">
      <h1 className="text-2xl-semi mb-6">
        {query ? `“${query}”的搜索结果` : "搜索"}
        {category && <span className="ml-3 rounded bg-gray-100 px-2 py-1 text-sm text-brand-navy">{category.name}</span>}
      </h1>
      <SearchForm countryCode={countryCode} defaultValue={query} category={category?.handle} className="mb-8 max-w-xl" />
      {query && (
        <p className="text-small-regular text-ui-fg-subtle mb-6">
          找到 {response.count} 件商品
        </p>
      )}
      {query && response.products.length === 0 ? (
        <div>
          <p className="text-ui-fg-subtle">未找到与「{query}」相关的商品。</p>
          <AskSearchAi query={query} />
        </div>
      ) : (
        <ul
          className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
          data-testid="search-results"
        >
          {response.products.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
