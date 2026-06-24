# Listing Creation

**Guide Group:** Listing Creation

---

## Overview

This guide explores various methods for creating new eBay listings. It covers creating individual listings for single-SKU products, managing listings with multiple variations (multiple-SKU), bulk listing creation, and generating listings based on existing eBay Catalog products.

Any of the following three APIs can be used to create listings:

*   [](/api-docs/sell/inventory/resources/methods)[Inventory API](/api-docs/sell/inventory/resources/methods): This REST-based API allows sellers to manage inventory locations, inventory item records, and offer objects. Once offers are published, sellers can make modular changes to either the inventory item record and/or the published offer object to push out changes to active listings.
*   [Sell Feed API](/api-docs/sell/feed/resources/methods): This REST-based API allows sellers to do a bulk upload of eBay listings using the **LMS\_ADD\_FIXED\_PRICE\_ITEM** or **LMS\_ADD\_ITEM** feed types.
*   [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting): This XML-based API allows sellers to create listings with one [AddItem](/Devzone/XML/docs/Reference/eBay/AddItem.html) or [AddFixedPriceItem](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html) call (or up to 5 listings with an [AddItems](/Devzone/XML/docs/Reference/eBay/AddItems.html) call).

## API Use Cases

[Creating a single-SKU listing](#Creating a single-SKU listing)  
[Creating a multiple-SKU listing](#Creating a multiple-SKU listing)  
[Creating listings in bulk](#Creating listings in bulk)  
[Creating listings using eBay catalog products](#Creating listings using eBay catalog products)  
[Creating listing previews for magical listings](#create-listing-previews)

##### Creating a single-SKU listing

Both the [Inventory API](/api-docs/sell/inventory/resources/methods) and the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting) can be used to create one single-SKU listing. The required steps vary with each of these APIs, so they will be covered individually below. If you’re considering a new integration, eBay recommends using Inventory API.

###### Creating a single-SKU listing with the Inventory API

The flow diagram below provides a visual representation of how to create a single-SKU eBay listing using the [Inventory API](/api-docs/sell/inventory/resources/methods):

![Banner image](/cms/img/listingcreationguide/creating-a-single-sku-listing-with-inventory-api.png)

A **location** object , an **inventory\_item** object, and an **offer** object are all required to publish a listing with the [Inventory API](/api-docs/sell/inventory/resources/methods). Users have the option of creating an **inventory\_item** object first or a **location** object first, but both are required before an **offer** object may be published. A logical flow is defined below:

1.  **Create the** **location** and [location type](/api-docs/sell/inventory/resources/location/methods/createInventoryLocation#request.locationTypes) using the [createInventoryLocation](/api-docs/sell/inventory/resources/location/methods/createInventoryLocation) method. The seller-defined identifier of the location ([merchantLocationKey](/api-docs/sell/inventory/resources/location/methods/createInventoryLocation#h2-input)) is passed in at the end of the [createInventoryLocation](/api-docs/sell/inventory/resources/location/methods/createInventoryLocation) URI. 
2.  **Define the item** using the [createOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem) method. The key fields of the **inventory\_item** object are briefly described below:

1.  **SKU**: the seller-defined stock-keeping unit ([sku](http://bulkcreateorreplaceinventoryitem)) is passed in as a path parameter.
2.  **Title and description**: the listing [title](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.title) and listing [description](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.description) are passed in under the [product](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product) container. Optionally, the seller can also define a [subtitle](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.subtitle).
3.  **Product aspects**: the [product.aspects](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.aspects) (aka item specifics) of the item are passed in as name-value pairs. 
4.  **Images**: **Images**: at least one image URL must be passed into the [product.imageUrls](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.imageUrls) array. 
5.  **Listing video**: the unique identifier of a listing video can be passed into the [product.videoIds](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.videoIds) array to attach a product video with the listing. 
6.  **Product identifiers**: the [product](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product) container is also used to provide product identifiers, such as an eBay product ID ([epid](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.epid)) or a Global Trade Item Number (GTIN) value. 
7.  **Item condition**: the [condition](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.condition) of the item is generally required in most categories. The [conditionDescription](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.conditionDescription) field is used to provide more information about a non-new item, and the [conditionDescriptors](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.conditionDescriptors) array is used to provide applicable information about Graded and Ungraded single trading cards.
8.  **Product availability**: sellers have the option of setting general [shipToLocationAvailability.quantity](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.availability.shipToLocationAvailability.quantity), location-specific [availabilityDistributions.quantity](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.availability.shipToLocationAvailability.availabilityDistributions.quantity), and/or [pickupAtLocationAvailability](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.availability.pickupAtLocationAvailability).

4.  **Define the offer** for a sku using the [createOffer](/api-docs/sell/inventory/resources/offer/methods/createOffer) method. The key fields of the [offer](/api-docs/sell/inventory/types/slr:EbayOfferDetailsWithKeys)  object are briefly described below:

1.  **SKU**: the [sku](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.sku) value is needed to specify the product that will be used in the offer.
2.  **eBay marketplace**: the [marketplaceId](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.marketplaceId) field is needed to indicate which eBay marketplace the offer will get published on. 
3.  **Format and duration**: the listing [format](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.format) can be set to AUCTION or FIXED\_PRICE. 
4.  **Item location**: the [merchantLocationKey](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.merchantLocationKey) field defines the location of the item. 
5.  **eBay and store categories**: the listing category (aka leaf category) is set in the [categoryId](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.categoryId) field. Optionally, the seller can select a [secondaryCategoryId](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.secondaryCategoryId), and eBay store owners can use the [storeCategoryNames](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.storeCategoryNames) array to organize the offer into one or two custom store categories.   
6.  **Prices**: the price for a fixed-price listing will be specified in the [pricingSummary.price](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.pricingSummary.price) and the starting bid price for an auction listing will be specified in the [pricingSummary.auctionStartPrice](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.pricingSummary.auctionStartPrice). If you want to enable an auction listing with the **Buy It Now** option, you can also include the [pricingSummary.price](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.pricingSummary.price), and prospective buyers can pay this price and get the item before any active bidding begins. Sellers can also set an optional [pricingSummary.auctionReservePrice](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.pricingSummary.auctionReservePrice) for auction listings. 
7.  **Available quantity**: the available quantity of the item is set through the [availableQuantity](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.availableQuantity) field, but if this field is omitted the general quantity or location-specific quantity that is set in the **inventory item** object will be used instead. 
8.  **Listing description**: the listing description is set through the [listingDescription](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingDescription) field, but if this field is omitted, the text in the [product.description](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.description) field of the **inventory item** object is used instead.
9.  **Business policies**: the [Inventory API](/api-docs/sell/inventory/resources/methods) requires that business policies are used, so the [paymentPolicyId](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingPolicies.paymentPolicyId), the [returnPolicyId](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingPolicies.returnPolicyId), and the [fulfillmentPolicyId](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingPolicies.fulfillmentPolicyId) fields must be included to specify which payment, return policy, and fulfillment business policies are used for the listing.
10.  **Regulatory information**: use the [regulatory](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.regulatory) container to provide regulatory information as needed, including the product’s [manufacturer](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.regulatory.manufacturer) or  [responsiblePersons](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.regulatory.responsiblePersons) contact information, [hazmat](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.regulatory.hazmat) information, [productSafety](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.regulatory.productSafety) information, [energyEfficiencyLabel](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.regulatory.energyEfficiencyLabel) information, or [documents](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.regulatory.documents). 
11.  **Custom policies**: use the [listingPolicies.productCompliancePolicyIds](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingPolicies.productCompliancePolicyIds) array, the [regionalProductCompliancePolicies.countryPolicies.policyIds](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingPolicies.regionalProductCompliancePolicies.countryPolicies.policyIds) array, the [regionalTakeBackPolicies.countryPolicies.policyIds](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingPolicies.regionalTakeBackPolicies.countryPolicies.policyIds) array, or the [listingPolicies.takeBackPolicyId](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingPolicies.takeBackPolicyId) field to set global or country-specific takeback or product compliance policies.
12.  **Best Offers**: optionally, use the [bestOfferTerms](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingPolicies.bestOfferTerms) container if you would like to accept Best Offers from buyers. 
13.  **Charitable listings**: optionally, use the [charity](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.charity) container to donate a percentage of the proceeds for each sale to a registered non-profit organization. 

6.  Pass in the unique identifier of an offer through a path parameter in the [publishOffer](/api-docs/sell/inventory/resources/offer/methods/publishOffer) method to publish an offer. Successful publish offer calls will return the [listingId](/api-docs/sell/inventory/resources/offer/methods/publishOffer#response.listingId) for the newly active listing. 

###### Creating a single-SKU listing with the Trading API

Single-SKU listings can be created with the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting) using [AddItem](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html), [AddFixedPriceItem](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html), or  [AddItems](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItems.html) calls. [AddItem](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html) supports all listing types. As its name suggests, [AddFixedPriceItem](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html) only supports fixed price listings. The interface for [AddItems](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItems.html) is the same as [AddItem](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html), but supports up to five new listings being defined in one request payload.

In addition to the three calls mentioned above, there is also a [VerifyAddItem](/Devzone/XML/docs/Reference/eBay/VerifyAddItem.html) call and a [VerifyAddFixedPriceItem](/Devzone/XML/docs/Reference/eBay/VerifyAddFixedPriceItem.html) call that can be used as test calls for [AddItem](/Devzone/XML/docs/Reference/eBay/AddItem.html) and [AddFixedPriceItem](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html), respectively. The payloads, logic, validation checks, and errors/warnings are identical with the [VerifyAddItem](/Devzone/XML/docs/Reference/eBay/VerifyAddItem.html) and [VerifyAddFixedPriceItem](/Devzone/XML/docs/Reference/eBay/VerifyAddFixedPriceItem.html) calls, and the only difference is that the ‘Verify’ versions will not actually publish the listing or incur fees. 

Lots of fields must be defined in a listing, and the process below walks you through in a logical order. Note that [AddItem](/Devzone/XML/docs/Reference/eBay/AddItem.html) links are used, but the information also applies to [AddFixedPriceItem](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html) and [AddItems](/Devzone/XML/docs/Reference/eBay/AddItems.html).

1.  Configure the **marketplace-specific information** and provide the location of the item. The fields used for this are briefly covered below: 

1.  **eBay marketplace:** specify the eBay marketplace where the listing will be published. This can be done with **X-EBAY-API-SITEID** HTTP header or with the [Site](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Site) field. Note that the header will require a numeric site ID that maps to the eBay marketplace, but the [Site](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Site) field requires an enumeration value. Both marketplace enumeration values and site IDs can be found in the [SiteCodeType](/Devzone/XML/docs/Reference/eBay/types/SiteCodeType.html) definition.
2.  **Item location**: the [Country](/devzone/xml/docs/Reference/eBay/AddItem.html#Request.Item.Country) field is required, and then the seller has an option of providing the [PostalCode](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.PostalCode) field, or they can provide the city and state through the [Location](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Location) field.
3.  **Currency**: the [Currency](/devzone/xml/docs/Reference/eBay/AddItem.html#Request.Item.Currency) is also needed, and it should be the standard currency used on the specified eBay marketplace.
4.  **eBay and store categories**: the listing category (aka leaf category) is set in the [PrimaryCategory.CategoryID](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.PrimaryCategory.CategoryID) field. Optionally, the seller can select a [SecondaryCategory.CategoryID](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.SecondaryCategory.CategoryID), and eBay store owners can use the [Storefront](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Storefront) container to organize the listing into one or two custom store categories.   
5.  **Local listing distance**: if the seller is selling a motor vehicle through an eBay Motors [Local Market listing](/api-docs/user-guides/static/trading-user-guide/ebay-motors-local-markets.html), the [ListingDetails.LocalListingDistance](/devzone/xml/docs/Reference/eBay/AddItem.html#Request.Item.ListingDetails.LocalListingDistance) field can be used to set the radius of the area (in miles) in which the vehicle will be available and exposed to interested local buyers.

3.  Configure the **details of the item**. The key fields are briefly covered below:: 

1.  **Title and description**: define the [Title](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Title) and [Description](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Description). Optionally, you can include a [SubTitle](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.SubTitle) or a [SellerProvidedTitle](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.SellerProvidedTitle) (motor vehicle equivalent of a Subtitle). 
2.  **Item condition**: the condition of the item is generally required in most categories, and the Trading API uses the [ConditionID](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ConditionID) field to set the item’s condition. The [ConditionDescription](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ConditionDescription) field can be used to provide detailed information about non-new items, and the [ConditionDescriptors](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ConditionDescriptors) container must be used to provide applicable information about Graded and Ungraded single trading cards.
3.  **Product aspects**: provide product aspects (aka item specifics) name-value pairs for the item using [ItemSpecifics.NameValueList](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ItemSpecifics.NameValueList) containers.
4.  **Images**: at least one image URL must be provided through the [PictureDetails.PictureURL](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.PictureDetails.PictureURL) array. 
5.  **Listing video**: the unique identifier of a listing video can be passed into the [VideoDetails.VideoID](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.VideoDetails.VideoID) field to associate a product video with the listing. 
6.  **Product identifiers**: the [ProductListingDetails](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ProductListingDetails) container is used to provide product identifiers such as an eBay product ID (ePID) or Global Trade Item Number (GTIN) values. 

5.  Configure the **offer details and features**. The key fields are briefly covered below: 

1.  **Format and duration**: the [ListingType](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ListingType) field sets the listing format and the [ListingDuration](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ListingDuration) field sets the listing duration. 
2.  **Prices**: the price for a fixed-price listing will be specified in the [BuyItNowPrice](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.BuyItNowPrice) field, and the starting bid price for an auction listing will be specified in the  [StartPrice](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.StartPrice) field. If you want to enable an auction listing with the **Buy It Now** option, you can also include the [BuyItNowPrice](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.BuyItNowPrice) field, and prospective buyers can pay this price and get the item before any active bidding begins. Sellers can also set an optional [ReservePrice](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ReservePrice) for auction listings. 
3.  **Available quantity**: the available quantity of the item is set through the [Quantity](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Quantity) field. 
4.  **Business policies**: the use of business policies with the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html) are optional. If the seller’s account is opted in to Business Policies, then the seller must use the [SellerProfiles](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.SellerProfiles) container to specify which payment, return policy, and shipping/fulfillment business policies to use for the listing. If the seller’s account is opted out of Business Policies, listing-level payment, return policy, and shipping fields are used instead of Business Policies.
5.  **Payment information**: if a seller is not using Business Policies, they should include the [AutoPay](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.AutoPay) field set to true to receive immediate payment (when applicable) from buyers. One or more [PaymentMethods](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.PaymentMethods) fields will only be needed for listings that support offline payments. 
6.  **Motor vehicle payment details**: For motor vehicle listings requiring a down payment, the seller uses the [PaymentDetails](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.PaymentDetails) container to specify the amount of the down payment, when it’s due, and when the balance of the car sales price is expected from the buyer.
7.  **Return Policy**: if a seller is not using Business Policies, they should include the [ReturnPolicy](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ReturnPolicy) container to provide details of the item’s return policy. Note that not accepting returns is still considered a ‘return policy’, and return policies are needed for most eBay categories.
8.  **Shipping information**: if a seller is not using Business Policies, they will need to provide their shipping information through the [ShippingDetails](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ShippingDetails) container and other shipping-related fields. Shipping and fulfillment is covered in detail in **Step 4**.
9.  **Regulatory information**: use the [Regulatory](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Regulatory) container to provide regulatory information as needed, including the product’s [Manufacturer](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Regulatory.Manufacturer) or  [ResponsiblePerson](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Regulatory.ResponsiblePersons.ResponsiblePerson) contact information, [Hazmat](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Regulatory.Hazmat) information, [ProductSafety](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Regulatory.ProductSafety) information, [EnergyEfficiencyLabel](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Regulatory.EnergyEfficiencyLabel) information, or [Documents](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Regulatory.Documents). 
10.  **Custom policies**: use the [CustomPolicies](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.CustomPolicies) container to set global or country-specific takeback or product compliance policies.
11.  **Best Offers**: optionally, include the [BestOfferDetails.BestOfferEnabled](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.BestOfferDetails.BestOfferEnabled) field and set it to true if you would like to accept Best Offers from buyers. You can also use the [ListingDetails.BestOfferAutoAcceptPrice](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ListingDetails.BestOfferAutoAcceptPrice) and/or [ListingDetails.MinimumBestOfferPrice](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ListingDetails.MinimumBestOfferPrice) fields to set price thresholds for automatically accepting or rejecting Best Offers based on the price.
12.  **Charitable listings**: optionally, use the [Charity](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Charity) container to donate a percentage of the proceeds for each sale to a registered non-profit organization. 

7.  Configure the **details of shipping/fulfillment**. These fields are required if the seller is not using Business Policies. The key fields are briefly covered below:

1.  **Handling time**: use the [DispatchTimeMax](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.DispatchTimeMax) field to set the number of business days that the seller commits to shipping out the item after the buyer’s payment clears. Typically values are 0, 1, and 2. If the seller commits to same-day shipping, items must be shipped out that same business day as long as the buyer’s payment cleared before the cutoff time for that business day.
2.  **Shipping service options**: a [ShippingServiceOptions](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ShippingDetails.ShippingServiceOptions) container is used for each available domestic shipping service option and an [InternationalShippingServiceOption](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ShippingDetails.InternationalShippingServiceOption) container is used for each available international shipping service option. Up to four domestic and five international shipping service options may be specified. If flat-rate shipping is used and no shipping rate table is being used, the cost for each shipping service is also supplied in these containers.
3.  **Motor vehicle fulfillment**: the [BuyerResponsibleForShipping](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.BuyerResponsibleForShipping) field is used for motor vehicle listings and, in most cases, it is set to true, which means that the buyer is responsible for picking up the vehicle or arranging a third-party freight shipping service.
4.  **Package handling costs**: the [ShippingDetails.CalculatedShippingRate](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ShippingDetails.CalculatedShippingRate) container is only used if the seller will be charging the buyer domestic or international package handling charges, and only if the seller is using calculated shipping for domestic and/or international shipping.
5.  **Ship-to and excluded shipping locations**: the [ShipToLocations](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ShipToLocations) and   [ShippingDetails.ExcludeShipToLocation](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ShippingDetails.ExcludeShipToLocation) fields are used in tandem to specify where the seller ships to and where the seller does not ship to. For example, a seller may ship to a lot of geographical regions and countries within those regions, but does not ship everywhere. That seller might use a **<ShiptoLocations>** field and set value to Worldwide, but would then also include **<ExcludeShipToLocation>** fields and perhaps set values to Africa and Central America and Caribbean. 
6.  **Shipping Discount Profiles**: the [InternationalPromotionalShippingDiscount](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ShippingDetails.InternationalPromotionalShippingDiscount), [InternationalShippingDiscountProfileID](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ShippingDetails.InternationalShippingDiscountProfileID), [PromotionalShippingDiscount](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ShippingDetails.PromotionalShippingDiscount), and [ShippingDiscountProfileID](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ShippingDetails.ShippingDiscountProfileID) fields are used to apply shipping discounts to the listing. Shipping discounts are set up under the **Marketing** tab of **Seller Hub** or through the [SetShippingDiscountProfiles](/DevZone/XML/docs/Reference/eBay/SetShippingDiscountProfiles.html#SetShippingDiscountProfiles) call of **Trading API**.
7.  **Shipping rate tables**: the [RateTableDetails](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ShippingDetails.RateTableDetails) container can be used to apply a domestic and/or international shipping rate table to the listing to control flat-rate shipping costs. See the [Using shipping rate tables](https://www.ebay.com/help/selling/shipping-items/using-shipping-rate-tables?id=5459) help topic for more information. 
8.  **Shipping package details**: the [ShippingPackageDetails](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ShippingPackageDetails) container is used to provide the type, weight, and dimensions of a shipping package. 
9.  **Shipping business policy cost overrides**: the [ShippingServiceCostOverrideList](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ShippingServiceCostOverrideList) container is used if the seller is using business policies, but wants to override the costs of one or more domestic and/or international shipping service options. If the seller is not using business policies, this container is not applicable. 

9.  Publish the listing by running the call. A successful call will return the [ItemID](/Devzone/XML/docs/Reference/eBay/AddItem.html#Response.ItemID) for the newly active listing and any listing-related fees applied against the listing.

##### Creating a multiple-SKU listing

A multiple-variation listing (aka multiple-SKU listing) is an eBay listing that contains multiple variations of the same item. For example, a seller might sell the same type of t-shirt in multiple color and size combinations. 

Both the [Inventory API](/api-docs/sell/inventory/resources/methods) and the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting) can be used to create a multiple-SKU listing. The required steps vary with each of these APIs, so they will be covered individually below.

###### Creating a multiple-variation listing with the Inventory API

The flow diagram below provides a visual representation of how to create a multiple-SKU eBay listing using the [Inventory API](/api-docs/sell/inventory/resources/methods):

![Banner image](/cms/img/listingcreationguide/creating-a-multiple-variation-listing-with-the-inventory-api.png)

Here are the necessary steps to take in the [Inventory API](/api-docs/sell/inventory/resources/methods) to create a multiple-variation listing: 

1.  Use the [createOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem) or [bulkCreateOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem) method to create a separate **inventory item** object for each SKU that will go into the **inventory item group** object and become variations within the multiple-variation listing. Please adhere to the following when creating each **inventory item** object:  
    
    aspects": {
    	"Color": \["Blue"\],
    	"Size": \["Large"\]
     }
    

1.  In the [product.aspects](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.aspects) field, provide only the unique aspect(s) for that particular SKU. The common aspects for the **inventory item group** will be set in the [createOrReplaceInventoryItemGroup](/api-docs/sell/inventory/resources/inventory_item_group/methods/createOrReplaceInventoryItemGroup) method. So, if the SKU was a _Large_, _Blue_ t-shirt, the aspects field might look like this:
2.  You can set the [product.title](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.title) and [product.description](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.description) for **inventory item** objects, but the equivalent fields in the **inventory item group** object are what will actually be used in the eBay listing.
3.  Ideally, any image provided through the [product.imageUrls](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.imageUrls) array should reflect a unique aspect of that particular variation. Often, the provided image will demonstrate the color of that particular variation.
4.  An eBay listing can only have a maximum of one product video, so it is recommended that the [product.videoIds](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.videoIds) field of the **inventory item** object not be used, as it can be set in the **inventory item group** object instead.

2.  Use the [createOffer](/api-docs/sell/inventory/resources/offer/methods/createOffer) or [bulkCreateOffer](/api-docs/sell/inventory/resources/offer/methods/bulkCreateOffer) to create **offer** objects for each SKU in the **inventory item group**. Please adhere to the following when creating each **offer** object:

1.  The [categoryId](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.categoryId) value should be the same for all SKUs, since they will be in the same eBay listing. 
2.  The [format](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.format) value must be set to FIXED\_PRICE for all SKUs. 
3.  The [listingDuration](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingDuration) value must be set to GTC for all SKUs. 
4.  The same payment ([paymentPolicyId](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingPolicies.paymentPolicyId)), return ([returnPolicyId](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingPolicies.returnPolicyId)), and fulfillment ([fulfillmentPolicyId](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.listingPolicies.fulfillmentPolicyId)) business policies should be used for all SKUs.
5.  The [pricingSummary.price](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.pricingSummary.price) value can be the same for all SKUs, but it is also allowed for variations in the same listing to have slightly different prices.

3.  Use the [createOrReplaceInventoryItemGroup](/api-docs/sell/inventory/resources/inventory_item_group/methods/createOrReplaceInventoryItemGroup) method to create and configure the **inventory item group** object. Please adhere to the following when creating the **inventory item group** object:  
    1.  The **inventory item group** object is named by passing in a seller-defined name at the end of the [createOrReplaceInventoryItemGroup](/api-docs/sell/inventory/resources/inventory_item_group/methods/createOrReplaceInventoryItemGroup) URI.
    2.  Use the [variantSKUs](/api-docs/sell/inventory/resources/inventory_item_group/methods/createOrReplaceInventoryItemGroup#request.variantSKUs) array to define each SKU that will belong to the **inventory item group** and will become a variation within the resultant multiple-variation listing.
    3.  Use the [aspects](/api-docs/sell/inventory/resources/inventory_item_group/methods/createOrReplaceInventoryItemGroup#request.aspects) field to define all common product aspects for the **inventory item group**. Remember that the unique or “pivoting” aspects for each variation is actually defined in the **inventory item** objects.
    4.  In the [variesBy.specifications](/api-docs/sell/inventory/resources/inventory_item_group/methods/createOrReplaceInventoryItemGroup#request.variesBy.specifications) array, you will define the “pivoting” aspect(s), and all aspect values that are covered by SKUs within the **inventory item group**. For example, if the variations varied by color and by size, you would have two  [variesBy.specifications.name](/api-docs/sell/inventory/resources/inventory_item_group/methods/createOrReplaceInventoryItemGroup#request.variesBy.specifications.name) fields, with one set to “Color” and the other set to “Size”, and then the corresponding [variesBy.specifications.values](/api-docs/sell/inventory/resources/inventory_item_group/methods/createOrReplaceInventoryItemGroup#request.variesBy.specifications.values) arrays would have all of the available colors and sizes available through SKUs in that **inventory item group**.
    5.  The [variesBy.aspectsImageVariesBy](/api-docs/sell/inventory/resources/inventory_item_group/methods/createOrReplaceInventoryItemGroup#request.variesBy.aspectsImageVariesBy) field is used if the seller wants to provide images for each SKU that demonstrate how each SKU varies. Commonly, this field’s value is set to “Color”, and then at least one image is provided for each SKU in the **inventory item group** that demonstrates the color of the SKU.
4.  Use the [publishOfferByInventoryItemGroup](/api-docs/sell/inventory/resources/offer/methods/publishOfferByInventoryItemGroup) method to publish the multiple-variation listing. If the multiple-SKU listing is successfully published, the [listingId](/api-docs/sell/inventory/resources/offer/methods/publishOfferByInventoryItemGroup#response.listingId) for the newly active listing will be returned in the response.

###### Creating a multiple-variation listing with the Trading API

The [AddFixedPriceItem](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html) call must be used to create a multiple-variation listing in the [Trading API](/Devzone/XML/docs/Reference/eBay/index.html). In addition to following the general guidelines to create a single-SKU fixed price listing in the [Trading API](/Devzone/XML/docs/Reference/eBay/index.html), set the [AddFixedPriceItem](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html) request payload as follows:

1.  A [Variations.Variation](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Variations.Variation) node will be needed for each variation that will be part of the listing. Below are some details on setting up this container:

1.  Provide the unique (or pivoting) aspects for each variation through the [Variation.VariationSpecifics](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Variations.Variation.VariationSpecifics) containers. For example, variations may vary be color and size, so one [VariationSpecifics.NameValueList.Name](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Variations.Variation.VariationSpecifics.NameValueList.Name) field value would be ‘Color’ and one would be ‘Size’, with the actual ‘Color’ and ‘Size’ values for each variation appearing in the corresponding [VariationSpecifics.NameValueList.Value](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Variations.Variation.VariationSpecifics.NameValueList.Value) fields. Common product aspects (aka item specifics) for all variations are specified through the [ItemSpecifics](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.ItemSpecifics) container.
2.  Provide the quantity and price of each variation through the [Variation.Quantity](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Variations.Variation.Quantity) and [Variation.StartPrice](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Variations.Variation.StartPrice) fields. The [Item.Quantity](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Quantity) and [Item.StartPrice](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.StartPrice) fields should NOT be used for multiple-varation listings.
3.  Provide the [Variation.SKU](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Variations.Variation.SKU) for each variation. Note that if this field is not used, eBay will automatically generate a SKU value for each variation based on its unique aspects (e.g. ‘Blue, Large’). 
4.  Use the [VariationProductListingDetails](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Variations.Variation.VariationProductListingDetails) container to provide an eBay product ID (ePID) or a Global Trade Item Number for a SKU 

3.  In the [Variations.VariationSpecificsSet](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Variations.VariationSpecificsSet) container, you will define the “pivoting” aspect(s), and all aspect values that are covered by SKUs that will be in the listing. For example, if the variations varied by color and by size, you would have two  [VariationSpecificsSet.NameValueList.Name](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Variations.VariationSpecificsSet.NameValueList.Name) fields, with one set to “Color” and the other set to “Size”, and then the corresponding [VariationSpecificsSet.NameValueList.Value](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Variations.VariationSpecificsSet.NameValueList.Value) fields would have all of the available colors and sizes available through SKUs in the listing.
4.  The [Variations.Pictures](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Variations.Pictures) container is used if the seller wants to provide images for each SKU that demonstrate how each SKU varies. Commonly, the [Variations.Pictures.VariationSpecificName](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Variations.Pictures.VariationSpecificName) field’s value is set to ‘Color’, and then the [Variations.Pictures.VariationSpecificPictureSet](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Variations.Pictures.VariationSpecificPictureSet) container is used to provide one or more picture URLs that demonstrates each unique color of SKUs in the listing.
5.  Run the [AddFixedPriceItem](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#AddFixedPriceItem) call to publish the multiple-variation listing. A successful call will return the [ItemID](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Response.ItemID) for the newly active listing and any listing-related fees applied against the listing.  
    

##### Creating listings in bulk

Both the [Inventory API](/api-docs/sell/inventory/resources/methods) and the [Sell Feed API](/api-docs/sell/feed/overview.html) support bulk listing creation. The required steps vary with each of these APIs, so they will be covered individually below.

###### Creating listings in bulk with the Inventory API

The flow diagram below provides a visual representation of how to create up to 25 new listings using three bulk methods of the [Inventory API](/api-docs/sell/inventory/resources/methods):

![Banner image](/cms/img/listingcreationguide/creating-listings-in-bulk-with-inventory-api.png)

Here are the necessary steps to take in the [Inventory API](/api-docs/sell/inventory/resources/methods) to create up to 25 listings using three bulk methods:

1.  Use the [bulkCreateOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem) method to define up to 25 inventory item records. The payload for this method is identical to the [createOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem) method except up to 25 inventory item records can be created instead of just one, and the [requests.sku](/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem#request.requests.sku) field is specified in the request payload for each inventory item record instead of the sku value being a path parameter like in the [createOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem) method.
2.  Use the [bulkCreateOffer](/api-docs/sell/inventory/resources/offer/methods/bulkCreateOffer) method to define up to 25 offers for 25 SKUs. The payload for this method is identical to the [createOffer](/api-docs/sell/inventory/resources/offer/methods/createOffer) method except up to 25 offers can be created instead of just one, and the [requests.sku](/api-docs/sell/inventory/resources/offer/methods/bulkCreateOffer#request.requests.sku) field is specified in the request payload for each offer instead of the sku value being a path parameter like in the [createOffer](/api-docs/sell/inventory/resources/offer/methods/createOffer) method.
3.  Use the [bulkPublishOffer](/api-docs/sell/inventory/resources/offer/methods/bulkPublishOffer) method to publish up to 25 offers for 25 SKUs. The payload for this method is identical to the [publishOffer](/api-docs/sell/inventory/resources/offer/methods/publishOffer) method except up to 25 offers can be published instead of just one, and each [requests.offerId](/api-docs/sell/inventory/resources/offer/methods/bulkPublishOffer#request.requests.offerId) value is specified in the request payload for each offer instead of the offer\_id value being a path parameter like in the [publishOffer](/api-docs/sell/inventory/resources/offer/methods/publishOffer) method. For each offer that is successfully published, a separate [listingId](/api-docs/sell/inventory/resources/offer/methods/bulkPublishOffer#response.responses.listingId) field will be returned in response.
    
    These three Bulk APIs work synchronously and the returned HTTP status code will vary as shown below: 
    
    *   **200 OK**: all of the inventory items or offers in the request payload were successfully created, or the offers were successfully published as eBay listings. 
    *   **207 Multi-status**: some inventory items or offers in the request payload were successfully created, or some offers were successfully published as eBay listings. The [statusCode](/api-docs/sell/inventory/resources/offer/methods/bulkPublishOffer#response.responses.statusCode) field in the response will indicate which objects failed.
    *   **400 Bad Request**: this status code indicates that the request fully failed due to invalid or missing data.
    

###### Creating listings in bulk with the Sell Feed API

The [Sell Feed API](/api-docs/sell/feed/static/overview.html) lets sellers upload and download various feed files and reports. The two feed types used for bulk listing creation are **LMS\_ADD\_ITEM** and **LMS\_ADD\_FIXED\_PRICE\_ITEM**. The size limitation for these feed files is 15 MB, and the files are processed asynchronously by eBay. The status of all upload tasks are tracked with a unique 'task ID'. 

The flow diagram below provides a visual representation of how to create multiple new listings using the [Sell Feed API](/api-docs/sell/feed/resources/methods):

![Banner image](/cms/img/listingcreationguide/create-listings-in-bulk-with-the-sell-feed-api.png)

Here are the necessary steps to take in the [Sell Feed API](/api-docs/sell/feed/resources/methods) to create multiple listings:

1.  Stage the task using the [createTask](/api-docs/sell/feed/resources/task/methods/createTask) method. Use the **X-EBAY-C-MARKETPLACE-ID** header to set the listing marketplace, and set the [feedType](/api-docs/sell/feed/resources/task/methods/createTask#request.feedType) value in the request payload to either **LMS\_ADD\_ITEM** or **LMS\_ADD\_FIXED\_PRICE\_ITEM. LMS\_ADD\_FIXED\_PRICE\_ITEM** must be used if you will be creating multiple-variation listings. If the call is successful, the **getTask** URI for the task is returned in the Location response header.
2.  Use the [getTask](/api-docs/sell/feed/resources/task/methods/getTask) method to check the status of the task. The value returned in the [status](/api-docs/sell/feed/resources/task/methods/getTask#response.status) field should be CREATED. Proceed to the next step if you see this value.
3.  Use the [uploadFile](/api-docs/sell/feed/resources/task/methods/uploadFile) method to upload the **LMS\_ADD\_ITEM** or **LMS\_ADD\_FIXED\_PRICE\_ITEM** feed file.The same task ID returned in [createTask](/api-docs/sell/feed/resources/task/methods/createTask) method is used as a path parameter for this method. The [uploadFile](/api-docs/sell/feed/resources/task/methods/uploadFile) method does not have a request payload, but you will be uploading an XML data file. See the [uploadFile reference documentation](/api-docs/sell/feed/resources/task/methods/uploadFile) and/or the [Create the data file](/api-docs/sell/static/feed/lms-feeds-working-with-lms.html#create-the-data-file) topic for more details on how to create and upload the XML file. If the [uploadFile](/api-docs/sell/feed/resources/task/methods/uploadFile) call is successful, an HTTP status code of 202 Accepted should be returned. Uploaded files are processed asynchronously, so it may take some time to process the file based on the size of the file.
4.  Run another [getTask](/api-docs/sell/feed/resources/task/methods/getTask) method (using the same task ID) to check status. This time, you will want to see a value of COMPLETED or COMPLETED\_WITH\_ERROR. COMPLETED is preferable over COMPLETED\_WITH\_ERROR, as the latter generally indicates that one or more listings were not created successfully. Also check the [uploadSummary](/api-docs/sell/feed/resources/task/methods/getTask#response.uploadSummary) container. If all listings were successfully uploaded, you should see a value of 0 in the [uploadSummary.failureCount](/api-docs/sell/feed/resources/task/methods/getTask#response.uploadSummary.failureCount) field.
5.  Use the [getResultFile](/api-docs/sell/feed/resources/task/methods/getResultFile) method (using the same task ID as a path parameter) to retrieve the file that indicates the results of the listings creation task. A completely successful task should show item ID values for the newly created listings. For any listings that were not created successfully, you should see an Errors container that may indicate the issue(s) with one or more listings.

##### Creating listings using eBay catalog products

If creating a listing for a commercial product, it is quite possible that eBay may have this same product defined in their product catalog. If this is the case, the seller can provide an eBay product ID (ePID) or a Global Trade Identifier Number (GTIN) value that can be matched to a specific eBay catalog product, and eBay will prefill the listing using details of that catalog product, including the product’s title, description, aspect name-value pairs, and stock photo. eBay will also put this product into the correct eBay leaf category. 

Both the [Inventory API](/api-docs/sell/inventory/resources/methods) and the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting) can be used to adopt eBay catalog products to create listings. The required steps vary with each of these APIs, so they will be covered individually below.

###### Adopting eBay catalog products using the Inventory API

The flow diagram below provides a visual representation of how to find and use eBay catalog products to create listings using the [Inventory API](/api-docs/sell/inventory/resources/methods):

![Banner image](/cms/img/listingcreationguide/adopting-ebay-catalog-products-using-inventory-api.png)

Here are the necessary steps to take in the [Inventory API](/api-docs/sell/inventory/resources/methods) to create a listing based on an eBay catalog product:

1.  (Optional, but recommended) Use the [search](/api-docs/sell/catalog/resources/product_summary/methods/search) method of the [Catalog API](/api-docs/sell/catalog/overview.html) if you would like to check first if a matching eBay catalog product exists for your product. This method has a number of filters available, but two common ways to search for a matching product is to provide your product name through the [q](/api-docs/sell/catalog/resources/product_summary/methods/search#uri.q) query parameter, or to provide a UPC, ISBN, or EAN value through the [gtin](/api-docs/sell/catalog/resources/product_summary/methods/search#uri.gtin) query parameter. It is possible that your search may return multiple eBay catalog products, especially if the [q](/api-docs/sell/catalog/resources/product_summary/methods/search#uri.q) query parameter is used instead of a GTIN value, so you will need to examine the details of the product that is returned under the [productSummaries](/api-docs/sell/catalog/resources/product_summary/methods/search#response.productSummaries) array. If the catalog product seems to be an exact match for your product, proceed to step 2.
2.  Use the [product](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product) container of the [createOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem) or [bulkCreateOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem) methods to identify the product using either an [epid](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.epid) (best) value, a [upc](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.upc) value, an [ean](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.ean) value, an [isbn](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.isbn) value, or a [brand](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.brand)/[mpn](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.mpn) pair. When creating a listing for a new item based on an eBay catalog product, you should not provide any other information under the [product](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product) container, including the [title](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.title), [description](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.description), or [aspects](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.aspects), as this data will come from the eBay catalog product. However, if the item is used or if it has been modified at all, you will probably want to add your own photos of the actual item through the [imageUrls](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.imageUrls) array, and you may want to modify the [description](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.description) to reflect details of the actual item. 
3.  When creating the offer for the inventory item using the [createOffer](/api-docs/sell/inventory/resources/offer/methods/createOffer) or [bulkCreateOffer](/api-docs/sell/inventory/resources/offer/methods/bulkCreateOffer) methods, the [includeCatalogProductDetails](/api-docs/sell/inventory/resources/offer/methods/createOffer#request.includeCatalogProductDetails) field must be included and set to true in order for eBay to pre-fill catalog product details for the **inventory item** and **offer** objects.
4.  Use [getInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItem) and [getOffer](/api-docs/sell/inventory/resources/offer/methods/getOffer) methods to check the inventory item and **offer** objects before publishing the offer. Use [createOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem) to make any adjustments to the inventory item and/or use [updateOffer](/api-docs/sell/inventory/resources/offer/methods/updateOffer) to make any adjustments to the offer.
5.  Use [publishOffer](/api-docs/sell/inventory/resources/offer/methods/publishOffer) to publish the listing.

**Note**: eBay catalog products can also be used for multiple-variation listings, so the same process would be followed above, but you would just need to follow the same steps for each inventory item and each **offer** object.

###### Adopting eBay catalog products using the Trading API

Here are the necessary steps to take in the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting) to create a listing based on an eBay catalog product:

1.  (Optional, but recommended) Use the [search](/api-docs/sell/catalog/resources/product_summary/methods/search) method of the [Catalog API](/api-docs/sell/catalog/overview.html) if you would like to check first if a matching eBay catalog product exists for your product. This method has a number of filters available, but two common ways to search for a matching product is to provide your product name through the [q](/api-docs/sell/catalog/resources/product_summary/methods/search#uri.q) query parameter, or to provide a UPC, ISBN, or EAN value through the [gtin](/api-docs/sell/catalog/resources/product_summary/methods/search#uri.gtin) query parameter. It is possible that your search may return multiple eBay catalog products, especially if the [q](/api-docs/sell/catalog/resources/product_summary/methods/search#uri.q) query parameter is used, so you will need to examine the details of the product that is returned under the [productSummaries](/api-docs/sell/catalog/resources/product_summary/methods/search#response.productSummaries) array. If the catalog product seems to be an exact match for your product, proceed to step 2.
2.  Use the [ProductListingDetails](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ProductListingDetails) container of the [AddItem](https://developer.ebay.com/devzone/xml/docs/Reference/eBay/AddItem.html#AddItem) and [AddFixedPriceItem](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#AddFixedPriceItem) calls to identify the eBay catalog product using either a [ProductReferenceID](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ProductListingDetails.ProductReferenceID) (ePID) value, a [UPC](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ProductListingDetails.UPC) value, an [EAN](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ProductListingDetails.EAN) value, an [ISBN](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ProductListingDetails.ISBN) value, or a [BrandMPN](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ProductListingDetails.BrandMPN) pair. When creating a listing for a new item based on an eBay catalog product, you should not provide any of the following information in the Add call, as this information will be picked up from the catalog product:  
    1.  [Title](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Title)
    2.  [Description](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Description)
    3.  [ItemSpecifics](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ItemSpecifics)

However, if the item is used or if it has been modified at all, you will probably want to add your own photos of the actual item through the [PictureDetails](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.PictureDetails) container, and you may want to modify the [Description](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.Description) to reflect details of the actual item. 

3.  Once you publish the listing by running the Add call, you may want to call [GetItem](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/GetItem.html#GetItem) to validate that the listing appears as expected.

**Note**: eBay catalog products can also be used for multiple-variation listings, so a similar process would be followed, but with the following exceptions: 1) The [AddFixedPriceItem](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#AddFixedPriceItem) call has to be used since the [AddItem](https://developer.ebay.com/devzone/xml/docs/Reference/eBay/AddItem.html#AddItem) call does not support multiple-variation listings, and 2) ePIDs or GTINs for each variation are passed in at the variation level through the [Variation.VariationProductListingDetails](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#Request.Item.Variations.Variation.VariationProductListingDetails) container instead of the [ProductListingDetails](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ProductListingDetails) container.

##### Creating listing previews for magical listings

The **[Inventory Mapping API](/develop/api/sell/inventory_mapping)**, based on GraphQL, helps sellers create high-quality listings with AI-powered recommendations generated from their existing product data. This API allows sellers and third-party partners to use existing product data to create eBay listing previews, which are then used to create listings through eBay's Listing APIs. The flow diagram below illustrates how to generate listing previews and the subsequent step of creating listings using other eBay APIs.

**Important:** A listing preview is not a draft or a live listing. It is information generated from external product details that sellers can use to create a listing in a subsequent step. Sellers are expected to review the output of this data before creating listings using other eBay APIs.

![Banner image](/cms/img/listingcreationguide/inventory-mapping-overview-flow.svg)

###### Business use cases

The **Inventory Mapping API** takes minimal seller input and creates listing previews. The following are common use cases for this API.

*   **New sellers setting up inventory:** New sellers can start quickly by providing only a title or an image. This reduces the barrier to entry and helps them build their eBay presence without delays.
*   **Sellers managing stores or listings on other marketplaces:** For multi-channel sellers whose metadata may not match eBay’s structure, the API supports importing inventory using image URLs, titles, seller-defined categories, and custom aspects. This saves time, reduces manual rework, and simplifies migration or synchronization from external systems.
*   **Sellers offering commodity items:** For products with standardized identifiers (for example, ISBNs for books, UPCs for electronics), the API accepts product IDs like GTINs to pull relevant details, validate products, and speed cross-channel listing. This improves listing accuracy and supports catalog-based workflows for high-volume inventory.

###### Procedure

Steps to create listing previews and listings:

1.  Call the **startListingPreviewsCreation** mutation to use your external product data to generate a preview for each product.
2.  Monitor the task status by either:

*   Poll the task status
*   Subscribe to the [Notification API](/api-docs/commerce/notification/overview.html) topic `LISTING_PREVIEW_CREATION_TASK_STATUS` to be notified when the listing previews are ready

4.  When the task completes successfully, call the **listingPreviewsCreationTaskById** query (with the task ID) to retrieve the listing previews.

*   The task ID is returned in the **StartListingPreviewsCreation** mutation response
*   The output of the **listingPreviewsCreationTaskById** query includes listing preview details (category, aspects, ePID if available, AI-suggested title/description, and **mappingReferenceId**)

6.  Review the listing preview and create listings:
    
    **Note:** The **mappingReferenceId** uniquely identifies the recommendation provided by the **Inventory Mapping API**, and sellers must use it to correlate the listing created and reference it when creating or revising listings.
    
    *   Create **[Single-SKU listings with the Trading API](#single-sku-listing-trading)**
    *   Create **[Multiple-variation listings with the Trading API](#multiple-variation-listing-trading)**
    *   Create **[Bulk listings with the Sell Feed API](#bulk-listings-sell-feed)**

###### Sandbox

The **Inventory Mapping API** has a sandbox environment that allows sellers to test different types of inputs and their responses. All returned data is mocked.

When a seller provides an input in a [startListingPreviewsCreation](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) mutation, they will receive a task ID in the mock response (just like in production). They can then use this task ID in a [listingPreviewsCreationTaskById](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) query to retrieve the corresponding result. To do so:

1.  Call a **startListingPreviewsCreation** mutation and provide the test input (such as title, images aspects, etc.). The mutation responds with a task **Id**.
2.  Call a **listingPreviewsCreationTaskById** query using the returned task **Id**.
3.  The query returns a mock recommendation result determined by the input used in the mutation.

**Note:** Processing time is randomized and can take up to 10 minutes. Sellers may also subscribe to the Sandbox **Notification API** `LISTING_PREVIEW_CREATION_TASK_STATUS` topic to receive a notification when recommendations are ready. If you are not familiar with the **Notification API**, see the [Sell Communications Guide](/develop/guides-v2/sell-communications-guide#api-use-cases) for more information.

Below are possible inputs a user can provide in a [startListingPreviewsCreation](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) mutation request and the type of result they will get in the [listingPreviewsCreationTaskById](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) query response:

**Note:** Seller can send inputs in the same combinations as production:

*   title only
*   image only
*   title + image
*   title + aspects
*   title + GTIN

**Valid image**

In this use case, the seller uses the [startListingPreviewsCreation](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) mutation to create a listing preview based on the provided image.

_startListingPreviewsCreation mutation input:_

{
  "input": {
    "externalProducts": \[
      {
        "images": \["https://i.ebayimg.com/sample/png"\]
      }
    \]
  }
}

Using the [listingPreviewsCreationTaskById](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) query, the seller can retrieve information about the task's status and results. In this sample, the listing preview task has been completed, and the image the seller provided is valid.

_listingPreviewsCreationTaskById query output:_

{
    "data": {
        "listingPreviewsCreationTaskById": {
            "\_\_typename": "ListingPreviewsCreationTaskByIdOutput",
            "requestedId": "3QgRrIfPLfRs3d87jxSZ6L7NA",
            "listingPreviewsCreationTask": {
                "id": "3QgRrIfPLfRs3d87jxSZ6L7NA",
                "result": {
                    "completionStatus": "COMPLETED",
                    "listingPreviews": \[
                        {
                            "clientProvidedProductDetails": {
                                "externalProductIdentifier": null,
                                "title": null,
                                "images": \[
                                    "https://i.ebayimg.com/sample/png"
                                \],
                                "category": null,
                                "sku": null
                            },
                            "title": "Sample Title",
                            "description": null,
                            "category": {
                                "id": "31387"
                            },
                            "images": \[
                                "https://i.ebayimg.com/sample/png"
                            \],
                            "aspects": \[
                                {
                                    "name": "Department",
                                    "aspectValues": \[
                                        "Men"
                                    \]
                                },
                                {
                                    "name": "Style",
                                    "aspectValues": \[
                                        "Dress/Formal"
                                    \]
                                },
                                {
                                    "name": "Type",
                                    "aspectValues": \[
                                        "Wristwatch"
                                    \]
                                },
                                {
                                    "name": "Dial Color",
                                    "aspectValues": \[
                                        "White"
                                    \]
                                },
                                {
                                    "name": "Movement",
                                    "aspectValues": \[
                                        "Mechanical (Automatic)"
                                    \]
                                }
                            \],
                            "sku": null,
                            "product": null
                        }
                    \],
                    "unprocessedProducts": \[\],
                    "unmappedProducts": \[\],
                    "invalidProducts": \[\]
                }
            }
        }
    }
}

**Unmapped image**

In this use case, the seller uses the [startListingPreviewsCreation](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) mutation to create a listing preview based on the provided image.

_startListingPreviewsCreation mutation input:_

{
  "input": {
    "externalProducts": \[
      {
        "images": \["https://i.ebayimg.com/unmapped/png"\]
      }
    \]
  }
}

Using the [listingPreviewsCreationTaskById](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) query, the seller can retrieve information about the task's status and results. In this sample, the listing preview task has been completed, but with an error. The image the seller provided is unmapped, as shown by the **unmappedProducts** container.

**Note:** An unmapped product is a valid external product that was not successfully mapped by eBay into a listing preview.

_listingPreviewsCreationTaskById query output:_

{
    "data": {
        "listingPreviewsCreationTaskById": {
            "\_\_typename": "ListingPreviewsCreationTaskByIdOutput",
            "requestedId": "Wtgy1uVsl1qiMu97L7ecG5BZt",
            "listingPreviewsCreationTask": {
                "id": "Wtgy1uVsl1qiMu97L7ecG5BZt",
                "result": {
                    "completionStatus": "COMPLETED\_WITH\_ERROR",
                    "listingPreviews": \[\],
                    "unprocessedProducts": \[\],
                    "unmappedProducts": \[
                        {
                            "externalProductIdentifier": null,
                            "title": null,
                            "images": \[
                                "https://i.ebayimg.com/unmapped/png"
                            \],
                            "aspects": \[\],
                            "category": null,
                            "sku": null
                        }
                    \],
                    "invalidProducts": \[\]
                }
            }
        }
    }
}

**Invalid image**

In this use case, the seller uses the [startListingPreviewsCreation](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) mutation to create a listing preview based on the provided image.

_startListingPreviewsCreation mutation input:_

{
  "input": {
    "externalProducts": \[
      {
        "images": \["https://i.ebayimg.com/failed/png"\]
      }
    \]
  }
}

Using the [listingPreviewsCreationTaskById](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) query, the seller can retrieve information about the task's status and results. In this sample, the listing preview task has been completed, but with an error. The image the seller provided is invalid and did not process, as shown by the **unprocessedProducts** container.

_listingPreviewsCreationTaskById query output:_

{
    "data": {
        "listingPreviewsCreationTaskById": {
            "\_\_typename": "ListingPreviewsCreationTaskByIdOutput",
            "requestedId": "DuH9KnGdQ7w3odoiDOBVuESjJ",
            "listingPreviewsCreationTask": {
                "id": "DuH9KnGdQ7w3odoiDOBVuESjJ",
                "result": {
                    "completionStatus": "COMPLETED\_WITH\_ERROR",
                    "listingPreviews": \[\],
                    "unprocessedProducts": \[
                        {
                            "externalProductIdentifier": null,
                            "title": null,
                            "images": \[
                                "https://i.ebayimg.com/failed/png"
                            \],
                            "aspects": \[\],
                            "category": null,
                            "sku": null
                        }
                    \],
                    "unmappedProducts": \[\],
                    "invalidProducts": \[\]
                }
            }
        }
    }
}

**Valid title**

In this use case, the seller uses the [startListingPreviewsCreation](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) mutation to create a listing preview based on the provided title.

_startListingPreviewsCreation mutation input:_

{
  "input": {
    "externalProducts": \[
      {
        "title": "Title"
      }
    \]
  }
}

Using the [listingPreviewsCreationTaskById](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) query, the seller can retrieve information about the task's status and results. In this sample, the listing preview task has been completed and the title the seller provided was valid.

_listingPreviewsCreationTaskById query output:_

{
    "data": {
        "listingPreviewsCreationTaskById": {
            "\_\_typename": "ListingPreviewsCreationTaskByIdOutput",
            "requestedId": "zk6OlmkjJ3wWrD0tdwt9hRKNS",
            "listingPreviewsCreationTask": {
                "id": "zk6OlmkjJ3wWrD0tdwt9hRKNS",
                "result": {
                    "completionStatus": "COMPLETED",
                    "listingPreviews": \[
                        {
                            "clientProvidedProductDetails": {
                                "externalProductIdentifier": null,
                                "title": "Title",
                                "images": \[\],
                                "category": null,
                                "sku": null
                            },
                            "title": "Title",
                            "description": null,
                            "category": {
                                "id": "31387"
                            },
                            "images": \[\],
                            "aspects": \[
                                {
                                    "name": "Department",
                                    "aspectValues": \[
                                        "Men"
                                    \]
                                },
                                {
                                    "name": "Style",
                                    "aspectValues": \[
                                        "Dress/Formal"
                                    \]
                                },
                                {
                                    "name": "Type",
                                    "aspectValues": \[
                                        "Wristwatch"
                                    \]
                                },
                                {
                                    "name": "Dial Color",
                                    "aspectValues": \[
                                        "White"
                                    \]
                                },
                                {
                                    "name": "Movement",
                                    "aspectValues": \[
                                        "Mechanical (Automatic)"
                                    \]
                                }
                            \],
                            "sku": null,
                            "product": null
                        }
                    \],
                    "unprocessedProducts": \[\],
                    "unmappedProducts": \[\],
                    "invalidProducts": \[\]
                }
            }
        }
    }
}

**Unmapped title**

In this use case, the seller uses the [startListingPreviewsCreation](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) mutation to create a listing preview based on the provided title.

_startListingPreviewsCreation mutation input:_

{
  "input": {
    "externalProducts": \[
      {
        "title": "Unmapped Title"
      }
    \]
  }
}

Using the [listingPreviewsCreationTaskById](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) query, the seller can retrieve information about the task's status and results. In this sample, the listing preview task has been completed, but with an error. The title the seller provided is unmapped, as shown by the **unmappedProducts** container.

**Note:** An unmapped product is a valid external product that was not successfully mapped by eBay into a listing preview.

_listingPreviewsCreationTaskById query output:_

{
    "data": {
        "listingPreviewsCreationTaskById": {
            "\_\_typename": "ListingPreviewsCreationTaskByIdOutput",
            "requestedId": "tUaKvd5YRnYesfWUKi620ygsU",
            "listingPreviewsCreationTask": {
                "id": "tUaKvd5YRnYesfWUKi620ygsU",
                "result": {
                    "completionStatus": "COMPLETED\_WITH\_ERROR",
                    "listingPreviews": \[\],
                    "unprocessedProducts": \[\],
                    "unmappedProducts": \[
                        {
                            "externalProductIdentifier": null,
                            "title": "Unmapped Title",
                            "images": \[\],
                            "aspects": \[\],
                            "category": null,
                            "sku": null
                        }
                    \],
                    "invalidProducts": \[\]
                }
            }
        }
    }
}

**Valid title/image/aspects**

In this use case, the seller uses the [startListingPreviewsCreation](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) mutation to create a listing preview based on the provided title, image, and item aspect.

_startListingPreviewsCreation mutation input:_

{
  "input": {
    "externalProducts": \[
      {
        "title": "Title",
        "images": \["https://anything.com/png", "https://i.ebayimg.com/sample/png"\],
        "aspects": \[
            {
                "name": "Color",
                "values": \[
                    "Blue"
                \]
            }
        \]
      }
    \]
  }
}

Using the [listingPreviewsCreationTaskById](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) query, the seller can retrieve information about the task's status and results. In this sample, the listing preview task has been completed, and all provided inputs were valid.

_listingPreviewsCreationTaskById query output:_

{
    "data": {
        "listingPreviewsCreationTaskById": {
            "\_\_typename": "ListingPreviewsCreationTaskByIdOutput",
            "requestedId": "8q1ffMFbIuuTaZW2g7BTPOVAo",
            "listingPreviewsCreationTask": {
                "id": "8q1ffMFbIuuTaZW2g7BTPOVAo",
                "result": {
                    "completionStatus": "COMPLETED",
                    "listingPreviews": \[
                        {
                            "clientProvidedProductDetails": {
                                "externalProductIdentifier": null,
                                "title": "Title",
                                "images": \[
                                    "https://anything.com/png",
                                    "https://i.ebayimg.com/sample/png"
                                \],
                                "category": null,
                                "sku": null
                            },
                            "title": "Title",
                            "description": null,
                            "category": {
                                "id": "31387"
                            },
                            "images": \[
                                "http://i.ebayimg.sandbox.ebay.com/images/g/G1AAAeSw16lpRc9L/s-l1600.jpg",
                                "http://i.ebayimg.sandbox.ebay.com/images/g/G1EAAeSw16lpRc9L/s-l1600.jpg"
                            \],
                            "aspects": \[
                                {
                                    "name": "Department",
                                    "aspectValues": \[
                                        "Men"
                                    \]
                                },
                                {
                                    "name": "Style",
                                    "aspectValues": \[
                                        "Dress/Formal"
                                    \]
                                },
                                {
                                    "name": "Type",
                                    "aspectValues": \[
                                        "Wristwatch"
                                    \]
                                },
                                {
                                    "name": "Dial Color",
                                    "aspectValues": \[
                                        "White"
                                    \]
                                },
                                {
                                    "name": "Movement",
                                    "aspectValues": \[
                                        "Mechanical (Automatic)"
                                    \]
                                }
                            \],
                            "sku": null,
                            "product": null
                        }
                    \],
                    "unprocessedProducts": \[\],
                    "unmappedProducts": \[\],
                    "invalidProducts": \[\]
                }
            }
        }
    }
}

**Unmapped title/image/aspects**

In this use case, the seller uses the [startListingPreviewsCreation](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) mutation to create a listing preview based on the provided title, image, and item aspect.

_startListingPreviewsCreation mutation input:_

```
{
  "input": {
    "externalProducts": [
      {
        "images": ["https://i.ebayimg.com/unmapped/png"],
        "title": "Unmapped Title",
        "aspects": [
            {
                "name": "Color",
                "values": [
                    "Blue"
                ]
            }
        ]
      }
    ]
  }
}
```

Using the [listingPreviewsCreationTaskById](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) query, the seller can retrieve information about the task's status and results. In this sample, the listing preview task has been completed, but with an error. The inputs the seller provided are unmapped, as shown by the unmappedProducts container.

**Note:** An unmapped product is a valid external product that was not successfully mapped by eBay into a listing preview.

_listingPreviewsCreationTaskById query output:_

{
    "data": {
        "listingPreviewsCreationTaskById": {
            "\_\_typename": "ListingPreviewsCreationTaskByIdOutput",
            "requestedId": "hmXow5UO6anXqZuAYwCyqQXDu",
            "listingPreviewsCreationTask": {
                "id": "hmXow5UO6anXqZuAYwCyqQXDu",
                "result": {
                    "completionStatus": "COMPLETED\_WITH\_ERROR",
                    "listingPreviews": \[\],
                    "unprocessedProducts": \[\],
                    "unmappedProducts": \[
                        {
                            "externalProductIdentifier": null,
                            "title": "Unmapped Title",
                            "images": \[
                                "https://i.ebayimg.com/unmapped/png"
                            \],
                            "aspects": \[
                                {
                                    "name": "Color",
                                    "values": \[
                                        "Blue"
                                    \]
                                }
                            \],
                            "category": null,
                            "sku": null
                        }
                    \],
                    "invalidProducts": \[\]
                }
            }
        }
    }
}

**Invalid product ID**

In this use case, the seller uses the [startListingPreviewsCreation](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) mutation to create a listing preview based on the provided product ID and title.

_startListingPreviewsCreation mutation input:_

{
  "input": {
    "externalProducts": \[
      {
        "externalProductIdentifierInput": {
          "productId": "222",
          "productType": "UPC"
        },
        "title": "Something"
      }
    \]
  }
}

Using the [listingPreviewsCreationTaskById](/develop/api/sell/inventory_mapping#sell-inventory_mapping-mutation-startlistingpreviewscreation) query, the seller can retrieve information about the task's status and results. In this sample, the listing preview task has been completed, but with an error. The inputs the seller provided are invalid , as shown by the **invalidProducts** container.

_listingPreviewsCreationTaskById query output:_

{
    "data": {
        "listingPreviewsCreationTaskById": {
            "\_\_typename": "ListingPreviewsCreationTaskByIdOutput",
            "requestedId": "A7qjRpR808sg38wAa2Dh3wphE",
            "listingPreviewsCreationTask": {
                "id": "A7qjRpR808sg38wAa2Dh3wphE",
                "result": {
                    "completionStatus": "COMPLETED\_WITH\_ERROR",
                    "listingPreviews": \[\],
                    "unprocessedProducts": \[\],
                    "unmappedProducts": \[\],
                    "invalidProducts": \[
                        {
                            "clientProvidedProductDetails": {
                                "externalProductIdentifier": {
                                    "productId": "222",
                                    "productType": "UPC"
                                },
                                "title": "Something",
                                "images": \[\],
                                "category": null,
                                "sku": null
                            },
                            "description": "Invalid external product details request"
                        }
                    \]
                }
            }
        }
    }
}

## Code Samples

## Error Handling

*   The [publishOffer](/api-docs/sell/inventory/resources/offer/methods/publishOffer), [bulkPublishOffer](/api-docs/sell/inventory/resources/offer/methods/bulkPublishOffer), or [publishOfferByInventoryItemGroup](/api-docs/sell/inventory/resources/offer/methods/publishOfferByInventoryItemGroup) methods of the [Inventory API](/api-docs/sell/inventory/resources/methods) have several error codes where the triggered error message text and troubleshooting procedure may vary based on the nature of the error. See the [Inventory API error details](/api-docs/sell/static/inventory/inventory-error-details.html) topic for more information on how error messages may vary, as well as the troubleshooting steps to resolve them.
*   The [Inventory API](/api-docs/sell/inventory/resources/methods) requires the use of [business policies](https://www.ebay.com/help/selling/business-policies/business-policies?id=4212). The [Account API v1](/api-docs/sell/account/resources/methods) can be used to create and manage business policies for sellers and the [OptInToProgram](/api-docs/sell/account/resources/program/methods/optInToProgram) method of that API can opt the seller’s account into business policies. The [publishOffer](/api-docs/sell/inventory/resources/offer/methods/publishOffer), [bulkPublishOffer](/api-docs/sell/inventory/resources/offer/methods/bulkPublishOffer), or [publishOfferByInventoryItemGroup](/api-docs/sell/inventory/resources/offer/methods/publishOfferByInventoryItemGroup) methods will fail if **payment**, **return**, and **fulfillment** business policies are not specified for offer.
*   Each eBay leaf category typically has numerous item specifics (aka aspects) that are required for items in that category, so it is recommended that the [getItemAspectsForCategory](/api-docs/sell/taxonomy/resources/category_tree/methods/getItemAspectsForCategory) and [fetchItemAspects](/api-docs/sell/taxonomy/resources/category_tree/methods/fetchItemAspects) methods of the [Taxonomy API](/api-docs/sell/taxonomy/resources/methods) are actively used to get the list of required item specifics.
*   An invalid eBay category ID or a non-leaf category ID will lead to an error. Use the [getCategoryTree](/api-docs/sell/taxonomy/resources/category_tree/methods/getCategoryTree) or [getCategorySubtree](/api-docs/sell/taxonomy/resources/category_tree/methods/getCategorySubtree) methods of the [Taxonomy API](/api-docs/sell/taxonomy/resources/methods) to retrieve eBay category IDs and to see which categories are leaf categories.
*   JavaScript cannot be used in any seller-defined, text-based fields (such as item description) and will lead to an error.
*   If using the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting) and the seller is not opted into business policies, the [ReturnPolicy](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ReturnPolicy) container must still be used with the [ReturnPolicy.ReturnsAcceptedOption](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ReturnPolicy.ReturnsAcceptedOption) field’s value set to ReturnsNotAccepted if the seller does not accept returns for the item.
*   The item conditions supported by different eBay leaf categories vary, so it is good idea to check supported item conditions for a leaf category by using the [getItemConditionPolicies](/api-docs/sell/metadata/resources/marketplace/methods/getItemConditionPolicies) method of the [Metadata API](/api-docs/sell/metadata/resources/methods).
*   When using the [Sell Feed API](/api-docs/sell/feed/resources/methods), the feed type specified through the [feedType](/api-docs/sell/feed/resources/task/methods/createTask#request.feedType) field of the [createTask](/api-docs/sell/feed/resources/task/methods/createTask) method should match the actual object types being uploaded through the [uploadFile](/api-docs/sell/feed/resources/task/methods/uploadFile) method.

## Best Practices

*   The **Inventory API** requires a **location** object, an **inventory item/inventory item group**, and an **offer** object before a new eBay listing can be created. There are a number of fields within these objects that are optional when creating the object, but these same fields become required when actually publishing the offer through a [publishOffer](/api-docs/sell/inventory/resources/offer/methods/publishOffer), [bulkPublishOffer](/api-docs/sell/inventory/resources/offer/methods/bulkPublishOffer), or [publishOfferByInventoryItemGroup](/api-docs/sell/inventory/resources/offer/methods/publishOfferByInventoryItemGroup) method. See [Required fields for publishing an offer](/api-docs/sell/static/inventory/publishing-offers.html) for more information. We recommend that you become familiar with these fields, and include them during the original creation of an object to avoid triggering errors when publish methods are used.
*   It is recommended that sellers opt in to the [Out of Stock control](/help/selling/listings/creating-managing-listings/multiquantity-listings-listings-variations?id=4150) feature, especially sellers that often use fixed price, multiple-quantity listings. If a seller uses this feature, a listing will be kept alive for up to 90 days when quantity goes to 0, giving the seller the opportunity to restock. While an active listing is 'Out-of-Stock', it will be hidden from search so interested buyers don't view a listing with no available quantity. 
*   As an alternative to using the [Trading API](/Devzone/XML/docs/Reference/eBay/index.html) sandbox environment, the [VerifyAddItem](/DevZone/XML/docs/Reference/eBay/VerifyAddItem.html) and [VerifyAddFixedPricedItem](/DevZone/XML/docs/Reference/eBay/VerifyAddFixedPriceItem.html) calls can be used to test the validity of the item object in the production environment before that item is actually listed. These calls use the same logic and validation as the [AddItem](/Devzone/XML/docs/Reference/eBay/AddItem.html#AddItem) and the [AddFixedPriceItem](/Devzone/XML/docs/Reference/eBay/AddFixedPriceItem.html#AddFixedPriceItem) calls, but there is no risk of incurring any listing fees.
*   Sellers can use the [getCategorySuggestions](/api-docs/sell/taxonomy/resources/category_tree/methods/getCategorySuggestions) method of the Taxonomy API to return a list of the categories with the highest number of listings whose titles or descriptions contain keywords specified in the query. This allows sellers to choose the most accurate category for their listing, ensuring it gets to the right audience. 
*   Sellers should consider offering multiple domestic shipping service options to appease both buyers who are not in a hurry and just want the cheapest shipping option available, and buyers who do want their item in a hurry and don’t mind spending a little bit more for shipping.
*   For non-new items, sellers should strongly consider using the [conditionDescription](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.conditionDescription) field of [Inventory API](/api-docs/sell/inventory/resources/methods) or the [ConditionDescription](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ConditionDescription) field of [Trading API](/Devzone/XML/docs/Reference/eBay/index.html) to provide more details about the condition of the item. Providing this information can reduce ‘Significantly not as Described’ returns or cases.
*   Sellers who are selling within the EU or Northern Ireland need to be aware of category-level EU regulatory requirements. The [getRegulatoryPolicies](/api-docs/sell/metadata/resources/marketplace/methods/getRegulatoryPolicies) method can be used to see which categories require or recommend product safety labels, hazardous material labels, energy efficiency labels, and product manufacturer contact information, and the [getExtendedProducerResponsibilityPolicies](/api-docs/sell/metadata/resources/marketplace/methods/getExtendedProducerResponsibilityPolicies) method can be used to see which categories require or recommend eco-participation fees, takeback policies, and repair scores.
*   For sellers who are selling new and established products, it is recommended that they search for that product in eBay’s product catalog by using the [search](/api-docs/sell/catalog/resources/product_summary/methods/search) method of the [Catalog API](/api-docs/sell/catalog/resources/methods), and then using the [product.epid](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem#request.product.epid) field of the [Inventory API](/api-docs/sell/inventory/resources/methods) or the [ProductListingDetails.ProductReferenceID](/Devzone/XML/docs/Reference/eBay/AddItem.html#Request.Item.ProductListingDetails.ProductReferenceID) field of the [Trading API](/Devzone/XML/docs/Reference/eBay/index.html) to “prefill” product data information based on the eBay catalog product.
*   All listings must have at least one photo of the item, but it is recommended that sellers use numerous photos of each item. All photos must also adhere to eBay’s [Picture Policy](/help/policies/listing-policies/picture-policy?id=4370).
*   It is recommended that Top Rated Sellers offer 30-day or 60 days returns and set their handling time to 0 or 1 business days. All listings that meet these criteria will get a **Top Rated Plus** badge. A **Top Rated Plus** badge has a positive effective on search ranking and can help inspire trust in the seller.
*   Since the [Inventory API](/api-docs/sell/inventory/resources/methods) requires the use of [business policies](/help/selling/business-policies/business-policies?id=4212), it is recommended that **payment**, **return**, and **fulfillment** business policies are thoroughly reviewed before they are specified/used in the **offer** object. The [Account API v1](/api-docs/sell/account/resources/methods) GET business policy methods can be used to retrieve all business policies defined for a seller on an eBay marketplace.

## Code Samples

### Create a warehouse location for Inventory API

**Label:** Create a warehouse location for Inventory API

#### Bash Sample

```bash
curl -X POST "https://api.ebay.com/sell/inventory/v1/location/W********1"
-H "Authorization: Bearer OAUTH_token"
-H "Content-Type: application/json"
-d '{
    "location": {
        "address": {
            "postalCode": "95008",
            "stateOrProvince": "CA",
            "country": "US"
        }
    },
    "name": "testWarehouse1",
    "merchantLocationStatus": "ENABLED",
    "locationTypes": [
        "WAREHOUSE"
    ]
}'
```

### Staging a bulk item creation upload with Sell Feed API

**Label:** Staging a bulk item creation upload with Sell Feed API

#### Bash Sample

```bash
curl -X POST "https://api.ebay.com/sell/feed/v1/task"
-H "Authorization: Bearer OAUTH_token"
-H "Content-Type: application/json"
-H "X-EBAY-C-MARKETPLACE-ID: EBAY_US"
-d '{
  "schemaVersion": "1421",
  "feedType": "LMS_ADD_ITEM"
}'
```

## Related Topics

- [Inventory API](/api-docs/sell/inventory/resources/methods)
- [Sell Feed API](/api-docs/sell/feed/resources/methods)
- [Trading API](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting)
- [Account API v1](/api-docs/sell/account/resources/methods)
- [More Guides](/develop/guides)

