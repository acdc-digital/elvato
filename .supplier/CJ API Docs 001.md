---
tags: [CJ API Docs]
title: CJ API Docs 001
created: '2025-12-31T02:38:34.689Z'
modified: '2025-12-31T02:42:12.628Z'
---

# CJ API Docs 001

# Development Documentation | CJ Docs
[#](#development-documentation) Development Documentation
---------------------------------------------------------

*   Introduction
*   Call Flow
*   Debugging Methods
*   Rate Limits

[#](#introduction) Introduction
-------------------------------

The CJ API offers a rich set of capability interfaces that developers can use to achieve integration of enterprise services and enterprise WeChat with the help of interface capabilities which can be quickly previewed by directory navigation. The navigation is aggregated and grouped by functional blocks, such as address book, push, etc..

For the API development, the guideline is Development Documentation > Get Access Token > API 2.0.

All interfaces must use the HTTPS protocol, JSON data format and UTF8 encoding. The interface description format is as follows.

1.  The request method. All requests shall meet the https protocol, distinguishing HttpGet and HttpPost requests.
2.  The request address. Case matters.
3.  The request package body and parameter description. You should indicates the request parameter example and description, which includes field meanings and value ranges. You should refer to this definition scope when designing data structures.
4.  The permission description. You should indicate the use range of the interface. By default, it can only view the data under the current account. No invocation scenario need your special attention.
5.  The return results and description of parameters. You should indicates the request parameter example and description. **Important**: To determine if an API call was successful:
    *   **Success**: HTTP status 200 AND (code=200 OR no code field present)
    *   **Failure**: HTTP status ≠ 200 OR code field present with value ≠ 200 Please refer to the global error code documentation for specific error meanings.

The message is for reference only and is subject to change, so it cannot be used to determine whether the call was successful.

[#](#interface-call-flow) Interface call flow
---------------------------------------------

![img.png](https://developers.cjdropshipping.com/assets/img/img_en.c23ed606.png)

Find the access token. Reference: [documentation note](https://developers.cjdropshipping.com/en/api/start/token.html).

1.  Cache and refresh access\_token.
2.  You need to cache the access\_token for subsequent calls to the interface. When the access\_token is invalid or expired, it needs to be retrieved.
3.  Calling a specific business interface.

[#](#basic-debugging-methods) Basic debugging methods
-----------------------------------------------------

Tools, such as postman, can be used to troubleshoot problems. Reference: [documentation note](https://developers.cjdropshipping.com/en/api/start/utils.html)

[#](#limitations-on-the-frequency-of-calls) Limitations on the frequency of calls
---------------------------------------------------------------------------------

To ensure our platform remains stable and fair for everyone, all APIs are rate-limited. Reference: [Active call frequency limit](https://developers.cjdropshipping.com/en/api/api2/standard/limit.html)
