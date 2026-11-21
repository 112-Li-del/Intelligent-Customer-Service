"use client"

import { HttpTypes } from "@medusajs/types"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import ImageGallery from "."

type PhotoSet = { main: string; details: string[] }
type ProductPhotoConfig = Record<string, PhotoSet>

// 商品主图均在 /catalog-preview；详情图均在 /catalog-preview/gallery。
const PHOTO_CONFIG: Record<string, ProductPhotoConfig> = {
  "huawei-pura-90-pro-max": {
    "晨曦金": { main: "gold-main", details: ["gold1", "gold2", "gold3"] },
    "霞光紫": { main: "purple-main", details: ["purple2", "purple3", "purple4"] },
    "橘子海": { main: "orange-main", details: ["orange2", "orange3", "orange4"] },
    "翡翠湖": { main: "green-main", details: ["green2", "green3", "green4"] },
  },
  "huawei-mate-90-pro-max": {
    "曜石黑": { main: "black-main", details: ["black-angle1", "black-angle2", "black-angle3", "black-angle4"] },
    "玫瑰金": { main: "gold-main", details: ["gold-angle1", "gold-angle2", "gold-angle3", "gold-angle4"] },
    "翡冷翠": { main: "green-main", details: ["green-angle1", "green-angle2", "green-angle3", "green-angle4"] },
    "晶钻白": { main: "white-main", details: ["white-angle1", "white-angle2", "white-angle3", "white-angle4"] },
  },
  "huawei-pura-x-view": {
    "幻夜黑": { main: "black-main", details: ["black-angle1", "black-angle2", "black-angle3", "black-angle4"] },
    "跃影红": { main: "red-main", details: ["red-angle1", "red-angle2", "red-angle3", "red-angle4"] },
    "亚麻灰": { main: "grey-main", details: ["grey-angle1", "grey-angle2", "grey-angle3", "grey-angle4"] },
    "零度白": { main: "white-main", details: ["white-angle1", "white-angle2", "white-angle3", "white-angle4"] },
  },
}

function getImagesForVariant(product: HttpTypes.StoreProduct, selectedVariantId?: string): HttpTypes.StoreProductImage[] {
  const original = product.thumbnail
    ? ([{ id: "product-main-thumbnail", url: product.thumbnail },
        ...(product.images ?? []).filter((image) => image.url !== product.thumbnail)] as HttpTypes.StoreProductImage[])
    : (product.images ?? [])

  const variant = product.variants?.find((item) => item.id === selectedVariantId)
  const mappings = product.handle ? PHOTO_CONFIG[product.handle] : undefined
  if (mappings) {
    const colorOption = product.options?.find((option) => option.title === "颜色")
    const chosen = variant?.options?.find((option) => option.option_id === colorOption?.id)?.value
    const selected = chosen ? mappings[chosen] : undefined
    const fallbackColor = product.handle === "huawei-mate-90-pro-max" ? "曜石黑" : "幻夜黑"
    const photos = selected ?? (product.handle === "huawei-pura-90-pro-max" ? undefined : mappings[fallbackColor])
    if (photos) {
      const names = [{ name: photos.main, main: true }, ...photos.details.map((name) => ({ name, main: false }))]
      return names.map(({ name, main }) => ({
        id: `${product.handle}-${name}`,
        url: `${main ? "/catalog-preview" : "/catalog-preview/gallery"}/${product.handle}-${name}.webp`,
      })) as HttpTypes.StoreProductImage[]
    }
    // Original Pura 90 曜石黑 image/gallery records, unchanged.
    if (product.handle === "huawei-pura-90-pro-max") return original
  }

  if (!variant?.images?.length) return original
  const ids = new Set(variant.images.map((image) => image.id))
  const filtered = original.filter((image) => ids.has(image.id))
  return filtered.length ? filtered : original
}

export default function VariantImageGallery({ product }: { product: HttpTypes.StoreProduct }) {
  const searchParams = useSearchParams()
  const variantId = searchParams.get("v_id") ?? undefined
  const images = useMemo(() => getImagesForVariant(product, variantId), [product, variantId])
  return <ImageGallery key={variantId ?? "default"} images={images} thumbnail={product.thumbnail} title={product.title} />
}
