"use client"

import { openAiChat } from "@lib/util/ai-chat-events"
import { Sparkles } from "@medusajs/icons"

export default function AskSearchAi({ query }: { query: string }) {
  return (
    <button
      type="button"
      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-[#8A4B08] hover:bg-amber-100"
      onClick={() => openAiChat({
        scope: "catalog",
        query: `我在商城搜索「${query}」时没有找到商品。能帮我推荐合适的商品吗？`,
      })}
    >
      <Sparkles aria-hidden="true" className="h-4 w-4" />
      问问来财 AI 导购 <span aria-hidden="true">→</span>
    </button>
  )
}
