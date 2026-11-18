import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
import { PlaceholderNotice, PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "服务条款",
  description: `${STORE_NAME}演示服务说明。`,
}

export default function TermsPage() {
  return (
    <PolicyPage title="服务条款">
      <PlaceholderNotice />
      <p>商品价格、库存和配送选项以商品页及结算页显示为准。商城仅用于演示，提交订单后不会产生实际扣款或发货。</p>
      <p>配送和退货页面展示模拟规则。</p>
    </PolicyPage>
  )
}
