Use Saved Payment Methods During Checkout
In this tutorial, you'll learn how to allow customers to save their payment methods and use them for future purchases.

When you install a Medusa application, you get a fully-fledged commerce platform with a Framework for customization. The Medusa application's commerce features are built around Commerce Modules which are available out-of-the-box.

Medusa's architecture facilitates integrating third-party services, such as payment providers. These payment providers can process payments and securely store customers' payment methods for future use.

In this tutorial, you'll expand on Medusa's Stripe Module Provider to allow customers to re-use their saved payment methods during checkout.

You can follow this guide whether you're new to Medusa or an advanced Medusa developer.

Note: While this tutorial uses Stripe as an example, you can follow the same steps to implement saved payment methods with other payment providers.
Summary#
By following this tutorial, you'll learn how to:

Install and set up Medusa and the Next.js Starter Storefront.
Set up the Stripe Module Provider in Medusa.
Customize the checkout flow to save customers' payment methods.
Allow customers to select saved payment methods during checkout.
Diagram illustrating the features of this guide

Saved Payment Methods Repository
Find the full code for this guide in this repository.
Step 1: Install a Medusa Application#

Prerequisites
3
Node.js v20+↗
Git CLI tool↗
PostgreSQL↗
Start by installing the Medusa application on your machine with the following command:

yarn
pnpm
npx
yarn dlx create-medusa-app@latest
You'll first be asked for the project's name. Then, when asked whether you want to install the Next.js Starter Storefront, choose Yes.

Afterwards, the installation process will start, which will install the Medusa application in a directory with your project's name, and the Next.js Starter Storefront in a separate directory with the {project-name}-storefront name.

Why is the storefront installed separately: The Medusa application is composed of a headless Node.js server and an admin dashboard. The storefront is installed or custom-built separately and connects to the Medusa application through its REST endpoints, called API routes. Learn more in Medusa's Architecture documentation.
Once the installation finishes successfully, the Medusa Admin dashboard will open with a form to create a new user. Enter the user's credentials and submit the form. Afterwards, you can log in with the new user and explore the dashboard.

Ran into Errors: Check out the troubleshooting guides for help.
Step 2: Set Up the Stripe Module Provider#
Medusa's Payment Module provides payment-related models and the interface to manage and process payments. However, it delegates the actual payment processing to module providers that integrate third-party payment services.

The Stripe Module Provider is a Payment Module Provider that integrates Stripe into your Medusa application to process payments. It can also save payment methods securely.

In this section, you'll set up the Stripe Module Provider in your Medusa application.


Prerequisites
2
Stripe account↗
Stripe Secret and Public API Keys↗
Register the Stripe Module Provider#
To register the Stripe Module Provider in your Medusa application, add it to the array of providers passed to the Payment Module in medusa-config.ts:

medusa-config.ts
module.exports = defineConfig({
  // ...
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
            },
          },
        ],
      },
    },
  ],
})
The Medusa configuration accepts a modules array, which contains the modules to be loaded. While the Payment Module is loaded by default, you need to add it again when registering a new provider.

You register provides in the providers option of the Payment Module. Each provider is an object with the following properties:

resolve: The package name of the provider.
id: The ID of the provider. This is used to identify the provider in the Medusa application.
options: The options to be passed to the provider. In this case, the apiKey option is required for the Stripe Module Provider.
Note: Learn about other options in the Stripe Module Provider documentation.
Add Environment Variables#
Next, add the following environment variables to your .env file:

Code
STRIPE_API_KEY=sk_...
Where STRIPE_API_KEY is your Stripe Secret API Key. You can find it in the Stripe dashboard under Developers > API keys.

Secret API Key in the Stripe dashboard

Enable Stripe in a Region#
In Medusa, each region (which is a geographical area where your store operates) can have different payment methods enabled. So, after registering the Stripe Module Provider, you need to enable it in a region.

To enable it in a region, start the Medusa application with the following command:

