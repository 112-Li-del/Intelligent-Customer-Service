import { adaptChatResponse } from "./response-adapter"
import type { AiMessage } from "./types"

type Turn = Pick<AiMessage, "role" | "content">
export type ModelHistory = { handle?: string | null; turns: Turn[] }

export function conversationScope(country: string, customerId?: string) {
  return JSON.stringify([country, customerId ?? null])
}

const prefix = (scope: string) => `laicai.chat.history.v1.${scope}:`

function keys(scope: string) {
  return Object.keys(localStorage).filter((key) =>
    key.startsWith(prefix(scope))
  )
}

function message(
  value: unknown,
  role: AiMessage["role"]
): AiMessage | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    !("id" in value) ||
    typeof value.id !== "number" ||
    !Number.isSafeInteger(value.id) ||
    !("content" in value) ||
    typeof value.content !== "string" ||
    !value.content
  )
    return
  if (role === "user") return { id: value.id, role, content: value.content }
  const reply = adaptChatResponse(
    { ...value, reply: value.content },
    true,
    () => ""
  )
  const status = "status" in value ? value.status : undefined
  return {
    ...reply,
    id: value.id,
    role,
    status:
      status === "partial" || status === "demo" || status === "error"
        ? status
        : "live",
  }
}

export function extendHistory(
  turns: Turn[],
  user: AiMessage,
  assistant: AiMessage,
  handle?: string | null
): ModelHistory {
  return {
    handle,
    turns: [...turns, user, assistant]
      .slice(-6)
      .map(({ role, content }) => ({ role, content: content.slice(0, 1000) })),
  }
}

export function restoreConversation(scope: string) {
  const messages: AiMessage[] = []
  let history: ModelHistory = { turns: [] }
  try {
    const pairs = keys(scope)
      .flatMap((key) => {
        try {
          const entry = JSON.parse(localStorage.getItem(key) ?? "null")
          const user = message(entry?.user, "user")
          return user
            ? [
                {
                  user,
                  assistant: message(entry.assistant, "assistant"),
                  handle:
                    typeof entry.handle === "string" ? entry.handle : undefined,
                },
              ]
            : []
        } catch {
          return []
        }
      })
      .sort((a, b) => a.user.id - b.user.id)
    for (const { user, assistant, handle } of pairs) {
      messages.push(user)
      if (!assistant) continue
      messages.push(assistant)
      if (assistant.status === "live")
        history = extendHistory(
          history.handle === handle ? history.turns : [],
          user,
          assistant,
          handle
        )
    }
  } catch {
    /* Storage may be unavailable in private browsing. */
  }
  return { messages, history }
}

export function saveTurn(
  scope: string,
  key: string,
  user: AiMessage,
  handle?: string | null,
  assistant?: AiMessage
) {
  try {
    const path = prefix(scope) + key
    // A response finishing after another tab cleared this turn must stay cleared.
    if (assistant && localStorage.getItem(path) === null) return
    localStorage.setItem(path, JSON.stringify({ user, handle, assistant }))
  } catch {
    /* The active conversation still works if storage is full or disabled. */
  }
}

export function clearHistory(scope: string) {
  try {
    keys(scope).forEach((key) => localStorage.removeItem(key))
  } catch {
    /* Storage is disabled. */
  }
}
