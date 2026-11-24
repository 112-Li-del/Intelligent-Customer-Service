import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import { Fragment } from "react"

type PaginationBarProps = {
  page: number
  totalPages: number
  visiblePages: number[]
  onPageChange: (page: number) => void
  "data-testid"?: string
}

const arrowClass = "inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-full px-2 text-sm font-semibold text-brand-navy transition-colors enabled:hover:bg-brand-amber-light disabled:cursor-default disabled:text-stone-400 small:px-3"

export function PaginationBar({
  page,
  totalPages,
  visiblePages,
  onPageChange,
  "data-testid": testId,
}: PaginationBarProps) {
  if (totalPages <= 1) return null

  const pages = Array.from(new Set([1, ...visiblePages, totalPages]))

  return (
    <nav
      aria-label="商品分页"
      data-testid={testId}
      className="mx-auto mb-2 mt-8 flex w-fit max-w-full items-center gap-1 rounded-[28px] border border-[#E2D8CA] bg-[#FFFCF7] p-1 shadow-card-warm small:mt-10"
    >
      <button type="button" aria-label="上一页" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className={arrowClass}>
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        <span className="hidden small:inline">上一页</span>
      </button>

      <div className="flex min-w-0 flex-wrap items-center justify-center gap-1 border-x border-[#E8DFD3] px-1.5">
        {pages.map((number, index) => (
          <Fragment key={number}>
            {index > 0 && number - pages[index - 1] > 1 && (
              <span aria-hidden="true" className="px-0.5 text-stone-500">…</span>
            )}
            <button
              type="button"
              aria-label={`第 ${number} 页`}
              aria-current={number === page ? "page" : undefined}
              disabled={number === page}
              onClick={() => onPageChange(number)}
              className={`inline-flex h-11 min-w-11 items-center justify-center rounded-full px-2 text-sm font-semibold tabular-nums transition-colors ${
                number === page
                  ? "bg-brand-navy text-brand-orange shadow-sm"
                  : "text-brand-navy hover:bg-brand-amber-light"
              }`}
            >
              {number}
            </button>
          </Fragment>
        ))}
      </div>

      <button type="button" aria-label="下一页" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className={arrowClass}>
        <span className="hidden small:inline">下一页</span>
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </nav>
  )
}
