import { Heading } from "@modules/common/components/ui"
import { cookies as nextCookies } from "next/headers"

import AiChatTrigger from "@modules/ai-chat/components/ai-chat-trigger"
import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"
import productRelations from "../../../../../../knowledge-base/product-relations.json"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"
  const purchased = new Map<string, string>()
  for (const { product } of order.items ?? []) {
    if (product?.handle) purchased.set(product.handle, product.title)
  }
  const purchasedHandles = Array.from(purchased.keys()).slice(0, 30)
  const suggested = Array.from(purchased).filter(([handle]) =>
    productRelations.some(({ from, to }) => from === handle && !purchased.has(to))
  )

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <div
          className="flex flex-col gap-4 max-w-4xl h-full bg-white w-full py-10"
          data-testid="order-complete-container"
        >
          <Heading
            level="h1"
            className="flex flex-col gap-y-3 text-ui-fg-base text-3xl mb-4"
          >
            <span>感谢选购</span>
            <span>订单已提交。</span>
          </Heading>
          <OrderDetails order={order} />
          {suggested.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggested.map(([handle, name]) => (
                <AiChatTrigger
                  key={handle}
                  product={{ handle, name, purchasedHandles }}
                  query="这件还能搭配什么？"
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm text-brand-ink hover:border-brand-orange"
                >
                  {name}的搭配建议
                </AiChatTrigger>
              ))}
            </div>
          )}
          <Heading level="h2" className="flex flex-row text-3xl-regular">
            费用明细
          </Heading>
          <Items order={order} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}
