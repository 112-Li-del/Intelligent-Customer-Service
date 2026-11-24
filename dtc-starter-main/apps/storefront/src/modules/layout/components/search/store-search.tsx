"use client"

import { openAiChat } from "@lib/util/ai-chat-events"
import { getRelatedSearches } from "@lib/util/search-synonyms"
import { ArrowUpRightMini, MagnifyingGlass, Sparkles, Trash, XMark } from "@medusajs/icons"
import Image from "next/image"
import Link from "next/link"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useId, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import type { SearchPreviewProduct } from "types/search-preview"

const HISTORY_KEY = "laicai:recent-searches"
const HOT_SEARCHES = ["卫衣", "充电宝", "保温杯", "拖把", "瑜伽垫", "慢食碗"]
const candidateClass = "rounded-lg transition-colors hover:bg-[#FFFBF5] focus-visible:bg-[#FFFBF5] focus-visible:ring-inset focus-visible:ring-offset-0"

function readHistory(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 6)
      : []
  } catch {
    return []
  }
}

function Highlight({ text, query }: { text: string; query: string }) {
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (!query || index < 0) return text

  return (
    <>
      {text.slice(0, index)}
      <strong className="font-bold text-[#965900]">{text.slice(index, index + query.length)}</strong>
      {text.slice(index + query.length)}
    </>
  )
}

