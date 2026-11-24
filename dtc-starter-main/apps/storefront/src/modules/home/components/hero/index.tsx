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
      "linear-gradient(135deg, #0D1B2A 0%, #1A3350 40%, #2E5F7A 75%, #3D7A9A 100%)",
  },
  {
    eyebrow: "本周上新 · 新鲜感正当时",
    title: "新品上架，\n把灵感带进日常",
    description:
      "精选新品集中呈现，快速了解规格、库存与配送信息，少一点犹豫，多一点喜欢。",
    cta: "查看新品",
    href: "/#new-products",
    background:
      "linear-gradient(135deg, #2A1A0D 0%, #6B3D1A 40%, #A0602A 75%, #D4894A 100%)",
  },
  {
    eyebrow: "来财 AI · 你的专属选品助手",
    title: "说出你的需求，\n让选择更简单",
    description:
      "从使用场景、预算到尺码偏好，AI 导购帮你梳理需求，更快找到合适的商品。",
    cta: "开始智能导购",
    query: "你好，我想选购商品，请先问我几个关键问题来了解需求。",
    background:
      "linear-gradient(135deg, #150E2A 0%, #2D2050 40%, #5A3E80 75%, #8060A8 100%)",
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
        className={`${styles.atmosphere} pointer-events-none absolute inset-0`}
        aria-hidden="true"
      >
        <div className="absolute -right-20 -top-40 h-[520px] w-[520px] rounded-full border border-white/20" />
        <div className="absolute -right-4 -top-24 h-[380px] w-[380px] rounded-full border border-white/20" />
        <svg viewBox="0 0 180 180" fill="none" className="absolute -bottom-14 left-[16%] h-[180px] w-[180px] text-white/10">
          <path d="M45 13h90l44 77-44 77H45L1 90Z" stroke="currentColor" />
        </svg>
      </div>

      <div className="content-container relative flex h-full flex-col justify-center gap-4 pb-28 pt-4 small:flex-row small:items-center small:justify-between small:gap-8 small:pb-32">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange small:text-sm">
            <span className="h-px w-9 bg-gradient-to-r from-brand-orange to-transparent" />
            {slide.eyebrow}
          </p>
          <h1 className="whitespace-pre-line font-serif text-3xl font-bold leading-[1.1] tracking-[-0.02em] small:text-5xl xl:text-6xl">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 small:text-base">
            {slide.description}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            {slide.href ? (
              <LocalizedClientLink
                href={slide.href}
                className="hero-cta"
              >
                {slide.cta}
              </LocalizedClientLink>
            ) : (
              <AiChatTrigger
                query={slide.query}
                className="hero-cta"
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
            className="group z-10 flex w-full min-w-0 items-center gap-3 rounded-2xl border border-white/25 bg-white/15 p-2 shadow-card backdrop-blur-md transition-colors hover:bg-white/[0.22] small:w-[220px] small:shrink-0 small:flex-col small:items-stretch small:p-3 xl:w-[300px]"
          >
            <div className="relative aspect-square w-[72px] shrink-0 overflow-hidden rounded-lg bg-[#FAF7F1] small:aspect-[4/3] small:w-full">
              <Image src={product.image} alt="" fill loading="eager" sizes="(max-width: 1023px) 72px, 280px" className="scale-125 object-contain transition-transform motion-safe:group-hover:scale-[1.32]" />
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
        className="absolute bottom-[100px] left-[calc(50%-90px)] z-10 hidden rounded-full bg-black/20 p-1.5 text-white hover:bg-black/40 small:block"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={() => setCarousel((current) => stepCarousel(current, 1))}
        aria-label="下一张活动横幅"
        className="absolute bottom-[100px] right-[calc(50%-90px)] z-10 hidden rounded-full bg-black/20 p-1.5 text-white hover:bg-black/40 small:block"
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
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === activeIndex
                ? "w-10 bg-gradient-to-r from-brand-orange to-brand-amber"
                : "w-2 bg-white opacity-50 hover:opacity-100"
            }`}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-canvas to-transparent" />
    </section>
  )
}

export default Hero
