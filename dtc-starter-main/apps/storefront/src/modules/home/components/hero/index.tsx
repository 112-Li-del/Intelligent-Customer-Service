"use client"

import { ChevronLeft, ChevronRight, Sparkles } from "@medusajs/icons"
import AiChatTrigger from "@modules/ai-chat/components/ai-chat-trigger"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useEffect, useState } from "react"

const slides = [
  {
    eyebrow: "知选商城 · 超级品牌日",
    title: "好物不必海选，\n知选帮你精准挑",
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
    eyebrow: "知选 AI · 你的专属选品助手",
    title: "说出你的需求，\n让选择更简单",
    description:
      "从使用场景、预算到尺码偏好，AI 导购帮你梳理需求，更快找到合适的商品。",
    cta: "开始智能导购",
    query: "你好，我想选购商品，请先问我几个关键问题来了解需求。",
    background:
      "linear-gradient(115deg, #17233C 0%, #3E3568 52%, #74558D 100%)",
  },
]

const Hero = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const slide = slides[activeIndex]

  useEffect(() => {
    if (
      isPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 6000)

    return () => window.clearInterval(timer)
  }, [isPaused])

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length)
  }

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length)
  }

  return (
    <section
      className="relative h-[520px] overflow-hidden text-white small:h-[440px]"
      style={{ background: slide.background }}
      aria-roledescription="轮播图"
      aria-label="知选商城精选活动"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden="true"
      >
        <div className="absolute -right-20 -top-40 h-[520px] w-[520px] rounded-full border border-white/20" />
        <div className="absolute -right-4 -top-24 h-[380px] w-[380px] rounded-full border border-white/20" />
        <div className="absolute bottom-10 left-[45%] h-24 w-24 rotate-12 rounded-3xl bg-white/10" />
      </div>

      <div className="content-container relative flex h-full items-center pb-24 pt-4">
        <div
          key={activeIndex}
          className="relative z-10 max-w-2xl animate-slide-up"
        >
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange small:text-sm">
            <span className="h-px w-8 bg-brand-orange" />
            {slide.eyebrow}
          </p>
          <h1 className="whitespace-pre-line text-4xl font-bold leading-[1.15] tracking-tight small:text-5xl small:leading-[1.12]">
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

        <div
          className="absolute right-10 top-16 hidden w-[360px] xl:block"
          aria-hidden="true"
        >
          <div className="rotate-3 rounded-2xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/20 pb-4 text-xs tracking-[0.2em] text-white/70">
              <span>ZHIXUAN EDIT</span>
              <span>0{activeIndex + 1} / 03</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="aspect-square rounded-xl bg-white/90 p-4">
                <div className="h-full rounded-lg bg-gradient-to-br from-gray-100 to-gray-300" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="h-3 w-3/4 rounded-full bg-white/50" />
                <div className="h-3 w-1/2 rounded-full bg-white/30" />
                <div className="mt-auto h-10 rounded-full bg-brand-yellow" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-brand-navy/60 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-brand-navy">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">AI 选品匹配</p>
                <p className="mt-1 text-xs text-white/60">
                  理解需求，而不只是匹配关键词
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={showPrevious}
        aria-label="上一张活动横幅"
        className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/20 p-2 text-white backdrop-blur-sm hover:bg-black/40 small:block"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={showNext}
        aria-label="下一张活动横幅"
        className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/20 p-2 text-white backdrop-blur-sm hover:bg-black/40 small:block"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 small:bottom-20">
        {slides.map((item, index) => (
          <button
            key={item.eyebrow}
            type="button"
            aria-label={`切换到第 ${index + 1} 张活动横幅`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => setActiveIndex(index)}
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
