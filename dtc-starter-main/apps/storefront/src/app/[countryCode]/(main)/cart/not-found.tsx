import { Metadata } from "next"

import InteractiveLink from "@modules/common/components/interactive-link"

export const metadata: Metadata = {
  title: "404",
  description: "出了点问题",
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">页面不存在</h1>
      <p className="text-small-regular text-ui-fg-base">
        购物车不存在，请清除本站缓存后重试。
      </p>
      <InteractiveLink href="/">返回首页</InteractiveLink>
    </div>
  )
}
