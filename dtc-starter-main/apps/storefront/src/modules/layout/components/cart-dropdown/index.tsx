"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { ShoppingCart } from "@medusajs/icons"
import { retrieveCart } from "@lib/data/cart"
import { CART_UPDATED_EVENT } from "@lib/util/cart-events"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

const countItems = (cart?: HttpTypes.StoreCart | null) =>
  cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

const CartDropdown = ({
  cart: serverCart,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  // Statically rendered pages can't read the cart cookie, so the cart is loaded in the browser.
  const [clientCart, setClientCart] = useState<HttpTypes.StoreCart | null>(null)
  const pathname = usePathname()
  const cartState = serverCart ?? clientCart
  const activeTimer = useRef<number | undefined>(undefined)
  const [dropdown, setDropdown] = useState({ open: false, items: countItems(serverCart), pathname, autoClose: false })
  const cartDropdownOpen = dropdown.open && !pathname.includes("/cart") && !pathname.includes("/checkout")

  const open = () => setDropdown({ open: true, items: totalItems, pathname, autoClose: false })
  const close = () => {
    window.clearTimeout(activeTimer.current)
    setDropdown((current) => ({ ...current, open: false }))
  }

  const totalItems = countItems(cartState)

  const subtotal = cartState?.subtotal ?? 0

  useEffect(() => {
    if (serverCart) {
      return
    }

    let isInitialLoad = true
    let disposed = false
    const load = () =>
      retrieveCart()
        .then((cart) => {
          if (disposed) return
          if (isInitialLoad) {
            // Don't auto-open the dropdown for items that were already in the cart.
            setDropdown((current) => ({ ...current, items: countItems(cart) }))
            isInitialLoad = false
          }
          setClientCart(cart)
        })
        .catch(() => {})

    load()
    window.addEventListener(CART_UPDATED_EVENT, load)
    return () => {
      disposed = true
      window.removeEventListener(CART_UPDATED_EVENT, load)
    }
  }, [serverCart])

  const openAndCancel = () => {
    window.clearTimeout(activeTimer.current)
    open()
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      window.clearTimeout(activeTimer.current)
    }
  }, [])

  if (dropdown.items !== totalItems || dropdown.pathname !== pathname) {
    const itemsChanged = dropdown.items !== totalItems
    setDropdown({
      items: totalItems, pathname,
      open: itemsChanged && !pathname.includes("/cart") && !pathname.includes("/checkout"),
      autoClose: itemsChanged,
    })
  }

  useEffect(() => {
    if (!dropdown.open || !dropdown.autoClose) return
    activeTimer.current = window.setTimeout(() => {
      setDropdown((current) => ({ ...current, open: false }))
    }, 5000)
    return () => window.clearTimeout(activeTimer.current)
  }, [dropdown])

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <LocalizedClientLink
          className="relative flex h-full items-center gap-2 rounded-sm text-sm font-semibold text-white hover:text-brand-orange"
          href="/cart"
          onClick={open}
          data-testid="nav-cart-link"
        >
          <span className="relative">
            <ShoppingCart className="h-7 w-7" />
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-action px-1 text-xs font-bold text-brand-navy">
              {totalItems}
            </span>
          </span>
          <span className="hidden xsmall:inline">购物车</span>
        </LocalizedClientLink>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="absolute right-0 top-[calc(100%+12px)] hidden w-[420px] overflow-hidden rounded-lg border-x border-b border-gray-200 bg-white text-ui-fg-base shadow-card-hover small:block"
            data-testid="nav-cart-dropdown"
          >
            <div className="p-4 flex items-center justify-center">
              <h3 className="text-large-semi">购物车</h3>
            </div>
            {cartState && cartState.items?.length ? (
              <>
                <div className="overflow-y-scroll max-h-[402px] px-4 grid grid-cols-1 gap-y-8 no-scrollbar p-px">
                  {cartState.items
                    .sort((a, b) => {
                      return (a.created_at ?? "") > (b.created_at ?? "")
                        ? -1
                        : 1
                    })
                    .map((item) => (
                      <div
                        className="grid grid-cols-[122px_1fr] gap-x-4"
                        key={item.id}
                        data-testid="cart-item"
                      >
                        <LocalizedClientLink
                          href={`/products/${item.product_handle}`}
                          className="w-24"
                        >
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.product?.images}
                            size="square"
                          />
                        </LocalizedClientLink>
                        <div className="flex flex-col justify-between flex-1">
                          <div className="flex flex-col flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex flex-col overflow-ellipsis whitespace-nowrap mr-4 w-[180px]">
                                <h3 className="text-base-regular overflow-hidden text-ellipsis">
                                  <LocalizedClientLink
                                    href={`/products/${item.product_handle}`}
                                    data-testid="product-link"
                                  >
                                    {item.title}
                                  </LocalizedClientLink>
                                </h3>
                                <LineItemOptions
                                  variant={item.variant}
                                  data-testid="cart-item-variant"
                                  data-value={item.variant}
                                />
                                <span
                                  data-testid="cart-item-quantity"
                                  data-value={item.quantity}
                                >
                                  数量： {item.quantity}
                                </span>
                              </div>
                              <div className="flex justify-end">
                                <LineItemPrice
                                  item={item}
                                  style="tight"
                                  currencyCode={cartState.currency_code}
                                />
                              </div>
                            </div>
                          </div>
                          <DeleteButton
                            id={item.id}
                            className="mt-1"
                            data-testid="cart-item-remove-button"
                          >
                            删除
                          </DeleteButton>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="p-4 flex flex-col gap-y-4 text-small-regular">
                  <div className="flex items-center justify-between">
                    <span className="text-ui-fg-base font-semibold">
                      小计 <span className="font-normal">（不含税）</span>
                    </span>
                    <span
                      className="text-large-semi"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: cartState.currency_code,
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/cart" passHref>
                    <Button
                      className="w-full"
                      size="large"
                      data-testid="go-to-cart-button"
                    >
                      查看购物车
                    </Button>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div>
                <div className="flex py-16 flex-col gap-y-4 items-center justify-center">
                  <div className="bg-gray-900 text-small-regular flex items-center justify-center w-6 h-6 rounded-full text-white">
                    <span>0</span>
                  </div>
                  <span>购物车为空。</span>
                  <div>
                    <LocalizedClientLink href="/store">
                      <>
                        <span className="sr-only">前往全部商品</span>
                        <Button onClick={close}>浏览商品</Button>
                      </>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
