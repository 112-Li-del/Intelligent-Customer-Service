import { Heading, Text } from "@modules/common/components/ui"
import TransferActions from "@modules/order/components/transfer-actions"
import TransferImage from "@modules/order/components/transfer-image"

export default async function TransferPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>
}) {
  const { id, token } = await params

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        <Heading level="h1" className="text-xl text-zinc-900">
          订单转移请求 {id}
        </Heading>
        <Text className="text-zinc-600">
          你收到一条订单转移请求（{id}).
          If you agree to this request, you can approve the transfer by clicking
          the button below.
        </Text>
        <div className="w-full h-px bg-zinc-200" />
        <Text className="text-zinc-600">
          接受后，订单的相关权利和责任将转移给新用户。
        </Text>
        <Text className="text-zinc-600">
          如果你不认识发起人或想保留订单，可以忽略这条请求。
        </Text>
        <div className="w-full h-px bg-zinc-200" />
        <TransferActions id={id} token={token} />
      </div>
    </div>
  )
}
