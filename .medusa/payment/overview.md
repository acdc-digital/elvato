Payment Module
In this section of the documentation, you will find resources to learn more about the Payment Module and how to use it in your application.

Looking for no-code docs? Refer to the Medusa Admin User Guide to learn how to manage order payments using the dashboard.
Medusa has payment related features available out-of-the-box through the Payment Module. A module is a standalone package that provides features for a single domain. Each of Medusa's commerce features are placed in Commerce Modules, such as this Payment Module.

Note: Learn more about why modules are isolated in this documentation.
Payment Features#
Authorize, Capture, and Refund Payments: Authorize, capture, and refund payments for a single resource.
Payment Collection Management: Store and manage all payments of a single resources, such as a cart, in payment collections.
Integrate Third-Party Payment Providers: Use payment providers like Stripe to handle and process payments, or integrate custom payment providers.
Saved Payment Methods: Save payment methods for customers in third-party payment providers.
Handle Webhook Events: Handle webhook events from third-party providers and process the associated payment.
How to Use the Payment Module#
In your Medusa application, you build flows around Commerce Modules. A flow is built as a Workflow, which is a special function composed of a series of steps that guarantees data consistency and reliable roll-back mechanism.

You can build custom workflows and steps. You can also re-use Medusa's workflows and steps, which are provided by the @medusajs/medusa/core-flows package.

For example:

src/workflows/create-payment-collection.ts
import { 
  createWorkflow, 
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"

const createPaymentCollectionStep = createStep(
  "create-payment-collection",
  async ({}, { container }) => {
    const paymentModuleService = container.resolve(Modules.PAYMENT)

    const paymentCollection = await paymentModuleService.createPaymentCollections({
      currency_code: "usd",
      amount: 5000,
    })

    return new StepResponse({ paymentCollection }, paymentCollection.id)
  },
  async (paymentCollectionId, { container }) => {
    if (!paymentCollectionId) {
      return
    }
    const paymentModuleService = container.resolve(Modules.PAYMENT)

    await paymentModuleService.deletePaymentCollections([paymentCollectionId])
  }
)

export const createPaymentCollectionWorkflow = createWorkflow(
  "create-payment-collection",
  () => {
    const { paymentCollection } = createPaymentCollectionStep()

    return new WorkflowResponse({
      paymentCollection,
    })
  }
)
You can then execute the workflow in your custom API routes, scheduled jobs, or subscribers:

API Route
Subscriber
Scheduled Job
src/api/workflow/route.ts
Show Imports
import { createPaymentCollectionWorkflow } from "../../workflows/create-payment-collection"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { result } = await createPaymentCollectionWorkflow(req.scope)
    .run()

  res.send(result)
}
Learn more about workflows in this documentation.

Configure Payment Module#
The Payment Module accepts options for further configurations. Refer to this documentation for details on the module's options.

Providers#
Medusa provides the following payment providers out-of-the-box. You can use them to process payments for orders, returns, and other resources.

Stripe
PayPal
Server Guides#
Learn how to use the Payment Module in your customizations on the Medusa application server.

Accept Payment Flow
Create Payment Provider
Saved Payment Methods
Storefront Guides#
Learn how to integrate the Payment Module's features into your storefront.

Checkout Step 4: Choose Payment Provider
Checkout Step 5: Complete Cart
Implement Express Checkout with Medusa
Implement Mobile App with React Native, Expo, and Medusa
Payment with Stripe in React Storefront
Use Stripe's Payment Element in the Next.js Starter Storefront
References#
Find references for tools and resources related to the Payment Module, such as data models, methods, and more. These are useful for your customizations.

Workflows
JS SDK
Events Reference
Main Service Reference
Data Models Reference
Was this page helpful?

It was helpful

It wasn't helpful

Report Issue
