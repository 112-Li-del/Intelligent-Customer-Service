import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"

export const metadata: Metadata = {
  title: "登录",
  description: "登录知选商城。",
}

export default function Login() {
  return <LoginTemplate />
}
