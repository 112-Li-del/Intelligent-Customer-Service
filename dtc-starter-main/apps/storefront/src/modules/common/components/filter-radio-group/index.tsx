import { clx } from "@modules/common/components/ui"
import { useId } from "react"

type FilterRadioGroupProps = {
  title: string
  items: {
    value: string
    label: string
  }[]
  value: string
  handleChange: (value: string) => void
  "data-testid"?: string
}

const FilterRadioGroup = ({
  title,
  items,
  value,
  handleChange,
  "data-testid": dataTestId,
}: FilterRadioGroupProps) => {
  const groupName = useId()

  return (
    <fieldset className="min-w-0" data-testid={dataTestId}>
      <legend className="mb-3 txt-compact-small-plus text-ui-fg-muted">
        {title}
      </legend>
      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const selected = item.value === value

          return (
            <label
              key={item.value}
              className="block w-full cursor-pointer"
              data-testid="radio-label"
              data-active={selected}
            >
              <input
                type="radio"
                name={groupName}
                value={item.value}
                checked={selected}
                onChange={() => handleChange(item.value)}
                className="peer sr-only"
              />
              <span
                className={clx(
                  "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-inset peer-focus-visible:ring-brand-navy",
                  selected
                    ? "border-amber-200/80 bg-amber-50 font-semibold text-brand-ink"
                    : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-brand-ink"
                )}
              >
                {item.label}
                {selected && (
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[#FF9900]" />
                )}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default FilterRadioGroup
