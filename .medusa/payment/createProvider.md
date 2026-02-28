How to Create a Payment Module Provider
In this document, you’ll learn how to create a Payment Module Provider to be used with the Payment Module.

Implementation Example#
As you implement your Payment Module Provider, it can be useful to refer to an existing provider and how it's implemeted.

If you need to refer to an existing implementation as an example, check the Stripe Payment Module Provider in the Medusa repository.

Understanding Payment Module Provider Implementation#
The Payment Module Provider handles processing payment with a third-party provider. However, it's not responsible for managing payment concepts within Medusa, such as payment sessions or collections. These concepts are handled by the Payment Module which uses your Payment Module Provider within core operations.

For example, when the merchant captures an order's payment, the Payment Module uses the Payment Module Provider to capture the payment, the makes updates to the Payment record associated with the order. So, you only have to implement the third-party payment processing logic in your Payment Module Provider.

1. Create Module Provider Directory#
Start by creating a new directory for your module provider.

If you're creating the module provider in a Medusa application, create it under the src/modules directory. For example, src/modules/my-payment.

If you're creating the module provider in a plugin, create it under the src/providers directory. For example, src/providers/my-payment.

Note: The rest of this guide always uses the src/modules/my-payment directory as an example.
2. Create the Payment Module Provider's Service#
Create the file src/modules/my-payment/service.ts that holds the module provider's main service. It must extend the AbstractPaymentProvider class imported from @medusajs/framework/utils:

src/modules/my-payment/service.ts
import { AbstractPaymentProvider } from "@medusajs/framework/utils"

type Options = {
  apiKey: string
}

class MyPaymentProviderService extends AbstractPaymentProvider<
  Options
> {
  // TODO implement methods
}

export default MyPaymentProviderService
constructor#
The constructor allows you to access resources from the module's container using the first parameter, and the module's options using the second parameter.

If you're creating a client or establishing a connection with a third-party service, do it in the constructor.

Note: A module's options are passed when you register it in the Medusa application.
Example
Code
import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"

type Options = {
  apiKey: string
}

type InjectedDependencies = {
  logger: Logger
}

class MyPaymentProviderService extends AbstractPaymentProvider<Options> {
  protected logger_: Logger
  protected options_: Options
  // assuming you're initializing a client
  protected client

  constructor(
    container: InjectedDependencies,
    options: Options
  ) {
    super(container, options)

    this.logger_ = container.logger
    this.options_ = options

    // TODO initialize your client
  }
  // ...
}

export default MyPaymentProviderService
Type Parameters
TConfig
object
Optional
The type of the provider's options passed as a second parameter.
Parameters
cradle
Record<string, unknown>
The module's container used to resolve resources.
identifier#
Each payment provider has a unique identifier defined in its class. The provider's ID will be stored as pp_{identifier}_{id}, where {id} is the provider's id property in the medusa-config.ts.

Example
Code
class MyPaymentProviderService extends AbstractPaymentProvider<
  Options
> {
  static identifier = "my-payment"
  // ...
}
authorizePayment#
This method authorizes a payment session using the third-party payment provider.

During checkout, the customer may need to perform actions required by the payment provider, such as entering their card details or confirming the payment. Once that is done, the customer can place their order.

During cart-completion before placing the order, this method is used to authorize the cart's payment session with the third-party payment provider. The payment can later be captured using the capturePayment method.

Diagram showcasing authorize payment flow

When authorized successfully, a Payment is created by the Payment Module, and it's associated with the order.

Understanding data property
The data property of the method's parameter contains the PaymentSession record's data property, which was returned by the initiatePayment method.

The data property returned by this method is then stored in the created Payment record. You can store data relevant to later capture or process the payment. For example, you can store the ID of the payment in the third-party provider to reference it later.

Diagram showcasing data flow between methods

Example
Code
// other imports...
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  PaymentSessionStatus
} from "@medusajs/framework/types"

class MyPaymentProviderService extends AbstractPaymentProvider<
  Options
