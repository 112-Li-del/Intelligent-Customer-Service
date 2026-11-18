import { Metadata } from "next"

import { getStorePolicies } from "@lib/data/store-policies"
import {
  PoliciesUnavailable,
  PolicyPage,
  ShippingSummary,
} from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "配送说明",
  description: "查看配送费用和预计时效。",
}

export default async function ShippingPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const { current, currencyCode } = await getStorePolicies(countryCode)

  return (
    <PolicyPage title="配送说明">
      {current ? (
        <>
          <p>
            中国大陆地区的模拟配送费用和时效如下。
          </p>
          <ShippingSummary policies={current} currencyCode={currencyCode} />
          <p className="text-ui-fg-subtle">
            可选配送方式和最终费用以结算页为准。
          </p>
        </>
      ) : (
        <PoliciesUnavailable />
      )}
    </PolicyPage>
  )
}
