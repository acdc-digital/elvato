# Marketplace User Account Deletion

**Guide Group:** Marketplace User Account Deletion

---

## Overview

eBay provides their users a way to request that their personal data be deleted from eBay's systems, as well as deleted from the systems of all eBay partners who store/display their personal data, including third-party developers integrated with eBay APIs via the eBay Developers Program.

To assist third-party developers in deleting customer data, eBay has created a push notification system that will notify all eBay Developers Program applications when an eBay user has requested that their personal data be deleted and their account closed. This document will discuss what third-party developers have to do to subscribe to, respond to, and validate these eBay marketplace account deletion/closure notifications.

Use this guide to set up or opt out of eBay Marketplace Account Deletion/Closure Notifications through the following procedures:

*   [Preparing to receive notifications](#preparing)
*   [Subscribing to notifications](#subscribing)
*   [Opting out of notifications](#opting-out)
*   [Receiving and acknowledging notifications](#receiving)
*   [Verifying notification validity](#verifying)

In addition, it includes the [AsyncAPI specification](/develop/guides-v2/marketplace-user-account-deletion/marketplace-user-account-deletion#asyncapi-specification) and [Frequently asked questions](/develop/guides-v2/marketplace-user-account-deletion/marketplace-user-account-deletion#faqs).

**Note:** All existing and new third-party developers integrated with eBay APIs via the eBay Developers Program are _required_ to: **1)** subscribe to eBay marketplace account deletion/closure notifications; or **2)** follow the process to opt out of subscribing to these notifications if they do not store any eBay data for various reasons. If this is the case, the developer may apply for exemption from receiving eBay marketplace account deletion/closure notifications. For more information on opting out, see the [Opting Out of eBay Marketplace Account Deletion/Closure Notifications](#optingOut) section in this document. To receive notifications when an eBay user requests deletion of their personal data and closes their account, refer to the [Business Use Cases](/api-docs/commerce/notification/overview.html#use) for the [Notification API](/api-docs/commerce/notification/resources/methods) and the notification topic **Marketplace Account Deletion**.  
  
All developers should either subscribe to or opt out of eBay marketplace account deletion/closure notifications. **Failure to comply with this requirement will result in termination of your access to the Developer Tools, and/or reduced access to all or some APIs.** New third-party developers coming to the platform must subscribe to or opt out of eBay marketplace account deletion/closure notifications before they make their first production API call. Once the new developer's application is subscribed to eBay marketplace account deletion/closure notifications, or they have successfully opted out of the notifications, the keyset/App ID is activated and they can begin making API calls.

##### Preparing to receive eBay marketplace account deletion/closure notifications

Before subscribing to and receiving eBay marketplace account deletion/closure notifications, developers have to prepare their endpoint URLs to receive a challenge code from eBay, and then use this challenge code to validate the legitimacy of the endpoint URL. eBay needs to verify that the developer owns/has access to the provided endpoint URL, and that the developer will be receiving and processing all of the eBay marketplace account deletion/closure notifications. This validation process is highlighted below.

1.  Immediately after the developer provides and saves an endpoint URL and a verification token when subscribing to eBay marketplace account deletion/closure notifications (see next section), eBay will send a challenge code to that URL in the form of a GET call. This GET call will use this format: `GET https://<callback_URL>**?challenge_code=123**`. The **challenge\_code** query parameter value will be unique for the request. Please note that the provided endpoint URL should use the 'https' protocol, and it should not contain an internal IP address or 'localhost' in its path.
    
2.  Upon receiving this unique challenge code, the endpoint must be set up to hash together the challenge code, verification token, and endpoint URL, and reply back to eBay with a `200 OK` and the hashed value through a **challengeResponse** field in JSON format (see example below). The **content-type** header for this response must be set to '**application/json**'. The three parameters must be hashed in the following order or the verification will fail: challengeCode + verificationToken + endpoint.
    
    {
        "challengeResponse":"\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*8ca38f"
    }
    
    eBay will need to verify the hexadecimal string before the endpoint can be officially subscribed to notifications. Code snippets in Node.js, Java, Python, C#, and PHP for computing the **challengeResponse** are provided below. Keep in mind that your **endpoint** and **verificationToken** are values specific to your destination, but the **challengeCode** variable will come from eBay in the form of the **challenge\_code** query parameter is randomly generated, and unique to the request. The verification token has to be between 32 and 80 characters, and allowed characters include alphanumeric characters, underscore (\_), and hyphen (-). No other characters are allowed.
    
    **Node.js**
    
    const hash = createHash('sha256');
    hash.update(challengeCode);
    hash.update(verificationToken);
    hash.update(endpoint);
    const responseHash = hash.digest('hex');
    console.log(new Buffer.from(responseHash).toString());
    
    **Java**
    
    MessageDigest digest = MessageDigest.getInstance("SHA-256");
    digest.update(challengeCode.getBytes(StandardCharsets.UTF\_8));
    digest.update(verificationToken.getBytes(StandardCharsets.UTF\_8));
    byte\[\] bytes = digest.digest(endpoint.getBytes(StandardCharsets.UTF\_8));
    System.out.println(org.apache.commons.codec.binary.Hex.encodeHexString(bytes));
    
    **Python**
    
    m = hashlib.sha256(challengeCode+verificationToken+endpoint);
    print(m.hexdigest());
    
    **C#**
    
    IncrementalHash sha256 = IncrementalHash.CreateHash(HashAlgorithmName.SHA256); 
    sha256.AppendData(Encoding.UTF8.GetBytes(challengeCode)); 
    sha256.AppendData(Encoding.UTF8.GetBytes(verificationToken)); 
    sha256.AppendData(Encoding.UTF8.GetBytes(endpoint)); 
    byte\[\] bytes = sha256.GetHashAndReset();
    Console.WriteLine(BitConverter.ToString(bytes).Replace("-", string.Empty).ToLower());
    
    **PHP**
    
    $hash = hash\_init('sha256');
    
    hash\_update($hash, $challengeCode);
    hash\_update($hash, $verificationToken);
    hash\_update($hash, $endpoint);
    
    $responseHash = hash\_final($hash);
    echo $responseHash;
    
    **Important!** We strongly advise that implementations use a JSON library to create their response body. When implementations create challenge responses by writing out a string value instead, a byte order mark (BOM) is often prepended to the response body. Since a BOM is considered invalid JSON, the receiving service issues a parse exception and, as a result, the attempt to subscribe to marketplace account deletion notifications fails.
    
    For additional information, refer to:
    
    *   [Section 8.1, Character Encoding, of RFC8259](https://datatracker.ietf.org/doc/html/rfc8259#section-8.1)
    *   [Byte Order Mark (BOM) FAQ on the Unicode Web Site](https://www.unicode.org/faq/utf_bom.html#bom1)
    
3.  Once you have tested your code and endpoint and feel confident that the endpoint is ready to process and reply back to eBay's challenge code, you can proceed to subscribing to the eBay marketplace account deletion/closure notifications, and this process is covered in the next section. Users will provide Alert email, endpoint URL, and a verification token in the **Alerts and Notifications** page of the Developer Portal.
    

##### Subscribing to eBay marketplace account deletion/closure notifications

All active eBay Developers Program applications are required to subscribe to eBay marketplace account deletion/closure notifications. Developers must follow the steps below to subscribe to these notifications for each of their applications associated with their developers' accounts:

1.  [Sign into](/signin) your developer account.
2.  Go to the [Application Keys](/my/keys) page.
3.  Click the [Notifications](/my/push) link adjacent to your App ID. You will be taken to the **Alerts and Notifications** page shown below:
    
    ![Notification Page image](/cms/img/account-deletion/account-deletion-notifications.png)
    
4.  On the **Alerts and Notifications** page, select the **Marketplace Account Deletion** radio button under the **Event Notification Delivery Method** section.
5.  First, you will input an email address. The email address is required but will only be used to alert the developers when the specified Notification Endpoint URL is not reachable/not acknowledging notifications properly. Once you have input an email address, click the adjacent **Save** button.
6.  Then, you will set the **Notification Endpoint** URL for receiving notifications. This URL must be an 'https' address and it must be a URL owned by and/or accessible to the developer. This endpoint should also be prepared to receive and reply back to the challenge code that eBay will immediately send to the endpoint to validate that endpoint. See the previous section for information on preparing your endpoint. Once you have set the **Notification Endpoint**, proceed to the next step.
7.  In the **Verification token** field, provide a 32 to 80-character verification token. Allowed characters include alphanumeric characters, underscore (\_),  and hyphen (-).  No other characters are allowed. This **Verification token** value and the **Notification Endpoint** URL will be used as a part of a multiple-step process that eBay will use to verify that the developer owns/has access to the provided **Notification Endpoint** URL, and that the developer will be receiving and processing all of the marketplace account deletion/closure notifications, and not just selecting a URL that will only pass back a success status code when a notification is sent. See the previous section for information on preparing your endpoint, and the validation process.
8.  Once you have set your **Notification Endpoint** URL and **Verification token** value, click the adjacent **Save** button. As long as the URL and **Verification token** value are valid and accepted by eBay, clicking the **Save** button will also trigger the validation process, with the first step being eBay sending a challenge code to the endpoint. If your endpoint successfully responds to eBay's challenge code, your **Notification Endpoint** URL and **Verification token** value will be successfully saved. If an issue arises, you may have to troubleshoot your endpoint and how it is receiving and replying back to eBay's challenge code. See the previous section for more information on the validation process. 

After you have successfully subscribed to eBay marketplace account deletion/closure notifications, you can send a test notification to this URL by clicking the **Send Test Notification** button. Once the Endpoint URL has recieved the test notification successfully, your setup is complete. Your application should start receiving eBay marketplace account deletion/closure notifications from eBay immediately.

**Note:** Make sure your Endpoint URL supports GET and POST methods before you send a test notification.

##### Opting out of eBay marketplace account deletion/closure notifications

For any developer application that is not persisting any eBay data, there is an option to opt out of eBay marketplace account deletion/closure notifications. However, developers should be aware that **failure to provide correct information may result in penalties or having their account disabled**.

The process to opt out of eBay marketplace account deletion/closure notifications is described below:

1.  On the **Marketplace Account Deletion** page, slide the **Not persisting eBay data** toggle button to On. After doing this, the following pop-up box will load:
    
    ![Exemption Note image](/cms/img/account-deletion/exemption-note.png)
    
2.  Click the **Confirm** button in the pop-up box and the following screen will load:
    
    ![Notification Exemption Page image](/cms/img/account-deletion/account-deletion-notifications-exemption.png)
    
3.  Select the **Exemption reason** radio button that applies to you. You can also include a note in the **Additional information** text box, if you desire.
4.  Click the **Submit**  button to complete the exemption request. The following screen will load upon success:
    
    ![Exemption Enabled image](/cms/img/account-deletion/exemption-enabled.png)
    

For any developers who were already receiving eBay marketplace account deletion/closure notifications, the notifications will stop being delivered to the configured endpoint. The email, endpoint, and the verification token data will be saved in their account in case a developer wants to enable eBay marketplace account deletion/closure notifications at a later date.

To disable an eBay marketplace account deletion/closure notifications exemption, a developer would slide the **Not persisting eBay data** toggle button to Off. New users (have never subscribed to marketplace account deletion notifications) will be expected to prepare their endpoint to start receiving notifications and to provide their endpoint URL and verification token in the corresponding fields. For users who have already subscribed to eBay marketplace account deletion/closure notifications previously, these notifications will start being sent to their endpoint once again if they disabled the exemption.

##### Receiving and Acknowledging eBay marketplace account deletion/closure notifications

Once your application is enrolled for eBay marketplace account deletion/closure notifications, your callback URL will start receiving HTTP POST, JSON-based notifications for each eBay user that has requested that their personal data be deleted. A sample notification response is shown below:

```
{
  "metadata": {
    "topic": "MARKETPLACE_ACCOUNT_DELETION",
    "schemaVersion": "1.0",
    "deprecated": false
  },
  "notification": {
    "notificationId": "********-****-****-****-****-****-****-******bd9a6d",
    "eventDate": "2025-09-19T20:43:59.462Z",
    "publishDate": "2025-09-19T20:43:59.679Z",
    "publishAttemptCount": 1,
    "data": {
      "username": "******ser",
      "userId": "********SJC",
      "eiasToken": "**************************************************+seQ=="
    }
  }
}
```

The fields in the notification response payload are briefly described in the table below:

Field

Description

metadata.**topic**

The topic of the notification.

metadata.**schemaVersion**

The schema version for the topic.

metadata.**deprecated**

If `true`, this boolean indicates that the **schemaVersion** of the **topic** is deprecated.

notification.**notificationId**

The unique identifier of the notification.

notification.**eventDate**

A timestamp indicating when the eBay user made the data deletion request.

notification.**publishDate**

A timestamp indicating when the current notification was sent.

notification.**publishAttemptCount**

An integer indicating how many times the notification has been sent to this specific callback URL.

notification.data.**username**

This string is the publicly known eBay user ID.  

**Note:** Select developers will not receive username data for U.S. users through this field. Instead, an immutable user ID will be returned in its place. For more information, please refer to [Data Handling Compliance](/api-docs/static/data-handling-update.html).

notification.data.**userId**

This string is the immutable identifier of the eBay user.

notification.data.**eiasToken**

This string is the eBay user's EIAS token; another identifier used for an eBay user.

The callback URL should immediately acknowledge each eBay marketplace account deletion/closure notification with an HTTP status code indicating a successful response. `200 OK`, `201 Created`, `202 Accepted`, and `204 No Content` are all acceptable. For any callback URL that doesn't respond to an eBay marketplace account deletion/closure notification, eBay will resend the notification to the callback URL until it is acknowledged. After a 24-hour period of multiple, unacknowledged notifications from a callback URL, the callback URL is marked down, and eBay will send out an alert email to the developer about the callback URL being non-responsive. Upon receiving the email, the developer will have up to 30 days to resolve the problem with their callback URL acknowledging eBay marketplace account deletion/closure notifications. If the problem is not resolved within 30 days, the developer will be marked as non-compliant.

**Note:** Once developers begin receiving and acknowledging the receipt of eBay marketplace account deletion/closure notifications, they need to take the appropriate action to delete the user data, or in case developers plan to retain data, it is only retained to meet specific and demonstrable legal requirements (e.g. tax, collections, AML regulations). Deletion should be done in a manner such that even the highest system privilege cannot reverse the deletion.

##### Verifying the validity of an eBay marketplace account deletion/closure notification

A callback URL should immediately acknowledge each eBay marketplace account deletion/closure notification with a `200 OK`, `201 Created`, `202 Accepted`, or `204 No Content` HTTP status code. After the acknowledgement of the eBay marketplace account deletion/closure notification, the developer should verify that the eBay marketplace account deletion/closure notification is actually coming from eBay. eBay has created the following SDKs to verify the validity of each notification.

*   [Event Notification SDK (Java)](https://github.com/eBay/event-notification-sdk)
*   [Event Notification SDK (Node.js)](https://github.com/eBay/event-notification-nodejs-sdk)
*   [Event Notification SDK (.NET)](https://github.com/eBay/eBay-Notification-SDK-Dot-Net-Core)
*   [Event Notification SDK (PHP)](https://github.com/eBay/event-notification-php-sdk)
*   [Event Notification SDK (Go)](https://github.com/eBay/event-notification-golang-sdk)

These SDKs do the following:

1.  Decode the signature header from the notification to retrieve the keyId
2.  Make a cache-enabled call to the Notification API to retrieve the public key
3.  Verify the signature against the notification payload
4.  If signature is verified, the payload is delegated to the processing logic for the topic and a Http status of `200 OK` is returned, or If signature verification fails, a HTTP status 412 - Precondition Failed is returned.

More information can be found in the ReadMe files of the SDKs.

There is also a manual (non-SDK) process to verify that an eBay marketplace account deletion/closure notification is coming from eBay. The process is outline below:

1.  Use a Base64 decode function to decode the value retuned in the **x-ebay-signature** response header for the eBay marketplace account deletion/closure notification.
2.  This decoded value will be passed into the end of the [getPublicKey](/api-docs/commerce/notification/resources/public_key/methods/getPublicKey) URI of the [Notification API](/api-docs/commerce/notification/resources/methods).
3.  Go to the [Notification API Overview](/api-docs/commerce/notification/overview.html#use) page to see the rest of the verification process using that [getPublicKey](/api-docs/commerce/notification/resources/public_key/methods/getPublicKey) method.

**Important!** The public key value retrieved from the [getPublicKey](/api-docs/commerce/notification/resources/public_key/methods/getPublicKey) method should be cached for a temporary — but reasonable — amount of time (e.g., one-hour is recommended.) This key should not be requested for every notification since doing so can result in exceeding [API call limits](/develop/apis/api-call-limits) if a large number of notification requests is received.

## AsyncAPI specification

[AsyncAPI Contract](/cms/files/asyncapi/marketplace_account_deletion.yaml)

```

asyncapi: 2.0.0
info:
title: eBay Notifications
version: 1.0.0
description: This contract defines eBay notification for event subsciptions
channels:
MARKETPLACE_ACCOUNT_DELETION:
subscribe:
message:
    $ref: '#/components/messages/message'
bindings:
    http:
    type: request
    method: POST
    headers:
        type: object
        properties:
        Content-Type:
            type: string
            enum: ['application/json']
components:
messages:
message:
headers:
    type: object
    properties:
    X-EBAY-SIGNATURE:
        description: ECC message signature
        type: string
payload:
    type: object
    properties:
    metadata:
        $ref: '#/components/schemas/MetaData'
    notification:
        $ref: '#/components/schemas/Notification'
schemas:
MetaData:
type: object
properties:
    topic:
    type: string
    description: 'Topic subscribed to.'
    schemaVersion:
    type: string
    description: 'The schema for this topic.'
    deprecated:
    type: boolean
    description: 'If this is a deprecated schema or topic.'
    default: 'false'

Notification:
type: object
properties:
    notificationId:
    type: string
    description: 'The notification Id.'
    eventDate:
    type: string
    description: 'The event date associated with this notification in UTC.'
    publishDate:
    type: string
    description: 'The message publish date in UTC.'
    publishAttemptCount:
    type: integer
    description: 'The number of attempts made to publish this message.'
    data:
    $ref: '#/components/schemas/MarketplaceAccountDeletionData'
MarketplaceAccountDeletionData:
type: object
description: 'The Account Deletion payload.'
properties:
    username:
    type: string
    description: 'The username for the user. Effective September 26, 2025, select developers will no longer receive username data for U.S. users through this field. Instead, an immutable user ID will be returned in its place.'
    userId:
    type: string
    description: 'The immutable public userId for the user'
    eiasToken:
    type: string
    description: 'The legacy eiasToken specific to the user'
```

## FAQs

##### Frequently asked questions about eBay Marketplace Account Deletion/Closure Notifications

The FAQs in this section address some general questions about eBay marketplace account deletion/closure notifications.

Are developers required to subscribe to eBay marketplace account deletion/closure notifications?

Yes. Every eBay Developers Program application that is making API calls that use/store eBay user data must be subscribed to eBay marketplace account deletion/closure notifications. It is the responsibility of each developer to remove all user data associated with the eBay user specified in the eBay marketplace account deletion/closure notification.

How do I subscribe to eBay marketplace account deletion/closure notifications?

Go to the [Alerts and Notifications](/my/push?env=production&index=0) page inside of your developer account. See the [Subscribing to eBay Marketplace Account Deletion/Closure Notifications](#subscribe) section in this document for more information.

How do I acknowledge eBay marketplace account deletion/closure notifications?

Set up a callback listener URL that will immediately reply to the HTTP POST notification with an HTTP status code indicating success. The following HTTP status codes are acceptable: `200 OK`, `201 Created`, `202 Accepted`, or `204 No Content`. The callback URL must use the 'https' protocol.

Why am I getting the same eBay marketplace account deletion/closure notification more than once?

eBay will resend any eBay marketplace account deletion/closure notification that is not acknowledged by the callback URL. If you are receiving eBay marketplace account deletion/closure notifications more than once, it is possible that your callback URL is not properly acknowledging the notifications.

I received an email that my callback URL was marked down by eBay. What do I do now?

Troubleshoot your callback URL to see why it is not properly acknowledging eBay marketplace account deletion/closure notifications. You can use the **Send Test Notification** tool on the **Alerts and Notifications** page to perform a test. Once you have discovered the issue, let eBay know and eBay will mark your callback URL as up, and will restart eBay marketplace account deletion/closure notifications being sent to that URL.

How do I verify that the eBay marketplace account deletion/closure notifications is actually coming from eBay?

eBay has created the following SDKs to verify the validity of each notification.

*   [Event Notification SDK (Java)](https://github.com/eBay/event-notification-sdk)
*   [Event Notification SDK (Node.js)](https://github.com/eBay/event-notification-nodejs-sdk)
*   [Event Notification SDK (.NET)](https://github.com/eBay/eBay-Notification-SDK-Dot-Net-Core)
*   [Event Notification SDK (PHP)](https://github.com/eBay/event-notification-php-sdk)
*   [Event Notification SDK (Go)](https://github.com/eBay/event-notification-golang-sdk)

Please see the [Verifying the validity of an eBay Marketplace Account Deletion/Closure Notification](#verify) section in this document for more information on how to do this.

How many eBay marketplace account deletion/closure notifications can I expect to receive on a daily basis?

Although it can definitely vary from day to day, developers should be prepared to acknowledge a volume that is event-driven and highly variable:

*   Many days: zero notifications
*   Occasional days: small bursts (for example, when eBay closes multiple accounts or you’ve had recent high order volume). For example, you should be prepared to acknowledge up to 1500 notifications on any given day (event-driven and highly variable)

Overall volume scales with your number of unique eBay buyers and messages, the regions you operate in, and privacy regulations.

