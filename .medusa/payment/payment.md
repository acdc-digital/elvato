Payment
In this document, you’ll learn what a payment is and how it's created, captured, and refunded.

What's a Payment?#
When a payment session is authorized, a payment, represented by the Payment data model, is created. This payment can later be captured or refunded.

A payment carries many of the data and relations of a payment session:

It belongs to the same payment collection.
It’s associated with the same payment provider, which handles further payment processing.
It stores the payment session’s data property in its data property, as it’s still useful for the payment provider’s processing.
Capture Payments#
When a payment is captured, a capture, represented by the Capture data model, is created. It holds details related to the capture, such as the amount, the capture date, and more.

The payment can also be captured incrementally, each time a capture record is created for that amount.

A diagram showcasing how a payment's multiple captures are stored

Refund Payments#
When a payment is refunded, a refund, represented by the Refund data model, is created. It holds details related to the refund, such as the amount, refund date, and more.

A payment can be refunded multiple times, and each time a refund record is created.

A diagram showcasing how a payment's multiple refunds are stored

data Property#
Payment providers may need additional data to process the payment later. For example, the ID of the associated payment in the third-party provider.

The Payment data model has a data property used to store that data. The first time it's set is when the payment provider in Medusa authorizes the payment.

Then, the data property is passed to the Medusa payment provider when the payment is captured or refunded, allowing the payment provider to utilize the data to process the payment with the third-party provider.

Tip: If you're building a custom payment provider, learn more about authorizing and capturing the payments and setting the data property in the Create Payment Provider guide.

Payment with Stripe in React Storefront
In this guide, you'll learn how to use Stripe for payment during checkout in a React-based storefront.

Tip: For other types of frameworks or tech stacks, the steps are similar. Refer to Stripe's documentation for available tools for your tech stack.

Prerequisites
3
Stripe Module Provider installed and configured in your Medusa application.↗
Stripe publishable API key.↗
Cart context in your storefront, which is used in a code snippet later.↗
1. Install Stripe SDK#
In your storefront, use the following command to install Stripe's JS and React SDKs:

yarn
pnpm
npm
yarn add @stripe/react-stripe-js @stripe/stripe-js
2. Add Stripe Environment Variables#
Next, add an environment variable holding your Stripe publishable API key.

For example:

Terminal
NEXT_PUBLIC_STRIPE_PK=pk_test_51Kj...
Tip: For Next.js storefronts, the environment variable's name must be prefixed with NEXT_PUBLIC. If your storefront's framework requires a different prefix, make sure to change it.
3. Create Stripe Component#
You can now create a Stripe component that renders the Stripe UI to accept payment.

For example, you can create a file holding the following Stripe component:

Tip: 
This example uses the useCart hook defined in the Cart React Context guide.
Learn how to install and configure the JS SDK in the JS SDK documentation.
Code
"use client"

import { 
  CardElement, 
  Elements, 
  useElements, 
  useStripe,
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { useCart } from "@/providers/cart"
import { useState } from "react"
import { sdk } from "@/lib/sdk"

const stripe = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PK || "temp"
)

export default function StripePayment() {
  const { cart } = useCart()
  const clientSecret = cart?.payment_collection?.
    payment_sessions?.[0].data.client_secret as string

  return (
    <div>
      <Elements stripe={stripe} options={{
          clientSecret,
        }}>
        <StripeForm clientSecret={clientSecret} />
      </Elements>
    </div>
  )
}

const StripeForm = ({ 
  clientSecret,
}: {
  clientSecret: string | undefined
}) => {
  const { cart, refreshCart } = useCart()
  const [loading, setLoading] = useState(false)

  const stripe = useStripe()
  const elements = useElements()

  async function handlePayment(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    e.preventDefault()
    const card = elements?.getElement(CardElement)

    if (
      !stripe || 
      !elements ||
      !card ||
      !cart ||
      !clientSecret
    ) {
      return
    }

    setLoading(true)
    stripe?.confirmCardPayment(clientSecret, {
      payment_method: {
        card,
        billing_details: {
          name: cart.billing_address?.first_name,
          email: cart.email,
          phone: cart.billing_address?.phone,
          address: {
            city: cart.billing_address?.city,
            country: cart.billing_address?.country_code,
            line1: cart.billing_address?.address_1,
            line2: cart.billing_address?.address_2,
            postal_code: cart.billing_address?.postal_code,
          },
        },
      },
    })
    .then(({ error }) => {
      if (error) {
        // TODO handle errors
        console.error(error)
        return
      }

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
    })
    .finally(() => setLoading(false))
  }

  return (
    <form>
      <CardElement />
      <button
        onClick={handlePayment}
        disabled={loading}
      >
        Place Order
      </button>
    </form>
  )
}
In the code snippet above, you:

Create a StripePayment component that wraps the actual form with Stripe's Elements component.
In the StripePayment component, you obtain the client secret from the payment session's data field. This is set in the Medusa application after you initialize the payment session using the Initialize Payment Sessions API route.
Create a StripeForm component that holds the actual form. In this component, you implement a handlePayment function that does the following:
Use Stripe's confirmCardPayment method to accept the card details from the customer.
Once the customer enters their card details and submit their order, the resolution function of the confirmCardPayment method is executed.
In the resolution function, you send a request to the Complete Cart API route to complete the cart and place the order.
In the received response of the request, if the type is cart, it means that the cart completion failed. The error is set in the error response field.
If the type is order, it means the card was completed and the order was placed successfully. You can access the order in the order response field.
When the order is placed, you refresh the cart. You can redirect the customer to an order success page at this point. The redirection logic depends on the storefront framework you're using.
4. Use the Stripe Component#
Finally, use the Stripe component in the checkout flow. You should render it after the customer chooses Stripe as a payment provider.

For example, you can use it in the getPaymentUi function defined in the Payment Checkout Step guide:

Code
const getPaymentUi = useCallback(() => {
  const activePaymentSession = cart?.payment_collection?.
    payment_sessions?.[0]
  if (!activePaymentSession) {
    return
  }

  switch(true) {
    case activePaymentSession.provider_id.startsWith("pp_stripe_"):
      return <StripePayment />
    // ...
  }
} , [cart])
Troubleshooting#
Unknown Error for Zero Cart Total#
If your cart has a total of 0, you might encounter an unknown error when trying to create a payment session.

Stripe requires a non-zero amount to create a payment session. So, if your cart has a total of 0, the error will be thrown on Stripe's side.

In those cases, you can either:

Make sure the payment session is only initialized when the cart has a total greater than 0.
Use payment providers like the Manual System Payment Provider, which doesn't create a payment session with a third-party provider.
The Manual System Payment Provider is available by default in Medusa and can be used to handle payments without a third-party provider. It allows you to mark the order as paid without requiring any additional actions from the customer.
Make sure to configure the Manual System Payment Provider in your store's region. Learn more in the Manage Region user guide.
More Resources#
Stripe's documentation.
Saved Payment Methods with Stripe.