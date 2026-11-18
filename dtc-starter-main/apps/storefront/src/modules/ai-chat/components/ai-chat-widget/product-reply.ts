import type { AiChatProduct } from "@lib/util/ai-chat-events"

const topics = [
  { labels: /微波|加热/, query: /微波|加热|盒盖|盖子/ },
  { labels: /尺寸|版型|调节范围/, query: /尺寸|尺码|大小|长宽|多高|直径|厚|宽松|收纳进|放得下/ },
  { labels: /容量/, query: /容量|毫升|毫安|多少升|能装多少|wh/i },
  { labels: /清洗|使用说明/, query: /怎么洗|清洁|清洗|保养|洗碗机|机洗/ },
  { labels: /材质/, query: /材质|材料|什么做/ },
  { labels: /兼容性|承重/, query: /兼容|笔记本|电脑|多少斤|承重|英寸/ },
  { labels: /接口与功率/, query: /快充|充电|接口|功率|USB|多少瓦/i },
  { labels: /适用|季节|使用说明/, query: /适合|场景|使用|怎么用|小狗|小型犬/ },
  { labels: /包装清单/, query: /包装|附带|送什么|配件/ },
]

export function getProductReply(query: string, product: AiChatProduct) {
  const specs = product.specs ?? []
  const matchingTopics = topics.filter((topic) => topic.query.test(query))
  const facts = specs.filter(([label, value]) =>
    query.includes(label) ||
    matchingTopics.some((topic) => topic.labels.test(label)) ||
    (/微波|洗碗机/.test(query) && /微波|洗碗机/.test(value))
  )
  if (facts.length) {
    return `「${product.name}」的商品资料：\n${facts.map(([label, value]) => `${label}：${value}`).join("\n")}`
  }
  if (/介绍|参数|规格|特点|了解/.test(query)) {
    const overview = [product.description, ...specs.map(([label, value]) => `${label}：${value}`)]
      .filter(Boolean)
    if (overview.length) {
      return `「${product.name}」\n${overview.join("\n")}`
    }
  }

  const available = specs.map(([label]) => label).join("、")
  return `「${product.name}」的商品资料暂未提供这个问题的明确答案。${available ? `目前可查询：${available}。` : ""}`
}
