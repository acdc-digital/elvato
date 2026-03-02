Payment Module Options
In this document, you'll learn about the options you can pass to the Payment Module.

All Module Options#
Option	Description	Required	Default
webhook_delay

A number indicating the delay in milliseconds before processing a webhook event.

No

5000

webhook_retries

The number of times to retry the webhook event processing in case of an error.

No

3

providers

An array of payment providers to install and register. Learn more in this section.

No

-

providers Option#
The providers option is an array of payment module providers to be registered in your Medusa application.

When the Medusa application starts, these providers are registered and can be used to process payments.

For example:

medusa-config.ts
import { Modules } from "@medusajs/framework/utils"

// ...

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
              // ...
            },
          },
        ],
      },
    },
  ],
})
The providers option is an array of objects that accept the following properties:

resolve: A string indicating the package name of the module provider or the path to it.
id: A string indicating the provider's unique name or ID.
options: An optional object of the module provider's options.
Refer to the Payment Module Providers documentation to learn more.