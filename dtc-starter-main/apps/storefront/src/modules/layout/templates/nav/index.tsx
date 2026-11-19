import { Suspense } from "react"
import Image from "next/image"

import { BRAND_ICON_PATH, BRAND_NAME, BRAND_WORDMARK, STORE_NAME } from "@lib/util/brand"
import AiChatTrigger from "@modules/ai-chat/components/ai-chat-trigger"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import StoreSearch from "@modules/layout/components/search/store-search"
import SideMenu from "@modules/layout/components/side-menu"
import { MapPin, ShoppingCart, Sparkles, User } from "@medusajs/icons"

const channelLinks = [
  { label: "商城首页", href: "/" },
  { label: "全部商品", href: "/store" },
]

const BrandLogo = () => (
  <LocalizedClientLink
    href="/"
    className="group inline-flex shrink-0 select-none items-center gap-2 rounded-sm text-white small:gap-2.5"
    data-testid="nav-store-link"
    aria-label={`${STORE_NAME}首页`}
  >
    <Image
      src={BRAND_ICON_PATH}
      alt=""
      width={32}
      height={32}
      className="h-8 w-8 shrink-0 transition-transform motion-safe:group-hover:scale-105"
    />
    <span className="relative flex flex-col pb-1.5">
      <span className="text-xl font-extrabold leading-none tracking-wider">{BRAND_NAME}</span>
      <span className="mt-0.5 text-[11px] font-bold uppercase leading-none tracking-[0.2em] text-brand-orange">
        {BRAND_WORDMARK}
      </span>
      <svg viewBox="0 0 52 7" aria-hidden="true" className="absolute bottom-0 left-0 h-1.5 w-full">
        <path d="M2 2.5c12 5 31 5.4 47-1" fill="none" stroke="#FF9900" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </span>
  </LocalizedClientLink>
)

export default function Nav() {
  return (
    <div className="sticky inset-x-0 top-0 z-50 shadow-md">
      <header className="bg-brand-navy text-white">
        <nav
          className="content-container flex min-h-16 items-center gap-4 py-3 small:gap-6"
          aria-label="主导航"
        >
          <BrandLogo />

          <div className="hidden shrink-0 items-end gap-1 rounded-sm text-xs text-gray-300 large:flex">
            <MapPin className="mb-0.5 h-5 w-5 text-white" />
            <span className="leading-tight">
              配送至
              <strong className="block text-sm text-white">中国大陆</strong>
            </span>
          </div>

          <div className="hidden min-w-0 flex-1 small:block">
            <StoreSearch />
          </div>

          <LocalizedClientLink
            className="ml-auto hidden shrink-0 items-center gap-2 rounded-sm text-xs text-gray-300 hover:text-white medium:flex"
            href="/account"
            data-testid="nav-account-link"
          >
            <User className="h-5 w-5 text-white" />
            <span className="leading-tight">
              您好，登录
              <strong className="block text-sm text-white">我的账户</strong>
            </span>
          </LocalizedClientLink>

          <Suspense
            fallback={
              <LocalizedClientLink
                className="relative ml-auto flex shrink-0 items-center gap-2 text-sm font-semibold text-white small:ml-0"
                href="/cart"
                data-testid="nav-cart-link"
              >
                <ShoppingCart className="h-7 w-7" />
                <span className="hidden xsmall:inline">购物车</span>
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-action px-1 text-xs font-bold text-brand-navy">
                  0
                </span>
              </LocalizedClientLink>
            }
          >
            <CartButton />
          </Suspense>
        </nav>
        <div className="content-container pb-3 small:hidden">
          <StoreSearch />
        </div>
      </header>

      <div className="bg-brand-navy-light text-sm text-white">
        <div className="content-container flex h-11 items-center gap-1">
          <SideMenu />
          <nav
            className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
            aria-label="快捷频道"
          >
            {channelLinks.map((link) => (
              <LocalizedClientLink
                key={link.label}
                href={link.href}
                className="shrink-0 rounded-sm px-3 py-2 text-gray-100 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </LocalizedClientLink>
            ))}
          </nav>
          <AiChatTrigger
            className="ml-2 flex shrink-0 items-center gap-1.5 rounded-full border border-brand-orange/50 bg-brand-orange/10 px-3 py-1.5 text-xs font-semibold text-brand-orange hover:bg-brand-orange hover:text-brand-navy"
            aria-label="打开 AI 智能导购"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden xsmall:inline">AI 智能导购</span>
            <span className="xsmall:hidden">AI</span>
          </AiChatTrigger>
        </div>
      </div>
    </div>
  )
}
