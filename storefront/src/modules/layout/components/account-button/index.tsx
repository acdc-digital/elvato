import { retrieveCustomer } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@/components/ui/button"

export default async function AccountButton() {
  const customer = await retrieveCustomer()

  if (customer) {
    const initials = [customer.first_name, customer.last_name]
      .filter(Boolean)
      .map((n) => n![0].toUpperCase())
      .join("")

    const displayName = customer.first_name
      ? customer.first_name.toUpperCase()
      : "ACCOUNT"

    return (
      <Button
        variant="link"
        asChild
        className="font-mono uppercase tracking-wider text-black"
      >
        <LocalizedClientLink href="/account" data-testid="nav-account-link">
          <span className="flex items-center gap-x-1.5">
            {/* Subtle signed-in avatar */}
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-black text-white text-[9px] font-bold leading-none select-none"
              title={`Signed in as ${customer.email}`}
            >
              {initials || "✓"}
            </span>
            {displayName}
          </span>
        </LocalizedClientLink>
      </Button>
    )
  }

  return (
    <Button
      variant="link"
      asChild
      className="font-mono uppercase tracking-wider text-black"
    >
      <LocalizedClientLink href="/account" data-testid="nav-account-link">
        ACCOUNT
      </LocalizedClientLink>
    </Button>
  )
}
