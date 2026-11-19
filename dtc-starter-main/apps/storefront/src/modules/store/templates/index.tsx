"use client"

import type { SearchClient, UiState } from "instantsearch.js"
import { useMemo } from "react"
import { Configure, InstantSearch } from "react-instantsearch"

import { PRODUCT_INDEX_NAME } from "@lib/search-client"
import { createStoreSearchClient } from "@lib/store-search-client"
import StoreHits from "@modules/store/components/store-hits"
import StoreRefinements from "@modules/store/components/store-refinements"
import StoreSearchBox from "@modules/store/components/store-search-box"

const PRODUCT_LIMIT = 12

type StoreRoute = { q?: string; product?: UiState[string] }
const routing = {
  stateMapping: {
    stateToRoute(state: UiState): StoreRoute {
      const { query, configure: _configure, ...refinements } = state[PRODUCT_INDEX_NAME] ?? {}
      return { q: query || undefined, product: refinements }
    },
    routeToState(route: StoreRoute): UiState {
      const query = typeof route.q === "string" ? route.q.slice(0, 200) : route.product?.query
      return { [PRODUCT_INDEX_NAME]: { ...route.product, configure: undefined, query } }
    },
  },
}

const StoreTemplate = ({ countryCode, currencyCode }: { countryCode: string; currencyCode: string }) => {
  const searchClient = useMemo(() => createStoreSearchClient(countryCode), [countryCode])
  return (
    <div className="py-6 content-container" data-store-listing data-testid="category-container">
      <div className="mb-8 text-2xl-semi">
        <h1 data-testid="store-page-title">全部商品</h1>
      </div>

      <div className="flex flex-col gap-5 small:flex-row small:items-start small:gap-6">
        <InstantSearch
          indexName={PRODUCT_INDEX_NAME}
          searchClient={searchClient as unknown as SearchClient}
          routing={routing}
          future={{ preserveSharedStateOnUnmount: true }}
        >
          <Configure hitsPerPage={PRODUCT_LIMIT} />
          <StoreRefinements currencyCode={currencyCode} />
          <div className="w-full min-w-0">
            <StoreSearchBox />
            <StoreHits
              hitsPerPage={PRODUCT_LIMIT}
              currencyCode={currencyCode}
            />
          </div>
        </InstantSearch>
      </div>
    </div>
  )
}

export default StoreTemplate
