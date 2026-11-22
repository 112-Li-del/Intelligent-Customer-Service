import "server-only"

import { Pool } from "pg"
import { getEmbeddingProvider, keywordTokens, providerUrl } from "./knowledge-input.mjs"

export type KnowledgeChunk = {
  id: string
  product_id: string | null
  product_handle: string | null
  document_path: string
  section: string
  content: string
}

export type ProductRelation = { target_handle: string; reason: string }

let pool: Pool | undefined

function getPool() {
  const connectionString = process.env.AI_KNOWLEDGE_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim()
  if (!connectionString) return null
  return pool ??= new Pool({
    connectionString,
    max: 4,
    connectionTimeoutMillis: 1500,
    statement_timeout: 1500,
  }).on("error", () => console.warn("Chat knowledge database connection lost"))
}

async function postModel(url: URL, key: string, body: object, signal: AbortSignal) {
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.any([signal, AbortSignal.timeout(2500)]),
  })
  if (!response.ok) throw new Error(`Retrieval provider returned HTTP ${response.status}`)
  return response.json()
}

async function embed(query: string, signal: AbortSignal) {
  const provider = getEmbeddingProvider()
  if (!provider) return null
  const data = await postModel(provider.url, provider.key, {
    model: provider.model, input: query, encoding_format: "float",
  }, signal)
  const vector: unknown = data?.data?.[0]?.embedding
  if (!Array.isArray(vector) || !vector.length || vector.length > 8192 ||
      vector.some((value) => typeof value !== "number" || !Number.isFinite(Math.fround(value))) ||
      !vector.some((value) => Math.fround(value) !== 0)) {
    throw new Error("Invalid query embedding")
  }
  return { vector, provider: provider.url.href, model: provider.model }
}

async function rerank(query: string, chunks: KnowledgeChunk[], limit: number, signal: AbortSignal) {
  const endpoint = process.env.AI_RERANK_URL?.trim()
  const key = process.env.AI_RERANK_API_KEY?.trim()
  const model = process.env.AI_RERANK_MODEL?.trim()
  if (!endpoint || !key || !model || chunks.length < 2) return chunks.slice(0, limit)

  const url = providerUrl(endpoint)
  const nativeDashScope = url.pathname.replace(/\/$/, "").endsWith("/services/rerank/text-rerank/text-rerank")
  const documents = chunks.map(({ content }) => content)
  const top_n = Math.min(limit, chunks.length)
  const data = await postModel(url, key, nativeDashScope
    ? { model, input: { query, documents }, parameters: { top_n, return_documents: false } }
    : { model, query, documents, top_n, return_documents: false }, signal)
  const results = nativeDashScope ? data?.output?.results : data?.results
  if (!Array.isArray(results) || !results.length) throw new Error("Missing rerank results")
  const indices = new Set<number>()
  for (const result of results) {
    const index = result?.index
    if (!Number.isInteger(index) || index < 0 || index >= chunks.length || indices.has(index)) {
      throw new Error("Invalid rerank result")
    }
    indices.add(index)
  }
  return Array.from(indices, (index) => chunks[index]).slice(0, limit)
}

export async function searchKnowledge({
  query, region, productId, title, policy = false, signal,
}: {
  query: string
  region: string
  productId?: string
  title?: string
  policy?: boolean
  signal: AbortSignal
}): Promise<KnowledgeChunk[]> {
  const db = getPool()
  if (!db || signal.aborted) return []
  const tokens = keywordTokens(query).filter((token) =>
    !/^(?:的|了|吗|么|呢|这|它|可以|能否|什么|多少|请问|一下|怎么|如何|是否|这个|这款)$/.test(token)
  ).slice(0, 60)
  const semanticQuery = title ? `${title}\n${query}` : query
  const embedding = await embed(semanticQuery, signal).catch(() => null)
  if (signal.aborted) return []

  const { rows } = await db.query<KnowledgeChunk>(`
    with eligible as not materialized (
      select * from laicai_knowledge.chunks
      where region_code = $1 and locale = 'zh-CN'
        and (case when $2::boolean then product_id is null
                  when $3::text is not null then product_id = $3
                  else product_id is not null end)
        and (size is null or size = any($8::text[]))
    ), terms as (
      select to_tsquery('simple', $4) as query
    ), lexical as (
      select id, row_number() over (order by ts_rank_cd(search_terms, terms.query) desc, id) as rank
      from eligible cross join terms
      where terms.query is not null and search_terms @@ terms.query
      order by rank limit 10
    ), distances as (
      select id, similarity from eligible
      cross join lateral (
        select sum(a.value::double precision * b.value::double precision) /
          nullif(sqrt(sum(a.value::double precision ^ 2) * sum(b.value::double precision ^ 2)), 0) as similarity
        from unnest(embedding) with ordinality a(value, pos)
        join unnest($5::real[]) with ordinality b(value, pos) using (pos)
      ) vectors
      where embedding_provider = $6 and embedding_model = $7
        and embedding_dimensions = cardinality($5::real[])
    ), semantic as (
      select id, row_number() over (order by similarity desc, id) as rank
      from distances where similarity > 0
      order by rank limit 10
    ), fused as (
      select id, sum(1.0 / (60 + rank)) as score from (
        select * from lexical union all select * from semantic
      ) candidates group by id
    )
    select eligible.id, product_id, product_handle, document_path, section, content
    from fused join eligible using (id) order by score desc, id limit 10
  `, [
    region, policy, productId ?? null,
    tokens.length ? tokens.join(" | ") : null,
    embedding?.vector ?? null, embedding?.provider ?? null, embedding?.model ?? null,
    Array.from(query.normalize("NFKC").matchAll(/\b(XXXL|XXL|XL|XS|S|M|L)\b/gi), ([, size]) => size.toUpperCase()),
  ])
  const limit = productId || policy ? 3 : 6
  return rerank(semanticQuery, rows, limit, signal).catch(() => rows.slice(0, limit))
}

export async function findRelations(node: string): Promise<ProductRelation[]> {
  const db = getPool()
  if (!db) return []
  const { rows } = await db.query<ProductRelation>(`
    select target_handle, reason from laicai_knowledge.product_relations
    where source_node = $1
    order by target_handle
    limit 4
  `, [node])
  return rows
}
