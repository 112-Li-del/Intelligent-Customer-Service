"use client"

import { HttpTypes } from "@medusajs/types"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import ImageGallery from "."

type PhotoSet = { main: string; details: string[] }
type ProductPhotoConfig = Record<string, PhotoSet>

const PHOTO_CONFIG: Record<string, ProductPhotoConfig> = {
  "huawei-changxiang-100-pro": {
    "幻夜黑": { main: "black", details: ["black-angle1", "black-angle2", "black-angle3", "black-angle4"] },
    "雀翎蓝": { main: "blue", details: ["blue-angle1", "blue-angle2", "blue-angle3", "blue-angle4"] },
    "羽砂紫": { main: "purple", details: ["purple-angle1", "purple-angle2", "purple-angle3", "purple-angle4"] },
    "羽砂白": { main: "white", details: ["white-angle1", "white-angle2", "white-angle3", "white-angle4"] },
  },
  "huawei-changxiang-90-pro-max": {
    "曜金黑": { main: "black", details: ["black-angle1", "black-angle2", "black-angle3", "black-angle4"] },
    "晨曦金": { main: "golden", details: ["golden-angle1", "golden-angle2", "golden-angle3", "golden-angle4"] },
    "飞天青": { main: "green", details: ["green-angle1", "green-angle2", "green-angle3", "green-angle4"] },
    "雪域白": { main: "white", details: ["white-angle1", "white-angle2", "white-angle3", "white-angle4"] },
  },
  "huawei-mate-90-pro-max": {
    "曜石黑": { main: "black", details: ["black-angle1", "black-angle2", "black-angle3", "black-angle4"] },
    "玫瑰金": { main: "golden", details: ["golden-angle1", "golden-angle2", "golden-angle3", "golden-angle4"] },
    "翡冷翠": { main: "green", details: ["green-angle1", "green-angle2", "green-angle3", "green-angle4"] },
    "晶钻白": { main: "white", details: ["white-angle1", "white-angle2", "white-angle3", "white-angle4"] },
  },
  "huawei-nova-16-se": {
    "星空黑": { main: "black", details: ["black-angle1", "black-angle2", "black-angle3", "black-angle4"] },
    "天际白": { main: "white", details: ["white-angle1", "white-angle2", "white-angle3", "white-angle4"] },
    "破晓橙": { main: "orange", details: ["orange-angle1", "orange-angle2", "orange-angle3", "orange-angle4"] },
    "樱雪晴空": { main: "color", details: ["color-angle1", "color-angle2", "color-angle3", "color-angle4"] },
  },
  "huawei-nova-16": {
    "星空黑": { main: "black", details: ["black-angle1", "black-angle2", "black-angle3", "black-angle4"] },
    "晴空蓝": { main: "blue", details: ["blue-angle1", "blue-angle2", "blue-angle3", "blue-angle4"] },
    "幻彩贝母": { main: "color", details: ["color-angle1", "color-angle2", "color-angle3", "color-angle4"] },
    "天际白": { main: "white", details: ["white-angle1", "white-angle2", "white-angle3", "white-angle4"] },
  },
  "huawei-osta-o1-pro": {
    "星空黑": { main: "black", details: ["black-angle1", "black-angle2", "black-angle3", "black-angle4"] },
    "星芒紫": { main: "purple", details: ["purple-angle1", "purple-angle2", "purple-angle3", "purple-angle4"] },
    "星云白": { main: "white", details: ["white-angle1", "white-angle2", "white-angle3", "white-angle4"] },
  },
  "huawei-pura-90-pro": {
    "桑果黑": { main: "black", details: ["black-angle1", "black-angle2", "black-angle3", "black-angle4"] },
    "橘子汽水": { main: "orange", details: ["orange-angle1", "orange-angle2", "orange-angle3", "orange-angle4"] },
    "粉红芭乐": { main: "pink", details: ["pink-angle1", "pink-angle2", "pink-angle3", "pink-angle4"] },
    "椰青白": { main: "white", details: ["white-angle1", "white-angle2", "white-angle3", "white-angle4"] },
  },
  "huawei-pura-x-max": {
    "幻夜黑": { main: "black", details: ["black-angle1", "black-angle2", "black-angle3", "black-angle4"] },
    "零度白": { main: "white", details: ["white-angle1", "white-angle2", "white-angle3", "white-angle4"] },
    "星际蓝": { main: "blue", details: ["blue-angle1", "blue-angle2", "blue-angle3", "blue-angle4"] },
    "橄榄金": { main: "golden", details: ["golden-angle1", "golden-angle2", "golden-angle3", "golden-angle4"] },
    "活力橙": { main: "orange", details: ["orange-angle1", "orange-angle2", "orange-angle3", "orange-angle4"] },
  },
  "huawei-pura-x-view": {
    "幻夜黑": { main: "black", details: ["black-angle1", "black-angle2", "black-angle3", "black-angle4"] },
    "跃影红": { main: "red", details: ["red-angle1", "red-angle2", "red-angle3", "red-angle4"] },
    "亚麻灰": { main: "grey", details: ["grey-angle1", "grey-angle2", "grey-angle3", "grey-angle4"] },
    "零度白": { main: "white", details: ["white-angle1", "white-angle2", "white-angle3", "white-angle4"] },
  },
}

