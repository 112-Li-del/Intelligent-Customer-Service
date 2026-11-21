import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
export default async function inspectHuawei({ container }: Pick<ExecArgs, 'container'>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'title', 'handle', 'options.id', 'options.title', 'options.values.value', 'variants.id', 'variants.title', 'variants.sku', 'variants.options.value', 'variants.options.option.title', 'variants.price_set.id', 'variants.price_set.prices.*', 'variants.inventory_items.*'],
    filters: { handle: 'huawei-pura-90-pro-max' },
  })
  console.log(JSON.stringify(products, null, 2))
}

