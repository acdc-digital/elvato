Order Confirmation in Storefront
In this guide, you'll learn how to show the different order details on the order confirmation page.

After the customer completes the checkout process and places an order, you can show an order confirmation page to display the order details.

Retrieve Order Details#
To show the order details, you need to retrieve the order by sending a request to the Get an Order API route.

You need the order's ID to retrieve the order. You can pass it from the complete cart step or store it in the localStorage.

The following example assumes you already have the order ID:

Tip: Learn how to install and configure the JS SDK in the JS SDK documentation.
React
JS SDK
"use client" // include with Next.js 13+

import { HttpTypes } from "@medusajs/types"
import { useEffect } from "react"
import { useState } from "react"

export function OrderConfirmation({ id }: { id: string }) {
  const [order, setOrder] = useState<HttpTypes.StoreOrder | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sdk.store.order.retrieve(id)
    .then(({ order: dataOrder }) => {
      setOrder(dataOrder)
      setLoading(false)
    })
  }, [id])
  
  return (
    <div>
      {loading && <span>Loading...</span>}
      {!loading && order && (
        <div>
          <h1>Order Confirmation</h1>
          <p>Order ID: {order.id}</p>
          <p>Order Date: {order.created_at.toLocaleString()}</p>
          <p>Order Customer: {order.email}</p>
          {/* TODO show more info */}
        </div>
      )}
    </div>
  )
}
In the above example, you retrieve the order's details from the Get an Order API route. Then, in the React example, you show the order details like the order ID, order date, and customer email.

The rest of this guide will expand on the React example to show more order details.

Tip: Refer to the Order schema in the API reference for all the available order fields.
Show Order Items#
An order has an items field that contains the order items. You can show the order items on the order confirmation page.

For example, add to the React component a formatPrice function to format prices with the order's currency:

Code
const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: order?.currency_code,
  })
  .format(amount)
}
Since this is the same function used to format the prices of products and cart totals, you can define the function in one place and re-use it where necessary. In that case, make sure to pass the currency code as a parameter.

Then, you can show the order items in a list:

Code
return (
  <div>
    {loading && <span>Loading...</span>}
    {!loading && order && (
      <div>
        {/* ... */}
        <p>
          <span>Order Items</span>
          <ul>
            {order.items?.map((item) => (
              <li key={item.id}>
                {item.title} - {item.quantity} x {formatPrice(item.unit_price)}
              </li>
            ))}
          </ul>
        </p>
        {/* TODO show more details */}
      </div>
    )}
  </div>
)
In the above example, you show the order items in a list, displaying the item's title, quantity, and unit price formatted with the formatPrice function.

Locale of Order Items#

Prerequisites
1
Translation Module Configured↗
When you complete the cart, items in the order will be in the locale that was set for the cart. This ensures that the customer sees the order details in their preferred language.

If no locale was set for the cart, then the order's items will be in the original product content.

Show Order Totals#
An order has various fields for the order totals, which you can check out in the Order schema in the Store API reference. The most commonly used fields are:

Field	Description
subtotal

The order's subtotal before discounts, excluding taxes. Calculated as the sum of item_subtotal and shipping_subtotal.

discount_total

The total amount of discounts applied to the order, including the tax portion of discounts.

shipping_total

The sum of all shipping methods' totals after discounts, including taxes.

tax_total

The order's tax total after discounts. Calculated as the sum of item_tax_total and shipping_tax_total.

total

The order's final total after discounts and credit lines, including taxes.

You can show these totals on the order confirmation page. For example:

Code
return (
  <div>
    {loading && <span>Loading...</span>}
    {!loading && order && (
      <div>
        {/* ... */}
        <div>
          <span>Order Totals</span>
          <ul>
            <li>
              <span>Subtotal (excl. taxes)</span>
              <span>{formatPrice(order.subtotal ?? 0)}</span>
            </li>
            <li>
              <span>Discounts</span>
              <span>{formatPrice(order.discount_total ?? 0)}</span>
            </li>
            <li>
              <span>Shipping</span>
              <span>{formatPrice(order.shipping_total ?? 0)}</span>
            </li>
            <li>
              <span>Taxes</span>
              <span>{formatPrice(order.tax_total ?? 0)}</span>
            </li>
            <li>
              <span>Total</span>
              <span>{formatPrice(order.total ?? 0)}</span>
            </li>
          </ul>
        </div>
      </div>
    )}
  </div>
)
In the above example, you show the order totals in a list, displaying the subtotal, discounts, shipping, taxes, and total amount formatted with the formatPrice function.