yarn
pnpm
npm
yarn dev
Then, go to localhost:9000/app and log in with the user you created earlier.

Once you're logged in:

Go to Settings -> Regions.
Click on the region where you want to enable the payment provider.
Click the  icon at the top right of the first section
Choose "Edit" from the dropdown menu
In the side window that opens, find the "Payment Providers" field and select Stripe from the dropdown.
Once you're done, click the "Save" button.
Stripe will now be available as a payment option during checkout.

Note: The Stripe Module Provider supports different payment methods in Stripe, such as Bancontact or iDEAL. This guide focuses only on the card payment method, but you can enable other payment methods as well.
Stripe in the dropdown

Add Evnironement Variable to Storefront#
The Next.js Starter Storefront supports payment with Stripe during checkout if it's enabled in the region.

Reminder: 
The Next.js Starter Storefront was installed in a separate directory from Medusa. The directory's name is {your-project}-storefront.

So, if your Medusa application's directory is medusa-payment, you can find the storefront by going back to the parent directory and changing to the medusa-payment-storefront directory:

Terminal
cd ../medusa-payment-storefront # change based on your project name
In the Next.js Starter Storefront project, add the Stripe public API key as an environment variable in .env.local:

Storefront
Code
NEXT_PUBLIC_STRIPE_KEY=pk_123...
Where NEXT_PUBLIC_STRIPE_KEY is your Stripe public API key. You can find it in the Stripe dashboard under Developers > API keys.

Step 3: List Payment Methods API Route#
The Payment Module uses account holders to represent a customer's details that are stored in a third-party payment provider. Medusa creates an account holder for each customer, allowing you later to retrieve the customer's saved payment methods in the third-party provider.

Diagram illustrating the relation between customers and account holders in Medusa, and customers in Stripe

While this feature is available out-of-the-box, you need to expose it to clients, like storefronts, by creating an API route. An API Route is an endpoint that exposes commerce features to external applications and clients.

In this step, you'll create an API route that lists the saved payment methods for an authenticated customer.

Note: Refer to the API routes documentation to learn more.
Create API Route#
An API route is created in a route.ts file under a sub-directory of the src/api directory. The path of the API route is the file's path relative to src/api, and it can include path parameters using square brackets.

So, to create an API route at the path /store/payment-methods/:account-holder-id, create the file src/api/store/payment-methods/[account_holder_id]/route.ts with the following content:

src/api/store/payment-methods/[account_holder_id]/route.ts
import { MedusaError } from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { account_holder_id } = req.params
  const query = req.scope.resolve("query")
  const paymentModuleService = req.scope.resolve("payment")

  const { data: [accountHolder] } = await query.graph({
    entity: "account_holder",
    fields: [
      "data",
      "provider_id",
    ],
    filters: {
      id: account_holder_id,
    },
  })

  if (!accountHolder) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND, 
      "Account holder not found"
    )
  }

  const paymentMethods = await paymentModuleService.listPaymentMethods(
    {
      provider_id: accountHolder.provider_id,
      context: {
        account_holder: {
          data: {
            id: accountHolder.data.id,
          },
        },
      },
    }
  )

  res.json({
    payment_methods: paymentMethods,
  })
}
Since you export a route handler function named GET, you expose a GET API route at /store/payment-methods/:account-holder-id. The route handler function accepts two parameters:

A request object with details and context on the request, such as body parameters or authenticated customer details.
A response object to manipulate and send the response.
The request object has a scope property, which is an instance of the Medusa container. The Medusa container is a registry of Framework and commerce tools that you can access in the API route.

You use the Medusa container to resolve:

Query, which is a tool that retrieves data across modules in the Medusa application.
The Payment Module's service, which provides an interface to manage and process payments with third-party providers.
You use Query to retrieve the account holder with the ID passed as a path parameter. If the account holder is not found, you throw an error.

