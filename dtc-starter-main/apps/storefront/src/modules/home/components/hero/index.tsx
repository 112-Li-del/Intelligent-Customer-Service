import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading } from "@modules/common/components/ui"
const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-ui-bg-subtle">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-6">
        <span>
          <Heading
            level="h1"
            className="text-3xl leading-10 text-ui-fg-base font-normal"
          >
            知选商城
          </Heading>
          <Heading
            level="h2"
            className="text-3xl leading-10 text-ui-fg-subtle font-normal"
          >
            浏览商品，查看规格和配送信息
          </Heading>
        </span>
        <LocalizedClientLink href="/store" className="rounded-md border border-ui-border-base px-5 py-2">
          浏览商品
        </LocalizedClientLink>
      </div>
    </div>
  );
};

export default Hero;
