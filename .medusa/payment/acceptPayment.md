Accept Payment in Checkout Flow
In this guide, you'll learn how to implement it using workflows or the Payment Module.

Why Implement the Payment Flow?#
Medusa already provides a built-in payment flow that allows you to accept payments from customers, which you can learn about in the Accept Payment Flow in Checkout guide.

You may need to implement a custom payment flow if you have a different use case, or you're using the Payment Module separately from the Medusa application.

This guide will help you understand how to implement a payment flow using the Payment Module's main service or workflows.

You can also follow this guide to get a general understanding of how the payment flow works in the Medusa application.

How to Implement the Accept Payment Flow?#
Tip: For a guide on how to implement this flow in the storefront, check out this guide.
Note: It's highly recommended to use Medusa's workflows to implement this flow. Use the Payment Module's main service for more complex cases.
1. Create a Payment Collection#
A payment collection holds all details related to a resource’s payment operations. So, you start off by creating a payment collection.

In the Medusa application, you associate the payment collection with a cart, which is the resource that the customer is trying to pay for.

For example:

Using Workflow
Using Service
import { createPaymentCollectionForCartWorkflow } from "@medusajs/medusa/core-flows"

// ...

await createPaymentCollectionForCartWorkflow(container)
  .run({
    input: {
      cart_id: "cart_123",
    },
  })
2. Show Payment Providers#
Next, you'll show the customer the available payment providers to choose from.

In the Medusa application, you need to use Query to retrieve the available payment providers in a region.

Using Query
Using Service
const query = container.resolve("query")

const { data: regionPaymentProviders } = await query.graph({
  entryPoint: "region_payment_provider",
  variables: {
    filters: {
      region_id: "reg_123",
    },
  },
  fields: ["payment_providers.*"],
})

const paymentProviders = regionPaymentProviders.map(
  (relation) => relation.payment_providers
)
3. Create Payment Sessions#
The payment collection has one or more payment sessions, each being a payment amount to be authorized by a payment provider.

So, once the customer selects a payment provider, create a payment session for the selected payment provider.

This will also initialize the payment session in the third-party payment provider.

For example:

Using Workflow
Using Service
import { createPaymentSessionsWorkflow } from "@medusajs/medusa/core-flows"

// ...

const { result: paymentSession } = await createPaymentSessionsWorkflow(container)
  .run({
    input: {
      payment_collection_id: "paycol_123",
      provider_id: "pp_stripe_stripe",
    },
  })
4. Authorize Payment Session#
Once the customer places the order, you need to authorize the payment session with the third-party payment provider.

For example:

Using Step
Using Service
import { authorizePaymentSessionStep } from "@medusajs/medusa/core-flows"

// ...

authorizePaymentSessionStep({
  id: "payses_123",
  context: {},
})
When the payment authorization is successful, a payment is created and returned.

Handling Additional Action
Note: If you used the authorizePaymentSessionStep, you don't need to implement this logic as it's implemented in the step.
If the payment authorization isn’t successful, whether because it requires additional action or for another reason, the method updates the payment session with the new status and throws an error.

In that case, you can catch that error and, if the session's status property is requires_more, handle the additional action, then retry the authorization.

For example:

Code
try {
  const payment =
    await paymentModuleService.authorizePaymentSession(
      paymentSession.id,
      {}
    )
} catch (e) {
  // retrieve the payment session again
  const updatedPaymentSession = (
    await paymentModuleService.listPaymentSessions({
      id: [paymentSession.id],
    })
  )[0]

  if (updatedPaymentSession.status === "requires_more") {
    // TODO perform required action
    // TODO authorize payment again.
  }
}
5. Payment Flow Complete#
The payment flow is complete once the payment session is authorized and the payment is created.

You can then:

Complete the cart using the completeCartWorkflow if you're using the Medusa application.
Capture the payment either using the capturePaymentWorkflow or capturePayment method.
Refund captured amounts using the refundPaymentWorkflow or refundPayment method.
Note: Some payment providers allow capturing the payment automatically once it’s authorized. In that case, you don’t need to do it manually.
