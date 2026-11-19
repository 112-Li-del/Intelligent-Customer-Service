"use client"

import { ChevronLeft, ChevronRight, Sparkles } from "@medusajs/icons"
import AiChatTrigger from "@modules/ai-chat/components/ai-chat-trigger"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { useEffect, useState } from "react"
import styles from "./carousel.module.css"

const ROTATION_INTERVAL = 3000

const slides = [
  {
    eyebrow: "来财商城 · 超级品牌日",
    title: "好物不必海选，\n来财帮你精准挑",
    description: "从日常穿搭配货到生活好物，真实商品、清晰价格，一站轻松选购。",
    cta: "立即逛好物",
    href: "/store",
    background:
      "linear-gradient(115deg, #131921 0%, #243B53 52%, #315A70 100%)",
  },
  {
    eyebrow: "本周上新 · 新鲜感正当时",
    title: "新品上架，\n把灵感带进日常",
    description:
      "精选新品集中呈现，快速了解规格、库存与配送信息，少一点犹豫，多一点喜欢。",
    cta: "查看新品",
    href: "/#new-products",
    background:
      "linear-gradient(115deg, #3B2C20 0%, #8B5E34 52%, #C48B4A 100%)",
  },
  {
    eyebrow: "来财 AI · 你的专属选品助手",
    title: "说出你的需求，\n让选择更简单",
    description:
      "从使用场景、预算到尺码偏好，AI 导购帮你梳理需求，更快找到合适的商品。",
    cta: "开始智能导购",
    query: "你好，我想选购商品，请先问我几个关键问题来了解需求。",
    background:
      "linear-gradient(115deg, #17233C 0%, #3E3568 52%, #74558D 100%)",
  },
]

type HeroProduct = {
  handle: string
  title: string
  image: string
  price?: string
}

type Direction = 1 | -1
type CarouselState = {
  activeIndex: number
  previousIndex?: number
  direction: Direction
}

const HeroSlide = ({
  slide,
  product,
  className,
  isLeaving,
}: {
  slide: (typeof slides)[number]
  product?: HeroProduct
  className: string
  isLeaving?: boolean
}) => {
  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{ background: slide.background }}
      aria-hidden={isLeaving}
      inert={isLeaving}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden="true"
      >
        <div className="absolute -right-20 -top-40 h-[520px] w-[520px] rounded-full border border-white/20" />
        <div className="absolute -right-4 -top-24 h-[380px] w-[380px] rounded-full border border-white/20" />
        <div className="absolute bottom-10 left-[45%] h-24 w-24 rotate-12 rounded-3xl bg-white/10" />
      </div>

      <div className="content-container relative flex h-full flex-col justify-center gap-4 pb-28 pt-4 small:flex-row small:items-center small:justify-between small:gap-8 small:pb-32">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange small:text-sm">
            <span className="h-px w-8 bg-brand-orange" />
            {slide.eyebrow}
          </p>
          <h1 className="whitespace-pre-line text-3xl font-bold leading-[1.15] tracking-tight small:text-4xl xl:text-5xl">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 small:text-base">
            {slide.description}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            {slide.href ? (
              <LocalizedClientLink
                href={slide.href}
                className="rounded-full bg-brand-yellow px-7 py-3 text-sm font-bold text-brand-ink shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-yellow-hover"
              >
                {slide.cta}
              </LocalizedClientLink>
            ) : (
              <AiChatTrigger
                query={slide.query}
                className="rounded-full bg-brand-yellow px-7 py-3 text-sm font-bold text-brand-ink shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-yellow-hover"
              >
                {slide.cta}
              </AiChatTrigger>
            )}
            <AiChatTrigger className="rounded-full border border-white/30 px-5 py-3 text-sm font-medium text-white hover:bg-white/10">
              咨询 AI 客服
            </AiChatTrigger>
          </div>
        </div>

        {product && (
          <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="group z-10 flex w-full min-w-0 items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-2 hover:bg-white/20 small:w-[220px] small:shrink-0 small:flex-col small:items-stretch small:p-3 xl:w-[300px]"
          >
            <div className="relative aspect-square w-[72px] shrink-0 overflow-hidden rounded-lg bg-[#F7F8F8] small:aspect-[4/3] small:w-full">
              <Image src={product.image} alt="" fill sizes="(max-width: 1023px) 72px, 280px" className="scale-125 object-contain transition-transform motion-safe:group-hover:scale-[1.32]" />
            </div>
            <div className="min-w-0 small:px-1">
              <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-brand-orange">
                <Sparkles className="h-4 w-4 shrink-0" />
                AI 智能匹配推荐
              </p>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="line-clamp-1 text-sm font-semibold">{product.title}</p>
                {product.price && <span className="rounded bg-brand-yellow px-1.5 text-sm font-bold text-brand-ink">{product.price}</span>}
              </div>
            </div>
          </LocalizedClientLink>
        )}
      </div>
    </div>
  )
}

