import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
import { PlaceholderNotice, PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "隐私政策",
  description: `了解${STORE_NAME}如何使用结算和账户信息。`,
}

export default function PrivacyPage() {
  return (
    <PolicyPage title="隐私政策">
      <PlaceholderNotice />
      <p>结算时填写的姓名、邮箱、手机号和收货地址用于创建演示订单。请使用测试信息。</p>
      <p>网站使用浏览器 Cookie 保存购物车和登录会话。模拟支付无需填写银行卡信息。</p>
    </PolicyPage>
  )
}
