import { parseSearchParams, type InstantSearchRequest } from "@medusajs/instantsearch-adapter"
import { getSynonymProductIds } from "@lib/data/search-synonyms"
import { searchClient } from "@lib/search-client"
import { expandSearchKeywords } from "@lib/util/search-synonyms"

export function createStoreSearchClient(countryCode: string): typeof searchClient {
  async function expandRequests(requests: InstantSearchRequest[]) {
    const idsByQuery = new Map<string, ReturnType<typeof getSynonymProductIds>>()

    return Promise.all(requests.map(async (request) => {
      const params = parseSearchParams(request.params)
      const query = params.query?.trim().slice(0, 200)
      if (!query || expandSearchKeywords(query).length < 2) return request

      let pending = idsByQuery.get(query)
      if (!pending) {
        pending = getSynonymProductIds(countryCode, query)
        idsByQuery.set(query, pending)
      }
      const ids = await pending
      if (!ids) return request

      const existing = typeof params.facetFilters === "string" ? [params.facetFilters] : params.facetFilters ?? []
      return {
        ...request,
        params: {
          ...params,
          query: "",
          facetFilters: [...existing, ids.length ? ids.map((id) => `id:${id}`) : "id:__no_catalog_matches__"],
        },
      }
    }))
  }

  return {
    ...searchClient,
    search: async (requests) => searchClient.search(await expandRequests(requests)),
    searchForFacetValues: async (requests) => searchClient.searchForFacetValues(await expandRequests(requests)),
  }
}
