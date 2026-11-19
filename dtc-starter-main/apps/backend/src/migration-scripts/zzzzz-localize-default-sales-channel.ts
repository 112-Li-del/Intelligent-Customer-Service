import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateSalesChannelsWorkflow } from "@medusajs/medusa/core-flows"

export default async function localizeDefaultSalesChannel({ container }: Pick<ExecArgs, "container">) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: [store] } = await query.graph({
    entity: "store",
    fields: ["default_sales_channel_id"],
  })
  if (!store?.default_sales_channel_id) return

  const { data: [channel] } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
    filters: { id: store.default_sales_channel_id },
  })
  if (channel?.name !== "Default Sales Channel") return

  await updateSalesChannelsWorkflow(container).run({
    input: { selector: { id: channel.id }, update: { name: "默认销售渠道" } },
  })
}
