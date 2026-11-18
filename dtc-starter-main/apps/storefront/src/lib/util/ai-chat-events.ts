export const AI_CHAT_EVENT = "open-ai-chat"

export type AiChatProduct = {
  name: string
  handle?: string | null
  thumbnail?: string | null
}

export type AiChatOpenDetail = {
  query?: string
  product?: AiChatProduct
}

export const openAiChat = (detail: AiChatOpenDetail = {}) => {
  window.dispatchEvent(
    new CustomEvent<AiChatOpenDetail>(AI_CHAT_EVENT, { detail })
  )
}
