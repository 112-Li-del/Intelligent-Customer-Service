export type Feedback = { vote: "up" | "down"; reason?: string }
export interface FeedbackStore {
  read(key: string, id: number): Feedback | undefined
  save(key: string, id: number, feedback?: Feedback): void
  clear(key: string): void
}

function entries(key: string): Record<string, Feedback> {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "{}") ?? {}
  } catch {
    return {}
  }
}

// TODO: Replace this tab-local store when the storefront exposes a feedback endpoint.
export const feedbackStore: FeedbackStore = {
  read: (key, id) => entries(key)[id],
  save(key, id, feedback) {
    const values = entries(key)
    if (feedback) values[id] = feedback
    else delete values[id]
    try {
      sessionStorage.setItem(key, JSON.stringify(values))
    } catch {
      /* Storage can be disabled. */
    }
  },
  clear(key) {
    try {
      sessionStorage.removeItem(key)
    } catch {
      /* Storage can be disabled. */
    }
  },
}
