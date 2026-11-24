const productAliases: Record<string, string[]> = {
  "usb-c-power-bank": ["移动电源", "充电宝"],
  "foldable-laptop-stand": ["电脑支架", "笔记本支架"],
  "glass-lunch-box": ["饭盒", "便当盒"],
  "steel-travel-mug": ["随行杯", "不锈钢杯", "水杯"],
  "sweatshirt": ["卫衣"],
  "sweatpants": ["运动长裤", "休闲长裤", "运动裤"],
  "shorts": ["休闲短裤", "短裤"],
  "t-shirt": ["t恤", "短袖"],
  "clear-storage-box": ["收纳箱", "收纳盒"],
  "tpe-yoga-mat": ["瑜伽垫", "训练垫"],
  "pet-slow-feeder": ["慢食碗"],
  "microfiber-flat-mop": ["拖把"],
}

const scenes: [RegExp, string][] = [
  [/居家办公|差旅|出差|移动办公/, "scene:work"],
  [/带饭|便当通勤/, "scene:lunch"],
  [/日常穿搭|休闲穿搭/, "scene:outfit"],
  [/户外运动|瑜伽|地面训练/, "scene:fitness"],
  [/养宠|宠物/, "scene:pets"],
]

type CatalogName = { handle: string; title: string }

function normalizeName(text: string) {
  return text.normalize("NFKC").toLowerCase().replace(/[\s-]+/g, "")
}

// Resolve model families against the live catalog so a new sibling makes a shorthand ambiguous.
function phoneModels(text: string, catalog: CatalogName[]) {
  const handles: string[] = []
  const normalized = text.normalize("NFKC").toLowerCase().replace(/畅享/g, "changxiang").replace(/华为/g, "huawei")
  const pattern = /(?:huawei[\s-]*)?(?:mate|pura|nova|osta|changxiang)[\s-]*(?:\d+|x|o\d+)(?:[\s-]*(?:pro|max|view|ultra|plus|lite|mini|se|air|fold|[+]))*/gi
  for (const match of Array.from(normalized.matchAll(pattern))) {
    const model = match[0]
    const tail = normalized.slice((match.index ?? 0) + model.length)
    const extra = tail.match(/^\s*(turbo|edge|plus|ultra|mini|lite|fold|neo|gt|fe|rs|5g|4g)(?![a-z])/i)
    if (extra) return { handles, message: `商城暂未确认「${model.trim()} ${extra[1]}」这个型号，请核对完整名称。` }
    const key = normalizeName(model).replace(/^huawei/, "")
    const phones = catalog.filter(({ title }) => /^huawei\s/i.test(title))
    const name = (title: string) => normalizeName(title).replace(/^huawei/, "").replace(/畅享/g, "changxiang")
    const exact = phones.find(({ title }) => name(title) === key)
    const candidates = exact ? [exact] : phones.filter(({ title }) => {
      const suffix = name(title).slice(key.length)
      return name(title).startsWith(key) && /^(pro|max|view|se|plus|ultra|lite)/.test(suffix)
    })
    if (candidates.length !== 1) {
      const message = candidates.length
        ? `你指的是哪一款？商城有：${candidates.map(p => p.title).join("、")}。`
        : `商城暂未找到「${model.trim()}」这个型号，请确认完整商品名。`
      return { handles, message, candidates }
    }
    handles.push(candidates[0].handle)
  }
  return { handles, message: undefined }
}

function mentions(text: string, catalog: CatalogName[]) {
  const normalized = normalizeName(text)
  const names = [
    ...Object.entries(productAliases).map(([handle, aliases]) => ({ handle, aliases: [handle, ...aliases] })),
    ...catalog.map(({ handle, title }) => ({
      handle,
      aliases: [handle, title, title.replace(/^[A-Z]{2,}\s+/, "")],
    })),
  ]
  const matches = names.flatMap(({ handle, aliases }) => aliases.flatMap((alias) => {
    const name = normalizeName(alias)
    if (!name || (/^[a-z0-9]+$/.test(name) && name.length < 4)) return []
    const start = normalized.indexOf(name)
    return start < 0 ? [] : [{ handle, start, end: start + name.length }]
  }))
  const best: typeof matches = []
  for (const match of matches.sort((a, b) => (b.end - b.start) - (a.end - a.start))) {
    if (best.some(({ handle, start, end }) => handle === match.handle || (start < match.end && end > match.start))) continue
    if (matches.some(({ handle, start, end }) => handle !== match.handle && start === match.start && end === match.end)) continue
    best.push(match)
  }
  return best.sort((a, b) => a.start - b.start).slice(0, 3).map(({ handle }) => handle)
}

