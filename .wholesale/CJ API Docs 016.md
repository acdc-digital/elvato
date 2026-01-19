---
tags: [CJ API Docs]
title: CJ API Docs 016
created: '2025-12-31T02:59:21.419Z'
modified: '2025-12-31T02:59:50.620Z'
---

# CJ API Docs 016

# 04. Storage | CJ Docs
[#](#_04-storage) 04. Storage
-----------------------------

[#](#_1-storage-info) 1 Storage Info
------------------------------------

### [#](#_1-1-get-storage-info-get) 1.1 Get Storage Info (GET)

#### [#](#url) URL

https://developers.cjdropshipping.com/api2.0/v1/warehouse/detail

#### [#](#curl) CURL


|Parameter|Definition|Type  |Required|Length|Note|
|---------|----------|------|--------|------|----|
|id       |Storage ID|string|Y       |200   |    |


#### [#](#return) Return

success


|Field             |Definition                |Type   |Length|Note                       |
|------------------|--------------------------|-------|------|---------------------------|
|id                |Storage Id                |string |200   |                           |
|name              |name                      |string |200   |                           |
|areaId            |area id                   |integer|200   |                           |
|areaCountryCode   |country code              |string |200   |                           |
|province          |province                  |string |200   |                           |
|city              |city                      |string |200   |                           |
|address1          |address1                  |string |200   |                           |
|address2          |address2                  |string |200   |                           |
|contacts          |contacts                  |string |200   |                           |
|phone             |phone number              |string |200   |                           |
|isSelfPickup      |Is support self pickup    |integer|1     |1: support 0: not supported|
|zipCode           |zip Code                  |string |200   |                           |
|logisticsBrandList|Supported logistics brands|list   |200   |                           |
|- id              |Logistics brand ID        |string |200   |                           |
|- name            |Logistics brand Name      |string |200   |                           |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|

