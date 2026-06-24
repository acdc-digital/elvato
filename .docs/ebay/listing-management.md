# Listing Management

**Guide Group:** Listing Management

---

## Overview

This guide discusses the use cases involved in managing active eBay listings, and touches on revising listings, relisting items, retrieving listings, and ending listings.

## API Use Case

[Revising listings](#revisinglistings)  
[Relisting items](#relistingitems)  
[Retrieving listings](#retrievinglistings)  
[Ending listings](#endinglistings)

##### Revising listings

The [Inventory API](/api-docs/sell/inventory/resources/methods), the [Trading API](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting), and the [Sell Feed API](/api-docs/sell/feed/overview.html) can all be used to revise active listings. The required steps vary with each of these APIs, so they will be covered individually below. Regardless of the API used, active listings can only be revised a maximum of 250 times per calendar day.

###### Revising product details with the Inventory API

The flow diagram below provides a visual representation of how to revise product details using the [Inventory API](https://developer.ebay.com/api-docs/sell/inventory/resources/methods):

![Banner image](/cms/img/listingmanagement/revise-product-details.png)

1.  Use a [getInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItem) (for one specific inventory item), a [getInventoryItems](/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItems) (for all inventory items), or a [bulkGetInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/bulkGetInventoryItem) (for up to 25 specific inventory items) method to see the current values for one or more inventory items. 
2.  The [createOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem) method will be used to modify any product details of one inventory item, or the [bulkCreateOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem) method can be used to  modify any product details of up to 25 inventory items. As the names suggest for both of these methods, a complete replace is done for inventory items, so you must pass in all applicable requests fields even if their current value is not changing.
3.  After a successful [createOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem) or [bulkCreateOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem) method, you might want to check the View Item page(s) for the item(s) you changed.

###### Revising offer details with the Inventory API

The flow diagram below provides a visual representation of how to revise offer details using the [Inventory API](/api-docs/sell/inventory/resources/methods):

![Banner image](/cms/img/listingmanagement/revise-offer-details.png)

1.  Use a [getOffer](/api-docs/sell/inventory/resources/offer/methods/getOffer) method using the **offerId** as the path parameter, or a [getOffers](/api-docs/sell/inventory/resources/offer/methods/getOffers) method using the [sku](/api-docs/sell/inventory/resources/offer/methods/getOffers#uri.sku) query parameter to see the current offer-related values for the listing. If you need to update more than one variation in a multiple-variation listing, you will need to use multiple GET calls, as each variation will have its own **offer** object.
2.  The [updateOffer](/api-docs/sell/inventory/resources/offer/methods/updateOffer) method is used to modify any offer details of a single-SKU listing or of a single variation in a multiple-SKU listing. The [updateOffer](/api-docs/sell/inventory/resources/offer/methods/updateOffer) method does a complete replacement of the offer, so you must pass in all applicable requests fields even if their current value is not changing. If you have used any of the GET calls mentioned in Step 1, one thing you can do is copy the **offer** object and then modify as needed in the request payload of the [updateOffer](/api-docs/sell/inventory/resources/offer/methods/updateOffer) method. There is no “bulk” version of [updateOffer](/api-docs/sell/inventory/resources/offer/methods/updateOffer), but the [bulkUpdatePriceQuantity](/api-docs/sell/inventory/resources/inventory_item/methods/bulkUpdatePriceQuantity) method can be used to update the price and/or quantity of up to 25 SKUs in active listings.
3.  After a successful [updateOffer](/api-docs/sell/inventory/resources/offer/methods/updateOffer) or [bulkUpdatePriceQuantity](/api-docs/sell/inventory/resources/inventory_item/methods/bulkUpdatePriceQuantity) method, you might want to check the View Item page(s) for the item(s) you changed.

###### Adding a variation with the Inventory API

As long as an **inventory item** and an **offer** object exists for the SKU to be added, that SKU can be added to an existing multiple-variation listing by using the [createOrReplaceInventoryItemGroup](/api-docs/sell/inventory/resources/inventory_item_group/methods/createOrReplaceInventoryItemGroup) method. The new SKU’s value is just included with the rest of the SKU values defined under the [variantSKUs](/api-docs/sell/inventory/resources/inventory_item_group/methods/createOrReplaceInventoryItemGroup#request.variantSKUs) array. 

Please note that the **inventory item** and **offer** objects for a SKU that will become part of an **inventory item group** object have slightly different requirements than a SKU that will become a single-SKU listing. Revisit the [Creating a multiple-variation listing with the Inventory API](https://docs.google.com/document/d/1FLKu8XAd0dyCDFUN9jWt9YH6kN8EM2-lKQeIC4KjC7U/edit?pli=1&tab=t.0#heading=h.hd1cjaywpot3) section for more information about these requirements.

###### Removing a variation with the Inventory API

There are a number of ways that a variation/SKU within a multiple-variation listing can be removed using the [Inventory API](/api-docs/sell/inventory/resources/methods). The different [Inventory API](/api-docs/sell/inventory/resources/methods) methods that can be used to remove a SKU from an active multiple-variation listing are covered below: 

*   The [createOrReplaceInventoryItemGroup](/api-docs/sell/inventory/resources/inventory_item_group/methods/createOrReplaceInventoryItemGroup) method can be used to update the inventory item group object, with the SKU to be removed not being included within the [variantSKUs](/api-docs/sell/inventory/resources/inventory_item_group/methods/createOrReplaceInventoryItemGroup#request.variantSKUs) array. The **inventory item** and **offer** objects associated with this SKU remain intact except the status of the offer goes from the PUBLISHED state to the UNPUBLISHED state.  
*   The [deleteOffer](/api-docs/sell/inventory/resources/offer/methods/deleteOffer) method can be run against that SKU. The **offer** object is deleted, but the **inventory item** object stays intact.
*   The [deleteInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/deleteInventoryItem) method can be run against that SKU. This will delete the **inventory item** object and the **offer** object associated with that SKU.

###### Revising listings with the Trading API

Active listings can be revised with the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting) using [ReviseItem](/devzone/xml/docs/Reference/eBay/ReviseItem.html#ReviseItem) or [ReviseFixedPriceItem](/devzone/xml/docs/Reference/eBay/ReviseFixedPriceItem.html#ReviseFixedPriceItem). [ReviseItem](/devzone/xml/docs/Reference/eBay/ReviseItem.html#ReviseItem) supports all listing types, but not multiple variations. As its name suggests, [ReviseFixedPriceItem](/devzone/xml/docs/Reference/eBay/ReviseFixedPriceItem.html#ReviseFixedPriceItem) only supports fixed price listings (single and multiple-variations). 

Follow the process below to revise listing details in an active listing using [ReviseItem](/devzone/xml/docs/Reference/eBay/ReviseItem.html#ReviseItem) or [ReviseFixedPriceItem](/devzone/xml/docs/Reference/eBay/ReviseFixedPriceItem.html#ReviseFixedPriceItem): 

1.  Use a [GetItem](/devzone/xml/docs/Reference/eBay/GetItem.html#GetItem) call to see the current settings/values for the listing.
2.  Identify the listing to revise using the [ItemID](/devzone/xml/docs/Reference/eBay/ReviseItem.html#Request.Item.ItemID) field in the [ReviseItem](/devzone/xml/docs/Reference/eBay/ReviseItem.html#ReviseItem) or [ReviseFixedPriceItem](/devzone/xml/docs/Reference/eBay/ReviseFixedPriceItem.html#ReviseFixedPriceItem) call.
3.  Modify the active listing as needed. Below are ways to add fields, modify fields, or remove fields:
    
    1.  You can add or modify one or more fields/settings using the applicable field(s) to add/modify the setting(s). See the [Listing Creation Guide](https://docs.google.com/document/d/1FLKu8XAd0dyCDFUN9jWt9YH6kN8EM2-lKQeIC4KjC7U/edit?pli=1&tab=t.0#heading=h.uc88zdf6qfc5) for more information about setting listing details in the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting).
    2.  You can delete one or more fields/settings using the [DeletedField](/devzone/xml/docs/Reference/eBay/ReviseItem.html#Request.DeletedField) field. Just pass in the full path of the field to be removed. For example, if you wanted to remove the optional **Subtitle** from the listing, you’d pass in the following in the request payload: <DeletedField>Item.SubTitle</DeletedField>. To remove a boolean field, you can pass in that field name and use false as the value. For example, if you wanted to disable the **Best Offer** feature for the listing, you’d pass in the following in the request payload: <BestOfferEnabled>false</BestOfferEnabled>
    
    Note that required fields cannot be removed and the values of some fields cannot be changed under some circumstances, such as auction listings that end within 12 hours or any listings that have pending Best Offers/counteroffers.
    
4.  A successful ReviseItem or [ReviseFixedPriceItem](/devzone/xml/docs/Reference/eBay/ReviseFixedPriceItem.html#ReviseFixedPriceItem) call should not trigger any errors or warnings. Keep in mind that a Revise call may incur additional listing fees depending on which setting was added. For example, if the seller added a subtitle to an active listing that didn’t have one before. Also note that you will not be automatically entitled to a listing fee refund just because you removed the setting/feature that incurred the fee.
    

Other listing revision calls in the Trading API include: 

*   [ReviseInventoryStatus](/Devzone/XML/docs/Reference/eBay/ReviseInventoryStatus.html): a call that allows a seller to easily update the price and/or quantity for one to four active listings per call.
*   [AddToItemDescription](/Devzone/XML/docs/Reference/eBay/AddToItemDescription.html): a call that allows a seller to append additional text to the current item description.

###### Revising listings in bulk with the Inventory API

The flow diagram below provides a visual representation of how to revise up to 25 active listings using three bulk methods of the [Inventory API](/api-docs/sell/inventory/resources/methods):

![Banner image](/cms/img/listingmanagement/revise-bulk-listings.png)

Here are the necessary steps to take in the [Inventory API](/api-docs/sell/inventory/resources/methods) to revise up to 25 listings:

1.  Use the [getInventoryItems](/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItems) method to retrieve all inventory items defined for a seller’s account, or the [bulkGetInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/bulkGetInventoryItem) method can be used to retrieve up to 25 specific inventory item records. Currently, there is no bulk method that retrieves multiple offers.
2.  Use the [bulkCreateOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem) method to revise up to 25 inventory item records. The payload for this method is identical to the [createOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem) method except up to 25 inventory item records can be revised instead of just one, and the [requests.sku](/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem#request.requests.sku) field is specified in the request payload for each inventory item record instead of the sku value being a path parameter like in the [createOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem) method. As the name suggests, a complete replace is done for inventory items, so you must pass in all applicable requests fields even if their current value is not changing.
3.  There is no “bulk” version of the [updateOffer](/api-docs/sell/inventory/resources/offer/methods/updateOffer) method, but the [bulkUpdatePriceQuantity](/api-docs/sell/inventory/resources/inventory_item/methods/bulkUpdatePriceQuantity) method can be used to update the price and/or quantity of up to 25 SKUs in active listings.
4.  A successful [bulkCreateOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem) or [bulkUpdatePriceQuantity](/api-docs/sell/inventory/resources/inventory_item/methods/bulkUpdatePriceQuantity) method will automatically update the active eBay listings, so you might want to check the View Item page(s) for the item(s) you revised.

###### Revising listings in bulk with the Sell Feed API

The [Sell Feed API](/api-docs/sell/feed/static/overview.html) lets sellers upload and download various feed files and reports. The two feed types used for bulk listing updates are  **LMS\_REVISE\_ITEM,** **LMS\_REVISE\_FIXED\_PRICE\_ITEM**, and **LMS\_REVISE\_INVENTORY\_STATUS**. The size limitation for these feed files is 15 MB, and the files are processed asynchronously by eBay. The status of all upload tasks are tracked with a unique 'task ID'. 

The flow diagram below provides a visual representation of how to revise multiple active listings using the [Sell Feed API](/api-docs/sell/feed/resources/methods):

![Banner image](/cms/img/listingmanagement/revise-bulk-listings-sell-feed.png)

Here are the necessary steps to take in the [Sell Feed API](/api-docs/sell/feed/resources/methods) to revise multiple active listings:

1.  Stage the task using the [createTask](/api-docs/sell/feed/resources/task/methods/createTask) method. Use the **X-EBAY-C-MARKETPLACE-ID** header to set the listing marketplace, and set the [feedType](/api-docs/sell/feed/resources/task/methods/createTask#request.feedType) value in the request payload to either **LMS\_REVISE\_ITEM,** **LMS\_REVISE\_FIXED\_PRICE\_ITEM**, or **LMS\_REVISE\_INVENTORY\_STATUS**. **LMS\_REVISE\_ITEM** cannot be used if you are modifying multiple-variation listings. If the call is successful, the [getTask](/api-docs/sell/feed/resources/task/methods/getTask) URI for the task is returned in the **Location** response header.
2.  Use the [getTask](/api-docs/sell/feed/resources/task/methods/getTask) method to check the status of the task. The value returned in the [status](/api-docs/sell/feed/resources/task/methods/getTask#response.status) field should be CREATED. Proceed to the next step if you see this value.
3.  Use the [uploadFile](/api-docs/sell/feed/resources/task/methods/uploadFile) method to upload the  **LMS\_REVISE\_ITEM,** **LMS\_REVISE\_FIXED\_PRICE\_ITEM**, or **LMS\_REVISE\_INVENTORY\_STATUS** feed file.The same task ID returned in [createTask](/api-docs/sell/feed/resources/task/methods/createTask) method and used in [getTask](/api-docs/sell/feed/resources/task/methods/getTask) method is used as a path parameter for the [uploadFile](/api-docs/sell/feed/resources/task/methods/uploadFile) method. The [uploadFile](/api-docs/sell/feed/resources/task/methods/uploadFile) method does not have a request payload, but you will be uploading an XML data file. See the [uploadFile reference documentation](/api-docs/sell/feed/resources/task/methods/uploadFile) and/or the [Create the data file](/api-docs/sell/static/feed/lms-feeds-working-with-lms.html#create-the-data-file) topic for more details on how to create and upload the XML file. If the [uploadFile](/api-docs/sell/feed/resources/task/methods/uploadFile) call is successful, an HTTP status code of 202 Accepted should be returned. Uploaded files are processed asynchronously, so it may take some time to process the file based on the size of the file.
4.  Run another [getTask](/api-docs/sell/feed/resources/task/methods/getTask) method (using the same task ID) to check status. This time, you will want to see a value of COMPLETED or COMPLETED\_WITH\_ERROR. COMPLETED is preferable over COMPLETED\_WITH\_ERROR, as the latter generally indicates that one or more listings were not revised successfully. Also check the [uploadSummary](/api-docs/sell/feed/resources/task/methods/getTask#response.uploadSummary) container. If all listings were successfully revised, you should see a value of 0 in the [uploadSummary.failureCount](/api-docs/sell/feed/resources/task/methods/getTask#response.uploadSummary.failureCount) field
5.  Use the [getResultFile](/api-docs/sell/feed/resources/task/methods/getResultFile) method (using the same task ID as a path parameter) to retrieve the file that indicates the results of the listings revision task. A completely successful task should show item ID values for the newly revised listings. For any listings that were not revised successfully, you should see an **Errors** container that indicates the issue(s) with one or more listings.

##### Relisting items

The process to relist recently ended listings will vary based on whether you are using the [Inventory API](/api-docs/sell/inventory/resources/methods), the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting), or the [Sell Feed API](/api-docs/sell/feed/overview.html). The required steps to relist with each of these APIs will be covered individually below. 

###### Relisting items with the Inventory API

In the [Inventory API](/api-docs/sell/inventory/resources/methods), there are no actual “relist” methods, but instead, you will use the [publishOffer](/api-docs/sell/inventory/resources/offer/methods/publishOffer) method to move an offer from the unpublished to the published state.

Below is a logical flow to use to relist an item with the [Inventory API](/api-docs/sell/inventory/resources/methods):

![Banner image](/cms/img/listingmanagement/relisting-items.png)

1.  Before using the [publishOffer](/api-docs/sell/inventory/resources/offer/methods/publishOffer) method, you should use the [getOffer](/api-docs/sell/inventory/resources/offer/methods/getOffer) method to see the current state of the offer and the [getInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItem) method to see the current state of the inventory item.
2.  According to the changes you want to make, either use the [updateOffer](/api-docs/sell/inventory/resources/offer/methods/updateOffer) method to make offer updates or the [createOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem) method to make inventory item updates. If no changes are needed, you can proceed to the next step.
3.  Use the [publishOffer](/api-docs/sell/inventory/resources/offer/methods/publishOffer) method to relist the item.

###### Relisting items with the Trading API

Recently ended listings can be relisted with the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting) using [RelistItem](/Devzone/XML/docs/Reference/eBay/RelistItem.html) or [RelistFixedPriceItem](/Devzone/XML/docs/Reference/eBay/RelistFixedPriceItem.html). [RelistItem](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/RelistItem.html) supports all listing types, but not multiple variations. As its name suggests, [RelistFixedPriceItem](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/RelistFixedPriceItem.html) only supports fixed price listings (single and multiple-variations).

Follow the process below to relist an item using [RelistItem](/Devzone/XML/docs/Reference/eBay/RelistItem.html) or [RelistFixedPriceItem](/Devzone/XML/docs/Reference/eBay/RelistFixedPriceItem.html):

1.  Use a [GetItem](/devzone/xml/docs/Reference/eBay/GetItem.html#GetItem) call to see the current settings/values for the listing.
2.  Identify the listing to relist using the [ItemID](/Devzone/XML/docs/Reference/eBay/RelistItem.html#Request.Item.ItemID) field in the  [RelistItem](/Devzone/XML/docs/Reference/eBay/RelistItem.html) or [RelistFixedPriceItem](/Devzone/XML/docs/Reference/eBay/RelistFixedPriceItem.html) call.
3.  Make any necessary modifications to the listing. Below are ways to add, modify, or remove fields:

1.  You can add or modify one or more fields/settings using the applicable field(s) to add/modify the setting(s). See the [Listing Creation Guide](/document/d/1FLKu8XAd0dyCDFUN9jWt9YH6kN8EM2-lKQeIC4KjC7U/edit?pli=1&tab=t.0#heading=h.uc88zdf6qfc5) for more information about setting listing details in the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting).
2.  You can delete one or more fields/settings using the [DeletedField](/Devzone/XML/docs/Reference/eBay/RelistItem.html#Request.DeletedField) field. Just pass in the full path of the field to be removed. For example, if you wanted to remove the optional **Subtitle** from the listing, you’d pass in the following in the request payload: <DeletedField>Item.SubTitle</DeletedField>. To remove a boolean field, you can pass in that field name and use false as the value. For example, if you wanted to disable the ****Best Offer**** feature for the listing, you’d pass in the following in the request payload: <BestOfferEnabled>false</BestOfferEnabled>
    
    Note that required fields cannot be removed.
    

5.  A successful [RelistItem](/Devzone/XML/docs/Reference/eBay/RelistItem.html) or [RelistFixedPriceItem](/Devzone/XML/docs/Reference/eBay/RelistFixedPriceItem.html) call should not trigger any errors or warnings. Keep in mind that a Relist call is subject to the same listing fees as an Add call. A successfully relisted item will get a new [ItemID](/Devzone/XML/docs/Reference/eBay/RelistItem.html#Response.ItemID) value returned in the response.
    

###### Bulk relisting items with the Sell Feed API

The [Sell Feed API](/api-docs/sell/feed/static/overview.html) lets sellers upload and download various feed files and reports. The two feed types used for bulk item relisting are **LMS\_RELIST\_ITEM** and **LMS\_RELIST\_FIXED\_PRICE\_ITEM**. The size limitation for these feed files is 15 MB, and the files are processed asynchronously by eBay. The status of all upload tasks are tracked with a unique 'task ID'. 

The flow diagram below provides a visual representation of how to relist multiple items using the [Sell Feed API](/api-docs/sell/feed/resources/methods):

![Banner image](/cms/img/listingmanagement/relist-bulk-items-sell-feed.png)

Here are the necessary steps to take in the [Sell Feed API](/api-docs/sell/feed/resources/methods) to relist multiple items:

1.  Stage the task using the [createTask](/api-docs/sell/feed/resources/task/methods/createTask) method. Use the **X-EBAY-C-MARKETPLACE-ID** header to set the listing marketplace, and set the [feedType](/api-docs/sell/feed/resources/task/methods/createTask#request.feedType) value in the request payload to either **LMS\_RELIST\_ITEM** or **LMS\_RELIST\_FIXED\_PRICE\_ITEM**. **LMS\_RELIST\_ITEM** cannot be used if you are relisting multiple-variation listings. If the call is successful, the [getTask](/api-docs/sell/feed/resources/task/methods/getTask) URI for the task is returned in the **Location** response header.
2.  Use the [getTask](/api-docs/sell/feed/resources/task/methods/getTask) method to check the status of the task. The value returned in the [status](/api-docs/sell/feed/resources/task/methods/getTask#response.status) field should be CREATED. Proceed to the next step if you see this value.
3.  Use the [uploadFile](https://developer.ebay.com/api-docs/sell/feed/resources/task/methods/uploadFile) method to upload the  **LMS\_RELIST\_ITEM** or **LMS\_RELIST\_FIXED\_PRICE\_ITEM** feed file.The same task ID returned in [createTask](https://developer.ebay.com/api-docs/sell/feed/resources/task/methods/createTask) method is used as a path parameter for the [uploadFile](https://developer.ebay.com/api-docs/sell/feed/resources/task/methods/uploadFile) method. The [uploadFile](https://developer.ebay.com/api-docs/sell/feed/resources/task/methods/uploadFile) method does not have a request payload, but you will be uploading an XML data file. See the [uploadFile reference documentation](https://developer.ebay.com/api-docs/sell/feed/resources/task/methods/uploadFile) and/or the [Create the data file](https://developer.ebay.com/api-docs/sell/static/feed/lms-feeds-working-with-lms.html#create-the-data-file) topic for more details on how to create and upload the XML file. If the [uploadFile](https://developer.ebay.com/api-docs/sell/feed/resources/task/methods/uploadFile) call is successful, an HTTP status code of 202 Accepted should be returned. Uploaded files are processed asynchronously, so it may take some time to process the file based on the size of the file.
4.  Run another [getTask](/api-docs/sell/feed/resources/task/methods/getTask) method (using the same task ID) to check status. This time, you will want to see a value of COMPLETED or COMPLETED\_WITH\_ERROR. COMPLETED is preferable over COMPLETED\_WITH\_ERROR, as the latter generally indicates that one or more listings were not relisted successfully. Also check the [uploadSummary](/api-docs/sell/feed/resources/task/methods/getTask#response.uploadSummary) container. If all listings were successfully relisted, you should see a value of 0 in the [uploadSummary.failureCount](/api-docs/sell/feed/resources/task/methods/getTask#response.uploadSummary.failureCount) field.
5.  Use the [getResultFile](https://developer.ebay.com/api-docs/sell/feed/resources/task/methods/getResultFile) method (using the same task ID as a path parameter) to retrieve the file that indicates the results of the listings relisting task. A completely successful task should show new item ID values for the newly relisted listings. For any listings that were not relisted successfully, you should see an **Errors** container that indicates the issue(s) with one or more listings.

##### Retrieving listings

Retrieving eBay listings with APIs varies based on whether you use the [Inventory API](/api-docs/sell/inventory/resources/methods), the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting), or the [Sell Feed API](/api-docs/sell/feed/resources/methods), so they will be covered individually below.

###### Retrieving listings using the Inventory API

When using the [Inventory API](/api-docs/sell/inventory/resources/methods), eBay listings are actually comprised of an **inventory\_item** object and an **offer** object, with the **inventory\_item** object describing details of the item/product, and the **offer** object describing all non-product, offer-related details such as price, category, quantity, listing details, and others.

**Inventory\_item** objects can be retrieved using the following GET methods:

*   [getInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItem): retrieves a specific **inventory\_item** object, using its SKU value as a path parameter.
*   [getInventoryItems](/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItems): retrieves all of a seller’s **inventory\_item** objects across all eBay marketplaces. The response for this method can be quite large, so pagination control is available.
*   [bulkGetInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/bulkGetInventoryItem): retrieves up to 25 **inventory\_item** objects, with the SKU values being specified in the request payload.

The **inventory\_item** objects returned in the responses of these three methods are essentially the same. Product details are shown in the [product](/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItem#response.product) container, item condition is shown in the [condition](/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItem#response.condition) field, and available quantity (overall quantity and location-specific) is shown in the [availability](/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItem#response.availability) container. 

**Offer** objects can be retrieved using the [getOffer](/api-docs/sell/inventory/resources/offer/methods/getOffer) or [getOffers](/api-docs/sell/inventory/resources/offer/methods/getOffers) method. The **offer** object returned in the responses of these two methods are the same, but the [getOffer](/api-docs/sell/inventory/resources/offer/methods/getOffer) method requires an **offerId** value as a path parameter and the [getOffers](/api-docs/sell/inventory/resources/offer/methods/getOffers) method requires a [sku](/api-docs/sell/inventory/resources/offer/methods/getOffers#uri.sku) value as a query parameter.

Note that the [status](/api-docs/sell/inventory/resources/offer/methods/getOffers#response.offers.status) field indicates whether or not the **offer** object is published (part of an active listing) or unpublished (not part of an active listing). For published offers, the identifier of the listing is shown in the [listing.listingId](/api-docs/sell/inventory/resources/offer/methods/getOffers#response.offers.listing.listingId) field. The [listing.listingStatus](/api-docs/sell/inventory/resources/offer/methods/getOffers#response.offers.listing.listingStatus) field will show the status of the listing, as defined in the [ListingStatusEnum](/api-docs/sell/inventory/types/slr:ListingStatusEnum). The [sku](/api-docs/sell/inventory/resources/offer/methods/getOffers#response.offers.sku) value in the response will indicate which **inventory\_item** object is associated with the **offer** object, and the [marketplaceId](/api-docs/sell/inventory/resources/offer/methods/getOffer#response.marketplaceId) value will indicate the eBay marketplace that contains the listing.

To retrieve information on one or more item variations within a multiple-variation listing, you should use the [getInventoryItemGroup](/api-docs/sell/inventory/resources/inventory_item_group/methods/getInventoryItemGroup) and reference the SKU values returned in the [variantSKUs](/api-docs/sell/inventory/resources/inventory_item_group/methods/getInventoryItemGroup#response.variantSKUs) array.

###### Retrieving listings using the Trading API

There are a few GET calls in the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting) to retrieve eBay listings, with the main one being [GetItem](/Devzone/XML/docs/Reference/eBay/GetItem.html). [GetItem](/Devzone/XML/docs/Reference/eBay/GetItem.html) requires either an [ItemID](/Devzone/XML/docs/Reference/eBay/GetItem.html#Request.ItemID) value or a [SKU](/Devzone/XML/docs/Reference/eBay/GetItem.html#Request.SKU) value (if one is defined) in the request payload to identify the active eBay listing. If a user wants to retrieve a multiple-variation listing but is only interested in one item variation specifically, they can specify the variation they’d like to see by using the [VariationSKU](/Devzone/XML/docs/Reference/eBay/GetItem.html#Request.VariationSKU) field. [GetItem](/Devzone/XML/docs/Reference/eBay/GetItem.html) also has a variety of other inclusive filters that control how much and what item-related data is returned in the response.

The other two GET calls in the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting) used to retrieve listings are briefly described below:

*   [GetSellerList](/Devzone/XML/docs/Reference/eBay/GetSellerList.html): this call can retrieve multiple listings for a seller, and the filter options include the following:

*   Retrieve listings based on [Start time](/Devzone/XML/docs/Reference/eBay/GetSellerList.html#Request.StartTimeFrom) or [End time](/Devzone/XML/docs/Reference/eBay/GetSellerList.html#Request.EndTimeFrom) date range. 
*   Retrieve all listings from a specific [Category](/Devzone/XML/docs/Reference/eBay/GetSellerList.html#Request.CategoryID).
*   Retrieve multiple listings based on [SKU](/Devzone/XML/docs/Reference/eBay/GetSellerList.html#Request.SKUArray.SKU) values..
*   Retrieve all recent listings that were [administratively ended](/Devzone/XML/docs/Reference/eBay/GetSellerList.html#Request.AdminEndedItemsOnly) by eBay due to a listing policy violation.

*   [GetSellerEvents](/Devzone/XML/docs/Reference/eBay/GetSellerEvents.html): this call can retrieve multiple listings for a seller based on [Start time](/Devzone/XML/docs/Reference/eBay/GetSellerEvents.html#Request.StartTimeFrom), [Last modified time](/Devzone/XML/docs/Reference/eBay/GetSellerEvents.html#Request.ModTimeFrom), or [End time](/Devzone/XML/docs/Reference/eBay/GetSellerEvents.html#Request.EndTimeFrom) date range. This call has a variety of other inclusive filters that control how much and what item-related data is returned in the response.

The [GetSellerList](/Devzone/XML/docs/Reference/eBay/GetSellerList.html) call has a short-duration call limit of 300 calls within any 15-second interval. If this threshold is met, subsequent calls will be blocked. Similarly, the [GetSellerEvents](/Devzone/XML/docs/Reference/eBay/GetSellerEvents.html) call has a short-duration call limit of 1000 calls within any 15-second interval. If this threshold is met, subsequent calls will be blocked.

###### Retrieving all active listings using the Sell Feed API

The [Sell Feed API](/api-docs/sell/feed/resources/methods) can only be used to retrieve price and quantity information for all active listings across all eBay marketplaces. Below is the process to generate and download the Active Inventory Report:

1.  Use the [createInventoryTask](/api-docs/sell/feed/resources/inventory_task/methods/createInventoryTask) method to create the task, setting the request fields as follows:

*   Set [feedType](/api-docs/sell/feed/resources/inventory_task/methods/createInventoryTask#request.feedType) field value to LMS\_ACTIVE\_INVENTORY\_REPORT.
*   Set [schemaVersion](/api-docs/sell/feed/resources/inventory_task/methods/createInventoryTask#request.schemaVersion) field value to 1.0.
*   Optionally, use the [filterCriteria.listingFormat](/api-docs/sell/feed/resources/inventory_task/methods/createInventoryTask#request.filterCriteria.listingFormat) field to retrieve only auction listings or only fixed price listings.

3.  Using the URI that is returned in the [Location](/api-docs/sell/feed/resources/inventory_task/methods/createInventoryTask#h2-output) response header, use the [getInventoryTask](/api-docs/sell/feed/resources/inventory_task/methods/getInventoryTask) method to get the [status](/api-docs/sell/feed/resources/inventory_task/methods/getInventoryTask#response.status) of the inventory task. The LMS\_ACTIVE\_INVENTORY\_REPORT feed type is processed asynchronously, and may take some time to complete based on the number of active listings that the seller has. The [status](/api-docs/sell/feed/resources/inventory_task/methods/getInventoryTask#response.status) field value should be COMPLETED before the next step.
4.  Use the [getResultFile](/api-docs/sell/feed/resources/task/methods/getResultFile) file method to download the Active Inventory Report. The same task ID for the task is passed in here as a path parameter. If this call is successful, the Active Inventory Report will be downloaded as a zipped file. See the [ActiveInventoryReport](/devzone/merchant-data/callref/activeinventoryreport.html) reference documentation to see the fields that will be downloaded for each active listing. 

##### Ending listings

Ending eBay listings with APIs varies based on whether you use the [Inventory API](/api-docs/sell/inventory/resources/methods), the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting), or the [Sell Feed API](/api-docs/sell/feed/resources/methods), so they will be covered individually below.

###### Ending listings using the Inventory API

There are a number of ways that an active listing created with the [Inventory API](/api-docs/sell/inventory/resources/methods) can be ended. The different [Inventory API](/api-docs/sell/inventory/resources/methods) methods that can be used to end listings are covered below: 

*   The [withdrawOffer](/api-docs/sell/inventory/resources/offer/methods/withdrawOffer) method is used to end a single-variation eBay listing. If the operation is successful, the **offer** object remains, but just goes from the PUBLISHED state to the UNPUBLISHED state.  
*   The [deleteOffer](/api-docs/sell/inventory/resources/offer/methods/deleteOffer) method will end a single-variation eBay listing and it will also delete the **offer** object associated with that listing.
*   The [deleteInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/deleteInventoryItem) method will end a single-variation eBay listing and it will also delete the **inventory item** object and the **offer** object associated with that listing.
*   The [withdrawOfferByInventoryItemGroup](/api-docs/sell/inventory/resources/offer/methods/withdrawOfferByInventoryItemGroup) method is used to end a multiple-variation eBay listing, The **inventory\_item\_group** object and all **inventory item** and **offer** objects in the group remain intact, but all offers just go from the PUBLISHED state to the UNPUBLISHED state.
*   The [deleteInventoryItemGroup](/api-docs/sell/inventory/resources/inventory_item_group/methods/deleteInventoryItemGroup) method will end a multiple-variation eBay listing and also delete the **inventory item group** object, but the **inventory item** objects and the **offer** objects associated with that listing will remain intact other than the status of the **offer** objects going from the PUBLISHED state to the UNPUBLISHED state.

###### Ending listings using the Trading API

An active listing can be ended with the [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting) using [EndItem](/Devzone/XML/docs/Reference/eBay/EndItem.html) or [EndFixedPriceItem](/Devzone/XML/docs/Reference/eBay/EndFixedPriceItem.html), or up to 10 active listings can be ended with one [EndItems](/Devzone/XML/docs/Reference/eBay/EndItems.html) call. As its name suggests, [EndFixedPriceItem](/Devzone/XML/docs/Reference/eBay/EndFixedPriceItem.html) only supports fixed price listings (single and multiple-variations). 

For both [EndItem](/Devzone/XML/docs/Reference/eBay/EndItem.html) and [EndFixedPriceItem](/Devzone/XML/docs/Reference/eBay/EndFixedPriceItem.html), the listing to end must be identified through the [ItemID](/Devzone/XML/docs/Reference/eBay/EndItem.html#Request.ItemID) ([EndFixedPriceItem](/Devzone/XML/docs/Reference/eBay/EndFixedPriceItem.html) also supports a [SKU](/Devzone/XML/docs/Reference/eBay/EndFixedPriceItem.html#Request.SKU) field to identify a listing) and an [EndingReason](/Devzone/XML/docs/Reference/eBay/EndItem.html#Request.EndingReason) value must also be specified. The [EndItem](/Devzone/XML/docs/Reference/eBay/EndItem.html) call can be used to end an auction, fixed price, or classified ad listing, but will not work for a multiple-variation fixed price listing. The [EndFixedPriceItem](/Devzone/XML/docs/Reference/eBay/EndFixedPriceItem.html) call can be used to end a single-variation or multiple-variation fixed price listing.

The [EndItems](/Devzone/XML/docs/Reference/eBay/EndItems.html) call behaves in the same way as the [EndItem](/Devzone/XML/docs/Reference/eBay/EndItem.html) call, but up to 10 listings can be ended instead of just one. The [EndItems](/Devzone/XML/docs/Reference/eBay/EndItems.html) call also supports a [MessageID](/Devzone/XML/docs/Reference/eBay/EndItems.html#Request.EndItemRequestContainer.MessageID) field for each listing to be ended and a corresponding [CorrelationID](/Devzone/XML/docs/Reference/eBay/EndItems.html#Response.EndItemResponseContainer.CorrelationID) response field that allows users to correlate the listings in the request to the listings in the response.

For all three End calls, you will know if a listing has been successfully ended if the [EndTime](/Devzone/XML/docs/Reference/eBay/EndItem.html#Response.EndTime) appears in the response and no errors/warnings are returned.

###### Ending listings in bulk using Sell Feed API

The flow diagram below provides a visual representation of how to end multiple listings using the [Sell Feed API](/api-docs/sell/feed/resources/methods):

![Banner image](/cms/img/listingmanagement/end-bulk-listing-sell-feed.png)

Here are the necessary steps to take in the [Sell Feed API](/api-docs/sell/feed/resources/methods) to end multiple listings:

1.  Stage the task using the [createTask](/api-docs/sell/feed/resources/task/methods/createTask) method. Use the **X-EBAY-C-MARKETPLACE-ID** header to set the listing marketplace, and set the [feedType](/api-docs/sell/feed/resources/task/methods/createTask#request.feedType) value in the request payload to either **LMS\_END\_ITEM** or **LMS\_END\_FIXED\_PRICE\_ITEM.** As its name suggests, the **LMS\_END\_FIXED\_PRICE\_ITEM** feed type only supports ending fixed price listings (single and multiple-variations). If the call is successful, the **getTask** URI for the task is returned in the **Location** response header.
2.  Use the [getTask](/api-docs/sell/feed/resources/task/methods/getTask) method to check the status of the task. The value returned in the [status](/api-docs/sell/feed/resources/task/methods/getTask#response.status) field should be CREATED. Proceed to the next step if you see this value.
3.  Use the [uploadFile](https://developer.ebay.com/api-docs/sell/feed/resources/task/methods/uploadFile) method to upload the **LMS\_END\_ITEM** or **LMS\_END\_FIXED\_PRICE\_ITEM** feed file.The same task ID returned in [createTask](https://developer.ebay.com/api-docs/sell/feed/resources/task/methods/createTask) method is used as a path parameter for this method. The [uploadFile](https://developer.ebay.com/api-docs/sell/feed/resources/task/methods/uploadFile) method does not have a request payload, but you will be uploading an XML data file. See the [uploadFile reference documentation](https://developer.ebay.com/api-docs/sell/feed/resources/task/methods/uploadFile) and/or the [Create the data file](https://developer.ebay.com/api-docs/sell/static/feed/lms-feeds-working-with-lms.html#create-the-data-file) topic for more details on how to create and upload the XML file. If the [uploadFile](https://developer.ebay.com/api-docs/sell/feed/resources/task/methods/uploadFile) call is successful, an HTTP status code of 202 Accepted should be returned. Uploaded files are processed asynchronously, so it may take some time to process the file based on the size of the file.
4.  Run another [getTask](/api-docs/sell/feed/resources/task/methods/getTask) method (using the same task ID) to check status. This time, you will want to see a value of COMPLETED or COMPLETED\_WITH\_ERROR. COMPLETED is preferable over COMPLETED\_WITH\_ERROR, as the latter generally indicates that one or more listings were not ended successfully. Also check the [uploadSummary](/api-docs/sell/feed/resources/task/methods/getTask#response.uploadSummary) container. If all listings were successfully ended, you should see a value of 0 in the [uploadSummary.failureCount](/api-docs/sell/feed/resources/task/methods/getTask#response.uploadSummary.failureCount) field.
5.  Use the [getResultFile](https://developer.ebay.com/api-docs/sell/feed/resources/task/methods/getResultFile) method (using the same task ID as a path parameter) to retrieve the file that indicates the results of the end listings task. A completely successful task should show **EndTime** values for the successfully ended listings. For any listings that were not ended successfully, you should see an **Errors** container that indicates the issue(s) with one or more listings.

## Code Samples

## Error Handling

*   eBay has a policy where each active listing may only be revised up to 250 times per calendar day, so any API operation that attempts to revise a listing beyond that maximum threshold will fail. The user will need to wait until the next calendar day to make additional revisions.
*   An active listing created using the [Inventory API](/api-docs/sell/inventory/resources/methods) cannot be revised using [Trading API](/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting) Revise/Relist calls. 
*   JavaScript cannot be used in any seller-defined, text-based fields (such as item description) and will lead to an error.
*   When using the [Sell Feed API](/api-docs/sell/feed/resources/methods), the feed type specified through the [feedType](/api-docs/sell/feed/resources/task/methods/createTask#request.feedType) field of the [createTask](/api-docs/sell/feed/resources/task/methods/createTask) method should match the actual object types being uploaded through the [uploadFile](/api-docs/sell/feed/resources/task/methods/uploadFile) method.
*   There are quite a few revision restrictions for auction listings. Some restrictions start as soon as the item has one or more active bids, and then more restrictions kick in once the auction listing has less than 12 hours before ending. Fixed priced listings also have some revision restrictions, including when the listing has open Best Offers. See the [Revise a listing](https://www.ebay.com/help/selling/listings/creating-managing-listings/revising-listing?id=4356) help topic for more information on these restrictions. An error will occur if a Revise call is attempted for a revision that is not allowed.

## Best Practices

*   Revising a listing generally does not incur eBay fees unless a fee-based option is added such as adding a subtitle or adding a Reserve Price to auction listings. 
*   As an alternative to using the [Trading API](/Devzone/XML/docs/Reference/eBay/index.html) sandbox environment, the [VerifyRelistItem](/DevZone/XML/docs/Reference/eBay/VerifyRelistItem.html) call can be used to test the validity of the item object in the production environment before that item is actually relisted. This call uses the same logic and validation as the [RelistItem](/Devzone/XML/docs/Reference/eBay/RelistItem.html) or [RelistFixedPriceItem](/Devzone/XML/docs/Reference/eBay/RelistFixedPriceItem.html) calls, but there is no risk of incurring any listing fees.
*   For those using [Inventory API](/api-docs/sell/inventory/resources/methods), the [bulkUpdatePriceQuantity](/api-docs/sell/inventory/resources/inventory_item/methods/bulkUpdatePriceQuantity) is a nice alternative to [bulkCreateOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem) or [updateOffer](/api-docs/sell/inventory/resources/offer/methods/updateOffer) when a user wants to update just the price and/or quantity for multiple listings.
*   The [getListingFees](/api-docs/sell/inventory/resources/offer/methods/getListingFees) method in the [Inventory API](/api-docs/sell/inventory/resources/methods) can be used against up to 250 unpublished offers to get the expected listing fees.
*   Like the names imply, the [createOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem) and [bulkCreateOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem) methods will do a complete replacement of inventory item objects, so you must pass in all applicable fields even if the values of those fields are not changing.
*   If you need to revise any active listing with a [createOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem) or a [bulkCreateOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem) method, you may want to consider using the [bulkGetInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/bulkGetInventoryItem), [getInventoryItems](/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItems), or [getInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItem) methods to retrieve the current state of the **inventory item** object(s) and then modify as needed with [createOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem) or [bulkCreateOrReplaceInventoryItem](/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem) methods. 
*   Consider using the [withdrawOffer](/api-docs/sell/inventory/resources/offer/methods/withdrawOffer) method to end an active listing instead of the [deleteOffer](/api-docs/sell/inventory/resources/offer/methods/deleteOffer) method if there’s a chance that you’d want to publish the offer again at a later date. The [deleteOffer](/api-docs/sell/inventory/resources/offer/methods/deleteOffer) method will end an active listing and it will delete the offer object associated with the listing.
*   Use the [withdrawOfferByInventoryItemGroup](/api-docs/sell/inventory/resources/offer/methods/withdrawOfferByInventoryItemGroup) method to end a multiple-variation listing. The inventory item group object itself and each offer associated with each variation in the group is not affected by this action other than all offers going from the PUBLISHED state to the UNPUBLISHED state.

## Code Samples

### Retrieve all inventory items defined in Inventory API

**Label:** Retrieve all inventory items defined in Inventory API

#### Bash Sample

```bash
curl -X GET "https://api.ebay.com/sell/inventory/v1/inventory_item?limit=2&offset=0" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Retrieve all inventory locations defined in Inventory API

**Label:** Retrieve all inventory locations defined in Inventory API

#### Bash Sample

```bash
curl -X GET "https://api.ebay.com/sell/inventory/v1/location?limit=20&offset=0" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Related Topics

- [Inventory API](/api-docs/sell/inventory/resources/methods)
- [Trading API](https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/StandardListingIndex.html#addlisting)
- [Sell Feed API](/api-docs/sell/feed/overview.html)
- [More Guides](/develop/guides)

