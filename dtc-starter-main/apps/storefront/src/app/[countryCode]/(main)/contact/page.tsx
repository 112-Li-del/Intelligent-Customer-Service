import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
import { PlaceholderNotice, PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "联系我们",
  description: `联系${STORE_NAME}客服。`,
}

export default function ContactPage() {
  return (
    <PolicyPage title="联系我们">
      <PlaceholderNotice />
      <p>如有订单、配送或退货问题，可在项目演示时联系商城负责人，并提供订单号。</p>
    </PolicyPage>
  )
}
