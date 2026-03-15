const ADDRESS_FIELDS = [
  "first_name",
  "last_name",
  "address_1",
  "company",
  "postal_code",
  "city",
  "country_code",
  "province",
  "phone",
] as const

export default function compareAddresses(address1: any, address2: any) {
  return ADDRESS_FIELDS.every((f) => address1?.[f] === address2?.[f])
}
