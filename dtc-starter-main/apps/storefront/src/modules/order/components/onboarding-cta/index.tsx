"use client"

import { resetOnboardingState } from "@lib/data/onboarding"
import { Button, Container, Text } from "@modules/common/components/ui"

const OnboardingCta = ({ orderId }: { orderId: string }) => {
  return (
    <Container className="max-w-4xl h-full bg-ui-bg-subtle w-full">
      <div className="flex flex-col gap-y-4 center p-4 md:items-center">
        <Text className="text-ui-fg-base text-xl">
          演示订单已创建。
        </Text>
        <Text className="text-ui-fg-subtle text-small-regular">
          可在管理后台继续设置商城。
        </Text>
        <Button
          className="w-fit"
          size="large"
          onClick={() => resetOnboardingState(orderId)}
        >
          前往管理后台
        </Button>
      </div>
    </Container>
  )
}

export default OnboardingCta
