"use client"

import {
  AI_CHAT_EVENT,
  AiChatOpenDetail,
  AiChatProduct,
  getAiChatPageProduct,
  getServerAiChatPageProduct,
  subscribeToAiChatPageProduct,
} from "@lib/util/ai-chat-events"
import {
  ArrowRight,
  ChatBubbleLeftRight,
  Sparkles,
  XMark,
} from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import Image from "next/image"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { getProductReply } from "./product-reply"

type ChatMessage = {
  id: number
  role: "assistant" | "user"
  content: string
  products?: RecommendedProduct[]
}

type RecommendedProduct = { title: string; href: string; reason: string; price: string | null }

const WELCOME_MESSAGE =
  "你好，我是来财 AI 导购。你可以告诉我使用场景、预算、尺码或风格偏好，我会帮你理清选购思路。"

const QUICK_PROMPTS = [
  "推荐一款日常百搭的卫衣",
  "退换货政策是怎样的？",
  "帮我分析该怎么选尺码",
]

const initialMessages: ChatMessage[] = [
  { id: 0, role: "assistant", content: WELCOME_MESSAGE },
]

const getMockReply = (query: string, product?: AiChatProduct) => {
  if (query.includes("退") || query.includes("换")) {
    return "退换货条件会受到商品类型、订单状态和地区政策影响。你可以先查看商品详情页的配送与退货说明，最终以下单时的政策为准；如果告诉我具体商品，我也可以帮你整理需要确认的要点。"
  }

  if (product) {
    return getProductReply(query, product)
  }

  if (query.includes("尺码") || query.includes("尺寸")) {
    return "选尺码时建议结合身高、体重、平时常穿尺码和偏好的宽松程度判断。打开商品详情页后，可以查询该商品提供的尺码资料。"
  }

  if (
    query.includes("推荐") ||
    query.includes("挑选") ||
    query.includes("买")
  ) {
    return "可以。为了给你更准确的建议，请告诉我：这件商品主要在什么场景使用、预算范围是多少、你更在意材质、版型、品牌还是价格。你也可以直接发一个商品名，我会围绕它继续分析。"
  }

  return "我已收到你的问题。当前处于演示模式；接入商品知识库后，我会结合真实商品信息继续回答。你也可以换个说法，或点击上方快捷问题开始。"
}

const requestAssistantReply = async (
  query: string,
  countryCode: string,
  history: Pick<ChatMessage, "role" | "content">[],
  product?: AiChatProduct
) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      countryCode,
      productHandle: product?.handle,
      selectedVariantId: product?.variantId,
      purchasedHandles: product?.purchasedHandles,
      history,
    }),
  })
  const data: { reply?: string; code?: string; partial?: boolean; products?: RecommendedProduct[] } = await response.json()
  if (response.ok && data.reply) return { reply: data.reply, live: !data.partial, products: data.products }
  if (data.code === "AI_NOT_CONFIGURED") {
    return { reply: `演示回复\n${getMockReply(query, product)}`, live: false }
  }
  throw new Error("Chat unavailable")
}