> {
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const externalId = input.data?.id

    // assuming you have a client that authorizes the payment
    const paymentData = await this.client.authorizePayment(externalId)

    return {
      data: paymentData,
      status: "authorized"
    }
  }

  // ...
}
Parameters
input
AuthorizePaymentInput
The input to authorize the payment. The data field should contain the data from the payment provider. when the payment was created.
Returns
Promise
Promise<AuthorizePaymentOutput>
The status of the authorization, along with the data field about the payment. Throws in case of an error.
cancelPayment#
This method cancels a payment in the third-party payment provider. It's used when the admin user cancels an order. The order can only be canceled if the payment is not captured yet.

Understanding data property
The data property of the method's parameter contains the Payment record's data property, which was returned by the authorizePayment method.

The data property returned by this method is then stored in the Payment record. You can store data relevant for any further processing of the payment.

Diagram showcasing data flow between methods

Example
Code
// other imports...
import {
  PaymentProviderError,
  PaymentProviderSessionResponse,
} from "@medusajs/framework/types"

class MyPaymentProviderService extends AbstractPaymentProvider<
  Options
> {
  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    const externalId = input.data?.id

    // assuming you have a client that cancels the payment
    const paymentData = await this.client.cancelPayment(externalId)
    return { data: paymentData }
  }

  // ...
}
Parameters
input
CancelPaymentInput
The input to cancel the payment. The data field should contain the data from the payment provider. when the payment was created.
Returns
Promise
Promise<CancelPaymentOutput>
The new data to store in the payment's data property, if any. Throws in case of an error.
capturePayment#
This method captures a payment using the third-party provider. In this method, use the third-party provider to capture the payment.

When an order is placed, the payment is authorized using the authorizePayment method. Then, the admin user can capture the payment, which triggers this method.

Diagram showcasing capture payment flow

This method can also be triggered by a webhook event if the getWebhookActionAndData method returns the action captured.

Understanding data property
The data property of the input parameter contains data that was previously stored in the Payment record's data property, which was returned by the authorizePayment method.

The data property returned by this method is then stored in the Payment record. You can store data relevant to later refund or process the payment. For example, you can store the ID of the payment in the third-party provider to reference it later.

Diagram showcasing data flow between methods

Example
Code
// other imports...
import {
  CapturePaymentInput,
  CapturePaymentOutput,
} from "@medusajs/framework/types"

class MyPaymentProviderService extends AbstractPaymentProvider<
  Options
> {
  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    const externalId = input.data?.id

      // assuming you have a client that captures the payment
    const newData = await this.client.capturePayment(externalId)
    return {
      data: {
        ...newData,
        id: externalId,
      }
    }
  }
  // ...
}
Parameters
input
CapturePaymentInput
The input to capture the payment. The data field should contain the data from the payment provider. when the payment was created.
Returns
Promise
Promise<CapturePaymentOutput>
The new data to store in the payment's data property. Throws in case of an error.
createAccountHolder#
optional
This method is used when creating an account holder in Medusa, allowing you to create the equivalent account in the third-party payment provider. An account holder is useful to later save payment methods, such as credit cards, for a customer in the third-party payment provider using the savePaymentMethod method.

The returned data will be stored in the account holder created in Medusa. For example, the returned id property will be stored in the account holder's external_id property.

Medusa creates an account holder when a payment session initialized for a registered customer.

Note: This is available starting from Medusa v2.5.0.
Example
Code
import { MedusaError } from "@medusajs/framework/utils"

class MyPaymentProviderService extends AbstractPaymentProvider<
 Options
