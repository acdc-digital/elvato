Payment Module Provider
In this guide, you’ll learn about the Payment Module Provider and how it's used.

Looking for no-code docs? Refer to this Medusa Admin User Guide to learn how to manage the payment providers available in a region using the dashboard.
What is a Payment Module Provider?#
The Payment Module Provider handles payment processing in the Medusa application. It integrates third-party payment services, such as Stripe.

To authorize a payment amount with a payment provider, a payment session is created and associated with that payment provider. The payment provider is then used to handle the authorization.

After the payment session is authorized, the payment provider is associated with the resulting payment and handles its payment processing, such as to capture or refund payment.

Diagram showcasing the communication between Medusa, the Payment Module Provider, and the third-party payment provider.

List of Payment Module Providers#
Stripe
Default Payment Provider#
The Payment Module provides a system payment provider that acts as a placeholder payment provider.

It doesn’t handle payment processing and delegates that to the merchant. It acts similarly to a cash-on-delivery (COD) payment method.

Tip: The identifier of the system payment provider is pp_system.
How to Create a Custom Payment Provider?#
A payment provider is a module whose main service extends the AbstractPaymentProvider imported from @medusajs/framework/utils.

The module can have multiple payment provider services, where each is registered as a separate payment provider.

Refer to this guide on how to create a payment provider for the Payment Module.

After you create a payment provider, you can enable it as a payment provider in a region using the Medusa Admin dashboard.

How are Payment Providers Registered?#
Configure Payment Module's Providers#
The Payment Module accepts a providers option that allows you to configure the providers registered in your application.

Learn more about this option in the Module Options guide.

Registration on Application Start#
When the Medusa application starts, it registers the Payment Module Providers defined in the providers option of the Payment Module.

For each Payment Module Provider, the Medusa application finds all payment provider services defined in them to register.

PaymentProvider Data Model#
A registered payment provider is represented by the PaymentProvider data model in the Medusa application.

Diagram showcasing the PaymentProvider data model

This data model is used to reference a service in the Payment Module Provider and determine whether it's installed in the application.

The PaymentProvider data model has the following properties:

id: The unique identifier of the Payment Module Provider. The ID's format is pp_{identifier}_{id}, where:
identifier is the value of the identifier property in the Payment Module Provider's service.
id is the value of the id property of the Payment Module Provider in medusa-config.ts.
is_enabled: A boolean indicating whether the payment provider is enabled.
How to Remove a Payment Provider?#
If you remove a payment provider from the providers option, the Medusa application will not remove the associated PaymentProvider data model record.

Instead, the Medusa application will set the is_enabled property of the PaymentProvider's record to false. This allows you to re-enable the payment provider later if needed by adding it back to the providers option.

Checkout Step 4: Choose Payment Provider
In this guide, you'll learn how to implement the last step of the checkout flow, where the customer chooses the payment provider and performs any necessary actions. This is typically the fourth step of the checkout flow, but you can change the steps of the checkout flow as you see fit.

Payment Step Flow in Storefront Checkout#
The payment step requires implementing the following flow:

Storefront payment checkout flow diagram illustrating the complete payment process: retrieving available payment providers, customer selection of payment method, payment collection creation, session initialization, and showing the necessary UI to complete the payment

Retrieve the payment providers using the List Payment Providers API route.
Customer chooses the payment provider to use.
If the cart doesn't have an associated payment collection, create a payment collection for it using the Create Payment Collection API route.
Initialize the payment sessions of the cart's payment collection using the Initialize Payment Sessions API route.
If you're using the JS SDK, it combines the third and fourth steps in a single initiatePaymentSession function.
Optionally perform additional actions for payment based on the chosen payment provider. For example, if the customer chooses Stripe, you show them the UI to enter their card details.
You can refer to the Stripe guide for an example of how to implement this.
How to Implement the Payment Step Flow#
For example, to implement the payment step flow:

Tip: 
This example uses the useCart hook defined in the Cart React Context guide.
Learn how to install and configure the JS SDK in the JS SDK documentation.
React
JS SDK
"use client" // include with Next.js 13+

