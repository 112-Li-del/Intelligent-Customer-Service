import { Suspense } from "react"

import AiChatTrigger from "@modules/ai-chat/components/ai-chat-trigger"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import StoreSearch from "@modules/layout/components/search/store-search"
import SideMenu from "@modules/layout/components/side-menu"
import { MapPin, ShoppingCart, Sparkles, User } from "@medusajs/icons"

const channelLinks = [
  { label: "商城首页", href: "/" },
  { label: "全部商品", href: "/store" },
  { label: "精选好物", href: "/#popular-products" },
  { label: "今日特惠", href: "/store" },
  { label: "新品首发", href: "/#new-products" },
  { label: "服饰鞋包", href: "/search?q=服饰" },
]

const BrandLogo = () => (
  <LocalizedClientLink
    href="/"
    className="group relative flex shrink-0 items-end gap-2 rounded-sm pb-1 text-white"
    data-testid="nav-store-link"
    aria-label="知选商城首页"
  >
    <span className="text-2xl font-bold tracking-tight">知选</span>
    <span className="mb-1 hidden text-xs font-medium tracking-[0.2em] text-gray-300 xsmall:inline">
      ZHIXUAN
    </span>
    <svg
      viewBox="0 0 72 12"
      className="absolute -bottom-1 left-0 h-3 w-[4.5rem] text-brand-orange"
      aria-hidden="true"
    >
      <path
        d="M2 2C20 13 50 13 69 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M62 1L70 2L67 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </LocalizedClientLink>
)

export default function Nav() {
  return (
    <div id="top" className="sticky inset-x-0 top-0 z-50 shadow-md">
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