> {
 async createAccountHolder({ context, data }: CreateAccountHolderInput) {
  const { account_holder, customer } = context

  if (account_holder?.data?.id) {
    return { id: account_holder.data.id as string }
  }

  if (!customer) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Missing customer data."
    )
  }

  // assuming you have a client that creates the account holder
  const providerAccountHolder = await this.client.createAccountHolder({
    email: customer.email,
   ...data
  })

  return {
    id: providerAccountHolder.id,
    data: providerAccountHolder as unknown as Record<string, unknown>
  }
}
Parameters
data
CreateAccountHolderInput
Input data including the details of the account holder to create.
Returns
Promise
Promise<CreateAccountHolderOutput>
v2.5.0
The result of creating the account holder. If an error occurs, throw it.
deleteAccountHolder#
optional
This method is used when an account holder is deleted in Medusa, allowing you to also delete the equivalent account holder in the third-party payment provider.

Note: This is available starting from Medusa v2.5.0.
Example
Code
import { MedusaError } from "@medusajs/framework/utils"

class MyPaymentProviderService extends AbstractPaymentProvider<
 Options
> {
  async deleteAccountHolder({ context }: DeleteAccountHolderInput) {
    const { account_holder } = context
    const accountHolderId = account_holder?.data?.id as string | undefined
    if (!accountHolderId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing account holder ID."
      )
    }

    // assuming you have a client that deletes the account holder
    await this.client.deleteAccountHolder({
      id: accountHolderId
    })

    return {}
  }
}
Parameters
data
DeleteAccountHolderInput
Input data including the details of the account holder to delete.
Returns
Promise
Promise<DeleteAccountHolderOutput>
v2.5.0
The result of deleting the account holder. If an error occurs, throw it.
deletePayment#
This method deletes a payment session in the third-party payment provider.

When a customer chooses a payment method during checkout, then chooses a different one, this method is triggered to delete the previous payment session.

If your provider doesn't support deleting a payment session, you can just return an empty object or an object that contains the same received data property.

Diagram showcasing delete payment flow

Understanding data property
The data property of the method's parameter contains the PaymentSession record's data property, which was returned by the initiatePayment method.

Diagram showcasing data flow between methods

Example
Code
// other imports...
import {
  DeletePaymentInput,
  DeletePaymentOutput,
} from "@medusajs/framework/types"

class MyPaymentProviderService extends AbstractPaymentProvider<
  Options
> {
  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    const externalId = input.data?.id

    // assuming you have a client that cancels the payment
    await this.client.cancelPayment(externalId)
    return {
      data: input.data
    }
  }

  // ...
}
Parameters
input
DeletePaymentInput
The input to delete the payment session. The data field should contain the data from the payment provider. when the payment was created.
Returns
Promise
Promise<DeletePaymentOutput>
The new data to store in the payment's data property, if any. Throws in case of an error.
getPaymentStatus#
This method gets the status of a payment session based on the status in the third-party integration.

Example
Code
// other imports...
import {
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  PaymentSessionStatus
} from "@medusajs/framework/types"

class MyPaymentProviderService extends AbstractPaymentProvider<
  Options
> {
  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const externalId = input.data?.id

    // assuming you have a client that retrieves the payment status
    const status = await this.client.getStatus(externalId)

    switch (status) {
      case "requires_capture":
          return {status: "authorized"}
        case "success":
          return {status: "captured"}
        case "canceled":
          return {status: "canceled"}
        default:
          return {status: "pending"}
     }
  }

  // ...
}
Parameters
input
GetPaymentStatusInput
The input to get the payment status. The data field should contain the data from the payment provider. when the payment was created.
Returns
Promise
Promise<GetPaymentStatusOutput>
The payment session's status. It can also return additional data from the payment provider.
getWebhookActionAndData#
This method is executed when a webhook event is received from the third-party payment provider. Medusa uses the data returned by this method to perform actions in the Medusa application, such as completing the associated cart if the payment was authorized successfully.

Learn more in the Webhook Events documentation.

Example
Code
// other imports...
import {
  BigNumber
} from "@medusajs/framework/utils"
import {
  ProviderWebhookPayload,
  WebhookActionResult
} from "@medusajs/framework/types"

class MyPaymentProviderService extends AbstractPaymentProvider<
  Options