const StoreSearchForm = ({ initialQuery = "", category }: { initialQuery?: string; category?: string }) => {
  const { countryCode } = useParams<{ countryCode: string }>()
  const router = useRouter()
  const inputId = useId()
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const compositionRange = useRef<{ before: string; after: string } | null>(null)
  const [query, setQuery] = useState(initialQuery)
  const [isOpen, setIsOpen] = useState(false)
  const [compositionQuery, setCompositionQuery] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [result, setResult] = useState<{ query: string; composing: boolean; products: SearchPreviewProduct[] | null }>()
  const isComposing = compositionQuery !== null
  const keyword = (compositionQuery ?? query).trim()
  const currentResult = result?.query === keyword && result.composing === isComposing ? result : undefined
  const isUpdating = Boolean(keyword && !currentResult)
  const displayedResult = currentResult ?? (isUpdating && result?.products?.length ? result : undefined)

  useEffect(() => {
    if (!isOpen || !keyword) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams({ q: keyword, countryCode })
      if (category) params.set("category", category)
      if (isComposing) params.set("composing", "1")
      try {
        const response = await fetch(`/api/search-preview?${params}`, { signal: controller.signal })
        if (!response.ok) throw new Error("Search unavailable")
        const products: SearchPreviewProduct[] = await response.json()
        if (!controller.signal.aborted) setResult({ query: keyword, composing: isComposing, products })
      } catch {
        if (!controller.signal.aborted) setResult({ query: keyword, composing: isComposing, products: null })
      }
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [category, countryCode, isComposing, isOpen, keyword])

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener("pointerdown", closeOnOutside)
    return () => document.removeEventListener("pointerdown", closeOnOutside)
  }, [isOpen])

  const open = () => {
    setHistory(readHistory())
    setIsOpen(true)
  }

  const saveHistory = (items: string[]) => {
    setHistory(items)
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items)) } catch {}
  }

  const remember = (term: string) => {
    if (term) saveHistory([term, ...readHistory().filter((item) => item !== term)].slice(0, 6))
  }

  const updateHistory = (items: string[]) => {
    inputRef.current?.focus()
    saveHistory(items)
  }

  const search = (term: string) => {
    remember(term)
    setIsOpen(false)
    setQuery(term)
    const params = new URLSearchParams({ q: term })
    if (category) params.set("category", category)
    router.push(`/${countryCode}/search?${params}`)
  }

  const handleNavigation = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229 || compositionRange.current) return
    if (event.key === "Escape" && isOpen) {
      event.preventDefault()
      inputRef.current?.focus()
      setIsOpen(false)
      return
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
    if (!(event.target instanceof HTMLElement)) return
    if (event.target !== inputRef.current && !event.target.hasAttribute("data-search-candidate")) return
    event.preventDefault()
    if (!isOpen) {
      open()
      return
    }
    const candidates = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-search-candidate]") ?? [])
      .filter((candidate) => !candidate.closest("[inert]"))
    if (!candidates.length) return
    const index = candidates.indexOf(event.target)
    const next = index === -1
      ? (event.key === "ArrowDown" ? 0 : candidates.length - 1)
      : (index + (event.key === "ArrowDown" ? 1 : -1) + candidates.length) % candidates.length
    candidates[next].focus()
  }

  const products = displayedResult?.products
  const displayedKeyword = displayedResult?.query ?? keyword
  const relatedSearches = getRelatedSearches(displayedKeyword)
  const suggestions = Array.from(new Set(products?.map(({ title }) => title))).slice(0, 3)

  return (
    <div
      ref={rootRef}
      className={`relative ${isOpen ? "z-[60]" : ""}`}
      onKeyDown={handleNavigation}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false)
      }}
    >
      <form
        role="search"
        method="get"
        action={`/${countryCode}/search`}
        onSubmit={(event) => {
          event.preventDefault()
          if (!compositionRange.current) search(query.trim())
        }}
        className="flex h-11 w-full gap-1 rounded-2xl bg-white/95 p-1.5 shadow-sm ring-1 ring-white/30 backdrop-blur-md transition-shadow focus-within:ring-2 focus-within:ring-brand-orange"
        {...{
          toolname: "search_products",
          tooldescription: "Search the store's products by keyword",
        }}
      >
        {category && <input type="hidden" name="category" value={category} />}
        <label htmlFor={inputId} className="sr-only">搜索来财商城商品</label>
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          name="q"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
            if (!event.target.value.trim() && !compositionRange.current) setResult(undefined)
          }}
          onFocus={open}
          onClick={open}
          onCompositionStart={({ currentTarget: input }) => {
            const before = input.value.slice(0, input.selectionStart ?? input.value.length)
            const after = input.value.slice(input.selectionEnd ?? input.value.length)
            compositionRange.current = { before, after }
            setCompositionQuery("")
            setIsOpen(true)
          }}
          onCompositionUpdate={({ data }) => {
            const range = compositionRange.current
            if (range) setCompositionQuery(data ? `${range.before}${data}${range.after}` : "")
          }}
          onCompositionEnd={({ currentTarget: input }) => {
            compositionRange.current = null
            setCompositionQuery(null)
            setQuery(input.value)
          }}
          autoComplete="off"
          aria-controls={isOpen ? panelId : undefined}
          maxLength={200}
          placeholder="搜索来财商城商品、品牌或规格..."
          className="min-w-0 flex-1 appearance-none rounded-lg border-0 bg-transparent px-3 text-sm text-brand-ink placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
          data-testid="nav-search-input"
        />
        <button
          type="submit"
          aria-label="搜索商品"
          className="flex w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange to-brand-action text-brand-navy hover:to-brand-action-hover focus-visible:ring-inset focus-visible:ring-offset-0"
          data-testid="nav-search-button"
        >
          <MagnifyingGlass className="h-5 w-5" />
        </button>
      </form>

      {isOpen && (
        <div id={panelId} role="region" aria-label="搜索联想" aria-busy={isUpdating} onMouseDown={(event) => {
          if (isComposing && event.target instanceof Element && event.target.closest("a, button")) event.preventDefault()
        }} className="absolute inset-x-0 top-full mt-2 max-h-[min(65dvh,36rem)] overflow-y-auto overscroll-contain glass-card rounded-2xl border-gray-100 bg-white/[0.97] text-sm text-brand-ink shadow-2xl">
          {!keyword ? (
            <div className="space-y-4 p-4">
              {history.length > 0 && (
                <section aria-label="最近搜索">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="font-semibold">最近搜索</h2>
                    <button type="button" onClick={() => updateHistory([])} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
                      <Trash className="h-3.5 w-3.5" aria-hidden="true" />清空
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((term) => (
                      <div key={term} className="inline-flex max-w-full items-center rounded-full bg-gray-100">
                        <button type="button" data-search-candidate onClick={() => search(term)} className="min-w-0 truncate rounded-full py-1.5 pl-3 pr-1.5 hover:text-[#C7511F] focus-visible:ring-inset">{term}</button>
                        <button type="button" aria-label={`删除搜索记录 ${term}`} onClick={() => updateHistory(history.filter((item) => item !== term))} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-200 hover:text-[#C7511F]">
                          <XMark className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <section aria-label="热门搜索推荐">
                <h2 className="mb-2 font-semibold">热门搜索推荐</h2>
                <div className="flex flex-wrap gap-2">
                  {HOT_SEARCHES.map((term) => (
                    <button key={term} type="button" data-search-candidate onClick={() => search(term)} className="rounded-full border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-[#895015] hover:from-amber-100 hover:to-orange-100 focus-visible:ring-inset">{term}</button>
                  ))}
                </div>
              </section>
            </div>
          ) : !displayedResult ? (
            <div role="status" className="space-y-3 px-4 py-3">
              <p className="text-gray-600">正在查找商品…</p>
              <div aria-hidden="true" className="h-8 rounded-md bg-gray-100 motion-safe:animate-pulse" />
            </div>
          ) : !products ? (
            <p role="status" className="px-4 py-3 text-gray-600">暂时无法加载联想，可提交关键词查看搜索结果。</p>
          ) : !products.length && isComposing ? (
            <p role="status" className="px-4 py-3 text-gray-600">暂无联想，继续输入或选字后再试。</p>
          ) : !products.length ? (
            <div className="space-y-2 px-4 py-3">
              <p role="status" className="break-words text-gray-600">未找到与「{keyword}」相关的商品。</p>
              <button type="button" data-search-candidate onClick={() => {
                setIsOpen(false)
                openAiChat({
                  scope: "catalog",
                  query: `我在商城搜索「${keyword}」时没有找到商品。能帮我推荐合适的商品吗？`,
                })
              }} className={`inline-flex items-center gap-2 border-l-2 border-brand-orange bg-gradient-to-r from-[#FFFBF5] to-transparent px-3 py-2 font-semibold text-[#8A4B08] ${candidateClass}`}>
                <Sparkles aria-hidden="true" className="h-4 w-4" />问问来财 AI 导购 <span aria-hidden="true">→</span>
              </button>
            </div>
          ) : (
            <>
              {isUpdating && (
                <div role="status" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 bg-gradient-to-r from-brand-orange to-brand-action motion-safe:animate-pulse">
                  <span className="sr-only">正在更新商品联想…</span>
                </div>
              )}
              {relatedSearches.length > 0 && (
                <section inert={isUpdating} aria-label="相关细分品类" className="border-b border-gray-100 px-4 py-3">
                  <h2 className="mb-2 text-xs font-semibold text-gray-500">相关细分品类</h2>
                  <div className="flex flex-wrap gap-2">
                    {relatedSearches.map(({ keyword: term, label }) => (
                      <button key={term} type="button" data-search-candidate onClick={() => search(term)} className="rounded-full border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-[#895015] hover:from-amber-100 hover:to-orange-100 focus-visible:ring-inset">
                        {label}
                      </button>
                    ))}
                  </div>
                </section>
              )}
              <section inert={isUpdating} className="px-2 py-2" aria-label="关键词联想">
                <h2 className="px-2 pb-1 text-xs font-semibold text-gray-500">关键词联想</h2>
                {suggestions.map((term) => (
                  <div key={term} className="flex min-w-0 items-center">
                    <button type="button" data-search-candidate onClick={() => search(term)} className={`min-w-0 flex-1 truncate px-2 py-2 text-left ${candidateClass}`}>
                      <Highlight text={term} query={displayedKeyword} />
                    </button>
                    {!displayedResult.composing && (
                      <button type="button" aria-label={`填入 ${term}`} onClick={() => {
                        setQuery(term)
                        inputRef.current?.focus()
                      }} className={`p-2 text-gray-500 ${candidateClass}`}>
                        <ArrowUpRightMini aria-hidden="true" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </section>
              <section inert={isUpdating} className="border-t border-gray-100 px-2 py-2" aria-label="匹配商品直达">
                <h2 className="px-2 pb-1 text-xs font-semibold text-gray-500">匹配商品直达</h2>
                {products.map((product) => (
                  <Link key={product.id} data-search-candidate href={`/${countryCode}/products/${encodeURIComponent(product.handle)}`} onClick={() => {
                    remember(isComposing ? product.title : keyword)
                    setIsOpen(false)
                  }} className={`flex items-center gap-3 px-2 py-2 ${candidateClass}`}>
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[#F7F8F8]">
                      {product.image && <Image src={product.image} alt="" fill sizes="48px" className="object-contain" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium"><Highlight text={product.title} query={displayedKeyword} /></p>
                      {product.inStock && <p className="mt-0.5 text-xs text-[#007600]">现货速发</p>}
                    </div>
                    {product.price && <span className="shrink-0 whitespace-nowrap font-bold text-[#B12704]">{product.price}</span>}
                  </Link>
                ))}
              </section>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function StoreSearchWithLocation() {
  const { countryCode } = useParams<{ countryCode: string }>()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isSearchPage = pathname === `/${countryCode}/search`
  const isCatalog = isSearchPage || pathname === `/${countryCode}/store`
  const query = isCatalog ? searchParams.get("q") ?? "" : ""
  const category = isSearchPage ? searchParams.get("category") ?? undefined : undefined

  const formKey = JSON.stringify([pathname, isSearchPage ? query : undefined, category])
  return <StoreSearchForm key={formKey} initialQuery={query} category={category} />
}

const StoreSearch = () => (
  <Suspense fallback={<StoreSearchForm />}>
    <StoreSearchWithLocation />
  </Suspense>
)

export default StoreSearch
