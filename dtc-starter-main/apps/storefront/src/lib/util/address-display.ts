type Address = {
  first_name?: string | null
  last_name?: string | null
  country_code?: string | null
  province?: string | null
  city?: string | null
  address_1?: string | null
  address_2?: string | null
  postal_code?: string | null
}

const regionNames = new Intl.DisplayNames(["zh-CN"], { type: "region" })

export const displayCountry = (code?: string | null) => {
  if (code?.toLowerCase() === "cn") return "中国大陆"
  return code && /^[a-z]{2}$/i.test(code) ? regionNames.of(code.toUpperCase()) : code
}

export const displayAddress = (address?: Address | null) => {
  if (!address) return { name: "", address: "", postalCode: "" }

  const isChina = address.country_code?.toLowerCase() === "cn"
  const parts = isChina
    ? [displayCountry(address.country_code), address.province, address.city, address.address_2, address.address_1]
    : [address.address_1, address.address_2, address.city, address.province, displayCountry(address.country_code)]
  const names = isChina ? [address.last_name, address.first_name] : [address.first_name, address.last_name]

  return {
    name: names.filter(Boolean).join(isChina ? "" : " "),
    address: parts.filter(Boolean).join(" "),
    postalCode: address.postal_code ?? "",
  }
}
