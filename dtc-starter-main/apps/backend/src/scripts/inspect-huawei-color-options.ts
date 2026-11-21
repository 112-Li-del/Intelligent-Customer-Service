import type { ExecArgs } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
export default async function inspectColors({ container }: Pick<ExecArgs, 'container'>) {
  const productModule = container.resolve(Modules.PRODUCT)
  const options = await productModule.listProductOptions({ title: '颜色' }, { relations: ['values'] })
  console.log(JSON.stringify(options.map(o => ({ id: o.id, title: o.title, product_id: o.product_id, is_exclusive: o.is_exclusive, is_exclusive: o.is_exclusive, values: o.values?.map(v => v.value) })), null, 2))
}


