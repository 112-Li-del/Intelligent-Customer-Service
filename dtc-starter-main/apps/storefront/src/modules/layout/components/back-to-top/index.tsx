"use client"

import { ArrowUpMini } from "@medusajs/icons"
import type { MouseEvent } from "react"

export default function BackToTop() {
  const scrollToTop = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    event.preventDefault()
    document.getElementById("top")?.focus({ preventScroll: true })

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" })
  }

  return (
    <a
      href="#top"
      onClick={scrollToTop}
      className="flex w-full items-center justify-center gap-2 bg-brand-slate py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#485769]"
    >
      <ArrowUpMini aria-hidden="true" className="h-4 w-4" />
      回到顶部
    </a>
  )
}
