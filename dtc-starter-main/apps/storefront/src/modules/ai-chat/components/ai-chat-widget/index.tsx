"use client"

import {
  AI_CHAT_EVENT,
  AiChatOpenDetail,
  AiChatProduct,
  getAiChatPageProduct,
  getServerAiChatPageProduct,
  subscribeToAiChatPageProduct,
} from "@lib/util/ai-chat-events"
import { useParams, usePathname } from "next/navigation"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import type { AiMessage } from "../../types"
import { requestAssistantReply } from "./request-assistant-reply"
import LauncherButton from "./launcher-button"
import ChatShell from "./chat-shell"
import ChatInput from "./chat-input"
import MessageList from "./message-list"
import { copy } from "./chat-copy"
import { feedbackStore } from "./feedback"
import { suggestionsFor } from "./suggestions"

const initialMessages: AiMessage[] = [
  { id: 0, role: "assistant", content: copy.welcome },
]

const AiChatConversation = ({
  pathname,
  hideLauncher,
}: {
  pathname: string
  hideLauncher: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<AiMessage[]>(initialMessages)
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
  const activeProduct =
    pageProduct?.pathname === pathname ? pageProduct.product : openedProduct
  const productContext = isCatalogInquiry ? undefined : activeProduct
  const [attached, setAttached] = useState<AiChatProduct>()
  const [hasOpened, setHasOpened] = useState(false)
  const [unread, setUnread] = useState(false)
  const [resetVersion, setResetVersion] = useState(0)
  const open = useRef(false)
  const opener = useRef<HTMLElement | null>(null)
  const session = useRef<AbortController | null>(null)
  const storageKey =
    "laicai.chat.feedback." +
    (/\/(?:products|order)\//.test(pathname) ? pathname : "storefront")
  const nextMessageId = useRef(0)
  const lastEntry = useRef<{ key: string; isOpen: boolean } | null>(null)
  const requestQueue = useRef(Promise.resolve())
  const modelHistory = useRef<{
    handle?: string | null
    turns: Pick<AiMessage, "role" | "content">[]
  }>({ turns: [] })
  const pendingRequests = useRef(0)
  const messageListRef = useRef<HTMLDivElement>(null)
  const isProductPage = pathname.includes("/products/")
  const { countryCode } = useParams<{ countryCode: string }>()

  const sendQuery = useCallback(
    (rawQuery: string, product?: AiChatProduct) => {
      const query = rawQuery.trim().slice(0, 1000)
      if (!query) return

      const controller =
        session.current ?? (session.current = new AbortController())
      nextMessageId.current = Math.max(nextMessageId.current, Date.now())
      pendingRequests.current++
      setInput("")
      setIsLoading(true)

      requestQueue.current = requestQueue.current.then(async () => {
        if (controller.signal.aborted) return
        const userMessage: AiMessage = {
          id: nextMessageId.current++,
          role: "user",
          content: query,
        }
        setMessages((current) => [...current, userMessage])

        try {
          const history =
            modelHistory.current.handle === product?.handle
              ? modelHistory.current.turns
              : []
          const reply = await requestAssistantReply(
            query,
            countryCode,
            history,
            product,
            controller.signal
          )
          if (controller.signal.aborted) return
          if (!open.current) setUnread(true)
          const assistantMessage: AiMessage = {
            ...reply,
            id: nextMessageId.current++,
            role: "assistant",
          }
          setIsLive(reply.status === "live")
          if (reply.status === "live") {
            modelHistory.current = {
              handle: product?.handle,
              turns: [...history, userMessage, assistantMessage]
                .slice(-6)
                .map(({ role, content }) => ({
                  role,
                  content: content.slice(0, 1000),
                })),
            }
          }
          setMessages((current) => [...current, assistantMessage])
        } catch {
          if (controller.signal.aborted) return
          if (!open.current) setUnread(true)
          setIsLive(false)
          const message: AiMessage = {
            id: nextMessageId.current++,
            role: "assistant",
            status: "error",
            content: copy.error,
          }
          setMessages((current) => [...current, message])
        } finally {
          if (!controller.signal.aborted && --pendingRequests.current === 0)
            setIsLoading(false)
        }
      })
    },
    [countryCode]
  )

  const closeChat = useCallback(() => {
    if (lastEntry.current) lastEntry.current.isOpen = false
    open.current = false
    setIsOpen(false)
    ;(document.getElementById("ai-chat-launcher") ?? opener.current)?.focus({
      preventScroll: true,
    })
  }, [])

  useEffect(() => {
    const handleChatTrigger = (event: Event) => {
      const detail = (event as CustomEvent<AiChatOpenDetail>).detail || {}
      const query = detail.query?.trim()
      const inquiryProduct =
        detail.scope === "catalog"
          ? undefined
          : detail.product ?? productContext
      const key = JSON.stringify([
        query,
        detail.scope,
        inquiryProduct?.handle ?? inquiryProduct?.name,
        inquiryProduct?.variantId,
      ])
      const previous = lastEntry.current
      const isGeneralEntry = !query && !detail.product && !detail.scope
      if (previous?.isOpen && (isGeneralEntry || previous.key === key)) {
        closeChat()
        return
      }

      lastEntry.current = { key, isOpen: true }
      if (!open.current && document.activeElement instanceof HTMLElement)
        opener.current = document.activeElement
      open.current = true
      setUnread(false)
      setHasOpened(true)
      setIsOpen(true)

      if (detail.product) {
        setOpenedProduct(detail.product)
      }
      if (detail.scope === "catalog" || detail.product) {
        setIsCatalogInquiry(detail.scope === "catalog")
      }

      if (query && previous?.key !== key) {
        sendQuery(query, inquiryProduct)
      }
    }

    window.addEventListener(AI_CHAT_EVENT, handleChatTrigger)
    return () => window.removeEventListener(AI_CHAT_EVENT, handleChatTrigger)
  }, [closeChat, productContext, sendQuery])

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    })
  }, [messages, isLoading, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    document.getElementById("ai-chat-input")?.focus({ preventScroll: true })
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        closeChat()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [closeChat, isOpen])

  useEffect(() => () => session.current?.abort(), [])

  function clearConversation() {
    session.current?.abort()
    session.current = null
    requestQueue.current = Promise.resolve()
    pendingRequests.current = 0
    modelHistory.current = { turns: [] }
    lastEntry.current = { key: "", isOpen: true }
    feedbackStore.clear(storageKey)
    setResetVersion((version) => version + 1)
    setMessages(initialMessages)
    setInput("")
    setAttached(undefined)
    setOpenedProduct(undefined)
    setIsCatalogInquiry(false)
    setIsLive(false)
    setIsLoading(false)
    setUnread(false)
  }

  const currentPdp =
    isProductPage && pageProduct?.pathname === pathname
      ? pageProduct.product
      : undefined
  const context = attached ?? productContext
  const latest = messages[messages.length - 1]
  const prompts =
    !isLoading && latest.role === "assistant"
      ? suggestionsFor(latest, context, messages[messages.length - 2]?.content)
      : []
  function submit(text: string) {
    sendQuery(text, context)
    if (attached) {
      setIsCatalogInquiry(false)
      setOpenedProduct(attached)
      setAttached(undefined)
    }
  }

  return (
    <>
      {!hideLauncher && (
        <LauncherButton
          unread={unread}
          isOpen={isOpen}
          isProductPage={isProductPage}
        />
      )}
      {hasOpened && (
        <ChatShell
          open={isOpen}
          productContext={productContext}
          isLive={isLive}
          closeChat={closeChat}
        >
          <MessageList
            key={resetVersion}
            storageKey={storageKey}
            prompts={prompts}
            onSelect={submit}
            messages={messages}
            isLoading={isLoading}
            messageListRef={messageListRef}
          />
          <ChatInput
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            onSend={() => submit(input)}
            onClear={clearConversation}
            pageProduct={currentPdp}
            attached={attached}
            onAttach={(product) => {
              setAttached(product)
              setIsCatalogInquiry(!product)
            }}
          />
        </ChatShell>
      )}
    </>
  )
}

export default function AiChatWidget({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname()
  const conversationKey = /\/(?:products|order)\//.test(pathname)
    ? pathname
    : "storefront"
  const isLoginPage = /\/account\/?$/.test(pathname)
  return (
    <AiChatConversation
      key={conversationKey}
      pathname={pathname}
      hideLauncher={isLoginPage && !isLoggedIn}
    />
  )
}
