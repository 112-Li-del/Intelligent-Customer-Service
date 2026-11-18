import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block h-10 w-36 animate-pulse rounded bg-gray-100" />
  }

  return (
    <div className="flex flex-col gap-1.5 text-brand-ink">
      <span className="text-xs font-medium text-gray-500">价格</span>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className="text-3xl font-semibold leading-9 tracking-tight text-[#B12704]"
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {!variant && (
            <span className="mr-1 text-base font-normal text-gray-500">起</span>
          )}
          {selectedPrice.calculated_price}
        </span>
        {selectedPrice.price_type === "sale" && (
          <span className="rounded bg-[#CC0C39] px-2 py-1 text-xs font-bold text-white">
            省 {selectedPrice.percentage_diff}%
          </span>
        )}
      </div>
      {selectedPrice.price_type === "sale" && (
        <p className="text-xs text-gray-500">
          原价：
          <span
            className="line-through"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>
        </p>
      )}
    </div>
  )
}
