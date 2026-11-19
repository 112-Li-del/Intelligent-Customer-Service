"use client"

import { HttpTypes } from "@medusajs/types"
import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import Image from "next/image"
import { useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  thumbnail?: string | null
  title?: string
}

const arrowClassName =
  "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-brand-ink shadow-sm hover:text-brand-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange motion-safe:transition-opacity [@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:opacity-0 group-hover/gallery:pointer-events-auto group-hover/gallery:opacity-100 group-focus-within/gallery:pointer-events-auto group-focus-within/gallery:opacity-100"

export default function ImageGallery({ images, thumbnail, title }: ImageGalleryProps) {
  const [selectedId, setSelectedId] = useState<string>()
  const availableImages = images.filter(({ url }) => Boolean(url))
  const selectedIndex = Math.max(0, availableImages.findIndex(({ id }) => id === selectedId))
  const selected = availableImages[selectedIndex]
  const mainImage = selected?.url || thumbnail
  const hasMultipleImages = availableImages.length > 1

  const stepImage = (direction: -1 | 1) => {
    const nextIndex = (selectedIndex + direction + availableImages.length) % availableImages.length
    setSelectedId(availableImages[nextIndex].id)
  }

  return (
    <div className="store-card flex flex-col-reverse gap-3 p-3 small:flex-row">
      {hasMultipleImages && (
        <div aria-label="商品缩略图" className="flex max-h-[360px] shrink-0 gap-2 overflow-auto p-0.5 small:flex-col">
          {availableImages.map(({ id, url }, index) => (
            <button
              key={id}
              type="button"
              aria-label={`查看第 ${index + 1} 张商品图片`}
              aria-pressed={selected?.id === id}
              onMouseEnter={() => setSelectedId(id)}
              onClick={() => setSelectedId(id)}
              className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-md border-2 border-gray-200 bg-[#F7F8F8] hover:border-brand-orange aria-pressed:border-[#E77600]"
            >
              <Image src={url} alt="" fill sizes="60px" className="object-contain p-0.5" />
            </button>
          ))}
        </div>
      )}
      <div className="group/gallery relative aspect-square min-w-0 flex-1 overflow-hidden rounded-md bg-[#F7F8F8]">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={title || "商品主图"}
            fill
            sizes="(max-width: 767px) 90vw, 40vw"
            className="object-contain transition-transform duration-300 motion-safe:hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-gray-400">
            <PlaceholderImage size={48} />
          </div>
        )}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              aria-label="上一张商品图片"
              className={`${arrowClassName} left-3`}
              onClick={() => stepImage(-1)}
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="下一张商品图片"
              className={`${arrowClassName} right-3`}
              onClick={() => stepImage(1)}
            >
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
