const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" })

export function keywordTokens(content) {
  const normalized = content.normalize("NFKC").toLowerCase()
  const tokens = new Set()
  for (const { segment, isWordLike } of segmenter.segment(normalized)) {
    if (isWordLike) {
      for (const [word] of segment.matchAll(/[\p{L}\p{N}]+/gu)) tokens.add(word)
    }
  }
  for (const [phrase] of normalized.matchAll(/\p{Script=Han}+/gu)) {
    const chars = Array.from(phrase)
    for (let index = 0; index + 1 < chars.length; index++) {
      tokens.add(chars[index] + chars[index + 1])
    }
  }
  return [...tokens]
}

export function providerUrl(value) {
  const url = new URL(value)
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
      url.username || url.password || url.search || url.hash) {
    throw new Error("Invalid AI provider URL")
  }
  return url
}

export function getEmbeddingProvider() {
  const base = process.env.AI_EMBEDDING_BASE_URL?.trim()
  const model = process.env.AI_EMBEDDING_MODEL?.trim()
  const key = process.env.AI_EMBEDDING_API_KEY?.trim()
  if (!base || !model || !key) return null
  const url = providerUrl(base)
  url.pathname = url.pathname.replace(/\/+$/, "")
  if (!url.pathname.endsWith("/embeddings")) url.pathname += "/embeddings"
  return { url, model, key }
}
