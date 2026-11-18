"use client"

import { HttpTypes } from "@medusajs/types"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import Image from "next/image"
import { useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  thumbnail?: string | null
  title?: string
}

export default function ImageGallery({ images, thumbnail, title }: ImageGalleryProps) {
  const [selectedId, setSelectedId] = useState<string>()
  const availableImages = images.filter(({ url }) => Boolean(url))
  const selected = availableImages.find(({ id }) => id === selectedId) ?? availableImages[0]
  const mainImage = selected?.url || thumbnail

  return (
    <div className="store-card flex flex-col-reverse gap-3 p-3 small:flex-row">
      {availableImages.length > 1 && (
        <div aria-label="商品缩略图" className="flex max-h-[360px] shrink-0 gap-2 overflow-auto p-0.5 small:flex-col">
          {availableImages.map(({ id, url }, index) => (
            <button
              key={id}
              type="button"
              aria-label={`查看第 ${index + 1} 张商品图片`}
              aria-pressed={selected?.id === id}
              onClick={() => setSelectedId(id)}
              className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-md border-2 border-gray-200 bg-[#F7F8F8] hover:border-brand-orange aria-pressed:border-[#E77600]"
            >
              <Image src={url} alt="" fill sizes="60px" className="object-contain p-0.5" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-square min-w-0 flex-1 overflow-hidden rounded-md bg-[#F7F8F8]">
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
      </div>
    </div>
  )
}
