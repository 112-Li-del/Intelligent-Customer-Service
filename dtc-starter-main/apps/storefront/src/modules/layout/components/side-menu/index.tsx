"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { BarsThree, ChevronRight, Sparkles, XMark } from "@medusajs/icons"
import { openAiChat } from "@lib/util/ai-chat-events"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Fragment } from "react"

const sideMenuItems = [
  {
    name: "商城首页",
    href: "/",
    testId: "home-link",
    description: "返回来财商城首页",
  },
  {
    name: "全部商品",
    href: "/store",
    testId: "store-link",
    description: "按分类、价格与规格筛选",
  },
  {
    name: "我的账户",
    href: "/account",
    testId: "account-link",
    description: "管理订单与个人信息",
  },
  {
    name: "购物车",
    href: "/cart",
    testId: "cart-link",
    description: "查看已选商品并结算",
  },
]

const SideMenu = () => {
  return (
    <Popover className="relative flex h-full shrink-0">
      {({ open, close }) => (
        <>
          <Popover.Button
            data-testid="nav-menu-button"
            className="flex h-full shrink-0 items-center gap-2 rounded-sm px-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <BarsThree className="h-5 w-5" />
            <span>快捷导航</span>
          </Popover.Button>

          <Transition show={open} as={Fragment}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div
                className="fixed inset-0 z-[60] bg-brand-navy/60 backdrop-blur-sm"
                onClick={close}
                data-testid="side-menu-backdrop"
                aria-hidden="true"
              />
            </Transition.Child>

            <Transition.Child
              as={Fragment}
              enter="transition-transform duration-300 ease-out"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition-transform duration-200 ease-in"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <PopoverPanel className="fixed inset-y-0 left-0 z-[70] flex w-[min(88vw,380px)] flex-col bg-white text-brand-ink shadow-2xl">
                <div className="flex items-center justify-between bg-brand-navy px-6 py-5 text-white">
                  <div>
                    <p className="text-lg font-semibold">来财商城</p>
                    <p className="mt-1 text-xs text-gray-300">
                      发现适合你的每一件好物
                    </p>
                  </div>
                  <button
                    data-testid="close-menu-button"
                    onClick={close}
                    aria-label="关闭菜单"
                    className="rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white"
                  >
                    <XMark className="h-5 w-5" />
                  </button>
                </div>

                <div
                  className="flex-1 overflow-y-auto px-4 py-6"
                  data-testid="nav-menu-popup"
                >
                  <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    快捷导航
                  </p>
                  <ul className="mt-3 flex flex-col gap-1">
                    {sideMenuItems.map(
                      ({ name, href, testId, description }) => (
                        <li key={name}>
                          <LocalizedClientLink
                            href={href}
                            className="group flex items-center justify-between rounded-lg px-3 py-3 hover:bg-gray-100"
                            onClick={close}
                            data-testid={testId}
                          >
                            <span>
                              <span className="block text-sm font-semibold text-brand-ink">
                                {name}
                              </span>
                              <span className="mt-0.5 block text-xs text-gray-500">
                                {description}
                              </span>
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                          </LocalizedClientLink>
                        </li>
                      )
                    )}
                  </ul>

                  <button
                    type="button"
                    className="mt-5 flex w-full items-center gap-3 rounded-xl bg-brand-navy p-4 text-left text-white hover:bg-brand-navy-light"
                    onClick={() => {
                      close()
                      openAiChat({ query: "你好，请帮我挑选一件合适的商品。" })
                    }}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-brand-navy">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        来财 AI 智能导购
                      </span>
                      <span className="mt-1 block text-xs text-gray-300">
                        说出需求，获取选品建议
                      </span>
                    </span>
                  </button>
                </div>

                <div className="border-t border-gray-200 px-7 py-5 text-xs text-gray-500">
                  <p>配送至：中国大陆</p>
                  <p className="mt-1">© {new Date().getFullYear()} 来财商城</p>
                </div>
              </PopoverPanel>
            </Transition.Child>
          </Transition>
        </>
      )}
    </Popover>
  )
}

export default SideMenu
