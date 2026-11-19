"use client"

import { ChevronLeft } from "@medusajs/icons"
import { useRouter } from "next/navigation"

function canGoBackInStore() {
  const { navigation } = window as Window & { navigation?: { canGoBack: boolean } }
  if (navigation) return navigation.canGoBack
  if (window.history.length < 2) return false

  // Older browsers include blank tabs and other sites in history.length.
  const initialUrl = performance.getEntriesByType("navigation")[0]?.name
  return Boolean(
    (initialUrl && new URL(initialUrl).pathname !== window.location.pathname) ||
    (document.referrer && new URL(document.referrer).origin === window.location.origin)
  )
}

export default function ProductBreadcrumbBack({ countryCode }: { countryCode: string }) {
  const router = useRouter()

  const goBack = () => {
    if (canGoBackInStore()) {
      router.back()
    } else {
      router.push(`/${countryCode}/store`)
    }
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex min-h-8 w-fit shrink-0 items-center gap-1 rounded-sm font-medium text-brand-navy transition-colors hover:text-[#C7511F] hover:underline"
    >
      <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
      返回上一页
    </button>
  )
}
