import { readFileSync, readdirSync, writeFileSync } from "node:fs"

const directory = new URL("./", import.meta.url)
const source = new URL("../apps/storefront/src/lib/data/apparel-size-guides.json", directory)
const { caption, fitNote, products } = JSON.parse(readFileSync(source, "utf8"))
const checking = process.argv.includes("--check")
const outOfDate = []

const start = "<!-- apparel-size-guide:start -->"
const end = "<!-- apparel-size-guide:end -->"
const currentBlock = new RegExp(`\\n\\n${start}[\\s\\S]*?${end}`)

function read(file) {
  return readFileSync(new URL(file, directory), "utf8").replace(/\r\n/g, "\n")
}

function emit(file, content, existing) {
  if (content === existing) return
  if (checking) outOfDate.push(file)
  else writeFileSync(new URL(file, directory), content, "utf8")
}

const guides = new Map()
for (const [handle, { columns, rows }] of Object.entries(products)) {
  if (
    rows.map(([size]) => size).join(",") !== "S,M,L,XL" ||
    rows.some((row) => row.length !== columns.length)
  ) throw new Error(`Invalid size guide for ${handle}`)

  const file = `products/${handle}.md`
  const existing = read(file)
  if (!existing.includes('status: "approved"')) throw new Error(`Unapproved product: ${file}`)

  const rowMarkdown = (cells) => `| ${cells.join(" | ")} |`
  const section = [
    start,
    `## ${caption}`,
    "",
    rowMarkdown(columns),
    rowMarkdown(columns.map(() => "---")),
    ...rows.map(rowMarkdown),
    "",
    fitNote,
    end,
  ].join("\n")
  const next = `${existing.replace(currentBlock, "").trimEnd()}\n\n${section}\n`
  emit(file, next, existing)
  guides.set(file, next)
}

const documents = []
for (const folder of ["products", "policies"]) {
  for (const name of readdirSync(new URL(`${folder}/`, directory)).sort()) {
    if (!name.endsWith(".md")) continue
    const file = `${folder}/${name}`
    const contents = guides.get(file) ?? read(file)
    const frontmatter = contents.match(/^---\n([\s\S]*?)\n---\n/)
    if (!frontmatter?.[1].includes('status: "approved"')) continue
    documents.push(
      contents.slice(frontmatter[0].length)
        .replace(/^#{1,5}(?= )/gm, "#$&")
        .replace(/^<!-- apparel-size-guide:(?:start|end) -->\n?/gm, "")
        .trim()
    )
  }
}

const overviewFile = "laicai_products_kb.md"
const overview = [
  "# 来财商城正式商品知识库",
  "",
  "由已审核的商品和政策文档汇总。入库时以独立文档为准。",
  "",
  documents.join("\n\n---\n\n"),
  "",
].join("\n")
let existingOverview
try {
  existingOverview = read(overviewFile)
} catch (error) {
  if (error.code !== "ENOENT") throw error
}
emit(overviewFile, overview, existingOverview)

if (outOfDate.length) {
  console.error("Size guides need regeneration:", outOfDate.join(", "))
  process.exitCode = 1
}