Then, you use the listPaymentMethods method of the Payment Module's service to retrieve the payment providers saved in the third-party provider. The method accepts an object with the following properties:

provider_id: The ID of the provider, such as Stripe's ID. The account holder stores the ID its associated provider.
context: The context of the request. In this case, you pass the account holder's ID to retrieve the payment methods associated with it in the third-party provider.
Finally, you return the payment methods in the response.

Protect API Route#
Only authenticated customers can access and use saved payment methods. So, you need to protect the API route to ensure that only authenticated customers can access it.

To protect an API route, you can add a middleware. A middleware is a function executed when a request is sent to an API Route. You can add an authentication middleware that ensures that the request is authenticated before executing the route handler function.

Note: Refer to the Middlewares documentation to learn more.
Middlewares are added in the src/api/middlewares.ts file. So, create the file with the following content:

src/api/middlewares.ts
import { authenticate, defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/payment-methods/:provider_id/:account_holder_id",
      method: "GET",
      middlewares: [
        authenticate("customer", ["bearer", "session"]),
      ],
    },
  ],
})
The src/api/middlewares.ts file must use the defineMiddlewares function and export its result. The defineMiddlewares function accepts a routes array that accepts objects with the following properties:

matcher: The path of the API route to apply the middleware to.
method: The HTTP method of the API route to apply the middleware to.
middlewares: An array of middlewares to apply to the API route.
You apply the authenticate middleware to the API route you created earlier. The authenticate middleware ensures that only authenticated customers can access the API route.

Note: Refer to the Protected Routes documentation to learn more about the authenticate middleware.
Your API route can now only be accessed by authenticated customers. You'll test it out as you customize the Next.js Starter Storefront in the next steps.

Step 4: Save Payment Methods During Checkout#
In this step, you'll customize the checkout flow in the Next.js Starter Storefront to save payment methods during checkout.

Reminder: 
The Next.js Starter Storefront was installed in a separate directory from Medusa. The directory's name is {your-project}-storefront.

So, if your Medusa application's directory is medusa-payment, you can find the storefront by going back to the parent directory and changing to the medusa-payment-storefront directory:

Terminal
cd ../medusa-payment-storefront # change based on your project name
During checkout, when the customer chooses a payment method, such as Stripe, the Next.js Starter Storefront creates a payment session in Medusa using the Initialize Payment Session API route.

Under the hood, Medusa uses the associated payment provider (Stripe) to initiate the payment process with the associated third-party payment provider. The Initialize Payment Session API route accepts a data object parameter in the request body that allows you to pass data relevant to the third-party payment provider.

So, to save the payment method that the customer uses during checkout with Stripe, you must pass the setup_future_usage property in the data object. The setup_future_usage property is a Stripe-specific property that allows you to save the payment method for future use.

In src/modules/checkout/components/payment/index.tsx of the Next.js Starter Storefront, there are two uses of the initiatePaymentSession function. Update each of them to pass the data property:

Storefront
src/modules/checkout/components/payment/index.tsx
// update in two places
await initiatePaymentSession(cart, {
  // ...
  data: {
    setup_future_usage: "off_session",
  },
})
You customize the initiatePaymentSession function to pass the data object with the setup_future_usage property. You set the value to off_session to allow using the payment method outside of the checkout flow, such as for follow up payments. You can use on_session instead if you only want the payment method to be used by the customer during checkout.

Note: By making this change, you always save the payment method that the customer uses during checkout. You can alternatively show a checkbox to confirm saving the payment method, and only pass the data object if the customer checks it.
Test it Out#
To test it out, start the Medusa application by running the following command in the Medusa application's directory:

yarn
pnpm
npm
yarn dev
Then, start the Next.js Starter Storefront by running the following command in the storefront's directory:

yarn
pnpm
npm
yarn dev
You can open the storefront in your browser at localhost:8000. Then, create a new customer account by clicking on the "Account" link at the top right.

