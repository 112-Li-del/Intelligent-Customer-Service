import { HttpTypes } from "@medusajs/types"
import { isVariantInStock } from "./inventory"
import { convertToLocale } from "./money"
import { getPricedVariants } from "./product-structured-data"
import { formatDayRange, getRegionPolicies } from "./store-policies"

export const renderProductMarkdown = ({
  product,
  region,
  origin,
  countryCode,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  origin: string
  countryCode: string
}) => {
  const base = `${origin}/${countryCode}`
  const productUrl = `${base}/products/${product.handle}`
  const currency = region.currency_code
  const policies = getRegionPolicies(region)
  const optionTitles = new Map(
    (product.options ?? []).map((option) => [option.id, option.title])
  )

  const policyLines = policies
    ? `
- 运费： ${
        policies.shippingRate === 0
          ? "免费"
          : convertToLocale({ amount: policies.shippingRate, currency_code: currency })
      }，预计 ${formatDayRange(policies.handlingDays)} 个工作日内发货，发货后 ${formatDayRange(policies.transitDays)} 个工作日送达
- 退货：收货后 ${policies.returnWindowDays} 天内可申请， ${
        policies.freeReturns ? "退货免运费" : "退货运费由买家承担"
      }`
    : ""

  const variants = getPricedVariants(product)
  const variantRows = variants.map((variant) => {
    const options = (variant.options ?? [])
      .map((value) => `${optionTitles.get(value.option_id ?? "") ?? "规格"}: ${value.value}`)
      .join(", ")
    const price = convertToLocale({
      amount: variant.calculated_price!.calculated_amount!,
      currency_code: currency,
    })
    const stock = isVariantInStock(variant) ? "有货" : "缺货"
    return `| ${options || variant.title} | ${variant.sku ?? ""} | ${price} | ${stock} | \`${variant.id}\` |`
  })

  return `# ${product.title}

${product.description ?? ""}

- 商品链接： ${productUrl}
- 库存： ${variants.some(isVariantInStock) ? "有货" : "缺货"}${policyLines}

## 商品规格

| 规格 | SKU | 价格 | 库存 | 规格 ID |
| --- | --- | --- | --- | --- |
${variantRows.join("\n")}

## 购买

- 加入购物车：用 POST 将 \`variant_id={variant_id}&quantity={n}\`（表单编码）提交至 ${base}/cart/add
- 结算链接： ${origin}/buy/{variant_id}:{quantity}?context/address_country=${countryCode.toUpperCase()}

## 商城说明

- [配送说明](${base}/shipping)
- [退货政策](${base}/returns)
- [服务条款](${base}/terms)
- [隐私政策](${base}/privacy)
- [联系我们](${base}/contact)
`
}
