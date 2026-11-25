import assert from "node:assert/strict"
import test from "node:test"
import { createRequire } from "node:module"
import { readFileSync } from "node:fs"
import { createElement } from "react"
import { adaptChatResponse } from "../src/modules/ai-chat/response-adapter.ts"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"
import { createJiti } from "jiti"
import { resolveChatIntent } from "../src/lib/ai/chat-intent.ts"
import { isLiveOnly, selectVariants } from "../src/lib/ai/variant-selection.ts"
import { getPreviewProductDetails } from "../src/lib/util/preview-product-details.ts"
import { getEmbeddingProvider } from "../src/lib/ai/knowledge-input.mjs"

const mate = { handle: "mate", title: "HUAWEI Mate 90 Pro Max" }
test("adapter keeps cards separate from inline references and preserves partial replies", () => {
  const link = { title: mate.title, href: "/cn/products/mate" }
  const card = { ...link, price: "¥5999", reason: "推荐理由" }
  const source = { title: "退换货", type: "policy", snippet: "说明" }
  const reply = adaptChatResponse({
    reply: "**说明**", partial: true, products: [card, null],
    productLinks: [link], sources: [source], suggestions: ["更多", false],
  }, true, () => assert.fail())
  assert.equal(reply.content, "**说明**")
  assert.equal(reply.status, "partial")
  assert.deepEqual(reply.products, [{
    ...card, id: link.href, handle: mate.handle, thumbnail: null,
    stockStatus: undefined, variantId: undefined,
  }])
  assert.deepEqual(reply.suggestions, ["更多"])
  assert.deepEqual(reply.sources, [{ ...source, url: undefined }])
  assert.deepEqual(reply.productLinks, [link])
  const clarification = adaptChatResponse({ reply: mate.title, productLinks: [link] }, true, () => assert.fail())
  assert.equal(clarification.products, undefined)
  assert.equal(clarification.status, "live")
  assert.equal(adaptChatResponse({ code: "AI_NOT_CONFIGURED" }, false, () => "demo").status, "demo")
  assert.throws(() => adaptChatResponse({ reply: 42 }, true, () => ""), /Chat unavailable/)
})
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
function isolatedRoute(variants, modelFetch, { extraProducts = [], knowledge = [] } = {}) {
  const product = { ...mate, id: "p1", variants, metadata: {preview_details: {specs: {电池:"6800mAh"}}} }
  const modules = {
    "@lib/ai/chat-intent": {resolveChatIntent},
    "@lib/ai/knowledge": {
      loadCatalogNames: async () => [...catalog, ...extraProducts],
      searchKnowledge: async ({ productId }) => knowledge.filter(({ product_id }) => product_id === productId),
      findRelations: async () => [],
    },
    "@lib/ai/knowledge-input.mjs": {providerUrl: value => new URL(value)},
    "@lib/data/products": {listProducts: async () => ({response: {products: [product, ...extraProducts]}})},
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
  const {reply, productLinks, products} = await ask("Mate90多少钱，有货吗？")
  assert.match(reply,/CNY/); assert.match(reply,/\*\*库存暂未查到\*\*/); assert.doesNotMatch(reply,/123|\b有货|\*\*有货\*\*/)
  assert.deepEqual(productLinks, [{ title: mate.title, href: "/cn/products/mate" }])
  assert.equal(products, undefined)
})
test("ambiguous catalog queries link the named choices", async () => {
  const ask = isolatedRoute([], () => assert.fail("clarifications should skip the model"))
  const { reply, productLinks } = await ask("PuraX多少钱")
  assert.match(reply, /View.*Max/)
  assert.deepEqual(productLinks.map(({ href }) => href), ["/cn/products/view", "/cn/products/max"])
})
test("charging compatibility keeps verified facts for both products and limits the conclusion", async () => {
  const bank = { id: "bank", handle: "usb-c-power-bank", title: "USB-C 双向快充移动电源" }
  const knowledge = [
    { product_id: "p1", product_handle: mate.handle, document_path: "products/huawei-mate-90-pro-max.md" },
    { product_id: bank.id, product_handle: bank.handle, document_path: "products/usb-c-power-bank.md" },
  ].map((item) => {
    const document = readFileSync(new URL("../../../knowledge-base/" + item.document_path, import.meta.url), "utf8")
    return { ...item, content: document.split(/^---\r?$/m)[2].trim() }
  })
  let modelCalled = false
  const ask = isolatedRoute([], async (_, { body }) => {
    modelCalled = true
    const { messages } = JSON.parse(body)
    const [prompt, json] = messages[0].content.split("\n\n本轮核实资料（JSON）\n")
    const { evidence } = JSON.parse(json)
    assert.match(prompt, /达不到该档位/)
    assert.match(prompt, /不能单凭功率差断言完全不支持快充/)
    assert.match(evidence.find(({ document }) => document === knowledge[0].document_path).content, /最高 100 W.*充电套装/)
    assert.match(evidence.find(({ document }) => document === knowledge[1].document_path).content, /USB-C 支持双向充电，最高输出 20 W/)
    return Response.json({ choices: [{ message: { content: "达不到手机的 100 W 档位，其他快充档位尚未确认。" } }] })
  }, { extraProducts: [bank], knowledge })

  const { reply, partial, sources } = await ask("你们店里的那款移动电源（充电宝），能给 Mate 90 Pro Max 充快充吗？")
  assert.deepEqual(sources.map(({ url }) => url), ["/cn/products/mate", "/cn/products/usb-c-power-bank"])
  assert.ok(modelCalled)
  assert.equal(partial, undefined)
  assert.match(reply, /其他快充档位尚未确认/)
})
test("compound question still reaches model; timeout explains partial response and retains facts", async () => {
  const variant = {title:"标准",manage_inventory:false,calculated_price:{currency_code:"cny",calculated_amount:5999}}
  const ask = isolatedRoute([variant], async (_, {signal,body}) => {
    assert.match(body,/5999/)
    assert.match(body, /\/cn\/products\/mate/)
    await new Promise((resolve,reject) => {
      const timer = setTimeout(resolve, 2000)
      signal.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason) }, {once:true})
    })
  })
  const {reply,partial} = await ask("Mate90 多少钱，电池容量如何，适合买给长辈吗？")
  assert.equal(partial,true); assert.match(reply,/超时/); assert.match(reply,/5999/); assert.match(reply,/6800mAh/)
})
const loadComponent = createJiti(import.meta.url, { jsx: { runtime: "automatic" }, fsCache: false })
test("restores structured chat turns and follow-up context without mixing shoppers or reviving cleared replies", t => {
  const { conversationScope, saveTurn, restoreConversation, clearHistory } = loadComponent("../src/modules/ai-chat/conversation-history.ts")
  const storage = Object.create(null)
  Object.defineProperties(storage, {
    getItem: { value: key => storage[key] ?? null },
    setItem: { value: (key, value) => { storage[key] = value } },
    removeItem: { value: key => { delete storage[key] } },
  })
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage")
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage })
  t.after(() => { if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor); else delete globalThis.localStorage })
  const scope = conversationScope("cn", "customer-a")
  const other = conversationScope("cn", "customer-b")
  const user = { id: 1, role: "user", content: "尺码怎么选？" }
  const product = { title: "卫衣", href: "/cn/products/hoodie", price: "¥129", reason: "日常穿搭" }
  const assistant = { id: 2, role: "assistant", ...adaptChatResponse({reply: "请参考尺码表", products:[product], suggestions:["了解 M 码"], sources:[{title:"尺码表", type:"product"}]}, true, () => "") }
  saveTurn(scope, "t", user, "hoodie")
  saveTurn(scope, "t", user, "hoodie", assistant)
  assert.deepEqual(restoreConversation(scope).messages, [user, assistant])
  assert.deepEqual(restoreConversation(scope).history.turns.map(turn => turn.content), [user.content, assistant.content])
  assert.equal(restoreConversation(other).messages.length, 0)
  saveTurn(other, "t", user)
  clearHistory(scope)
  saveTurn(scope, "t", user, "hoodie", assistant)
  assert.equal(restoreConversation(scope).messages.length, 0)
  assert.deepEqual(restoreConversation(other).messages, [user])
})
const AssistantReply = loadComponent("../src/modules/ai-chat/components/ai-chat-widget/assistant-reply.tsx").default
const widgetDir = "../src/modules/ai-chat/components/ai-chat-widget/"