After creating an account and logging in, add a product to the cart and go to the checkout page. Once you get to the payment step, choose Stripe and enter a test card number, such as 4242 4242 4242 4242.

Then, place the order. Once the order is placed, you can check on the Stripe dashboard that the payment method was saved by:

Going to the "Customers" section in the Stripe dashboard.
Clicking on the customer you just placed the order with.
Scrolling down to the "Payment methods" section. You'll find the payment method you just used to place the order.
Saved payment method on the Stripe dashboard

In the next step, you'll show the saved payment methods to the customer during checkout and allow them to select one of them.

Step 5: Use Saved Payment Methods During Checkout#
In this step, you'll customize the checkout flow in the Next.js Starter Storefront to show the saved payment methods to the customer and allow them to select one of them to place the order.

Retrieve Saved Payment Methods#
To retrieve the saved payment methods, you'll add a server function that retrieves the customer's saved payment methods from the API route you created earlier.

Add the following in src/lib/data/payment.ts:

Storefront
src/lib/data/payment.ts
export type SavedPaymentMethod = {
  id: string
  provider_id: string
  data: {
    card: {
      brand: string
      last4: string
      exp_month: number
      exp_year: number
    }
  }
}

export const getSavedPaymentMethods = async (accountHolderId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client.fetch<{
    payment_methods: SavedPaymentMethod[]
  }>(
    `/store/payment-methods/${accountHolderId}`,
    {
      method: "GET",
      headers,
    }
  ).catch(() => {
    return {
      payment_methods: [],
    }
  })
}
You define a type for the retrieved payment methods. It contains the following properties:

id: The ID of the payment method in the third-party provider.
provider_id: The ID of the provider in the Medusa application, such as Stripe's ID.
data: Additional data retrieved from the third-party provider related to the saved payment method. The type is modeled after the data returned by Stripe, but you can change it to match other payment providers.
You also create a getSavedPaymentMethods function that retrieves the saved payment methods from the API route you created earlier. The function accepts the account holder ID as a parameter and returns the saved payment methods.

Add Saved Payment Methods Component#
Next, you'll add the component that shows the saved payment methods and allows the customer to select one of them.

The component that shows the Stripe card element is defined in src/modules/checkout/components/payment-container/index.tsx. So, you'll define the component for the saved payment methods in the same file.

Start by adding the following import statements at the top of the file:

Storefront
src/modules/checkout/components/payment-container/index.tsx
import { Button } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { SavedPaymentMethod, getSavedPaymentMethods } from "@lib/data/payment"
import { initiatePaymentSession } from "../../../../lib/data/cart"
import { capitalize } from "lodash"
Then, update the PaymentContainerProps type to include the payment session and cart details:

Storefront
src/modules/checkout/components/payment-container/index.tsx
type PaymentContainerProps = {
  // ...
  paymentSession?: HttpTypes.StorePaymentSession
  cart: HttpTypes.StoreCart
}
You'll need these details to find which saved payment method the customer selected, and to initiate a new payment session for the cart when the customer chooses a saved payment method.

Next, add the following component at the end of the file:

