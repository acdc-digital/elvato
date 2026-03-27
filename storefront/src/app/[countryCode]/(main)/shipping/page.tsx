import { retrieveCustomer } from "@lib/data/customer"
import ConvexClientProvider from "@lib/providers/convex-provider"
import ShippingLoginPrompt from "@modules/shipping/components/shipping-login-prompt"
import ShippingDashboard from "@modules/shipping/templates/shipping-dashboard"

export const metadata = {
  title: "Shipping | Elvato",
  description: "Track your orders and view shipping details in real-time.",
}

export default async function ShippingPage() {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return <ShippingLoginPrompt />
  }

  return (
    <ConvexClientProvider>
      <ShippingDashboard customerId={customer.id} />
    </ConvexClientProvider>
  )
}
