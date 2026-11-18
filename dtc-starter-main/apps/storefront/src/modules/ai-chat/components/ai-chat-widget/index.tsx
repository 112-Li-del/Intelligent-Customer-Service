"use client"

import {
  AI_CHAT_EVENT,
  AiChatOpenDetail,
  AiChatProduct,
} from "@lib/util/ai-chat-events"
import {
  ArrowRight,
  ChatBubbleLeftRight,
  Sparkles,
  XMark,
} from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

type ChatMessage = {
  id: number
  role: "assistant" | "user"
  content: string
}

const WELCOME_MESSAGE =
  "你好，我是知选 AI 导购。你可以告诉我使用场景、预算、尺码或风格偏好，我会帮你理清选购思路。"

const QUICK_PROMPTS = [
  "推荐一款日常百搭的卫衣",
  "退换货政策是怎样的？",
  "帮我分析该怎么选尺码",
]

const initialMessages: ChatMessage[] = [
  { id: 0, role: "assistant", content: WELCOME_MESSAGE },
]

const AI_CHAT_ENDPOINT = process.env.NEXT_PUBLIC_AI_CHAT_API_URL

const getMockReply = (query: string, product?: AiChatProduct) => {
  if (query.includes("退") || query.includes("换")) {
    return "退换货条件会受到商品类型、订单状态和地区政策影响。你可以先查看商品详情页的配送与退货说明，最终以下单时的政策为准；如果告诉我具体商品，我也可以帮你整理需要确认的要点。"
  }

  if (query.includes("尺码") || query.includes("尺寸")) {
    return product
      ? `你正在查看「${product.name}」${product.size ? `，已选 ${product.size} 码` : ""}。告诉我你的身高、体重和偏好的宽松程度，我可以根据商品规格帮你判断怎么选。`
      : "选尺码时建议结合身高、体重、平时常穿尺码和偏好的宽松程度判断。把这些信息告诉我，我可以帮你缩小选择范围。"
  }

  if (
    query.includes("推荐") ||
    query.includes("挑选") ||
    query.includes("买")
  ) {
    return "可以。为了给你更准确的建议，请告诉我：这件商品主要在什么场景使用、预算范围是多少、你更在意材质、版型、品牌还是价格。你也可以直接发一个商品名，我会围绕它继续分析。"
  }

  if (product) {
    return `我会围绕「${product.name}」来回答。当前是前端演示回复；接入 RAG 后，我会结合商品资料、库存、规格和售后政策给出更准确的建议。`
  }

  return "我已收到你的问题。当前处于演示模式；接入商品知识库后，我会结合真实商品信息继续回答。你也可以换个说法，或点击上方快捷问题开始。"
}

const requestAssistantReply = async (
  query: string,
  product?: AiChatProduct
) => {
  // RAG 接口预留：将 NEXT_PUBLIC_AI_CHAT_API_URL 设置为 /api/chat 后，这里会以
  // POST JSON 的方式请求后端，例如 { query, product }。
  if (AI_CHAT_ENDPOINT) {
    try {
      const response = await fetch(AI_CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, product }),
      })

      if (response.ok) {
        const data = (await response.json()) as {
          reply?: string
          message?: string
          answer?: string
        }

        if (data.reply || data.message || data.answer) {
          return data.reply || data.message || data.answer || ""
        }
      }
    } catch {
      // 后端暂未可用时继续返回演示回复，避免影响前端购物体验。
    }
  }

  await new Promise((resolve) => window.setTimeout(resolve, 500))
  return getMockReply(query, product)
}

const AiChatWidget = () => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [productContext, setProductContext] = useState<
    AiChatProduct | undefined
  >()
  const nextMessageId = useRef(1)
  const requestQueue = useRef(Promise.resolve())
  const pendingRequests = useRef(0)
  const messageListRef = useRef<HTMLDivElement>(null)
  const isProductPage = pathname.includes("/products/")

  const sendQuery = useCallback(
    (rawQuery: string, product?: AiChatProduct) => {
      const query = rawQuery.trim()
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
          const reply = await requestAssistantReply(query, product)
          const assistantMessage: ChatMessage = {
            id: nextMessageId.current++,
            role: "assistant",
            content: reply,
          }
          setMessages((current) => [...current, assistantMessage])
        } catch {
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
    []
  )

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<AiChatOpenDetail>).detail || {}
      setIsOpen(true)

      if (detail.product) {
        setProductContext(detail.product)
      }

      if (detail.query) {
        void sendQuery(detail.query, detail.product ?? productContext)
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
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void sendQuery(input, productContext)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="打开知选 AI 智能客服"
        onClick={() => setIsOpen(true)}
        className={clx(
          "fixed right-4 z-[70] flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-brand-navy text-white shadow-chat transition-all hover:-translate-y-0.5 hover:bg-brand-navy-light small:right-6 small:h-12 small:w-auto small:rounded-full small:px-5",
          isProductPage ? "bottom-28 small:bottom-6" : "bottom-5 small:bottom-6"
        )}
      >
        <span className="relative flex items-center justify-center">
          <ChatBubbleLeftRight className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-soft-pulse rounded-full bg-brand-orange" />
        </span>
        <span className="hidden text-sm font-semibold small:inline">
          知选 AI 客服
        </span>
      </button>

      {isOpen && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="ai-chat-title"
          className={clx(
            "fixed inset-x-3 top-24 z-[80] flex animate-slide-up flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-chat small:inset-x-auto small:right-6 small:top-auto small:h-[min(680px,calc(100dvh-8rem))] small:w-[410px]",
            isProductPage
              ? "bottom-40 small:bottom-24"
              : "bottom-24 small:bottom-24"
          )}
        >
          <div className="flex items-center justify-between bg-brand-navy px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-brand-navy">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h2 id="ai-chat-title" className="text-sm font-semibold">
                  知选 AI 智能客服
                </h2>
                <p className="mt-0.5 text-xs text-gray-300">
                  演示模式 · 已预留 RAG 接口
                </p>
              </div>
            </div>
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
            className="min-h-0 flex-1 overflow-y-auto bg-[#F7F7F7] px-4 py-5"
            aria-live="polite"
          >
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={clx(
                    "max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                    message.role === "assistant"
                      ? "self-start rounded-tl-sm border border-gray-100 bg-white text-brand-ink"
                      : "self-end rounded-tr-sm bg-brand-navy text-white"
                  )}
                >
                  {message.content}
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
            <div className="flex gap-2 overflow-x-auto border-t border-gray-100 bg-white px-4 py-3 no-scrollbar">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendQuery(prompt, productContext)}
                  className="shrink-0 rounded-full border border-gray-300 px-3.5 py-2 text-xs font-medium text-brand-ink hover:border-brand-orange hover:bg-[#FFF8EE]"
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
            <div className="flex items-end gap-2 rounded-xl border border-gray-300 bg-white p-2 focus-within:border-brand-orange focus-within:ring-1 focus-within:ring-brand-orange">
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
                className="max-h-28 min-h-9 flex-1 resize-none border-0 px-2 py-1.5 text-sm leading-6 outline-none placeholder:text-gray-400 focus-visible:ring-0"
              />
              <button
                type="submit"
                aria-label="发送消息"
                disabled={!input.trim() || isLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange text-brand-navy transition-colors hover:bg-brand-orange-hover disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 px-1 text-[10px] leading-4 text-gray-400">
              AI 建议仅供参考；价格、库存、配送和退换政策请以商城页面为准。
            </p>
          </form>
        </section>
      )}
    </>
  )
}

export default AiChatWidget
