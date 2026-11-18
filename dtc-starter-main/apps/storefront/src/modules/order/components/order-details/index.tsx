import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const statusLabels: Record<string, string> = {
    not_fulfilled: "待发货", partially_fulfilled: "部分发货", fulfilled: "已履约",
    partially_shipped: "部分发货", shipped: "已发货", partially_delivered: "部分送达",
    delivered: "已送达", canceled: "已取消", not_paid: "待支付",
    awaiting: "等待支付", authorized: "已授权", captured: "已支付",
    partially_captured: "部分支付", refunded: "已退款", partially_refunded: "部分退款",
    requires_action: "待处理",
  }
  const formatStatus = (status: string) => statusLabels[status] ?? "处理中"

  return (
    <div>
      <Text>
        订单联系邮箱：{" "}
        <span
          className="text-ui-fg-medium-plus font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
      </Text>
      <Text className="mt-2">
        下单日期：{" "}
        <span data-testid="order-date">
          {new Date(order.created_at).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}
        </span>
      </Text>
      <Text className="mt-2 text-ui-fg-interactive">
        订单号： <span data-testid="order-id">{order.display_id}</span>
      </Text>

      <div className="flex items-center text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <>
            <Text>
              订单状态：{" "}
              <span className="text-ui-fg-subtle " data-testid="order-status">
                {formatStatus(order.fulfillment_status)}
              </span>
            </Text>
            <Text>
              支付状态：{" "}
              <span
                className="text-ui-fg-subtle "
                data-testid="order-payment-status"
              >
                {formatStatus(order.payment_status)}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails
