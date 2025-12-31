---
tags: [CJ API Docs]
title: CJ API Docs 010
created: '2025-12-31T02:52:24.443Z'
modified: '2025-12-31T02:53:07.273Z'
---

# CJ API Docs 010

# Appendix 1：Global Error Codes | CJ Docs
[#](#appendix-1-global-error-codes) Appendix 1：Global Error Codes
-----------------------------------------------------------------

[#](#description) Description
-----------------------------

Each time the interface is called, a code may be returned. Based on the return, you can debug the interface and troubleshoot errors.

Notes.

*   You are supposed to troubleshoot by codes instead of error messages as they may be adjusted.
*   If the request parameters do not conform to the json specification, this may result in the CJ server parsing the parameters incompletely, in which the interface will return "The request parameter is not in a correct JSON format". You need to check the request parameters of json.

[#](#error-code-description) Error Code Description
---------------------------------------------------



* Return Code: 200
  * Error Description: Success
  * Troubleshooting: Success
* Return Code: 1600000
  * Error Description: System busy, please contact CJ IT
  * Troubleshooting: System busy, please contact CJ IT
* Return Code: 1600001
  * Error Description: Invalid API key or access token. How to get access token: https://developers.cjdropshipping.cn/en/api/api2/api/auth.html#_1-1-get-access-token-post
  * Troubleshooting: Get new access token, View Docs
* Return Code: 1600002
  * Error Description: access token cannot be empty
  * Troubleshooting: Access token cannot be empty， Please input the correct token
* Return Code: 1600003
  * Error Description: Invalid Refresh token
  * Troubleshooting: Use the correct Refresh token or Get new access token, View Docs
* Return Code: 1600031
  * Error Description: Invalid platform token
  * Troubleshooting: Invalid platform token, Get new platform access token, View Docs
* Return Code: 1600030
  * Error Description: token invalidation fail
  * Troubleshooting: token invalidation fail, Get new access token, View Docs
* Return Code: 1600004
  * Error Description: Authorization failed, Please check cj account
  * Troubleshooting: Please check if your email and API key are correct, or if your API store is Authorized
* Return Code: 1600005
  * Error Description: APIkey is wrong, please check and try again
  * Troubleshooting: Please check if API key are correct, or if your API store is Authorized
* Return Code: 1600006
  * Error Description: Developer account not found
  * Troubleshooting: Please check if your email and API key are correct, or if your API store is Authorized
* Return Code: 1600007
  * Error Description: The user has been bound to another developer account
  * Troubleshooting: The user has been bound to another developer account
* Return Code: 1600008
  * Error Description: Authorization failed, Please check cj account
  * Troubleshooting: Please check if your email and API key are correct, or if your API store is Authorized
* Return Code: 1600009
  * Error Description: Token exchange failed because the code does not exist.
  * Troubleshooting: Token exchange failed because the code does not exist.
* Return Code: 1600010
  * Error Description: RedirectUri must be not empty.
  * Troubleshooting: RedirectUri must be not empty.
* Return Code: 1600011
  * Error Description: CallbackUri must be not empty.
  * Troubleshooting: CallbackUri must be not empty.
* Return Code: 1600012
  * Error Description: The account creation authorization has been disabled, and cj authorization cannot be created. Contact the CJ account manager.
  * Troubleshooting: The account creation authorization has been disabled, and cj authorization cannot be created. Contact the CJ account manager.
* Return Code: 1600013
  * Error Description: Store info does not exist,please check and try again.
  * Troubleshooting: Store info does not exist,please check and try again.
* Return Code: 1600100
  * Error Description: Interface is offline
  * Troubleshooting: Interface is offline
* Return Code: 1600101
  * Error Description: Interface not found
  * Troubleshooting: Interface not found
* Return Code: 1600200
  * Error Description: Too much request{param}
  * Troubleshooting: Regulate the rate of your requests for smoother distribution. Refer to: Access Frequency Restrictions
* Return Code: 1600201
  * Error Description: Quota has been used up
  * Troubleshooting: Regulate the rate of your requests for smoother distribution. Refer to: Access Frequency Restrictions
* Return Code: 1600300
  * Error Description: Param error
  * Troubleshooting: Check your parameters and enter correct value.
* Return Code: 1600301
  * Error Description: Read timed out
  * Troubleshooting: Read timed out, Wait a moment and try again
* Return Code: 1601000
  * Error Description: User not found
  * Troubleshooting: Please check if your email and API key are correct, or if your API store is Authorized
* Return Code: 1602000
  * Error Description: Variant not found
  * Troubleshooting: Variant not found
* Return Code: 1602001
  * Error Description: Product not found
  * Troubleshooting: Product not found
* Return Code: 1602002
  * Error Description: Product has been removed from shelves
  * Troubleshooting: Order confirm fail, Please contact CJ Agent
* Return Code: 1602003
  * Error Description: Variant has been removed from shelves
  * Troubleshooting: Variant has been removed from shelves
* Return Code: 1602004
  * Error Description: Failed to create infringement report
  * Troubleshooting: Failed to create infringement report
* Return Code: 1603000
  * Error Description: Order create fail
  * Troubleshooting: Order create fail
* Return Code: 1603001
  * Error Description: Order confirm fail
  * Troubleshooting: Order confirm fail
* Return Code: 1603002
  * Error Description: Order delete fail
  * Troubleshooting: Order delete fail
* Return Code: 1603003
  * Error Description: Order exist, please do not duplicate create
  * Troubleshooting: Order exist, please do not duplicate create
* Return Code: 1603100
  * Error Description: Order not found, please check the CJ order id
  * Troubleshooting: Order not found, please check the CJ order id
* Return Code: 1603101
  * Error Description: Order pay fail, please contact CJ order center
  * Troubleshooting: Order pay fail, please contact CJ Agent
* Return Code: 1603102
  * Error Description: Inventory deduction fail, please contact CJ order center
  * Troubleshooting: Inventory deduction fail, please contact CJ Agent
* Return Code: 1604000
  * Error Description: Balance is insufficient
  * Troubleshooting: Balance is insufficient
* Return Code: 1604001
  * Error Description: The balance payment function is temporarily restricted. Please log in to My CJ and make the order payment on the page
  * Troubleshooting: please contact CJ Agent
* Return Code: 1605000
  * Error Description: Logistic not found
  * Troubleshooting: Logistic not found
* Return Code: 1605001
  * Error Description: Logistic invalid, please reference freight calculate.
  * Troubleshooting: Logistic invalid, please reference freight calculate.
* Return Code: 1605002
  * Error Description: country code not found
  * Troubleshooting: country code not found
* Return Code: 1606000
  * Error Description: Webhook setting add fail, Webhook already have settings
  * Troubleshooting: Webhook setting add fail, Webhook already have settings
* Return Code: 1606001
  * Error Description: You do not meet our service requirements, Please check and try again. 1.Request Protocols: HTTPS, 2. Request Method: POST, 3.Content-Type: application/json, 4. Response Status Code: 200, 5. Response must be returned within 3 seconds.
  * Troubleshooting: Fix and retry
* Return Code: 1607000
  * Error Description: You do not meet our service requirements, Please check and try again. 1.Request Protocols: HTTPS, 2. Request Method: POST, 3.Content-Type: application/json, 4. Response Status Code: 200, 5. Response must be returned within 3 seconds.
  * Troubleshooting: Fix and retry
* Return Code: 1607001
  * Error Description: Please do not use domain names such as localhost, 127.0.0.1
  * Troubleshooting: Fix and retry
* Return Code: 1607002
  * Error Description: Webhook url error, Please ensure URL starts with https://
  * Troubleshooting: Fix and retry
* Return Code: 1607003
  * Error Description: Webhook url error, Http Status must be 200
  * Troubleshooting: Webhook url error, Http Status must be 200
* Return Code: 16070002
  * Error Description: The CJ page type is not supported
  * Troubleshooting: The CJ page type is not supported
* Return Code: 1607004
  * Error Description: Freight calculation request failed
  * Troubleshooting: Freight calculation request failed
* Return Code: 1607006
  * Error Description: Query dispute product request failed
  * Troubleshooting: Query dispute product request failed
* Return Code: 1607007
  * Error Description: dispute confirm fail
  * Troubleshooting: dispute confirm fail
* Return Code: 1607008
  * Error Description: dispute create fail
  * Troubleshooting: dispute create fail
* Return Code: 1607009
  * Error Description: dispute cancel fail
  * Troubleshooting: dispute cancel fail
* Return Code: 1607010
  * Error Description: product update fail
  * Troubleshooting: product update fail
* Return Code: 16900202
  * Error Description: Request method '{param}' not supported
  * Troubleshooting: Please check the API documentation to confirm which HTTP method is required for this request, update it and retry.
* Return Code: 16900203
  * Error Description: Content type not supported[{param}]
  * Troubleshooting: Please check the API documentation to confirm which Content-Type is required for this request, update it and retry.
* Return Code: 16900204
  * Error Description: Required request body is missing
  * Troubleshooting: Check the API documentation and add request body.
* Return Code: 16900205
  * Error Description: The request parameter is not in a correct JSON format
  * Troubleshooting: Check the API documentation use the correct JSON data
* Return Code: 16900403
  * Error Description: {param} can not be empty
  * Troubleshooting: Check your parameters and enter correct value.


[#](#troubleshooting-methods) Troubleshooting methods
-----------------------------------------------------

### [#](#error-code-1600200) Error code: 1600200

Interface call exceeds limit.

1.  For specific frequency policy, Refer to: [Access Frequency Restrictions](about:/en/api/api2/standard/limit.html#access-frequency-restrictions)
2.  The time is the same. For example, if you beyond the minutes limits, you can request again after minutes, while it will be hours if you beyond the hours limits.
3.  Our rate limit is not strict. For the calls, the following optimizations are considered.
    *   When the interface is implemented, only system failures need call again. For other error codes, the specific failure shall figured out.
    *   The call is reasonable or not. For a real-time synchronization, it can be changed to a timed task call as too many calls of one user will cause a bad experience.

### [#](#error-code-1600300) Error code: 1600300

Invalid Parameter. It doesn't meet the system requirements. You can refer to the specific API interface instruction. Also, you need to confirm:

1.  It is a correct Http request method. For example, if the interface requires the Post method, you cannot use the Get method.
2.  It is a correct Http request parameter. For example, if the interface requires a json structure, it cannot be passed as an url parameter or form-data.
