---
tags: [CJ API Docs]
title: CJ API Docs 013
created: '2025-12-31T02:55:48.187Z'
modified: '2025-12-31T02:56:28.964Z'
---

# CJ API Docs 013

# 1 Authentication | CJ Docs
[#](#_1-authentication) 1 Authentication
----------------------------------------

[#](#_1-authentication-2) 1 Authentication
------------------------------------------

### [#](#_1-1-get-access-token-post) 1.1 Get access token（POST）

Token-based authentication, the life of an access token is 15 days, and the life of a refresh token is 180 days. You can request new access tokens with refresh token when access token expires. You need to log in when refresh token expires.

> Can only be called once every 5 minutes

#### [#](#url) URL

https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken

#### [#](#curl) CURL


|Parameter|Definition|Type  |Required|Length|Note                          |
|---------|----------|------|--------|------|------------------------------|
|apiKey   |CJ API Key|string|Y       |200   |Get API Key (opens new window)|


> How to get Api Key:
> 
> Go to [Get API Key (opens new window)](https://www.cjdropshipping.com/myCJ.html#/apikey) and click button "Generate"
> 
> ![How to get Api Key](https://developers.cjdropshipping.com/getapikey.png)

#### [#](#return) Return

success


|Field                 |Definition               |Type  |Length|Note            |
|----------------------|-------------------------|------|------|----------------|
|openId                |Open Id                  |Long  |20    |                |
|accessToken           |access token             |string|200   |                |
|accessTokenExpiryDate |access token expiry time |string|200   |Default 15 days |
|refreshToken          |Refresh Token            |string|200   |                |
|refreshTokenExpiryDate|Refresh Token expiry time|string|200   |Default 180 days|
|createDate            |Created date             |string|200   |                |


error


|Field    |Definition      |Type   |Length|Note                 |
|---------|----------------|-------|------|---------------------|
|code     |Error code      |int    |20    |Return to error codes|
|result   |Whether returned|boolean|1     |                     |
|message  |Return message  |string |200   |                     |
|data     |                |       |      |Data return          |
|requestId|Request ID      |string |48    |For error inquiry    |


### [#](#_1-2-refresh-access-token-post) 1.2 Refresh access token（POST）

An API security mechanism with which the expiry date of access token can be refreshed. The life of an access token is 15 days.

#### [#](#url-2) URL

https://developers.cjdropshipping.com/api2.0/v1/authentication/refreshAccessToken

#### [#](#curl-2) CURL


|Parameter   |Definition   |Type  |Required|Length|Note|
|------------|-------------|------|--------|------|----|
|refreshToken|Refresh Token|string|Y       |80    |    |


#### [#](#return-2) Return

success


|Field                 |Definition               |Type  |Length|Note            |
|----------------------|-------------------------|------|------|----------------|
|accessToken           |access token             |string|200   |                |
|accessTokenExpiryDate |access token Expiry Time |string|200   |Default 15 days |
|refreshToken          |Refresh Token            |string|200   |                |
|refreshTokenExpiryDate|Refresh Token Expiry Time|string|200   |Default 180 days|
|createDate            |Created Date             |string|200   |                |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_1-3-logout-token-post) 1.3 Logout Token（POST）

API security mechanism. After logging out, access token and refresh token will expire.

#### [#](#url-3) URL

https://developers.cjdropshipping.com/api2.0/v1/authentication/logout

#### [#](#curl-3) CURL

#### [#](#return-3) Return

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

