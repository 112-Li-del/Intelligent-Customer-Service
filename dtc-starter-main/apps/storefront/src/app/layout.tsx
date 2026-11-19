import { STORE_NAME } from "@lib/util/brand"
import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import NavigationScroll from "@modules/layout/components/navigation-scroll"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  applicationName: STORE_NAME,
  title: { default: STORE_NAME, template: `%s | ${STORE_NAME}` },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-mode="light">
      <head>
        <link rel="ucp" href="/.well-known/ucp" />
      </head>
      <body>
        <NavigationScroll />
        <main id="top" tabIndex={-1} className="relative focus:outline-none">
          {props.children}
        </main>
      </body>
    </html>
  )
}