> {
  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const {
      data,
      rawData,
      headers
    } = payload

    try {
      switch(data.event_type) {
        case "authorized_amount":
          return {
            action: "authorized",
            data: {
              // assuming the session_id is stored in the metadata of the payment
              // in the third-party provider
              session_id: (data.metadata as Record<string, any>).session_id,
              amount: new BigNumber(data.amount as number)
            }
          }
        case "success":
          return {
            action: "captured",
            data: {
              // assuming the session_id is stored in the metadata of the payment
              // in the third-party provider
              session_id: (data.metadata as Record<string, any>).session_id,
              amount: new BigNumber(data.amount as number)
            }
          }
        default:
          return {
            action: "not_supported",
            data: {
              session_id: "",
              amount: new BigNumber(0)
            }
          }
      }
    } catch (e) {
      return {
        action: "failed",
        data: {
          // assuming the session_id is stored in the metadata of the payment
          // in the third-party provider
          session_id: (data.metadata as Record<string, any>).session_id,
          amount: new BigNumber(data.amount as number)
        }
      }
    }
  }

  // ...
}
Parameters
data
object
The webhook event's data
Returns
Promise
Promise<WebhookActionResult>
The webhook result. If the action's value is captured, the payment is captured within Medusa as well. If the action's value is authorized, the associated payment session is authorized within Medusa and the associated cart will be completed to create an order.
initiatePayment#
This method initializes a payment session with the third-party payment provider.

When a customer chooses a payment method during checkout, this method is triggered to perform any initialization action with the third-party provider, such as creating a payment session.

Diagram showcasing initiate payment flow

Understanding data property
The data property returned by this method will be stored in the created PaymentSession record. You can store data relevant to later authorize or process the payment. For example, you can store the ID of the payment session in the third-party provider to reference it later.

The data property is also available to storefronts, allowing you to store data necessary for the storefront to integrate the payment provider in the checkout flow. For example, you can store the client token to use with the payment provider's SDK.

Note: This also means you shouldn't store sensitive data and tokens in the data property, as it's publicly accessible.
Diagram showcasing data flow between methods

Example
Code
// other imports...
import {
  InitiatePaymentInput,
  InitiatePaymentOutput,
} from "@medusajs/framework/types"

class MyPaymentProviderService extends AbstractPaymentProvider<
  Options
> {
  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const {
      amount,
      currency_code,
      context: customerDetails
    } = input

    // assuming you have a client that initializes the payment
    const response = await this.client.init(
      amount, currency_code, customerDetails
    )

    return {
      id: response.id,
      data: response,
    }
  }

  // ...
}
Parameters
input
InitiatePaymentInput
The input to create the payment session.
Returns
Promise
Promise<InitiatePaymentOutput>
The new data to store in the payment's data property. Throws in case of an error.
listPaymentMethods#
optional
This method is used to retrieve the list of saved payment methods for an account holder in the third-party payment provider. A payment provider that supports saving payment methods must implement this method.

Note: This is available starting from Medusa v2.5.0.
Example
Code
import { MedusaError } from "@medusajs/framework/utils"

class MyPaymentProviderService extends AbstractPaymentProvider<
  Options
> {
  async listPaymentMethods({ context }: ListPaymentMethodsInput) {
    const { account_holder } = context
    const accountHolderId = account_holder?.data?.id as string | undefined

    if (!accountHolderId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing account holder ID."
      )
    }

   // assuming you have a client that lists the payment methods
   const paymentMethods = await this.client.listPaymentMethods({
     customer_id: accountHolderId
   })

   return paymentMethods.map((pm) => ({
     id: pm.id,
     data: pm as unknown as Record<string, unknown>
   }))
 }
}
Parameters
data
ListPaymentMethodsInput
Input data including the details of the account holder to list payment methods for.
Returns
Promise
Promise<ListPaymentMethodsOutput>
v2.5.0
The list of payment methods saved for the account holder. If an error occurs, throw it.
refundPayment#
This method refunds an amount using the third-party payment provider. This method is triggered when the admin user refunds a payment of an order.

