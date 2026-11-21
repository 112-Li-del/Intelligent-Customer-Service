# 华为两款新品导入包（Medusa 2.22.7）

## 已整理的内容

- HUAWEI Mate 90 Pro Max：4 配色 × 4 版本 = 16 个规格
- HUAWEI Pura X View：4 配色 × 3 容量 = 12 个规格
- 主图 8 张：`storefront/public/catalog-preview/`
- 详情图 32 张：`storefront/public/catalog-preview/gallery/`
- 所有 40 张图片已从伪装为 .webp 的 PNG 实际转换为标准 WebP，并检查可打开。
- 导入脚本：`backend/src/scripts/import-new-huawei-products.ts`
- 颜色与图片切换组件：`storefront/src/modules/products/components/image-gallery/variant-image-gallery.tsx`

## 保存位置（非常重要）

这份 ZIP 的最外层是 `backend` 和 `storefront` 两个文件夹。
应解压到项目的 `apps` 目录：

`D:\Intelligent-Customer-Service\dtc-starter-main\apps`

解压后应能看到：

`apps/backend/src/scripts/import-new-huawei-products.ts`

`apps/storefront/public/catalog-preview/huawei-mate-90-pro-max-black-main.webp`

`apps/storefront/public/catalog-preview/gallery/huawei-mate-90-pro-max-black-angle1.webp`

**不要将整个“华为新品导入包”文件夹作为子目录直接放在 apps 下。** 应将该文件夹里的 `backend` 和 `storefront` 两个目录合并到 apps 目录。

## 导入前的安全步骤

1. **备份数据库**，并保存原来的 `variant-image-gallery.tsx`。
2. 将本包文件复制到对应目录。**替换** `variant-image-gallery.tsx` 之前务必备份；新文件保留原华为 Pura 90 Pro Max 的配色切换映射。
3. 在 `apps/backend` PowerShell 中运行只读预检查：

   `npx medusa exec ./src/scripts/import-new-huawei-products.ts`

4. 检查输出应含 `"mode": "PREVIEW"`、两款商品和 `"total_expected_variants": 28`；**此时数据库没有修改**。
5. **只在检查和备份完成之后**运行真正的导入：

   `$env:NEW_HUAWEI_APPLY='YES'; try { npx medusa exec ./src/scripts/import-new-huawei-products.ts } finally { Remove-Item Env:\NEW_HUAWEI_APPLY -ErrorAction SilentlyContinue }`

6. 核对两款商品的 SKU、价格、库存项、销售渠道及前端图片切换；不能仅凭 DONE 提示判断完全验收成功。

> 此脚本涉及多个数据库工作流，并**不保证跨工作流的单一事务**。中途报错不要盲目再次运行或恢复整个数据库，应先检查当前状态。脚本按 handle 和固定 SKU 设计了基本的重复执行防护，但无法取代数据库备份。

## 注意

- 新商品默认每个规格的库存为 30 件，目标仓库 `European Warehouse`。如果实际库存不同，请在正式导入前修改 `STOCK` 常量。
- 价格和规格、描述来自用户提供的两份 Word 文档，未额外验证真实性。
- SKU 按新的唯一命名规则生成，不沿用旧商品 SKU。
- `版本容量` 与 `存储空间` 是这两款新商品的规格选项名称；颜色通过现有共享的“颜色”选项连接，以避免重复创建同名选项。
- 如果后台里已经存在同 handle 的商品且不是本脚本创建，脚本会停止以保护旧数据。
- 如果你不打算立即导入数据库，只解压图片也不会使新商品自动出现在商城。
