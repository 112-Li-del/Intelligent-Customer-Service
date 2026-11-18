import { Badge } from "@modules/common/components/ui"

const PaymentTest = ({ className }: { className?: string }) => {
  return (
    <Badge color="orange" className={className}>
      <span className="font-semibold">提示：</span> 仅用于演示。
    </Badge>
  )
}

export default PaymentTest
