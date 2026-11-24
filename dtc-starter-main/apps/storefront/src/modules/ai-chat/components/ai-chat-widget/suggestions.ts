import type { AiChatProduct } from "@lib/util/ai-chat-events"
import type { AiMessage } from "../../types"
import { copy } from "./chat-copy"

export function suggestionsFor(
  message: AiMessage,
  product?: AiChatProduct,
  lastQuery?: string
) {
  const policy =
    message.sources?.some((source) => source.type === "policy") ||
    /退换|退货|配送|shipping|returns/i.test(message.content)
  const options = message.products?.length
    ? [copy.compare, copy.sizing, copy.shipping]
    : policy && message.id !== 0
    ? copy.policy
    : product
    ? [
        copy.intro,
        ...(product.specs ?? []).slice(0, 2).map(([label]) => copy.spec(label)),
        copy.sizing,
        copy.shipping,
      ]
    : message.id === 0
    ? copy.initial
    : copy.general
  const candidates = [
    ...(message.suggestions ?? []),
    ...(message.status === "error" && lastQuery ? [lastQuery] : []),
    ...options,
    ...copy.general,
  ]
  return Array.from(
    new Set(
      candidates
        .map((s) => s.trim())
        .filter(
          (s) =>
            s &&
            s.length <= 500 &&
            (message.status === "error" || s !== lastQuery)
        )
    )
  ).slice(0, 3)
}
