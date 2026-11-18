"use client"

import { useSortBy } from "react-instantsearch"
import { useState } from "react"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"
import {
  CATEGORY_ATTRIBUTE,
  LABELS_ATTRIBUTE,
  getSortOptions,
} from "./attributes"
import CurrentRefinements from "./current-refinements"
import OnSaleToggle from "./on-sale-toggle"
import OptionRefinements from "./option-refinements"
import PriceRange from "./price-range"
import RefinementGroup from "./refinement-group"

const SortProducts = ({ currencyCode }: { currencyCode: string }) => {
  const items = getSortOptions(currencyCode)
  const { currentRefinement, refine } = useSortBy({ items })

  return (
    <FilterRadioGroup
      title="排序"
      items={items}
      value={currentRefinement}
      handleChange={refine}
      data-testid="sort-by-container"
    />
  )
}

const StoreRefinements = ({ currencyCode }: { currencyCode: string }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <aside aria-label="商品筛选" className="rounded-lg border border-gray-200 bg-white small:w-[220px] small:shrink-0">
      <button
        type="button"
        aria-controls="store-filter-controls"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((current) => !current)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-brand-navy small:hidden"
      >
        筛选与排序
        <span aria-hidden="true">{isExpanded ? "−" : "+"}</span>
      </button>
      <div id="store-filter-controls" className={`${isExpanded ? "flex" : "hidden"} flex-col gap-6 p-4 small:flex`}>
        <SortProducts currencyCode={currencyCode} />
        <CurrentRefinements currencyCode={currencyCode} />
        <OptionRefinements />
        <PriceRange currencyCode={currencyCode} />
        <OnSaleToggle currencyCode={currencyCode} />
        <RefinementGroup attribute={CATEGORY_ATTRIBUTE} title="分类" />
        <RefinementGroup attribute={LABELS_ATTRIBUTE} title="标签" />
      </div>
    </aside>
  )
}

export default StoreRefinements
