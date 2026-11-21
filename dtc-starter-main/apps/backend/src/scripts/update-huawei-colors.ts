import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
export default async function inspectHuawei({ container }: Pick<ExecArgs, 'container'>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'title', 'handle', 'options.id', 'options.title', 'options.values.value', 'variants.id', 'variants.title', 'variants.sku', 'variants.options.value', 'variants.options.option.title', 'variants.price_set.id', 'variants.price_set.prices.*', 'variants.inventory_items.*'],
    filters: { handle: 'huawei-pura-90-pro-max' },
  })
  const colors = ['曜石黑','晨曦金','霞光紫','橘子海','翡翠湖']; const sizes = ['12GB+256GB','12GB+512GB','16GB+512GB','16GB+1TB']; const combinations = colors.flatMap(color => sizes.map(size => ({ color, size }))); console.log('目标组合数量:', combinations.length); console.log('目标组合:', JSON.stringify(combinations, null, 2));
  for (const product of products) { console.log('商品:', product.title); console.log('现有规格数量:', product.variants?.length ?? 0); console.log('商品选项:', JSON.stringify(product.options?.map(o => ({title:o.title,values:o.values?.map(v=>v.value)})))); console.log('现有SKU:', JSON.stringify(product.variants?.map(v=>v.sku))); }
}