test("suggestions prefer distinct backend prompts and fill from current context", () => {
  const { suggestionsFor } = loadComponent(widgetDir + "suggestions.ts")
  const base = { id: 1, content: "", role: "assistant" }
  const cards = { ...base, products: [{}], suggestions: [" 继续 ", "", "继续"] }
  assert.deepEqual(suggestionsFor(cards), ["继续", "比较这些商品", "怎么选尺寸或规格？"])
  assert.match(suggestionsFor({ ...base, sources: [{type:"policy"}] })[0], /退货/)
  assert.equal(suggestionsFor(base, { name: "手机", specs: [["功率", "20W"]] })[1], "了解功率")
  assert.equal(suggestionsFor({ ...base, status: "error" }, undefined, "多少钱？")[0], "多少钱？")
})

test("stock tokens distinguish quantities and retain literal negation and code", () => {
  const { stockTone } = loadComponent(widgetDir + "status-badge.tsx")
  for (const [text, tone] of [["In Stock","in"],["Only 2 left","low"],["缺货","out"],["stocking",undefined]]) assert.equal(stockTone(text), tone)
  const html = renderToStaticMarkup(createElement(AssistantReply, {content:"Not in stock. `Low Stock`. Stocking up."}))
  assert.doesNotMatch(html, /text-green-800|text-amber-900/)
})

