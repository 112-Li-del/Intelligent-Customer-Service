import { ChatBubbleLeftRight } from "@medusajs/icons"
import { copy } from "./chat-copy"
import { clx } from "@modules/common/components/ui"
import { openAiChat } from "@lib/util/ai-chat-events"

export default function LauncherButton({
  isOpen,
  unread,
  isProductPage,
}: {
  unread: boolean
  isOpen: boolean
  isProductPage: boolean
}) {
  return (
    <button
      id="ai-chat-launcher"
      type="button"
      aria-label={
        isOpen ? copy.close : copy.open + (unread ? " · " + copy.unread : "")
      }
      aria-expanded={isOpen}
      aria-controls={isOpen ? "ai-chat-panel" : undefined}
      onClick={() => openAiChat()}
      className={clx(
        "chat-launcher fixed right-4 z-[70] flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-navy to-brand-navy-light text-white shadow-chat motion-safe:transition-transform motion-safe:active:scale-95 motion-safe:hover:-translate-y-0.5 small:right-6 small:h-12 small:w-auto small:rounded-full small:px-5",
        isProductPage ? "bottom-28 small:bottom-6" : "bottom-5 small:bottom-6"
      )}
    >
      <span
        className={clx(
          "relative flex items-center justify-center motion-safe:transition-transform",
          isOpen && "scale-90"
        )}
      >
        <ChatBubbleLeftRight className="h-6 w-6" />
        {unread && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-brand-orange"
          >
            <span className="absolute inset-0 rounded-full bg-brand-orange/60 motion-safe:animate-ping" />
          </span>
        )}
      </span>
      <span className="hidden text-sm font-semibold small:inline">
        {copy.launcher}
      </span>
    </button>
  )
}
