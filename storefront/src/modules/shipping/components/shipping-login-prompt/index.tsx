import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@medusajs/ui"

const ShippingLoginPrompt = () => {
  return (
    <div className="flex-1 small:py-12" data-testid="shipping-login-prompt">
      <div className="content-container max-w-lg mx-auto flex flex-col items-center py-16 gap-y-6">
        {/* Package icon */}
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
        </div>

        <h1
          className="text-2xl-semi font-sans text-center"
          data-testid="shipping-login-heading"
        >
          Track Your Orders
        </h1>

        <p className="text-base-regular text-ui-fg-subtle text-center max-w-sm">
          Sign in to view your shipping details and track your orders in
          real-time.
        </p>

        <LocalizedClientLink href="/account">
          <Button
            variant="secondary"
            className="mt-2"
            data-testid="shipping-sign-in-button"
          >
            Sign in
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default ShippingLoginPrompt
