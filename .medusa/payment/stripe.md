Stripe Module Provider
In this document, you’ll learn about the Stripe Module Provider and how to configure it in the Payment Module.

Looking for no-code docs? Your technical team must install the Stripe Module Provider in your Medusa application first. Then, refer to this user guide to learn how to enable the Stripe payment provider in a region using the Medusa Admin dashboard.
Register the Stripe Module Provider#

Prerequisites
3
Stripe account↗
Stripe Secret API Key↗
For deployed Medusa applications, a Stripe webhook secret. Refer to the end of this guide for details on the URL and events.↗
The Stripe Module Provider is installed by default in your application. To use it, add it to the array of providers passed to the Payment Module in medusa-config.ts:

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
Environment Variables#
Make sure to add the necessary environment variables for the above options in .env:

Terminal
STRIPE_API_KEY=<YOUR_STRIPE_API_KEY>
Module Options#
Option	Description	Required	Default
apiKey

A string indicating the Stripe Secret API key.

Yes

-

webhookSecret

A string indicating the Stripe webhook secret. This is only useful for deployed Medusa applications.

Yes

-

capture

Whether to automatically capture payment after authorization.

No

false

automatic_payment_methods

A boolean value indicating whether to enable Stripe's automatic payment methods. This is useful if you integrate services like Apple pay or Google pay.

No

false

payment_description

A string used as the default description of a payment if none is available in cart.context.payment_description.

No

-

oxxoExpiresDays

The number of days before an OXXO payment expires. Only applicable if you plan to use OXXO as a payment method.

No

3

Enable Stripe Providers in a Region#
Before customers can use Stripe to complete their purchases, you must enable the Stripe payment provider(s) in the region where you want to offer this payment method.

Refer to the user guide to learn how to edit a region and enable the Stripe payment provider.

Stripe Payment Provider IDs#
When you register the Stripe Module Provider, it registers different providers, such as basic Stripe payment, Bancontact, and more.

Each provider is registered and referenced by a unique ID made up of the format pp_{identifier}_{id}, where:

{identifier} is the ID of the payment provider as defined in the Stripe Module Provider.
{id} is the ID of the Stripe Module Provider as set in the medusa-config.ts file. For example, stripe.
Assuming you set the ID of the Stripe Module Provider to stripe in medusa-config.ts, the Medusa application will register the following payment providers:

Provider Name	Provider ID
Basic Stripe Payment

pp_stripe_stripe

Bancontact Payments

pp_stripe-bancontact_stripe

BLIK Payments

pp_stripe-blik_stripe

giropay Payments

pp_stripe-giropay_stripe

iDEAL Payments

pp_stripe-ideal_stripe

Przelewy24 Payments

pp_stripe-przelewy24_stripe

PromptPay Payments

pp_stripe-promptpay_stripe

OXXO Payments (Available since Medusa v2.12.0)

pp_stripe-oxxo_stripe

Setup Stripe Webhooks#
For production applications, you must set up webhooks in Stripe that inform Medusa of changes and updates to payments. Refer to Stripe's documentation on how to setup webhooks.

Webhook URL#
Medusa has a {server_url}/hooks/payment/{provider_id} API route that you can use to register webhooks in Stripe, where:

{server_url} is the URL to your deployed Medusa application in server mode.
{provider_id} is the ID of the provider as explained in the Stripe Payment Provider IDs section, without the pp_ prefix.
The Stripe Module Provider supports the following payment types, and the webhook endpoint URL is different for each:

Stripe Payment Type	Webhook Endpoint URL
Basic Stripe Payment

{server_url}/hooks/payment/stripe_stripe

Bancontact Payments

{server_url}/hooks/payment/stripe-bancontact_stripe

BLIK Payments

{server_url}/hooks/payment/stripe-blik_stripe

giropay Payments

{server_url}/hooks/payment/stripe-giropay_stripe

iDEAL Payments

{server_url}/hooks/payment/stripe-ideal_stripe

Przelewy24 Payments

{server_url}/hooks/payment/stripe-przelewy24_stripe

PromptPay Payments

{server_url}/hooks/payment/stripe-promptpay_stripe

OXXO Payments (Available since Medusa v2.12.0)

{server_url}/hooks/payment/stripe-oxxo_stripe

Webhook Events#
When you set up the webhook in Stripe, choose the following events to listen to:

payment_intent.amount_capturable_updated
payment_intent.succeeded
payment_intent.payment_failed
payment_intent.partially_funded (Since v2.8.5)
Useful Guides#
Storefront guide: Add Stripe payment method during checkout.
Integrate in Next.js Starter.
Customize Stripe Integration in Next.js Starter.
Add Saved Payment Methods with Stripe.
