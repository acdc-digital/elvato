---
tags: [CJ API Docs]
title: CJ API Docs 002
created: '2025-12-31T02:41:48.880Z'
modified: '2025-12-31T02:43:29.046Z'
---

# CJ API Docs 002

# Get Token | CJ Docs
[#](#get-token) Get Token
-------------------------

[#](#token-mechanism) Token Mechanism
-------------------------------------

Tokens can be obtained upon Auth2.0 protocol. Each Access Token and Refresh Token has its timestamp.

[#](#get-access-token) Get Access\_token
----------------------------------------

> For security reasons, the Access Token shall always be stored in the backend, and shall never be returned to front end, as all API access requests shall be initiated from backend.

Access Token must be obtained to create a login credential before calling API interface, as caller ID of other API interfaces will be authenticated with Access Token.

CJ-Access-Token: [Get CJ-Access-Token](https://developers.cjdropshipping.com/en/api/api2/api/auth.html)

[#](#storage-examination-of-token) Storage & Examination of Token
-----------------------------------------------------------------

### [#](#access-token) Access Token

An Access Token which contains login information must be created before API can be called. Access Tokens are required before servers can be accessed. In general, the life of an Access Token is 15 days.

### [#](#refresh-token) Refresh Token

An Access Token can be refreshed with a Refresh Token. Access Tokens will be returned after Refresh Tokens are imported to the authentication server. In general, the life of a Refresh Token is 180 days.

Regular examination on validity of Tokens is recommended: Examination of expiry date of each Token before use: if Access\_Token is expired, Refresh\_Token can be applied to refresh.

[#](#token-refresh) Token Refresh
---------------------------------

Get new Access Token and Refresh Token when expiry date of Access Token is near, and store new tokens as before. Delay queue is recommended when refreshing tokens.

If both Access Token and Refresh Token are expired, new tokens can be obtained via reauthorization.
