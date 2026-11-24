import assert from "node:assert/strict"
import test from "node:test"
import { createRequire } from "node:module"
import { readFileSync } from "node:fs"
import ts from "typescript"
import { resolveChatIntent } from "../src/lib/ai/chat-intent.ts"
import { isLiveOnly, selectVariants } from "../src/lib/ai/variant-selection.ts"
import { getPreviewProductDetails } from "../src/lib/util/preview-product-details.ts"
import { getEmbeddingProvider } from "../src/lib/ai/knowledge-input.mjs"

const mate = { handle: "mate", title: "HUAWEI Mate 90 Pro Max" }
const view = { handle: "view", title: "HUAWEI Pura X View" }
const catalog = [mate, view, { handle: "max", title: "HUAWEI Pura X Max" }, {handle:"cx", title:"HUAWEI 畅享 100 Pro"}]
const intent = (q, history = [], page) => resolveChatIntent(q, page, history, catalog)
test("catalog families, ambiguity, clarification and unknown suffixes", () => {
  assert.deepEqual(intent("华为 Mate90价格").handles, ["mate"])
  assert.deepEqual(intent("畅享100Pro").handles, ["cx"])
  assert.match(intent("PuraX多少钱").clarification, /View.*Max/)
  assert.deepEqual(intent("View", ["PuraX多少钱"]).handles, ["view"])
  assert.deepEqual(intent("红色现货", ["View", "PuraX多少钱"]).handles, ["view"])
  assert.match(intent("Mate 90 Pro Max Ultra 报价").clarification, /暂未找到/)
})
test("terse follow-ups use the latest named product before the current page", () => {
  for (const q of ["典藏版价格", "512G到手价", "红色现货", "电池容量"]) {
    assert.deepEqual(intent(q, [mate.title], view.handle).handles, ["mate"])
  }
})
test("option constraints are applied before paging and respect combination boundaries", () => {
  const variants = ["幻夜黑", "跃影红"].flatMap(color => ["12GB+256GB", "12GB+512GB"].map(storage => ({
    title: color + " " + storage, options: [{value: color}, {value: storage}],
  })))
  assert.deepEqual(selectVariants("红色512G现货", variants), [variants[3]])
  assert.deepEqual(selectVariants("蓝色1TB多少钱", variants), [])
})
test("structured metadata retains object and pair formats beyond twelve rows", () => {
  const rows = Array.from({length: 31}, (_, i) => ["参数" + i, String(i)])
  for (const specs of [rows, Object.fromEntries(rows)]) {
    assert.deepEqual(getPreviewProductDetails({preview_details:{specs}}).specs, rows)
  }
})

// Execute the actual Next route with in-memory adapters; no DB, credentials or model requests.
const source = readFileSync(new URL("../src/app/api/chat/route.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
function isolatedRoute(variants, modelFetch) {
  const product = { ...mate, id: "p1", variants, metadata: {preview_details: {specs: {电池:"6800mAh"}}} }
  const modules = {
    "@lib/ai/chat-intent": {resolveChatIntent},
    "@lib/ai/knowledge": {loadCatalogNames: async () => catalog, searchKnowledge: async () => [], findRelations: async () => []},
    "@lib/ai/knowledge-input.mjs": {providerUrl: value => new URL(value)},
    "@lib/data/products": {listProducts: async () => ({response: {products: [product]}})},
    "@lib/data/regions": {getRegion: async () => ({currency_code: "cny"})},
    "@lib/util/apparel-size-guide": {getApparelSizeGuide: () => undefined},
    "@lib/util/money": {convertToLocale: ({amount}) => "¥" + amount},
    "@lib/util/preview-product-details": {getPreviewProductDetails},
    "@lib/util/site": {DEFAULT_COUNTRY_CODE: "cn"},
    "@lib/ai/variant-selection": {isLiveOnly,selectVariants},
    "next/server": {after: () => {}},
  }
  const exported = {}
  const nativeRequire = createRequire(import.meta.url)
  const localRequire = name => modules[name] ?? nativeRequire(name)
  const env = {AI_CHAT_API_KEY:"test", AI_CHAT_MODEL:"test", AI_CHAT_BASE_URL:"http://localhost", AI_CHAT_TIMEOUT_MS:"1000"}
  new Function("exports", "require", "fetch", "process", compiled)(exported, localRequire, modelFetch, {env})
  return async query => (await exported.POST(new Request("http://localhost/api/chat", {
    method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({query,countryCode:"cn"}),
  }))).json()
}
test("missing inventory and regional prices never become stock or foreign quotes", async () => {
  const variant = {title:"标准",manage_inventory:true,calculated_price:{currency_code:"usd",calculated_amount:123}}
  const ask = isolatedRoute([variant], () => Promise.resolve(Response.json({choices:[{message:{content:"[ANSWERED]"}}]})))
  const {reply} = await ask("Mate90多少钱，有货吗？")
  assert.match(reply,/CNY/); assert.match(reply,/库存暂未查到/); assert.doesNotMatch(reply,/123|· 有货/)
})
test("compound question still reaches model; timeout explains partial response and retains facts", async () => {
  const variant = {title:"标准",manage_inventory:false,calculated_price:{currency_code:"cny",calculated_amount:5999}}
  const ask = isolatedRoute([variant], async (_, {signal,body}) => {
    assert.match(body,/5999/)
    await new Promise((resolve,reject) => {
      const timer = setTimeout(resolve, 2000)
      signal.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason) }, {once:true})
    })
  })
  const {reply,partial} = await ask("Mate90 多少钱，电池容量如何，适合买给长辈吗？")
  assert.equal(partial,true); assert.match(reply,/超时/); assert.match(reply,/5999/); assert.match(reply,/6800mAh/)
})
test("equivalent embedding endpoints retain the same identity", t => {
  const keys = ["AI_EMBEDDING_BASE_URL","AI_EMBEDDING_MODEL","AI_EMBEDDING_API_KEY"]
  const prev = keys.map(k => process.env[k])
  t.after(() => keys.forEach((k,i) => { if(prev[i] === undefined) delete process.env[k]; else process.env[k] = prev[i] }))
  process.env.AI_EMBEDDING_MODEL = "test"
  process.env.AI_EMBEDDING_API_KEY = "test"
  for(const base of ["http://127.0.0.1:11434", "http://127.0.0.1:11434/", "http://127.0.0.1:11434/embeddings/"]) {
    process.env.AI_EMBEDDING_BASE_URL = base
    assert.equal(getEmbeddingProvider().url.href,"http://127.0.0.1:11434/embeddings")
  }
})
