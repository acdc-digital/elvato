---
tags: [CJ API Docs]
title: CJ API Docs 007
created: '2025-12-31T02:47:43.273Z'
modified: '2025-12-31T02:50:26.380Z'
---

# CJ API Docs 007

# Interface Definition | CJ Docs
[#](#interface-definition) Interface Definition
-----------------------------------------------

### [#](#_1-1-url) 1.1 url

https://developers.cjdropshipping.com/api2.0/v1/setting/account/set


|Name           |Required|Note                           |
|---------------|--------|-------------------------------|
|Content-Type   |Y       |default : application/json     |
|CJ-Access-Token|Y       |default : Your secret key in CJ|


### [#](#_1-3-curl) 1.3 curl

[#](#_2-return) 2，Return
------------------------


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|

