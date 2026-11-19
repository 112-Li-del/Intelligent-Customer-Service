type SearchFacet = {
  label: string
  keywords: [string, ...string[]]
  aliases: string[]
}

const sweatshirt: SearchFacet = {
  label: "卫衣",
  keywords: ["卫衣", "套头衫"],
  aliases: ["外套", "长袖"],
}
const tshirt: SearchFacet = {
  label: "短袖 T 恤",
  keywords: ["短袖", "T 恤", "体恤", "半袖"],
  aliases: ["打底衫"],
}
const trousers: SearchFacet = {
  label: "长裤",
  keywords: ["长裤", "运动裤", "卫裤", "休闲裤"],
  aliases: [],
}
const shorts: SearchFacet = {
  label: "短裤",
  keywords: ["短裤", "五分裤"],
  aliases: ["运动短裤"],
}
const travelCup: SearchFacet = {
  label: "随行杯",
  keywords: ["随行杯", "保温杯", "咖啡杯", "不锈钢随行杯"],
  aliases: ["杯子", "水杯", "水壶", "喝水"],
}
const lunchBox: SearchFacet = {
  label: "玻璃饭盒",
  keywords: ["饭盒", "便当盒", "保鲜盒", "餐盒", "玻璃饭盒", "锁扣玻璃饭盒"],
  aliases: ["玻璃碗", "打包盒", "带饭"],
}
const storageBin: SearchFacet = {
  label: "收纳箱",
  keywords: ["收纳箱", "储物箱", "整理箱", "收纳盒", "叠放收纳箱"],
  aliases: ["收纳", "盒子", "塑料箱"],
}
const mop: SearchFacet = {
  label: "平板拖把",
  keywords: ["拖把", "平板拖把", "拖把套装", "墩布"],
  aliases: ["拖地", "扫地", "清洁", "平板拖", "打扫"],
}
const powerBank: SearchFacet = {
  label: "移动电源",
  keywords: ["移动电源", "充电宝", "双向快充"],
  aliases: ["快充", "电池", "备用电源", "充电"],
}
const laptopStand: SearchFacet = {
  label: "电脑支架",
  keywords: ["电脑支架", "笔记本支架", "铝合金电脑支架"],
  aliases: ["散热架", "增高架", "办公支架", "支架"],
}
const yogaMat: SearchFacet = {
  label: "瑜伽垫",
  keywords: ["瑜伽垫", "健身垫", "运动垫", "体操垫", "训练瑜伽垫"],
  aliases: ["垫子", "瑜伽", "健身", "运动"],
}
const slowFeeder: SearchFacet = {
  label: "慢食碗",
  keywords: ["慢食碗", "宠物碗", "防滑慢食碗"],
  aliases: ["狗碗", "猫碗", "狗盆", "猫盆", "食盆", "喂食", "宠物", "宠物用品"],
}

export const normalizeSearchText = (text: string) =>
  text.normalize("NFKC").toLowerCase().replace(/\s+/g, "")

const categoryGroups: [string[], SearchFacet[]][] = [
  [["衣服", "服装", "穿搭", "服饰"], [sweatshirt, tshirt, trousers, shorts]],
  [["上衣"], [sweatshirt, tshirt]],
  [["裤子", "裤装"], [trousers, shorts]],
  [["厨房", "厨房餐饮", "餐饮"], [travelCup, lunchBox]],
  [["家居", "家居清洁"], [storageBin, mop]],
  [["数码办公"], [powerBank, laptopStand]],
  [["数码", "数码配件"], [powerBank]],
  [["办公", "办公文具"], [laptopStand]],
  [["运动户外", "户外"], [yogaMat]],
]

const facets = [sweatshirt, tshirt, trousers, shorts, travelCup, lunchBox, storageBin, mop, powerBank, laptopStand, yogaMat, slowFeeder]
const facetRules: [string[], SearchFacet[]][] = facets.map((facet) => [
  [...facet.keywords, ...facet.aliases],
  [facet],
])

export const SYNONYM_MAP = new Map<string, SearchFacet[]>(
  [...facetRules, ...categoryGroups].flatMap(([terms, matches]) =>
    terms.map((term): [string, SearchFacet[]] => [normalizeSearchText(term), matches])
  )
)

const termsByLength = Array.from(SYNONYM_MAP.keys()).sort((a, b) => b.length - a.length)

function findMatchingFacets(query: string): SearchFacet[] {
  const normalized = normalizeSearchText(query)
  const exact = SYNONYM_MAP.get(normalized)
  if (exact) return exact

  const matches = new Set<SearchFacet>()
  const occupied: { start: number; end: number }[] = []
  for (const term of termsByLength) {
    for (let start = normalized.indexOf(term); start >= 0; start = normalized.indexOf(term, start + term.length)) {
      const end = start + term.length
      if (occupied.some((range) => start < range.end && end > range.start)) continue
      occupied.push({ start, end })
      SYNONYM_MAP.get(term)?.forEach((facet) => matches.add(facet))
    }
  }

  return Array.from(matches)
}

export function expandSearchKeywords(query: string): string[] {
  const original = query.trim()
  if (!original) return []
  const keywords = [original, ...findMatchingFacets(original).flatMap((facet) => facet.keywords)]
  const seen = new Set<string>()
  return keywords.filter((keyword) => {
    const normalized = normalizeSearchText(keyword)
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

export function getRelatedSearches(query: string) {
  const normalized = normalizeSearchText(query)
  return findMatchingFacets(query)
    .map(({ label, keywords: [keyword] }) => ({ label, keyword }))
    .filter(({ keyword }) => normalizeSearchText(keyword) !== normalized)
}
