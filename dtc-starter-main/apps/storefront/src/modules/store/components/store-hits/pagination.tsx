"use client"

import { usePagination } from "react-instantsearch"
import { PaginationBar } from "../pagination/pagination-bar"

export default function SearchPagination() {
  const { pages, currentRefinement, nbPages, refine } = usePagination({ padding: 2 })

  return (
    <PaginationBar
      page={currentRefinement + 1}
      totalPages={nbPages}
      visiblePages={pages.map((index) => index + 1)}
      onPageChange={(page) => refine(page - 1)}
      data-testid="product-pagination"
    />
  )
}
