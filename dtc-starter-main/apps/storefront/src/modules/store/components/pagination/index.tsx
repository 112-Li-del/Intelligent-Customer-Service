"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PaginationBar } from "./pagination-bar"

function visiblePageNumbers(page: number, total: number) {
  let first = 1
  let last = total

  if (total > 7) {
    if (page <= 4) last = 5
    else if (page >= total - 3) first = total - 4
    else {
      first = page - 1
      last = page + 1
    }
  }

  return Array.from({ length: last - first + 1 }, (_, index) => first + index)
}

export function Pagination({
  page,
  totalPages,
  "data-testid": testId,
}: {
  page: number
  totalPages: number
  "data-testid"?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePageChange = (nextPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", String(nextPage))
    router.push(`${pathname}?${params}`)
  }

  return (
    <PaginationBar
      page={page}
      totalPages={totalPages}
      visiblePages={visiblePageNumbers(page, totalPages)}
      onPageChange={handlePageChange}
      data-testid={testId}
    />
  )
}
