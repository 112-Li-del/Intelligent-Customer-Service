"use client"

import { AiChatProduct, openAiChat } from "@lib/util/ai-chat-events"
import { clx } from "@modules/common/components/ui"
import type { ButtonHTMLAttributes, ReactNode } from "react"

type AiChatTriggerProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
> & {
  children: ReactNode
  query?: string
  product?: AiChatProduct
}

const AiChatTrigger = ({
  children,
  className,
  query,
  product,
  type = "button",
  ...props
}: AiChatTriggerProps) => {
  return (
    <button
      type={type}
      className={clx("transition-colors", className)}
      onClick={() => openAiChat({ query, product })}
      {...props}
    >
      {children}
    </button>
  )
}

export default AiChatTrigger