Understanding data property
The data property of the method's parameter contains the Payment record's data property, which was returned by the capturePayment or refundPayment method.

The data property returned by this method is then stored in the Payment record. You can store data relevant to later refund or process the payment. For example, you can store the ID of the payment in the third-party provider to reference it later.

Note: A payment may be refunded multiple times with different amounts. In this case, the data property of the input parameter contains the data from the last refund.
Diagram showcasing data flow between methods

Example
Code
// other imports...
import {
  RefundPaymentInput,
  RefundPaymentOutput,
} from "@medusajs/framework/types"

class MyPaymentProviderService extends AbstractPaymentProvider<
  Options
> {
  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    const externalId = input.data?.id

    // assuming you have a client that refunds the payment
    const newData = await this.client.refund(
        externalId,
        input.amount
      )

    return {
      data: input.data,
    }
  }
  // ...
}
Parameters
input
RefundPaymentInput
The input to refund the payment. The data field should contain the data from the payment provider. when the payment was created.
Returns
Promise
Promise<RefundPaymentOutput>
The new data to store in the payment's data property, or an error object.
retrieveAccountHolder#
optional
This method is used when retrieving an account holder in Medusa, allowing you to retrieve the equivalent account in the third-party payment provider. An account holder is useful to later save payment methods, such as credit cards, for a customer in the third-party payment provider using the savePaymentMethod method.

Note: This is available starting from Medusa v2.11.0.
Example
Code
import { MedusaError } from "@medusajs/framework/utils"

class MyPaymentProviderService extends AbstractPaymentProvider<
 Options
> {
 async retrieveAccountHolder({ id }: RetrieveAccountHolderInput) {

  // assuming you have a client that retrieves the account holder
  const providerAccountHolder = await this.client.retrieveAccountHolder({
    id
  })

  return {
    id: providerAccountHolder.id,
    data: providerAccountHolder as unknown as Record<string, unknown>
  }
}
Parameters
data
RetrieveAccountHolderInput
Input data including the details of the account holder to retrieve.
Returns
Promise
Promise<RetrieveAccountHolderOutput>
v2.11.0
The retrieved account holder. If an error occurs, throw it.
retrievePayment#
This method retrieves the payment's data from the third-party payment provider.

Example
Code
// other imports...
import {
  RetrievePaymentInput,
  RetrievePaymentOutput,
} from "@medusajs/framework/types"

class MyPaymentProviderService extends AbstractPaymentProvider<
  Options
> {
  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const externalId = input.data?.id

    // assuming you have a client that retrieves the payment
    return await this.client.retrieve(externalId)
  }
  // ...
}
Parameters
input
RetrievePaymentInput
The input to retrieve the payment. The data field should contain the data from the payment provider when the payment was created.
Returns
Promise
Promise<RetrievePaymentOutput>
The payment's data as found in the payment provider.
savePaymentMethod#
optional
This method is used to save a customer's payment method, such as a credit card, in the third-party payment provider. A payment provider that supports saving payment methods must implement this method.

Note: This is available starting from Medusa v2.5.0.
Example
Code
import { MedusaError } from "@medusajs/framework/utils"

class MyPaymentProviderService extends AbstractPaymentProvider<
  Options
> {
  async savePaymentMethod({ context, data }: SavePaymentMethodInput) {   *
    const accountHolderId = context?.account_holder?.data?.id as
      | string
      | undefined

    if (!accountHolderId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing account holder ID."
      )
    }

   // assuming you have a client that saves the payment method
   const paymentMethod = await this.client.savePaymentMethod({
     customer_id: accountHolderId,
     ...data
   })

  return {
    id: paymentMethod.id,
    data: paymentMethod as unknown as Record<string, unknown>
  }
 }
}
Parameters
data
SavePaymentMethodInput
The details of the payment method to save.
Returns
Promise
Promise<SavePaymentMethodOutput>
v2.5.0
The result of saving the payment method. If an error occurs, throw it.
updateAccountHolder#
optional
This method is used when updating an account holder in Medusa, allowing you to update the equivalent account in the third-party payment provider.