export function resolveChatIntent(query: string, pageHandle: string | undefined, previousUserTurns: string[], catalog: CatalogName[] = []) {
  const identify = (text: string) => {
    const phones = phoneModels(text, catalog)
    return { ...phones, handles: Array.from(new Set([...phones.handles, ...mentions(text, catalog)])) }
  }
  function resolveTurn(text: string, previous?: ReturnType<typeof identify>) {
    const result = identify(text)
    if (result.handles.length || result.message) return result
    const choices = previous?.candidates ?? []
    const selection = choices.filter(p => {
      const suffix = p.title.split(/\s+/).pop()
      return suffix && text.toLowerCase().match(/[a-z0-9]+/g)?.includes(suffix.toLowerCase())
    })
    return selection.length === 1 ? { ...result, handles: [selection[0].handle] } : result
  }
  let lastProduct: ReturnType<typeof identify> | undefined
  for (const turn of [...previousUserTurns].reverse()) {
    const result = resolveTurn(turn, lastProduct)
    if (result.handles.length || result.message) lastProduct = result
  }
  const explicit = resolveTurn(query, lastProduct)
  const related = /搭配|配什么|配哪|还能(?:买|配|选|用)|还(?:缺|需要|要买|能买|可以配)|配套|配件推荐|一起(?:买|用)|入手什么|再买|添置/.test(query)
    || /(?:买了|刚买|已买|已经有).*(?:推荐|需要|配件)/.test(query)
  const recommendation = related || /推荐|挑选|选购|想找|有没有|有哪些|适合.+的/.test(query)
  const policy = /退货|换货|退换|怎么退|能退吗|七天无理由|运费|发货|配送|包邮|邮寄|寄到|多久(?:到货|送到)/.test(query)
  const price = /多少钱|什么价|售价|到手价|卖多少|价格|价位|报价/.test(query)
  const stock = /库存|有货|现货|缺货|售罄|卖完|还有(?:吗|没有)|能下单/.test(query)
  const detail = /颜色|配色|屏幕|电池|分辨率|重量|存储|性价比|适合|支持|材质|尺寸|尺码|选码|规格|型号|多大|多重|多少[瓦克]|功率|容量|电量|接口|充电(?!宝)|防水|洗|缩水|兼容|能不能用|能否|使用方法|保修|胸围|腰围|衣长/.test(query)
  const contextual = /这[个件款条只]|它|刚才|上一[个款]|那[个件款条只]|[呢吗？?]|^(?:还能|还缺|再买|配什么|怎么|多少)/.test(query)
  const followup = price || stock || detail || contextual || (!policy && !recommendation)
  const recent = followup ? lastProduct : undefined
  const pageReference = /当前(?:页面|商品)|页面上这款/.test(query)
  const ambiguousHistory = recent && recent.handles.length > 1 && /它|这款|那款/.test(query)
    ? "刚才提到了多款商品，请确认你指的是哪一款。" : undefined
  const message = explicit.message || (!explicit.handles.length && !pageReference && (recent?.message || ambiguousHistory))
  const handles = explicit.handles.length ? explicit.handles
    : !pageReference && recent?.handles.length ? recent.handles
    : pageHandle ? [pageHandle] : []
  const scene = scenes.find(([pattern]) => pattern.test(query))?.[1]
  return { clarification: message, handles, policy, price, stock, detail, recommendation, graphNode: related ? handles[0] ?? scene : handles.length ? undefined : scene }
}
