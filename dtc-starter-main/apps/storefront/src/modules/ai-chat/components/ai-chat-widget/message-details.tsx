import { ThumbUp, ThumbDown } from "@medusajs/icons"
import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"
import { copy } from "./chat-copy"
import { feedbackStore, type Feedback } from "./feedback"
import type { AiMessage, AiSource } from "../../types"

export function SourcesPanel({ sources }: { sources?: AiSource[] }) {
  if (!sources?.length) return null
  return (
    <details className="mt-3 border-t border-stone-200 pt-2 text-xs">
      <summary className="cursor-pointer font-medium">
        {copy.sources} · {sources.length}
      </summary>
      <ul className="mt-2 space-y-2">
        {sources.map(({ title, url, snippet }, i) => (
          <li key={i}>
            {url && /^\/(?!\/)/.test(url) && !url.includes("\\") ? (
              <Link className="underline" href={url}>
                {title}
              </Link>
            ) : url && /^https?:\/\//i.test(url) ? (
              <a
                className="underline"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {title}
              </a>
            ) : (
              title
            )}
            {snippet && <p className="text-stone-600">{snippet}</p>}
          </li>
        ))}
      </ul>
    </details>
  )
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    /* Fall back for restricted clipboard contexts. */
  }
  const active = document.activeElement
  const field = document.createElement("textarea")
  field.value = text
  field.className = "fixed left-0 top-0 opacity-0"
  document.body.append(field)
  try {
    field.select()
    if (!document.execCommand("copy")) throw Error("Clipboard unavailable")
  } finally {
    field.remove()
    if (active instanceof HTMLElement) active.focus({ preventScroll: true })
  }
}

export function MessageActions({
  message,
  storageKey,
}: {
  message: AiMessage
  storageKey: string
}) {
  const [feedback, setFeedback] = useState(() =>
    feedbackStore.read(storageKey, message.id)
  )
  const [editing, setEditing] = useState(false)
  const [reason, setReason] = useState(feedback?.reason ?? "")
  const [result, setResult] = useState<"idle" | "copied" | "failed">("idle")
  const reasonId = useId()
  const down = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (result === "idle") return
    const timer = window.setTimeout(() => setResult("idle"), 1800)
    return () => window.clearTimeout(timer)
  }, [result])
  function save(value?: Feedback) {
    feedbackStore.save(storageKey, message.id, value)
    setFeedback(value)
  }
  function vote(value: Feedback["vote"]) {
    const next = feedback?.vote === value ? undefined : { vote: value }
    save(next)
    setReason("")
    setEditing(next?.vote === "down")
  }
  function dismiss() {
    setEditing(false)
    down.current?.focus()
  }
  return (
    <div className="mt-2 text-xs text-stone-700">
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          className="chat-action"
          aria-pressed={feedback?.vote === "up"}
          onClick={() => vote("up")}
        >
          <ThumbUp aria-hidden />
          {copy.helpful}
        </button>
        <button
          ref={down}
          type="button"
          className="chat-action"
          aria-pressed={feedback?.vote === "down"}
          aria-expanded={editing}
          aria-controls={editing ? reasonId : undefined}
          onClick={() => vote("down")}
        >
          <ThumbDown aria-hidden />
          {copy.unhelpful}
        </button>
        <button
          type="button"
          className="chat-action"
          onClick={async () => {
            try {
              await copyText(message.content)
              setResult("copied")
            } catch {
              setResult("failed")
            }
          }}
        >
          {result === "copied" ? copy.copied : copy.copy}
        </button>
      </div>
      <span role="status" className={result === "failed" ? "" : "sr-only"}>
        {result === "failed"
          ? copy.copyFailed
          : result === "copied"
          ? copy.copied
          : ""}
      </span>
      {editing && (
        <form
          id={reasonId}
          className="mt-2 rounded-lg bg-stone-50 p-2"
          onSubmit={(e) => {
            e.preventDefault()
            save({ vote: "down", reason: reason.trim() || undefined })
            dismiss()
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation()
              dismiss()
            }
          }}
        >
          <label>
            {copy.reason}
            <input
              autoFocus
              maxLength={160}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="my-1 w-full rounded border border-stone-300 px-2 py-1"
            />
          </label>
          <button className="chat-action" type="submit">
            {copy.save}
          </button>
          <button className="chat-action" type="button" onClick={dismiss}>
            {copy.cancel}
          </button>
        </form>
      )}
    </div>
  )
}
