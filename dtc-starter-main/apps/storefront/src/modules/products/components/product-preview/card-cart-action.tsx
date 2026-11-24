"use client"

import { addToCart } from "@lib/data/cart"
import { notifyCartUpdated } from "@lib/util/cart-events"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ShoppingCart } from "@medusajs/icons"
import { useParams } from "next/navigation"
import { useState } from "react"

const actionClass = "flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-yellow to-brand-action px-2 text-xs font-semibold leading-5 text-brand-ink hover:from-brand-action hover:to-brand-action-hover"

export default function CardCartAction({
  href,
  variantId,
  label,
}: {
  href: string
  variantId?: string
  label: string
}) {
  const { countryCode } = useParams<{ countryCode: string }>()
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle")

  if (!variantId) {
    return (
      <LocalizedClientLink href={href} className={actionClass}>
        {label.includes("购物车") && <ShoppingCart aria-hidden="true" className="h-4 w-4 shrink-0" />}
        {label}
      </LocalizedClientLink>
    )
  }

  const handleAdd = async () => {
    setStatus("adding")
    try {
      await addToCart({ variantId, quantity: 1, countryCode })
      notifyCartUpdated()
      setStatus("added")
    } catch {
      setStatus("error")
    }
  }

  return (
    <button
      type="button"
      disabled={status === "adding"}
      onClick={handleAdd}
      aria-live="polite"
      className={`${actionClass} disabled:opacity-70`}
    >
      <ShoppingCart aria-hidden="true" className="h-4 w-4 shrink-0" />
      {status === "adding" ? "正在添加" : status === "added" ? "已加入 · 再加一件" : status === "error" ? "添加失败 · 重试" : label}
    </button>
  )
}
