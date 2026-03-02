---
tags: [CJ API Docs]
title: CJ API Docs 019
created: '2025-12-31T03:02:32.382Z'
modified: '2025-12-31T03:03:12.029Z'
---

# CJ API Docs 019

# 7 Dispute | CJ Docs
[#](#_7-dispute) 7 Dispute
--------------------------

[#](#_1-select-the-list-of-disputed-products-get) 1 Select the list of disputed products（GET）
---------------------------------------------------------------------------------------------

#### [#](#url) URL

https://developers.cjdropshipping.com/api2.0/v1/disputes/disputeProducts

#### [#](#curl) CURL


|Parameter|Definition |Type  |Required|Length|Note|
|---------|-----------|------|--------|------|----|
|orderId  |CJ order id|string|Y       |100   |    |


#### [#](#return) Return

success


|Field          |Definition                               |Type      |Length|Note              |
|---------------|-----------------------------------------|----------|------|------------------|
|orderId        |CJ order id                              |string    |200   |                  |
|orderNumber    |customer order number                    |string    |200   |                  |
|productInfoList|Product information list                 |Object[]  |      |                  |
|lineItemId     |lineItem id                              |string    |100   |                  |
|cjProductId    |CJ product id                            |string    |100   |                  |
|cjVariantId    |CJ variant id                            |string    |100   |                  |
|canChoose      |Is it possible to check to open a dispute|boolean   |      |true:yes, false：no|
|price          |product price                            |BigDecimal|(18,2)|Unit: $ (USD）     |
|quantity       |quantity                                 |integer   |20    |                  |
|cjProductName  |CJ product name                          |string    |200   |                  |
|cjImage        |CJ product image                         |string    |100   |                  |
|sku            |sku                                      |string    |100   |                  |
|supplierName   |supplier name                            |string    |200   |                  |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


[#](#_2-confirm-the-dispute-post) 2 Confirm the dispute（POST）
-------------------------------------------------------------

#### [#](#url-2) URL

https://developers.cjdropshipping.com/api2.0/v1/disputes/disputeConfirmInfo

#### [#](#curl-2) CURL


|Parameter      |Definition         |Type      |Required|Length|Note         |
|---------------|-------------------|----------|--------|------|-------------|
|orderId        |CJ order id        |string    |Y       |100   |             |
|productInfoList|product information|object[]  |Y       |      |             |
|lineItemId     |lineItem id        |string    |N       |      |             |
|quantity       |quantity           |integer   |Y       |      |             |
|price          |price              |BigDecimal|Y       |(18,2)|Unit: $ (USD）|


#### [#](#return-2) Return

success


|Field                 |Definition                   |Type      |Length|Note                 |
|----------------------|-----------------------------|----------|------|---------------------|
|orderId               |CJ order id                  |string    |200   |                     |
|orderNumber           |customer order number        |string    |200   |                     |
|expectResultOptionList|expected result              |string[]  |      |1: Refund , 2:Reissue|
|maxProductPrice       |Product price                |BigDecimal|(18,2)|Unit: $ (USD）        |
|maxPostage            |Postage                      |BigDecimal|(18,2)|Unit: $ (USD）        |
|maxIossTaxAmount      |ioss tax amount              |BigDecimal|(18,2)|Unit: $ (USD）        |
|maxIossHandTaxAmount  |ioss tax fee amount          |BigDecimal|(18,2)|Unit: $ (USD）        |
|maxAmount             |Apply for refund amount      |BigDecimal|(18,2)|Unit: $ (USD）        |
|productInfoList       |product information          |Object[]  |      |                     |
|canChoose             |Whether to check open dispute|boolean   |2     |false or ture        |
|price                 |price                        |BigDecimal|(18,2)|Unit: $ (USD）        |
|quantity              |quantity                     |integer   |20    |                     |
|lineItemId            |lineItem id                  |string    |100   |                     |
|cjProductId           |CJ product id                |string    |100   |                     |
|cjVariantId           |CJ variant id                |string    |100   |                     |
|cjProductName         |CJ product name              |string    |200   |                     |
|cjImage               |CJ product image             |string    |100   |                     |
|sku                   |CJ sku                       |string    |100   |                     |
|supplierName          |supplier name                |string    |200   |                     |
|disputeReasonList     |dispute reason               |object [] |      |                     |
|disputeReasonId       |dispute reason id            |integer   |20    |                     |
|reasonName            |dispute reason name (EN)     |string    |200   |                     |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


[#](#_3-create-dispute-post) 3 Create dispute（POST）
---------------------------------------------------

#### [#](#url-3) URL

https://developers.cjdropshipping.com/api2.0/v1/disputes/create

#### [#](#curl-3) CURL


|Parameter        |Definition               |Type      |Required|Length|Note                  |
|-----------------|-------------------------|----------|--------|------|----------------------|
|businessDisputeId|customer business id, 唯一值|string    |Y       |100   |                      |
|orderId          |CJ order id              |string    |Y       |100   |                      |
|disputeReasonId  |dispute reason id        |integer   |Y       |10    |                      |
|expectType       |expect type              |integer   |Y       |20    |1: Refund , 2:Reissue |
|refundType       |Refund type              |integer   |Y       |20    |1:balance , 2：platform|
|messageText      |text message             |string    |Y       |500   |                      |
|imageUrl         |image url                |string [] |N       |200   |                      |
|videoUrl         |video url                |string [] |N       |200   |                      |
|productInfoList  |product information      |object[]  |        |      |                      |
|price            |price                    |BigDecimal|Y       |(18,2)|Unit: $ (USD）         |
|lineItemId       |lineItem id              |string    |N       |100   |                      |
|quantity         |quantity                 |integer   |Y       |10    |                      |


#### [#](#return-3) Return

success

error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


[#](#_4-cancel-dispute-post) 4 Cancel dispute（post）
---------------------------------------------------

#### [#](#url-4) URL

https://developers.cjdropshipping.com/api2.0/v1/disputes/cancel

#### [#](#curl-4) CURL


|Parameter|Definition   |Type  |Required|Length|Note|
|---------|-------------|------|--------|------|----|
|orderId  |CJ order id  |string|Y       |100   |    |
|disputeId|CJ dispute id|string|Y       |100   |    |


#### [#](#返回) 返回

success

error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


[#](#_5-query-the-list-of-disputes-get) 5 Query the list of disputes（GET）
-------------------------------------------------------------------------

#### [#](#url-5) URL

https://developers.cjdropshipping.com/api2.0/v1/disputes/getDisputeList

#### [#](#curl-5) CURL


|Parameter  |Definition           |Type   |Required|Length|Note       |
|-----------|---------------------|-------|--------|------|-----------|
|orderId    |CJ order id          |string |N       |100   |           |
|disputeId  |dispute id           |integer|N       |10    |           |
|orderNumber|customer order number|string |N       |100   |           |
|pageNum    |page number          |integer|N       |10    |default: 1 |
|pageSize   |page size            |integer|N       |10    |default: 10|


#### [#](#return-4) Return

success


|返回字段             |字段意思                    |字段类型      |长度    |备注                             |
|-----------------|------------------------|----------|------|-------------------------------|
|pageNum          |page number             |int       |20    |                               |
|pageSize         |page size               |int       |20    |                               |
|total            |total                   |int       |20    |                               |
|list             |                        |List      |      |                               |
|status           |dispute status          |string    |20    |                               |
|id               |dispute id              |string    |      |                               |
|disputeReason    |dispute reason          |string    |      |                               |
|replacementAmount|Reissue amount          |BigDecimal|(18,2)|Unit: $ (USD）                  |
|resendOrderCode  |Reissue order id        |string    |      |                               |
|money            |final refund amount     |BigDecimal|(18,2)|Unit: $ (USD）                  |
|finallyDeal      |final negotiation result|integer   |      |1:Refund, 2: Reissue, 3: Reject|
|createDate       |create date             |          |      |                               |
|productList      |product information     |Object[]  |      |                               |
|image            |product image           |string    |      |                               |
|price            |product price           |          |      |                               |
|lineItemId       |lineItem id             |string    |100   |                               |
|cjProductId      |CJ product id           |string    |      |                               |
|cjVariantId      |CJ variant id           |string    |100   |                               |
|productName      |product name            |string    |      |                               |
|supplierName     |supplier name           |string    |      |                               |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|