const AiChatConversation = ({
  pathname,
  hideLauncher,
}: {
  pathname: string
  hideLauncher: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLive, setIsLive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [openedProduct, setOpenedProduct] = useState<AiChatProduct>()
  const [isCatalogInquiry, setIsCatalogInquiry] = useState(false)
  const pageProduct = useSyncExternalStore(
    subscribeToAiChatPageProduct,
    getAiChatPageProduct,
    getServerAiChatPageProduct
  )
  const activeProduct = pageProduct?.pathname === pathname ? pageProduct.product : openedProduct
  const productContext = isCatalogInquiry ? undefined : activeProduct
  const quickPrompts = productContext
    ? [
        "介绍这款商品",
        ...(productContext.specs ?? [])
          .filter(([label]) => label !== "材质")
          .slice(0, 3)
          .map(([label]) => `了解${label}`),
      ]
    : QUICK_PROMPTS
  const nextMessageId = useRef(1)
  const requestQueue = useRef(Promise.resolve())
  const modelHistory = useRef<{ handle?: string | null; turns: Pick<ChatMessage, "role" | "content">[] }>({ turns: [] })
  const pendingRequests = useRef(0)
  const messageListRef = useRef<HTMLDivElement>(null)
  const isProductPage = pathname.includes("/products/")
  const { countryCode } = useParams<{ countryCode: string }>()

  const sendQuery = useCallback(
    (rawQuery: string, product?: AiChatProduct) => {
      const query = rawQuery.trim().slice(0, 1000)
      if (!query) return

      pendingRequests.current++
      setInput("")
      setIsLoading(true)

      requestQueue.current = requestQueue.current.then(async () => {
        const userMessage: ChatMessage = {
          id: nextMessageId.current++,
          role: "user",
          content: query,
        }
        setMessages((current) => [...current, userMessage])

        try {
          const history = modelHistory.current.handle === product?.handle ? modelHistory.current.turns : []
          const { reply, live, products } = await requestAssistantReply(query, countryCode, history, product)
          const assistantMessage: ChatMessage = {
            id: nextMessageId.current++,
            role: "assistant",
            content: reply,
            products,
          }
          setIsLive(live)
          if (live) {
            modelHistory.current = {
              handle: product?.handle,
              turns: [...history, userMessage, assistantMessage]
                .slice(-6)
                .map(({ role, content }) => ({ role, content: content.slice(0, 1000) })),
            }
          }
          setMessages((current) => [...current, assistantMessage])
        } catch {
          setIsLive(false)
          const message: ChatMessage = {
            id: nextMessageId.current++,
            role: "assistant",
            content: "暂时无法回复，请稍后再试。",
          }
          setMessages((current) => [...current, message])
        } finally {
          pendingRequests.current--
          if (!pendingRequests.current) setIsLoading(false)
        }
      })
    },
    [countryCode]
  )

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<AiChatOpenDetail>).detail || {}
      setIsOpen(true)

      if (detail.product) {
        setOpenedProduct(detail.product)
      }
      if (detail.scope === "catalog" || detail.product) {
        setIsCatalogInquiry(detail.scope === "catalog")
      }

      if (detail.query) {
        void sendQuery(detail.query, detail.scope === "catalog" ? undefined : detail.product ?? productContext)
      }
    }

    window.addEventListener(AI_CHAT_EVENT, handleOpen)
    return () => window.removeEventListener(AI_CHAT_EVENT, handleOpen)
  }, [productContext, sendQuery])

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, isLoading, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendQuery(input, productContext)
  }

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) {
      event.preventDefault()
      void sendQuery(input, productContext)
    }
  }

  return (
    <>
      {!hideLauncher && (
        <button
          type="button"
          aria-label="打开来财 AI 智能客服"
          onClick={() => setIsOpen(true)}
          className={clx(
            "chat-launcher fixed right-4 z-[70] flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-navy to-[#1E3A5F] text-white shadow-chat transition-transform motion-safe:hover:-translate-y-0.5 small:right-6 small:h-12 small:w-auto small:rounded-full small:px-5",
            isProductPage ? "bottom-28 small:bottom-6" : "bottom-5 small:bottom-6"
          )}
        >
          <span className="relative flex items-center justify-center">
            <ChatBubbleLeftRight className="h-6 w-6" />
            <span aria-hidden="true" className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-brand-orange">
              <span className="absolute inset-0 rounded-full bg-brand-orange/60 motion-safe:animate-ping" />
            </span>
          </span>
          <span className="hidden text-sm font-semibold small:inline">
            <span aria-hidden="true">✨ </span>来财 AI 客服
          </span>
        </button>
      )}

      {isOpen && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="ai-chat-title"
          className={clx(
            "fixed inset-x-3 top-24 z-[80] flex animate-slide-up flex-col overflow-hidden glass-card rounded-2xl border-brand-orange/20 bg-[#FAFAF8] shadow-chat small:inset-x-auto small:right-6 small:top-auto small:h-[min(680px,calc(100dvh-8rem))] small:w-[410px]",
            isProductPage
              ? "bottom-40 small:bottom-24"
              : "bottom-24 small:bottom-24"
          )}
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-[#0D1B2A] to-[#1E3A5F] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-brand-navy ring-4 ring-brand-orange/20">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h2 id="ai-chat-title" className="text-sm font-semibold">
                  来财 AI 智能客服
                </h2>
                <p className="mt-0.5 text-xs text-gray-300">
                  {productContext ? "当前商品问答" : "商品问答与搭配"}
                </p>
              </div>
            </div>
            {isLive && <span className="ml-auto mr-2 inline-flex items-center gap-1.5 text-xs text-white/80"><span className="h-2 w-2 rounded-full bg-[#2ECC71] motion-safe:animate-pulse" />在线</span>}
            <button
              type="button"
              aria-label="关闭 AI 智能客服"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <XMark className="h-5 w-5" />
            </button>
          </div>

          {productContext && (
            <div className="flex items-center gap-3 border-b border-gray-100 bg-[#FFF8EE] px-5 py-3">
              {productContext.thumbnail ? (
                <Image
                  src={productContext.thumbnail}
                  alt={productContext.name}
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-md border border-gray-200 object-cover"
                />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-navy text-brand-orange">
                  <Sparkles className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-500">
                  正在咨询
                </p>
                <p className="truncate text-sm font-semibold text-brand-ink">
                  {productContext.name}
                </p>
                {(productContext.size || productContext.price) && (
                  <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-gray-600">
                    {productContext.size && <span>尺码 {productContext.size}</span>}
                    {productContext.price && <span>{productContext.price}</span>}
                  </p>
                )}
              </div>
            </div>
          )}

          <div
            ref={messageListRef}
            className="min-h-0 flex-1 overflow-y-auto bg-[#FAF8F3] bg-[radial-gradient(#dfd8cc_0.8px,transparent_0.8px)] bg-[size:12px_12px] px-4 py-5"
            aria-live="polite"
          >
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={clx(
                    "max-w-[86%] whitespace-pre-line break-words rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                    message.role === "assistant"
                      ? "self-start rounded-tl-sm border border-gray-100 bg-white text-brand-ink"
                      : "self-end rounded-tr-sm bg-gradient-to-br from-brand-navy to-[#1E3A5F] text-white"
                  )}
                >
                  {message.content}
                  {message.products?.map(({ href, title, price }) => (
                    <Link
                      key={href}
                      href={href}
                      className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold hover:border-brand-orange/60 hover:bg-[#FFFBF5]"
                    >
                      <span>{title}</span>
                      <span className="shrink-0">{price ?? "查看商品"}</span>
                    </Link>
                  ))}
                </div>
              ))}

              {isLoading && (
                <div className="flex max-w-[86%] items-center gap-1.5 self-start rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-2 w-2 animate-pulse rounded-full bg-gray-400"
                      style={{ animationDelay: `${dot * 120}ms` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {messages.length === 1 && (
            <div className="flex shrink-0 flex-wrap gap-2 border-t border-gray-100 bg-white px-4 py-3">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendQuery(prompt, productContext)}
                  className="max-w-full break-words rounded-full border border-brand-orange/30 bg-[#FFFBF5] px-3.5 py-2 text-xs font-medium text-brand-ink hover:border-brand-orange hover:bg-brand-orange/10"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-200 bg-white p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-brand-orange/40 bg-white p-2 transition-shadow focus-within:border-brand-amber focus-within:ring-2 focus-within:ring-brand-orange/50">
              <label htmlFor="ai-chat-input" className="sr-only">
                输入咨询内容
              </label>
              <textarea
                id="ai-chat-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                rows={1}
                maxLength={500}
                placeholder="输入你的问题，Enter 发送"
                className="max-h-28 min-h-9 min-w-0 flex-1 resize-none rounded-md border-0 px-2 py-1.5 text-sm leading-6 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <button
                type="submit"
                aria-label="发送消息"
                disabled={!input.trim() || isLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-brand-action text-brand-navy shadow-[0_2px_8px_rgba(254,189,105,0.5)] hover:to-brand-action-hover disabled:cursor-not-allowed disabled:bg-gray-200 disabled:bg-none disabled:shadow-none disabled:text-gray-400"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 px-1 text-[10px] leading-4 text-gray-500">
              AI 可以帮你挑选商品。下单前，请以商城页面的价格、库存、配送和退换政策为准。
            </p>
          </form>
        </section>
      )}
    </>
  )
}

export default function AiChatWidget({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname()
  const conversationKey = /\/(?:products|order)\//.test(pathname) ? pathname : "storefront"
  const isLoginPage = /\/account\/?$/.test(pathname)
  return (
    <AiChatConversation
      key={conversationKey}
      pathname={pathname}
      hideLauncher={isLoginPage && !isLoggedIn}
    />
  )
}
