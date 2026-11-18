import { PRODUCT_INDEX_NAME, priceAttribute } from "@lib/search-client"

export const CATEGORY_ATTRIBUTE = "category"
// The index calls the product's tags "labels".
export const LABELS_ATTRIBUTE = "labels"

export const getSortOptions = (currencyCode: string) => {
  const minPrice = priceAttribute("min_price", currencyCode)

  return [
    { value: PRODUCT_INDEX_NAME, label: "相关度" },
    {
      value: `${PRODUCT_INDEX_NAME}/sort/created_at:desc`,
      label: "最新上架",
    },
    {
      value: `${PRODUCT_INDEX_NAME}/sort/${minPrice}:asc`,
      label: "价格从低到高",
    },
    {
      value: `${PRODUCT_INDEX_NAME}/sort/${minPrice}:desc`,
      label: "价格从高到低",
    },
    { value: `${PRODUCT_INDEX_NAME}/sort/title:asc`, label: "名称升序" },
    { value: `${PRODUCT_INDEX_NAME}/sort/title:desc`, label: "名称降序" },
  ]
}
