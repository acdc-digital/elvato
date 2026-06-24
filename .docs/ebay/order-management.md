# Order Management Guide

**Guide Group:** Order Management

---

## Overview

The Order Management APIs provide sellers with the ability to handle various aspects of the order management process. These APIs include methods that can be used to retrieve order details, update order statuses, and manage shipping and tracking information, as well as methods to handle Item Not Returned (INR) inquiries, order cancellations, and item returns.

## API Use Cases

[Retrieving and fulfilling orders](#fulfillingorders)  
[Managing order cancellations](#ordercancellations)  
[Managing Item Not Received (INR) inquiries](#inrinquiries)  
[Managing returns](#managingreturns)  
[Managing payment disputes](#paymentdisputes)

##### Retrieving and fulfilling orders

Once a buyer completes the checkout process on eBay and purchases an item, an _order_ is created. Orders can be made up of multiple line items, and it is up to the seller to group the line items of an order into one or more packages and fulfill the order.

The multiple approaches to managing orders and shipping fulfillments are discussed below:

**Retrieving and fulfilling orders with Fulfillment API**

The [Fulfillment API](/api-docs/sell/fulfillment/overview.html) allows sellers to efficiently manage the order fulfillment process, and includes functionality to retrieve orders, assign order line items to shipping packages, and provide shipment tracking.

Sellers can use [getOrder](/api-docs/sell/fulfillment/resources/order/methods/getOrder) to retrieve a specific order, or can use [getOrders](/api-docs/sell/fulfillment/resources/order/methods/getOrders) to retrieve multiple orders based on order IDs, date range, or fulfillment status. Below are some key fields that are returned in the response of both methods.

*   Line item quantity [(lineItems.quantity](/api-docs/sell/fulfillment/resources/order/methods/getOrder#response.lineItems.quantity))
*   Shipping address ([shippingStep.shipTo](/api-docs/sell/fulfillment/resources/order/methods/getOrder#response.fulfillmentStartInstructions.shippingStep.shipTo))
*   Buyer’s selected shipping service ([shippingCarrierCode](/api-docs/sell/fulfillment/resources/order/methods/getOrder#response.fulfillmentStartInstructions.shippingStep.shippingCarrierCode) and [shippingServiceCode](/api-docs/sell/fulfillment/resources/order/methods/getOrder#response.fulfillmentStartInstructions.shippingStep.shippingServiceCode))
*   The expected shipping date window based on the selected shipping service and handling time ([maxEstimatedDeliveryDate](/api-docs/sell/fulfillment/resources/order/methods/getOrder#response.fulfillmentStartInstructions.maxEstimatedDeliveryDate) and [minEstimatedDeliveryDate](/api-docs/sell/fulfillment/resources/order/methods/getOrder#response.fulfillmentStartInstructions.minEstimatedDeliveryDate))
*   Ship-by date ([lineItemFulfillmentInstructions.shipByDate](/api-docs/sell/fulfillment/resources/order/methods/getOrder#response.lineItems.lineItemFulfillmentInstructions.shipByDate))
*   Cost and tax information for the order

*   Order cost ([pricingSummary.total](/api-docs/sell/fulfillment/resources/order/methods/getOrder#response.pricingSummary.total))
*   Shipping costs ([pricingSummary.deliveryCost](/api-docs/sell/fulfillment/resources/order/methods/getOrder#response.pricingSummary.deliveryCost))
*   Tax amount ([pricingSummary.tax](/api-docs/sell/fulfillment/resources/order/methods/getOrder#response.pricingSummary.tax))

Orders must be marked as shipped before they are considered "fulfilled" (see the [orderFulfillmentStatus](/api-docs/sell/fulfillment/resources/order/methods/getOrder#response.orderFulfillmentStatus) response field of the **getOrder(s)** method). If the seller purchases an eBay shipping label for the order, eBay will automatically mark the order as fulfilled and will provide tracking information for the order. If the seller does not use eBay shipping labels, they can use the [createShippingFulfillment](/api-docs/sell/fulfillment/resources/order/shipping_fulfillment/methods/createShippingFulfillment) method to mark the order as shipped and provide shipment tracking information.

The [createShippingFulfillment](/api-docs/sell/fulfillment/resources/order/shipping_fulfillment/methods/createShippingFulfillment) method can be used to assign one or more line items of an order to a single package, and shipment tracking information must be provided for that package. This call must be repeated for each package in an order.

Use [getShippingFulfillment](/api-docs/sell/fulfillment/resources/order/shipping_fulfillment/methods/getShippingFulfillment) to retrieve details on a specific shipping package or an order, or use [getShippingFulfillments](/api-docs/sell/fulfillment/resources/order/shipping_fulfillment/methods/getShippingFulfillments) to retrieve details on all shipping packages of an order.

**Retrieving and fulfilling orders with Trading API**

The order management calls of the [Trading API](/devzone/xml/docs/reference/ebay/OrderManagementIndex.html) allow sellers to manage the order fulfillment process and include functionality to retrieve all of their active orders, send invoices to the buyer, combine multiple unpaid order line items into one order, and perform various post-sale tasks.

The Trading API calls used to manage orders are discussed below:

*   Retrieve information about the orders associated with a seller using [GetOrders](/devzone/xml/docs/reference/ebay/getorders.html). The following data is retrieved for each order:

*   Line item quantity ([QuantityPurchased](/devzone/xml/docs/reference/ebay/getorders.html#Response.OrderArray.Order.TransactionArray.Transaction.QuantityPurchased))
*   Shipping address ([ShippingAddress](/devzone/xml/docs/reference/ebay/getorders.html#Response.OrderArray.Order.ShippingAddress))
*   Buyer’s selected shipping service ([ShippingService](/devzone/xml/docs/reference/ebay/getorders.html#Response.OrderArray.Order.ShippingServiceSelected.ShippingService))
*   Cost and tax information for the order

*   Order cost ([Order.Total](/devzone/xml/docs/reference/ebay/getorders.html#Response.OrderArray.Order.Total))
*   Shipping costs ([ShippingServiceCost](/devzone/xml/docs/reference/ebay/getorders.html#Response.OrderArray.Order.TransactionArray.Transaction.ShippingServiceSelected.ShippingServiceCost))
*   Tax amount ([Taxes](/devzone/xml/docs/reference/ebay/getorders.html#Response.OrderArray.Order.TransactionArray.Transaction.Taxes))

Orders must be marked as shipped before they are considered “fulfilled” (see [OrderStatus](/devzone/xml/docs/reference/ebay/getorders.html#Response.OrderArray.Order.OrderStatus) response field of the **GetOrder(s)** methods). If the seller purchases an eBay shipping label for the order, eBay will automatically mark the order as fulfilled and will provide tracking information for the order. If the seller does not use eBay shipping labels, they can use the [CompleteSale](/devzone/xml/docs/reference/ebay/CompleteSale.html) method to mark the order as shipped and provide shipment tracking information.

[CompleteSale](/devzone/xml/docs/reference/ebay/CompleteSale.html) can also be used for various post-sale tasks, such as marking an order as paid (see the [Paid](/devzone/xml/docs/reference/ebay/CompleteSale.html#Request.Paid) boolean) or leaving feedback for the buyer (see the [FeedbackInfo](/devzone/xml/docs/reference/ebay/CompleteSale.html#Request.FeedbackInfo) container).

Below are the other order-related calls available in the Trading API:

*   Use [GetSellerTransactions](/devzone/xml/docs/reference/ebay/getsellertransactions.html) to retrieve line item information for one or more orders, or use [GetItemTransactions](/devzone/xml/docs/reference/ebay/GetItemTransactions.html) to retrieve line item information for a specific fixed-price listing.
*   If a buyer has not yet paid for an order, send an email invoice reminder to the buyer using [SendInvoice](/devzone/xml/docs/reference/ebay/SendInvoice.html).
*   Use [AddOrder](/devzone/xml/docs/reference/ebay/AddOrder.html) to combine two or more unpaid order line items from the same buyer into one Combined Invoice order.

**Downloading USPS shipping labels with Logistics API**

The [Logistics API](/api-docs/sell/logistics/overview.html) allows you to retrieve available USPS shipping label costs based on ship-from, ship-to, and package weight/dimensions, select the appropriate shipping option, and download the USPS shipping label.

**Note:** The Logistics API is restricted and only accessible to approved eBay partners. This API can only be used for domestic shipping within the US, only supports USPS shipping rates and labels, and only supports order-level fulfillment.

Below is the basic flow used to view shipping quotes, select the quote you want, and download shipping labels:

![Banner image](/cms/img/ordermanagementguide/logistics-api.png)

1.  Retrieve the costs and details of available USPS shipping options using [createShippingQuote](/api-docs/sell/logistics/resources/shipping_quote/methods/createShippingQuote) and configure the following required fields: 

*   [ShipFrom](/api-docs/sell/logistics/resources/shipping_quote/methods/createShippingQuote#request.shipFrom)
*   [ShipTo](/api-docs/sell/logistics/resources/shipping_quote/methods/createShippingQuote#request.shipTo)
*   [PackageSpecification](/api-docs/sell/logistics/resources/shipping_quote/methods/createShippingQuote#request.packageSpecification)

3.  Using the **shippingQuoteId** and **rateId** values returned in [createShippingQuote](/api-docs/sell/logistics/resources/shipping_quote/methods/createShippingQuote) response, use [createFromShippingQuote](/api-docs/sell/logistics/resources/shipment/methods/createFromShippingQuote) to generate and customize the USPS shipping label for the selected shipping service. Note that the selected shipping service should match the shipping service that the buyer selected at checkout.
4.  Using the shipmentId value returned in [createFromShippingQuote](/api-docs/sell/logistics/resources/shipment/methods/createFromShippingQuote), use [downloadLabelFile](/api-docs/sell/logistics/resources/shipment/methods/downloadLabelFile) to download a PDF file of the USPS shipping label.

Below are the other methods available with the Logistics API:

*   Use [getShipment](/api-docs/sell/logistics/resources/shipment/methods/getShipment) to retrieve the shipping details of a specific shipment.
*   Use [getShippingQuote](/api-docs/sell/logistics/resources/shipping_quote/methods/getShippingQuote) to retrieve the completed details of a specific shipping quote.
*   Use [cancelShipment](/api-docs/sell/logistics/resources/shipment/methods/cancelShipment) to cancel a shipment and delete its associated shipping label.

##### Managing order cancellations

The [Post-Order API](/devzone/post-order/index.html) allows sellers to cancel orders up to 30 days after checkout. Sellers can cancel an order for a number of reasons, such as if a buyer requests a cancellation or if the purchased item is out of stock. The order is automatically cancelled if the seller makes a **Create Cancellation Request** call, and the buyer will be refunded by eBay if the order has already been paid for.

The Post-Order API methods used to manage order cancellations are discussed below:

![Banner image](/cms/img/ordermanagementguide/order-cancellation-with-seller-flow.png)

1.  Use [Search Cancellations](/devzone/post-order/post-order_v2_cancellation_search__get.html) to see if a seller has any cancellation requests. Numerous filters are available for this method, including by date range or item\_id. Refer to the [cancelReason](/devzone/post-order/post-order_v2_cancellation_search__get.html#Response.cancellations.cancelReason) field to see why the buyer initiated the cancel request, and the [cancelState](/devzone/post-order/post-order_v2_cancellation_search__get.html#Response.cancellations.cancelState) and [cancelStatus](/devzone/post-order/post-order_v2_cancellation_search__get.html#Response.cancellations.cancelStatus) fields to determine upcoming cancellation events and the appropriate actions you can take.
2.  If a buyer requests to cancel an order, sellers can either approve or reject the cancellation using [Approve Cancellation](/devzone/post-order/post-order_v2_cancellation-cancelid_approve__post.html) or [Reject Cancellation](/devzone/post-order/post-order_v2_cancellation-cancelid_reject__post.html).

*   If the seller **approves** the cancellation, the buyer will be fully refunded by eBay.
*   If the seller **rejects** the cancellation, such as if the order has already been shipped, the shipped date and tracking number should be supplied through the [shipmentDate](/devzone/post-order/post-order_v2_cancellation-cancelid_reject__post.html#Request.shipmentDate) and [trackingNumber](/devzone/post-order/post-order_v2_cancellation-cancelid_reject__post.html#Request.trackingNumber) fields, respectively.

4.  If approved, if the item has already been paid for, eBay will automatically issue a full refund to the buyer.

 Below are the other methods applicable to managing order cancellations with the Post-Order API:

*   For the seller to initiate an order cancellation, use [Create Cancellation Request](/devzone/post-order/post-order_v2_cancellation__post.html) and specify the reason for the cancellation though the [cancelReason](/devzone/post-order/post-order_v2_cancellation__post.html#Request.cancelReason) field with one of the following values:

*   BUYER\_ASKED\_CANCEL (cancelling order upon request from the buyer).
*   OUT\_OF\_STOCK\_OR\_CANNOT\_FULFILL (used if the seller is out of stock on the item or otherwise can't fulfill the order).

*   Use [Get Cancellation](/devzone/post-order/post-order_v2_cancellation-cancelid__get.html) to retrieve details about a specific cancellation request.

##### Managing Item Not Received (INR) inquiries

An Item Not Received (INR) inquiry can be created by a buyer once the estimated delivery date window for an item they have purchased has passed and the item has still not been received. When a buyer creates an INR inquiry, they can either request a full refund for the item, or inform the seller that they still want the item.

The Post-Order API methods used to manage INR inquiries are discussed below:

![Banner image](/cms/img/ordermanagementguide/inr-inquiries.png)

**Managing INR inquiries**

1.  Use [Search Inquiries](/devzone/post-order/post-order_v2_inquiry_search__get.html) to see if a seller has any INR inquiry requests. Numerous filters are available for this method, including by date range or item\_id. Refer to the [InquiryStatusEnum](/devzone/post-order/post-order_v2_inquiry_search__get.html#Response.members.inquiryStatusEnum) response enum to see the current status of an INR inquiry.
2.  If the buyer still wants the item they filed an INR inquiry against, provide updated shipment tracking details for the shipment of the line item using [Provide Inquiry Shipment Info](/devzone/post-order/post-order_v2_inquiry-inquiryid_provide_shipment_info__post.html).
3.  If the buyer wants a refund for the item they filed an INR inquiry against, issue a refund for missing line item using [Issue Inquiry Refund](/devzone/post-order/post-order_v2_inquiry-inquiryid_issue_refund__post.html). If necessary, sellers can also provide more information to the buyer about the refund using [Provide Inquiry Refund Info](/devzone/post-order/post-order_v2_inquiry-inquiryid_provide_refund_info__post.html).

**Managing INR cases**

If a seller doesn’t address an INR inquiry in a timely manner, a buyer may escalate the inquiry into an INR case. Below is the typical flow one might use with Post-Order API methods:

1.  Use [Search Cases](/devzone/post-order/post-order_v2_casemanagement_search__get.html) to retrieve all recent cases. Numerous filters are available for this method, including date range filter or case status. You will want to include the **case\_status\_filter** query parameter and set its value to OPEN to retrieve all open cases.
2.  Use [Get Case](/devzone/post-order/post-order_v2_casemanagement-caseid__get.html) after **Search Cases** to see what can be done to help resolve the case. The case ID is required as a path parameter to this call. The response of this call has full history details, including the history of the INR inquiry that led to the case.
3.  One of the following methods can be used to help resolve the case and lead to the buyer or eBay closing the case:

*   [Issue Case Refund](/devzone/post-order/post-order_v2_casemanagement-caseid_issue_refund__post.html): this method should be used if the buyer no longer wants the item and just wants to be refunded.
*   [Provide Case Shipment Info](/devzone/post-order/post-order_v2_casemanagement-caseid_provide_shipment_info__post.html): this method should be used if the buyer still wants the item and wants to be able to track the shipment of the order.

Below are the other methods applicable to managing INR inquiries with the Post-Order API:

*   Use [Send Inquiry Message](/devzone/post-order/post-order_v2_inquiry-inquiryid_send_message__post.html) to send a message to the buyer about an INR inquiry.
*   If needed, use [Escalate Inquiry](/devzone/post-order/post-order_v2_inquiry-inquiryid_escalate__post.html) to escalate an INR inquiry into a case. This can be used if the seller has already shipped the order line item, but the buyer is refusing to close the inquiry.
*   Use [Get Inquiry](/devzone/post-order/post-order_v2_inquiry-inquiryid__get.html) to retrieve details about a specific INR inquiry.

##### Managing returns

There are occasionally circumstances where a buyer will request to return an order. There are a variety of reasons this may occur, such as if an article of clothing did not fit, the item was damaged during shipment, the item wasn’t as described in the listing, or the buyer just changed their mind about the item. The Post-Order API has methods that allow the seller to view any current return requests and manage the return process.

The Post-Order API methods used to manage return requests are discussed below:

**Standard approve return flow**

![Banner image](/cms/img/ordermanagementguide/managing-returns.png)

1.  Use [Search Returns](/devzone/post-order/post-order_v2_return_search__get.html) to see if a seller has any return requests. If so, refer to the [creationInfo.reason](/devzone/post-order/post-order_v2_return_search__get.html#Response.members.creationInfo.reason) field to see the buyer’s reason for the return, as well as the [creationInfo.reasonType](/devzone/post-order/post-order_v2_return_search__get.html#Response.members.creationInfo.reasonType) field to check if the return has been classified as SNAD or REMORSE. Sellers are responsible for the return shipping cost for SNAD returns.
2.  Approve return request using [Process Return Request](/devzone/post-order/post-order_v2_return-returnid_decide__post.html).

*   If approved and the **buyer is responsible for the return shipping**, they can ship the item back after the return request has been approved by the seller.
*   If approved and the **seller is responsible for the return shipping**, use [Add Shipping Label Info](/devzone/post-order/post-order_v2_return-returnid_add_shipping_label__post.html) to create and send a shipping label to the buyer.

4.  Once the item has been returned by the buyer, mark the item as received using [Mark Return Received](/devzone/post-order/post-order_v2_return-returnid_mark_as_received__post.html).

**Managing SNAD return cases**

If a seller doesn’t address a SNAD (Significantly not as Described) return request in a timely manner, a buyer may escalate the return request into a Return case. Below is the typical flow one might use with Post-Order API methods:

![Banner image](/cms/img/ordermanagementguide/snad.png)

1.  Use [Search Cases](/devzone/post-order/post-order_v2_casemanagement_search__get.html) to retrieve all recent cases. Numerous filters are available for this method, including by date range or case status. You will want to include the **case\_status\_filter** query parameter and set its value to OPEN to retrieve all open cases.
2.  Use [Get Case](/devzone/post-order/post-order_v2_casemanagement-caseid__get.html) to see what can be done to resolve the case. The case ID is required as a path parameter to this call. The response of this call has full history details, including the history of the return request that led to the case.
3.  One of the following methods can be used to resolve the case and lead to the buyer or eBay closing the case:

*   [Issue Case Refund](/devzone/post-order/post-order_v2_casemanagement-caseid_issue_refund__post.html): this method can be used if the seller is willing to let the buyer keep the item, but still issue a full refund.
*   [Provides Return Address](/devzone/post-order/post-order_v2_casemanagement-caseid_provide_return_address__post.html): this method can be used to provide the buyer the return address and RMA number (if applicable).

Below are the other methods applicable to managing return requests with the Post-Order API:

*   Use [Issue Return Refund](/devzone/post-order/post-order_v2_return-returnid_issue_refund__post.html) to issue a full or partial refund to the buyer for the returned item. This method is used if the seller tells the buyer to keep the item and that they will still send them a full refund, or if the buyer reports the item as SNAD, but the buyer and seller negotiate a partial refund.  Once the refund has been sent, use [Mark Return Refund Sent](/devzone/post-order/post-order_v2_return-returnid_mark_refund_sent__post.html) to notify the buyer that a refund has been issued for the item.
*   Use [Get Return Files](/devzone/post-order/post-order_v2_return-returnid_files__get.html) to retrieve the files associated with a return request.
*   Use [Set Return Preferences](/devzone/post-order/post-order_v2_return_preference__post.html) to set your return preferences, such as if a Return Merchandise Authorization (RMA) is required for returned items.
*   Use [Get Return Preferences](/devzone/post-order/post-order_v2_return_preference__get.html) to retrieve a seller’s return preferences, such as if an RMA is required or if automated return rules are turned on.
*   Use [Get Return Shipping Label](/devzone/post-order/post-order_v2_return-returnid_get_shipping_label__get.html) to retrieve the data for a return shipping label, including the URL where the label can be downloaded.
*   Use [Get Shipment Tracking Info](/devzone/post-order/post-order_v2_return-returnid_tracking__get.html) to retrieve shipment tracking activity on a specific return request.
*   Use [Send Return Message](/devzone/post-order/post-order_v2_return-returnid_send_message__post.html) to send a message to a buyer regarding a return request.
*   Use [Void Shipping Label](/devzone/post-order/post-order_v2_return-returnid_void_shipping_label__post.html) to void a current return shipping label.
*   If needed, use [Escalate Return](/devzone/post-order/post-order_v2_return-returnid_escalate__post.html) to escalate a return request into a case. This can be used if the seller never receives the item back from the buyer, or if the seller has an issue with the returned item.

##### Managing payment disputes

It is possible that an eBay buyer will initiate a payment dispute with their payment provider instead of directly on the eBay platform. The payment dispute operations in the [Fulfillment API](/api-docs/sell/fulfillment/overview.html) allow sellers to discover these types of disputes. This API contains methods to retrieve payment disputes that have been created, as well as operations to accept or contest these payment disputes and upload image files to support the seller's case if a seller decides to contest a dispute.

The Fulfillment API methods used to manage third-party payment disputes are discussed below:

![Banner image](/cms/img/ordermanagementguide/payment-disputes.png)

1.  Use [getPaymentDisputeSummaries](/api-docs/sell/fulfillment/resources/payment_dispute/methods/getPaymentDisputeSummaries) to retrieve one or more payment disputes filed against a seller. You can filter by an order ID, buyer user ID, date range, or dispute status. The following information is returned for each payment dispute:

*   [paymentDisputeStatus](/api-docs/sell/fulfillment/resources/payment_dispute/methods/getPaymentDisputeSummaries#response.paymentDisputeSummaries.paymentDisputeStatus): The status of the payment dispute. Disputes with a status of ACTION\_NEEDED indicate that the payment dispute is open and the seller is required to take action.
*   [respondByDate](/api-docs/sell/fulfillment/resources/payment_dispute/methods/getPaymentDisputeSummaries#response.paymentDisputeSummaries.respondByDate): The time and date the seller must respond to a payment dispute.
*   [reason](/api-docs/sell/fulfillment/resources/payment_dispute/methods/getPaymentDisputeSummaries#response.paymentDisputeSummaries.reason): The reason the buyer initiated the payment dispute. For a list of supported reasons, see [DisputeReasonEnum](/api-docs/sell/fulfillment/types/api:DisputeReasonEnum).
*   [paymentDisputeId](/api-docs/sell/fulfillment/resources/payment_dispute/methods/getPaymentDisputeSummaries#response.paymentDisputeSummaries.paymentDisputeId): The unique identifier of the payment dispute. This value should be stored for future reference.

3.  To retrieve more details about an open dispute that the seller needs to take action against, use [getPaymentDispute](/api-docs/sell/fulfillment/resources/payment_dispute/methods/getPaymentDispute).
4.  Accept the dispute using [acceptPaymentDispute](/api-docs/sell/fulfillment/resources/payment_dispute/methods/acceptPaymentDispute) or contest the dispute. If the payment dispute is accepted, the buyer will be refunded and the dispute will be closed. If the seller chooses to contest the payment dispute, proceed with the following steps.
5.  Use [uploadEvidenceFile](/api-docs/sell/fulfillment/resources/payment_dispute/methods/uploadEvidenceFile) to upload each file being used to contest the dispute.
6.  Referencing the **fileId** value returned in the previous step, use [addEvidence](/api-docs/sell/fulfillment/resources/payment_dispute/methods/addEvidence) to create an evidence set and add one or more uploaded files to the evidence set. The type of evidence required depends on the buyer’s dispute reason. See [EvidenceTypeEnum](/api-docs/sell/fulfillment/types/api:EvidenceTypeEnum) for a full list of supported types.
7.  Once the evidence set has been created, use [contestPaymentDispute](/api-docs/sell/fulfillment/resources/payment_dispute/methods/contestPaymentDispute) to officially contest the dispute, and any evidence you uploaded will already be associated with the dispute.

Below are the other methods applicable to managing payment disputes with the Fulfillment API:

*   Use [getActivities](/api-docs/sell/fulfillment/resources/payment_dispute/methods/getActivities) to retrieve a log of activity for a payment dispute, including a timestamp for each action of the dispute from creation to resolution.
*   Use [updateEvidence](/api-docs/sell/fulfillment/resources/payment_dispute/methods/updateEvidence) to add one or more evidence files to an existing evidence set.
*   Use [fetchEvidenceContent](/api-docs/sell/fulfillment/resources/payment_dispute/methods/fetchEvidenceContent) to retrieve a specific evidence file for a payment dispute.

## Code Samples

## Error Handling

*   If an [uploadEvidenceFile](/api-docs/sell/fulfillment/resources/payment_dispute/methods/uploadEvidenceFile) call fails due to an invalid file type, ensure that the file is either a .JPEG, .JPG, or .PNG file and that ‘file’ is the name of the key used to upload the image.
*   If a [contestPaymentDispute](/api-docs/sell/fulfillment/resources/payment_dispute/methods/contestPaymentDispute) call fails due to there being no evidence available to contest the dispute, ensure that you have uploaded all evidence files before contesting the payment dispute. Once a seller has officially contested a dispute, the [addEvidence](/api-docs/sell/fulfillment/resources/payment_dispute/methods/addEvidence) and [updateEvidence](/api-docs/sell/fulfillment/resources/payment_dispute/methods/updateEvidence) methods can no longer be used.
*   If a [createShippingFulfillment](/api-docs/sell/fulfillment/resources/order/shipping_fulfillment/methods/createShippingFulfillment) call fails due to an invalid shipment tracking number, verify the tracking number input in the request. Only alphanumeric characters are supported for shipping tracking numbers. Do not include a space, even if a space appears in the tracking number on the shipping label.
*   If an [AddOrder](/devzone/xml/docs/reference/ebay/AddOrder.html) call fails due to one or more line items not being qualified for a combined invoice, verify that the included line items meet the basic requirements for a Combined Invoice order. See [Combined invoice](/api-docs/user-guides/static/trading-user-guide/manage-fulfill-combine-invoices.html) for a list of requirements and ineligible categories.
*   Various methods in the Post-Order API, as well as the [issueRefund](/api-docs/sell/fulfillment/resources/order/methods/issueRefund) method of the Fulfillment API, require a digital signature when used by EU-or UK-domiciled sellers. If this digital signature is not included in the header, an error will occur. See [Digital Signatures for APIs](/develop/guides/digital-signatures-for-apis) for more information and a list of affected methods.

## Best Practices

*   When creating a shipping fulfillment using the Fulfillment API, you can use the Trading API’s [GeteBayDetails](/devzone/XML/docs/Reference/eBay/GeteBayDetails.html) call to retrieve the latest shipping carrier enumeration values by including the **DetailName** field in the request and setting its value to _ShippingCarrierDetails_.

## Code Samples

### Retrieving paid orders

**Label:** Retrieving paid orders

#### Bash Sample

```bash
curl -X GET "https://api.ebay.com/sell/fulfillment/v1/order"
-H "Authorization:Bearer OAUTH_token"
```

### Searching for order return requests

**Label:** Searching for order return requests

#### Bash Sample

```bash
curl -X GET "https://api.ebay.com/post-order/v2/return/search"
-H "Authorization:Bearer OAUTH_token"
```

## Related Topics

- [Fulfillment API](/api-docs/sell/fulfillment/overview.html)
- [Trading Order Management APIs](/devzone/xml/docs/reference/ebay/OrderManagementIndex.html)
- [Logistics API](/api-docs/sell/logistics/overview.html)
- [Post-Order API](/devzone/post-order/index.html)
- [More Guides](/develop/guides)

