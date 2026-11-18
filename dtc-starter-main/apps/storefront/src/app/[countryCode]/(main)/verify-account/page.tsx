import { Metadata } from "next"
import { Suspense } from "react"

import VerifyAccount from "@modules/account/components/verify-account"

export const metadata: Metadata = {
  title: "验证邮箱",
  description: "验证邮箱后即可完成注册。",
}

export default function VerifyAccountPage() {
  return (
    <div className="w-full flex justify-center px-8 py-12">
      <Suspense
        fallback={
          <p className="text-base-regular text-ui-fg-base">
            正在验证邮箱…
          </p>
        }
      >
        <VerifyAccount />
      </Suspense>
    </div>
  )
}
