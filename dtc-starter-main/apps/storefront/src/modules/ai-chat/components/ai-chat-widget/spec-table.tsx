import { Children, isValidElement, useState, type ReactNode } from "react"
import type { Element } from "hast"
import { nodeText } from "./chat-markdown"

function cells(children: ReactNode) {
  return Children.toArray(children).filter((child) =>
    isValidElement<{ children: ReactNode }>(child)
  )
}

export default function SpecTable({
  node,
  children,
}: {
  node?: Element
  children?: ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const [head, body] = cells(children)
  const headers = cells(cells(head?.props.children)[0]?.props.children)
  const rows = cells(body?.props.children)
  const compact = headers.length === 2
  const headerNode = node?.children.find(
    (n) => n.type === "element" && n.tagName === "thead"
  )
  const tr =
    headerNode?.type === "element" &&
    headerNode.children.find((n) => n.type === "element" && n.tagName === "tr")
  const best =
    tr && tr.type === "element"
      ? tr.children
          .filter((n) => n.type === "element")
          .findIndex((n) =>
            /(?:\b(?:best|selected)\b|最佳|已选|首选)/i.test(nodeText(n))
          )
      : -1

  return (
    <div className="relative my-3 min-w-0 overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div
        tabIndex={0}
        role="region"
        aria-label={compact ? "商品规格" : "规格对比"}
        className="overflow-x-auto"
      >
        <table className="w-full border-separate border-spacing-0 text-left text-xs leading-5">
          <thead>
            <tr>
              {headers.map((cell, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`whitespace-nowrap bg-white px-2 py-2 ${
                    i === 0 ? "sticky left-0 z-10" : ""
                  }`}
                >
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 ${
                      i === best
                        ? "bg-brand-orange text-brand-navy"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {cell.props.children}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(compact && !expanded ? rows.slice(0, 4) : rows).map((row, r) => (
              <tr key={r}>
                {cells(row.props.children).map((cell, c) => {
                  const Tag = c ? "td" : "th"
                  return (
                    <Tag
                      key={c}
                      scope={c ? undefined : "row"}
                      className={`border-t border-stone-100 px-3 py-2 align-top ${
                        c === 0 ? "sticky left-0 font-medium" : ""
                      } ${compact ? "break-words" : "min-w-[6.5rem]"} ${
                        c === best
                          ? "bg-amber-50"
                          : r % 2
                          ? "bg-stone-50"
                          : "bg-white"
                      }`}
                    >
                      {cell.props.children}
                    </Tag>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!compact && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-stone-200/70"
        />
      )}
      {compact && rows.length > 4 && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="w-full border-t border-stone-200 py-2 text-xs font-semibold text-amber-900"
        >
          {expanded ? "收起规格" : "查看全部规格"} · {rows.length}
        </button>
      )}
    </div>
  )
}
