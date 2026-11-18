import { listCategories } from "@lib/data/categories"
import { ArrowUpMini, Sparkles } from "@medusajs/icons"
import AiChatTrigger from "@modules/ai-chat/components/ai-chat-trigger"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const guideLinks = [
  { label: "商城首页", href: "/" },
  { label: "全部商品", href: "/store" },
  { label: "精选好物", href: "/#popular-products" },
  { label: "新品首发", href: "/#new-products" },
]

const shoppingLinks = [
  { label: "搜索商品", href: "/search" },
  { label: "购物车", href: "/cart" },
  { label: "我的账户", href: "/account" },
  { label: "我的订单", href: "/account/orders" },
]

const serviceLinks = [
  { label: "配送说明", href: "/shipping" },
  { label: "退货政策", href: "/returns" },
  { label: "服务条款", href: "/terms" },
  { label: "隐私政策", href: "/privacy" },
  { label: "联系我们", href: "/contact" },
]

const FooterColumn = ({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) => (
  <div>
    <h3 className="text-sm font-semibold text-white">{title}</h3>
    <ul className="mt-4 space-y-3 text-sm text-gray-300">
      {links.map((link) => (
        <li key={link.label}>
          <LocalizedClientLink
            href={link.href}
            className="hover:text-white hover:underline"
          >
            {link.label}
          </LocalizedClientLink>
        </li>
      ))}
    </ul>
  </div>
)

export default async function Footer() {
  const productCategories = await listCategories({
    fields: "id,name,handle,parent_category_id",
  })

  const categoryLinks = (productCategories || [])
    .filter((category) => !category.parent_category_id)
    .slice(0, 5)
    .map((category) => ({
      label: category.name,
      href: `/categories/${category.handle}`,
    }))

  return (
    <footer className="mt-14 w-full bg-brand-navy-light text-gray-300">
      <a
        href="#top"
        className="flex w-full items-center justify-center gap-2 bg-brand-slate py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#485769]"
      >
        <ArrowUpMini className="h-4 w-4" />
        回到顶部
      </a>

      <div className="content-container py-10 small:py-14">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-9 small:flex-row small:items-center small:justify-between">
          <div>
            <LocalizedClientLink
              href="/"
              className="text-2xl font-bold tracking-tight text-white"
            >
              知选商城
            </LocalizedClientLink>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
              用真实商品信息、清晰的服务承诺与 AI 导购，让每一次选择更简单。
            </p>
          </div>
          <AiChatTrigger
            query="你好，请根据我的需求帮我挑选商品。"
            className="flex w-fit items-center gap-3 rounded-full bg-brand-orange px-5 py-3 text-sm font-semibold text-brand-navy hover:bg-brand-orange-hover"
          >
            <Sparkles className="h-5 w-5" />让 AI 帮我选
          </AiChatTrigger>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-10 small:grid-cols-4 small:gap-12">
          <FooterColumn title="了解知选商城" links={guideLinks} />
          <FooterColumn title="购物指南" links={shoppingLinks} />
          <FooterColumn title="售后服务保障" links={serviceLinks} />
          <FooterColumn
            title="商品分类"
            links={
              categoryLinks.length
                ? categoryLinks
                : [{ label: "浏览全部商品", href: "/store" }]
            }
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-xs leading-5 text-gray-400">
          AI
          导购内容用于辅助决策，商品价格、库存、配送与退换政策请以商品页和结算页的最新信息为准。
        </div>
      </div>

      <div className="bg-brand-navy">
        <div className="content-container flex flex-col gap-2 py-6 text-xs text-gray-400 xsmall:flex-row xsmall:items-center xsmall:justify-between">
          <p>© {new Date().getFullYear()} 知选商城 · 保留所有权利</p>
          <p>清晰选购 · 安心交付 · 智能服务</p>
        </div>
      </div>
    </footer>
  )
}
