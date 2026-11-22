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

function mentions(text: string) {
  const normalized = text.normalize("NFKC").toLowerCase().replace(/\s+/g, "")
  return Object.entries(productAliases).flatMap(([handle, aliases]) => {
    const index = Math.min(...[handle, ...aliases].map((alias) => {
      const position = normalized.indexOf(alias)
      return position < 0 ? Infinity : position
    }))
    return Number.isFinite(index) ? [{ handle, index }] : []
  }).sort((a, b) => a.index - b.index).slice(0, 3).map(({ handle }) => handle)
}

export function resolveChatIntent(query: string, pageHandle: string | undefined, previousUserTurns: string[]) {
  const explicit = mentions(query)
  const related = /搭配|配什么|配哪|还能(?:买|配|选|用)|还(?:缺|需要|要买|能买|可以配)|配套|配件推荐|一起(?:买|用)|入手什么|再买|添置/.test(query)
    || /(?:买了|刚买|已买|已经有).*(?:推荐|需要|配件)/.test(query)
  const recommendation = related || /推荐|挑选|选购|想找|有没有|有哪些|适合.+的/.test(query)
  const policy = /退货|换货|退换|怎么退|能退吗|七天无理由|运费|发货|配送|包邮|邮寄|寄到|多久(?:到货|送到)/.test(query)
  const price = /多少钱|什么价|售价|到手价|卖多少|价格|价位|报价/.test(query)
  const stock = /库存|有货|现货|缺货|售罄|卖完|还有(?:吗|没有)|能下单/.test(query)
  const detail = /材质|尺寸|尺码|选码|规格|型号|多大|多重|多少[瓦克]|功率|容量|电量|接口|充电(?!宝)|防水|洗|缩水|兼容|能不能用|能否|使用方法|保修|胸围|腰围|衣长/.test(query)
  const contextual = /这[个件款条只]|它|刚才|上一[个款]|那[个件款条只]|[呢吗？?]|^(?:还能|还缺|再买|配什么|怎么|多少)/.test(query)
  const recent = contextual ? previousUserTurns.map(mentions).find((items) => items.length) : undefined
  const handles = explicit.length ? explicit : pageHandle ? [pageHandle] : recent?.length === 1 ? recent : []
  const scene = scenes.find(([pattern]) => pattern.test(query))?.[1]
  return { handles, policy, price, stock, detail, recommendation, graphNode: related ? handles[0] ?? scene : handles.length ? undefined : scene }
}
