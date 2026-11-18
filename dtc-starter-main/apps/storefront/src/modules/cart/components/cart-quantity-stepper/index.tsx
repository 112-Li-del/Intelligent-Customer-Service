import Spinner from "@modules/common/icons/spinner"

const buttonClass =
  "flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-[#0F1111] outline-none enabled:hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#A65300] disabled:opacity-40"

type CartQuantityStepperProps = {
  quantity: number
  maxQuantity: number
  updating: boolean
  onDecrease: () => void
  onIncrease: () => void
}

export default function CartQuantityStepper({
  quantity,
  maxQuantity,
  updating,
  onDecrease,
  onIncrease,
}: CartQuantityStepperProps) {
  return (
    <div
      role="group"
      aria-label="商品数量"
      aria-busy={updating}
      className="inline-flex h-8 w-fit items-center rounded-full border-2 border-[#FFD814] bg-white px-1 shadow-sm"
      data-testid="product-quantity-stepper"
    >
      <button
        type="button"
        className={buttonClass}
        aria-label="减少数量"
        data-testid="product-decrease-button"
        disabled={updating || quantity <= 1}
        onClick={onDecrease}
      >
        <span aria-hidden="true">−</span>
      </button>
      <span
        className="relative min-w-[2rem] px-0.5 text-center text-sm font-semibold tabular-nums text-[#0F1111]"
        aria-live="polite"
        data-testid="product-quantity"
      >
        <span className={updating ? "opacity-0" : undefined}>{quantity}</span>
        {updating && (
          <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
            <Spinner size="12" />
          </span>
        )}
      </span>
      <button
        type="button"
        className={buttonClass}
        aria-label={quantity >= maxQuantity ? "增加数量（已达上限）" : "增加数量"}
        data-testid="product-increase-button"
        disabled={updating || quantity >= maxQuantity}
        onClick={onIncrease}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  )
}
