---
tags: [CJ API Docs]
title: CJ API Docs 008
created: '2025-12-31T02:50:28.944Z'
modified: '2025-12-31T02:51:03.884Z'
---

# CJ API Docs 008

# Interface Field Definitions | CJ Docs
[#](#interface-field-definitions) Interface Field Definitions
-------------------------------------------------------------

[#](#_1-base-fields) 1 Base Fields
----------------------------------

### [#](#_1-system-fields) 1 System Fields

#### [#](#_1-1-return) 1.1 Return


|Field    |Field Meaning                      |Field Type|Length|Note                           |
|---------|-----------------------------------|----------|------|-------------------------------|
|code     |error code                         |int       |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean   |1     |                               |
|message  |return message                     |string    |200   |                               |
|data     |return data                        |object    |      |interface data return          |
|requestId|requestId                          |string    |48    |Flag request for logging errors|


#### [#](#_1-2-paging) 1.2 Paging


|Field   |Field Meaning                    |Field Type|Length|Note|
|--------|---------------------------------|----------|------|----|
|pageNum |Number of current pages          |int       |20    |    |
|pageSize|Number of items returned per page|int       |20    |    |
|total   |total                            |int       |20    |    |
|list    |                                 |          |list  |    |


### [#](#_2-public-fields) 2 Public Fields

#### [#](#_2-1-region) 2.1 Region


|Field      |Field Meaning|Field Type|Length|Note|
|-----------|-------------|----------|------|----|
|areaId     |area id      |string    |200   |    |
|areaEn     |area name    |string    |200   |    |
|countryCode|country code |string    |200   |    |


#### [#](#_2-2-people) 2.2 People


|Field     |Field Meaning|Field Type|Length|Note|
|----------|-------------|----------|------|----|
|creator   |creator      |string    |200   |    |
|createTime|create time  |string    |200   |    |
|updater   |modifier     |string    |200   |    |
|updateTime|modify time  |string    |200   |    |


#### [#](#_2-3-other) 2.3 Other


|Field     |Field Meaning|Field Type|Length|Note|
|----------|-------------|----------|------|----|
|sourceFrom|source       |byte      |4     |    |
|comment   |comment      |string    |200   |    |


Remarks:

> sourceFrom: 0-erp entry, 1-store search entry, 2-cj search entry

[#](#_2-transaction-fields) 2 Transaction Fields
------------------------------------------------

### [#](#_1-authentication-fields) 1 Authentication Fields


|Field   |Definition|Type  |Length|Note|
|--------|----------|------|------|----|
|email   |Email     |string|200   |    |
|password|Password  |string|200   |    |


#### [#](#_1-2-token) 1.2 Token


|Field                 |Definition               |Type  |Length|Note            |
|----------------------|-------------------------|------|------|----------------|
|accessToken           |Access Token             |string|200   |                |
|accessTokenExpiryDate |Access Token expiry time |string|200   |Default 15 days |
|refreshToken          |Refresh Token            |string|200   |                |
|refreshTokenExpiryDate|Refresh Token expiry time|string|200   |Default 180 days|


### [#](#_2-settings-fields) 2 Settings Fields

#### [#](#_2-1-account) 2.1 Account


|Field    |Definition               |Type  |Length|Note                               |
|---------|-------------------------|------|------|-----------------------------------|
|openId   |Account ID               |string|200   |                                   |
|openName |Account Name             |string|200   |                                   |
|openEmail|Account Email            |string|200   |                                   |
|root     |Root access              |string|200   |root：NO_PERMISSION - not authorized|
|         |                         |      |      |GENERAL - general account          |
|         |                         |      |      |VIP - VIP account                  |
|         |                         |      |      |ADMIN - administrator              |
|isSandbox|(Whether) Sandbox account|byte  |4     |                                   |


#### [#](#_2-2-api-setting) 2.2 API Setting



* Field: setting
  * Definition: Settings
  * Type: list
  * Length: 200
  * Note: 
* Field: quotaLimits
  * Definition: Quota limits
  * Type: list
  * Length: 
  * Note: Applicable on specific URLs
* Field: quotaUrl
  * Definition: Quota URL
  * Type: string
  * Length: 200
  * Note: 
* Field: quotaLimit
  * Definition: Quota limit
  * Type: int
  * Length: 20
  * Note: 
* Field: quotaType
  * Definition: Quota Type
  * Type: byte
  * Length: 4
  * Note: 0-total，1-per year，2-per year，3-per quarter，4-per day，5-per hour
* Field: qpsLimit
  * Definition: QPS limit
  * Type: int
  * Length: 20
  * Note: Account queries per second


### [#](#_3-product-fields) 3 Product Fields

#### [#](#_3-1-product) 3.1 Product


|Field         |Definition        |Type   |Length|Note   |
|--------------|------------------|-------|------|-------|
|pid           |Product ID        |string |200   |       |
|productName   |Product name      |string |200   |       |
|productNameEn |Product name（EN）  |string |200   |       |
|productSku    |Product sku       |string |200   |       |
|productImage  |Product image     |string |200   |       |
|productWeight |Product weight    |int    |200   |unit: g|
|productType   |Product type      |byte   |200   |       |
|productUnit   |Product unit      |string |48    |       |
|categoryId    |Category id       |string |200   |       |
|categoryName  |Category name     |string |200   |       |
|entryCode     |HS code           |string |200   |       |
|entryName     |Customs name      |string |200   |       |
|entryNameEn   |Customs name (EN) |string |200   |       |
|materialName  |Material          |string |200   |       |
|materialNameEn|Material (EN)     |string |200   |       |
|materialKey   |Material attribute|string |200   |       |
|packWeight    |Package weight    |int    |200   |unit: g|
|packingName   |Package name      |string |200   |       |
|packingNameEn |Package name (EN) |string |200   |       |
|packingKey    |Package attribute |string |200   |       |
|isActive      |(Whether) Active  |boolean|1     |       |
|description   |Description       |string |200   |       |


Product Type


|Product Type            |Type                    |
|------------------------|------------------------|
|ORDINARY_PRODUCT        |Ordinary product        |
|SERVICE_PRODUCT         |Service product         |
|PACKAGING_PRODUCT       |Packaging product       |
|SUPPLIER_PRODUCT        |Supplier product        |
|SUPPLIER_SHIPPED_PRODUCT|Supplier shipped product|


#### [#](#_3-2-variant) 3.2 Variant


|Field           |Definition        |Type  |Length|Note         |
|----------------|------------------|------|------|-------------|
|vid             |Variant ID        |string|200   |             |
|variantName     |Variant name      |string|200   |             |
|variantNameEn   |Variant name (EN) |string|200   |             |
|variantSku      |Variant SKU       |string|200   |             |
|variantUnit     |Variant Unit      |string|200   |             |
|variantProperty |Variant Property  |string|200   |             |
|variantKey      |Variant Key       |string|200   |             |
|variantLength   |Variant Length    |int   |200   |unit: mm     |
|variantWidth    |Variant Width     |int   |200   |unit: mm     |
|variantHeight   |Variant Height    |int   |200   |unit: mm     |
|variantVolume   |Variant Volume    |int   |200   |unit: mm3    |
|variantWeight   |Variant Weight    |int   |200   |unit: g      |
|variantSellPrice|Variant Sell Price|double|200   |unit: $ (USD)|


#### [#](#_3-3-supplier) 3.3 Supplier



#### [#](#_3-4-storage) 3.4 Storage


|Field     |Definition         |Type  |Length|Note|
|----------|-------------------|------|------|----|
|storageNum|Available inventory|int   |20    |    |
|queryTime |Refresh rate       |string|200   |    |


### [#](#_4-storage-fields) 4 Storage Fields

#### [#](#_4-1-warehouse) 4.1 Warehouse


|Field      |Definition    |Type  |Length|Note|
|-----------|--------------|------|------|----|
|storageId  |Warehouse id  |string|200   |    |
|storageName|Warehouse Name|string|200   |    |


### [#](#_5-transaction-fields) 5 Transaction Fields

#### [#](#_5-1-order) 5.1 Order


|Field      |Definition  |Type  |Length|Note         |
|-----------|------------|------|------|-------------|
|orderId    |Order Id    |string|200   |             |
|orderWeight|order weight|int   |200   |             |
|orderAmount|order amount|double|200   |unit: $ (USD)|
|orderStatus|order status|string|200   |             |


Order Status


|Order Status|Status      |
|------------|------------|
|CREATED     |Order create|
|IN_CART     |in cart     |
|UNPAID      |unpaid      |
|UNSHIPPED   |unshipped   |
|SHIPPED     |shipped     |
|DELIVERED   |delivered   |
|CANCELLED   |cancelled   |


#### [#](#_5-2-amount) 5.2 Amount


|Field             |Definition   |Type      |Length|Note         |
|------------------|-------------|----------|------|-------------|
|noWithdrawalAmount|Bonus amount |BigDecimal|(18,2)|unit: $ (USD)|
|freezeAmount      |Frozen amount|BigDecimal|(18,2)|unit: $ (USD)|
|amount            |Amount       |BigDecimal|(18,2)|unit: $ (USD)|


ps：

*   1，BigDecimal（18，2） Length:20, 2 decimal digits.
*   2，CJ Supported international currency: USD ($)

#### [#](#_5-3-shipping) 5.3 Shipping


|Field              |Definition           |Type  |Length|Note|
|-------------------|---------------------|------|------|----|
|shippingCountryCode|shipping country code|string|200   |    |
|shippingCountry    |shipping country     |string|200   |    |
|shippingProvince   |shipping province    |string|200   |    |
|shippingCity       |shipping city        |string|200   |    |
|shippingAddress    |shipping address     |string|200   |    |
|shippingZip        |shipping zip         |string|200   |    |
|shippingPhone      |shipping phone       |string|200   |    |


### [#](#_6-logistics-fields) 6 Logistics Fields

#### [#](#_6-1-logistics) 6.1 Logistics


|Field          |Definition                 |Type      |Length|Note         |
|---------------|---------------------------|----------|------|-------------|
|logisticPrice  |Shipping cost              |BigDecimal|(18,2)|unit: $ (USD)|
|logisticPriceCn|Shipping cost              |BigDecimal|（18，2）|unit: ￥ (CNY)|
|logisticAging  |Estimated delivery timespan|string    |20    |             |
|logisticName   |Shipping method            |string    |20    |             |


#### [#](#_6-2-tracking-number) 6.2 Tracking Number


|Field         |Definition       |Type  |Length|Note|
|--------------|-----------------|------|------|----|
|trackingNumber|Tracking number  |string|200   |    |
|trackingFrom  |From             |string|20    |    |
|trackingTo    |To               |string|20    |    |
|deliveryDay   |Delivery timespan|string|200   |    |
|deliveryTime  |Delivered time   |string|200   |    |
|trackingStatus|Tracking status  |string|200   |    |

