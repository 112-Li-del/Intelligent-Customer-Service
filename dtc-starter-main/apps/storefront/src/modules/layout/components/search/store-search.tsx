"use client"

import { MagnifyingGlass } from "@medusajs/icons"
import { useParams } from "next/navigation"
import { useId } from "react"

const StoreSearch = () => {
  const { countryCode } = useParams<{ countryCode: string }>()
  const inputId = useId()

  return (
    <form
      role="search"
      method="get"
      action={`/${countryCode}/search`}
      className="flex h-11 w-full overflow-hidden rounded-md bg-white shadow-sm focus-within:ring-2 focus-within:ring-brand-orange"
      {...{
        toolname: "search_products",
        tooldescription: "Search the store's products by keyword",
      }}
    >
      <span className="hidden shrink-0 items-center border-r border-gray-300 bg-gray-100 px-4 text-xs font-medium text-gray-700 xsmall:flex">
        全部分类
      </span>
      <label htmlFor={inputId} className="sr-only">
        搜索知选商城商品
      </label>
      <input
        id={inputId}
        type="search"
        name="q"
        required
        maxLength={200}
        placeholder="搜索知选商城商品、品牌或规格..."
        className="min-w-0 flex-1 border-0 bg-white px-4 text-sm text-brand-ink outline-none ring-0 placeholder:text-gray-500 focus-visible:ring-0"
        data-testid="nav-search-input"
      />
      <button
        type="submit"
        aria-label="搜索商品"
        className="flex w-12 shrink-0 items-center justify-center bg-brand-orange text-brand-navy transition-colors hover:bg-brand-orange-hover focus-visible:ring-inset"
        data-testid="nav-search-button"
      >
        <MagnifyingGlass className="h-5 w-5" />
      </button>
    </form>
  )
}

export default StoreSearch
