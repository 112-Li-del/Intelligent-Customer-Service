"use client"

import { Table, Text, clx } from "@modules/common/components/ui"
import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { notifyCartUpdated } from "@lib/util/cart-events"
import { Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import CartQuantityStepper from "@modules/cart/components/cart-quantity-stepper"
import ErrorMessage from "@modules/checkout/components/error-message"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { useRef, useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
  maxQuantity?: number
}

const Item = ({ item, type = "full", currencyCode, maxQuantity = 10 }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mutationInProgress = useRef(false)

  const mutateItem = async (action: () => Promise<void>) => {
    if (mutationInProgress.current) return
    mutationInProgress.current = true
    setError(null)
    setUpdating(true)

    try {
      await action()
      notifyCartUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "暂时无法更新购物车，请重试。")
    } finally {
      mutationInProgress.current = false
      setUpdating(false)
    }
  }

  const changeQuantity = (quantity: number) =>
    mutateItem(() => updateLineItem({ lineId: item.id, quantity }))

  return (
    <Table.Row
      className={clx("w-full", {
        "grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-4 small:table-row small:py-0": type === "full",
      })}
      data-testid="product-row"
    >
      <Table.Cell className="row-span-2 w-auto !pl-0 !pr-0 !py-0 small:w-24 small:!pr-4 small:!py-4">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "w-16 small:w-20": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="col-span-2 min-w-0 !p-0 text-left small:!p-4">
        <Text
          className="txt-medium-plus text-ui-fg-base"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      {type === "full" && (
        <Table.Cell className="col-start-2 !p-0 small:!p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <CartQuantityStepper
              quantity={item.quantity}
              maxQuantity={maxQuantity}
              updating={updating}
              onDecrease={() => void changeQuantity(item.quantity - 1)}
              onIncrease={() => void changeQuantity(item.quantity + 1)}
            />
            <button
              type="button"
              aria-label={`移除${item.product_title || "商品"}`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-600 outline-none enabled:hover:bg-gray-100 enabled:hover:text-brand-ink focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#A65300] disabled:opacity-40"
              data-testid="product-delete-button"
              disabled={updating}
              onClick={() => void mutateItem(() => deleteLineItem(item.id))}
            >
              <Trash aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <div role="status">
            <ErrorMessage error={error} data-testid="product-error-message" />
          </div>
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </Table.Cell>
      )}

      <Table.Cell className="!p-0 text-right small:!py-4">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 ">
              <Text className="text-ui-fg-muted">{item.quantity}x </Text>
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </span>
          )}
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
