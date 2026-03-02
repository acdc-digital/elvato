Manage Order Payments in Medusa Admin
In this guide, you’ll learn how to manage an order’s payment, including capturing and refunding the payment.

Overview#
When a customer places an order, their payment is authorized by the payment provider they've chosen. You can manage an order's payment by capturing it, refunding it, or handling outstanding amounts.

Order Payment Statuses#
At the top of the order details page, you can see the payment status of the order. The payment status can be one of the following:

Status	Description
Authorized	The default status when an order is placed, unless the payment provider is configured to automatically capture the payment.
Partially Authorized	Part of the payment is authorized, which happens if an order has changed. For example, if an order was edited and new payment is required.
Captured	The payment has been captured and processed with the payment provider.
Partially Captured	A part of the payment has been captured. This happens when an order's payment was previously captured, but a change to the status, such as an exchange, requires additional payment.
Refunded	The payment has been refunded to the customer.
Partially Refunded	A part of the payment has been refunded.
Capture Payment#
Unless the payment provider that the customer chose is configured to automatically capture an order's payment, you need to manually capture the payment.

Capturing an order's payment triggers its processing with the chosen payment provider, such as Stripe.

Note: If you're unsure whether your payment provider is configured to automatically capture payments, please contact your technical team to debug the integrated payment service.
To capture an order’s payment:

Open the order's details page.
Scroll to the Payments section.
Click on the Capture Payment button.
Confirm capturing the payment by clicking the "Confirm" button in the pop-up.
Capture Payment Button

Refund Payment#
You can refund a payment either partially or in full. This can be done for various reasons, such as when a customer returns an item or if there was an error in the order.

Note: Prior to Medusa v2.11.0, you were only able to refund a payment after creating a return or making an order change. From Medusa v2.11.0 onwards, you can refund a payment directly from the order details page without needing to create a return or make an order change. If you're unable to refund a payment, contact your technical team to update your Medusa application.
Refunding the payment triggers its processing with the chosen payment provider, such as Stripe.

Warning: Refunding payments is irreversible.
To refund an order's captured payment:

Open the order's details page.
Scroll to the Payment section.
Click on the  icon at the end of the payment to refund.
Choose "Refund" from the dropdown.
In the side window that opens, fill out the following fields:
Amount: Enter the amount to refund.
Refund Reason: Select a reason for the refund from the dropdown. You can manage refund reasons in the settings.
Note: Enter a note that the customer can see in the notification they receive.
Once you’re done, click on the Save button.
Once the payment is refunded, the customer will receive a notification about the refund and you can view the refund as part of the order's activity.

Refund Payment Form

Handling Positive Outstanding Amounts#
An order may have a positive outstanding amount either after making changes to it, or if it was created as a draft order.

A positive outstanding amount indicates that the customer needs to pay an additional amount to complete the order.

Outstanding amount in Summary

You can handle it by either:

Marking the order as paid manually;
Or copying a payment link.
Mark Outstanding Amount as Paid#
By marking a positive outstanding amount as paid, you're capturing the payment without processing it through the associated payment provider. Instead, you handle capturing the payment outside of Medusa.

To mark a positive outstanding amount as paid:

Open the order's details page.
In the Summary section, click on the "Mark as paid" button.
Confirm marking the payment as paid by clicking the "Confirm" button in the pop-up.
Copy Payment Link for Additional Payment#
Another way you can handle a positive outstanding amount is by sharing a payment link with the customer to authorize the payment. The payment link is a link in the storefront that the customer can use to pay for the additional amount.

To copy a payment link for the additional payment:

Open the order's details page.
In the Summary section, click on the "Copy payment link" button.
The link is then copied and you can share it with the customer to authorize the payment. Once authorized, you can then capture the payment.

Tip: If the payment link doesn't start with a domain or has a domain that doesn't match your storefront, refer your technical team to this guide to set up the storefront domain.