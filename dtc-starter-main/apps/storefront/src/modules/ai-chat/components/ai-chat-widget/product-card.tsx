import { addToCart } from "@lib/data/cart"
import { listProducts } from "@lib/data/products"
import { notifyCartUpdated } from "@lib/util/cart-events"
import { isVariantInStock } from "@lib/util/inventory"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import type { AiProductRecommendation } from "../../types"
import { StatusBadge, stockTone } from "./status-badge"

function Thumbnail({ src, title }: { src: string | null; title: string }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const usable =
    src && /^(?:https?:\/\/|\/(?!\/))/.test(src) && state !== "error"
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
      {usable ? (
        <>
          {state === "loading" && (
            <div
              aria-hidden
              className="absolute inset-0 bg-stone-200 motion-safe:animate-pulse"
            />
          )}
          <Image
            src={src}
            fill
            alt={title}
            sizes="200px"
            loading="lazy"
            onLoad={() => setState("ready")}
            onError={() => setState("error")}
            className="object-contain"
          />
        </>
      ) : (
        <span className="absolute inset-0 grid place-items-center text-xs text-stone-500">
          暂无商品图
        </span>
      )}
    </div>
  )
}

export default function ProductCard({
  product,
}: {
  product: AiProductRecommendation
}) {
  const { countryCode } = useParams<{ countryCode: string }>()
  const { variantId, handle, stockStatus } = product
  const soldOut = stockTone(stockStatus ?? "") === "out"
  const [resolved, setResolved] = useState<{ key: string; id?: string }>()
  const key = countryCode + "/" + handle
  const selected =
    variantId || (resolved?.key === key ? resolved.id : undefined)
  const resolving = !variantId && !!handle && !soldOut && resolved?.key !== key
  const [state, setState] = useState<"idle" | "adding" | "added" | "error">(
    "idle"
  )
  const pending = useRef(false)
  const tip = useId()
  useEffect(() => {
    if (variantId || !handle || soldOut) return
    let active = true
    listProducts({
      countryCode,
      fresh: true,
      queryParams: { handle, limit: 1 },
    })
      .then(
        ({ response }) =>
          response.products
            .find((item) => item.handle === handle)
            ?.variants?.find(isVariantInStock)?.id
      )
      .catch(() => undefined)
      .then((id) => {
        if (active) setResolved({ key, id })
      })
    return () => {
      active = false
    }
  }, [countryCode, handle, key, soldOut, variantId])
  useEffect(() => {
    if (state !== "added") return
    const timer = window.setTimeout(() => setState("idle"), 1800)
    return () => window.clearTimeout(timer)
  }, [state])

  async function add() {
    if (!selected || pending.current || soldOut) return
    pending.current = true
    setState("adding")
    try {
      await addToCart({ variantId: selected, quantity: 1, countryCode })
      notifyCartUpdated()
      setState("added")
    } catch {
      setState("error")
    } finally {
      pending.current = false
    }
  }

  const unavailable = soldOut || (!selected && !resolving)
  return (
    <article className="flex min-w-0 snap-start flex-col overflow-hidden rounded-xl border border-stone-200 bg-white text-brand-navy shadow-sm">
      <Thumbnail
        key={product.thumbnail}
        src={product.thumbnail}
        title={product.title}
      />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h4
          className="line-clamp-2 text-sm font-semibold leading-snug"
          title={product.title}
        >
          {product.title}
        </h4>
        <div className="flex flex-wrap items-center gap-1.5">
          <strong className="tabular-nums">
            {product.price ?? "价格待确认"}
          </strong>
          {stockStatus && <StatusBadge label={stockStatus} />}
        </div>
        {product.reason && (
          <p className="text-xs leading-relaxed text-stone-600">
            <span className="mr-1 inline-block rounded bg-brand-orange/30 px-1.5 font-medium text-amber-900">
              推荐理由
            </span>
            {product.reason}
          </p>
        )}
        <div className="group relative mt-auto grid gap-1 pt-2 text-center text-xs font-semibold">
          <LocalizedClientLink
            href={product.href.replace(/^\/[a-z]{2}(?=\/)/i, "")}
            aria-describedby={unavailable ? tip : undefined}
            className="rounded-md border border-stone-300 px-2 py-2 hover:bg-stone-50"
          >
            查看详情
          </LocalizedClientLink>
          {unavailable ? (
            <span
              id={tip}
              role="tooltip"
              className="sr-only group-hover:not-sr-only group-focus-within:not-sr-only group-hover:text-stone-600 group-focus-within:text-stone-600"
            >
              {soldOut ? "商品暂时缺货" : "暂无可确认的规格，请在详情页选择。"}
            </span>
          ) : (
            <button
              type="button"
              disabled={!selected || state === "adding" || state === "added"}
              onClick={add}
              className="rounded-md bg-brand-yellow px-2 py-2 text-brand-navy hover:brightness-95 disabled:opacity-75"
            >
              {resolving ? (
                "查询规格…"
              ) : state === "adding" ? (
                "正在加入…"
              ) : state === "added" ? (
                <span className="inline-block motion-safe:animate-pulse">
                  ✓ 已加入
                </span>
              ) : (
                "加入购物车"
              )}
            </button>
          )}
          <span
            role="status"
            className={state === "error" ? "text-xs text-red-700" : "sr-only"}
          >
            {state === "error"
              ? "未能加入，请重试。"
              : state === "added"
              ? "已加入购物车"
              : ""}
          </span>
        </div>
      </div>
    </article>
  )
}
