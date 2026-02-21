---
tags: [CJ API Docs]
title: CJ API Docs 014
created: '2025-12-31T02:56:35.652Z'
modified: '2025-12-31T02:57:08.988Z'
---

# CJ API Docs 014

# 2 Settings | CJ Docs
[#](#_2-settings) 2 Settings
----------------------------

[#](#_1-settings) 1 Settings
----------------------------

### [#](#_1-1-get-settings-get) 1.1 Get Settings（GET）

Account settings include profile, API quota limits, general API QPS limits, sandbox account, etc.

#### [#](#url) URL

https://developers.cjdropshipping.com/api2.0/v1/setting/get

#### [#](#curl) CURL

#### [#](#return) Return

success



* Field: openId
  * Definition: Account ID
  * Type: string
  * Length: 200
  * Note: 
* Field: openName
  * Definition: Account name
  * Type: string
  * Length: 200
  * Note: 
* Field: openEmail
  * Definition: Account Email
  * Type: string
  * Length: 200
  * Note: 
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
  * Note: 0-total，1-per year，2-per quarter，3-per month，4-per day，5-per hour
* Field: qpsLimit
  * Definition: QPS limit
  * Type: int
  * Length: 20
  * Note: account Queries per second
* Field: root
  * Definition: Root access
  * Type: string
  * Length: 200
  * Note: root：NO_PERMISSION - not authorized
* Field: 
  * Definition: 
  * Type: 
  * Length: 
  * Note: GENERAL - general account
* Field: 
  * Definition: 
  * Type: 
  * Length: 
  * Note: VIP - VIP account
* Field: 
  * Definition: 
  * Type: 
  * Length: 
  * Note: ADMIN - administrator
* Field: isSandbox
  * Definition: (Whether) Sandbox account
  * Type: byte
  * Length: 4
  * Note: 


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|

