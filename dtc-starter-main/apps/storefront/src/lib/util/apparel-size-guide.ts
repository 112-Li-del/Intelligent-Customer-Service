import guides from "@lib/data/apparel-size-guides.json"

const products: Readonly<Record<string, { columns: string[]; rows: string[][] }>> = guides.products

export function getApparelSizeGuide(handle: string) {
  if (!Object.hasOwn(products, handle)) return undefined
  const guide = products[handle]
  return { caption: guides.caption, fitNote: guides.fitNote, ...guide }
}
