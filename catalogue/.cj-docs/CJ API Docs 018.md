---
tags: [CJ API Docs]
title: CJ API Docs 018
created: '2025-12-31T03:01:38.525Z'
modified: '2025-12-31T03:02:27.955Z'
---

# CJ API Docs 018

# 6 Logistics | CJ Docs
[#](#_6-logistics) 6 Logistics
------------------------------

[#](#_1-logistics) 1 Logistics
------------------------------

### [#](#_1-1-freight-calculation-post) 1.1 Freight Calculation (POST)

Freight calculation. Bulk purchase products will have designated shipping methods, while dropshipping products will usually have more options.

#### [#](#url) URL

https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate

#### [#](#curl) CURL


|Parameter       |Definition            |Type  |Required|Length|Note|
|----------------|----------------------|------|--------|------|----|
|startCountryCode|Country of origin     |string|Y       |200   |    |
|endCountryCode  |Country of destination|string|Y       |200   |    |
|zip             |zip                   |string|N       |200   |    |
|taxId           |tax id                |string|N       |200   |    |
|houseNumber     |house number          |string|N       |200   |    |
|iossNumber      |ioss number           |string|N       |200   |    |
|quantity        |Quantity              |int   |Y       |10    |    |
|vid             |Variant id            |string|Y       |200   |    |


#### [#](#return) Return

success


|Field                |Definition           |Type      |Length |Note         |
|---------------------|---------------------|----------|-------|-------------|
|logisticPrice        |Shipping cost in USD |BigDecimal|（18，2） |Unit: $ (USD）|
|logisticPriceCn      |Shipping cost in CNY |BigDecimal|（18，2） |Unit: ¥ (CNY)|
|logisticAging        |Shipping time        |string    |20     |             |
|logisticName         |Carrier name         |string    |20     |             |
|taxesFee             |taxes fee            |BigDecimal|(18, 2)|Unit：$(USD)  |
|clearanceOperationFee|customs clearance fee|BigDecimal|(18, 2)|Unit：$(USD)  |
|totalPostageFee      |total postage        |BigDecimal|(18, 2)|Unit：$(USD)  |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_1-2-freight-calculation-tip-post) 1.2 Freight Calculation Tip(POST)

Freight calculation. Bulk purchase products will have designated shipping methods, while dropshipping products will usually have more options.

#### [#](#url-2) URL

https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculateTip

#### [#](#curl-2) CURL



* Parameter: srcAreaCode
  * Definition: Country of origin
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: destAreaCode
  * Definition: Country of destination
  * Type: string
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: customerCode
  * Definition: customer code
  * Type: string
  * Required: N
  * Length: 200
  * Note: 
* Parameter: zip
  * Definition: zip
  * Type: string
  * Required: N
  * Length: 200
  * Note: 
* Parameter: houseNumber
  * Definition: house number
  * Type: string
  * Required: N
  * Length: 100
  * Note: 
* Parameter: iossNumber
  * Definition: ioss number
  * Type: string
  * Required: N
  * Length: 200
  * Note: 
* Parameter: storageIdList
  * Definition: storage id
  * Type: string
  * Required: N
  * Length: 100
  * Note: 
* Parameter: recipientAddress
  * Definition: recipient address
  * Type: string
  * Required: N
  * Length: 200
  * Note: 
* Parameter: city
  * Definition: city
  * Type: string
  * Required: N
  * Length: 50
  * Note: 
* Parameter: recipientName
  * Definition: recipient name
  * Type: String
  * Required: N
  * Length: 200
  * Note: 
* Parameter: skuList
  * Definition: sku list
  * Type: String[]
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: town
  * Definition: town
  * Type: String
  * Required: N
  * Length: 100
  * Note: 
* Parameter: phone
  * Definition: phone
  * Type: String
  * Required: N
  * Length: 50
  * Note: 
* Parameter: wrapWeight
  * Definition: wrap weight,Unit:g
  * Type: int
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: volume
  * Definition: Volume,Unit:cm³
  * Type: BigDecimal
  * Required: Y
  * Length: 200
  * Note: 
* Parameter: station
  * Definition: station
  * Type: String
  * Required: N
  * Length: 200
  * Note: 
* Parameter: platforms
  * Definition: platform
  * Type: String[]
  * Required: N
  * Length: 200
  * Note: 
* Parameter: dutyNo
  * Definition: dutyNo
  * Type: String
  * Required: N
  * Length: 200
  * Note: 
* Parameter: email
  * Definition: email
  * Type: String
  * Required: N
  * Length: 100
  * Note: 
* Parameter: province
  * Definition: province
  * Type: String
  * Required: N
  * Length: 100
  * Note: 
* Parameter: recipientAddress1
  * Definition: recipient address1
  * Type: String
  * Required: N
  * Length: 200
  * Note: 
* Parameter: uid
  * Definition: uid
  * Type: String
  * Required: N
  * Length: 200
  * Note: 
* Parameter: recipientId
  * Definition: recipient id
  * Type: String
  * Required: N
  * Length: 200
  * Note: 
* Parameter: recipientAddress2
  * Definition: recipient address2
  * Type: String
  * Required: N
  * Length: 200
  * Note: 
* Parameter: amount
  * Definition: amount
  * Type: BigDecimal
  * Required: N
  * Length: 50
  * Note: 
* Parameter: productTypes
  * Definition: product type
  * Type: String[]
  * Required: N
  * Length: 100
  * Note: 
* Parameter: weight
  * Definition: weight,Unit:g
  * Type: int
  * Required: Y
  * Length: 100
  * Note: 
* Parameter: productProp
  * Definition: product prop
  * Type: String
  * Required: Y
  * Length: 100
  * Note: 
* Parameter: optionName
  * Definition: option name
  * Type: String
  * Required: N
  * Length: 200
  * Note: 
* Parameter: volumeWeight
  * Definition: volume weight,Unit:g
  * Type: BigDecimal
  * Required: N
  * Length: 100
  * Note: 
* Parameter: orderType
  * Definition: order type
  * Type: String
  * Required: N
  * Length: 100
  * Note: 
* Parameter: totalGoodsAmount
  * Definition: total value of goods
  * Type: BigDecimal
  * Required: N
  * Length: 100
  * Note: 
* Parameter: freightTrialSkuList
  * Definition: freight trial sku list
  * Type: Object[]
  * Required: Y
  * Length: 
  * Note: 
* Parameter: - productCode
  * Definition: product code
  * Type: String
  * Required: N
  * Length: 100
  * Note: 
* Parameter: - sku
  * Definition: sku
  * Type: String
  * Required: N
  * Length: 100
  * Note: 
* Parameter: - productPropList
  * Definition: Product attributes
  * Type: String
  * Required: N
  * Length: 100
  * Note: 
* Parameter: - productTypeList
  * Definition: product type (0: normal goods, 1: service goods, 3: packaged goods, 4: supplier goods, 5: supplier self-delivered goods, 6: virtual goods, 7: pod personalized goods)
  * Type: String[]
  * Required: N
  * Length: 100
  * Note: 
* Parameter: - vid
  * Definition: variant id
  * Type: String
  * Required: N
  * Length: 100
  * Note: 
* Parameter: - skuQuantity
  * Definition: sku quantity
  * Type: int
  * Required: N
  * Length: 50
  * Note: 
* Parameter: - skuWeight
  * Definition: sku weight,Unit:g
  * Type: BigDecimal
  * Required: N
  * Length: 100
  * Note: 
* Parameter: - skuVolume
  * Definition: sku volume,Unit:cm³
  * Type: BigDecimal
  * Required: N
  * Length: 100
  * Note: 
* Parameter: - combinationType
  * Definition: combination type
  * Type: int
  * Required: N
  * Length: 50
  * Note: 
* Parameter: - parentVid
  * Definition: parent variant id
  * Type: String
  * Required: N
  * Length: 50
  * Note: 
* Parameter: - unsalable
  * Definition: unsalable
  * Type: int
  * Required: N
  * Length: 10
  * Note: 
* Parameter: - tailCostQuantity
  * Definition: tail cost quantity
  * Type: int
  * Required: N
  * Length: 10
  * Note: 
* Parameter: - privateDeductionQuantity
  * Definition: private Ddeduction quantity
  * Type: int
  * Required: N
  * Length: 10
  * Note: 


#### [#](#return-2) Return

success


|Field                |Definition           |Type      |Length |Note         |
|---------------------|---------------------|----------|-------|-------------|
|arrivalTime          |arrival time         |string    |200    |             |
|discountFee          |discount Fee         |BigDecimal|（18，2） |Unit: $ (USD）|
|discountFeeCNY       |discount Fee CNY     |BigDecimal|（18，2） |             |
|volumeWeight         |volume weight        |BigDecimal|（18，2） |Unit: $ (USD）|
|channelId            |channel id           |String    |200    |             |
|error                |error                |String    |200    |             |
|errorEn              |errorEn              |String    |200    |             |
|optionId             |option id            |String    |100    |             |
|postage              |postage              |BigDecimal|（18，2） |Unit: $ (USD）|
|postageCNY           |postage CNY          |BigDecimal|（18，2） |Unit: $ (USD）|
|priceIncreases       |price increases      |String    |100    |             |
|reSort               |reSort               |String    |100    |             |
|remoteFee            |remoteFee            |BigDecimal|（18，2） |Unit: $ (USD）|
|remoteFeeCNY         |remoteFee CNY        |BigDecimal|（18，2） |Unit: $ (USD）|
|tip                  |tip                  |string    |200    |             |
|uid                  |uid                  |String    |200    |             |
|orderId              |order id             |String    |100    |             |
|unWeightChargeTarget |unWeightChargeTarget |BigDecimal|（18，2） |Unit: $ (USD）|
|floatMaxPrice        |floatMaxPrice        |BigDecimal|（18，2） |Unit: $ (USD）|
|floatMinPrice        |floatMinPrice        |BigDecimal|（18，2） |Unit: $ (USD）|
|logisticsParamRespDTO|logisticsParamRespDTO|String    |200    |             |
|message              |message              |String    |200    |             |
|wrapPostage          |wrap postage         |BigDecimal|（18，2） |Unit: $ (USD）|
|wrapPostageCNY       |wrap postage CNY     |BigDecimal|（18，2） |Unit: $ (USD）|
|wrapWeight           |wrap weight          |BigDecimal|（18，2） |Unit: $ (USD）|
|stopWords            |stop Words           |String    |200    |             |
|channel              |channel              |Object    |       |             |
|cnName               |name(CN)             |String    |200    |             |
|enName               |name(EN)             |String    |200    |             |
|id                   |id                   |String    |200    |             |
|option               |option               |Object    |       |             |
|arrivalTime          |arrival time         |String    |100    |             |
|cnName               |name(CN)             |String    |100    |             |
|enName               |name(EN)             |String    |100    |             |
|id                   |id                   |String    |100    |             |
|taxesFee             |taxes fee            |BigDecimal|（18，2） |Unit: $ (USD）|
|clearanceOperationFee|customs clearance fee|BigDecimal|（18，2） |Unit: $ (USD）|
|totalPostageFee      |total postage        |BigDecimal|(18, 2)|Unit：$(USD)  |
|allRuleTips          |all rule tips        |String    |200    |             |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


[#](#_2-tracking-number) 2 Tracking Number
------------------------------------------

### [#](#_2-1-get-tracking-information-get-deprecated) 2.1 Get Tracking Information (GET) `Deprecated`

Shipping information can be found upon tracking numbers. You can also visit [CJ Logistic Platform (opens new window)](https://cjpacket.com/)

> Has deprecated on June 1, 2024, Please use the new api [Get Tracking Information](about:/en/api/api2/api/logistic.html#_2-2-get-tracking-information-get)

#### [#](#url-3) URL

https://developers.cjdropshipping.com/api2.0/v1/logistic/getTrackInfo?trackNumber=CJPKL7160102171YQ

#### [#](#curl-3) CURL


|Parameter  |Definition |Type  |Required|Length|Note       |
|-----------|-----------|------|--------|------|-----------|
|trackNumber|trackNumber|string|Y       |200   |batch query|


#### [#](#return-3) Return

success


|Field          |Definition               |Type  |Length|Note|
|---------------|-------------------------|------|------|----|
|trackingNumber |tracking number          |string|200   |    |
|trackingFrom   |from                     |string|20    |    |
|trackingTo     |to                       |string|20    |    |
|deliveryDay    |Delivery day             |string|200   |    |
|deliveryTime   |Delivery time            |string|200   |    |
|trackingStatus |tracking status          |string|200   |    |
|lastMileCarrier|last mile carrier        |string|200   |    |
|lastTrackNumber|last mile tracking number|string|200   |    |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_2-2-get-tracking-information-get) 2.2 Get Tracking Information (GET)

Shipping information can be found upon tracking numbers. You can also visit [CJ Logistic Platform (opens new window)](https://cjpacket.com/)

#### [#](#url-4) URL

https://developers.cjdropshipping.com/api2.0/v1/logistic/trackInfo?trackNumber=CJPKL7160102171YQ

#### [#](#curl-4) CURL


|Parameter  |Definition |Type  |Required|Length|Note       |
|-----------|-----------|------|--------|------|-----------|
|trackNumber|trackNumber|string|Y       |200   |batch query|


#### [#](#return-4) Return

success


|Field          |Definition               |Type  |Length|Note|
|---------------|-------------------------|------|------|----|
|trackingNumber |tracking number          |string|200   |    |
|trackingFrom   |from                     |string|20    |    |
|trackingTo     |to                       |string|20    |    |
|deliveryDay    |Delivery day             |string|200   |    |
|deliveryTime   |Delivery time            |string|200   |    |
|trackingStatus |tracking status          |string|200   |    |
|lastMileCarrier|last mile carrier        |string|200   |    |
|lastTrackNumber|last mile tracking number|string|200   |    |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|

