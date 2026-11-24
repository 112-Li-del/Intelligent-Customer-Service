type PreviewReview = {
  author: string
  rating: number
  text: string
}

const isReview = (value: unknown): value is PreviewReview => {
  const review = value as Partial<PreviewReview> | null
  return Boolean(
    review &&
      typeof review.author === "string" &&
      typeof review.text === "string" &&
      typeof review.rating === "number" &&
      Number.isInteger(review.rating) &&
      review.rating >= 1 &&
      review.rating <= 5
  )
}

export const getPreviewProductDetails = (metadata?: Record<string, unknown> | null) => {
  const details = metadata?.preview_details as { specs?: unknown; reviews?: unknown } | undefined
  const rawSpecs = details?.specs
  const entries: unknown[] = Array.isArray(rawSpecs)
    ? rawSpecs
    : rawSpecs && typeof rawSpecs === "object" ? Object.entries(rawSpecs) : []
  const specs = entries.filter((entry): entry is [string, string] =>
    Array.isArray(entry) && entry.length === 2 &&
    entry.every((part) => typeof part === "string" && part.trim().length > 0)
  )
  const reviews = Array.isArray(details?.reviews) ? details.reviews.filter(isReview) : []
  return { specs, reviews }
}

export const summarizePreviewReviews = (reviews: PreviewReview[]) => ({
  count: reviews.length,
  rating: reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : null,
})
