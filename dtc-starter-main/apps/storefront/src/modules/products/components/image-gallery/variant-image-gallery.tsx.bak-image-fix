"use client"

import { HttpTypes } from "@medusajs/types"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import ImageGallery from "."

// Exact filenames from storefront/public. Keep the main images in
// /catalog-preview and the detail images in /catalog-preview/gallery.
// Some original files intentionally have spaces before .webp, a misspelling
// (gloden), or uppercase letters. These are preserved in the paths below.
const ROOT = "/catalog-preview/"
const GALLERY = "/catalog-preview/gallery/"

type PhotoSet = { main: string; details: string[] }
type ColorPhotos = Record<string, PhotoSet>

const PHOTO_CONFIG: Record<string, ColorPhotos> = {
  "huawei-pura-90-pro-max": {
    "晨曦金": {
      main: "huawei-pura-90-pro-max-gold-main.webp",
      details: ["gold1", "gold2", "gold3"].map((s) => `huawei-pura-90-pro-max-${s}.webp`),
    },
    "霞光紫": {
      main: "huawei-pura-90-pro-max-purple-main.webp",
      details: ["purple2", "purple3", "purple4"].map((s) => `huawei-pura-90-pro-max-${s}.webp`),
    },
    "橘子海": {
      main: "huawei-pura-90-pro-max-orange-main.webp",
      details: ["orange2", "orange3", "orange4"].map((s) => `huawei-pura-90-pro-max-${s}.webp`),
    },
    "翡翠湖": {
      main: "huawei-pura-90-pro-max-green-main.webp",
      details: ["green2", "green3", "green4"].map((s) => `huawei-pura-90-pro-max-${s}.webp`),
    },
    // 曜石黑 retains the product thumbnail and existing gallery from Medusa.
  },
  "huawei-mate-90-pro-max": {
    "曜石黑": {
      main: "huawei-mate-90-pro-max-black .webp",
      details: [1, 2, 3, 4].map((n) => `huawei-mate-90-pro-max-black-angle${n} .webp`),
    },
    "玫瑰金": {
      main: "huawei-mate-90-pro-max-gloden .webp",
      details: [1, 2, 3, 4].map((n) => `huawei-mate-90-pro-max-gloden-angle${n} .webp`),
    },
    "翡冷翠": {
      main: "huawei-mate-90-pro-max-green .webp",
      details: [
        "huawei-mate-90-pro-max-green-angle1 .webp",
        "huawei-mate-90-pro-max-green-angle2 .webp",
        "huawei-mate-90-pro-max-green-angle3.webp",
        "huawei-mate-90-pro-max-green-angle4.webp",
      ],
    },
    "晶钻白": {
      main: "huawei-mate-90-pro-max-white.webp",
      details: [1, 2, 3, 4].map((n) => `huawei-mate-90-pro-max-white-angle${n}.webp`),
    },
  },
  "huawei-pura-x-view": {
    "幻夜黑": {
      // Use the original uploaded main image for consistency with other colors.
      main: "HUAWEI-Pura-X-View-black.webp",
      details: [1, 2, 3, 4].map((n) => `HUAWEI-Pura-X-View-black-angle${n}.webp`),
    },
    "跃影红": {
      main: "HUAWEI-Pura-X-View-red.webp",
      details: [
        "HUAWEI-Pura-X-View-red-angle1 .webp",
        "HUAWEI-Pura-X-View-red-angle2.webp",
        "HUAWEI-Pura-X-View-red-angle3 .webp",
        "HUAWEI-Pura-X-View-red-angle4.webp",
      ],
    },
    "亚麻灰": {
      main: "HUAWEI-Pura-X-View-grey.webp",
      details: [1, 2, 3, 4].map((n) => `HUAWEI-Pura-X-View-grey-angle${n}.webp`),
    },
    "零度白": {
      main: "HUAWEI-Pura-X-View-white.webp",
      details: [
        "HUAWEI-Pura-X-View-white-angle1.webp",
        "HUAWEI-Pura-X-View-white-angle2 .webp",
        "HUAWEI-Pura-X-View-white-angle3 .webp",
        "HUAWEI-Pura-X-View-white-angle4 .webp",
      ],
    },
  },
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
): HttpTypes.StoreProductImage[] {
  const original = product.thumbnail
    ? ([
        { id: "product-main-thumbnail", url: product.thumbnail },
        ...(product.images ?? []).filter((image) => image.url !== product.thumbnail),
      ] as HttpTypes.StoreProductImage[])
    : (product.images ?? [])

  const variant = product.variants?.find((item) => item.id === selectedVariantId)
  const mappings = product.handle ? PHOTO_CONFIG[product.handle] : undefined

  if (mappings) {
    const colorOption = product.options?.find((option) => option.title === "颜色")
    const selectedColor = variant?.options?.find(
      (option) => option.option_id === colorOption?.id
    )?.value
    const fallbackColor = product.handle === "huawei-mate-90-pro-max" ? "曜石黑" : "幻夜黑"
    const photos = (selectedColor && mappings[selectedColor]) ||
      (product.handle === "huawei-pura-90-pro-max" ? undefined : mappings[fallbackColor])

    if (photos) {
      return [
        { id: `${product.handle}-${photos.main}`, url: ROOT + photos.main },
        ...photos.details.map((file) => ({
          id: `${product.handle}-${file}`,
          url: GALLERY + file,
        })),
      ] as HttpTypes.StoreProductImage[]
    }

    // Pura 90 曜石黑 continues to use the original product image gallery.
    if (product.handle === "huawei-pura-90-pro-max") return original
  }

  // Preserve default variant image handling for unrelated products.
  if (!variant?.images?.length) return original
  const ids = new Set(variant.images.map((image) => image.id))
  const filtered = original.filter((image) => ids.has(image.id))
  return filtered.length ? filtered : original
}

export default function VariantImageGallery({ product }: { product: HttpTypes.StoreProduct }) {
  const searchParams = useSearchParams()
  const variantId = searchParams.get("v_id") ?? undefined
  const images = useMemo(() => getImagesForVariant(product, variantId), [product, variantId])
  return (
    <ImageGallery
      key={variantId ?? "default"}
      images={images}
      thumbnail={product.thumbnail}
      title={product.title}
    />
  )
}
