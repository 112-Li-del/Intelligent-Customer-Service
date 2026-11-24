import { createHash } from "node:crypto"
import { readFileSync, readdirSync } from "node:fs"
import pg from "pg"
import { getEmbeddingProvider, keywordTokens, requestEmbeddings } from "../src/lib/ai/knowledge-input.mjs"

const knowledge = new URL("../../../knowledge-base/", import.meta.url)
const textOnly = process.argv.includes("--text-only")
const hash = (text) => createHash("sha256").update(text).digest("hex")

function readDocuments() {
  const documents = []
  for (const kind of ["products", "policies"]) {
    const folder = new URL(`${kind}/`, knowledge)
    for (const name of readdirSync(folder).sort()) {
      if (!name.endsWith(".md")) continue
      const file = `${kind}/${name}`
      const raw = readFileSync(new URL(name, folder), "utf8").replace(/\r\n/g, "\n")
      const header = raw.match(/^---\n([^]*?)\n---\n/)
      if (!header) throw new Error(`Missing metadata in ${file}`)
      const metadata = Object.fromEntries(header[1].split("\n").filter(Boolean).map((line) => {
        const [, key, value] = line.match(/^([a-z_]+):\s*(.+)$/) ?? []
        if (!key) throw new Error(`Invalid metadata in ${file}`)
        return [key, JSON.parse(value)]
      }))
      if (metadata.status !== "approved") continue
      const markdown = raw.slice(header[0].length).replace(/^<!--.*-->\s*$/gm, "")
      const title = markdown.match(/^# (.+)$/m)?.[1]
      const sections = Array.from(markdown.matchAll(/^## (.+)\n([^]*?)(?=^## |(?![^]))/gm))
      if (!title || !metadata.locale || !metadata.region_code || !sections.length) {
        throw new Error(`Incomplete approved document: ${file}`)
      }
      if (kind === "products" && metadata.product_handle !== name.slice(0, -3)) {
        throw new Error(`Product handle does not match ${file}`)
      }
      documents.push({ file, title, metadata, sections })
    }
  }
  if (!documents.length) throw new Error("No approved knowledge documents found")
  return documents
}

async function resolveProductIds(documents, allowUnavailable = false) {
  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.trim() || "http://localhost:9000"
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.trim()
  if (!key) throw new Error("Medusa publishable API key is required")
  const results = new Map()
  for (const { metadata } of documents) {
    const handle = metadata.product_handle
    if (!handle || results.has(handle)) continue
    const url = new URL(`${baseUrl.replace(/\/+$/, "")}/store/products`)
    url.search = new URLSearchParams({ handle, fields: "id,handle", limit: "1" })
    const response = await fetch(url, {
      headers: { "x-publishable-api-key": key },
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error(`Medusa catalog lookup failed (HTTP ${response.status})`)
    const { products } = await response.json()
    const product = products?.find((item) => item.handle === handle)
    if (!product?.id && allowUnavailable) continue
    if (!product?.id) throw new Error(`Unavailable Medusa product: ${handle}`)
    results.set(handle, product.id)
  }
  return results
}

function buildChunks(documents, ids) {
  return documents.flatMap(({ file, title, metadata, sections }) => sections.flatMap(([, heading, body]) => {
    const cleaned = body.trim()
    if (!cleaned) return []
    const sizeGuide = heading.startsWith("成衣平铺参考尺寸")
    const table = sizeGuide
      ? cleaned.match(/^(\|[^\n]+)\n(\|[^\n]+)\n((?:\|[^\n]+\n?)+)\s*([^]*)$/)
      : null
    if (sizeGuide && !table) throw new Error(`Invalid size table in ${file}`)
    const entries = table
      ? table[3].trimEnd().split("\n").map((line) => {
        const size = line.split("|")[1].trim()
        return { size, text: [table[1], table[2], line, table[4].trim()].filter(Boolean).join("\n") }
      })
      : [{ size: null, text: cleaned }]

    return entries.map(({ size, text }) => {
      const content = [title, size ? `${heading} · ${size} 码` : heading, text].join("\n\n")
      return {
        id: hash(JSON.stringify([file, heading, size])),
        file, title, heading, size, content,
        hash: hash(content),
        keywords: [content, ...keywordTokens(content)].join(" "),
        productId: ids.get(metadata.product_handle) ?? null,
        handle: metadata.product_handle ?? null,
        categories: metadata.categories ?? [],
        region: metadata.region_code,
        locale: metadata.locale,
        source: metadata.sources ?? [metadata.source],
        updatedAt: metadata.updated_at || null,
      }
    })
  }))
}

async function importText(client, chunks) {
  const relations = JSON.parse(readFileSync(new URL("product-relations.json", knowledge), "utf8"))
  const handles = new Set(chunks.map(({ handle }) => handle).filter(Boolean))
  for (const { from, to } of relations) {
    if ((!handles.has(from) && !from.startsWith("scene:")) || !handles.has(to) || from === to) {
      throw new Error(`Invalid product relation: ${from} -> ${to}`)
    }
  }
  await client.query("begin")
  try {
    await client.query("select pg_advisory_xact_lock(hashtext('laicai_knowledge_import'))")
    await client.query(`
      create schema if not exists laicai_knowledge;
      create table if not exists laicai_knowledge.chunks (
        id text primary key,
        document_path text not null,
        title text not null,
        section text not null,
        size text,
        content text not null,
        content_hash text not null,
        keyword_text text not null,
        search_terms tsvector generated always as (to_tsvector('simple'::regconfig, keyword_text)) stored,
        product_id text,
        product_handle text,
        categories text[] not null,
        region_code text not null,
        locale text not null,
        source_paths text[] not null,
        source_updated_at timestamptz,
        embedding real[],
        embedding_provider text,
        embedding_model text,
        embedding_dimensions integer generated always as (cardinality(embedding)) stored,
        constraint chunk_embedding_identity check (
          (embedding is null and embedding_provider is null and embedding_model is null) or
          (embedding is not null and cardinality(embedding) > 0 and embedding_provider is not null and embedding_model is not null)
        )
      );
      create index if not exists knowledge_search_terms on laicai_knowledge.chunks using gin (search_terms);
      create index if not exists knowledge_product_region on laicai_knowledge.chunks (product_id, region_code);
      create index if not exists knowledge_document_path on laicai_knowledge.chunks (document_path);
      create table if not exists laicai_knowledge.product_relations (
        source_node text not null,
        target_handle text not null,
        relation_type text not null,
        reason text not null,
        primary key (source_node, target_handle)
      );
    `)
    await client.query("delete from laicai_knowledge.product_relations")
    for (const { from, to, type, reason } of relations) {
      await client.query(
        "insert into laicai_knowledge.product_relations values ($1, $2, $3, $4)",
        [from, to, type, reason],
      )
    }
    for (const chunk of chunks) {
      await client.query(`
        insert into laicai_knowledge.chunks as existing
          (id, document_path, title, section, size, content, content_hash, keyword_text, product_id, product_handle,
           categories, region_code, locale, source_paths, source_updated_at)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        on conflict (id) do update set
          title = excluded.title, content = excluded.content, content_hash = excluded.content_hash,
          keyword_text = excluded.keyword_text, product_id = excluded.product_id, product_handle = excluded.product_handle,
          categories = excluded.categories, region_code = excluded.region_code, locale = excluded.locale,
          source_paths = excluded.source_paths, source_updated_at = excluded.source_updated_at,
          embedding = case when existing.content_hash = excluded.content_hash then existing.embedding end,
          embedding_provider = case when existing.content_hash = excluded.content_hash then existing.embedding_provider end,
          embedding_model = case when existing.content_hash = excluded.content_hash then existing.embedding_model end
      `, [chunk.id, chunk.file, chunk.title, chunk.heading, chunk.size, chunk.content, chunk.hash, chunk.keywords,
        chunk.productId, chunk.handle, chunk.categories, chunk.region, chunk.locale, chunk.source, chunk.updatedAt])
    }
    await client.query(
      "delete from laicai_knowledge.chunks where document_path not like 'catalog/%' and not (id = any($1::text[]))",
      [chunks.map(({ id }) => id)],
    )
    await client.query(readFileSync(new URL("./catalog-knowledge.sql", import.meta.url), "utf8"))
    await client.query("commit")
  } catch (error) {
    await client.query("rollback")
    throw error
  }
}

async function importEmbeddings(client, provider) {
  const [probe] = await requestEmbeddings(provider, "商品规格", AbortSignal.timeout(30000))
  const identity = [provider.url.href, provider.model, probe.length]
  const { rows } = await client.query(`
    select id, content, content_hash, product_id, product_handle from laicai_knowledge.chunks chunk
    where embedding is null or (rtrim(embedding_provider, '/'), embedding_model, embedding_dimensions)
      is distinct from (rtrim($1::text, '/'), $2::text, $3::int)
    order by id
  `, identity)
  const catalogHandles = [...new Set(rows.filter(({ id }) => id.startsWith("catalog:")).map(({ product_handle }) => product_handle))]
  const visible = await resolveProductIds(catalogHandles.map((product_handle) => ({ metadata: { product_handle } })), true)
  const pending = rows.filter(({ id, product_handle, product_id }) => !id.startsWith("catalog:") || visible.get(product_handle) === product_id)
  const generated = []
  const dimensions = probe.length
  for (let start = 0; start < pending.length; start += 8) {
    const batch = pending.slice(start, start + 8)
    const vectors = await requestEmbeddings(provider, batch.map(({ content }) => content), AbortSignal.timeout(30_000))
    for (const [index, row] of batch.entries()) {
      const vector = vectors[index]
      if (vector.length !== dimensions) throw new Error("Inconsistent Embedding dimensions")
      generated.push({ ...row, vector })
    }
  }
  if (!generated.length) return 0

  await client.query("begin")
  try {
    await client.query("select pg_advisory_xact_lock(hashtext('laicai_knowledge_import'))")
    for (const { id, content_hash, vector } of generated) {
      const updated = await client.query(`
        update laicai_knowledge.chunks
        set embedding = $3, embedding_provider = $4, embedding_model = $5
        where id = $1 and content_hash = $2
      `, [id, content_hash, vector, provider.url.href, provider.model])
      if (updated.rowCount !== 1) throw new Error("Knowledge changed while embeddings were being generated")
    }
    await client.query("commit")
    return generated.length
  } catch (error) {
    await client.query("rollback")
    throw error
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(databaseUrl).hostname)) {
    throw new Error("A local PostgreSQL DATABASE_URL is required")
  }
  const client = new pg.Client({ connectionString: databaseUrl, connectionTimeoutMillis: 5000 })
  await client.connect()
  try {
    if (process.argv.includes("--refresh-catalog")) {
      await client.query(readFileSync(new URL("./catalog-knowledge.sql", import.meta.url), "utf8"))
    } else {
      const documents = readDocuments()
      const chunks = buildChunks(documents, await resolveProductIds(documents))
      if (!chunks.length) throw new Error("No knowledge chunks found")
      await importText(client, chunks)
      console.log(`Imported ${chunks.length} chunks from ${documents.length} approved documents.`)
    }
    const provider = textOnly ? null : getEmbeddingProvider()
    if (provider) console.log(`Stored ${await importEmbeddings(client, provider)} new embeddings.`)
    else console.log("Embedding step skipped.")
    const { rows } = await client.query(`
      select count(*)::int as chunks, count(embedding)::int as embedded, min(embedding_dimensions) as dimensions
      from laicai_knowledge.chunks
    `)
    console.log(rows[0])
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error.code ? `Knowledge import failed (${error.code}).` : error.message)
  process.exitCode = 1
})
