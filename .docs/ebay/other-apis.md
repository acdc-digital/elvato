# Other APIs Guide

**Guide Group:** Other APIs

---

## Overview

The Other APIs allow sellers to enhance their listings and comply with eBay's policies, improving the experience for both sellers and buyers. They offer tools for translating item details globally, ensuring listings meet standards, optimizing advertising campaigns, and securely accessing user profiles. Additionally, there are APIs to manage offers, track buyer interest, report intellectual property infringements, and support international logistics for Greater China.

## API Use Case

[Translating listing titles and descriptions](#translatinglistingtitles)  

*   [Supported languages](#supported-languages)

[Checking listings for policy compliance](#checkinglistingspolicy)  
[Managing Best Offers, Second Chance Offers, and Sales Leads](#managingbestoffers)  
[Checking for intellectual property rights infringement](#checkingforintellectualpropertyrights)  
[Managing shipping and fulfillment in Greater China](#mangingshippingandfulfillment)  
[Retrieving account and business information for a seller](#retrievingaccountandbusinessinformation)

##### Translating listing titles and descriptions

The [Translation API](/api-docs/sell/translation/static/overview.html) provides fast and accurate translations to enhance marketplace visibility and facilitate global listing presentations. See this [table](/develop/guides-v2/other-apis/other-apis-guide#supported-languages) for the full list of supported translations.

Below is the process to follow to translate item title or description from one language to another using the [Translation API](/api-docs/sell/translation/static/overview.html)

![Banner image](/cms/img/sellotherguide/translate-titles-descriptions.png)

1.  Set the [translationContext](/api-docs/sell/translation/resources/language/methods/translate#request.translationContext) field to either _ITEM\_TITLE_ or _ITEM\_DESCRIPTION_, depending on the entity you want to translate.
2.  Specify the language of the input text in the [from](/api-docs/sell/translation/resources/language/methods/translate#request.from) field and the target language in the [to](/api-docs/sell/translation/resources/language/methods/translate#request.to) field, ensuring both are supported language pairings as defined in the table below.
3.  Input the text to be translated into the [text](/api-docs/sell/translation/resources/language/methods/translate#request.text) field, adhering to the character limits based on the [translationContext](/api-docs/sell/translation/resources/language/methods/translate#request.translationContext) value.
4.  Retrieve the translated text from the [translations.translatedText](/api-docs/sell/translation/resources/language/methods/translate#response.translations.translatedText) field in the response, which reflects the translation into the language specified in the [to](/api-docs/sell/translation/resources/language/methods/translate#request.to) field.

###### Supported languages

Currently supported translations are listed in the following table. The enumeration values (in brackets) are the actual enumeration values that you will pass into the actual request payload.

From

To

(`en`) English

(`de`) German, (`zh`) Chinese (Mandarin), (`ja`) Japanese, (`fr`) French, (`it`) Italian, (`pt`) Portuguese, (`es`) Spanish, (`ru`) Russian

(`de`) German

(`en`) English, (`fr`) French, (`it`) Italian, (`es`) Spanish, (`pl`) Polish

(`fr`) French

(`en`) English, (`de`) German, (`it`) Italian, (`es`) Spanish

(`it`) Italian

(`en`) English, (`de`) German, (`fr`) French, (`es`) Spanish

(`es`) Spanish

(`en`) English, (`de`) German, (`fr`) French, (`it`) Italian

(`pl`) Polish

(`de`) German

(`zh`) Chinese (Mandarin)

(`en`) English

(`ja`) Japanese

(`en`) English

##### Checking listings for policy compliance

The [Compliance API](/api-docs/sell/compliance/static/overview.html) provides sellers a systematic approach to ensuring their listings conform to eBay's policies. This helps prevent penalties or listing removals and delivers valuable insights into non-compliant listings or listings at risk of non-compliance.

The two methods of the Compliance API are summarized below:

*   Use [getListingViolationsSummary](/api-docs/sell/compliance/resources/listing_violation_summary/methods/getListingViolationsSummary) to specify [compliance types](/api-docs/sell/compliance/types/com:ComplianceTypeEnum) for listing violation counts, with multiple types separated by commas. If unspecified, counts for all compliance types are returned.
*   Use the getListingViolations method to retrieve listings that are not compliant. You can use the [compliance\_type](/api-docs/sell/compliance/resources/listing_violation/methods/getListingViolations#uri.compliance_type) filter if you want to retrieve listings that violate a specific compliance type. Additionally, manage pagination with the offset and limit parameters.

##### Managing Best Offers, Second Chance Offers, and Sales Leads

The eBay Trading API provides a robust framework for managing Best Offers, Second Chance Offers, and Sales Leads, enabling sellers to maximize sales opportunities.

###### Managing Best Offers

Sellers can automate offer responses using the Inventory API's [autoAcceptPrice](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingPolicies.bestOfferTerms.autoAcceptPrice) and [autoDeclinePrice](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingPolicies.bestOfferTerms.autoDeclinePrice), and the Trading API's [Item.ListingDetails.BestOfferAutoAcceptPrice](/devzone/xml/docs/reference/ebay/types/ListingDetailsType.html) and [Item.ListingDetails.MinimumBestOfferPrice](/devzone/xml/docs/Reference/ebay/AddItem.html#Request.Item.ListingDetails.MinimumBestOfferPrice). These settings simplify negotiations, allowing efficient management of counteroffers and deal closures.

The following diagram is a visual representation of the Trading API calls used to manage Best Offers are summarized below:

![Banner image](/cms/img/sellotherguide/manage-best-offers.png)

1.  Best Offers on eBay enable sellers to negotiate prices with buyers, boosting sales potential. This feature can be activated via the Inventory API by setting [listingPolicies.bestOfferTerms.bestOfferEnabled](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingPolicies.bestOfferTerms) to true, and through the Trading API by setting [Item.BestOfferDetails.BestOfferEnabled](/devzone/xml/docs/Reference/ebay/types/BestOfferDetailsType.html) to true.
2.  Sellers use the [GetBestOffers](/Devzone/XML/docs/Reference/eBay/GetBestOffers.html) call to retrieve detailed information on Best Offers for items they are selling, focusing on active offers. They can access specific offer details using a [BestOfferID](/Devzone/XML/docs/Reference/eBay/types/BestOfferIDType.html), or view all Best Offer IDs for an item using just the [ItemID](/Devzone/XML/docs/Reference/eBay/GetBestOffers.html#Request.ItemID). Without these identifiers, sellers receive lists of active Best Offers related to them. The [BestOfferCodeType](/Devzone/XML/docs/Reference/eBay/GetBestOffers.html#Response.BestOfferArray.BestOffer.BestOfferCodeType) field is crucial, indicating whether the offer is a buyer's original offer (BuyerBestOffer), a buyer's counter offer (BuyerCounterOffer), a seller's counter offer (SellerCounterOffer). Understanding this field helps sellers manage and respond to offers effectively.
3.  Sellers use [RespondToBestOffer](/Devzone/XML/docs/Reference/eBay/RespondToBestOffer.html) to manage Best Offers and Counter Offers effectively. Sellers can accept, decline, or counter the Best Offer, facilitating flexible negotiation and enhancing the likelihood of closing a sale.

###### Making Second Chance Offers

Second Chance Offers are used when the seller has multiple quantities of a particular item, and that item received numerous competitive bids during an auction listing. The seller is able to reach out and offer the same item to one or more of those bidders equal to or less than their highest bid during the ended auction.

The following diagram is a visual representation of the steps involved to make a Second Chance Offer:

![Banner image](/cms/img/sellotherguide/making-second-chance-offers.png)

1.  The [GetAllBidders](/devzone/xml/docs/reference/ebay/GetAllBidders.html) Trading API call can be used against an auction listing to see bidders who had competitive bids during that auction.
2.  The [AddSecondChanceItem](/Devzone/XML/docs/Reference/eBay/AddSecondChanceItem.html) call is used to provide a competitive bidder with an opportunity to purchase the item.
3.  The price entered in the [BuyItNowPrice](/Devzone/XML/docs/Reference/eBay/AddSecondChanceItem.html#Request.BuyItNowPrice) field should not be higher than the highest bid price that the user made during the auction.
4.  The offer period is set in the [duration](/Devzone/XML/docs/Reference/eBay/AddSecondChanceItem.html#Request.Duration) field, and can be 1, 3, 5, or 7 days long.

**Note:** Use [VerifyAddSecondChanceItem](/Devzone/XML/docs/Reference/eBay/VerifyAddSecondChanceItem.html) to simulate the creation of a Second Chance Offer without actually listing it. This allows sellers to verify the offer details and ensure accuracy before making the offer live, reducing errors and enhancing buyer confidence.

###### Managing Sales Leads

Use [GetAdFormatLeads](/Devzone/XML/docs/Reference/eBay/GetAdFormatLeads.html) to access sales lead information from Classified Ads, providing the number of leads and contact details from interested buyers. This format connects sellers with potential buyers for items like real estate or automobiles, without bidding. Ensure the ItemID matches a Classified Ad listing in a supported category for successful lead retrieval.

##### Checking for intellectual property rights infringement

The [Verified Rights Owner (VeRO) Program API](/api-docs/commerce/vero/overview.html) provides intellectual property owners with a structured method to protect their rights by reporting eBay listings that infringe on their intellectual property. This service is essential for rights holders to safeguard their trademarks, copyrights, and other intellectual properties, ensuring unauthorized listings are addressed promptly.

The [VeRO API](/api-docs/commerce/vero/overview.html) enables a streamlined process for managing intellectual property rights through the following flow:

![Banner image](/cms/img/sellotherguide/check-intellectual-property-rights-infringement.png)

1.  To manage VeRO reason codes, use the [getVeroReasonCode](/api-docs/commerce/vero/resources/vero_reason_code/methods/getVeroReasonCode) function to retrieve details of a specific code, and the [getVeroReasonCodes](/api-docs/commerce/vero/resources/vero_reason_code/methods/getVeroReasonCodes) function to access all codes or those specific to a marketplace.
2.  The [createVeroReport](/api-docs/commerce/vero/resources/vero_report/methods/createVeroReport) method creates and submits a VeRO report to address items allegedly infringing on intellectual property rights on eBay. Key fields required include [itemId](/api-docs/commerce/vero/resources/vero_report/methods/createVeroReport#request.reportItems.itemId), the unique identifier for the item, and [veroReasonCodeId](/api-docs/commerce/vero/resources/vero_report/methods/createVeroReport#request.reportItems.veroReasonCodeId), which specifies the type of infringement.
3.  Obtain status information about a submitted VeRO report and its items using the [getVeroReport](/api-docs/commerce/vero/resources/vero_report/methods/getVeroReport).
4.  The [getVeroReportItems](/api-docs/commerce/vero/resources/vero_report_items/methods/getVeroReportItems) method can be used to retrieve the report status of one or more listings that have been reported through a VeRO Report.

##### Managing shipping and fulfillment in Greater China

The [eDelivery International Shipping (eDIS) API](/api-docs/sell/edelivery_international_shipping/overview.html) for Greater China provides sellers in the region with comprehensive tools to manage their shipping and fulfillment processes effectively. With an active eDIS account, sellers can utilize various methods to handle package creation, address preferences, tracking, and complaint management, ensuring streamlined shipping operations.

The [eDIS API](/api-docs/sell/edelivery_international_shipping/overview.html) offers a comprehensive suite of functionalities to streamline shipping and logistics for sellers. It enables efficient management of packages, addresses, tracking, costs, complaints, and additional services:

*   Ship from and return addresses can be created on an eDIS account using [createAddressPreference](/api-docs/sell/edelivery_international_shipping/resources/address_preference/methods/createAddressPreference) method. These addresses can be retrieved with [getAddressPreferences](/api-docs/sell/edelivery_international_shipping/resources/address_preference/methods/getAddressPreferences).
*   Shipping labels can be obtained in base64 format for conversion to PDF files using [getLabels](/api-docs/sell/edelivery_international_shipping/resources/labels/methods/getLabels), while [getHandoverSheet](/api-docs/sell/edelivery_international_shipping/resources/handover_sheet/methods/getHandoverSheet) provides access to handover sheets for packages involved in pickup requests.
*   Package management includes creating packages with [createPackage](/api-docs/sell/edelivery_international_shipping/resources/package/methods/createPackage) by specifying shipping details, accessing package information using [getPackage](/api-docs/sell/edelivery_international_shipping/resources/package/methods/getPackage), and retrieving packages linked to a specific order line item ID with [getPackagesByLineItemID](/api-docs/sell/edelivery_international_shipping/resources/package/methods/getPackagesByLineItemID). Packages can be canceled using [cancelPackage](/api-docs/sell/edelivery_international_shipping/resources/package/methods/cancelPackage), cloned for redelivery with [clonePackage](/api-docs/sell/edelivery_international_shipping/resources/package/methods/clonePackage), confirmed through [confirmPackage](/api-docs/sell/edelivery_international_shipping/resources/package/methods/confirmPackage), and deleted after cancellation with [deletePackage](/api-docs/sell/edelivery_international_shipping/resources/package/methods/deletePackage). Bulk operations are facilitated by [bulkCancelPackages](/api-docs/sell/edelivery_international_shipping/resources/package/methods/bulkCancelPackages), [bulkConfirmPackages](/api-docs/sell/edelivery_international_shipping/resources/package/methods/bulkConfirmPackages), and [bulkDeletePackages](/api-docs/sell/edelivery_international_shipping/resources/package/methods/bulkDeletePackages) for handling multiple packages simultaneously.
*   Tracking the status and location of packages is achieved with [getTracking](/api-docs/sell/edelivery_international_shipping/resources/tracking/methods/getTracking), which provides tracking event details using tracking numbers, enabling effective shipment monitoring.
*   The [createComplaint](/api-docs/sell/edelivery_international_shipping/resources/complaint/methods/createComplaint) method facilitates the filing of complaints related to shipment issues, such as pickup delays or lost items, ensuring that problems are reported and addressed efficiently.

##### Retrieving account and business information for a seller

The [Identity API](/api-docs/sell/identity/resources/methods) provides a way for developers to access the account profile information of authenticated users, including both individual and business accounts. This service allows developers to integrate eBay login functionality into their applications, eliminating the need to store sensitive personal identifiable information (PII) while ensuring access to relevant account data. The data returned is controlled by scopes and is available to select developers approved by business units.

The [Identity API](/api-docs/sell/identity/resources/methods) offers essential functionalities for accessing account profile information securely for authenticated users through the [getUser](/api-docs/sell/identity/resources/user/methods/getUser) method, which requires a user access token. The information retrieved varies based on the scopes applied; for business accounts, the default scope is commerce.Identity.Read-only, providing all fields within the [businessAccount](/api-docs/commerce/identity/types/api:BusinessAccount) container containing public information. For individual accounts, the fields within the [individualAccount](/api-docs/commerce/identity/types/api:IndividualAccount) container depend on the scope, with the default scope returning only public details such as the eBay user ID. Additionally, the API provides comprehensive account information, including the account type (BUSINESS or INDIVIDUAL), business account details like address, country code, primary contact, and primary phone, as well as individual account details, registration marketplace ID, and account status, which can be CONFIRMED, UNCONFIRMED, ACCOUNTONHOLD, or UNDETERMINED.

The [Identity API](/develop/api/sell/identity_api) offers essential functionalities for accessing account profile information securely for authenticated users through the [getUser](/develop/api/sell/identity_api#sell-identity_api-get-getuser) method, which requires a user access token. The information retrieved varies based on the scopes applied; for business accounts, the default scope is `commerce.identity.read-only`, providing all fields within the [businessAccount](/api-docs/commerce/identity/types/api:BusinessAccount) container containing public information. For individual accounts, the fields within the [individualAccount](/api-docs/commerce/identity/types/api:IndividualAccount) container depend on the scope, with the default scope returning only public details such as the eBay user ID. Additionally, the API provides comprehensive account information, including the account type (BUSINESS or INDIVIDUAL), business account details like address, country code, primary contact, and primary phone, as well as individual account details, registration marketplace ID, and account status, which can be CONFIRMED, UNCONFIRMED, ACCOUNTONHOLD, or UNDETERMINED.

**Business use cases**

This section outlines the high-level use cases supported by the Identity API.

*   Retrieve the public information of a business using the default scope.
*   Retrieve the public information of an individual using the default scope.
*   Retrieve additional information of an individual using other scopes.

_Business Account Response_

The business account information is returned when available. This type of account is available only in some countries. For details, see [accountType](/api-docs/commerce/identity/resources/user/methods/getUser#response.accountType).

Scope

Fields Returned

`commerce.identity.readonly`  
(the default)

{
  "userId": "007BUS2xyeBay",
  "username": "ebaybusinessuser",
  "accountType": "BUSINESS",
  "registrationMarketplaceId": "EBAY\_US",
  "businessAccount": {
	"name": "eBay User",
	"email": "ebaybusinessuser@ebay.com",
	"doingBusinessAs": "Top eBay Seller",
	"primaryPhone": {
	  "countryCode": "US",
	  "number": "0000000000",
	  "phoneType": "MOBILE"
	}
  },
  "address": {
	"addressLine1": "2025 Hamilton Ave",
	"addressLine2": "Apt E 2025",
	"city": "San Jose",
	"stateOrProvince": "CA",
	"postalCode": "95125",
	"country": "US"
  },
  "primaryContact": {
	"firstName": "eBay",
	"lastName": "User"
  }
}

_Individual Account Response_

In order to protect the user's personal information, the fields returned in the **individualAccount** container are controlled by the scope. All Partners can use the default scope, which returns the user's public information and their business information if it exists. Access to the other scopes is specified in the Partner's contract with eBay.

The following table shows the fields that are returned in the **individualAccount** container by scope. For details about these fields, see the [getUser](/api-docs/commerce/identity/resources/user/methods/getUser) method. You can get the information from multiple scopes by specifying all the scopes you're interested in when you generate your token.

Scope

Fields Returned

`commerce.identity.readonly`  
(the default)

{
  "userId": "007IND2xyeBay",
  "username": "ebayindividualuser",
  "accountType": "INDIVIDUAL",
  "registrationMarketplaceId": "EBAY\_US"
}
						

`commerce.identity.status.readonly`  
  
This also returns the **status** field in the [business account response](#business-resp).

{
  "userId": "007IND2xyeBay",
  "username": "ebayindividualuser",
  "status": "CONFIRMED",
  "accountType": "INDIVIDUAL",
  "registrationMarketplaceId": "EBAY\_US"
}
						

`commerce.identity.name.readonly`

{
  "userId": "007IND2xyeBay",
  "username": "ebayindividualuser",
  "accountType": "INDIVIDUAL",
  "registrationMarketplaceId": "EBAY\_US",
  "individualAccount": {
	"firstName": "eBay",
	"lastName": "User"
  }
}
						

`commerce.identity.address.readonly`

{
  "userId": "007IND2xyeBay",
  "username": "ebayindividualuser",
  "accountType": "INDIVIDUAL",
  "registrationMarketplaceId": "EBAY\_US",
  "individualAccount": {
    "registrationAddress": {
      "addressLine1": "2025 Hamilton Ave.",
      "city": "San Jose",
      "stateOrProvince": "CA",
      "postalCode": "95125",
      "country": "US"
    }
  }
}

`commerce.identity.email.readonly`

{
  "userId": "007IND2xyeBay",
  "username": "ebayindividualuser",
  "accountType": "INDIVIDUAL",
  "registrationMarketplaceId": "EBAY\_US",
  "individualAccount": {
	"email": "ebayindividualuser@ebay.com"
  }
}
						

`commerce.identity.phone.readonly`

{
  "userId": "007IND2xyeBay",
  "username": "ebayindividualuser",
  "accountType": "INDIVIDUAL",
  "registrationMarketplaceId": "EBAY\_US",
  "individualAccount": {
    "primaryPhone": {
      "countryCode": "US",
      "number": "0000000000",
      "phoneType": "MOBILE"
    },
    "secondaryPhone": {
      "countryCode": "US",
      "number": "0000000000",
      "phoneType": "MOBILE"
    }
  }
}

## Code Samples

## Error Handling

*   When using the [Translation API](/api-docs/sell/translation/static/overview.html), ensure that the specified source and output language combination is supported. Check the [table](/api-docs/commerce/translation/overview.html#supported-languages) in the API Overview to verify if the API accommodates your translation use case.
*   When filtering by one or more [compliance\_type](/api-docs/sell/compliance/resources/listing_violation/methods/getListingViolations#uri.compliance_type) values in an [getListingViolationsSummary](/api-docs/sell/compliance/resources/listing_violation_summary/methods/getListingViolationsSummary) or [getListingViolations](/api-docs/sell/compliance/resources/listing_violation/methods/getListingViolations) method, be sure that the provided value(s) are supported, and that multiple values are delimited with a comma.
*   If providing one or more listing ID values in the [findListingRecommendations](/api-docs/sell/recommendation/resources/listing_recommendation/methods/findListingRecommendations) method, ensure that all provided IDs are for active listings.
*   Ensure offer details for [AddSecondChanceItem](/Devzone/XML/docs/Reference/eBay/AddSecondChanceItem.html) are accurate by verifying the duration period is supported and the offer price does not exceed the user's bid during the auction.
*   When creating a VeRO Report with the [createVeroReport](/api-docs/commerce/vero/resources/vero_report/methods/createVeroReport) method, make sure you are using the correct [itemId](/api-docs/commerce/vero/resources/vero_report/methods/createVeroReport#request.reportItems.itemId) and [veroReasonCodeId](/api-docs/commerce/vero/resources/vero_report/methods/createVeroReport#request.reportItems.veroReasonCodeId) values.
*   Ensure accurate package dimensions and weight in the [eDIS API](/api-docs/sell/edelivery_international_shipping/overview.html) when using methods like [createPackage](/api-docs/sell/edelivery_international_shipping/resources/package/methods/createPackage) to avoid creation and tracking errors.

## Best Practices

*   The [Translation API](/api-docs/sell/translation/static/overview.html) can help you list items on eBay marketplaces where you are not fluent in the language.
*   Regularly check listing recommendations using the [Recommendation API](/api-docs/sell/recommendation/static/overview.html) and its [findListingRecommendations](/api-docs/sell/recommendation/resources/listing_recommendation/methods/findListingRecommendations) method to improve sales velocity and optimize visibility through Promoted Listings.
*   Take advantage of [AddSecondChanceItem](/Devzone/XML/docs/Reference/eBay/AddSecondChanceItem.html) call if you have competitive auction listings and multiple quantities of the same item.
*   Enable eBay login functionality to bypass storing sensitive personally identifiable information, minimizing data breach risks and ensuring privacy compliance. Use correct scopes to retrieve only relevant data.

## Code Samples

### Fetching Best Offers on eBay listings

**Label:** Fetching Best Offers on eBay listings

#### Bash Sample

```bash
curl -X POST "https://api.ebay.com/ws/api.dll"
-H "X-EBAY-API-SITEID:0"
-H "X-EBAY-API-COMPATIBILITY-LEVEL:967"
-H "X-EBAY-API-CALL-NAME:GetBestOffers"
-H "X-EBAY-API-IAF-TOKEN:"
```

### Translating English title into Spanish

**Label:** Translating English title into Spanish

#### Bash Sample

```bash
curl -X POST "https://api.ebay.com/commerce/translation/v1_beta/translate"
-H "Authorization:Bearer OAUTH_token"
-H "Content-Type:application/json"
{
    "from": "en",
    "to": "es",
    "text": [
        "Apple Watch Series 10 GPS + Cellular 42mm Smartwatch Aluminium Case - Excellent"
    ],
    "translationContext": "ITEM_TITLE"
}
```

## Related Topics

- [Translation API](/api-docs/sell/translation/static/overview.html)
- [Compliance API](/api-docs/sell/compliance/static/overview.html)
- [GetAdFormatLeads](/Devzone/XML/docs/Reference/eBay/GetAdFormatLeads.html)
- [VeRO API](/api-docs/commerce/vero/overview.html)
- [eDIS API](/api-docs/sell/edelivery_international_shipping/overview.html)
- [Identity API](/api-docs/sell/identity/resources/methods)
- [Recommendation API](/api-docs/sell/recommendation/static/overview.html)
- [More Guides](/develop/guides)

