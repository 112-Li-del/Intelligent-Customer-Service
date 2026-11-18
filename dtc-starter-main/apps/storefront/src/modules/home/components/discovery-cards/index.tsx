import { HttpTypes } from "@medusajs/types"
import { ArrowRight, Check, Sparkles } from "@medusajs/icons"
import AiChatTrigger from "@modules/ai-chat/components/ai-chat-trigger"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import Image from "next/image"

type DiscoveryCardsProps = {
  products: HttpTypes.StoreProduct[]
  collections: HttpTypes.StoreCollection[]
}

const ProductThumb = ({ product }: { product?: HttpTypes.StoreProduct }) => {
  const image = product?.thumbnail || product?.images?.[0]?.url

  return (
    <div className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
      {image ? (
        <Image
          src={image}
          alt={product?.title || "商品图片"}
          fill
          sizes="(max-width: 768px) 30vw, 140px"
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-gray-300">
          <PlaceholderImage size={28} />
        </div>
      )}
    </div>
  )
}

const CardHeading = ({ index, title }: { index: string; title: string }) => (
  <div className="flex items-start justify-between gap-3">
    <h2 className="text-lg font-bold leading-7 text-brand-ink">{title}</h2>
    <span className="text-xs font-semibold tracking-widest text-gray-300">
      {index}
    </span>
  </div>
)

const CardLink = ({ href, children }: { href: string; children: string }) => (
  <LocalizedClientLink
    href={href}
    className="mt-auto flex w-fit items-center gap-1.5 pt-5 text-sm font-semibold text-[#007185] hover:text-[#C7511F] hover:underline"
  >
    {children}
    <ArrowRight className="h-4 w-4" />
  </LocalizedClientLink>
)

const DiscoveryCards = ({ products, collections }: DiscoveryCardsProps) => {
  const firstCollection = collections[0]

  return (
    <section
      className="content-container relative z-10 -mt-16 small:-mt-24"
      aria-label="场景导购"
    >
      <div className="grid grid-cols-1 gap-5 xsmall:grid-cols-2 xl:grid-cols-4">
        <article className="store-card flex min-h-[340px] flex-col p-5 transition-shadow hover:shadow-card-hover">
          <CardHeading index="01" title="潮流服饰精选" />
          <p className="mt-1 text-xs leading-5 text-gray-500">
            从日常基础款，到值得尝试的新搭配
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <ProductThumb
                key={products[index]?.id || index}
                product={products[index]}
              />
            ))}
          </div>
          <CardLink
            href={
              firstCollection
                ? `/collections/${firstCollection.handle}`
                : "/store"
            }
          >
            查看全部精选
          </CardLink>
        </article>

        <article className="store-card flex min-h-[340px] flex-col p-5 transition-shadow hover:shadow-card-hover">
          <CardHeading index="02" title="新品尖货速递" />
          <p className="mt-1 text-xs leading-5 text-gray-500">
            新上架商品集中看，快速找到新鲜感
          </p>
          <div className="mt-5 grid flex-1 grid-cols-2 gap-3">
            {Array.from({ length: 2 }, (_, index) => (
              <ProductThumb
                key={products[index + 1]?.id || index}
                product={products[index + 1]}
              />
            ))}
          </div>
          <CardLink href="/#new-products">逛逛本周新品</CardLink>
        </article>

        <article className="store-card flex min-h-[340px] flex-col overflow-hidden p-5 transition-shadow hover:shadow-card-hover">
          <CardHeading index="03" title="预算友好清单" />
          <p className="mt-1 text-xs leading-5 text-gray-500">
            先看需求，再看价格，买得清楚也买得合适
          </p>
          <div className="relative mt-5 flex-1 overflow-hidden rounded-lg bg-gradient-to-br from-[#FFF5E4] to-[#FDE1B6] p-5">
            <div className="absolute -bottom-10 -right-8 h-36 w-36 rounded-full border-[22px] border-white/40" />
            <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-[#9A5B13]">
              SMART CHOICES
            </p>
            <p className="relative mt-3 max-w-[180px] text-2xl font-bold leading-9 text-brand-navy">
              好价格，
              <br />
              也不必妥协品质
            </p>
            <div className="relative mt-5 flex items-center gap-2 text-xs font-medium text-[#7A531F]">
              <Check className="h-4 w-4" />
              价格与库存信息清晰可见
            </div>
          </div>
          <CardLink href="/store">按需求挑选好物</CardLink>
        </article>

        <article className="relative flex min-h-[340px] flex-col overflow-hidden rounded-lg border border-brand-navy bg-brand-navy p-5 text-white shadow-card transition-shadow hover:shadow-card-hover">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-orange/10 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange text-brand-navy">
              <Sparkles className="h-6 w-6" />
            </span>
            <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] tracking-wider text-brand-orange">
              AI SELECT
            </span>
          </div>
          <h2 className="relative mt-5 text-xl font-bold">知选 AI 选品助手</h2>
          <p className="relative mt-2 text-sm leading-6 text-gray-300">
            不确定该买什么？告诉 AI 你的场景、预算和偏好。
          </p>
          <ul className="relative mt-4 space-y-2 text-xs text-gray-300">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-orange" />
              梳理真实需求
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-orange" />
              辅助比较商品
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-orange" />
              解答尺码与服务问题
            </li>
          </ul>
          <AiChatTrigger
            query="你好，请帮我挑选商品。先通过几个问题了解我的使用场景、预算和偏好。"
            className="relative mt-auto flex w-full items-center justify-center gap-2 rounded-full bg-brand-orange py-3 text-sm font-bold text-brand-navy hover:bg-brand-orange-hover"
          >
            开始专属导购
            <ArrowRight className="h-4 w-4" />
          </AiChatTrigger>
        </article>
      </div>
    </section>
  )
}

export default DiscoveryCards
