
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import catalog from "./catalog-preview-products.json"

const galleryViews = ["angle", "detail", "context"]

const imageRoot = resolve(
  process.cwd(),
  "../storefront/public/catalog-preview"
)

const applyChanges = (process.env.SYNC_CATALOG_IMAGES_APPLY ?? "").trim() === "1"
console.log("执行开关实际读取值：", process.env.SYNC_CATALOG_IMAGES_APPLY)

export default async function syncCatalogPreviewImages({
  container,
}: {
  container: MedusaContainer
}) {
  if (!existsSync(imageRoot)) {
    throw new Error(
      `图片目录不存在，请检查运行目录：${imageRoot}`
    )
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const handles = catalog.map(({ handle }) => handle)

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "handle",
      "thumbnail",
      "images.id",
      "images.url",
      "images.rank",
    ],
    filters: { handle: handles },
  })

  const productMap = new Map(
    products.map((product) => [product.handle, product])
  )

  let updatedCount = 0
  let skippedCount = 0
  let missingProductCount = 0
  let missingImageCount = 0

  console.log(`图片目录：${imageRoot}`)
  console.log(`运行模式：${applyChanges ? "正式同步" : "仅预览"}`)
  console.log(`配置商品数：${handles.length}`)
  console.log(`数据库找到商品数：${products.length}`)

  for (const handle of handles) {
    const product = productMap.get(handle)

    if (!product) {
      console.warn(`[商品不存在，跳过] ${handle}`)
      missingProductCount++
      continue
    }

    const images = (product.images ?? []).filter(Boolean)
    const existingUrls = new Set(images.map(({ url }) => url))

    const candidates = [
      {
        url: `/catalog-preview/${handle}.webp`,
        file: resolve(imageRoot, `${handle}.webp`),
        type: "主图",
      },
      ...galleryViews.map((view) => ({
        url: `/catalog-preview/gallery/${handle}-${view}.webp`,
        file: resolve(
          imageRoot,
          "gallery",
          `${handle}-${view}.webp`
        ),
        type: `详情图-${view}`,
      })),
    ]

    const validImages = candidates.filter((item) => {
      if (!existsSync(item.file)) {
        console.warn(
          `[文件不存在，跳过] ${handle} ${item.type}: ${item.file}`
        )
        missingImageCount++
        return false
      }
      return true
    })

    const firstNewRank =
      Math.max(-1, ...images.map(({ rank }) => rank ?? 0)) + 1

    const additions = validImages
      .filter(({ url }) => !existingUrls.has(url))
      .map(({ url }, index) => ({
        url,
        rank: firstNewRank + index,
      }))

    const mainImage = validImages.find(
      ({ type }) => type === "主图"
    )

    const needsThumbnail =
      !product.thumbnail && Boolean(mainImage)

    if (additions.length === 0 && !needsThumbnail) {
      console.log(`[无需更新] ${handle}`)
      skippedCount++
      continue
    }

    console.log(
      `[${applyChanges ? "准备同步" : "预览"}] ${handle}：新增图片 ${additions.length} 张` +
      (needsThumbnail ? "，补充主图缩略图" : "")
    )

    if (applyChanges) {
      await updateProductsWorkflow(container).run({
        input: {
          selector: { id: product.id },
          update: {
            ...(additions.length
              ? { images: [...images, ...additions] }
              : {}),
            ...(needsThumbnail
              ? { thumbnail: mainImage!.url }
              : {}),
          },
        },
      })

      updatedCount++
    }
  }

  console.log("========== 图片同步统计 ==========")
  console.log(`已找到商品：${products.length}`)
  console.log(`已更新商品：${updatedCount}`)
  console.log(`无需更新商品：${skippedCount}`)
  console.log(`不存在商品：${missingProductCount}`)
  console.log(`不存在图片文件：${missingImageCount}`)
  console.log(
    applyChanges
      ? "正式同步执行完毕"
      : "当前为预览模式，数据库没有被修改"
  )
}
