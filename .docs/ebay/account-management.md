# Account Management Guide

**Guide Group:** Account Management

APIs used to retrieve transactional data, create business policies, set shipping rate tables and shipping discounts, retrieve selling preferences, and more.

---

## Overview

The Account Management APIs allow developers to manage account settings, user preferences, and account configurations to enhance the seller’s experience on eBay. These APIs included methods to create and manage business policies and custom policies, retrieve seller payout and other monetary transaction data, and manage shipping rate tables, enabling sellers to maintain compliance with eBay’s requirements and optimize their operations.

## API Use Cases

[Managing business policies](#businesspolicies)  
[Managing custom policies](#custompolicies)  
[Managing seller finances](#finances)  
[Managing shipping rate tables](#ratetables)  
[Retrieving subscription and advertising eligibility](#accountdetails)  
[Managing sales tax settings](#salestax)  
[User account calls](#useraccount)  
[Managing opt-in programs](#programs)  
[Managing shipping rules](#shippingrules)  

##### Managing business policies

The Account Management APIs allow sellers to define and manage their payment, return, and fulfillment business policies. These business policies can be applied to listings in the Listing Management APIs by referencing their IDs in the request payloads.

*   Use [createFulfillmentPolicy](/api-docs/sell/account/resources/fulfillment_policy/methods/createFulfillmentPolicy), [createPaymentPolicy](/api-docs/sell/account/resources/payment_policy/methods/createPaymentPolicy), and [createReturnPolicy](/api-docs/sell/account/resources/return_policy/methods/createReturnPolicy) to define new business policies.
*   Use [getFulfillmentPolicies](/api-docs/sell/account/resources/fulfillment_policy/methods/getFulfillmentPolicies), [getPaymentPolicies](/api-docs/sell/account/resources/payment_policy/methods/getPaymentPolicies), and [getReturnPolicies](/api-docs/sell/account/resources/return_policy/methods/getReturnPolicies) to retrieve all business policies for a marketplace.
*   Use [getFulfillmentPolicyByName](/api-docs/sell/account/resources/fulfillment_policy/methods/getFulfillmentPolicyByName), [getPaymentPolicyByName](/api-docs/sell/account/resources/payment_policy/methods/getPaymentPolicyByName), and [getReturnPolicyByName](/api-docs/sell/account/resources/return_policy/methods/getReturnPolicyByName) to retrieve a specific business policy by name.
*   Use [getFulfillmentPolicy](/api-docs/sell/account/resources/fulfillment_policy/methods/getFulfillmentPolicy), [getPaymentPolicy](/api-docs/sell/account/resources/payment_policy/methods/getPaymentPolicy), and [getReturnPolicy](/api-docs/sell/account/resources/return_policy/methods/getReturnPolicy) to retrieve a specific business policy by ID.
*   Use [updateFulfillmentPolicy](/api-docs/sell/account/resources/fulfillment_policy/methods/updateFulfillmentPolicy), [updatePaymentPolicy](/api-docs/sell/account/resources/payment_policy/methods/updatePaymentPolicy), and [updateReturnPolicy](/api-docs/sell/account/resources/return_policy/methods/updateReturnPolicy) to make changes to existing business policies.
*   Use [deleteFulfillmentPolicy](/api-docs/sell/account/resources/fulfillment_policy/methods/deleteFulfillmentPolicy), [deletePaymentPolicy](/api-docs/sell/account/resources/payment_policy/methods/deletePaymentPolicy), and [deleteReturnPolicy](/api-docs/sell/account/resources/return_policy/methods/deleteReturnPolicy) to remove unused business policies.
*   Use [SetShippingDiscountProfile](/Devzone/XML/docs/Reference/eBay/SetShippingDiscountProfiles.html) to configure or update shipping discount rules, such as flat rate or promotional shipping discounts. Then, these discounts can be applied to fulfillment business policies.
*   Use [GetShippingDiscountProfiles](/Devzone/XML/docs/Reference/eBay/GetShippingDiscountProfiles.html) to retrieve details about active shipping discount profiles.

##### Managing custom policies

Sellers can manage custom policies such as product compliance and take-back policies to meet regulatory and custom expectations. These policies can be applied to listings in the Listing Management APIs by referencing their IDs in the request payloads.

*   Use the [createCustomPolicy](/api-docs/sell/account/resources/custom_policy/methods/createCustomPolicy) method to define new custom policies, including product compliance and take-back policies.
*   Use the [getCustomPolicies](/api-docs/sell/account/resources/custom_policy/methods/getCustomPolicies) method to retrieve all existing custom policies, including product compliance and take-back policies.
*   Use the [getCustomPolicy](/api-docs/sell/account/resources/custom_policy/methods/getCustomPolicy) method to retrieve details of a specific custom policy by ID.
*   Use the [updateCustomPolicy](/api-docs/sell/account/resources/custom_policy/methods/updateCustomPolicy) method to make changes to existing custom policies, including product compliance and take-back policies.

##### Managing seller finances

The [Finances API](/api-docs/sell/finances/resources/methods) provides a comprehensive view of financial transactions and payouts between sellers and eBay. Use the [Finances API](/api-docs/sell/finances/resources/methods) to fetch details of all transactions, including fees, charges, and credits.

*   Use [getPayouts](/api-docs/sell/finances/resources/payout/methods/getPayouts) to retrieve a list of payouts issued to the seller. Use [getPayout](/api-docs/sell/finances/resources/payout/methods/getPayout) to fetch detailed information about a specific payout.
*   Use [getPayoutSettings](/api-docs/sell/account/v2/resources/payout_settings/methods/getPayoutSettings) and [updatePayoutPercentage](/api-docs/sell/account/v2/resources/payout_settings/methods/updatePayoutPercentage) in the Account API v2 to configure and retrieve seller payout settings. These methods are only applicable to sellers based in mainland China.
*   Use [getTransactions](/api-docs/sell/finances/resources/transaction/methods/getTransactions) to retrieve financial transactions such as sales, eBay shipping label purchases, listing fees, buyer refunds, and seller credits.
*   Use [getSellerFundsSummary](/api-docs/sell/finances/resources/seller_funds_summary/methods/getSellerFundsSummary) to get an overview of the seller's payout funds, including available, on-hold, and processing amounts, helping track and manage finances effectively.
*   Use [getTransfer](/api-docs/sell/finances/resources/transfer/methods/getTransfer) to retrieve the details of a specific monetary transfer between eBay and the seller, including the amount, status, currency, date, and related metadata for tracking and reconciliation.
*   Use [GetAccount](/Devzone/XML/docs/Reference/eBay/GetAccount.html) to retrieve the seller's account balance, fees, and invoice information.

**Note:** To comply with EU and UK payments regulatory requirements, specific API calls made on behalf of EU/UK domiciled sellers must include digital signatures. These requirements are mandated under Strong Customer Authentication (SCA) regulations to ensure secure transactions.

Account management APIs and methods requiring digital signatures:

*   **Finances API:** All methods
*   **Trading API:** GetAccount call

##### Managing shipping rate tables

Shipping rate tables allow sellers to define shipping costs based on various factors, including the buyer's location. Sellers can create both domestic and international shipping rate tables to cater to different shipping needs. These tables can be applied to listings by referencing the rate table ID in the Listing Management APIs.

*   Use [getRateTables](/api-docs/sell/account/resources/rate_table/methods/getRateTables) in the Account API v1 to fetch a list of all shipping rate tables. 
*   Use [getRateTable](/api-docs/sell/account/v2/resources/rate_table/methods/getRateTable) in the Account API v2 to retrieve a specific rate table that includes shipping cost information.
*   Use [updateShippingCost](/api-docs/sell/account/v2/resources/rate_table/methods/updateShippingCost) in the Account API v2 to modify costs within existing shipping rate tables.

##### Retrieving subscription and advertising eligibility

The Account Management APIs include methods for retrieving subscription details, advertising eligibility, and account-level privileges. 

*   Use [getPrivileges](/api-docs/sell/account/resources/privilege/methods/getPrivileges) to verify if a new seller has completed registration and to view daily selling limits, including transaction count and total sales value.
*   Use [getSubscription](/api-docs/sell/account/resources/subscription/methods/getSubscription) to fetch the seller’s subscription details.
*   Use [getAdvertisingEligibility](/api-docs/sell/account/resources/advertising_eligibility/methods/getAdvertisingEligibility) to check the seller’s eligibility for different advertising programs.

##### Managing sales tax settings

Sellers can configure and manage sales tax rates for specific tax jurisdictions on US and Canada marketplaces.

*   Use [getSalesTaxes](/api-docs/sell/account/resources/sales_tax/methods/getSalesTaxes) to fetch all configured sales tax settings.
*   Use [getSalesTax](/api-docs/sell/account/resources/sales_tax/methods/getSalesTax) to fetch the sales tax settings for a specific jurisdiction.
*   Use [createOrReplaceSalesTax](/api-docs/sell/account/resources/sales_tax/methods/createOrReplaceSalesTax) to add or modify tax settings for a jurisdiction.
*   Use [deleteSalesTax](/api-docs/sell/account/resources/sales_tax/methods/deleteSalesTax) to remove the tax settings for a specific jurisdiction.
*   Use [SetTaxTable](/Devzone/XML/docs/Reference/eBay/SetTaxTable.html) to configure or update sales tax settings for jurisdictions in the US and Canada.
*   Use [GetTaxTable](/Devzone/XML/docs/Reference/eBay/GetTaxTable.html) to retrieve the tax settings for all jurisdictions that the seller has configured.

##### User account calls

The eBay APIs provide essential methods for managing specific account details, including account preferences, shipping discounts, and identity verification.

*   Use [GetUser](/Devzone/XML/docs/Reference/eBay/GetUser.html) to fetch detailed information about the seller's account, including feedback scores and registration details.
*   Use [setUserPreferences](/api-docs/sell/account/v2/resources/user_preferences/methods/setUserPreferences) to update seller account preferences.
*   Use [getUserPreferences](/api-docs/sell/account/v2/resources/user_preferences/methods/setUserPreferences) to retrieve seller account preferences such as business policies, out-of-stock control preferences, shipping cutoff times, and unpaid item assistance preferences.
*   Use the **Identity API** to verify and manage account-level identity information for sellers, ensuring compliance with eBay's verification policies.

##### Managing opt-in programs

Sellers can opt into or out of specific eBay programs to tailor their account experience. The currently supported programs include Out-of-Stock control, Business Policies opt-in, and Motors Dealers program:

*   Use [getOptedInPrograms](/api-docs/sell/account/resources/program/methods/getOptedInPrograms) to view programs the account is opted into.
*   Use [optInToProgram](/api-docs/sell/account/resources/program/methods/optInToProgram) to opt into a specific program.
*   Use [optOutOfProgram](/api-docs/sell/account/resources/program/methods/optOutOfProgram) to opt out of a specific program.

##### Managing shipping rules

Sellers can configure shipping rules in their eBay account to offer combined shipping discounts, flat or calculated multi-item discounts, and time-bound promotional incentives. These rules help reduce buyers' shipping costs when purchasing multiple items and can promote timely purchases through targeted promotions. The **Sell Account API** (REST) provides endpoints in the [combined\_shipping\_rules](/api-docs/sell/account/v2/resources/methods#s0-1-31-4-7-5-6-2[2]-h2-combined_shipping_rules) resource to create, update, and retrieve these rules.

*   Use [c](/api-docs/sell/account/v2/resources/combined_shipping_rules/methods/createCalculatedShippingRules)[reateCalculatedShippingRules](/api-docs/sell/account/v2/resources/combined_shipping_rules/methods/createCalculatedShippingRules) to create calculated combined shipping rules based on item attributes (for example, weight, dimensions).
*   Use [createFlatShippingRules](/api-docs/sell/account/v2/resources/combined_shipping_rules/methods/createFlatShippingRules) to create flat-rate combined shipping rules with standard costs.
*   Use [createPromotionalShippingRules](/api-docs/sell/account/v2/resources/combined_shipping_rules/methods/createPromotionalShippingRule) to define time-bound promotional shipping rules (such as discounts or free-shipping thresholds).
*   Use [getCombinedShippingRules](/api-docs/sell/account/v2/resources/combined_shipping_rules/methods/getCombinedShippingRules) to retrieve all combined shipping rule configurations for the seller.
*   Use [updateCalculatedShippingRules](/api-docs/sell/account/v2/resources/combined_shipping_rules/methods/updateCalculatedShippingRules) to update previously defined calculated shipping rules (for example, discount percentages).
*   Use [updateCombinedPayments](/api-docs/sell/account/v2/resources/combined_shipping_rules/methods/updateCombinedPayments) to configure or modify combined payment settings for merging unpaid orders.
*   Use [updateFlatShippingRules](/api-docs/sell/account/v2/resources/combined_shipping_rules/methods/updateFlatShippingRules) to update existing flat-rate combined shipping rules.
*   Use [updatePromotionalShippingRules](/api-docs/sell/account/v2/resources/combined_shipping_rules/methods/updatePromotionalShippingRule) to update promotional shipping rules (adjust thresholds, eligibility, duration).

## Code Samples

## Error Handling

*   If the marketplace ID provided in the API request is invalid, refer to the [eBay Marketplace IDs documentation](/api-docs/static/rest-request-components.html#marketpl) for a list of valid marketplace IDs and ensure the correct marketplace ID is passed in the request.
*   If the API call to create or update a policy fails due to missing required fields, ensure that fields such as name, marketplaceId, and any specific compliance or policy details (e.g., description, categoryTypes) are included and valid. Refer to the API documentation for endpoint-specific field requirements and validate your request payload before making the API call.
*   If creating a new policy fails because a policy with the same name already exists, use the getPolicies method to fetch existing policies and ensure your new policy name is unique.

## Best Practices

*   Periodically fetch business policies to ensure consistency between your system and eBay’s account settings.
*   Implement caching for frequently used data like policies or tax settings to reduce redundant API calls.

## Code Samples

### Retrieve Fulfillment Business Policies for US Marketplace

**Label:** Retrieve Fulfillment Business Policies for US Marketplace

#### Bash Sample

```bash
curl -X GET "https://api.ebay.com/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_US"
-H "Authorization:Bearer OAUTH_token"
```

### Retrieve a List of Seller Payouts for US Marketplace

**Label:** Retrieve a List of Seller Payouts for US Marketplace

#### Bash Sample

```bash
curl -X GET "https://apiz.ebay.com/sell/finances/v1/payout"
-H "Authorization:Bearer OAUTH_token"
-H "X-EBAY-C-MARKETPLACE-ID:EBAY_US"
```

## Related Topics

- [Account API v1](/api-docs/sell/account/resources/methods)
- [Account API v2](/api-docs/sell/account/v2/resources/methods)
- [Finances API](/api-docs/sell/finances/resources/methods)
- [Trading User Account Calls](/Devzone/XML/docs/Reference/eBay/UserAccountIndex.html)
- [More Guides](/develop/guides)

