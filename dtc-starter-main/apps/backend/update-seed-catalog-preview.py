
from pathlib import Path

source = Path("src/scripts/seed-catalog-preview.ts")
backup = Path("src/scripts/seed-catalog-preview.ts.before-huawei-variants.bak")

if not source.exists():
    raise FileNotFoundError(f"找不到源文件：{source}")

if backup.exists():
    raise FileExistsError(f"备份文件已存在，为避免覆盖，停止修改：{backup}")

original = source.read_text(encoding="utf-8")

anchor = 'const skuFor = (handle: string) => `ZX-${handle.toUpperCase()}`'

addition = '''const skuFor = (handle: string) => `ZX-${handle.toUpperCase()}`

const huaweiVariants = [
  { value: "12GB+256GB", sku: "ZX-HUAWEI-PURA-90-PRO-MAX-12-256", price: 6499 },
  { value: "12GB+512GB", sku: "ZX-HUAWEI-PURA-90-PRO-MAX-12-512", price: 6999 },
  { value: "16GB+512GB", sku: "ZX-HUAWEI-PURA-90-PRO-MAX-16-512", price: 7499 },
  { value: "16GB+1TB", sku: "ZX-HUAWEI-PURA-90-PRO-MAX-16-1TB", price: 8499 },
]'''

old_product_block = '''          options: [{ title: "款式", values: ["标准款"] }],
          variants: [{
            title: "标准款",
            sku: skuFor(item.handle),
            manage_inventory: true,
            options: { 款式: "标准款" },
            prices: [{ currency_code: "cny", amount: item.price }],
          }],'''

new_product_block = '''          options: item.handle === "huawei-pura-90-pro-max"
            ? [{
                title: "存储容量",
                values: huaweiVariants.map(({ value }) => value),
              }]
            : [{ title: "款式", values: ["标准款"] }],
          variants: item.handle === "huawei-pura-90-pro-max"
            ? huaweiVariants.map(({ value, sku, price }) => ({
                title: value,
                sku,
                manage_inventory: true,
                options: { 存储容量: value },
                prices: [{ currency_code: "cny", amount: price }],
              }))
            : [{
                title: "标准款",
                sku: skuFor(item.handle),
                manage_inventory: true,
                options: { 款式: "标准款" },
                prices: [{ currency_code: "cny", amount: item.price }],
              }],'''

old_inventory_block = '''  const previewSkus = catalog.filter((item) => item.category).map(({ handle }) => skuFor(handle))'''

new_inventory_block = '''  const previewSkus = catalog
    .filter((item) => item.category)
    .flatMap(({ handle }) =>
      handle === "huawei-pura-90-pro-max"
        ? huaweiVariants.map(({ sku }) => sku)
        : [skuFor(handle)]
    )'''

if original.count(anchor) != 1:
    raise RuntimeError("skuFor 定义位置不唯一，停止修改。")

if original.count(old_product_block) != 1:
    raise RuntimeError("商品规格代码与预期不一致，停止修改。")

if original.count(old_inventory_block) != 1:
    raise RuntimeError("库存 SKU 代码与预期不一致，停止修改。")

updated = original.replace(anchor, addition, 1)
updated = updated.replace(old_product_block, new_product_block, 1)
updated = updated.replace(old_inventory_block, new_inventory_block, 1)

backup.write_text(original, encoding="utf-8")
source.write_text(updated, encoding="utf-8")

print("修改成功")
print("原文件备份：", backup)
print("已配置华为规格：", len(huaweiVariants))
for variant in huaweiVariants:
    print(variant["value"], variant["sku"], variant["price"])
print("原有商品的标准款逻辑已保留")
