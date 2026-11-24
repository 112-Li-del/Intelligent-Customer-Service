import "server-only"

import { listProducts } from "@lib/data/products"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import * as nodeUtil from "node:util"
import { Pool } from "pg"
import { getEmbeddingProvider, keywordTokens, providerUrl, requestEmbeddings } from "./knowledge-input.mjs"

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
const observedDimensions = new Map<string, number>()

function getPool() {
  if (pool) return pool
  let connectionString = process.env.AI_KNOWLEDGE_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim()
  if (!connectionString && process.env.NODE_ENV === "development" && process.env.AI_KNOWLEDGE_USE_LOCAL_MEDUSA === "true") {
    const filename = resolve(process.cwd(), "../backend/.env")
    if (existsSync(filename)) {
      // The storefront runs on Node 22. Its installed Node typings predate util.parseEnv.
      const { parseEnv } = nodeUtil as typeof nodeUtil & { parseEnv(text: string): Record<string, string> }
      const local = parseEnv(readFileSync(filename, "utf8")).DATABASE_URL
      if (local && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(local).hostname)) connectionString = local
    }
  }
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
  const [vector] = await requestEmbeddings(provider, query, AbortSignal.any([signal, AbortSignal.timeout(2500)]))
  observedDimensions.set(JSON.stringify([provider.url.href, provider.model]), vector.length)
  return { vector, provider: provider.url.href, model: provider.model }
}

export async function rerankKnowledge(query: string, chunks: KnowledgeChunk[], limit: number, signal: AbortSignal) {
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
  const expandedQuery = /电量|抗不抗用|续航|耐用多久/.test(query) ? `${query} 电池 容量 续航` : query
  const tokens = keywordTokens(expandedQuery).filter((token) =>
    !/^(?:的|了|吗|么|呢|这|它|可以|能否|什么|多少|请问|一下|怎么|如何|是否|这个|这款)$/.test(token)
  ).slice(0, 60)
  const semanticQuery = title ? `${title}\n${query}` : query
  const embedding = await embed(semanticQuery, signal).catch(() => {
    console.warn("Knowledge embedding unavailable; using keyword retrieval")
    return null
  })
  if (signal.aborted) return []

  const { rows } = await db.query<KnowledgeChunk>(`
    with eligible as not materialized (
      select chunk.* from laicai_knowledge.chunks chunk
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
      where rtrim(embedding_provider, '/') = rtrim($6, '/') and embedding_model = $7
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
    from eligible left join fused using (id)
    where fused.id is not null
       or (($2::boolean or $3::text is not null) and not exists (select 1 from fused))
    order by score desc nulls last, id limit 10
  `, [
    region, policy, productId ?? null,
    tokens.length ? tokens.join(" | ") : null,
    embedding?.vector ?? null, embedding?.provider ?? null, embedding?.model ?? null,
    Array.from(query.normalize("NFKC").matchAll(/\b(XXXL|XXL|XL|XS|S|M|L)\b/gi), ([, size]) => size.toUpperCase()),
  ])
  // Catalog-wide candidates must pass a store visibility check before reaching the reranker.
  if (!productId && !policy) return rows
  return rerankKnowledge(semanticQuery, rows, 3, signal).catch(() => rows.slice(0, 3))
}

export async function loadCatalogNames(region: string) {
  const names: { handle: string; title: string }[] = []
  let page: number | null = 1
  while (page !== null) {
    const { response, nextPage } = await listProducts({
      countryCode: region,
      pageParam: page,
      queryParams: { fields: "handle,title", limit: 100, order: "id", sales_channel_id: process.env.MEDUSA_SALES_CHANNEL_ID ? [process.env.MEDUSA_SALES_CHANNEL_ID] : undefined },
    })
    for (const { handle, title } of response.products) names.push({ handle, title })
    page = nextPage
  }
  return names
}

export async function backfillCatalogEmbeddings(productIds: string[], region: string) {
  const db = getPool()
  const provider = getEmbeddingProvider()
  if (!db || !provider || !productIds.length) return
  const identity = [provider.url.href, provider.model]
  const expectedDimensions = observedDimensions.get(JSON.stringify(identity)) ?? null
  const client = await db.connect()
  try {
    await client.query("begin")
    const { rows: [lock] } = await client.query<{ acquired: boolean }>(
      "select pg_try_advisory_xact_lock(hashtext('laicai_catalog_embedding')) as acquired",
    )
    if (lock.acquired) {
      const { rows } = await client.query<{ id: string; content: string; content_hash: string }>(`
        select id, content, content_hash from laicai_knowledge.chunks chunk
        where product_id = any($1::text[]) and region_code = $2 and document_path like 'catalog/%'
          and (embedding is null or (rtrim(embedding_provider, '/'), embedding_model) is distinct from (rtrim($3::text, '/'), $4::text)
               or ($5::integer is not null and embedding_dimensions <> $5))

        order by source_updated_at desc, id limit 8
      `, [productIds, region, ...identity, expectedDimensions])
      if (rows.length) {
        const vectors = await requestEmbeddings(provider, rows.map(({ content }) => content), AbortSignal.timeout(8000))
        if (vectors.some((vector) => vector.length !== (expectedDimensions ?? vectors[0].length))) {
          throw new Error("Embedding dimension mismatch")
        }
        for (let index = 0; index < rows.length; index++) {
          const row = rows[index]
          await client.query(`
            update laicai_knowledge.chunks set embedding = $3, embedding_provider = $4, embedding_model = $5
            where id = $1 and content_hash = $2
          `, [row.id, row.content_hash, vectors[index], ...identity])
        }
      }
    }
    await client.query("commit")
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    client.release()
  }
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
