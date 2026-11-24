import type {
  AiMessage,
  AiProductLink,
  AiProductRecommendation,
  AiSource,
} from "./types"

type Reply = Omit<AiMessage, "id" | "role">

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const string = (value: unknown) =>
  typeof value === "string" ? value : undefined

function productLink(value: unknown): AiProductLink | undefined {
  if (
    !record(value) ||
    typeof value.title !== "string" ||
    !value.title.trim() ||
    typeof value.href !== "string" ||
    !/^\/[a-z]{2}\/products\/[^/?#\\\s]+$/i.test(value.href)
  )
    return
  try {
    const handle = decodeURIComponent(value.href.split("/")[3])
    if (handle === "." || handle === ".." || /[/\\]/.test(handle)) return
  } catch {
    return
  }
  return { title: value.title, href: value.href }
}

function recommendation(value: unknown): AiProductRecommendation | undefined {
  const link = productLink(value)
  if (!link || !record(value)) return
  // Older replies identify a card by its localized product path.
  return {
    ...link,
    id: string(value.id) ?? link.href,
    handle: string(value.handle) ?? decodeURIComponent(link.href.split("/")[3]),
    price: string(value.price) ?? null,
    reason: string(value.reason) ?? null,
    thumbnail: string(value.thumbnail) ?? null,
    stockStatus: string(value.stockStatus),
    variantId: string(value.variantId),
  }
}

function source(value: unknown): AiSource | undefined {
  if (
    !record(value) ||
    typeof value.title !== "string" ||
    typeof value.type !== "string"
  )
    return
  return {
    title: value.title,
    type: value.type,
    url: string(value.url),
    snippet: string(value.snippet),
  }
}

function list<T>(value: unknown, parse: (item: unknown) => T | undefined) {
  if (!Array.isArray(value)) return undefined
  return value.flatMap((item: unknown) => parse(item) ?? [])
}

export function adaptChatResponse(
  data: unknown,
  ok: boolean,
  demoReply: () => string
): Reply {
  if (record(data)) {
    if (ok && typeof data.reply === "string" && data.reply) {
      return {
        content: data.reply,
        status: data.partial === true ? "partial" : "live",
        products: list(data.products, recommendation),
        productLinks: list(data.productLinks, productLink),
        suggestions: list(data.suggestions, string),
        sources: list(data.sources, source),
      }
    }
    if (data.code === "AI_NOT_CONFIGURED") {
      return { content: `演示回复\n${demoReply()}`, status: "demo" }
    }
  }
  throw new Error("Chat unavailable")
}
