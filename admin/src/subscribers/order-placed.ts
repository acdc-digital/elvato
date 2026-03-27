import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const orderModule = container.resolve(Modules.ORDER)

  const convexUrl = process.env.CONVEX_URL
  const webhookSecret = process.env.CONVEX_WEBHOOK_SECRET

  if (!convexUrl || !webhookSecret) {
    logger.warn(
      "Shipping tracking: CONVEX_URL or CONVEX_WEBHOOK_SECRET not set, skipping"
    )
    return
  }

  try {
    const order = await orderModule.retrieveOrder(data.id, {
      relations: ["items", "shipping_address"],
    })

    if (!order) {
      logger.warn(`Shipping tracking: Order ${data.id} not found`)
      return
    }

    const customerId = (order as any).customer_id
    if (!customerId) {
      logger.warn(
        `Shipping tracking: Order ${data.id} has no customer_id, skipping`
      )
      return
    }

    const orderItems = (order.items ?? []).map((item: any) => ({
      title: item.title ?? "Unknown Item",
      quantity: item.quantity ?? 1,
      unitPrice: item.unit_price ?? 0,
      thumbnail: item.thumbnail ?? undefined,
      sku: item.variant_sku ?? undefined,
    }))

    const shippingAddr = order.shipping_address
    const shippingAddress = shippingAddr
      ? {
          firstName: shippingAddr.first_name ?? "",
          lastName: shippingAddr.last_name ?? "",
          address1: shippingAddr.address_1 ?? "",
          address2: shippingAddr.address_2 ?? undefined,
          city: shippingAddr.city ?? "",
          postalCode: shippingAddr.postal_code ?? "",
          countryCode: shippingAddr.country_code ?? "",
          phone: shippingAddr.phone ?? undefined,
        }
      : {
          firstName: "",
          lastName: "",
          address1: "",
          city: "",
          postalCode: "",
          countryCode: "",
        }

    const payload = {
      medusaOrderId: order.id,
      medusaOrderDisplayId: order.display_id ?? 0,
      customerId,
      orderItems,
      orderTotal: (order as any).total ?? 0,
      currencyCode: (order as any).currency_code ?? "usd",
      orderDate: new Date(order.created_at).getTime(),
      shippingAddress,
    }

    const response = await fetch(`${convexUrl}/shipping/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": webhookSecret,
      },
      body: JSON.stringify({
        action: "create_shipment",
        payload,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      logger.error(
        `Shipping tracking: Convex webhook returned ${response.status}: ${text}`
      )
      return
    }

    logger.info(
      `Shipping tracking: Created shipment for order ${order.display_id} (${order.id})`
    )
  } catch (error: any) {
    logger.error(
      `Shipping tracking: Failed to create shipment for order ${data.id}: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
