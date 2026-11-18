"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@modules/common/components/ui"
import { confirmEmailVerification } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type VerificationState = "verifying" | "success" | "error"

const VerifyAccount = () => {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [state, setState] = useState<VerificationState>("verifying")
  // Guard against the effect running twice in React Strict Mode, which would
  // consume the single-use token before the customer sees the result.
  const confirmed = useRef(false)

  useEffect(() => {
    if (confirmed.current) {
      return
    }
    confirmed.current = true

    if (!token) {
      setState("error")
      return
    }

    confirmEmailVerification(token).then(({ success }) =>
      setState(success ? "success" : "error")
    )
  }, [token])

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center text-center gap-y-4"
      data-testid="verify-account-page"
    >
      <h1 className="text-large-semi uppercase">邮箱验证</h1>

      {state === "verifying" && (
        <p className="text-base-regular text-ui-fg-base">
          正在验证邮箱…
        </p>
      )}

      {state === "success" && (
        <>
          <p className="text-base-regular text-ui-fg-base">
            邮箱验证成功，可以登录了。
          </p>
          <LocalizedClientLink href="/account">
            <Button variant="primary">前往登录</Button>
          </LocalizedClientLink>
        </>
      )}

      {state === "error" && (
        <>
          <p className="text-base-regular text-ui-fg-base">
            验证链接无效或已过期。请登录后获取新的链接。
          </p>
          <LocalizedClientLink href="/account">
            <Button variant="secondary">前往登录</Button>
          </LocalizedClientLink>
        </>
      )}
    </div>
  )
}

export default VerifyAccount
