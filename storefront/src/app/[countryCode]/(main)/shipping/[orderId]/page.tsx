import { retrieveCustomer } from "@lib/data/customer"
import ConvexClientProvider from "@lib/providers/convex-provider"
import ShippingLoginPrompt from "@modules/shipping/components/shipping-login-prompt"
import ShipmentTracker from "@modules/shipping/templates/shipment-tracker"

export const metadata = {
  title: "Track Shipment | Elvato",
  description: "Track your shipment in real-time.",
}

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ countryCode: string; orderId: string }>
}) {
  const { orderId } = await params
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return <ShippingLoginPrompt />
  }

  return (
    <ConvexClientProvider>
      <ShipmentTracker medusaOrderId={orderId} />
    </ConvexClientProvider>
  )
}
