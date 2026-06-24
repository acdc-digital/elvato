# Listing Metadata Guide

**Guide Group:** Listing Metadata

APIs to retrieve metadata that is required/applicable in listing flows, such as listing categories, shipping service options, required/recommended item specifics, supported item conditions, parts compatibility information, and more.

---

## Overview

Sellers are often required to specify metadata information on a listing, depending on the eBay marketplace and category on which they are listing the item. The Selling Metadata APIs allow sellers to determine if certain features are supported or required on a specific marketplace or in a specific category. Sellers can then use these APIs to retrieve this information to add to their listings, helping them comply with various eBay policies and optimize their listings.

## API Use Cases

[Retrieving category taxonomy and desired listing category](#cattaxonomy)  
[Retrieving category-level metadata](#catmetadata)  
[Retrieving marketplace-level metadata](#sitemetadata)  
[Retrieving Regulatory metadata](#regulatorymetadata)  
[Retrieving eBay catalog products and charitable organizations](#catalogandcharity)  

##### Retrieving category taxonomy and desired listing category

Every eBay listing must be listed in an eBay leaf category. Selecting the most appropriate category will increase chances of interested buyers finding your item in searches, and more views can lead to increased sales.

The API methods used to retrieve eBay taxonomy and leaf categories are discussed below:

*   Use [getDefaultCategoryTreeId](/api-docs/sell/taxonomy/resources/category_tree/methods/getDefaultCategoryTreeId) to retrieve the [categoryTreeId](https://guides.edpweb-10.stratus.qa.ebay.com/api-docs/sell/taxonomy/resources/category_tree/methods/getDefaultCategoryTreeId#response.categoryTreeId) (aka eBay site ID) for a specific eBay marketplace.
*   Referencing the retrieved [categoryTreeId](https://guides.edpweb-10.stratus.qa.ebay.com/api-docs/sell/taxonomy/resources/category_tree/methods/getDefaultCategoryTreeId#response.categoryTreeId) value, use one of the following methods:

*   Use [getCategoryTree](/api-docs/sell/taxonomy/resources/category_tree/methods/getCategoryTree) to retrieve the entire category taxonomy for an eBay marketplace, or use [getCategorySubtree](/api-docs/sell/taxonomy/resources/category_tree/methods/getCategorySubtree) to retrieve a specific eBay category at any level and all of its descendants. Look for a **leafCategoryTreeNode** boolean field with a value of ‘true’ to confirm that the category you wish to use is a leaf category. 
*   Use [getCategorySuggestions](/api-docs/sell/taxonomy/resources/category_tree/methods/getCategorySuggestions) to retrieve the most relevant eBay leaf categories based on a provided product-related keyword. 
*   Use [getExpiredCategories](/api-docs/sell/taxonomy/resources/category_tree/methods/getExpiredCategories) to retrieve expired category IDs and the new category IDs that these expired categories have been mapped to. 

##### Retrieving category-level metadata

Retrieving category-level metadata for a specific eBay category allows sellers to better understand the features or requirements that apply to a specific leaf category and apply them to their listings. Once retrieved, this metadata can be passed in when creating or revising a listing through the Trading or Inventory API.

The API methods to retrieve category-level metadata are discussed below: 

*   Retrieve standard and refurbished item conditions and condition descriptor metadata supported for one or more leaf categories on a specific eBay marketplace by using one of the following methods:

*   Use [getItemConditionPolicies](/api-docs/sell/metadata/resources/marketplace/methods/getItemConditionPolicies) to retrieve supported [conditionId](https://guides.edpweb-10.stratus.qa.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getItemConditionPolicies#response.itemConditionPolicies.itemConditions.conditionId) values associated with one, multiple, or all eBay leaf categories on a specified eBay marketplace. Note that an OAuth user token is required to retrieve refurbished item conditions.
*   Use [GetCategoryFeatures](/devzone/xml/docs/reference/ebay/GetCategoryFeatures.html) with the [FeatureID](/devzone/xml/docs/reference/ebay/types/FeatureIDCodeType.html) value set to **ConditionValues** to retrieve supported standard and refurbished condition ID values on a specified eBay marketplace.

*   Retrieve item aspect name-value pairs associated with a specified leaf categories using one of the following methods: 

*   Use [getItemAspectsForCategory](/api-docs/commerce/taxonomy/resources/category_tree/methods/getItemAspectsForCategory) to retrieve the required, recommended, and optional product aspects for a specified category. 
*   Use [fetchItemAspects](/api-docs/commerce/taxonomy/resources/category_tree/methods/fetchItemAspects) to retrieve the complete list of aspects for all leaf categories that belong to an eBay marketplace. The eBay [Taxonomy SDK](https://github.com/eBay/taxonomy-sdk) can then be used to compare the aspect metadata that is returned in this response. 

*   Retrieve metadata required for a Return Policy, such as return period or return shipping cost payer, by using [getReturnPolicies](/api-docs/sell/metadata/resources/marketplace/methods/getReturnPolicies) or [GetCategoryFeatures](/devzone/xml/docs/reference/ebay/getcategoryfeatures.html).
*   Retrieve motor vehicle listing metadata by using [GetCategoryFeatures](/devzone/xml/docs/Reference/eBay/GetCategoryFeatures.html) with the [FeatureID](/devzone/xml/docs/reference/ebay/types/FeatureIDCodeType.html) filter to retrieve the following metadata for motor vehicle categories: 

*   **Motors Local Market listings:** Use **LocalMarketAdFormatEnabled** to determine whether the specified category supports Motor Local Market listings. 
*   **eBay Motors Pro Listings:** Use **LocalMarketAdFormatEnabled** to determine whether the specified category supports Motor Local Market listings. 
*   **Vehicle Deposits:** Use **DepositSupported** to determine if the specified category supports down payments for motor vehicle listings. 

*   Retrieve parts compatibility metadata by doing the following: 

*   Use [getAutomotivePartsCompatibilityPolicies](/api-docs/sell/metadata/resources/marketplace/methods/getAutomotivePartsCompatibilityPolicies) or [GetCategoryFeatures](/devzone/xml/docs/reference/ebay/getcategoryfeatures.html) to determine if a leaf category supports Cars and Trucks Parts Compatibility and/or Boats and Motorcycle Parts Compatibility. 
*   Use [getCompatibilityProperties](/api-docs/commerce/taxonomy/resources/category_tree/methods/getCompatibilityProperties) or [GetCompatibilitySearchNames](/devzone/product-metadata/CallRef/getCompatibilitySearchNames.html) to retrieve the required vehicle aspects for a leaf category. 
*   Use [getCompatibilityPropertyValues](/api-docs/commerce/taxonomy/resources/category_tree/methods/getCompatibilityPropertyValues) or [GetCompatibilitySearchValues](/devzone/product-metadata/CallRef/getCompatibilitySearchValues.html) to retrieve supported values for vehicle aspect(s).

*   Retrieve metadata for Classified Ad listings by doing the following: 

*   Use [GetCategoryFeatures](/devzone/xml/docs/Reference/eBay/GetCategoryFeatures.html) with the [FeatureID](/devzone/xml/docs/reference/ebay/types/FeatureIDCodeType.html) filter set to **AdFormatEnabled** to determine if a category supports Classified Ad listings.
*   If supported, the following fields indicate if Best Offer and its features are available for Classified Ad listings in the specified category: 

*   **ClassifiedAdBestOfferEnabled**
*   **ClassifiedAdCounterOfferEnabled**
*   **ClassifiedAdAutoAcceptEnabled**
*   **ClassifiedAdAutoDeclineEnabled**

*   The following fields indicate if the specified category supports including a seller’s contact information on the listing: 

*   **ClassifiedAdCompanyNameEnabled**
*   **ClassifiedAdContactByAddressEnabled**
*   **ClassifiedAdContactByEmailEnabled**
*   **ClassifiedAdContactByPhoneEnabled**

*   Determine the categories that support Best Offer features by using one of the following methods: 

*   Use [getNegotiatedPricePolicies](/api-docs/sell/metadata/resources/marketplace/methods/getNegotiatedPricePolicies) to retrieve the leaf categories that support Best Offer features.
*   Use [GetCategoryFeatures](/devzone/xml/docs/Reference/eBay/GetCategoryFeatures.html) with the [FeatureID](/devzone/xml/docs/reference/ebay/types/FeatureIDCodeType.html) filter set to **BestOfferEnabled** to retrieve a list of categories that support Best Offer. 

*   To determine if a category supports lot listings, use [getCategories](/devzone/xml/docs/reference/ebay/getcategories.html). If a category does **not** support lot listings, the [CategoryArray.Category.LSD](/devzone/xml/docs/reference/ebay/getcategories.html#Response.CategoryArray.Category.LSD) boolean will be returned as ‘true’.
*   To retrieve the supported CBT corridors for a category, use [GetCategoryFeatures](/devzone/xml/docs/Reference/eBay/GetCategoryFeatures.html) with [FeatureID](/devzone/xml/docs/reference/ebay/types/FeatureIDCodeType.html) set to **CrossBorderTradeEnabled**. The following values are supported: 

*   **CrossBorderTradeNorthAmericaEnabled** 
*   **CrossBorderTradeGBEnabled**
*   **CrossBorderTradeAustraliaEnabled**

##### Retrieving marketplace-level metadata

Retrieving marketplace-level metadata for a specific eBay site allows sellers to better understand the features and values that are supported by a specific site and apply them to their listings. The [GeteBayDetails](/devzone/xml/docs/reference/ebay/GeteBayDetails.html) call of the Trading API has a variety of **DetailName** filters that allow sellers to retrieve specific information, such as supported features, requirements, and/or values of a specific marketplace. Once retrieved, this metadata can be passed in when creating or revising a listing through the Trading or Inventory API.

The [DetailName](/Devzone/XML/docs/Reference/eBay/types/DetailNameCodeType.html) filters used to retrieve marketplace-level metadata are discussed below: 

*   Use **SiteDetails** to retrieve the names and identifiers of all supported eBay sites.
*   Use **CurrencyDetails** to retrieve the list of three-letter currency codes supported by eBay.
*   Use **CountryDetails** to retrieve the list of two-letter country codes supported by eBay
*   Use **ShippingServiceDetails** to retrieve supported shipping service information for the specified eBay site. The following information will be returned for each shipping service option: 

*   A separate [ShippingServiceDetails.ShippingService](/Devzone/XML/docs/Reference/eBay/GeteBayDetails.html#Response.ShippingServiceDetails.ShippingService) field will be returned for each supported shipping service option. For each shipping service option, look for a value of 'true' in the corresponding [ValidForSellingFlow](/Devzone/XML/docs/Reference/eBay/GeteBayDetails.html#Response.ShippingServiceDetails.ValidForSellingFlow) field, and all international shipping service options will have a [InternationalService](/Devzone/XML/docs/Reference/eBay/GeteBayDetails.html#Response.ShippingServiceDetails.InternationalService) boolean field with a value of 'true'. 
*   Here are a few other key fields that can be returned under the [ShippingServiceDetails](/Devzone/XML/docs/Reference/eBay/GeteBayDetails.html#Response.ShippingServiceDetails) container for each shipping service option: 

*   [SurchargeApplicable](/Devzone/XML/docs/Reference/eBay/GeteBayDetails.html#Response.ShippingServiceDetails.SurchargeApplicable)
*   [ShippingServiceDetails.ServiceType](/Devzone/XML/docs/Reference/eBay/GeteBayDetails.html#Response.ShippingServiceDetails.ServiceType) 
*   [ShippingServiceDetails.ShippingPackage](/Devzone/XML/docs/Reference/eBay/GeteBayDetails.html#Response.ShippingServiceDetails.ShippingPackage)
*   [ShippingServiceDetails.WeightRequired](/Devzone/XML/docs/Reference/eBay/GeteBayDetails.html#Response.ShippingServiceDetails.WeightRequired)

*   Use the **RegionOfOriginDetails** and **ExcludeShippingLocationDetails** filters to retrieve the geographical regions and countries that can be specified as ship-to location and excluded shipping locations, respectively.
*   Use **DispatchTimeMaxDetails** to retrieve the supported number of business days an eBay site allows for handling time.
*   Use **ItemSpecificDetails**, **VariationDetails**, and **ListingStartPriceDetails** to retrieve the minimum and maximum threshold data for Item specifics, variations, and listing start prices.
*   Use **ShippingCarrierDetails** to retrieve a list of shipping carriers supported by the specified site.
*   Use **ProductDetails** to retrieve the [ProductIdentifierUnavailableText](/devzone/xml/docs/reference/ebay/GeteBayDetails.html#Response.ProductDetails.ProductIdentifierUnavailableText) that should be passed into relevant product identifier fields (EAN, ISBN, UPC, Brand/MPN) if one is required by an eBay leaf category, but does not exist or apply to the product. 
*   Use **ListingFeatureDetails** to retrieve the listing features that are supported for the specified eBay site. If a feature is supported, its corresponding enum value can be used in listing calls to enable that feature on the listing.
*   Use **TimeZoneDetails** to retrieve a list of all global time zones, as well as detailed information about each time zone.

##### Retrieving Regulatory metadata

Any sellers doing business within an EU country or Northern Ireland, or any seller based elsewhere but shipping into these areas are subject to providing regulatory information in their eBay listings. eBay has APIs that help sellers determine if a category supports, recommends, or requires different types of regulatory information. If supported or required, regulatory metadata can be passed in when creating or revising a listing through the Trading or Inventory API.

The API methods to retrieve regulatory metadata are discussed below: 

*   Use [getRegulatoryPolicies](/api-docs/sell/metadata/resources/marketplace/methods/getRegulatoryPolicies) to determine if a category supports, recommends, or requires any regulatory policies. 

*   If hazmat information is required, use [getHazardousMaterialLabels](/api-docs/sell/metadata/resources/marketplace/methods/getHazardousMaterialsLabels) to retrieve the numeric IDs for applicable hazardous material pictograms, statements, or signal words in a specific marketplace. 
*   If product safety label information is required, use [getProductSafetyLabels](/api-docs/sell/metadata/resources/marketplace/methods/getProductSafetyLabels) to retrieve the numeric IDs for applicable Product Safety pictograms and statements for a specific marketplace. 

*   Use [getExtendedPolicyProducerResponsibilityPolicies](/api-docs/sell/metadata/resources/marketplace/methods/getExtendedProducerResponsibilityPolicies) to determine if a category supports, recommends, or requires any Extender Producer Responsibility policies.

*   If takeback policies are required, use [getCustomPolicies](/api-docs/sell/account/resources/custom_policy/methods/getCustomPolicies) to retrieve the IDs of the takeback policies defined for a seller’s account.
*   To see if an eco-participation fee can be applied at the variation level of a multi-variation listing, look for the [enabledForVariations](/api-docs/sell/metadata/resources/marketplace/methods/getExtendedProducerResponsibilityPolicies#response.extendedProducerResponsibilities.supportedAttributes.enabledForVariations) boolean field with a value of ‘true’.

##### Retrieving eBay catalog products and charitable organizations

The eBay Product Catalog is a structured database of product information that eBay uses to standardize listings. Each product in the eBay catalog is uniquely identified by an eBay product ID (ePID). When creating a listing through the eBay APIs, sellers can use a product's ePID value to automatically populate a listing with all of eBay's catalog details about the product. The more sellers adopt catalog information for their listings, the more consistent and reliable their listings will be. 

The API methods to retrieve eBay catalog products are discussed below: 

*   Use the [search](/api-docs/sell/catalog/resources/product_summary/methods/search) method of the **Catalog API** to search for and retrieve the eBay catalog product (and its associated **ePID** value) that best matches an inventory item.
*   Use [getProduct](/api-docs/sell/catalog/resources/product/methods/getProduct) to retrieve the full details of the product to confirm that it fully matches your product. 

By using the eBay Charity API, sellers can integrate charitable giving directly into their business processes, allowing them to donate a percentage of their sales to a specified nonprofit organization. In addition to helping those in need, this can enhance a seller’s reputation and appeal to buyers who are interested in supporting the specified nonprofit organization.

Sellers can use the [getCharityOrgs](/api-docs/commerce/charity/resources/charity_org/methods/getCharityOrgs) method of the Charity API to retrieve the unique identifier of a supported charity organization. This charity ID value, as well as the percentage of the purchase price that the seller chooses to donate, can then be passed in when creating or revising a listing through the Trading or Inventory API.

## Workflow Overview

![Banner image](/cms/img/sellingmetadataguide/selling-metadata-guide-workflow-new.png)

## Code Samples

## Error Handling

*   If a Taxonomy API call is failing due to an invalid category tree ID, use the [getDefaultCategoryTreeId](/api-docs/sell/taxonomy/resources/category_tree/methods/getDefaultCategoryTreeId) endpoint to retrieve the correct tree ID for the marketplace. 
*   If you receive an invalid category error, verify the value of the category ID. Some metadata endpoints only accept leaf categories. The category ID could also come from [getCategorySuggestions](/api-docs/sell/taxonomy/resources/category_tree/methods/getCategorySuggestions) or even from [GetCategories](/Devzone/XML/docs/Reference/eBay/GetCategories.html) in the Trading API. If necessary, use the [getCategorySubtree](/api-docs/sell/taxonomy/resources/category_tree/methods/getCategorySubtree) method to confirm the category is a leaf category by checking the leafCategoryTreeNode field for a boolean value of true.
*   If the API call is failing due to an invalid marketplaceId, refer to the eBay [Marketplace Ids list](/api-docs/commerce/taxonomy/static/supportedmarketplaces.html) for the correct values and ensure you pass the appropriate marketplaceId in the API request.
*   If the referenced category has been deprecated or replaced, use the [getExpiredCategories](/api-docs/sell/taxonomy/resources/category_tree/methods/getExpiredCategories) endpoint to map the old category ID to the new one. Update your listings with the new category ID returned by the API.
*   If you get an invalid format error for the [getCompatibilityPropertyValues](/api-docs/sell/taxonomy/resources/category_tree/methods/getCompatibilityPropertyValues) method, check your [compatibility\_property](/api-docs/sell/taxonomy/resources/category_tree/methods/getCompatibilityPropertyValues#uri.compatibility_property) and/or [filter](/api-docs/sell/taxonomy/resources/category_tree/methods/getCompatibilityPropertyValues#uri.filter) query parameters and check for valid syntax. 
*   For the [Metadata API](/api-docs/sell/metadata/resources/methods) methods that support one or more leaf category IDs as filters, those categories must belong to the specified marketplace or no metadata will be returned.
*   If you get an invalid format error for the [search](/api-docs/sell/catalog/resources/product_summary/methods/search) method in [Catalog API](/api-docs/sell/catalog/overview.html), check your [query parameters](/api-docs/sell/catalog/resources/product_summary/methods/search#h2-input) and check for valid syntax.

## Best Practices

*   Use [categoryTreeVersion](/api-docs/commerce/taxonomy/resources/category_tree/methods/getCategoryTree#response.categoryTreeVersion) to monitor changes in the category tree. If a new version is detected, call getCategoryTree or getCategorySubTree to fetch the updated categories.
*   Use [fetchItemAspects](/api-docs/commerce/taxonomy/resources/category_tree/methods/fetchItemAspects) to download all aspect metadata of leaf categories for a marketplace. This is particularly useful when managing large inventories or multiple categories. Note that the fetch call returns a very large gzipped binary file, which should be handled appropriately to ensure efficient processing and storage.
*   Regularly refresh category metadata such as item conditions, return policies, and compatibility aspects using methods like [getItemConditionPolicies](/api-docs/sell/metadata/resources/marketplace/methods/getItemConditionPolicies), [getReturnPolicies](/api-docs/sell/metadata/resources/marketplace/methods/getReturnPolicies), or [getAutomotivePartsCompatibilityPolicies](/api-docs/sell/metadata/resources/marketplace/methods/getAutomotivePartsCompatibilityPolicies) to ensure compliance with marketplace requirements.
*   Use the [Taxonomy SDK](https://github.com/eBay/taxonomy-sdk) to compare and validate aspect metadata retrieved from methods like fetchItemAspects or [getItemAspectsForCategory](/api-docs/sell/taxonomy/resources/category_tree/methods/getItemAspectsForCategory).
*   We suggest reading reference documentation for each method before using to discover things like OAuth token type to use, OAuth scopes required to use method, required/supported HTTP headers, and errors that may be triggered.
*   The [getItemConditionPolicies](/api-docs/sell/metadata/resources/marketplace/methods/getItemConditionPolicies) method typically requires just an application token, but a user token must be used to retrieve [Refurbished](https://www.ebay.com/sellercenter/ebay-for-business/ebay-refurbished-program) item conditions.

## Code Samples

### Retrieve Category Tree ID for US Marketplace

**Label:** Retrieve Category Tree ID for US Marketplace

#### Bash Sample

```bash
curl -X GET "https://api.ebay.com/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=EBAY_US"
-H "Authorization: Bearer OAUTH_token"
```

### Retrieve Category Subtree for Books & Magazines Categories on US Marketplace

**Label:** Retrieve Category Subtree for Books & Magazines Categories on US Marketplace

#### Bash Sample

```bash
curl -X GET "https://api.ebay.com/commerce/taxonomy/v1/category_tree/0/get_category_subtree?category_id=267"
-H "Authorization: Bearer OAUTH_token"
```

## Related Topics

- [Metadata API](/api-docs/sell/metadata/resources/methods)
- [Taxonomy API](/api-docs/sell/taxonomy/resources/methods)
- [Catalog API](/api-docs/sell/catalog/resources/methods)
- [Charity API](/api-docs/sell/charity/resources/methods)
- [GeteBayDetails API](/Devzone/XML/docs/Reference/eBay/GeteBayDetails.html)
- [GetCategoryFeatures API](/Devzone/XML/docs/Reference/eBay/GetCategoryFeatures.html)
- [Taxonomy SDK](https://github.com/eBay/taxonomy-sdk)
- [More Guides](/develop/guides)

