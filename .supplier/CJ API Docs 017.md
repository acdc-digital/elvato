---
tags: [CJ API Docs]
title: CJ API Docs 017
created: '2025-12-31T03:00:30.173Z'
modified: '2025-12-31T03:01:27.773Z'
---

# CJ API Docs 017

# 05. Shopping | CJ Docs
[#](#platform-waybill-order-process) Platform Waybill Order Process
-------------------------------------------------------------------

1.  Query Inventory by Product ID.
    
    Docs：[Query Inventory by Product ID](about:/en/api/api2/api/product.html#_3-3-query-inventory-by-product-id-get)
    
2.  Query Warehouse Information.
    
    Docs：[Query Warehouse Information](https://developers.cjdropshipping.com/en/api/api2/api/storage.html)
    
3.  Create Order.
    
    Docs：[Create Order V2](about:/en/api/api2/api/shopping.html#_1-1-create-order-v2-post) or [Create Order V3](about:/en/api/api2/api/shopping.html#_1-2-create-order-v3-post)
    

> Tip:
> 
> 1.  Added parameters: shopLogisticsType and storageId
> 2.  Logistics type and storage ID need to be specified (storage ID once specified, cannot be changed)

4.  Add Orders to Cart.
    
    Docs：[Add Orders to Cart](about:/en/api/api2/api/shopping.html#_1-3-add-cart)
    

> Tip: Batch add orders to the shopping cart, support adding orders.

5.  Confirm Add Cart
    
    Docs：[Confirm Add Cart](about:/en/api/api2/api/shopping.html#_1-4-add-cart-confirm-post)
    
6.  Generate parent order and Obtain Payment ID.
    
    Docs：[Generate parent order and Obtain Payment ID](about:/en/api/api2/api/shopping.html#_1-5-save-generate-parent-order-post)
    
7.  Payment.
    
    Docs：[Payment](about:/en/api/api2/api/shopping.html#_2-3-pay-balance-v2-post)
    

> Tip: You can also make bulk payments through MyCJ's website

8.  Upload Waybill and Shipping Information.
    
    Docs：[Upload Waybill and Shipping Information](about:/en/api/api2/api/shopping.html#_3-1-upload-shipping-info-post)
    

> Tip: It can only be executed after the payment is completed

9.  Update Waybill and Shipping Information.

Docs：[Update Waybill and Shipping Information](about:/en/api/api2/api/shopping.html#_3-2-update-shipping-info-post)

[#](#_1-order) 1 Order
----------------------

### [#](#_1-1-create-order-v2-post) 1.1 Create Order V2（POST）

*   Create order
*   If you want to use balance payment, set payType 2, and the created order will be processed for subsequent operations: adding shopping cart, confirming order, balance payment
*   If you do not want to use balance payment, set payType 3
*   Add param platformToken to header, The way to obtain platformToken is the same as the way to obtain CJ Access Token. If not required, the value can be empty. (2025-01-08 update)

#### [#](#url) URL

https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV2

#### [#](#curl) CURL



* Parameter: orderNumber
  * Definition: A unique identifier for the order from CJ partner.
  * Type: string
  * Required: Y
  * Length: 50
  * Note: 
* Parameter: shippingZip
  * Definition: Zip of destination
  * Type: string
  * Required: N
  * Length: 20
  * Note: 
* Parameter: shippingCountryCode
  * Definition: Country code of destination
  * Type: string
  * Required: Y
  * Length: 20
  * Note: Referer:Country Code, Please use The two-letter code
* Parameter: shippingCountry
  * Definition: Country of destination
  * Type: string
  * Required: Y
  * Length: 50
  * Note: 
* Parameter: shippingProvince
  * Definition: Province of destination
  * Type: string
  * Required: Y
  * Length: 50
  * Note: 
* Parameter: shippingCity
  * Definition: City of destination
  * Type: string
  * Required: Y
  * Length: 50
  * Note: 
* Parameter: shippingCounty
  * Definition: County of destination
  * Type: String
  * Required: N
  * Length: 50
  * Note: 
* Parameter: shippingPhone
  * Definition: Phone number of destination
  * Type: string
  * Required: N
  * Length: 20
  * Note: 
* Parameter: shippingCustomerName
  * Definition: Customer name
  * Type: string
  * Required: Y
  * Length: 50
  * Note: 
* Parameter: shippingAddress
  * Definition: Shipping address of destination
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: shippingAddress2
  * Definition: Shipping address 2 of destination
  * Type: string
  * Required: N
  * Length: 200
  * Note: 
* Parameter: houseNumber
  * Definition: House Number
  * Type: String
  * Required: N
  * Length: 20
  * Note: 
* Parameter: email
  * Definition: Email
  * Type: String
  * Required: N
  * Length: 50
  * Note: 
* Parameter: taxId
  * Definition: Tax Id
  * Type: string
  * Required: N
  * Length: 20
  * Note: 
* Parameter: remark
  * Definition: Order remark
  * Type: string
  * Required: N
  * Length: 500
  * Note: 
* Parameter: consigneeID
  * Definition: consignee id
  * Type: string
  * Required: N
  * Length: 20
  * Note: 
* Parameter: payType
  * Definition: Pay Type=2 (Balance Payment), Pay Type=3 (No Balance Payment)
  * Type: int
  * Required: N
  * Length: 10
  * Note: If using balance payment, payType must be 2
* Parameter: shopAmount
  * Definition: Order Amount
  * Type: BigDecimal
  * Required: N
  * Length: 20
  * Note: 
* Parameter: logisticName
  * Definition: logistic name
  * Type: string
  * Required: Y
  * Length: 50
  * Note: Referer Freight Calculation
* Parameter: fromCountryCode
  * Definition: Country code of the shipment from
  * Type: string
  * Required: Y
  * Length: 20
  * Note: Referer:Country Code, Please use The two-letter code
* Parameter: platform
  * Definition: Platform, Default: Api
  * Type: String
  * Required: N
  * Length: 20
  * Note: If this parameter is not passed, the default platform Api will be used. Referer Platforms
* Parameter: iossType
  * Definition: IOSS Type
  * Type: int
  * Required: N
  * Length: 20
  * Note: IOSS Type, Options: 1=No IOSS(The recipient will be required to pay VAT and other related fees when the order is declared without IOSS.), 2=Declare with my own IOSS(Please ensure that the IOSS provided is valid and is linked to the destination country in the EU. The declaration will proceed without IOSS if the destination country is not linked to a correct IOSS.), 3=Declare with CJ’s IOSS(Declaration with your store order amount is recommended. You will be responsible for the relevant risks if you choose to declare with CJ order amount. CJ’s IOSS is not applicable for orders valued above €150, and the recipient will be required to pay VAT.), Config Page (opens new window)
* Parameter: shopLogisticsType
  * Definition: Shipping Type
  * Type: int
  * Required: N
  * Length: 20
  * Note: Shipping Type, Options: 1=Platform Logistics, 2=Seller Logistics, 3=Platform Logistics(storageId is designated by CJ) Added on 2025-11-18
* Parameter: storageId
  * Definition: cj storage id
  * Type: String
  * Required: N
  * Length: 40
  * Note: This value is valid when shopLogisticsType=1, Added on 2025-11-18
* Parameter: iossNumber
  * Definition: IOSS Number
  * Type: String
  * Required: N
  * Length: 10
  * Note: If iossType=3, the value is fixed to CJ-IOSS
* Parameter: products
  * Definition: 
  * Type: List
  * Required: Y
  * Length: 20
  * Note: 
* Parameter: - vid
  * Definition: CJ variant id
  * Type: string
  * Required: N
  * Length: 50
  * Note: vid and sku cannot both be null. When vid is missing, sku will be used to query the CJ variant. If both are provided, they must refer to the same variant and will be validated accordingly. If the customer account has been granted permission to submit non-CJ SKUs, then the vid field is required
* Parameter: - sku
  * Definition: CJ variant sku
  * Type: string
  * Required: N
  * Length: 50
  * Note: vid and sku cannot both be null. When vid is missing, sku will be used to query the CJ variant. If both are provided, they must refer to the same variant and will be validated accordingly.
* Parameter: - quantity
  * Definition: quantity
  * Type: int
  * Required: Y
  * Length: 50
  * Note: 
* Parameter: - unitPrice
  * Definition: item pricing
  * Type: BigDecimal
  * Required: N
  * Length: 20
  * Note: 
* Parameter: - storeLineItemId
  * Definition: lineItemId of your store order
  * Type: string
  * Required: N
  * Length: 125
  * Note: 
* Parameter: - podProperties
  * Definition: POD customization information
  * Type: String
  * Required: N
  * Length: 500
  * Note: podProperties is a string，1：Pod2.0 Example: [{"areaName":"LogoArea","links":["https://cc-west-usa.oss-us-west-1.aliyuncs.com/9f0b99e6-17ec-4dcd-8916-fc5d644be993_LOGO_NavyBlue.png"],"type":"1"}]  2：Pod3.0 Example:[{"links": ["Production image URL (multiple allowed)"],"effectImgs": ["Rendering image URL (exactly one required)"]}]


#### [#](#return) Return

success


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


data information



* Field: orderId
  * Definition: CJ order id
  * Type: string
  * Length: 200
  * Note: If the provided product VID is not a CJ SKU, the order id will change, and thus the CJ order id will not be returned. You can monitor the webhook to obtain the latest CJ order id
* Field: orderNumber
  * Definition: orderNumber
  * Type: string
  * Length: 200
  * Note: 
* Field: shipmentOrderId
  * Definition: shipment order id
  * Type: string
  * Length: 200
  * Note: 
* Field: iossAmount
  * Definition: ioss amount
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: iossTaxHandlingFee
  * Definition: ioss tax
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: postageAmount
  * Definition: postage amount
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: productAmount
  * Definition: product amount
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: productOriginalAmount
  * Definition: total amount of products (before discount)
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: productDiscountAmount
  * Definition: product discount amount
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: postageDiscountAmount
  * Definition: postage discount amount
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: postageOriginalAmount
  * Definition: postage amount   (before discount)
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: totalDiscountAmount
  * Definition: the total amount of the order after discount
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: actualPayment
  * Definition: the amount actually paid
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: orderOriginalAmount
  * Definition: original order amount
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: cjPayUrl
  * Definition: CJ pay url
  * Type: string
  * Length: 200
  * Note: 
* Field: orderAmount
  * Definition: order amount
  * Type: BigDecimal
  * Length: 200
  * Note: 
* Field: logisticsMiss
  * Definition: logistics missing mark
  * Type: Boolean
  * Length: 10
  * Note: 
* Field: orderStatus
  * Definition: order status
  * Type: string
  * Length: 10
  * Note: 
* Field: productInfoList
  * Definition: product information
  * Type: list
  * Length: 
  * Note: 
* Field: interceptOrderReasons
  * Definition: order interception information
  * Type: list
  * Length: 
  * Note: 


product information


|Field           |Definition                       |Type   |Length|Note|
|----------------|---------------------------------|-------|------|----|
|storeLineItemId |lineItemId of your store order   |string |125   |    |
|lineItemId      |lineItemId of CJ order           |string |50    |    |
|variantId       |variant id                       |string |50    |    |
|quantity        |quantity                         |int    |20    |    |
|isGroup         |Main product label               |boolean|10    |    |
|subOrderProducts|combination product              |list   |10    |    |
|- lineItemId    |Unique ID of the order item in CJ|string |50    |    |
|- variantId     |variant id                       |string |50    |    |
|- quantity      |quantity                         |int    |20    |    |


Order interception information


|Field  |Definition|Type  |Length|Note|
|-------|----------|------|------|----|
|code   |code      |int   |50    |    |
|message|message   |string|200   |    |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_1-2-create-order-v3-post) 1.2 Create Order V3（POST）

*   Create order
*   Add param platformToken to header, The way to obtain platformToken is the same as the way to obtain CJ Access Token. If not required, the value can be empty. (2025-01-08 update)

#### [#](#url-2) URL

https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV3

#### [#](#curl-2) CURL



* Parameter: orderNumber
  * Definition: A unique identifier for the order from CJ partner.
  * Type: string
  * Required: Y
  * Length: 50
  * Note: 
* Parameter: shippingZip
  * Definition: Zip of destination
  * Type: string
  * Required: N
  * Length: 20
  * Note: 
* Parameter: shippingCountryCode
  * Definition: Country code of destination
  * Type: string
  * Required: Y
  * Length: 20
  * Note: Referer:Country Code, Please use The two-letter code
* Parameter: shippingCountry
  * Definition: Country of destination
  * Type: string
  * Required: Y
  * Length: 50
  * Note: 
* Parameter: shippingProvince
  * Definition: Province of destination
  * Type: string
  * Required: Y
  * Length: 50
  * Note: 
* Parameter: shippingCity
  * Definition: City of destination
  * Type: string
  * Required: Y
  * Length: 50
  * Note: 
* Parameter: shippingCounty
  * Definition: County of destination
  * Type: String
  * Required: N
  * Length: 50
  * Note: 
* Parameter: shippingPhone
  * Definition: Phone number of destination
  * Type: string
  * Required: N
  * Length: 20
  * Note: 
* Parameter: shippingCustomerName
  * Definition: Customer name
  * Type: string
  * Required: Y
  * Length: 50
  * Note: 
* Parameter: shippingAddress
  * Definition: Shipping address of destination
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: shippingAddress2
  * Definition: Shipping address 2 of destination
  * Type: string
  * Required: N
  * Length: 200
  * Note: 
* Parameter: houseNumber
  * Definition: House Number
  * Type: String
  * Required: N
  * Length: 20
  * Note: 
* Parameter: email
  * Definition: Email
  * Type: String
  * Required: N
  * Length: 50
  * Note: 
* Parameter: taxId
  * Definition: Tax Id
  * Type: string
  * Required: N
  * Length: 20
  * Note: 
* Parameter: remark
  * Definition: Order remark
  * Type: string
  * Required: N
  * Length: 500
  * Note: 
* Parameter: consigneeID
  * Definition: consignee id
  * Type: string
  * Required: N
  * Length: 20
  * Note: 
* Parameter: shopAmount
  * Definition: Order Amount
  * Type: BigDecimal
  * Required: N
  * Length: 20
  * Note: 
* Parameter: logisticName
  * Definition: logistic name
  * Type: string
  * Required: Y
  * Length: 50
  * Note: Referer Freight Calculation
* Parameter: fromCountryCode
  * Definition: Country code of the shipment from
  * Type: string
  * Required: Y
  * Length: 20
  * Note: Referer:Country Code, Please use The two-letter code
* Parameter: platform
  * Definition: Platform, Default: Api
  * Type: String
  * Required: N
  * Length: 20
  * Note: If this parameter is not passed, the default platform Api will be used. Referer Platforms
* Parameter: iossType
  * Definition: IOSS Type
  * Type: int
  * Required: N
  * Length: 20
  * Note: IOSS Type, Options: 1=No IOSS(The recipient will be required to pay VAT and other related fees when the order is declared without IOSS.), 2=Declare with my own IOSS(Please ensure that the IOSS provided is valid and is linked to the destination country in the EU. The declaration will proceed without IOSS if the destination country is not linked to a correct IOSS.), 3=Declare with CJ’s IOSS(Declaration with your store order amount is recommended. You will be responsible for the relevant risks if you choose to declare with CJ order amount. CJ’s IOSS is not applicable for orders valued above €150, and the recipient will be required to pay VAT.), Config Page (opens new window)
* Parameter: iossNumber
  * Definition: IOSS Number
  * Type: String
  * Required: N
  * Length: 10
  * Note: If iossType=3, the value is fixed to CJ-IOSS
* Parameter: shopLogisticsType
  * Definition: Shipping Type
  * Type: int
  * Required: N
  * Length: 20
  * Note: Shipping Type, Options: 1=Platform Logistics, 2=Seller Logistics, 3=Seller Logistics to Platform Logistics(Using platform logistics, The storageId is designated by CJ) Added on 2025-11-18
* Parameter: storageId
  * Definition: cj storage id
  * Type: String
  * Required: N
  * Length: 40
  * Note: This value is valid when shopLogisticsType=1, Added on 2025-11-18
* Parameter: products
  * Definition: 
  * Type: List
  * Required: Y
  * Length: 20
  * Note: 
* Parameter: - vid
  * Definition: CJ variant id
  * Type: string
  * Required: N
  * Length: 50
  * Note: vid and sku cannot both be null. When vid is missing, sku will be used to query the CJ variant. If both are provided, they must refer to the same variant and will be validated accordingly. If the customer account has been granted permission to submit non-CJ SKUs, then the vid field is required
* Parameter: - sku
  * Definition: CJ variant sku
  * Type: string
  * Required: N
  * Length: 50
  * Note: vid and sku cannot both be null. When vid is missing, sku will be used to query the CJ variant. If both are provided, they must refer to the same variant and will be validated accordingly.
* Parameter: - quantity
  * Definition: quantity
  * Type: int
  * Required: Y
  * Length: 50
  * Note: 
* Parameter: - unitPrice
  * Definition: item pricing
  * Type: BigDecimal
  * Required: N
  * Length: 20
  * Note: 
* Parameter: - storeLineItemId
  * Definition: lineItemId of your store order
  * Type: string
  * Required: N
  * Length: 125
  * Note: 
* Parameter: - podProperties
  * Definition: POD customization information
  * Type: String
  * Required: N
  * Length: 500
  * Note: podProperties is a string，1：Pod2.0 Example: [{"areaName":"LogoArea","links":["https://cc-west-usa.oss-us-west-1.aliyuncs.com/9f0b99e6-17ec-4dcd-8916-fc5d644be993_LOGO_NavyBlue.png"],"type":"1"}]  2：Pod3.0 Example:[{"links": ["Production image URL (multiple allowed)"],"effectImgs": ["Rendering image URL (exactly one required)"]}]


#### [#](#return-2) Return

success


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


data information



* Field: orderId
  * Definition: CJ order id
  * Type: string
  * Length: 200
  * Note: If the provided product VID is not a CJ SKU, the order id will change, and thus the CJ order id will not be returned. You can monitor the webhook to obtain the latest CJ order id
* Field: orderNumber
  * Definition: customer order number
  * Type: string
  * Length: 200
  * Note: 
* Field: shipmentOrderId
  * Definition: shipment order id
  * Type: string
  * Length: 200
  * Note: 
* Field: iossAmount
  * Definition: ioss amount
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: iossTaxHandlingFee
  * Definition: ioss tax
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: postageAmount
  * Definition: postage amount
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: productAmount
  * Definition: product amount
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: productOriginalAmount
  * Definition: total amount of products (before discount)
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: productDiscountAmount
  * Definition: product discount amount
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: postageDiscountAmount
  * Definition: postage discount amount
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: postageOriginalAmount
  * Definition: postage amount   (before discount)
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: totalDiscountAmount
  * Definition: the total amount of the order after discount
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: actualPayment
  * Definition: the amount actually paid
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: orderOriginalAmount
  * Definition: original order amount
  * Type: BigDecimal
  * Length: （18，2）
  * Note: Unit: $ (USD）
* Field: cjPayUrl
  * Definition: CJ pay url
  * Type: string
  * Length: 200
  * Note: 
* Field: orderAmount
  * Definition: order amount
  * Type: BigDecimal
  * Length: 200
  * Note: 
* Field: logisticsMiss
  * Definition: logistics missing mark
  * Type: Boolean
  * Length: 10
  * Note: 
* Field: orderStatus
  * Definition: order status
  * Type: string
  * Length: 10
  * Note: 
* Field: productInfoList
  * Definition: product information
  * Type: list
  * Length: 
  * Note: 
* Field: interceptOrderReasons
  * Definition: order interception information
  * Type: list
  * Length: 
  * Note: 


product information


|Field           |Definition                       |Type   |Length|Note|
|----------------|---------------------------------|-------|------|----|
|storeLineItemId |lineItemId of your store order   |String |125   |    |
|lineItemId      |Unique ID of the order item in CJ|string |50    |    |
|variantId       |variant id                       |string |50    |    |
|quantity        |quantity                         |int    |20    |    |
|isGroup         |Main product label               |boolean|10    |    |
|subOrderProducts|combination product              |list   |10    |    |
|- lineItemId    |Unique ID of the order item in CJ|string |50    |    |
|- variantId     |CJ variant id                    |string |50    |    |
|- quantity      |quantity                         |int    |20    |    |


Order interception information


|Field  |Definition|Type  |Length|Note|
|-------|----------|------|------|----|
|code   |code      |int   |50    |    |
|message|message   |string|200   |    |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_1-3-add-cart) 1.3 Add Cart

#### [#](#url-3) URL

https://developers.cjdropshipping.com/api2.0/v1/shopping/order/addCart

#### [#](#curl-3) CURL


|Parameter    |Definition |Type|Required|Length|Note |
|-------------|-----------|----|--------|------|-----|
|cjOrderIdList|CJ order id|List|Y       |200   |Query|


#### [#](#return-3) Return

success


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_1-4-add-cart-confirm-post) 1.4 Add Cart Confirm (POST)

#### [#](#url-4) URL

https://developers.cjdropshipping.com/api2.0/v1/shopping/order/addCartConfirm

#### [#](#curl-4) CURL


|Parameter    |Definition |Type|Required|Length|Note |
|-------------|-----------|----|--------|------|-----|
|cjOrderIdList|CJ order id|List|Y       |200   |Query|


#### [#](#return-4) Return

success



* Field: code
  * Definition: error code
  * Type: int
  * Length: 20
  * Note: Reference error code
* Field: result
  * Definition: Whether or not the return is normal
  * Type: boolean
  * Length: 1
  * Note: 
* Field: message
  * Definition: return message
  * Type: string
  * Length: 200
  * Note: 
* Field: data
  * Definition: return data
  * Type: object
  * Length: 
  * Note: interface data return
* Field: - successCount
  * Definition: Success Count
  * Type: 
  * Length: 
  * Note: 
* Field: - submitSuccess
  * Definition: Is the submission successful
  * Type: 
  * Length: 
  * Note: 
* Field: - shipmentsId
  * Definition: Shipment Order Id
  * Type: 
  * Length: 
  * Note: 
* Field: - result
  * Definition: 
  * Type: 
  * Length: 
  * Note: 
* Field: - interceptOrders
  * Definition: Intercepted order ID List
  * Type: List
  * Length: 
  * Note: 
* Field: requestId
  * Definition: requestId
  * Type: string
  * Length: 48
  * Note: Flag request for logging errors


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_1-5-save-generate-parent-order-post) 1.5 Save Generate Parent Order(POST)

#### [#](#url-5) URL

https://developers.cjdropshipping.com/api2.0/v1/shopping/order/saveGenerateParentOrder

#### [#](#curl-5) CURL


|Parameter      |Definition       |Type  |Required|Length|Note |
|---------------|-----------------|------|--------|------|-----|
|shipmentOrderId|Shipment Order Id|string|Y       |200   |Query|


#### [#](#return-5) Return

success


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_1-6-list-order-get) 1.6 List Order（GET）

#### [#](#url-6) URL

https://developers.cjdropshipping.com/api2.0/v1/shopping/order/list?pageNum=1&pageSize=10

#### [#](#curl-6) CURL



* Parameter: pageNum
  * Definition: Page number
  * Type: int
  * Required: N
  * Length: 20
  * Note: Default 1
* Parameter: pageSize
  * Definition: Quantity of results on each page
  * Type: int
  * Required: N
  * Length: 20
  * Note: Default 20
* Parameter: orderIds
  * Definition: order id
  * Type: string[]
  * Required: N
  * Length: 100
  * Note: 
* Parameter: shipmentOrderId
  * Definition: Shipment Order Id
  * Type: string
  * Required: N
  * Length: 100
  * Note: 
* Parameter: status
  * Definition: order status
  * Type: string
  * Required: N
  * Length: 200
  * Note: default: CANCELLED, values: CREATED,IN_CART,UNPAID,UNSHIPPED,SHIPPED,DELIVERED,CANCELLED,OTHER


#### [#](#return-6) Return

success


|Field               |Definition               |Type      |Length|Note                             |
|--------------------|-------------------------|----------|------|---------------------------------|
|orderId             |order id                 |string    |200   |                                 |
|orderNum            |order name               |string    |200   |                                 |
|cjOrderId           |CJ order id              |string    |200   |                                 |
|shippingCountryCode |country code             |string    |200   |                                 |
|shippingProvince    |province                 |string    |200   |                                 |
|shippingCity        |city                     |string    |200   |                                 |
|shippingAddress     |shipping address         |string    |200   |                                 |
|shippingCustomerName|shipping name            |string    |Y     |200                              |
|shippingPhone       |phone number             |string    |200   |                                 |
|remark              |order remark             |string    |500   |                                 |
|logisticName        |logistic name            |string    |200   |                                 |
|trackNumber         |track number             |string    |200   |                                 |
|trackingUrl         |tracking URL             |string    |N     |200                              |
|orderWeight         |order weight             |int       |20    |                                 |
|orderAmount         |order amount             |BigDecimal|（18，2）|Unit: $ (USD）                    |
|orderStatus         |order status             |string    |200   |                                 |
|createDate          |create time              |string    |200   |                                 |
|paymentDate         |pay time                 |string    |200   |                                 |
|storeCreateDate     |Store order creation time|DateTime  |1     |UTC Time, eg: 2025-03-14 13:21:07|
|productAmount       |product amount           |BigDecimal|（18，2）|Unit: $ (USD）                    |
|postageAmount       |postage amount           |BigDecimal|（18，2）|Unit: $ (USD）                    |
|storageId           |storage id               |string    |200   |Added on 2025-11-18              |
|storageName         |storage name             |string    |200   |Added on 2025-11-18              |


Order Status


|Order Status|Status      |remark                               |
|------------|------------|-------------------------------------|
|CREATED     |order create|create order, wait confirm           |
|IN_CART     |in cart     |wait confirm, api merge this state   |
|UNPAID      |unpaid      |confirm order, CJ order number create|
|UNSHIPPED   |unshipped   |paid, wait for sending               |
|SHIPPED     |shipped     |in transit, get tracking number      |
|DELIVERED   |delivered   |clients receving                     |
|CANCELLED   |cancelled   |                                     |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_1-7-query-order-get) 1.7 Query Order（GET）

#### [#](#url-7) URL

https://developers.cjdropshipping.com/api2.0/v1/shopping/order/getOrderDetail?orderId=210711100018043276

#### [#](#curl-7) CURL

#### [#](#request-parameters) Request Parameters



* Parameter: orderId
  * Definition: order id
  * Type: string
  * Required: Y
  * Length: 200
  * Note: support: Custom order id, CJ order id
* Parameter: features
  * Definition: features
  * Type: List
  * Required: false
  * Length: 20
  * Note: If a feature is passed in, the relevant function will be enabled. If multiple features are required, pass multiple feature parameters


#### [#](#feature-enumeration) Feature enumeration



* Enumeration: LOGISTICS_TIMELINESS
  * Description: Enable querying logistics timeliness. After passing in this feature enumeration, logisticTimelines will be returned in the results


#### [#](#response) Response

success

POD order return information



* Field: orderId
  * Definition: order id
  * Type: string
  * Length: 200
  * Note: 
* Field: orderNum
  * Definition: order name
  * Type: string
  * Length: 200
  * Note: 
* Field: platformOrderId
  * Definition: Shop order ID
  * Type: string
  * Length: 200
  * Note: 
* Field: cjOrderId
  * Definition: CJ order id
  * Type: string
  * Length: 200
  * Note: 
* Field: cjOrderCode
  * Definition: CJ order code
  * Type: string
  * Length: 200
  * Note: 
* Field: fromCountryCode
  * Definition: shipment country code
  * Type: string
  * Length: 200
  * Note: 
* Field: shippingCountryCode
  * Definition: Recipient country code
  * Type: string
  * Length: 200
  * Note: 
* Field: shippingProvince
  * Definition: Recipient province
  * Type: string
  * Length: 200
  * Note: 
* Field: shippingCity
  * Definition: Recipient city
  * Type: string
  * Length: 200
  * Note: 
* Field: shippingAddress
  * Definition: Recipient address
  * Type: string
  * Length: 200
  * Note: 
* Field: shippingCustomerName
  * Definition: Recipient name
  * Type: string
  * Length: 200
  * Note: 
* Field: shippingPhone
  * Definition: Recipient phone number
  * Type: string
  * Length: 200
  * Note: 
* Field: remark
  * Definition: order remark
  * Type: string
  * Length: 500
  * Note: 
* Field: logisticName
  * Definition: logistic name
  * Type: string
  * Length: 200
  * Note: 
* Field: trackNumber
  * Definition: track number
  * Type: string
  * Length: 200
  * Note: 
* Field: trackingUrl
  * Definition: tracking URL
  * Type: string
  * Length: 200
  * Note: 
* Field: disputeId
  * Definition: CJ dispute ID
  * Type: string
  * Length: 50
  * Note: 
* Field: orderWeight
  * Definition: order weight
  * Type: int
  * Length: 20
  * Note: 
* Field: orderAmount
  * Definition: Order amount
  * Type: BigDecimal
  * Length: （18,2）
  * Note: Unit: $ (USD）
* Field: orderStatus
  * Definition: Order status
  * Type: string
  * Length: 200
  * Note: 
* Field: createDate
  * Definition: Create time
  * Type: string
  * Length: 200
  * Note: UTC Time
* Field: paymentDate
  * Definition: Pay time
  * Type: string
  * Length: 200
  * Note: UTC Time
* Field: outWarehouseTime
  * Definition: Delivery time
  * Type: DateTime
  * Length: 1
  * Note: UTC Time, eg: 2025-03-14 13:21:07
* Field: storeCreateDate
  * Definition: Store order creation time
  * Type: DateTime
  * Length: 1
  * Note: UTC Time, eg: 2025-03-14 13:21:07
* Field: productAmount
  * Definition: product amount
  * Type: BigDecimal
  * Length: （18,2）
  * Note: Unit: $ (USD）
* Field: isComplete
  * Definition: Is the order complete? 1: Complete 0: Incomplete
  * Type: Number
  * Length: 1
  * Note: 
* Field: storageId
  * Definition: storage id
  * Type: string
  * Length: 200
  * Note: Added on 2025-11-18
* Field: storageName
  * Definition: storage name
  * Type: string
  * Length: 200
  * Note: Added on 2025-11-18
* Field: productList
  * Definition: Product List
  * Type: list
  * Length: 200
  * Note: 
* Field: - vid
  * Definition: Variant Id
  * Type: string
  * Length: 200
  * Note: 
* Field: - quantity
  * Definition: quantity
  * Type: int
  * Length: 20
  * Note: 
* Field: - sellPrice
  * Definition: Sell Price
  * Type: BigDecimal
  * Length: （18，2）
  * Note: unit：$（USA）
* Field: - storeLineItemId
  * Definition: The lineItemId of your store order
  * Type: string
  * Length: 125
  * Note: 
* Field: - lineItemId
  * Definition: Unique ID of the order item in CJ
  * Type: string
  * Length: 50
  * Note: 
* Field: - podPropertiesInfo
  * Definition: pod product order return information
  * Type: Object
  * Length: 
  * Note: 
* Field: -- effectImgList
  * Definition: Product renderings
  * Type: List
  * Length: 200
  * Note: 
* Field: -- customResources
  * Definition: Finished product information
  * Type: List
  * Length: 200
  * Note: 
* Field: -- productionImgList
  * Definition: Production diagram
  * Type: List
  * Length: 200
  * Note: 
* Field: logisticsTimeliness
  * Definition: Logistics Timeliness
  * Type: Object
  * Length: 
  * Note: 
* Field: - logisticsModes
  * Definition: Logistics List
  * Type: List
  * Length: 
  * Note: 
* Field: -- logisticsName
  * Definition: Logistics Name
  * Type: string
  * Length: 
  * Note: DHL Official
* Field: -- arrivalTime
  * Definition: Arrival Time (Day)
  * Type: string
  * Length: 
  * Note: 3-7 Days


Order Status


|Order Status|Status      |remark                               |
|------------|------------|-------------------------------------|
|CREATED     |order create|create order, wait confirm           |
|IN_CART     |in cart     |wait confirm, api merge this state   |
|UNPAID      |unpaid      |confirm order, CJ order number create|
|UNSHIPPED   |unshipped   |paid, wait for sending               |
|SHIPPED     |shipped     |in transit, get tracking number      |
|DELIVERED   |delivered   |clients receving                     |
|CANCELLED   |cancelled   |                                     |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


#### [#](#error-code-and-message) Error code and Message


|Error Code|Message                             |
|----------|------------------------------------|
|1600300   |order not found                     |
|1600300   |orderId must be not empty           |
|1600300   |The maximum number of features is 20|


### [#](#_1-8-order-delete-del) 1.8 Order Delete（DEL）

#### [#](#url-8) URL

https://developers.cjdropshipping.com/api2.0/v1/shopping/order/deleteOrder?orderId=210711100018655344

#### [#](#curl-8) CURL


|Parameter|Definition|Type  |Required|Length|Note |
|---------|----------|------|--------|------|-----|
|orderId  |order id  |string|Y       |200   |Query|


#### [#](#return-7) Return

success


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_1-9-confirm-order-patch) 1.9 Confirm Order（PATCH）

#### [#](#url-9) URL

https://developers.cjdropshipping.com/api2.0/v1/shopping/order/confirmOrder

#### [#](#curl-9) CURL


|Parameter|Definition|Type  |Required|Length|Note |
|---------|----------|------|--------|------|-----|
|orderId  |order id  |string|Y       |200   |Query|


#### [#](#return-8) Return

success


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_2-0-change-order-warehouse) 2.0 Change Order Warehouse

*   The warehouse of the orders of the platform logistics can be modified through this interface.

#### [#](#url-10) URL

https://developers.cjdropshipping.com/api2.0/v1/shopping/order/changeWarehouse

#### [#](#curl-10) CURL


|Parameter|Definition|Type  |Required|Length|Note |
|---------|----------|------|--------|------|-----|
|orderCode|order code|string|Y       |200   |Query|
|storageId|storage id|string|Y       |200   |Query|


#### [#](#return-9) Return

success


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


[#](#_2-payment) 2 Payment
--------------------------

### [#](#_2-1-get-balance-get) 2.1 Get Balance（GET）

#### [#](#url-11) URL

https://developers.cjdropshipping.com/api2.0/v1/shopping/pay/getBalance

#### [#](#curl-11) CURL

#### [#](#return-10) Return

success


|Field             |Definition   |Type      |Length|Note         |
|------------------|-------------|----------|------|-------------|
|noWithdrawalAmount|Bonus amount |BigDecimal|（18，2）|Unit: $ (USD）|
|freezeAmount      |Frozen amount|BigDecimal|（18，2）|Unit: $ (USD）|
|amount            |Amount       |BigDecimal|（18，2）|Unit: $ (USD）|


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_2-2-pay-balance-post) 2.2 Pay Balance（POST）

#### [#](#url-12) URL

https://developers.cjdropshipping.com/api2.0/v1/shopping/pay/payBalance

#### [#](#curl-12) CURL


|Parameter|Definition|Type  |Required|Length|Note|
|---------|----------|------|--------|------|----|
|orderId  |Order id  |string|Y       |200   |    |


#### [#](#return-11) Return

success


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_2-3-pay-balance-v2-post) 2.3 Pay Balance V2（POST）

#### [#](#url-13) URL

https://developers.cjdropshipping.com/api2.0/v1/shopping/pay/payBalanceV2

#### [#](#curl-13) CURL


|Parameter      |Definition       |Type  |Required|Length|Note|
|---------------|-----------------|------|--------|------|----|
|shipmentOrderId|Shipment order Id|string|Y       |200   |    |
|payId          |PayId            |String|Yes     |200   |    |


#### [#](#return-12) Return

success


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


[#](#_3-shipping-info) 3 Shipping Info
--------------------------------------

### [#](#_3-1-upload-shipping-info-post) 3.1 Upload Shipping Info(POST)

#### [#](#url-14) URL

https://developers.cjdropshipping.com/api2.0/v1/shopping/order/uploadWaybillInfo

> Tips:
> 
> 1.  When uploading the waybill file, please submit the request in multipart/form data format.
> 2.  This interface can only be called after CJ order payment.

#### [#](#curl-14) CURL



* Parameter: orderId
  * Definition: Order Id
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: cjOrderId
  * Definition: CJ Order Id
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: cjShippingCompanyName
  * Definition: CJ Shipping Company Name
  * Type: string
  * Required: Y
  * Length: 200
  * Note: Referer:Get Storage Info, Get：logisticsBrandList
* Parameter: trackNumber
  * Definition: Track Number
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: waybillFile
  * Definition: waybill document
  * Type: MultipartFile
  * Required: Y
  * Length: 200
  * Note: 


#### [#](#return-13) Return

success


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |Boolean|      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_3-2-update-shipping-info-post) 3.2 Update Shipping Info(POST)

#### [#](#url-15) URL

https://developers.cjdropshipping.com/api2.0/v1/shopping/order/updateWaybillInfo

#### [#](#curl-15) CURL



* Parameter: orderId
  * Definition: Order Id
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: cjOrderId
  * Definition: CJ Order Id
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: cjShippingCompanyName
  * Definition: CJ Shipping Company Name
  * Type: string
  * Required: Y
  * Length: 200
  * Note: Referer:Get Storage Info, Get：logisticsBrandList
* Parameter: trackNumber
  * Definition: Track Number
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: waybillFile
  * Definition: waybill document
  * Type: MultipartFile
  * Required: Y
  * Length: 200
  * Note: 


#### [#](#return-14) Return

success


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |Boolean|      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|



