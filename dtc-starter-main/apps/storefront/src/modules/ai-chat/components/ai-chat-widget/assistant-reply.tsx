import Link from "next/link"
import Markdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"
import type { AiProductLink } from "../../types"
import SpecTable from "./spec-table"
import { chatMarkdown } from "./chat-markdown"
import { StatusBadge } from "./status-badge"

const heading =
  "mb-1 mt-3 font-semibold leading-snug text-brand-navy first:mt-0"
const linkClass =
  "font-medium text-[#924000] underline decoration-brand-orange underline-offset-2"
const components: Components = {
  h1: ({ children }) => <h3 className={heading + " text-base"}>{children}</h3>,
  h2: ({ children }) => <h4 className={heading}>{children}</h4>,
  h3: ({ children }) => <h5 className={heading}>{children}</h5>,
  h4: ({ children }) => <h6 className={heading}>{children}</h6>,
  h5: ({ children }) => <h6 className={heading}>{children}</h6>,
  h6: ({ children }) => <h6 className={heading}>{children}</h6>,
  p: ({ children }) => (
    <p className="my-2 whitespace-pre-line first:mt-0 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children, start }) => (
    <ol start={start} className="my-2 list-decimal space-y-1 pl-5">
      {children}
    </ol>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-brand-navy">{children}</strong>
  ),
  code: ({ children }) => (
    <code className="rounded bg-stone-100 px-1 font-mono text-xs">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto whitespace-pre rounded-lg bg-stone-100 p-3">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-brand-orange pl-3 text-stone-600">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-stone-200" />,
  table: SpecTable,
  img: ({ alt }) => <>{alt}</>,
  span: ({ className, children }) =>
    className === "chat-stock" && typeof children === "string" ? (
      <StatusBadge label={children} />
    ) : (
      <span className={className}>{children}</span>
    ),
  a: ({ href, children }) => {
    if (!href || /[\\\u0000-\u001f]/.test(href)) return <>{children}</>
    if (/^https?:\/\//i.test(href) || href.startsWith("//")) {
      return (
        <a
          className={linkClass}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      )
    }
    if (/^[a-z][\w+.-]*:/i.test(href)) return <>{children}</>
    return (
      <Link className={linkClass} href={href}>
        {children}
      </Link>
    )
  },
}

export default function AssistantReply({
  content,
  products = [],
}: {
  content: string
  products?: AiProductLink[]
}) {
  return (
    <div className="min-w-0 whitespace-normal break-words">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, [chatMarkdown, products]]}
        components={components}
      >
        {content}
      </Markdown>
    </div>
  )
}
