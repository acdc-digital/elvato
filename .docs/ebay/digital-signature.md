# Digital Signatures for APIs

**Guide Group:** Digital Signatures for APIs

---

## Introduction

Due to regulatory requirements applicable to our EU/UK sellers, for certain APIs, developers need to add digital signatures to the respective HTTP call. This document specifies how these signatures are created and added to HTTP payloads.

## APIs in scope

Signatures are required when the call is made for EU- or UK-domiciled sellers, and only for the following APIs/methods:

*   All methods in the [Finances API](/api-docs/sell/finances/resources/methods)
*   [issueRefund](/api-docs/sell/fulfillment/resources/order/methods/issueRefund) in the Fulfillment API
*   [GetAccount](/Devzone/XML/docs/Reference/eBay/GetAccount.html) in the Trading API
*   The following methods in the Post-Order API:
    *   [Issue Inquiry Refund](/Devzone/post-order/post-order_v2_inquiry-inquiryid_issue_refund__post.html)
    *   [Issue case refund](/Devzone/post-order/post-order_v2_casemanagement-caseid_issue_refund__post.html)
    *   [Issue return refund](/Devzone/post-order/post-order_v2_return-returnid_issue_refund__post.html)
    *   [Process Return Request](/Devzone/post-order/post-order_v2_return-returnid_decide__post.html)
    *   [Create Cancellation Request](/devzone/post-order/post-order_v2_cancellation__post.html)
    *   [Approve Cancellation Request](/devzone/post-order/post-order_v2_cancellation-cancelid_approve__post.html)

Please note that signatures may be added for other APIs and/or for other sellers. eBay's system will ignore the signatures, but the API call will be accepted and handled in an ordinary manner.

Signatures are required when the call is made for EU- or UK-domiciled sellers, and only for the following APIs/methods:

*   All methods in the [Finances API](/api-docs/sell/finances/resources/methods)
*   [issueRefund](/api-docs/sell/fulfillment/resources/order/methods/issueRefund) in the Fulfillment API
*   [GetAccount](/Devzone/XML/docs/Reference/eBay/GetAccount.html) in the Trading API
*   The following methods in the Post-Order API:
    *   [Issue Inquiry Refund](/Devzone/post-order/post-order_v2_inquiry-inquiryid_issue_refund__post.html)
    *   [Issue case refund](/Devzone/post-order/post-order_v2_casemanagement-caseid_issue_refund__post.html)
    *   [Issue return refund](/Devzone/post-order/post-order_v2_return-returnid_issue_refund__post.html)
    *   [Process Return Request](/Devzone/post-order/post-order_v2_return-returnid_decide__post.html)
    *   [Create Cancellation Request](/devzone/post-order/post-order_v2_cancellation__post.html)
    *   [Approve Cancellation Request](/devzone/post-order/post-order_v2_cancellation-cancelid_approve__post.html)

Please note that signatures may be added for other APIs and/or for other sellers. eBay's system will ignore the signatures, but the API call will be accepted and handled in an ordinary manner.

Signatures are required when the call is made for EU- or UK-domiciled sellers, and only for the following APIs/methods:

*   All methods in the [Finances API](/api-docs/sell/finances/resources/methods)
*   [issueRefund](/api-docs/sell/fulfillment/resources/order/methods/issueRefund) in the Fulfillment API
*   [GetAccount](/Devzone/XML/docs/Reference/eBay/GetAccount.html) in the Trading API
*   The following methods in the Post-Order API:
    *   [Issue Inquiry Refund](/Devzone/post-order/post-order_v2_inquiry-inquiryid_issue_refund__post.html)
    *   [Issue case refund](/Devzone/post-order/post-order_v2_casemanagement-caseid_issue_refund__post.html)
    *   [Issue return refund](/Devzone/post-order/post-order_v2_return-returnid_issue_refund__post.html)
    *   [Process Return Request](/Devzone/post-order/post-order_v2_return-returnid_decide__post.html)
    *   [Create Cancellation Request](/devzone/post-order/post-order_v2_cancellation__post.html)
    *   [Approve Cancellation Request](/devzone/post-order/post-order_v2_cancellation-cancelid_approve__post.html)

Please note that signatures may be added for other APIs and/or for other sellers. eBay's system will ignore the signatures, but the API call will be accepted and handled in an ordinary manner.

## Creating a payload signature

eBay's signature implementation is compliant with IETF standards:

*   [RFC9421](https://www.rfc-editor.org/rfc/rfc9421.html)
*   [RFC9530](https://www.rfc-editor.org/rfc/rfc9530.html)

**Note:** It is strongly recommned that the above standards be reviewed.

The following HTTP headers are added to each HTTP payload for [in-scope APIs](/develop/guides-v2/digital-signatures-for-apis/digital-signatures-for-apis#apis-in-scope) called on behalf of EU/UK domiciled sellers:

*   [x-ebay-signature-key](/develop/guides-v2/digital-signatures-for-apis/digital-signatures-for-apis#signature): **REQUIRED**
*   [Content-Digest](/develop/guides-v2/digital-signatures-for-apis/digital-signatures-for-apis#content-digest): _CONDITIONAL_
*   [Signature](/develop/guides-v2/digital-signatures-for-apis/digital-signatures-for-apis#signature-header): **REQUIRED**
*   [Signature-Input](/develop/guides-v2/digital-signatures-for-apis/digital-signatures-for-apis#signature-input): **REQUIRED**

eBay's [Key Management API](/api-docs/developer/key-management/overview.html) generates encrypted keypairs that are used to create the [x-ebay-signature-key](/develop/guides-v2/digital-signatures-for-apis/digital-signatures-for-apis#signature) and the [Signature](/develop/guides-v2/digital-signatures-for-apis/digital-signatures-for-apis#signatuer-header) headers.

The steps required to create each of the above four HTTP headers are listed below:

##### 1\. Create the x-ebay-signature-key header 

The `**x-ebay-signature-key**` header always contains JWE.

Using the [Key Management API](/api-docs/developer/key-management/overview.html), developers create the following keypairs:

*   Private Key
*   Public Key
*   Public Key as JWE

**Important:** In order to further ensure the security of confidential client information, eBay does not store **Private Key** values in any system. If a developer loses their Private Key they must generate new keypairs using the Key Management API.

The value of the `x-ebay-signature-key` header is the **Public Key as JWE** value that has been created by the Key Management API.

For example:

```
x-ebay-signature-key: eyJ6aXAiOiJERUYiLCJlbmMiOiJBMjU2R0NNIiwidGFnIjoiTjZIc2ItenlIXzZ4blFHQUhOdHByZyIsImFsZyI6IkEyNTZHQ01LVyIsIml2IjoiNjQ1Z0Rzc2lOYUZFb2pOWCJ9.rSWQSIKGgu_gAhLdG87fIpRYyI57KMQKYJpgQoXhPso.jvrOE0g2Q7A8h_Rj.uZsaA0VaVjL9HiciAilnNsos7Da-Fx5W3tr9sZO4qSPD-hB9t-lacy96lyeLiixs0nHXZ21iEwFYkqOllxpqW6eyJPb6lLDrnzg8Nx5AvizLagSDT35_3xBTu6EWf6x-lWBMKiBj8zo31wdjaGWMExcaQSPpwZxbJ3Z1sM4aZmHX7sjjnIT0V9kH1kAj0kD7uGuJ8KlMvrl011z68kJt-ilYG4FZn_Z5.CZzMDhEn1jqL45bYvbO3ig
```

##### 2\. Create the Content-Digest header

**Note:** When no HTTP payload is included (e.g., for a **GET** call), this header is not required.

When an HTTP payload is included, this header provides an SHA-256 digest over the HTTP payload.

To add the Content-Digest header, calculate an SHA-256 digest over the HTTP payload (in UTF-8 character encoding). While the specification allows adding more than one digest (e.g., both SHA-256 and SHA-512,) only the SHA-256 is needed in our case.

For complete information about how to add the Content-Digest header, refer to [Section 2, The Content-Digest Field, of RFC9530](https://www.rfc-editor.org/rfc/rfc9530.html#name-the-content-digest-field).

To review an example of adding a Content-Digest header, refer to [Section B.1. Server Returns Full Representation Data, of RFC9530](https://www.rfc-editor.org/rfc/rfc9530.html#name-server-returns-full-represe).

Consider the following payload:

```
{"hello": "world"}
```

In this case, the value of the Content-Digest header will be:

```
sha-256=:X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=:
```

##### 3\. Create the signature base

The signature base is a US-ASCII string containing standard HTTP message components covered by the signature. To create the signature base, the signer or verifier concatenates together entries for each component identifier in the signature's covered components (including their parameters).

For complete information, including the detailed algorithm to create the signature base, refer to [Section 2.5, Creating the Signature Base, of RFC9421](https://www.rfc-editor.org/rfc/rfc9421.html#name-creating-the-signature-base).

For additional information about creating individual pseudo headers that may be part of the signature base, refer to [Section 2.2, Derived Components, of RFC9421](https://www.rfc-editor.org/rfc/rfc9421.html#name-derived-components).

##### 4\. Create the signature header

The `Signature` header is created using the **Private Key** value generated by the Key Management API ([x-ebay-signature-key header](/develop/guides-v2/digital-signatures-for-apis/digital-signatures-for-apis#signature)) and the [signature base](/keystone/guides/develop/guides-v2/digital-signatures-for-apis/digital-signatures-for-apis#signature-base).

The value of the Signature header is created as described in [Section 3.1, Creating a Signature, of RFC9421](https://www.rfc-editor.org/rfc/rfc9421.html#name-creating-a-signature).

Depending on the cipher that is to be used, refer to the following specific sections of RFC9421 for complete information:

*   [RSASSA-PKCS1-v1\_5 using SHA-256](https://www.rfc-editor.org/rfc/rfc9421.html#name-rsassa-pkcs1-v1_5-using-sha)
*   [EdDSA using curve edwards25519](https://www.rfc-editor.org/rfc/rfc9421.html#name-eddsa-using-curve-edwards25)

To review examples illustrating how signature headers are created, refer to [Appendix B, Example Keys, of RFC9421](https://www.rfc-editor.org/rfc/rfc9421.html#name-example-keys).

**Important:** In order to further ensure the security of confidential client information, eBay does not store **Private Key** values in any system. If a developer loses their Private Key they must generate new keypairs using the Key Management API.

##### 5\. How to create the Signature-Input header

This header indicates which headers and pseudo-headers are included, as well as the order in which they are used when calculating the signature.

For complete information about creating the Signature-Input header refer to [Section 4, Including a Message Signature in a Message, of RFC9421](https://www.rfc-editor.org/rfc/rfc9421.html#name-including-a-message-signatu).

The value of the Signature-Input header is:

```
sig1=("content-digest" "x-ebay-signature-key" "@method" "@path" "@authority");created=1658440308
```

**Note:** The value assigned to the parameter **`created`** is the Unix timestamp when the signature is first created.

If no HTTP payload is included, the header would be:

```
sig1=("x-ebay-signature-key" "@method" "@path" "@authority");created=1658440308
```

## How to test the signature

The Sandbox environment can be used to test the signature mechanism. Call the [Key Management API](/api-docs/developer/key-management/overview.html) in the Sandbox to create the **Private Key**, **Public Key**, and **Public Key as JWE** for testing a signature in the Sandbox.

**Important:** In order to test digital signatures in the Sandbox environment, the domicile of the sandbox user MUST be set to be one of the EU countries or the UK (e.g., "DE" or "GB"). Only in this case will the digital signature be required and verified.  
  
For additional information about creating sandbox users, refer to [Create a test Sandbox user](https://edp.qa.ebay.com/api-docs/static/gs_create-a-test-sandbox-user.html).

**Note:** If preferred, open source sample code has been implemented that enables signatures to be verified using test keys. This code can be deployed using a Docker container. For complete information, refer to [README](https://github.com/eBay/digital-signature-verification-ebay-api#readme).

## Error codes

When issuing a call to any [in-scope API](/develop/guides-v2/digital-signatures-for-apis/digital-signatures-for-apis#apis-in-scope) in either the Production or Sandbox environment, if the request is improperly formatted or does not include all required headers, an error will be returned. Refer to the following table for information about these errors.

Code

Meaning

215000

Missing content-digest header

215001

Missing x-ebay-signature-key header

215002

Internal errors as fetching master key

215003

Internal errors as validating digital signaure

215101

Missing content digest

215102

Missing payload

215103

Parsing value of sha failed

215104

Base64 decoding sha failed

215105

Incorrect content digest of sha-256

215106

Incorrect content digest of sha-512

215107

Incorrect content digest of sha

215108

Content digest validation failed

215109

Missing parameters (internal error)

215110

Missing content-digest header

215111

Missing signature header

215112

Missing signature-input header

215113

Invalid timestamp in signature parameters

215114

The create time of signature parameters is not in right range

215115

Decrypting JWE failed

215116

Incorrect JWE format

215117

The appid in signature doesn't match app in token

215118

Missing pkey in JWE

215119

Decoding public key failed

215120

Signature validation failed

215121

Signature validation failed

215122  

Signature validation failed

## Digital Signature SDKs

To simplify the process of generating digital signature headers, eBay has developed the following SDKs. The SDKs also provides methods to validate digital signature headers.

*   [Digital Signature SDK (Java)](https://github.com/ebay/digital-signature-java-sdk)
*   [Digital Signature SDK (Node.js)](https://github.com/ebay/digital-signature-nodejs-sdk)
*   [Digital Signature SDK (PHP)](https://github.com/eBay/digital-signature-php-sdk)

Additional information about each of the SDKs is available in their respective README files.

## Frequently Asked Questions

The FAQs in this section address some common questions about Third Party Applications, API security, and Digital Signatures for APIs.

*   **My application fails to call eBay APIs. Can you help with it?**
    
    Contact [eBay Developer Support](https://developer.ebay.com/my/support/tickets) from your developer account.
    
*   **I am a seller who has developed my own application to use eBay APIs. My API calls are failing and I am blocked from performing refunds / cancellations / accepting returns. What should I do?**
    
    If your API fails with a **403** response code and a message indicating that a digital signature is required, refer to the [Digital Signatures](/develop/guides-v2/digital-signatures-for-apis/digital-signatures-for-apis) section of this document for complete information.
    
*   **I am blocked from performing refunds unless I add a digital signature. Can you help me bypass this?**
    
    No, this is not possible. You are required to add a layer of security to your API calls for refunds by passing digital signatures.
    
*   **I am passing the digital signature in API calls, but I am still not able to perform refunds. What is my next step?**
    
    Verify that you have completed all steps detailed on the [Digital Signatures](/develop/guides-v2/digital-signatures-for-apis/digital-signatures-for-apis) section. If your refunds API continues to fail, please open a ticket with [eBay Developer Support](https://developer.ebay.com/my/support/tickets) from your developer account.
    
*   **Why did eBay make this change?**
    
    As we continue to update our payment services, eBay is changing the way that we provide payment services for users in the EU and the UK. As a result, if your integration allows EU/UK eBay sellers to perform certain functions, like initiating a refund or providing certain information about payments processed by eBay, we require additional security measures to meet regulatory requirements.
    
*   **I don't see an answer to my question. Whom should I contact for API-related questions?**
    
    Open a ticket with [eBay Developer Support](https://developer.ebay.com/my/support/tickets) for any additional questions you may have.