Storefront
src/modules/checkout/components/payment-container/index.tsx
const StripeSavedPaymentMethodsContainer = ({
  paymentSession,
  setCardComplete,
  setCardBrand,
  setError,
  cart,
}: {
  paymentSession?: HttpTypes.StorePaymentSession
  setCardComplete: (complete: boolean) => void
  setCardBrand: (brand: string) => void
  setError: (error: string | null) => void
  cart: HttpTypes.StoreCart
}) => {
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<
    SavedPaymentMethod[]
  >([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(
    paymentSession?.data?.payment_method as string | null
  )

  useEffect(() => {
    const accountHolderId = (
      paymentSession?.context?.account_holder as Record<string, string>
    )
      ?.id

    if (!accountHolderId) {
      return
    }

    getSavedPaymentMethods(accountHolderId)
      .then(({ payment_methods }) => {
        setSavedPaymentMethods(payment_methods)
      })
  }, [paymentSession])

  useEffect(() => {
    if (!selectedPaymentMethod || !savedPaymentMethods.length) {
      setCardComplete(false)
      setCardBrand("")
      setError(null)
      return
    }
    const selectedMethod = savedPaymentMethods.find(
      (method) => method.id === selectedPaymentMethod
    )

    if (!selectedMethod) {
      return
    }

    setCardBrand(capitalize(selectedMethod.data.card.brand))
    setCardComplete(true)
    setError(null)
  }, [selectedPaymentMethod, savedPaymentMethods])

  const handleSelect = async (method: SavedPaymentMethod) => {
    // initiate a new payment session with the selected payment method
    await initiatePaymentSession(cart, {
      provider_id: method.provider_id,
      data: {
        payment_method: method.id,
      },
    }).catch((error) => {
      setError(error.message)
    })

    setSelectedPaymentMethod(method.id)
  }

  if (!savedPaymentMethods.length) {
    return <></>
  }

  // TODO add return statement
}
You define a StripeSavedPaymentMethodsContainer component that accepts the following props:

paymentSession: The cart's current payment session.
setCardComplete: A function to tell parent components whether the cart or payment method selection is complete. This allows the customer to proceed to the next step in the checkout flow.
setCardBrand: A function to set the brand of the selected payment method. This is useful to show the brand of the selected payment method in review sections of the checkout flow.
setError: A function to set the error message in case of an error.
cart: The cart's details.
In the component, you define a state variable to store the saved payment methods and another one to store the selected payment method.

Then, you use the useEffect hook to retrieve the saved payment methods for the account holder set in the cart's payment session. You use the getSavedPaymentMethods function you created earlier to retrieve the saved payment methods.

You also use another useEffect hook that is executed when the selected payment method changes. In this hook, you check if the selected payment method is valid and set the card brand and completion status accordingly.

Finally, you define a handleSelect function that you'll execute when the customer selects a saved payment method. It creates a new payment session with the selected payment method.

To show the saved payment methods, replace the TODO with the following return statement:

Storefront
src/modules/checkout/components/payment-container/index.tsx
return (
  <div className="flex flex-col gap-y-2">
    <Text className="txt-medium-plus text-ui-fg-base">
      Choose a saved payment method:
    </Text>
    {savedPaymentMethods.map((method) => (
      <div 
        key={method.id}
        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:border-ui-border-interactive ${
          selectedPaymentMethod === method.id ? "border-ui-border-interactive" : ""
        }`}
        role="button"
        onClick={() => handleSelect(method)}
      >
        <div className="flex items-center gap-x-4">
          <input
            type="radio"
            name="saved-payment-method" 
            value={method.id}
            checked={selectedPaymentMethod === method.id}
            className="h-4 w-4 text-ui-fg-interactive"
            onChange={(e) => {
              if (e.target.checked) {
                handleSelect(method)
              }
            }}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-ui-fg-base">
              {capitalize(method.data.card.brand)} •••• {method.data.card.last4}
            </span>
            <span className="text-xs text-ui-fg-subtle">
              Expires {method.data.card.exp_month}/{method.data.card.exp_year}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
)
You display the saved payment methods as radio buttons. When the customer selects one of them, you execute the handleSelect function to initiate a new payment session with the selected payment method.

Modify Existing Stripe Element#
Now that you have the component to show the saved payment methods, you need to modify the existing Stripe element to allow customers to select an existing payment method or enter a new one.

In the same src/modules/checkout/components/payment-container/index.tsx file, expand the new paymentSession and cart props of the StripeCardContainer component:

Storefront
src/modules/checkout/components/payment-container/index.tsx
export const StripeCardContainer = ({
  // ...
  paymentSession,
  cart,
}: Omit<PaymentContainerProps, "children"> & {
  // ...
}) => {
  // ...
}
Then, add a new state variable that keeps track of whether the customer is using a saved payment method or entering a new one:

Storefront
src/modules/checkout/components/payment-container/index.tsx
const [isUsingSavedPaymentMethod, setIsUsingSavedPaymentMethod] = useState(
  paymentSession?.data?.payment_method !== null
)
Next, add a function that resets the payment session when the customer switches between saved and new payment methods:

Storefront
src/modules/checkout/components/payment-container/index.tsx
const handleRefreshSession = async () => {
  await initiatePaymentSession(cart, {
    provider_id: paymentProviderId,
  })
  setIsUsingSavedPaymentMethod(false)
}
This function initiates a new payment session for the cart and disables the isUsingSavedPaymentMethod state variable.

Finally, replace the return statement of the StripeCardContainer component with the following:

Storefront
src/modules/checkout/components/payment-container/index.tsx
return (
  <PaymentContainer
    paymentProviderId={paymentProviderId}
    selectedPaymentOptionId={selectedPaymentOptionId}
    paymentInfoMap={paymentInfoMap}
    disabled={disabled}
    paymentSession={paymentSession}
    cart={cart}
  >
    {selectedPaymentOptionId === paymentProviderId &&
      (stripeReady ? (
        <div className="my-4 transition-all duration-150 ease-in-out">
          <StripeSavedPaymentMethodsContainer
            setCardComplete={setCardComplete}
            setCardBrand={setCardBrand}
            setError={setError}
            paymentSession={paymentSession}
            cart={cart}
          />
          {isUsingSavedPaymentMethod && (
            <Button
              variant="secondary" 
              size="small" 
              className="mt-2" 
              onClick={handleRefreshSession}
            >
              Use a new payment method
            </Button>
          )}
          {!isUsingSavedPaymentMethod && (
            <>
              <Text className="txt-medium-plus text-ui-fg-base my-1">
                Enter your card details:
              </Text>
              <CardElement
                options={useOptions as StripeCardElementOptions}
                onChange={(e) => {
                  setCardBrand(
                    e.brand && e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                  )
                  setError(e.error?.message || null)
                  setCardComplete(e.complete)
                  }}
                />              
            </>
          )}
        </div>
      ) : (
        <SkeletonCardDetails />
      ))}
  </PaymentContainer>
)
You update the return statement to:

Pass the new paymentSession and cart props to the PaymentContainer component.
Show the StripeSavedPaymentMethodsContainer component before Stripe's card element.
Add a button that's shown when the customer selects a saved payment method. The button allows the customer to switch back to entering a new payment method.
The existing Stripe element in checkout will now show the saved payment methods to the customer along with the component to enter a card's details.

Since you added new props to the StripeCardContainer and PaymentContainer components, you need to update other components that use them to pass the props.

In src/modules/checkout/components/payment/index.tsx, find usages of StripeCardContainer and PaymentContainer in the return statement and add the paymentSession and cart props:

Storefront
src/modules/checkout/components/payment/index.tsx
<div key={paymentMethod.id}>
  {isStripeFunc(paymentMethod.id) ? (
    <StripeCardContainer
      // ...
      paymentSession={activeSession}
      cart={cart}
    />
  ) : (
    <PaymentContainer
      // ...
      paymentSession={activeSession}
      cart={cart}
    />
  )}
</div>
Support Updating Stripe's Client Secret#
The Next.js Starter Storefront uses Stripe's Elements component to wrap the payment elements. The Elements component requires a clientSecret prop, which is available in the cart's payment session.

With the recent changes, the client secret will be updated whenever a payment session is initiated, such as when the customer selects a saved payment method. However, the options.clientSecret prop of the Elements component is immutable, meaning that it cannot be changed after the component is mounted.

To force the component to re-mount and update the clientSecret prop, you can add a key prop to the Elements component. The key prop ensures that the Elements component re-mounts whenever the client secret changes, allowing Stripe to process the updated payment session.

In src/modules/checkout/components/payment-wrapper/stripe-wrapper.tsx, find the Elements component in the return statement and add the key prop:

Storefront
src/modules/checkout/components/payment-wrapper/stripe-wrapper.tsx
<Elements 
  options={options} 
  stripe={stripePromise} 
  key={options.clientSecret}
>
  {children}
</Elements>
You set the key prop to the client secret, which forces the Elements component to re-mount whenever the client secret changes.

Support Payment with Saved Payment Method#
The last change you need to make ensures that the customer can place an order with a saved payment method.

When the customer places the order, and they've chosen Stripe as a payment method, the Next.js Starter Storefront uses Stripe's confirmCardPayment method to confirm the payment. This method accepts either the ID of a saved payment method, or the details of a new card.

So, you need to update the confirmCardPayment usage to support passing the ID of the selected payment method if the customer has selected one.

In src/modules/checkout/components/payment-button/index.tsx, find the handlePayment method and update its first if condition:

Storefront
src/modules/checkout/components/payment-button/index.tsx
if (!stripe || !elements || (!card && !session?.data.payment_method) || !cart) {
  setSubmitting(false)
  return
}
This allows the customer to place their order if they have selected a saved payment method but have not entered a new card.

Then, find the usage of confirmCardPayment in the handlePayment function and change it to the following:

Storefront
src/modules/checkout/components/payment-button/index.tsx
await stripe
.confirmCardPayment(session?.data.client_secret as string, {
  payment_method: session?.data.payment_method as string || {
    card: card!,
    billing_details: {
      name:
        cart.billing_address?.first_name +
        " " +
        cart.billing_address?.last_name,
      address: {
        city: cart.billing_address?.city ?? undefined,
        country: cart.billing_address?.country_code ?? undefined,
        line1: cart.billing_address?.address_1 ?? undefined,
        line2: cart.billing_address?.address_2 ?? undefined,
        postal_code: cart.billing_address?.postal_code ?? undefined,
        state: cart.billing_address?.province ?? undefined,
      },
      email: cart.email,
      phone: cart.billing_address?.phone ?? undefined,
    },
  },
})
.then(({ error, paymentIntent }) => {
  if (error) {
    const pi = error.payment_intent

    if (
      (pi && pi.status === "requires_capture") ||
      (pi && pi.status === "succeeded")
    ) {
      onPaymentCompleted()
    }

    setErrorMessage(error.message || null)
    return
  }

  if (
    (paymentIntent && paymentIntent.status === "requires_capture") ||
    paymentIntent.status === "succeeded"
  ) {
    return onPaymentCompleted()
  }

  return
})
In particular, you're changing the payment_method property to either be the ID of the selected payment method, or the details of a new card. This allows the customer to place an order with either a saved payment method or a new one.

Test it Out#
You can now test out placing orders with a saved payment method.

To do that, start the Medusa application by running the following command in the Medusa application's directory:

yarn
pnpm
npm
yarn dev
Then, start the Next.js Starter Storefront by running the following command in the storefront's directory:

yarn
pnpm
npm
yarn dev
In the Next.js Starter Storefront, login with the customer account you created earlier and add a product to the cart.

Then, proceed to the checkout flow. In the payment step, you should see the saved payment method you used earlier. You can select it and place the order.

Saved payment method in checkout

Once the order is placed successfully, you can check it in the Medusa Admin dashboard. You can view the order and capture the payment.

Order in the Medusa Admin dashboard

Next Steps#
You've added support for saved payment methods in your Medusa application and Next.js Starter Storefront, allowing customers to save their payment methods during checkout and use them in future orders.

You can add more features to the saved payment methods, such as allowing customers to delete saved payment methods. You can use Stripe's APIs in the storefront or add an API route in Medusa to delete the saved payment method.

If you're new to Medusa, check out the main documentation, where you'll get a more in-depth learning of all the concepts you've used in this guide and more.

To learn more about the commerce features that Medusa provides, check out Medusa's Commerce Modules.

