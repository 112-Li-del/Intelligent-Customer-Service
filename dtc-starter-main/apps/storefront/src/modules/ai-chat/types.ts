export type AiProductLink = { title: string; href: string }

export type AiProductRecommendation = AiProductLink & {
  id: string
  price: string | null
  reason: string | null
  thumbnail: string | null
  stockStatus?: string
  variantId?: string
  handle?: string
}

export type AiSource = {
  title: string
  url?: string
  snippet?: string
  type: string
}

export type AiMessage = {
  id: number
  role: "assistant" | "user"
  content: string
  products?: AiProductRecommendation[]
  productLinks?: AiProductLink[]
  suggestions?: string[]
  sources?: AiSource[]
  status?: "live" | "partial" | "demo" | "error"
}
