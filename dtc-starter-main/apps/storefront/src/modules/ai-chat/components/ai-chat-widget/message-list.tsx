import type { AiMessage } from "../../types"
import { clx } from "@modules/common/components/ui"
import type { RefObject } from "react"
import SuggestionPills from "./suggestion-pills"
import { copy } from "./chat-copy"
import AssistantMessage from "./assistant-message"

export default function MessageList({
  messages,
  storageKey,
  prompts,
  onSelect,
  isLoading,
  messageListRef,
}: {
  storageKey: string
  prompts: string[]
  onSelect: (text: string) => void
  messages: AiMessage[]
  isLoading: boolean
  messageListRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      ref={messageListRef}
      className="min-h-0 flex-1 overflow-y-auto bg-[#FAF8F3] bg-[radial-gradient(#dfd8cc_0.8px,transparent_0.8px)] bg-[size:12px_12px] px-4 py-5"
      role="log"
      aria-label={copy.messages}
      aria-relevant="additions"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={clx(
              "motion-safe:animate-slide-up min-w-0 whitespace-pre-line break-words rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
              message.products?.length ? "w-full" : "max-w-[86%]",
              message.role === "assistant"
                ? "self-start rounded-tl-sm border border-gray-100 bg-white text-brand-ink"
                : "self-end rounded-tr-sm bg-gradient-to-br from-brand-navy to-brand-navy-light text-white"
            )}
          >
            {message.role === "assistant" ? (
              <>
                <AssistantMessage storageKey={storageKey} message={message} />
                {message === messages[messages.length - 1] &&
                  prompts.length > 0 && (
                    <SuggestionPills
                      quickPrompts={prompts}
                      onSelect={onSelect}
                    />
                  )}
              </>
            ) : (
              message.content
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex max-w-[86%] items-center gap-1.5 self-start rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <span className="sr-only">{copy.typing}</span>
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="h-2 w-2 motion-safe:animate-bounce rounded-full bg-gray-400"
                style={{ animationDelay: `${dot * 120}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
