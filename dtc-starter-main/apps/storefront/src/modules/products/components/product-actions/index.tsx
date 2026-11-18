"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { openAiChat } from "@lib/util/ai-chat-events"
import { notifyCartUpdated } from "@lib/util/cart-events"
import { isVariantInStock } from "@lib/util/inventory"
import { HttpTypes } from "@medusajs/types"
import {
  ArrowPath,
  ChatBubbleLeftRight,
  ShieldCheck,
  TruckFast,
} from "@medusajs/icons"
import Divider from "@modules/common/components/divider"
import { Button } from "@modules/common/components/ui"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

const getDefaultVariant = (product: HttpTypes.StoreProduct) =>
  product.variants?.find(isVariantInStock) ?? product.variants?.[0]

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [options, setOptions] = useState<Record<string, string | undefined>>(
    () => optionsAsKeymap(getDefaultVariant(product)?.options ?? null) ?? {}
  )
  const [isUrlVariantApplied, setIsUrlVariantApplied] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isBuying, setIsBuying] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const countryCode = useParams().countryCode as string

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((variant) => {
      const variantOptions = optionsAsKeymap(variant.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  const setOptionValue = (optionId: string, value: string) => {
    setOptions((previous) => ({
      ...previous,
      [optionId]: value,
    }))
  }

  const isValidVariant = useMemo(() => {
    return product.variants?.some((variant) => {
      const variantOptions = optionsAsKeymap(variant.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const variantId = new URLSearchParams(window.location.search).get("v_id")
    const variant = product.variants?.find((item) => item.id === variantId)
    if (variant) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOptions(optionsAsKeymap(variant.options) ?? {})
    }
    setIsUrlVariantApplied(true)
  }, [product.variants])

  useEffect(() => {
    if (!isUrlVariantApplied) {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString(), { scroll: false })
  }, [selectedVariant, isValidVariant, isUrlVariantApplied, pathname, router])

  const inStock = useMemo(
    () => isVariantInStock(selectedVariant),
    [selectedVariant]
  )

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  const canSubmit = Boolean(
    inStock &&
      selectedVariant &&
      !disabled &&
      !isAdding &&
      !isBuying &&
      isValidVariant
  )

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)
    setActionError(null)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
      notifyCartUpdated()
    } catch (_error) {
      setActionError("商品暂时无法加入购物车，请稍后重试。")
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = async () => {
    if (!selectedVariant?.id) return null

    setIsBuying(true)
    setActionError(null)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
      notifyCartUpdated()
      router.push(`/${countryCode}/checkout`)
    } catch (_error) {
      setActionError("暂时无法进入结算，请稍后重试。")
    } finally {
      setIsBuying(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleAddToCart()
  }

  const askAiAboutProduct = () => {
    openAiChat({
      query: `我想了解「${product.title}」的尺码、参数和选购建议。`,
      product: {
        name: product.title,
        handle: product.handle,
        thumbnail: product.thumbnail,
      },
    })
  }

  return (
    <>
      <div ref={actionsRef} className="store-card flex flex-col gap-y-4 p-5">
        <form
          method="post"
          action={`/${countryCode}/cart/add`}
          onSubmit={handleSubmit}
          className="flex flex-col gap-y-4"
          {...{
            toolname: "add_to_cart",
            tooldescription:
              "Add the selected product variant to the shopping cart",
          }}
        >
          <input type="hidden" name="product_id" value={product.id} />
          <input
            type="hidden"
            name="variant_id"
            value={isValidVariant ? selectedVariant?.id ?? "" : ""}
          />
          <input type="hidden" name="quantity" value="1" />

          <ProductPrice product={product} variant={selectedVariant} />

          <div className="border-b border-gray-100 pb-4">
            <p
              className={`text-sm font-semibold ${
                inStock ? "text-[#007600]" : "text-[#B12704]"
              }`}
              data-testid="product-availability"
            >
              {selectedVariant && isValidVariant
                ? inStock
                  ? "现货供应"
                  : "暂时缺货"
                : "请选择完整规格"}
            </p>
            <div className="mt-3 space-y-2 text-xs leading-5 text-gray-600">
              <p className="flex items-center gap-2">
                <TruckFast className="h-4 w-4 shrink-0 text-brand-navy-light" />
                配送方式与预计送达时间以结算页为准
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-brand-navy-light" />
                支持安全交易与订单服务保障
              </p>
              <p className="flex items-center gap-2">
                <ArrowPath className="h-4 w-4 shrink-0 text-brand-navy-light" />
                退换货条件以商城退货政策为准
              </p>
            </div>
          </div>

          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => (
                <OptionSelect
                  key={option.id}
                  option={option}
                  current={options[option.id]}
                  updateOption={setOptionValue}
                  title={option.title ?? ""}
                  name={`options[${option.id}]`}
                  data-testid="product-options"
                  disabled={!!disabled || isAdding || isBuying}
                />
              ))}
              <Divider />
            </div>
          )}

          {actionError && (
            <p
              role="alert"
              className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              {actionError}
            </p>
          )}

          <div className="flex flex-col gap-y-2.5">
            <Button
              type="submit"
              disabled={!canSubmit}
              variant="primary"
              className="h-11 w-full !rounded-full !border !border-[#F2C200] !bg-brand-yellow !text-sm !font-semibold !text-brand-ink shadow-sm hover:!bg-brand-yellow-hover"
              isLoading={isAdding}
              data-testid="add-product-button"
            >
              {!selectedVariant
                ? "请选择规格"
                : !inStock || !isValidVariant
                ? "暂时缺货"
                : "加入购物车"}
            </Button>
            <Button
              type="button"
              onClick={handleBuyNow}
              disabled={!canSubmit}
              variant="primary"
              className="h-11 w-full !rounded-full !border !border-[#FA8900] !bg-brand-action !text-sm !font-semibold !text-brand-ink shadow-sm hover:!bg-brand-action-hover"
              isLoading={isBuying}
              data-testid="buy-now-button"
            >
              立即购买
            </Button>
          </div>
        </form>

        <button
          type="button"
          onClick={askAiAboutProduct}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-brand-ink transition-colors hover:border-brand-orange hover:bg-[#FFF8EE]"
          data-testid="ask-ai-product-button"
        >
          <ChatBubbleLeftRight className="h-5 w-5 text-[#E77600]" />
          问问 AI：这款适合我吗？
        </button>
      </div>

      <MobileActions
        product={product}
        variant={selectedVariant}
        options={options}
        updateOptions={setOptionValue}
        inStock={inStock}
        handleAddToCart={handleAddToCart}
        isAdding={isAdding || isBuying}
        show={!inView}
        optionsDisabled={!!disabled || isAdding || isBuying}
      />
    </>
  )
}
