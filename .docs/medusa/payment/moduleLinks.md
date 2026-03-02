Links between Payment Module and Other Modules
This document showcases the module links defined between the Payment Module and other Commerce Modules.

Summary#
The Payment Module has the following links to other modules:

First Data Model

Second Data Model

Type

Description

Cart in Cart Module

PaymentCollection

Stored - one-to-one

Learn more

Customer in Customer Module

AccountHolder

Stored - many-to-many

Learn more

Order in Order Module

PaymentCollection

Stored - one-to-many

Learn more

OrderClaim in Order Module

PaymentCollection

Stored - one-to-many

Learn more

OrderExchange in Order Module

PaymentCollection

Stored - one-to-many

Learn more

Region in Region Module

PaymentProvider

Stored - many-to-many

Learn more

Cart Module#
The Cart Module provides cart-related features, but not payment processing.

Medusa defines a link between the Cart and PaymentCollection data models. A cart has a payment collection which holds all the authorized payment sessions and payments made related to the cart.

Learn more about this relation in this documentation.

Retrieve with Query#
To retrieve the cart associated with the payment collection with Query, pass cart.* in fields:

query.graph
useQueryGraphStep
const { data: paymentCollections } = await query.graph({
  entity: "payment_collection",
  fields: [
    "cart.*",
  ],
})

// paymentCollections[0].cart
Manage with Link#
To manage the payment collection of a cart, use Link:

link.create
createRemoteLinkStep
import { Modules } from "@medusajs/framework/utils"

// ...

await link.create({
  [Modules.CART]: {
    cart_id: "cart_123",
  },
  [Modules.PAYMENT]: {
    payment_collection_id: "paycol_123",
  },
})
Customer Module#
Medusa defines a link between the Customer and AccountHolder data models, allowing payment providers to save payment methods for a customer, if the payment provider supports it.

Note: This link is available starting from Medusa v2.5.0.
Retrieve with Query#
To retrieve the customer associated with an account holder with Query, pass customer.* in fields:

query.graph
useQueryGraphStep
const { data: accountHolders } = await query.graph({
  entity: "account_holder",
  fields: [
    "customer.*",
  ],
})

// accountHolders[0].customer
Manage with Link#
To manage the account holders of a customer, use Link:

link.create
createRemoteLinkStep
import { Modules } from "@medusajs/framework/utils"

// ...

await link.create({
  [Modules.CUSTOMER]: {
    customer_id: "cus_123",
  },
  [Modules.PAYMENT]: {
    account_holder_id: "acchld_123",
  },
})
Order Module#
An order's payment details are stored in a payment collection. This also applies for claims and exchanges.

So, Medusa defines links between the PaymentCollection data model and the Order, OrderClaim, and OrderExchange data models.

A diagram showcasing an example of how data models from the Order and Payment modules are linked

Retrieve with Query#
To retrieve the order of a payment collection with Query, pass order.* in fields:

query.graph
useQueryGraphStep
const { data: paymentCollections } = await query.graph({
  entity: "payment_collection",
  fields: [
    "order.*",
  ],
})

// paymentCollections[0].order
Manage with Link#
To manage the payment collections of an order, use Link:

link.create
createRemoteLinkStep
import { Modules } from "@medusajs/framework/utils"

// ...

await link.create({
  [Modules.ORDER]: {
    order_id: "order_123",
  },
  [Modules.PAYMENT]: {
    payment_collection_id: "paycol_123",
  },
})
Region Module#
You can specify for each region which payment providers are available. The Medusa application defines a link between the PaymentProvider and the Region data models.

A diagram showcasing an example of how resources from the Payment and Region modules are linked

This increases the flexibility of your store. For example, you only show during checkout the payment providers associated with the cart's region.

Retrieve with Query#
To retrieve the regions of a payment provider with Query, pass regions.* in fields:

query.graph
useQueryGraphStep
const { data: paymentProviders } = await query.graph({
  entity: "payment_provider",
  fields: [
    "regions.*",
  ],
})

// paymentProviders[0].regions
Manage with Link#
To manage the payment providers in a region, use Link:

link.create
createRemoteLinkStep
import { Modules } from "@medusajs/framework/utils"

// ...

await link.create({
  [Modules.REGION]: {
    region_id: "reg_123",
  },
  [Modules.PAYMENT]: {
    payment_provider_id: "pp_stripe_stripe",
  },
})