test("message actions restore a vote by message ID and hide absent or unsafe source links", t => {
  const data = new Map()
  const previous = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage")
  Object.defineProperty(globalThis, "sessionStorage", {configurable:true, value:{
    getItem:key => data.get(key), setItem:(key,value) => data.set(key,value), removeItem:key => data.delete(key),
  }})
  t.after(() => { if (previous) Object.defineProperty(globalThis, "sessionStorage", previous); else delete globalThis.sessionStorage })
  const { MessageActions, SourcesPanel } = loadComponent(widgetDir + "message-details.tsx")
  const { feedbackStore } = loadComponent(widgetDir + "feedback.ts")
  const key = "test"
  feedbackStore.save(key, 7, { vote: "down", reason: "库存" })
  assert.deepEqual(feedbackStore.read(key,7), { vote: "down", reason: "库存" })
  const html = renderToStaticMarkup(createElement(MessageActions, { message:{id:7, content:"answer"}, storageKey:key }))
  assert.match(html, /aria-pressed="true"/)
  assert.match(html, /复制/)
  assert.equal(renderToStaticMarkup(createElement(SourcesPanel)), "")
  assert.doesNotMatch(renderToStaticMarkup(createElement(SourcesPanel,{sources:[{title:"policy",url:"javascript:alert(1)",type:"policy"}]})), /href=/)
  feedbackStore.clear(key)
  assert.equal(feedbackStore.read(key,7), undefined)
})

test("product card exposes checkout only for an available variant", () => {
  const source = readFileSync(new URL(widgetDir + "product-card.tsx", import.meta.url), "utf8")
  const { outputText } = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS, jsx:ts.JsxEmit.ReactJSX, esModuleInterop:true, target:ts.ScriptTarget.ES2022}})
  const modules = {
    "next/navigation": {useParams:()=>({countryCode:"cn"})},
    "@modules/common/components/localized-client-link": ({href,children}) => createElement("a",{href:"/cn"+href},children),
    "./status-badge": loadComponent(widgetDir+"status-badge.tsx"),
  }
  const exports = {}
  const native = createRequire(import.meta.url)
  new Function("exports","require",outputText)(exports, name => name.startsWith("@lib/") ? {} : modules[name] ?? native(name))
  const product = {id:"x", href:"/cn/products/x", title:"杯子", price:"¥32", reason:"轻便", variantId:"v"}
  const render = props => renderToStaticMarkup(createElement(exports.default,{product:{...product,...props}}))
  assert.match(render({}), /加入购物车/)
  assert.match(render({}), /href="\/cn\/products\/x"/)
  assert.doesNotMatch(render({stockStatus:"缺货"}), /加入购物车/)
  assert.match(render({variantId:undefined}), /role="tooltip"/)
})

test("assistant highlights specs and links verified product names only", () => {
  const html = renderToStaticMarkup(createElement(AssistantReply, {
    content: "**[HUAWEI Mate 90 Pro Max](/cn/products/mate)** 支持 **有线快充**，容量 6800mAh。\n"
      + "Mate 90 Pro Max 的屏幕为 6.9 英寸。"
      + "[HUAWEI Pura X View](/cn/products/mate) 支持 1–120Hz。[其他](javascript:alert(1))<b>原样文本</b>",
    products: [{ title: mate.title, href: "/cn/products/mate" }, { title: view.title, href: "/cn/products/view" }],
  }))
  assert.equal(html.match(/href="\/cn\/products\/mate"/g)?.length, 2)
  assert.match(html, /href="\/cn\/products\/view">HUAWEI Pura X View<\/a>/)
  for (const text of ["有线快充", "6800mAh", "6.9 英寸", "1–120Hz"]) {
    assert.ok(html.includes(">" + text + "</strong>"))
  }
  assert.match(html, /其他原样文本/)
  assert.doesNotMatch(html, /javascript:|↗|\*\*/)
})
test("rich replies keep code literal, collapse long specs, and handle partial markdown", () => {
  const render = content => renderToStaticMarkup(createElement(AssistantReply, { content }))
  const html = render("### Specs\n- Color: blue\n- Size: medium\n- Weight: 1kg\n- Stock: In Stock\n- Hidden row: five\n\n`Only 3 left` [Docs](https://example.org)")
  assert.match(html, /查看全部规格/)
  assert.doesNotMatch(html, /Hidden row/)
  assert.match(html, /text-green-800/)
  assert.match(html, />Only 3 left<\/code>/)
  assert.match(html, /rel="noopener noreferrer"/)
  assert.match(render("| Spec | A | B (best) |\n|---|---|---|\n|Size|M|L|"), /sticky left-0/)
  const compact = render("| 参数 | 值 |\n|---|---|\n|一|1|\n|二|2|\n|三|3|\n|四|4|\n|隐藏行|5|")
  assert.match(compact, /查看全部规格/)
  assert.doesNotMatch(compact, /隐藏行/)
  for (const partial of ["**", "[item](", "| A | B", "```js\nconst x ="]) assert.doesNotThrow(() => render(partial))
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
