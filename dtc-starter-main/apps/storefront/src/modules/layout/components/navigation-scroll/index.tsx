"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

export default function NavigationScroll() {
  const pathname = usePathname()
  const previousPath = useRef(pathname)
  const restoringHistory = useRef(false)
  const positions = useRef(new Map<string, number>())

  useEffect(() => {
    const onPopState = () => {
      restoringHistory.current = previousPath.current !== window.location.pathname
    }
    const rememberPosition = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a[href]")) {
        positions.current.set(window.location.pathname, window.scrollY)
      }
    }
    document.addEventListener("click", rememberPosition, true)
    window.addEventListener("popstate", onPopState)
    return () => {
      document.removeEventListener("click", rememberPosition, true)
      window.removeEventListener("popstate", onPopState)
    }
  }, [])

  useEffect(() => {
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    const restore = restoringHistory.current
    restoringHistory.current = false
    if (window.location.hash) return
    const top = restore ? positions.current.get(pathname) : 0
    if (top === undefined) return

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top, left: 0, behavior: "instant" })
    })
    const observer = restore ? new ResizeObserver(() => {
      window.scrollTo({ top, left: 0, behavior: "instant" })
    }) : null
    observer?.observe(document.body)
    const stopRestoring = () => observer?.disconnect()
    window.addEventListener("wheel", stopRestoring, { passive: true })
    window.addEventListener("touchstart", stopRestoring, { passive: true })
    window.addEventListener("keydown", stopRestoring)
    return () => {
      window.cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener("wheel", stopRestoring)
      window.removeEventListener("touchstart", stopRestoring)
      window.removeEventListener("keydown", stopRestoring)
    }
  }, [pathname])

  return null
}
