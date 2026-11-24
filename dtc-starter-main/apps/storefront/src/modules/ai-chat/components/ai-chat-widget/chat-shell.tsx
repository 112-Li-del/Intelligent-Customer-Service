import { Sparkles, XMark } from "@medusajs/icons"
import type { AiChatProduct } from "@lib/util/ai-chat-events"
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { copy } from "./chat-copy"

const modeKey = "laicai.chat.display"
export default function ChatShell({
  open,
  productContext,
  isLive,
  closeChat,
  children,
}: {
  open: boolean
  productContext?: AiChatProduct
  isLive: boolean
  closeChat: () => void
  children: ReactNode
}) {
  const panel = useRef<HTMLElement>(null)
  const start = useRef<number | null>(null)
  const previousRect = useRef<DOMRect | null>(null)
  const scrollOffset = useRef(0)
  const [drawer, setDrawer] = useState(() => {
    try {
      return localStorage.getItem(modeKey) === "drawer"
    } catch {
      return false
    }
  })
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)")
    const update = () => setMobile(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  useEffect(() => {
    if (!open || !mobile) return
    const node = panel.current
    const old = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const viewport = window.visualViewport
    const resize = () => {
      if (!viewport || !node) return
      node.style.setProperty("--chat-visible-height", viewport.height + "px")
      node.style.setProperty(
        "--chat-keyboard",
        Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height) +
          "px"
      )
    }
    resize()
    viewport?.addEventListener("resize", resize)
    viewport?.addEventListener("scroll", resize)
    return () => {
      document.body.style.overflow = old
      viewport?.removeEventListener("resize", resize)
      viewport?.removeEventListener("scroll", resize)
    }
  }, [mobile, open])
  useLayoutEffect(() => {
    const from = previousRect.current,
      node = panel.current
    previousRect.current = null
    const log = node?.querySelector<HTMLElement>('[role="log"]')
    if (from && log) log.scrollTop = scrollOffset.current
    if (
      !from ||
      !node ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return
    const to = node.getBoundingClientRect()
    const animation = node.animate(
      [
        {
          transform: `translate(${from.left - to.left}px,${
            from.top - to.top
          }px) scale(${from.width / to.width},${from.height / to.height})`,
        },
        { transform: "none" },
      ],
      { duration: 180, easing: "ease-out" }
    )
    return () => animation.cancel()
  }, [drawer])
  function toggleMode() {
    scrollOffset.current = panel.current?.querySelector('[role="log"]')?.scrollTop ?? 0
    previousRect.current = panel.current?.getBoundingClientRect() ?? null
    setDrawer(!drawer)
    try {
      localStorage.setItem(modeKey, drawer ? "compact" : "drawer")
    } catch {
      /* Private browsing. */
    }
  }
  return (
    <>
      {mobile && open && (
        <div
          aria-hidden
          className="fixed inset-0 z-[79] bg-brand-navy/35"
          onClick={closeChat}
        />
      )}
      <section
        ref={panel}
        id="ai-chat-panel"
        role="dialog"
        aria-modal={open && mobile}
        aria-labelledby="ai-chat-title"
        aria-hidden={!open}
        inert={!open}
        data-open={open}
        data-drawer={drawer}
        className="ai-chat-panel fixed z-[80] flex flex-col overflow-hidden border border-stone-200 bg-white/95 text-brand-navy shadow-chat backdrop-blur-xl"
        onKeyDown={(e) => {
          if (!mobile || e.key !== "Tab") return
          const focusable = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled), textarea, input, a[href], summary, [tabindex="0"]'
            )
          ).filter(
            (el) =>
              el.getClientRects().length &&
              !el.closest("details:not([open]) > :not(summary)")
          )
          const boundary = e.shiftKey
            ? focusable[0]
            : focusable[focusable.length - 1]
          if (document.activeElement === boundary) {
            e.preventDefault()
            ;(e.shiftKey
              ? focusable[focusable.length - 1]
              : focusable[0]
            )?.focus()
          }
        }}
      >
        <button
          type="button"
          className="chat-handle touch-none py-2"
          aria-label={copy.handle}
          onClick={closeChat}
          onPointerDown={(e) => {
            start.current = e.clientY
            e.currentTarget.setPointerCapture(e.pointerId)
          }}
          onPointerCancel={() => {
            start.current = null
          }}
          onPointerUp={(e) => {
            if (start.current !== null && e.clientY - start.current > 50)
              closeChat()
            start.current = null
          }}
        >
          <span
            aria-hidden
            className="mx-auto block h-1 w-10 rounded-full bg-stone-400"
          />
        </button>
        <header className="flex shrink-0 items-center gap-3 border-b border-stone-200 bg-gradient-to-r from-brand-navy/10 via-white/60 to-white/90 px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-navy text-brand-orange">
            <Sparkles />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="ai-chat-title" className="text-sm font-semibold">
              {copy.title}
            </h2>
            <p className="truncate text-xs text-stone-600">
              {productContext?.name ?? copy.catalog}
            </p>
          </div>
          {isLive && (
            <span className="text-xs font-medium text-green-800">
              {copy.live}
            </span>
          )}
          <button
            type="button"
            className="chat-mode chat-action"
            aria-label={drawer ? copy.compact : copy.drawer}
            title={drawer ? copy.compact : copy.drawer}
            onClick={toggleMode}
          >
            <span aria-hidden>{drawer ? "↙" : "↗"}</span>
          </button>
          <button
            type="button"
            className="chat-action"
            aria-label={copy.close}
            onClick={closeChat}
          >
            <XMark />
          </button>
        </header>
        {children}
      </section>
    </>
  )
}