The returned data will be stored in the account holder created in Medusa. For example, the returned id property will be stored in the account holder's external_id property.

Note: This is available starting from Medusa v2.5.1.
Example
Code
import { MedusaError } from "@medusajs/framework/utils"

class MyPaymentProviderService extends AbstractPaymentProvider<
 Options
> {
 async updateAccountHolder({ context, data }: UpdateAccountHolderInput) {
  const { account_holder, customer } = context

  if (!account_holder?.data?.id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Missing account holder ID."
    )
  }

  // assuming you have a client that updates the account holder
  const providerAccountHolder = await this.client.updateAccountHolder({
    id: account_holder.data.id,
   ...data
  })

  return {
    id: providerAccountHolder.id,
    data: providerAccountHolder as unknown as Record<string, unknown>
  }
}
Parameters
data
UpdateAccountHolderInput
Input data including the details of the account holder to update.
Returns
Promise
Promise<UpdateAccountHolderOutput>
v2.5.1
The result of updating the account holder. If an error occurs, throw it.
updatePayment#
This method updates a payment in the third-party service that was previously initiated with the initiatePayment method.

Example
Code
// other imports...
import {
  UpdatePaymentInput,
  UpdatePaymentOutput,
} from "@medusajs/framework/types"

class MyPaymentProviderService extends AbstractPaymentProvider<
  Options
> {
  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    const { amount, currency_code, context } = input
    const externalId = input.data?.id

    // Validate context.customer
    if (!context || !context.customer) {
      throw new Error("Context must include a valid customer.");
    }

    // assuming you have a client that updates the payment
    const response = await this.client.update(
      externalId,
        {
          amount,
          currency_code,
          customer: context.customer
        }
      )

    return response
  }

  // ...
}
Parameters
input
UpdatePaymentInput
The input to update the payment. The data field should contain the data from the payment provider. when the payment was created.
Returns
Promise
Promise<UpdatePaymentOutput>
The new data to store in the payment's data property. Throws in case of an error.
validateOptions#
This method validates the options of the provider set in medusa-config.ts. Implementing this method is optional, but it's useful to ensure that the required options are passed to the provider, or if you have any custom validation logic.

If the options aren't valid, throw an error.

Example
Code
class MyPaymentProviderService extends AbstractPaymentProvider<Options> {
  static validateOptions(options: Record<any, any>) {
    if (!options.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "API key is required in the provider's options."
      )
    }
  }
}
Parameters
options
Record<any, any>
The provider's options passed in medusa-config.ts.
3. Create Module Provider Definition File#
Create the file src/modules/my-payment/index.ts with the following content:

src/modules/my-payment/index.ts
import MyPaymentProviderService from "./service"
import { 
  ModuleProvider, 
  Modules
} from "@medusajs/framework/utils"

export default ModuleProvider(Modules.PAYMENT, {
  services: [MyPaymentProviderService],
})
This exports the module provider's definition, indicating that the MyPaymentProviderService is the module provider's service.

Tip: A payment module provider can have export multiple provider services, where each are registered as a separate payment provider.
4. Use Module Provider#
To use your Payment Module Provider, add it to the providers array of the Payment Module in medusa-config.ts:

medusa-config.ts
module.exports = defineConfig({
  // ...
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            // if module provider is in a plugin, use `plugin-name/providers/my-payment`
            resolve: "./src/modules/my-payment",
            id: "my-payment",
            options: {
              // provider options...
              apiKey: "..."
            }
          }
        ]
      }
    }
  ]
})
5. Test it Out#
Before you use your Payment Module Provider, enable it in a region using the Medusa Admin.

Then, go through checkout to place an order. Your Payment Module Provider is used to authorize the payment.

Useful Guides#
Storefront Guide: how to implement UI for your Payment Module Provider during checkout
