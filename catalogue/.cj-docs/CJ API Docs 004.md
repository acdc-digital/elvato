---
tags: [CJ API Docs]
title: CJ API Docs 004
created: '2025-12-31T02:44:44.389Z'
modified: '2025-12-31T02:46:00.769Z'
---

# CJ API Docs 004

# Webhook Mechanism | CJ Docs
[#](#webhook-mechanism) Webhook Mechanism
-----------------------------------------

[#](#introduction) Introduction
-------------------------------

Product details including addition, deletion & modification of variants.

[#](#setup-procedure) Setup Procedure
-------------------------------------

*   1）Set up message monitoring and reference.[webhook](https://developers.cjdropshipping.com/en/api/api2/api/webhook.html)
*   2）Set up client monitoring interface, example as below(Java).
*   3）Test monitoring.

### [#](#webhook-configuration-requirements) Webhook Configuration Requirements

#### [#](#_1-protocol-requirements) 1. Protocol Requirements

*   **Supported Protocols**: HTTPS
*   **Encryption**: TLS 1.2 or TLS 1.3 recommended for secure transmission
*   **Request Method**: POST
*   **Content Type**: `Content-Type: application/json`

#### [#](#_2-response-specifications) 2. Response Specifications

*   **Success Status Code**: `200 OK`
*   **Timeout**: Response must be returned within **3 seconds**  
    (Avoid long-running or complex business logic to ensure prompt response)

[#](#list-of-topics) List of topics
-----------------------------------

### [#](#product-message-product) Product Message: **PRODUCT**

#### [#](#occurs-when-a-product-is-created-or-updated) Occurs when a product is created or updated.

*   Sample Payload


|Parameter           |Definition           |Type  |Required|Length|Note                        |
|--------------------|---------------------|------|--------|------|----------------------------|
|messageId           |Message Id           |string|Y       |200   |Message Id                  |
|type                |Data Type            |string|Y       |20    |PRODUCT                     |
|messageType         |Message type         |string|Y       |15    |INSERT、UPDATE、DELETE        |
|params              |                     |object|Y       |5     |                            |
|- categoryId        |category Id          |string|Y       |200   |                            |
|- categoryName      |category Name        |string|Y       |200   |                            |
|- pid               |product id           |string|Y       |200   |                            |
|- productDescription|product description  |string|Y       |2000  |                            |
|- productImage      |product image        |string|Y       |200   |                            |
|- productName       |product name         |string|Y       |200   |                            |
|- productNameEn     |product name(english)|string|Y       |200   |                            |
|- productProperty1  |product property     |string|Y       |200   |                            |
|- productProperty2  |product property     |string|Y       |200   |                            |
|- productProperty3  |product property     |string|Y       |200   |                            |
|- productSellPrice  |product sell price   |double|Y       |20    |                            |
|- productSku        |product sku          |string|Y       |200   |                            |
|- productStatus     |product status       |int   |Y       |5     |status:2-Off sale, 3-On Sale|
|- fields            |fields list          |list  |Y       |5     |                            |


Product Status


|ProductStatus|Description|
|-------------|-----------|
|2            |Off sale   |
|3            |On Sale    |


#### [#](#inbound-message-for-variant) Inbound message for Variant


|Parameter         |Definition             |Type  |Required|Length|Note                |
|------------------|-----------------------|------|--------|------|--------------------|
|messageId         |Message id             |string|Y       |50    |Message Id          |
|type              |Data Type              |string|Y       |20    |VARIANT             |
|messageType       |Message Type           |string|Y       |15    |INSERT、UPDATE、DELETE|
|params            |                       |object|Y       |      |                    |
|- vid             |variant Id             |string|Y       |50    |                    |
|- variantName     |variant name           |string|Y       |200   |                    |
|- variantWeight   |variant weight, unit:g |int   |Y       |      |                    |
|- variantLength   |variant length, unit:mm|int   |Y       |      |                    |
|- variantWidth    |variant width, unit:mm |int   |Y       |      |                    |
|- variantHeight   |variant height, unit:mm|int   |Y       |      |                    |
|- variantImage    |variant image          |string|Y       |200   |                    |
|- variantSku      |variant sku            |string|Y       |200   |                    |
|- variantKey      |variant key            |string|Y       |200   |                    |
|- variantSellPrice|variant sell price, USD|double|Y       |      |                    |
|- variantStatus   |variant status         |int   |Y       |5     |                    |
|- variantValue1   |variant value1         |string|Y       |100   |                    |
|- variantValue2   |variant value2         |string|Y       |100   |                    |
|- variantValue3   |variant value3         |string|Y       |100   |                    |
|- fields          |fields list            |list  |Y       |5     |                    |


Variant Status


|variantStatus|Description|
|-------------|-----------|
|0            |Off sale   |
|1            |On sale    |


### [#](#stock-message) Stock Message

### [#](#order-message) Order message



* Parameter: messageId
  * Definition: Message id
  * Type: string
  * Required: Y
  * Length: 50
  * Note: Message Id
* Parameter: type
  * Definition: Data Type
  * Type: string
  * Required: Y
  * Length: 20
  * Note: ORDER
* Parameter: messageType
  * Definition: Message Type
  * Type: string
  * Required: Y
  * Length: 15
  * Note: INSERT、UPDATE、DELETE、ORDER_CONNNECTED: This type requires special attention：The product has been re-associated in the CJ system, and the order status has been updated from incomplete to complete. At this point, The actual CJ order id is returned in this message.
* Parameter: params
  * Definition: 
  * Type: object
  * Required: Y
  * Length: 
  * Note: 
* Parameter: - cjOrderId
  * Definition: CJ order id
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: - orderNum
  * Definition: Customer order number
  * Type: string
  * Required: Y
  * Length: 200
  * Note: Will be deprecated, please use orderNumber instead
* Parameter: - orderNumber
  * Definition: Customer order number
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: - orderStatus
  * Definition: CJ order status
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: - logisticName
  * Definition: logistic name
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: - trackNumber
  * Definition: track number
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: - trackingUrl
  * Definition: tracking URL
  * Type: string
  * Required: N
  * Length: 200
  * Note: 
* Parameter: - updateDate
  * Definition: update date
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: - createDate
  * Definition: create date
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: - payDate
  * Definition: pay date
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: - deliveryDate
  * Definition: delivery date
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: - completeDate
  * Definition: complete date
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 


#### [#](#order-splitting-message) Order splitting message


|Parameter        |Definition              |Type     |Required|Length|Note                |
|-----------------|------------------------|---------|--------|------|--------------------|
|messageId        |Message id              |string   |Y       |50    |Message Id          |
|type             |Data Type               |string   |Y       |20    |ORDERSPLIT          |
|messageType      |Message Type            |string   |Y       |15    |INSERT、UPDATE、DELETE|
|params           |                        |Object   |Y       |      |                    |
|- originalOrderId|Original CJ order id    |string   |N       |200   |                    |
|- orderSplitTime |Order Split Date        |string   |N       |200   |                    |
|- splitOrderList |Order List              |Order[]  |N       |      |                    |
|- - orderCode    |CJ order id             |string   |N       |200   |                    |
|- - createAt     |Create date             |string   |N       |200   |                    |
|- - orderStatus  |Order status            |int      |N       |11    |                    |
|- - productList  |Product Information List|Product[]|N       |200   |                    |
|- - - productCode|product code            |string   |N       |200   |                    |
|- - - vid        |Variant id              |string   |N       |200   |                    |
|- - - quantity   |Quantity                |int      |N       |10    |                    |
|- - - sku        |Sku                     |string   |N       |50    |                    |


#### [#](#source-product-creation-result) Source product creation result


|返回字段          |字段意思          |字段类型  |Required|长度 |备注                  |
|--------------|--------------|------|--------|---|--------------------|
|messageId     |Message id    |string|Y       |50 |Message Id          |
|type          |Data Type     |string|Y       |20 |ORDERSPLIT          |
|messageType   |Message Type  |string|Y       |15 |INSERT、UPDATE、DELETE|
|params        |              |Object|Y       |   |                    |
|- cjProductId |CJ product id |string|N       |100|                    |
|- cjVariantId |CJ variant id |string|N       |100|                    |
|- cjVariantSku|CJ variant sku|string|N       |50 |                    |
|- cjSourcingId|CJ sourcing Id|string|N       |50 |                    |
|- status      |status        |string|N       |20 |                    |
|- failReason  |fail reason   |string|N       |20 |                    |
|- createDate  |create date   |String|N       |50 |                    |


### [#](#logistics-message) Logistics message



* Parameter: messageId
  * Definition: Message Id
  * Type: string
  * Required: Y
  * Length: 200
  * Note: Message Id
* Parameter: type
  * Definition: Data Type
  * Type: string
  * Required: Y
  * Length: 200
  * Note: LOGISTIC
* Parameter: messageType
  * Definition: Message Type
  * Type: string
  * Required: Y
  * Length: 15
  * Note: INSERT、UPDATE、DELETE
* Parameter: params
  * Definition: 
  * Type: object
  * Required: Y
  * Length: 
  * Note: 
* Parameter: - orderId
  * Definition: CJ order id
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 210823100016290555
* Parameter: - logisticName
  * Definition: logistic name
  * Type: string
  * Required: Y
  * Length: 200
  * Note: CJPacket Ordinary
* Parameter: - trackingNumber
  * Definition: tracking number
  * Type: string
  * Required: Y
  * Length: 200
  * Note: number12345678
* Parameter: - trackingUrl
  * Definition: tracking URL
  * Type: string
  * Required: N
  * Length: 200
  * Note: 
* Parameter: - trackingStatus
  * Definition: tracking status
  * Type: int
  * Required: Y
  * Length: 20
  * Note: 0- No tracking information available at the moment 1- Warehouse outbound 2- Freight forwarder inbound 3- Freight forwarder return 4- Freight forwarder outbound 5- First leg transportation 6- Arrival at destination country 7- Starting customs clearance 8- Customs clearance completed 9- Terminal retrieval 10- Delivery 11- Arrival waiting for retrieval 12- Sign for 13- Failure/abnormality 14- Return
* Parameter: - logisticsTrackEvents
  * Definition: logistics track events
  * Type: string
  * Required: Y
  * Length: 200
  * Note: [{"status":12,"activity":" Delivered, PO Box","location":" NENANA,AK 99760","eventTime":"2024-01-18 07:59:22","statusDesc":"Delivered","thirdActivity":"Delivered, PO Box","thirdLocation":"NENANA,AK 99760","thirdEventTime":"2024-01-18 07:59:22"}]


[#](#listening-example) Listening example
-----------------------------------------

### [#](#example) Example