const stepCarousel = (current: CarouselState, direction: Direction): CarouselState => ({
  activeIndex: (current.activeIndex + direction + slides.length) % slides.length,
  previousIndex: current.activeIndex,
  direction,
})

const Hero = ({ products }: { products: HeroProduct[] }) => {
  const [{ activeIndex, previousIndex, direction }, setCarousel] = useState<CarouselState>({
    activeIndex: 0,
    direction: 1,
  })
  const [isHovered, setIsHovered] = useState(false)
  const [hasFocus, setHasFocus] = useState(false)

  useEffect(() => {
    if (isHovered || hasFocus) return

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let timer: number | undefined
    const schedule = () => {
      window.clearTimeout(timer)
      if (!motion.matches) {
        timer = window.setTimeout(() => {
          setCarousel((current) => stepCarousel(current, 1))
        }, ROTATION_INTERVAL)
      }
    }

    schedule()
    motion.addEventListener("change", schedule)
    return () => {
      window.clearTimeout(timer)
      motion.removeEventListener("change", schedule)
    }
  }, [activeIndex, isHovered, hasFocus])

  const getProduct = (index: number) =>
    products.length ? products[index % products.length] : undefined
  const reverse = direction === -1 ? styles.reverse : ""

  return (
    <section
      className="relative isolate h-[540px] overflow-hidden bg-brand-navy text-white small:h-[460px]"
      aria-roledescription="轮播图"
      aria-label="来财商城精选活动"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setIsHovered(true)
      }}
      onPointerLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false)
      }}
    >
      {previousIndex !== undefined && (
        <HeroSlide
          key={`leaving-${previousIndex}`}
          slide={slides[previousIndex]}
          product={getProduct(previousIndex)}
          className={`${styles.leaving} ${reverse}`}
          isLeaving
        />
      )}
      <HeroSlide
        key={`active-${activeIndex}`}
        slide={slides[activeIndex]}
        product={getProduct(activeIndex)}
        className={previousIndex === undefined ? "" : `${styles.entering} ${reverse}`}
      />

      <button
        type="button"
        onClick={() => setCarousel((current) => stepCarousel(current, -1))}
        aria-label="上一张活动横幅"
        className="absolute bottom-[100px] left-[calc(50%-76px)] z-10 hidden rounded-full bg-black/20 p-1.5 text-white hover:bg-black/40 small:block"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={() => setCarousel((current) => stepCarousel(current, 1))}
        aria-label="下一张活动横幅"
        className="absolute bottom-[100px] right-[calc(50%-76px)] z-10 hidden rounded-full bg-black/20 p-1.5 text-white hover:bg-black/40 small:block"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 small:bottom-28">
        {slides.map((item, index) => (
          <button
            key={item.eyebrow}
            type="button"
            aria-label={`切换到第 ${index + 1} 张活动横幅`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => setCarousel((current) => (
              index === current.activeIndex
                ? current
                : {
                    activeIndex: index,
                    previousIndex: current.activeIndex,
                    direction: index > current.activeIndex ? 1 : -1,
                  }
            ))}
            className={`h-1.5 rounded-full transition-all ${
              index === activeIndex
                ? "w-8 bg-brand-orange"
                : "w-2 bg-white/50 hover:bg-white"
            }`}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-canvas to-transparent" />
    </section>
  )
}

export default Hero