const MAIN_FOLDER = "/catalog-preview"
const GALLERY_FOLDER = "/catalog-preview/gallery"

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
): HttpTypes.StoreProductImage[] {
  const original = product.thumbnail
    ? ([{ id: "product-main-thumbnail", url: product.thumbnail },
        ...(product.images ?? []).filter((image) => image.url !== product.thumbnail)] as HttpTypes.StoreProductImage[])
    : (product.images ?? [])

  const variant = product.variants?.find((item) => item.id === selectedVariantId)
  const mappings = product.handle ? PHOTO_CONFIG[product.handle] : undefined
  if (mappings) {
    const colorOption = product.options?.find((option) => option.title === "颜色")
    const chosen = variant?.options?.find(
      (option) => option.option_id === colorOption?.id
    )?.value
    const photos = chosen ? mappings[chosen] : undefined
    if (photos) {
      const names = [
        { name: photos.main, main: true },
        ...photos.details.map((name) => ({ name, main: false })),
      ]
      return names.map(({ name, main }) => ({
        id: `${product.handle}-${chosen}-${name}`,
        url: `${main ? MAIN_FOLDER : GALLERY_FOLDER}/${product.handle}-${main ? `${name}-main` : name}.webp`,
      })) as HttpTypes.StoreProductImage[]
    }
  }

  // Keep the existing Pura 90 Pro Max mapping and all non-Huawei behavior intact.
  if (product.handle === "huawei-pura-90-pro-max" && selectedVariantId) {
    const colorOption = product.options?.find((option) => option.title === "颜色")
    const chosen = variant?.options?.find((option) => option.option_id === colorOption?.id)?.value
    const oldFiles: Record<string, string[]> = {
      "晨曦金": ["gold1", "gold2", "gold3"],
      "霞光紫": ["purple2", "purple3", "purple4"],
      "橘子海": ["orange2", "orange3", "orange4"],
      "翡翠湖": ["green2", "green3", "green4"],
    }
    const files = chosen ? oldFiles[chosen] : undefined
    if (files) {
      return files.map((name) => ({
        id: `huawei-pura-90-pro-max-${name}`,
        url: `${GALLERY_FOLDER}/huawei-pura-90-pro-max-${name}.webp`,
      })) as HttpTypes.StoreProductImage[]
    }
  }

  if (!variant?.images?.length) return original
  const ids = new Set(variant.images.map((image) => image.id))
  const filtered = original.filter((image) => ids.has(image.id))
  return filtered.length ? filtered : original
}

export default function VariantImageGallery({ product }: { product: HttpTypes.StoreProduct }) {
  const searchParams = useSearchParams()
  const variantId = searchParams.get("v_id") ?? undefined
  const images = useMemo(
    () => getImagesForVariant(product, variantId),
    [product, variantId]
  )
  return (
    <ImageGallery
      key={variantId ?? "default"}
      images={images}
      thumbnail={product.thumbnail}
      title={product.title}
    />
  )
}
