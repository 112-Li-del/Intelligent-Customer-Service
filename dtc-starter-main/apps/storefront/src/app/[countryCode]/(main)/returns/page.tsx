import { Metadata } from "next"

import { getStorePolicies } from "@lib/data/store-policies"
import { PoliciesUnavailable, PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "退货政策",
  description: "查看退货和退款说明。",
}

export default async function ReturnsPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const { current } = await getStorePolicies(countryCode)

  return (
    <PolicyPage title="退货政策">
      {current ? (
        <>
          <p>
            收货后 {current.returnWindowDays} 天内可以申请退货，退货商品需寄回。
          </p>
          <p>
            {current.freeReturns
              ? "退货免运费。"
              : "退货运费由买家承担。"}
          </p>
        </>
      ) : (
        <PoliciesUnavailable />
      )}
    </PolicyPage>
  )
}
