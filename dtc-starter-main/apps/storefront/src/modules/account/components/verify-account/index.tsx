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
  const request = useRef<{ token: string; promise: ReturnType<typeof confirmEmailVerification> } | null>(null)
  const [result, setResult] = useState<{ token: string; status: VerificationState } | null>(null)
  const state: VerificationState = !token ? "error" : result?.token === token ? result.status : "verifying"

  useEffect(() => {
    let disposed = false
    if (!token) return
    if (request.current?.token !== token) {
      request.current = { token, promise: confirmEmailVerification(token) }
    }
    request.current.promise.then(({ success }) => {
      if (!disposed) setResult({ token, status: success ? "success" : "error" })
    }).catch(() => {
      if (!disposed) setResult({ token, status: "error" })
    })
    return () => { disposed = true }
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
