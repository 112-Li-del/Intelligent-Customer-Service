import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateStoresWorkflow } from "@medusajs/medusa/core-flows"

export default async function renameLaicaiStore({ container }: Pick<ExecArgs, "container">) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id"],
    filters: { name: "知选商城" },
  })

  for (const store of stores) {
    await updateStoresWorkflow(container).run({
      input: { selector: { id: store.id }, update: { name: "来财商城" } },
    })
  }
}