import { useCallback, useEffect, useState } from "react"
import { useCart } from "@/providers/cart"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/sdk"

export default function CheckoutPaymentStep() {
  const { cart, setCart } = useCart()
  const [paymentProviders, setPaymentProviders] = useState<
    HttpTypes.StorePaymentProvider[]
  >([])
  const [
    selectedPaymentProvider, 
    setSelectedPaymentProvider,
  ] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cart) {
      return
    }

    sdk.store.payment.listPaymentProviders({
      region_id: cart.region_id || "",
    })
    .then(({ payment_providers }) => {
      setPaymentProviders(payment_providers)
      setSelectedPaymentProvider(
        cart.payment_collection?.payment_sessions?.[0]?.id
      )
    })
  }, [cart])

  const handleSelectProvider = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault()
    if (!cart || !selectedPaymentProvider) {
      return
    }

    setLoading(true)

    await sdk.store.payment.initiatePaymentSession(cart, {
      provider_id: selectedPaymentProvider,
    })

    // re-fetch cart
    const { cart: updatedCart } = await sdk.store.cart.retrieve(cart.id)

    setCart(updatedCart)
    setLoading(false)
  }

  const getPaymentUi = useCallback(() => {
    const activePaymentSession = cart?.payment_collection?.payment_sessions?.[0]
    if (!activePaymentSession) {
      return
    }

    switch(true) {
      case activePaymentSession.provider_id.startsWith("pp_stripe_"):
        return (
          <span>
            You chose stripe!
            {/* TODO add stripe UI */}
          </span>
        )
      case activePaymentSession.provider_id
        .startsWith("pp_system_default"):
        return (
          <span>
            You chose manual payment! No additional actions required.
          </span>
        )
      default:
        return (
          <span>
            You chose {activePaymentSession.provider_id} which is 
            in development.
          </span>
        )
    }
  } , [cart])

  return (
    <div>
      <form>
        <select 
          value={selectedPaymentProvider}
          onChange={(e) => setSelectedPaymentProvider(e.target.value)}
        >
          {paymentProviders.map((provider) => (
            <option
              key={provider.id}
              value={provider.id}
            >
              {provider.id}
            </option>
          ))}
        </select>
        <button
          disabled={loading} 
          onClick={async (e) => {
            await handleSelectProvider(e)
          }}
        >
          Submit
        </button>
      </form>
      {getPaymentUi()}
    </div>
  )
}
In the example above, you:

Retrieve the payment providers from the Medusa application using the List Payment Providers API route. You use those to show the customer the available options.
When the customer chooses a payment provider, you use the initiatePaymentSession function to create a payment collection and initialize the payment session for the chosen provider.
If you're not using the JS SDK, you need to create a payment collection using the Create Payment Collection API route if the cart doesn't have one. Then, you need to initialize the payment session using the Initialize Payment Session API route.
Once the cart has a payment session, you optionally render the UI to perform additional actions. For example, if the customer chose Stripe, you can show them the card form to enter their credit card.
In the Fetch API example, the handlePayment function implements this flow by calling the different functions in the correct order.

Troubleshooting#
Unknown Error for Zero Cart Total#
If your cart has a total of 0, you might encounter an unknown error when trying to create a payment session.

Some payment providers, such as Stripe, require a non-zero amount to create a payment session. So, if your cart has a total of 0, the error will be thrown on the payment provider's side.

In those cases, you can either:

Make sure the payment session is only initialized when the cart has a total greater than 0.
Use payment providers like the Manual System Payment Provider, which doesn't create a payment session with a third-party provider.
The Manual System Payment Provider is available by default in Medusa and can be used to handle payments without a third-party provider. It allows you to mark the order as paid without requiring any additional actions from the customer.
Make sure to configure the Manual System Payment Provider in your store's region. Learn more in the Manage Region user guide.
Stripe Example#
If you're integrating Stripe in your Medusa application and storefront, refer to the Stripe guide for an example of how to handle the payment process using Stripe.

Example:
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
