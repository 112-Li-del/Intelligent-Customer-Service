import type { Element, ElementContent, Root, RootContent, Text } from "hast"
import type { AiProductLink } from "../../types"
import { stockTone } from "./status-badge"

export const nodeText = (node: RootContent): string =>
  node.type === "text"
    ? node.value
    : node.type === "element"
    ? node.children.map(nodeText).join("")
    : ""

const el = (
  tagName: string,
  children: ElementContent[],
  properties: Element["properties"] = {}
): Element => ({ type: "element", tagName, children, properties })
const txt = (value: string): Text => ({ type: "text", value })
const money = /[$¥￥€£]\s*\d+(?:,\d{3})*(?:\.\d+)?/
const discount = /(?:\d+(?:\.\d+)?%\s+off\b|\d(?:\.\d+)?折)/i
const stock = String.raw`\b(?:out of stock|in stock|low stock|only \d+ left)\b|(?<![\p{L}])(?:暂时缺货|缺货|有货|可下单|库存紧张|仅剩\d+件)(?![\p{L}])`
const spec =
  /\d+(?:\.\d+)?(?:[–~至-]\d+(?:\.\d+)?)?\s*(?:英寸|厘米|毫米|毫升|小时|mAh|Wh|Hz|GB|TB|W|kg|cm|mm)(?![a-z0-9])/i
const escape = (name: string) => name.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&")

function keyValueList(node: Element) {
  if (node.tagName !== "ul" && node.tagName !== "ol" && node.tagName !== "p")
    return
  const items =
    node.tagName === "p"
      ? node.children.length === 1 && node.children[0].type === "text"
        ? node.children[0].value.split("\n").map((line) => [txt(line)])
        : []
      : node.children
          .filter(
            (n): n is Element => n.type === "element" && n.tagName === "li"
          )
          .map((n) => n.children)
  const rows: Element[] = []
  for (const item of items) {
    const first = item[0]
    const match =
      first?.type === "text" &&
      first.value.match(/^\s*([^:：\n]{1,48})[:：]\s*(.*)$/)
    if (!match) return
    rows.push(
      el("tr", [
        el("td", [txt(match[1])]),
        el("td", [txt(match[2]), ...item.slice(1)]),
      ])
    )
  }
  if (rows.length)
    return el("table", [
      el("thead", [
        el(
          "tr",
          ["参数", "规格"].map((s) => el("th", [txt(s)]))
        ),
      ]),
      el("tbody", rows),
    ])
}

// Enrich sanitized syntax-tree text only. Code, raw HTML and URLs are never tokenized.
export function chatMarkdown(products: AiProductLink[]) {
  const paths = new Map<string, Set<string>>()
  for (const { title, href } of products) {
    for (const alias of [
      title.trim(),
      title.replace(/^HUAWEI\s+/i, "").trim(),
    ].filter(Boolean)) {
      const name = alias.toLowerCase()
      const urls = paths.get(name) ?? new Set<string>()
      urls.add(href)
      paths.set(name, urls)
    }
  }
  const names = Array.from(paths.keys())
    .sort((a, b) => b.length - a.length)
    .map(escape)
  const tokens = new RegExp(
    [
      ...(names.length ? [names.join("|")] : []),
      stock,
      money.source,
      discount.source,
      spec.source,
    ].join("|"),
    "giu"
  )
  function decorate(text: string): ElementContent[] {
    const parts: ElementContent[] = []
    let cursor = 0
    for (const match of Array.from(text.matchAll(tokens))) {
      const value = match[0]
      const index = match.index
      const before = text.slice(0, index)
      const after = text.slice(index + value.length)
      if (
        (/[a-z0-9]$/i.test(before) && /^[a-z0-9]/i.test(value)) ||
        (/[a-z0-9]$/i.test(value) && /^[a-z0-9]/i.test(after))
      )
        continue
      const urls = paths.get(value.toLowerCase())
      if (urls && urls.size !== 1) continue
      const tone = stockTone(value)
      if (tone && /\b(?:not|never|no longer)\s+$/i.test(before)) continue
      if (index > cursor) parts.push(txt(text.slice(cursor, index)))
      const body = [txt(value)]
      parts.push(
        urls
          ? el("a", body, { href: Array.from(urls)[0] })
          : tone
          ? el("span", body, { className: ["chat-stock"] })
          : money.test(value) || discount.test(value)
          ? el("span", body, {
              className: [
                "rounded",
                "bg-amber-50",
                "px-1",
                "font-semibold",
                "text-amber-900",
              ],
            })
          : el("strong", body)
      )
      cursor = index + value.length
    }
    if (cursor < text.length) parts.push(txt(text.slice(cursor)))
    return parts
  }
  function walk(parent: Root | Element) {
    let specHeading = false
    parent.children = parent.children.flatMap((child): ElementContent[] => {
      if (child.type === "text") return decorate(child.value)
      if (child.type !== "element") return []
      let node = child
      if (specHeading) node = keyValueList(node) ?? node
      specHeading =
        /^h[1-6]$/.test(node.tagName) &&
        /规格|参数|尺码|specifications?|specs|size chart/i.test(nodeText(node))
      if (["pre", "code"].includes(node.tagName)) return [node]
      if (node.tagName === "a") {
        const href = String(node.properties.href ?? "")
        const urls = paths.get(nodeText(node).trim().toLowerCase())
        if (urls?.size === 1) node.properties.href = Array.from(urls)[0]
        else if (/^\/(?:[a-z]{2}\/)?products\//i.test(href) && !urls?.has(href))
          return node.children
        return [node]
      }
      walk(node)
      return [node]
    })
  }
  return (tree: Root) => walk(tree)
}
