# Sell Communications Guide

**Guide Group:** Communications

---

## Overview

The eBay Sell Communication APIs include functionality that allows sellers to retrieve business-critical notifications from eBay, send discounted offers to prospective buyers that are watching their items, interact with buyers and potential customers and answer their inquiries, and programmatically manage their eBay InBox messages and folders.

## API use cases

[Subscribing to and retrieving eBay notifications](#retrievingeBaynotifications)  
[Sending discounted offers to interested buyers](#offersinterestedbuyers)  
[Managing buyer/seller communications](#buyersellercommunications)  
[Handling feedback](#handlingfeedback)

##### Subscribing to and retrieving eBay notifications

eBay has two API-enabled notification platforms. One is REST-based and requires integration with the [Notification API](/api-docs/sell/notification/resources/methods), where users can view a list of topics, set up an endpoint to receive notifications, and subscribe to those topics. The other is XML-based and will require the use of the [SetNotificationPreferences](/Devzone/XML/docs/Reference/eBay/SetNotificationPreferences.html) call to subscribe to notifications and set up an endpoint to receive these notifications.

**Subscribing to topics with the Notification API**

Integrating with eBay's Notification API allows third-party platforms to subscribe to and receive various types of notifications that eBay will send to the user's destination endpoint. General topics and seller-focused topics are summarized below. For the complete list of supported Sell notification events, see [Sell notification events](https://edp.qa.ebay.com/develop/api/sell/notification_events).

*   **Marketplace Account Deletion**: This notification is sent to a developer when an eBay user has requested that their personal data be deleted and their account closed. For more information, refer to the [eBay Marketplace Account Deletion](/marketplace-account-deletion) page.
*   **Authorization Revocation**: This notification is sent to a developer when a user revokes permissions for their eBay Developers Program application.
*   **Priority Campaign Strategy Budget Status**: This notification is sent to sellers when their Promoted Listings priority strategy ad campaign’s daily budget has been completely exhausted.
*   **Seller Standards Profile Metrics**: This notification is sent to sellers to inform them about changes or possible changes to their Seller Standards level in any of the seller performance metrics. See the [eBay Seller Standards program](https://www.sps.ebay.com/sd/sdrequirements) page in your eBay account for more information on these metrics and the thresholds.
*   **Seller Customer Service Metric Rating**: This notification is sent to sellers to inform them about critical changes to their **Item Not Received** or **Item Not as Described** customer service metrics performance. This includes proactive warnings when their service metrics are trending towards 'very high'.

The following flow will allow you to start receiving these notifications to your configured endpoint:

1.  Use [createDestination](/api-docs/sell/notification/resources/destination/methods/createDestination) to set up an endpoint for receiving notifications from eBay. This endpoint is required for handling incoming notification data securely.
2.  Use [getTopics](/api-docs/commerce/notification/resources/topic/methods/getTopics) to retrieve the full list of notification topics available. Pay attention to any OAuth scopes in the [authorizationScopes](/api-docs/sell/notification/resources/topic/methods/getTopics#response.topics.authorizationScopes) array. Some topics require special scopes; if you lack the necessary scope or scopes, you cannot subscribe to that topic. Also, note the [topicId](/api-docs/sell/notification/resources/subscription/methods/createSubscription#request.topicId) values, as these are required to subscribe to those topics.
3.  Use [createSubscription](/api-docs/sell/notification/resources/subscription/methods/createSubscription) to subscribe to a topic. Specify the [topicId](/api-docs/sell/notification/resources/subscription/methods/createSubscription#request.topicId) value for the topic, the endpoint that will receive these notifications, and set the [status](/api-docs/sell/notification/resources/subscription/methods/createSubscription#request.status) value to ENABLED.
4.  For every notification sent to the endpoint, extract the Base64-encoded X-EBAY-SIGNATURE header included in the eBay notification. Pass this value as a path parameter in the [getPublicKey](/api-docs/sell/notification/resources/public_key/methods/getPublicKey) method. The key value returned in the response is used to validate the eBay push notification message payload.
5.  Take whatever action is needed, if any, based on the notification.

Below are some of the other supporting methods of the Notification API:

*   The **destination** resource has the following additional methods available:
    *   Use [getDestination](/api-docs/sell/notification/resources/destination/methods/getDestination) to retrieve details about one specific destination endpoint.
    *   Use [getDestinations](/api-docs/sell/notification/resources/destination/methods/getDestinations) to retrieve all configured destination endpoints.
    *   Use [updateDestination](/api-docs/sell/notification/resources/destination/methods/updateDestination) to make updates to a destination endpoint.
    *   Use [deleteDestination](/api-docs/commerce/notification/resources/destination/methods/deleteDestination) to delete a disabled destination endpoint.
*   The **subscription** resource has the following additional methods available:
    *   Use [getSubscriptions](/api-docs/sell/notification/resources/subscription/methods/getSubscriptions) to obtain details about all notification topic subscriptions. Use [updateSubscription](/api-docs/sell/notification/resources/subscription/methods/updateSubscription) to modify an existing subscription.
    *   Use [enableSubscription](/api-docs/sell/notification/resources/subscription/methods/enableSubscription) to enable previously disabled topic subscriptions and use [disableSubscription](/api-docs/sell/notification/resources/subscription/methods/disableSubscription) to disable active topic subscriptions.
    *   Use [testSubscription](/api-docs/sell/notification/resources/subscription/methods/testSubscription) to send a test notification and verify the subscription's functionality.
    *   Use [deleteSubscription](/api-docs/sell/notification/resources/subscription/methods/deleteSubscription) to remove a subscription, stopping notification delivery for that topic.
    *   Use [createSubscriptionFilter](/api-docs/sell/notification/resources/subscription/methods/createSubscriptionFilter) to set up filters for topic subscriptions, ensuring notifications are aligned with specific criteria.
    *   Use [getSubscriptionFilter](/api-docs/sell/notification/resources/subscription/methods/getSubscriptionFilter) to access detailed information about a particular filter, such as its criteria, status, and creation date.
    *   Use [deleteSubscriptionFilter](/api-docs/sell/notification/resources/subscription/methods/deleteSubscriptionFilter) to deactivate and remove an active filter, enabling the creation of a new filter with revised criteria.
*   The [getConfig](/api-docs/commerce/notification/resources/config/methods/getConfig) method will retrieve the email associated with the application, and the [updateConfig](/api-docs/commerce/notification/resources/config/methods/updateConfig) method can update the email associated with the application.

**Subscribing to Platform Notification events**

Integrating with eBay's Trading API enables users to subscribe to and manage various platform notifications triggered by specific eBay events. Below are some of the key seller-focused event types and their purpose:

*   **FixedPriceTransaction**: this notification is sent each time a seller has a sale on a multiple-quantity, fixed price listing.
*   **ItemSold**: this notification is sent when a fixed price listing ends with a purchase or an auction listing ends with a winning bidder.
*   **BestOffer**: this notification is sent when a seller receives a Best Offer from a buyer.
*   **BidReceived**: this notification is sent each time a qualifying bid is received for an auction listing.
*   **BuyerCancelRequested**: this notification is sent when the buyer has requested that the order be cancelled.
*   **ReturnCreated**: this notification is sent when the buyer has created a return request for the item.
*   **ItemOutOfStock**: this notification is sent when the quantity of a fixed price listing has reached ‘0’. This notification will only be sent if the seller is opted into Out-of-Stock control.
*   **AskSellerQuestion**: this notification is sent if a buyer has asked the seller a question about an active listing.

For a complete list of available notification event types, refer to [NotificationEventTypeCodeType](/Devzone/XML/docs/Reference/eBay/types/NotificationEventTypeCodeType.html). Detailed information about these event types is available in the [Platform Notifications](/api-docs/static/platform-notifications-landing.html) guide.

The Trading API has the following calls to subscribe to and manage platform notifications:

*   Use the [SetNotificationPreferences](/Devzone/XML/docs/Reference/eBay/SetNotificationPreferences.html) call to subscribe to specific notification event types. Define the destination for these notifications, such as an email address or a URL endpoint.
*   Use the [GetNotificationPreferences](/Devzone/XML/docs/Reference/eBay/GetNotificationPreferences.html) call to retrieve your current notification preferences. This enables you to confirm the event types you are subscribed to and review your notification delivery settings. Proper configuration is essential for receiving the appropriate notifications.
*   Use the [GetNotificationsUsage](/Devzone/XML/docs/Reference/eBay/GetNotificationsUsage.html) call to access details about the notifications that have been sent to you. Reviewing this information allows you to evaluate whether your notification setup is working as intended and determine if any adjustments are needed.

##### Sending discounted offers to interested buyers

The Negotiation API is used to help sellers identify items eligible for special offers and engage potential buyers by sending them discounted offers. By targeting buyers who have shown interest in specific listings, sellers can enhance their chances of closing sales.

*   Use [findEligibleItems](/api-docs/sell/negotiation/resources/offer/methods/findEligibleItems) to pinpoint listings that are eligible for seller-initiated offers.
*   Use [sendOfferToInterestedBuyers](/api-docs/sell/negotiation/resources/offer/methods/sendOfferToInterestedBuyers) to present discounted offers to buyers who have expressed interest in these eligible listings.

##### Managing buyer/seller communications

**Managing communications using the Message API**

The [Message API](/api-docs/commerce/message/overview.html) allows users to send messages, retrieve conversations, and modify the status of conversations.

**Sending a message:**

The [sendMessage](/api-docs/commerce/message/resources/conversation/methods/sendMessage) method can be used to start a conversation with another user, or send a message in an existing conversation.

When sending a message through the [sendMessage](/api-docs/commerce/message/resources/conversation/methods/sendMessage) method, the [messageText](/api-docs/commerce/message/resources/conversation/methods/sendMessage#request.messageText) field is required to specify the content of the message. One of the following fields is also required to specify whether the message is being sent in an existing conversation or to start a new conversation:

*   [conversationId](/api-docs/commerce/message/resources/conversation/methods/sendMessage#request.conversationId)**:** The identifier of the existing conversation for which to send the message. This field is required if sending a message in an existing conversation. This ID can be retrieved using the [getConversations](/api-docs/commerce/message/resources/conversation/methods/getConversations) method.
*   [otherPartyUsername](/api-docs/commerce/message/resources/conversation/methods/sendMessage#request.otherPartyUsername)**:** The eBay username of the intended recipient of the message. This field is required if starting a new conversation with another eBay user.

Additionally, optional information can be attached to a message through the following containers:

*   [messageMedia](/api-docs/commerce/message/resources/conversation/methods/sendMessage#request.messageMedia): This container can be used to attach media files to a message. Up to five forms of media can be sent per message. The following types of media can be attached to a message:
    *   `IMAGE`
        
        **Note:** See [Managing images](/api-docs/sell/static/inventory/managing-image-media.html#image-requiremen) for details on image requirements.
        
    *   `PDF`
    *   `DOC`
    *   `TXT`
*   [reference](/api-docs/commerce/message/resources/conversation/methods/sendMessage#request.reference): This container can be used to specify that a message is referencing a specific eBay listing. The type of reference can be specified through the [referenceType](/api-docs/commerce/message/resources/conversation/methods/sendMessage#request.reference.referenceType) field, while the identifier of the reference can be specified through the [referenceID](/api-docs/commerce/message/resources/conversation/methods/sendMessage#request.reference.referenceId) field. Currently, only listings are supported, so the [referenceType](/api-docs/commerce/message/resources/conversation/methods/sendMessage#request.reference.referenceType) will always be `LISTING`, and the [referenceID](/api-docs/commerce/message/resources/conversation/methods/sendMessage#request.reference.referenceId) will be the item ID value of the listing.

A successful call sends the message based on the provided information, and returns details about the message such as its creation date and message ID value.

**Updating a conversation:**

The [updateConversation](/api-docs/commerce/message/resources/conversation/methods/updateConversation) and [bulkUpdateConversation](/api-docs/commerce/message/resources/conversation/methods/bulkUpdateConversation) methods can be used to update the status of one or more conversations. This includes the conversation status, such as if it is active, archived, or deleted, as well as the read status, such as if it has been marked as read or unread.

When updating a conversation through these methods, the following fields are required in the request payload to specify the conversation or conversations being updated:

*   [conversationId](/api-docs/commerce/message/resources/conversation/methods/updateConversation#request.conversationId)**:** The unique identifier of the conversation that is to be updated. The [getConversations](/api-docs/commerce/message/resources/conversation/methods/getConversations) method can be used to retrieve this value.
*   [conversationType](/api-docs/commerce/message/resources/conversation/methods/updateConversation#request.conversationType): The existing conversation type of the conversation being updated. This value cannot be updated through this method, but is required as part of the request payload. The following string values are supported:
    *   `FROM_MEMBERS`: This string value indicates that the conversation is with another eBay member, such as a buyer or seller.
    *   `FROM_EBAY`: This string value indicates that the conversation is with eBay itself.

Once the conversation ID and type are specified, the status of the specified conversation or conversations can then be updated. Using these methods, either the conversation status or read status of a conversation can be changed.

**Important:** Only the conversation status or read status of a conversation can be changed at a time per call.

The following fields can be used to update the status of a conversation:

*   [conversationStatus](/api-docs/commerce/message/resources/conversation/methods/updateConversation#request.conversationStatus)**:** The status for which to update the specified conversation. The following string values are supported:
    *   `ACTIVE`: This string value updates the conversation to `ACTIVE` status, meaning that it is a currently active conversation with an eBay member or eBay itself.
    *   `ARCHIVE`: This string value updates the conversation to `ARCHIVE` status, meaning that it will be archived, but not deleted. Archived conversations are stored and can be moved back to `ACTIVE` status using this method if needed.
    *   `DELETE`: This string value updates the conversation to `DELETE` status, meaning that it will be deleted. Deleted conversations cannot be recovered.
    *   `READ`: This string value updates the conversation to `READ` status, meaning that it will be shown as being read by the recipient. Note that there is a separate [read](/api-docs/commerce/message/resources/conversation/methods/updateConversation#request.read) boolean field in the [updateConversation](/api-docs/commerce/message/resources/conversation/methods/updateConversation#request.conversationStatus) method that takes care of this function.
    *   `UNREAD`: This string value updates the conversation to `UNREAD` status, meaning that it will be shown as unread by the recipient. Note that there is a separate [read](/api-docs/commerce/message/resources/conversation/methods/updateConversation#request.read) boolean field in the [updateConversation](/api-docs/commerce/message/resources/conversation/methods/updateConversation#request.conversationStatus) method that takes care of this function.

A successful call will update the status of the conversation or conversations to the specified status.

**Retrieving conversations:**

The [getConversation](/api-docs/commerce/message/resources/conversation/methods/getConversation) and [getConversations](/api-docs/commerce/message/resources/conversation/methods/getConversations) methods can be used to retrieve messages within one or more conversations.

The [getConversation](/api-docs/commerce/message/resources/conversation/methods/getConversation) method can be used to retrieve messages within a specified conversation. The conversation from which to retrieve messages is specified by its [conversation\_id](/api-docs/commerce/message/resources/conversation/methods/getConversation#uri.conversation_id) value. The type of the conversation must be also specified through the [conversation\_type](/api-docs/commerce/message/resources/conversation/methods/getConversation#uri.conversation_type) query parameter. If the call is successful, details about each message within the specified conversation that meet the specified filter criteria will be returned. This can include information such as the message text and ID, its read status, and the usernames of the sender and recipient.

Alternatively, the [getConversations](/api-docs/commerce/message/resources/conversation/methods/getConversations) method can be used to retrieve up to 10 conversations. The following query parameters are available to refine your conversation search:

*   [conversationStatus](/api-docs/commerce/message/resources/conversation/methods/getConversations#uri.conversation_status)**:** The status of the conversations being retrieved. Only conversations in the specified status will be retrieved. The following values are supported:
    *   `ACTIVE`: The conversation is currently active and has not been archived or deleted.
    *   `ARCHIVED`: The conversation has been archived, and can still be referenced or moved back to active status if needed.
    *   `DELETED`: The conversation has been deleted and can no longer be accessed.
    *   `READ`: The most recent message in the conversation has been read by the recipient.
    *   `UNREAD`: The most recent message in the conversation has not yet been read by the recipient.
*   [conversation\_type](/api-docs/commerce/message/resources/conversation/methods/getConversations#uri.conversation_type)**:** The type of conversations being retrieved. Only conversations of the specified type will be returned. The following values are supported:
    *   `FROM_EBAY`: The conversation is from eBay.
    *   `FROM_MEMBERS`: The conversation is with an eBay member.
*   [reference\_id](/api-docs/commerce/message/resources/conversation/methods/getConversations#uri.reference_id)**:** The unique identifier of the reference, such as the item ID value, associated with the conversation. Only conversations referencing the specified value will be returned.
*   [reference\_type](/api-docs/commerce/message/resources/conversation/methods/getConversations#uri.reference_type)**:** The type of reference, if any, associated with a conversation. For example, a value of `LISTING` specifies that the conversation is associated with a specific listing specified by the corresponding [reference\_id](/api-docs/commerce/message/resources/conversation/methods/getConversations#uri.reference_id) value. Currently, only `LISTING` is supported.
*   [start\_time](/api-docs/commerce/message/resources/conversation/methods/getConversations#uri.start_time) and [end\_time](/api-docs/commerce/message/resources/conversation/methods/getConversations#uri.end_time)**:** Only conversations sent between this time period will be returned.
*   [other\_party\_username](/api-docs/commerce/message/resources/conversation/methods/getConversations#uri.other_party_username)**:** The user name of an eBay user for which to retrieve conversations. Only conversations with this specified user will be returned.

The following pagination parameters are available to control the amount of data returned in the response payload:

*   [limit](/api-docs/commerce/message/resources/conversation/methods/getConversations#uri.limit)**:** Specifies the number of items from the result set returned on a single page.
*   [offset](/api-docs/commerce/message/resources/conversation/methods/getConversations#uri.offset)**:** Specifies the number of items to skip in the result set.

**Managing communications using the Trading API**

Facilitating effective communication between buyers and sellers is crucial for smooth transactions on eBay. This use case outlines the methods available to enable message exchanges between buyer and seller, and to retrieve and manage eBay InBox messages and folders.

The API calls for managing buyer/seller communications are discussed below:

*   Use [AddMemberMessageAAQToPartner](/Devzone/XML/docs/Reference/eBay/AddMemberMessageAAQToPartner.html) to enable a buyer and a seller in an order relationship to send messages to each other's My Messages Inboxes, fostering direct communication.
*   Use [AddMemberMessageRTQ](/Devzone/XML/docs/Reference/eBay/AddMemberMessageRTQ.html) to allow a seller to reply to a buyer's question about an active item listing, ensuring prompt responses to inquiries.
*   Use [AddMemberMessagesAAQToBidder](/Devzone/XML/docs/Reference/eBay/AddMemberMessagesAAQToBidder.html) to enable a seller to send up to 10 messages to bidders or users who have made offers via Best Offer, regarding an active item listing, facilitating communication with potential buyers.
*   Use [GetUserContactDetails](/Devzone/XML/docs/Reference/eBay/GetUserContactDetails.html) to return contact information for a specified user, provided there is a bidding relationship, as either a buyer or seller, between the caller and the user, aiding in direct communication when necessary.

The API calls for retrieving and managing eBay InBox messages and folders are discussed below:

*   Use [GetMyMessages](/Devzone/XML/docs/Reference/eBay/GetMyMessages.html) to retrieve information about the messages sent to a user, providing an overview of all communications received. This call has multiple filters available to control which messages are returned, including date range filters, message folder IDs, or message IDs.
*   Use [GetMemberMessages](/Devzone/XML/docs/Reference/eBay/GetMemberMessages.html) to retrieve a list of messages buyers have posted about your active item listings, allowing sellers to address buyer inquiries and concerns.
*   Use [GetMessagePreferences](/Devzone/XML/docs/Reference/eBay/GetMessagePreferences.html) to return a seller's Ask Seller a Question subjects, each in its own **Subject** field, enabling sellers to view their current message preferences.
*   Use [SetMessagePreferences](/Devzone/XML/docs/Reference/eBay/SetMessagePreferences.html) to enable a seller to add, remove, or modify custom Ask Seller a Question subjects, or to reset any custom subjects to their default values.
*   Use [ReviseMyMessages](/Devzone/XML/docs/Reference/eBay/ReviseMyMessages.html) to mark messages as Read, to flag or unflag messages, and/or to move all specified messages into a different InBox folder.
*   Use [ReviseMyMessagesFolders](/Devzone/XML/docs/Reference/eBay/ReviseMyMessagesFolders.html) to create a new folder, rename an existing folder, or delete an empty folder.
*   Use [DeleteMyMessages](/Devzone/XML/docs/Reference/eBay/DeleteMyMessages.html) to delete selected messages for a given user.

##### Handling feedback

Effective feedback management builds transparency and trust between buyers and sellers on eBay. This use case explains how to retrieve, leave, and respond to feedback to keep transactions smooth, resolve issues, and maintain a positive reputation. You can use the [Feedback API](#feedback-thru-feedback-api) REST API, or the [Trading API](#feedback-thru-trading-api) legacy API to handle feedback.

###### Using the Feedback API

The **Feedback API** manages transaction feedback through the methods contained in the following table.

Method

Description

[getItemsAwaitingFeedback](/api-docs/commerce/feedback/resources/awaiting_feedback/methods/getItemsAwaitingFeedback)

Retrieves a filtered list of line items for which feedback is pending from the user based on their role.

[getFeedback](/api-docs/commerce/feedback/resources/feedback/methods/getFeedback)

Retrieves a filtered list of line items for which feedback is available from the user based on their role. This method also retrieves detailed metrics for sellers.

[leaveFeedback](/api-docs/commerce/feedback/resources/feedback/methods/leaveFeedback)

Submits feedback associated with a line item for an order partner, generating a unique ID for tracking and reference purposes.

[respondToFeedback](/api-docs/commerce/feedback/resources/respond_to_feedback/methods/respondToFeedback)

Responds to feedback provided by the order partner on a specific line item in an order.

[getFeedbackRatingSummary](/api-docs/commerce/feedback/resources/feedback_rating_summary/methods/getFeedbackRatingSummary)

Returns a categorized summary of feedback metrics for an eBay seller, filtered by criteria.

The following scenarios describe key uses:

*   **Get items awaiting feedback**  
    
    To retrieve a list of items that still require feedback, whether acting as buyer or seller, call the [getItemsAwaitingFeedback](/api-docs/commerce/feedback/resources/awaiting_feedback/methods/getItemsAwaitingFeedback) method.
    
*   **Retrieve feedback**  
    
    Use the [getFeedback](/api-docs/commerce/feedback/resources/feedback/methods/getFeedback) method to gather feedback for a specified user, with filtering options based on transaction, item, comment type, [AI-filtered](#retrieve-ai-filtered-items) topics, or feedback containing photos. This method also retrieves detailed metrics for sellers. With this in mind, this method supports various feedback retrieval scenarios:
    
    *   All feedback for a user
    *   Feedback received by the user
    *   Feedback left by the user
    *   Specific feedback entries
    *   Feedback on a particular listing or line item
    *   Feedback of a specific type
    *   Feedback for the user acting as either a seller or a buyer
*   **Retrieve AI-filtered feedback**  
    
    You can specify a topic and have AI generate any associated applicable feedback items through the [getFeedback](/api-docs/commerce/feedback/resources/feedback/methods/getFeedback) method. Specify the topic and then only feedback for those listings are returned. For example, to have AI generate and return the last 30 days of positive feedback items associated with shipping as a seller, use: `filter=commentType:POSITIVE,topics:shipping,period:30,role:SELLER`  
    See the topics value in the filter query parameter for specific topics available.
    
*   **Leave feedback**  
    
    Buyers and sellers submit feedback for completed line items by calling the [leaveFeedback](/api-docs/commerce/feedback/resources/feedback/methods/leaveFeedback) method.
    
*   **Get feedback rating summary**  
    
    To return aggregated feedback metrics for review, call the [getFeedbackRatingSummary](/api-docs/commerce/feedback/resources/feedback_rating_summary/methods/getFeedbackRatingSummary) method. These ratings are only for sellers and can return metrics like on time delivery, shipping costs, and communication.
    
*   **Respond to feedback received**  
    
    Buyers and sellers can reply to feedback left by their order partner by calling the [respondToFeedback](/api-docs/commerce/feedback/resources/respond_to_feedback/methods/respondToFeedback) method.
    
*   **Using rating templates**  
    
    Rating templates, if used, define the feedback rating options available for transactions, covering key aspects like on-time delivery and overall experience, two examples of detailed seller ratings, and open comments. Detailed seller ratings are only applicable when buyers leave feedback for sellers. Each rating specifies the label presented to users, whether the field is required, the enabled status, and the format of accepted input, such as predefined choices, range, or free text. Call the [getItemsAwaitingFeedback](/api-docs/commerce/feedback/resources/awaiting_feedback/methods/getItemsAwaitingFeedback) method to return any available rating templates. See the following for examples of rating templates returned.
    
    _PREDEFINED yes/no rating type for ON\_TIME\_DELIVERY_
    
    {
      "ratingKey": "ON\_TIME\_DELIVERY",
      "ratingLabel": "Did this item arrive on time?",
      "required": false,
      "ratingValueType": "PREDEFINED",
      "enabled": true,
      "acceptableValues": \[
        {
          "value": "2",
          "valueLabel": "Yes",
          "enabled": true
        },
        {
          "value": "3",
          "valueLabel": "No",
          "enabled": true
        }
      \]
    }
    
    _PREDEFINED with positive, neutral, and negative feedback for OVERALL\_EXPERIENCE_
    
    {
      "ratingKey": "OVERALL\_EXPERIENCE",
      "ratingLabel": "How was your experience?",
      "required": true,
      "ratingValueType": "PREDEFINED",
      "enabled": true,
      "acceptableValues": \[
        {
          "value": "POSITIVE",
          "valueLabel": "Positive",
          "enabled": true
        },
        {
          "value": "NEUTRAL",
          "valueLabel": "Neutral",
          "enabled": true
        },
        {
          "value": "NEGATIVE",
          "valueLabel": "Negative",
          "enabled": true
        }
      \]
    }
    
    _Freetext rating type for OVERALL\_EXPERIENCE\_COMMENT_
    
    {
      "ratingKey": "OVERALL\_EXPERIENCE\_COMMENT",
      "ratingLabel": "What else would you add?",
      "maximumCharactersAllowed": 500,
      "required": true,
      "ratingValueType": "FREETEXT",
      "enabled": true
    }
    
    _RANGE rating type that takes values between 1 and 5 for DSR\_ITEM\_AS\_DESCRIBED_
    
    {
      "ratingKey": "DSR\_ITEM\_AS\_DESCRIBED",
      "ratingLabel": "Item description",
      "required": false,
      "ratingValueType": "RANGE",
      "enabled": true,
      "acceptableValues": \[
        {
          "value": "1",
          "valueLabel": "Very inaccurate",
          "enabled": true
        },
        {
          "value": "2",
          "valueLabel": "Inaccurate",
          "enabled": true
        },
        {
          "value": "3",
          "valueLabel": "Neither inaccurate nor accurate",
          "enabled": true
        },
        {
          "value": "4",
          "valueLabel": "Accurate",
          "enabled": true
        },
        {
          "value": "5",
          "valueLabel": "Very accurate",
          "enabled": true
        }
      \]
    }
    

###### Using the Trading API to manage feedback

The following API calls manage transaction feedback through the **Trading API**:

*   A seller can use [GetFeedback](/Devzone/XML/docs/Reference/eBay/GetFeedback.html) to retrieve Feedback entries they received from a buyer or Feedback entries they left for a buyer. This call also retrieves detailed Feedback ratings and metrics for the seller.
*   The [GetItemsAwaitingFeedback](/Devzone/XML/docs/Reference/eBay/GetItemsAwaitingFeedback.html) call will return all sales transactions where the seller has yet to leave Feedback for the buyer.
*   A seller uses [LeaveFeedback](/Devzone/XML/docs/Reference/eBay/LeaveFeedback.html) to provide Feedback to the buyer for a specific sales transaction.
*   Use [RespondToFeedback](/Devzone/XML/docs/Reference/eBay/RespondToFeedback.html) to address feedback or include follow-up remarks. This allows sellers to clarify any issues or express appreciation, further enhancing buyer-seller relationships.

## Code samples

## Error handling

*   If [createDestination](/api-docs/sell/notification/resources/destination/methods/createDestination) or [updateDestination](/api-docs/sell/notification/resources/destination/methods/updateDestination) fails with an invalid endpoint error, check to make sure your endpoint uses the HTTPS protocol, and does not contain an internal IP address or _localhost_ in its path.
*   If [createDestination](/api-docs/sell/notification/resources/destination/methods/createDestination) or [updateDestination](/api-docs/sell/notification/resources/destination/methods/updateDestination) fails with an invalid verification error, check to make sure the token is 32 to 80 characters in length, and only contains alphanumeric characters, underscores (\_), and hyphens (-).
*   If [createSubscription](/api-docs/sell/notification/resources/subscription/methods/createSubscription) fails due to an invalid [topicId](/api-docs/sell/notification/resources/subscription/methods/createSubscription#request.topicId), use [getTopics](/api-docs/commerce/notification/resources/topic/methods/getTopics) to retrieve the correct ID, and ensure the destination endpoint is correctly configured and enabled to receive notifications.
*   If you encounter an error retrieving the public key, confirm the Base64-encoded X-EBAY-SIGNATURE header is correctly extracted and passed as a parameter, and validate the signature against the payload to ensure data integrity.

## Best practices

*   Regularly use [getSubscriptions](/api-docs/sell/notification/resources/subscription/methods/getSubscriptions) to audit and manage your active subscriptions, ensuring they align with your current notification needs.
*   Use [createSubscriptionFilter](/api-docs/sell/notification/resources/subscription/methods/createSubscriptionFilter) to refine notifications based on specific criteria, reducing unnecessary data processing.
*   Periodically review all configured endpoints with [getDestinations](/api-docs/sell/notification/resources/destination/methods/getDestinations) to ensure they are up-to-date and secure.
*   Test endpoints using [testSubscription](/api-docs/sell/notification/resources/subscription/methods/testSubscription) to confirm they are correctly receiving notifications.
*   Always validate incoming notification payloads to ensure they are genuine and untampered with by using either the [getPublicKey](https://developer.ebay.com/api-docs/sell/notification/resources/public_key/methods/getPublicKey) method or one of the following eBay Event Notification SDKs:
    *   [Java SDK](https://github.com/eBay/event-notification-java-sdk)
    *   [.NET SDK](https://github.com/eBay/eBay-Notification-SDK-Dot-Net-Core)
    *   [Node.js SDK](https://github.com/eBay/event-notification-nodejs-sdk)
    *   [PHP SDK](https://github.com/eBay/event-notification-php-sdk)
    *   [Go SDK](https://github.com/eBay/event-notification-golang-sdk)

## Code Samples

### Retrieving eligible eBay listings for seller-initiated offers on eBay US Marketplace

**Label:** Retrieving eligible eBay listings for seller-initiated offers on eBay US Marketplace

#### Bash Sample

```bash
curl -X GET "https://api.ebay.com/sell/negotiation/v1/find_eligible_items"
-H "Authorization:Bearer OAUTH_token"
-H X-EBAY-C-MARKETPLACE-ID:EBAY_US
```

### Retrieve all notification topics

**Label:** Retrieve all notification topics

#### Bash Sample

```bash
curl -X GET "https://api.ebay.com/commerce/notification/v1/topic"
-H "Authorization:Bearer OAUTH_token"
```

## Related Topics

- [Notification API](/api-docs/sell/notification/resources/methods)
- [Negotiation API](/api-docs/sell/negotiation/overview.html)
- [Trading Notification APIs](/api-docs/static/platform-notifications-landing.html)
- [Trading Feedback APIs](/Devzone/XML/docs/Reference/eBay/CommunicationIndex.html#itemfeedback)
- [Trading Messaging APIs](/Devzone/XML/docs/Reference/eBay/CommunicationIndex.html#eBaymessaging)
- [eBay Seller Standards program](https://www.sps.ebay.com/sd/sdrequirements)
- [More Guides](/develop/guides)

