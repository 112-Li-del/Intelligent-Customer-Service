export const AI_CHAT_EVENT = "open-ai-chat"

export type AiChatProduct = {
  name: string
  handle?: string | null
  thumbnail?: string | null
  size?: string
  price?: string
  description?: string | null
  specs?: [string, string][]
  purchasedHandles?: string[]
}

export type AiChatOpenDetail = {
  query?: string
  product?: AiChatProduct
  scope?: "catalog"
}

export const openAiChat = (detail: AiChatOpenDetail = {}) => {
  window.dispatchEvent(
    new CustomEvent<AiChatOpenDetail>(AI_CHAT_EVENT, { detail })
  )
}

let currentPageProduct: { pathname: string; product: AiChatProduct } | null = null
const listeners = new Set<() => void>()

export const registerAiChatProduct = (pathname: string, product: AiChatProduct) => {
  const entry = { pathname, product }
  currentPageProduct = entry
  listeners.forEach((notify) => notify())
  return () => {
    if (currentPageProduct === entry) {
      currentPageProduct = null
      listeners.forEach((notify) => notify())
    }
  }
}

export const getAiChatPageProduct = () => currentPageProduct
export const getServerAiChatPageProduct = () => null

export const subscribeToAiChatPageProduct = (notify: () => void) => {
  listeners.add(notify)
  return () => { listeners.delete(notify) }
}
