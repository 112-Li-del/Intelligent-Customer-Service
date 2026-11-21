import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
export default async function inspectColorOwner({ container }: Pick<ExecArgs, 'container'>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: 'product', fields: ['id','title','handle','options.id','options.title'], pagination: { take: 1000 } })
  const matched = data.filter(p => p.options?.some(o => o.id === 'opt_01M7QRB8WQ8V1EA069FWGAE83Q'))
  console.log('使用该颜色选项的商品:', JSON.stringify(matched, null, 2))
  console.log('本次检查商品数量:', data.length)
}
