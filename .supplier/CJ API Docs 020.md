---
tags: [CJ API Docs]
title: CJ API Docs 020
created: '2025-12-31T03:03:16.964Z'
modified: '2025-12-31T03:03:52.016Z'
---

# CJ API Docs 020

# 08. Webhook | CJ Docs
[#](#_08-webhook) 08. Webhook
-----------------------------

[#](#_1-setting) 1 Setting
--------------------------

#### [#](#webhook-configuration-requirements) Webhook Configuration Requirements

##### [#](#_1-protocol-requirements) 1. Protocol Requirements

*   **Supported Protocols**: HTTPS
*   **Encryption**: TLS 1.2 or TLS 1.3 recommended for secure transmission
*   **Request Method**: POST
*   **Content Type**: `Content-Type: application/json`

##### [#](#_2-response-specifications) 2. Response Specifications

*   **Success Status Code**: `200 OK`
*   **Timeout**: Response must be returned within **3 seconds**  
    (Avoid long-running or complex business logic to ensure prompt response)

### [#](#_1-1-message-setting-post) 1.1 Message Setting（POST）

#### [#](#url) URL

https://developers.cjdropshipping.com/api2.0/v1/webhook/set

#### [#](#curl) CURL


|Parameter     |Definition          |Type    |Required|Length|Note                     |
|--------------|--------------------|--------|--------|------|-------------------------|
|product       |Product Message     |object  |Y       |200   |Product Message Setting  |
|- type        |Product Message type|string  |Y       |200   |ENABLE，CANCEL            |
|- callbackUrls|callback url        |string[]|Y       |1     |                         |
|stock         |Stock Message       |object  |Y       |200   |Stock Message Setting    |
|- type        |Stock Message type  |string  |Y       |200   |ENABLE，CANCEL            |
|- callbackUrls|callback url        |string[]|Y       |1     |                         |
|order         |Order Message       |object  |Y       |200   |Order Message Setting    |
|- type        |Message type        |string  |Y       |200   |ENABLE，CANCEL            |
|- callbackUrls|callback url        |string[]|Y       |1     |                         |
|logistics     |Logistics Message   |object  |Y       |200   |Logistics Message Setting|
|- type        |Message type        |string  |Y       |200   |ENABLE，CANCEL            |
|- callbackUrls|callback url        |string[]|Y       |1     |                         |


#### [#](#result) Result

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

