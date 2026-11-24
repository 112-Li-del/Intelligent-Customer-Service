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
  const path = url.pathname.replace(/\/+$/, "")
  url.pathname = path.endsWith("/embeddings") ? path : `${path}/embeddings`
  return { url, model, key }
}

export async function requestEmbeddings({ url, key, model }, input, signal) {
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, input, encoding_format: "float" }),
    redirect: "error",
    cache: "no-store",
    signal,
  })
  if (!response.ok) throw new Error(`Embedding provider returned HTTP ${response.status}`)
  const { data } = await response.json()
  const count = typeof input === "string" ? 1 : input.length
  if (!Array.isArray(data) || data.length !== count) throw new Error("Embedding response count mismatch")
  const byIndex = new Map(data.map(({ index, embedding }) => [index, embedding]))
  return Array.from({ length: count }, (_, index) => {
    const vector = byIndex.get(index)
    if (!Array.isArray(vector) || !vector.length || vector.length > 8192 ||
        vector.some((value) => typeof value !== "number" || !Number.isFinite(Math.fround(value))) ||
        !vector.some((value) => Math.fround(value) !== 0)) {
      throw new Error("Invalid embedding vector")
    }
    return vector
  })
}
