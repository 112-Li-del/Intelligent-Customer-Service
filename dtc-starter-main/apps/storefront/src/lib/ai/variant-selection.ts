type Option = { value?: string | null }
type Variant = { title?: string | null; options?: Option[] | null }

function normalize(text: string) {
  return text.normalize("NFKC").toLowerCase().replace(/\s+/g, "").replace(/(\d)([gt])b?/g, "$1$2b")
}

// Only skip analysis when every word belongs to the product, its options or the live lookup.
export function isLiveOnly(query: string, namesAndOptions: string[]) {
  let rest = normalize(query)
  for (const label of namesAndOptions.map(normalize).filter(Boolean).sort((a, b) => b.length - a.length)) {
    rest = rest.split(label).join("")
  }
  rest = rest.replace(/多少钱|什么价|售价|到手价|价格|报价|库存|有货|现货|缺货|能下单|还有吗|典藏版|标准版|多少|有吗|请问|这款|这个|现在|目前|[黑白红蓝紫绿灰金银粉黄橙棕青]色|\d+[gt]b|[吗呢的和是有？?，,、。+]/g, "")
  return rest === ""
}

// Apply every requested dimension to the same SKU. Alternatives within one dimension are ORed.
export function selectVariants<T extends Variant>(query: string, variants: T[]) {
  const text = normalize(query)
  const labels = variants.flatMap(v => v.options ?? []).map(o => o.value?.trim()).filter((v): v is string => !!v)
  const colors = Array.from(new Set(labels.filter(v => /[黑白红蓝紫绿灰金银粉黄橙棕青翠]$/.test(v))))
  const exactColors = colors.filter(value => text.includes(normalize(value)))
  const colorTerms = exactColors.length ? exactColors : Array.from(text.matchAll(/([黑白红蓝紫绿灰金银粉黄橙棕青])色/g), m => m[1])
  const capacities = Array.from(text.matchAll(/\d+[gt]b/g), m => m[0])
  const editions = Array.from(text.matchAll(/标准版|典藏版/g), m => m[0])
  const sizes = Array.from(text.matchAll(/(?:^|[^a-z])(xxxl|xxl|xl|xs|s|m|l)(?=码|号|[^a-z0-9]|$)/g), m => m[1])
  const storage = capacities.filter(v => parseInt(v) >= 32 || v.endsWith("tb"))
  const memory = capacities.filter(v => !storage.includes(v))
  const matches = variants.filter(variant => {
    const values = (variant.options ?? []).map(o => normalize(o.value ?? ""))
    const label = normalize([variant.title, ...values].join(" "))
    const amounts: string[] = label.match(/\d+[gt]b/g) ?? []
    return (!colorTerms.length || colorTerms.some(c => label.includes(normalize(c)))) &&
      (!editions.length || editions.some(e => label.includes(e))) &&
      (!storage.length || storage.some(v => amounts.includes(v))) &&
      (!memory.length || memory.some(v => amounts.includes(v))) &&
      (!sizes.length || sizes.some(v => values.includes(v) || normalize(variant.title ?? "") === v))
  })
  return matches
}
