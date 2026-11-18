import { listProducts } from "@lib/data/products"
import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@modules/common/components/ui"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = async ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  // Cart lines don't include available stock. Fetch it once for the tracked variants.
  const trackedItems = items?.filter(({ variant, product_id }) =>
    product_id && variant?.manage_inventory && !variant.allow_backorder
  ) ?? []
  const productIds = Array.from(new Set(trackedItems.flatMap(
    ({ product_id }) => product_id ? [product_id] : []
  )))
  const catalog = productIds.length && cart?.region_id
    ? await listProducts({
        regionId: cart.region_id,
        queryParams: {
          id: productIds,
          limit: productIds.length,
          sales_channel_id: cart.sales_channel_id ?? undefined,
          fields: "id,variants.id,variants.manage_inventory,+variants.inventory_quantity",
        },
        fresh: true,
      }).catch(() => null)
    : null
  const stockByVariant = new Map(
    (catalog?.response.products ?? []).flatMap((product) =>
      (product.variants ?? []).map((variant) => [variant.id, variant.inventory_quantity] as const)
    )
  )

  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading className="text-2xl font-semibold leading-8">购物车</Heading>
      </div>
      <Table>
        <Table.Header className="hidden border-t-0 small:table-header-group">
          <Table.Row className="text-ui-fg-subtle txt-medium-plus">
            <Table.HeaderCell className="!pl-0">商品</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
            <Table.HeaderCell>数量</Table.HeaderCell>
            <Table.HeaderCell className="hidden small:table-cell">
              价格
            </Table.HeaderCell>
            <Table.HeaderCell className="!pr-0 text-right">
              合计
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items
            ? items
                .toSorted((a, b) => {
                  return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                })
                .map((item) => {
                  return (
                    <Item
                      key={item.id}
                      item={item}
                      currencyCode={cart?.currency_code}
                      maxQuantity={stockByVariant.get(item.variant_id ?? "") ?? undefined}
                    />
                  )
                })
            : repeat(5).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
        </Table.Body>
      </Table>
    </div>
  )
}

export default ItemsTemplate
