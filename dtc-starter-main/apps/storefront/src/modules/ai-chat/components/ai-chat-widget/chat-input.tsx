import { ArrowRight, Trash, Tag } from "@medusajs/icons"
import { useLayoutEffect, useRef, useState } from "react"
import type { AiChatProduct } from "@lib/util/ai-chat-events"
import { copy } from "./chat-copy"

export default function ChatInput({
  input,
  setInput,
  isLoading,
  onSend,
  onClear,
  pageProduct,
  attached,
  onAttach,
}: {
  input: string
  setInput: (s: string) => void
  isLoading: boolean
  onSend: () => void
  onClear: () => void
  pageProduct?: AiChatProduct
  attached?: AiChatProduct
  onAttach: (p?: AiChatProduct) => void
}) {
  const field = useRef<HTMLTextAreaElement>(null)
  const [confirm, setConfirm] = useState(false)
  useLayoutEffect(() => {
    const el = field.current
    if (el) {
      el.style.height = "auto"
      el.style.height = el.scrollHeight + "px"
    }
  }, [input])
  function send() {
    if (input.trim() && !isLoading) {
      setConfirm(false)
      onSend()
    }
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        send()
      }}
      className="chat-composer shrink-0 border-t border-stone-200 bg-white/95 p-3"
    >
      {confirm && (
        <div
          className="mb-2 flex flex-wrap items-center gap-2 text-xs"
          role="group"
          aria-label={copy.clear}
        >
          {copy.confirm}
          <button
            className="chat-action"
            type="button"
            onClick={() => {
              onClear()
              setConfirm(false)
              field.current?.focus()
            }}
          >
            {copy.clear}
          </button>
          <button
            className="chat-action"
            type="button"
            onClick={() => setConfirm(false)}
          >
            {copy.cancel}
          </button>
        </div>
      )}
      {attached && (
        <button
          type="button"
          className="mb-2 max-w-full truncate rounded-full bg-brand-orange/25 px-3 py-1 text-xs"
          aria-label={copy.detach + " · " + attached.name}
          onClick={() => onAttach(undefined)}
        >
          {attached.name} {attached.price} ×
        </button>
      )}
      <div className="flex items-end gap-1 rounded-xl border border-stone-300 p-1 focus-within:border-brand-amber">
        <button
          type="button"
          title={copy.clear}
          aria-label={copy.clear}
          aria-expanded={confirm}
          className="chat-action"
          onClick={() => setConfirm(!confirm)}
        >
          <Trash />
        </button>
        {pageProduct && (
          <button
            type="button"
            title={copy.attach}
            aria-label={copy.attach}
            aria-pressed={!!attached}
            className="chat-action"
            onClick={() => {
              onAttach(pageProduct)
              field.current?.focus()
            }}
          >
            <Tag />
          </button>
        )}
        <textarea
          id="ai-chat-input"
          ref={field}
          aria-label={copy.input}
          rows={1}
          maxLength={500}
          value={input}
          placeholder={copy.placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing &&
              e.nativeEvent.keyCode !== 229
            ) {
              e.preventDefault()
              send()
            }
          }}
          className="max-h-28 min-h-9 min-w-0 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-base leading-5 placeholder:text-stone-500 focus:ring-0"
        />
        <button
          type="submit"
          aria-label={copy.send}
          disabled={!input.trim() || isLoading}
          className="grid h-9 w-9 place-items-center rounded-full bg-brand-yellow text-brand-navy disabled:bg-stone-200 disabled:text-stone-600"
        >
          <ArrowRight />
        </button>
      </div>
      <p className="mt-1 text-[11px] text-stone-600">{copy.notice}</p>
    </form>
  )
}
