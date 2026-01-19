---
tags: [CJ API Docs]
title: CJ API Docs 006
created: '2025-12-31T02:47:00.969Z'
modified: '2025-12-31T02:47:38.562Z'
---

# CJ API Docs 006

# API V2.0 (recommended) | CJ Docs
[#](#api-v2-0-recommended) API V2.0 (recommended)
-------------------------------------------------

[#](#_1-interface-list) 1 Interface List
----------------------------------------


|Module           |Function |No.|URL                                         |Interface Name     |
|-----------------|---------|---|--------------------------------------------|-------------------|
|00-Authentication|Auth     |1  |/api2.0/v1/authentication/getAccessToken    |Get Token          |
|                 |         |2  |/api2.0/v1/authentication/refreshAccessToken|Refresh Token      |
|                 |         |3  |/api2.0/v1/authentication/logout            |Logout             |
|01-Settings      |Settings |1  |/api2.0/v1/setting/get                      |Get Settings       |
|                 |Account  |1  |/api2.0/v1/setting/account/set              |Account Settings   |
|                 |         |2  |/api2.0/v1/setting/account/delete           |Delete Settings    |
|02-Product       |Product  |1  |/api2.0/v1/product/list                     |Get All Products   |
|                 |         |2  |/api2.0/v1/product/query                    |Product Query      |
|                 |Listing  |1  |/api2.0/v1/product/publish/listing          |Product Listing    |
|                 |Variant  |1  |/api2.0/v1/product/variant/queryByPid       |Get Variants       |
|                 |         |2  |/api2.0/v1/product/variant/queryByVid       |Get Variants       |
|                 |Stock    |1  |/api2.0/v1/product/stock/queryByVid         |Get Stock          |
|03-Warehouse     |Warehouse|   |                                            |                   |
|04-Shopping      |Order    |1  |/api2.0/v1/shopping/order/batchCreateOrder  |Batch Create Orders|
|                 |         |2  |/api2.0/v1/shopping/order/queryById         |Get Order Details  |
|                 |         |3  |/api2.0/v1/shopping/order/confirm           |Order Confirmation |
|                 |Payment  |1  |/api2.0/v1/shopping/pay/getBalance          |Get Balance        |
|                 |         |2  |/api2.0/v1/shopping/pay/payBalance          |Balance Payment    |
|05-Logistics     |Calculate|1  |/api2.0/v1/logistic/freightCalculate        |Freight Calculate  |
|                 |Tracking |2  |/api2.0/v1/logistic/getTrackInfo            |Track Query        |


[#](#_2-interface-usage) 2 Interface Usage
------------------------------------------
