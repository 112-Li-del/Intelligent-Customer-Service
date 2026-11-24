import dynamic from "next/dynamic"
import { memo } from "react"
import ProductCarousel from "./product-carousel"
import { SourcesPanel, MessageActions } from "./message-details"
import type { AiMessage } from "../../types"

const AssistantReply = dynamic(() => import("./assistant-reply"))

function AssistantMessage({
  message,
  storageKey,
}: {
  message: AiMessage
  storageKey: string
}) {
  return (
    <>
      <AssistantReply
        content={message.content}
        products={message.productLinks ?? message.products}
      />
      <ProductCarousel products={message.products} />
      <SourcesPanel sources={message.sources} />
      <MessageActions storageKey={storageKey} message={message} />
    </>
  )
}

export default memo(AssistantMessage)
