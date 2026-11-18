import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  name: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  name,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)

  return (
    <fieldset className="flex flex-col gap-y-3" disabled={disabled}>
      <legend className="mb-3 text-xs font-semibold text-gray-600">
        选择{title}
      </legend>
      <div
        className="flex flex-wrap justify-between gap-2"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          const id = `${name}-${encodeURIComponent(v)}`
          return (
            <div key={v} className="flex-1">
              <input
                type="radio"
                id={id}
                name={name}
                value={v}
                checked={v === current}
                onChange={() => updateOption(option.id, v)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={clx(
                  "flex h-10 cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white p-2 text-xs font-medium text-brand-ink transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-brand-orange peer-focus-visible:ring-offset-1 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                  {
                    "border-[#E77600] bg-[#FFF8EE] shadow-[0_0_0_1px_#E77600]":
                      v === current,
                    "hover:border-gray-500 hover:bg-gray-50": v !== current,
                  }
                )}
                data-testid="option-button"
              >
                {v}
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

export default OptionSelect
