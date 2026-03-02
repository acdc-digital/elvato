Payment Session
In this document, you’ll learn what a payment session is.

What's a Payment Session?#
A payment session, represented by the PaymentSession data model, is a payment amount to be authorized. It’s associated with a payment provider that handles authorizing it.

A payment collection can have multiple payment sessions. Using this feature, you can implement payment in installments or payments using multiple providers.

Diagram showcasing how every payment session has a different payment provider

data Property#
Payment providers may need additional data to process the payment later. For example, the ID of the session in the third-party provider.

The PaymentSession data model has a data property used to store that data. It's set by the payment provider in Medusa when the payment is initialized.

Then, when the payment session is authorized, the data property is used by the payment provider in Medusa to process the payment with the third-party provider.

Tip: If you're building a custom payment provider, learn more about initializing the payment session and setting the data property in the Create Payment Provider guide.
data Property in the Storefront#
This data property is accessible in the storefront as well. So, only store in it data that can be publicly shared, and data that is useful in the storefront.

For example, you can also store the client token used to initialize the payment session in the storefront with the third-party provider.

Payment Session Status#
The status property of a payment session indicates its current status. Its value can be:

pending: The payment session is awaiting authorization.
requires_more: The payment session requires an action before it’s authorized. For example, to enter a 3DS code.
authorized: The payment session is authorized.
error: An error occurred while authorizing the payment.
canceled: The authorization of the payment session has been canceled.