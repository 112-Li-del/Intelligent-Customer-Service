"use client"

import type { Hit } from "instantsearch.js"
import type { HttpTypes } from "@medusajs/types"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useHits, useInstantSearch } from "react-instantsearch"

import useSearchSettled from "@lib/hooks/use-search-settled"
import { listProducts } from "@lib/data/products"
import { Text } from "@modules/common/components/ui"
import ProductPreview from "@modules/products/components/product-preview"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import SearchPagination from "./pagination"
import HitPrice, { HitPricing } from "./price"

type ProductHit = Hit<
  {
    id?: string
    title: string | null
    handle: string | null
    thumbnail: string | null
    review_rating?: number | null
    review_count?: number | null
  } & HitPricing
>

type StoreHitsProps = {
  hitsPerPage: number
  currencyCode: string
}

const StoreHits = ({ hitsPerPage, currencyCode }: StoreHitsProps) => {
  const { items } = useHits<ProductHit>()
  const { status, error, indexUiState } = useInstantSearch()
  const { isSearching, hasNoResultsYet } = useSearchSettled()

  const { page, ...refinements } = indexUiState
  const currentPage = page ?? 1
  const refinementKey = JSON.stringify(refinements)

  const [settled, setSettled] = useState({ page: currentPage, refinementKey })

  if (!isSearching && (settled.page !== currentPage || settled.refinementKey !== refinementKey)) {
    setSettled({ page: currentPage, refinementKey })
  }

  const isPagingOnly =
    refinementKey === settled.refinementKey &&
    currentPage !== settled.page

  const showSkeleton = hasNoResultsYet || (isSearching && isPagingOnly)
  const { countryCode } = useParams<{ countryCode: string }>()
  const productIds = JSON.stringify(items.map((hit) => hit.id ?? hit.objectID))
  const requestKey = JSON.stringify([countryCode, productIds])
  const [catalog, setCatalog] = useState<{
    key: string
    products: Map<string, HttpTypes.StoreProduct>
  }>()

  useEffect(() => {
    const ids: string[] = JSON.parse(productIds)
    if (showSkeleton || !ids.length) return
    let cancelled = false

    void listProducts({
      countryCode,
      queryParams: { id: ids, limit: ids.length },
    }).then(
      ({ response }) => {
        if (!cancelled) {
          setCatalog({
            key: requestKey,
            products: new Map(response.products.map((product) => [product.id, product])),
          })
        }
      },
      () => {
        if (!cancelled) setCatalog({ key: requestKey, products: new Map() })
      }
    )

    return () => { cancelled = true }
  }, [countryCode, productIds, requestKey, showSkeleton])

  const currentCatalog = catalog?.key === requestKey ? catalog : undefined

  if (status === "error") {
    return (
      <Text
        className="py-16 text-center text-ui-fg-error"
        data-testid="products-error"
      >
        商品加载失败
        {error?.message ? `: ${error.message}` : "."}
      </Text>
    )
  }

  return (
    <>
      {showSkeleton ? (
        <SkeletonProductGrid numberOfProducts={hitsPerPage} />
      ) : !items.length ? (
        <Text
          className="py-16 text-center text-ui-fg-subtle"
          data-testid="no-products"
        >
          没有符合筛选条件的商品。
        </Text>
      ) : (
        <ul
          className="grid w-full grid-cols-2 gap-3 xsmall:grid-cols-3 small:grid-cols-4 small:gap-4"
          data-testid="products-list"
        >
          {items.map((hit) =>
            hit.handle ? (
              <li key={hit.objectID} className="min-w-0">
                <ProductPreview
                  product={currentCatalog?.products.get(hit.id ?? hit.objectID) ?? {
                    id: hit.id ?? hit.objectID,
                    title: hit.title || "查看商品",
                    handle: hit.handle,
                    thumbnail: hit.thumbnail,
                  }}
                  isLoading={!currentCatalog}
                  indexedReviews={{ rating: hit.review_rating, count: hit.review_count }}
                  fallbackPrice={<HitPrice hit={hit} currencyCode={currencyCode} />}
                />
              </li>
            ) : null
          )}
        </ul>
      )}
      <SearchPagination />
    </>
  )
}

export default StoreHits
