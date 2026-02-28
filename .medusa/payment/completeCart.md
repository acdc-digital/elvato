Checkout Step 5: Complete Cart
In this guide, you'll learn how to complete the cart and place the order. This is the last step of your checkout flow.

How to Complete Cart in Storefront Checkout#
Once you finish any required actions with the third-party payment provider, you can complete the cart and place the order.

To complete the cart, send a request to the Complete Cart API route. For example:

Tip: Learn how to install and configure the JS SDK in the JS SDK documentation.
Code
sdk.store.cart.complete(cart.id)
.then((data) => {
  if (data.type === "cart" && data.cart) {
    // an error occurred
    console.error(data.error)
  } else if (data.type === "order" && data.order) {
    // TODO redirect to order success page
    alert("Order placed.")
    console.log(data.order)
    // unset cart ID from local storage
    localStorage.removeItem("cart_id")
  }
})
In the response of the request, the type field determines whether the cart completion was successful:

If the type is cart, it means the cart completion failed. The error response field holds the error details.
If the type is order, it means the cart was completed and the order was placed successfully.
When the cart completion is successful, it's important to unset the cart ID from the localStorage, as the cart is no longer usable.

Order's Locale after Cart Completion#

Prerequisites
1
Translation Module Configured↗
When you complete the cart, items in the order will be in the locale that was set for the cart. This ensures that the customer sees the order details in their preferred language.

If no locale was set for the cart, then the order's items will be in the original product content.

React Example with Default System Payment Provider#
For example, to complete the cart when the default system payment provider is used:

Tip: This example uses the useCart hook defined in the Cart React Context guide.
Code
"use client" // include with Next.js 13+

import { useState } from "react"
import { useCart } from "@/providers/cart"
import { sdk } from "@/lib/sdk"

export default function SystemDefaultPayment() {
  const { cart, refreshCart } = useCart()
  const [loading, setLoading] = useState(false)

  const handlePayment = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault()

    if (!cart) {
      return
    }

    setLoading(true)
    
    // TODO perform any custom payment handling logic
    
    // complete the cart
    sdk.store.cart.complete(cart.id)
    .then((data) => {
      if (data.type === "cart" && data.cart) {
        // an error occurred
        console.error(data.error)
      } else if (data.type === "order" && data.order) {
        // TODO redirect to order success page
        alert("Order placed.")
        console.log(data.order)
        refreshCart()
      }
    })
    .finally(() => setLoading(false))
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
    >
      Place Order
    </button>
  )
}
In the example above, you create a handlePayment function in the payment component. In this function, you:

Optionally perform any required actions with the third-party payment provider. For example, authorize the payment. For the default system payment provider, no actions are required.
Send a request to the Complete Cart API route once all actions with the third-party payment provider are performed.
In the received response of the request, if the type is cart, it means that the cart completion failed. The error is set in the error response field.
If the type is order, it means the card was completed and the order was placed successfully. You can access the order in the order response field.
When the order is placed, you must unset the cart_id from the localStorage. You can redirect the customer to an order success page at this point. The redirection logic depends on the storefront framework you're using.
React Example with Third-Party Payment Provider#
Refer to the Stripe guide for an example on integrating a third-party provider and implementing card completion.

Checkout Step 5: Complete Cart
In this guide, you'll learn how to complete the cart and place the order. This is the last step of your checkout flow.

How to Complete Cart in Storefront Checkout#
Once you finish any required actions with the third-party payment provider, you can complete the cart and place the order.

To complete the cart, send a request to the Complete Cart API route. For example:

Tip: Learn how to install and configure the JS SDK in the JS SDK documentation.
Code
sdk.store.cart.complete(cart.id)
.then((data) => {
  if (data.type === "cart" && data.cart) {
    // an error occurred
    console.error(data.error)
  } else if (data.type === "order" && data.order) {
    // TODO redirect to order success page
    alert("Order placed.")
    console.log(data.order)
    // unset cart ID from local storage
    localStorage.removeItem("cart_id")
  }
})
In the response of the request, the type field determines whether the cart completion was successful:

If the type is cart, it means the cart completion failed. The error response field holds the error details.
If the type is order, it means the cart was completed and the order was placed successfully.
When the cart completion is successful, it's important to unset the cart ID from the localStorage, as the cart is no longer usable.

Order's Locale after Cart Completion#

Prerequisites
1
Translation Module Configured↗
When you complete the cart, items in the order will be in the locale that was set for the cart. This ensures that the customer sees the order details in their preferred language.

If no locale was set for the cart, then the order's items will be in the original product content.

React Example with Default System Payment Provider#
For example, to complete the cart when the default system payment provider is used:

Tip: This example uses the useCart hook defined in the Cart React Context guide.
Code
"use client" // include with Next.js 13+

import { useState } from "react"
import { useCart } from "@/providers/cart"
import { sdk } from "@/lib/sdk"

export default function SystemDefaultPayment() {
  const { cart, refreshCart } = useCart()
  const [loading, setLoading] = useState(false)

  const handlePayment = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault()

    if (!cart) {
      return
    }

    setLoading(true)
    
    // TODO perform any custom payment handling logic
    
    // complete the cart
    sdk.store.cart.complete(cart.id)
    .then((data) => {
      if (data.type === "cart" && data.cart) {
        // an error occurred
        console.error(data.error)
      } else if (data.type === "order" && data.order) {
        // TODO redirect to order success page
        alert("Order placed.")
        console.log(data.order)
        refreshCart()
      }
    })
    .finally(() => setLoading(false))
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
    >
      Place Order
    </button>
  )
}
In the example above, you create a handlePayment function in the payment component. In this function, you:

Optionally perform any required actions with the third-party payment provider. For example, authorize the payment. For the default system payment provider, no actions are required.
Send a request to the Complete Cart API route once all actions with the third-party payment provider are performed.
In the received response of the request, if the type is cart, it means that the cart completion failed. The error is set in the error response field.
If the type is order, it means the card was completed and the order was placed successfully. You can access the order in the order response field.
When the order is placed, you must unset the cart_id from the localStorage. You can redirect the customer to an order success page at this point. The redirection logic depends on the storefront framework you're using.
React Example with Third-Party Payment Provider#
Refer to the Stripe guide for an example on integrating a third-party provider and implementing card completion.
