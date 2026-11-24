import type { AiChatProduct } from "@lib/util/ai-chat-events"
import type { AiMessage } from "../../types"
import { adaptChatResponse } from "../../response-adapter"
import { getProductReply } from "./product-reply"

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

export const requestAssistantReply = async (
  query: string,
  countryCode: string,
  history: Pick<AiMessage, "role" | "content">[],
  product?: AiChatProduct,
  signal?: AbortSignal
) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    signal,
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
  const data: unknown = await response.json()
  return adaptChatResponse(data, response.ok, () =>
    getMockReply(query, product)
  )
}
