import type { StripeError } from "@stripe/stripe-js"

const GENERIC_PAYMENT_ERROR =
  "付款失败，请重试或选择其他支付方式。"

// Only card and validation errors are meant for customers, others describe our setup, so they're logged instead.
export const getPaymentErrorMessage = (error?: Partial<StripeError> | null) => {
  if (!error) {
    return null
  }

  if (
    (error.type === "card_error" || error.type === "validation_error") &&
    error.message
  ) {
    return error.message
  }

  console.error("支付失败", error)
  return GENERIC_PAYMENT_ERROR
}
