---
tags: [CJ API Docs]
title: CJ API Docs 015
created: '2025-12-31T02:57:13.833Z'
modified: '2025-12-31T02:58:20.859Z'
---

# CJ API Docs 015

# 3 Product | CJ Docs
[#](#_3-product) 3 Product
--------------------------

[#](#_1-products) 1 Products
----------------------------

### [#](#_1-1-category-list-get) 1.1 Category List(GET)

Get product categories from CJ.

#### [#](#url) URL

https://developers.cjdropshipping.com/api2.0/v1/product/getCategory

#### [#](#curl) CURL

#### [#](#return) Return

success


|Field             |Definition                |Type  |Length|Note|
|------------------|--------------------------|------|------|----|
|categoryFirstName |First level category name |string|200   |    |
|categoryFirstList |First level category list |Array |-     |    |
|categorySecondName|Second level category name|string|200   |    |
|categorySecondList|Second level category list|Array |-     |    |
|categoryId        |Third level category ID   |string|200   |    |
|categoryName      |Third level category name |string|200   |    |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_1-2-product-list-v2-get) 1.2 Product List V2(GET)

Get all available products from CJ with criteria inquiry supported. V2 version uses elasticsearch search engine for higher performance product search capabilities.

Note:

1.  Supports keyword search
2.  Supports multiple filter conditions such as price range, category, country, etc.
3.  Supports sorting functionality
4.  Through the features parameter, you can selectively return product details and category information
5.  page minimum value 1, maximum value 1000; size minimum value 1, maximum value 100

#### [#](#url-2) URL

https://developers.cjdropshipping.com/api2.0/v1/product/listV2

#### [#](#curl-2) CURL



* Parameter: keyWord
  * Definition: Search keyword
  * Type: string
  * Required: N
  * Length: 200
  * Note: Product name or SKU keyword search
* Parameter: page
  * Definition: Page number
  * Type: int
  * Required: N
  * Length: 20
  * Note: Default 1, minimum 1, maximum 1000
* Parameter: size
  * Definition: Quantity of results on each page
  * Type: int
  * Required: N
  * Length: 20
  * Note: Default 10, minimum 1, maximum 100
* Parameter: categoryId
  * Definition: Category ID
  * Type: string
  * Required: N
  * Length: 200
  * Note: Filter products by third level category ID
* Parameter: lv2categoryList
  * Definition: Second level category ID list
  * Type: array
  * Required: N
  * Length: 
  * Note: Filter products by second level category ID list
* Parameter: lv3categoryList
  * Definition: Third level category ID list
  * Type: array
  * Required: N
  * Length: 
  * Note: Filter products by third level category ID list
* Parameter: countryCode
  * Definition: Country code
  * Type: string
  * Required: N
  * Length: 200
  * Note: Format: CN,US,GB,FR etc., filter products with inventory in specified countries
* Parameter: startSellPrice
  * Definition: Start sell price
  * Type: decimal
  * Required: N
  * Length: 
  * Note: Price filter start value
* Parameter: endSellPrice
  * Definition: End sell price
  * Type: decimal
  * Required: N
  * Length: 
  * Note: Price filter end value
* Parameter: addMarkStatus
  * Definition: Is free shipping
  * Type: int
  * Required: N
  * Length: 1
  * Note: 0-not free shipping, 1-free shipping
* Parameter: productType
  * Definition: Product type
  * Type: int
  * Required: N
  * Length: 15
  * Note: 4-Supplier product, 10-Video product, 11-Non-video product
* Parameter: productFlag
  * Definition: Product flag
  * Type: int
  * Required: N
  * Length: 1
  * Note: 0-Trending products, 1-New products, 2-Video products, 3-Slow-moving products
* Parameter: startWarehouseInventory
  * Definition: Start warehouse inventory
  * Type: int
  * Required: N
  * Length: 
  * Note: Filter products with inventory greater than or equal to this value
* Parameter: endWarehouseInventory
  * Definition: End warehouse inventory
  * Type: int
  * Required: N
  * Length: 
  * Note: Filter products with inventory less than or equal to this value
* Parameter: verifiedWarehouse
  * Definition: Verified warehouse type
  * Type: int
  * Required: N
  * Length: 1
  * Note: null/0-All(default), 1-Verified inventory, 2-Unverified inventory
* Parameter: timeStart
  * Definition: Listing time filter start
  * Type: long
  * Required: N
  * Length: 
  * Note: Listing start time timestamp (milliseconds)
* Parameter: timeEnd
  * Definition: Listing time filter end
  * Type: long
  * Required: N
  * Length: 
  * Note: Listing end time timestamp (milliseconds)
* Parameter: zonePlatform
  * Definition: Zone platform suggestion
  * Type: string
  * Required: N
  * Length: 200
  * Note: Such as: shopify,ebay,amazon,tiktok,etsy etc.
* Parameter: isWarehouse
  * Definition: Is global warehouse search
  * Type: boolean
  * Required: N
  * Length: 1
  * Note: true-yes, false-no
* Parameter: currency
  * Definition: Currency
  * Type: string
  * Required: N
  * Length: 10
  * Note: Such as: USD,AUD,EUR etc.
* Parameter: sort
  * Definition: Sort direction
  * Type: string
  * Required: N
  * Length: 4
  * Note: desc-descending(default) / asc-ascending
* Parameter: orderBy
  * Definition: Sort field
  * Type: int
  * Required: N
  * Length: 20
  * Note: 0=best match(default); 1=listing count; 2=sell price; 3=create time; 4=inventory
* Parameter: features
  * Definition: Features list
  * Type: array
  * Required: N
  * Length: 200
  * Note: Supported values: enable_description(return product details), enable_category(return product category information), enable_combine(return combine product info), enable_video(return video IDs)
* Parameter: supplierId
  * Definition: Supplier ID
  * Type: string
  * Required: N
  * Length: 200
  * Note: Filter products by supplier ID
* Parameter: hasCertification
  * Definition: Has certification
  * Type: int
  * Required: N
  * Length: 1
  * Note: 0-No, 1-Yes
* Parameter: isSelfPickup
  * Definition: Is self pickup
  * Type: int
  * Required: N
  * Length: 1
  * Note: 0-No, 1-Yes
* Parameter: customization
  * Definition: Is customization product
  * Type: int
  * Required: N
  * Length: 1
  * Note: 0-No, 1-Yes


#### [#](#return-2) Return

success


|Field       |Definition         |Type |Length|Note                                        |
|------------|-------------------|-----|------|--------------------------------------------|
|pageSize    |Page size          |long |20    |Number of products per page                 |
|pageNumber  |Current page number|long |20    |Current requested page number, starts from 1|
|totalRecords|Total records      |long |20    |Total number of products matching criteria  |
|totalPages  |Total pages        |long |20    |Total pages                                 |
|content     |Content list       |array|      |Product data list                           |


**CjProductInfoSearchV2DTO object in content:**



* Field: productList
  * Definition: Product list
  * Type: array
  * Length: 
  * Note: Product information array
* Field: relatedCategoryList
  * Definition: Related category list
  * Type: array
  * Length: 
  * Note: Related categories matched by search keyword list
* Field: keyWord
  * Definition: Search keyword
  * Type: string
  * Length: 200
  * Note: Actual search keyword used
* Field: keyWordOld
  * Definition: Original search keyword
  * Type: string
  * Length: 200
  * Note: Original search keyword entered by user


**Product object in productList:**



* Field: id
  * Definition: Product ID
  * Type: string
  * Length: 200
  * Note: Unique product identifier
* Field: nameEn
  * Definition: Product name (English)
  * Type: string
  * Length: 200
  * Note: Product English name
* Field: sku
  * Definition: Product SKU
  * Type: string
  * Length: 200
  * Note: Product SKU code
* Field: spu
  * Definition: Product SPU
  * Type: string
  * Length: 200
  * Note: Product SPU code, same as SKU
* Field: bigImage
  * Definition: Product main image
  * Type: string
  * Length: 200
  * Note: Product main image URL
* Field: sellPrice
  * Definition: Sell price
  * Type: string
  * Length: 20
  * Note: Product sell price, unit: USD
* Field: nowPrice
  * Definition: Discount price
  * Type: string
  * Length: 20
  * Note: Product discount price
* Field: discountPrice
  * Definition: Best discount price
  * Type: string
  * Length: 20
  * Note: Best discount price
* Field: discountPriceRate
  * Definition: Discount rate
  * Type: string
  * Length: 20
  * Note: Discount percentage
* Field: listedNum
  * Definition: Listed number
  * Type: int
  * Length: 20
  * Note: Number of times this product is listed on the platform
* Field: isCollect
  * Definition: Is collected
  * Type: int
  * Length: 1
  * Note: 0-not collected, 1-collected
* Field: categoryId
  * Definition: Third level category ID
  * Type: string
  * Length: 200
  * Note: Product third level category ID
* Field: threeCategoryName
  * Definition: Third level category name
  * Type: string
  * Length: 200
  * Note: Third level category name (returned only when features contains enable_category)
* Field: twoCategoryId
  * Definition: Second level category ID
  * Type: string
  * Length: 200
  * Note: Product second level category ID
* Field: twoCategoryName
  * Definition: Second level category name
  * Type: string
  * Length: 200
  * Note: Second level category name (returned only when features contains enable_category)
* Field: oneCategoryId
  * Definition: First level category ID
  * Type: string
  * Length: 200
  * Note: Product first level category ID
* Field: oneCategoryName
  * Definition: First level category name
  * Type: string
  * Length: 200
  * Note: First level category name (returned only when features contains enable_category)
* Field: addMarkStatus
  * Definition: Is free shipping
  * Type: int
  * Length: 1
  * Note: 0-not free shipping, 1-free shipping
* Field: isVideo
  * Definition: Has video
  * Type: int
  * Length: 1
  * Note: 0-no video, 1-has video
* Field: videoList
  * Definition: Video ID list
  * Type: array
  * Length: 
  * Note: Product video ID collection (returned only when features contains enable_video)
* Field: productType
  * Definition: Product type
  * Type: string
  * Length: 20
  * Note: Product type code
* Field: supplierName
  * Definition: Supplier name
  * Type: string
  * Length: 200
  * Note: Product supplier name
* Field: createAt
  * Definition: Create time
  * Type: long
  * Length: 20
  * Note: Product create timestamp (milliseconds)
* Field: setRecommendedTime
  * Definition: Recommended time
  * Type: long
  * Length: 20
  * Note: Set recommended timestamp
* Field: warehouseInventoryNum
  * Definition: Warehouse inventory number
  * Type: long
  * Length: 20
  * Note: Total inventory number
* Field: totalVerifiedInventory
  * Definition: Total verified inventory
  * Type: int
  * Length: 20
  * Note: Total verified inventory
* Field: totalUnVerifiedInventory
  * Definition: Total unverified inventory
  * Type: int
  * Length: 20
  * Note: Total unverified inventory
* Field: verifiedWarehouse
  * Definition: Verified warehouse identifier
  * Type: int
  * Length: 1
  * Note: 1-Verified inventory, 2-Unverified inventory
* Field: customization
  * Definition: Is customization product
  * Type: int
  * Length: 1
  * Note: 0-No, 1-Yes
* Field: isPersonalized
  * Definition: Is personalized customization
  * Type: int
  * Length: 1
  * Note: 0-No, 1-Yes
* Field: hasCECertification
  * Definition: Has CE certification
  * Type: int
  * Length: 1
  * Note: 0-No, 1-Yes
* Field: myProduct
  * Definition: Is added to my products
  * Type: boolean
  * Length: 1
  * Note: true-added, false-not added
* Field: currency
  * Definition: Currency
  * Type: string
  * Length: 10
  * Note: Such as: USD, AUD, EUR etc.
* Field: description
  * Definition: Product description
  * Type: string
  * Length: 2000
  * Note: Detailed product description (returned only when features contains enable_description)
* Field: deliveryCycle
  * Definition: Delivery cycle
  * Type: string
  * Length: 20
  * Note: Product delivery cycle in days
* Field: saleStatus
  * Definition: Sale status
  * Type: string
  * Length: 2
  * Note: 3-approved for sale
* Field: authorityStatus
  * Definition: User visible permission
  * Type: string
  * Length: 1
  * Note: 0-private visible, 1-all visible
* Field: autStatus
  * Definition: Product visibility
  * Type: string
  * Length: 1
  * Note: Product visibility status
* Field: isAut
  * Definition: Is permanent private
  * Type: string
  * Length: 1
  * Note: 0-not permanent private, 1-permanent private
* Field: isList
  * Definition: Is listed
  * Type: int
  * Length: 1
  * Note: 0-not listed, 1-listed
* Field: syncListedProductStatus
  * Definition: Listing status
  * Type: string
  * Length: 1
  * Note: 0-pending, 1-listing, 2-failed, 3-success, 4-cancelled
* Field: isAd
  * Definition: Is advertisement product
  * Type: int
  * Length: 1
  * Note: 0-not ad, 1-ad product
* Field: activityId
  * Definition: Advertisement product ID
  * Type: string
  * Length: 200
  * Note: Advertisement activity ID
* Field: directMinOrderNum
  * Definition: Minimum order quantity
  * Type: string
  * Length: 20
  * Note: Minimum order quantity
* Field: zoneRecommendJson
  * Definition: Zone recommend list
  * Type: set
  * Length: 
  * Note: Zone recommend tag collection
* Field: inventoryInfo
  * Definition: Warehouse inventory info
  * Type: string
  * Length: 
  * Note: Warehouse inventory details JSON
* Field: variantKeyEn
  * Definition: Variant property
  * Type: string
  * Length: 200
  * Note: Variant property English description
* Field: variantInventories
  * Definition: Variant inventory info
  * Type: string
  * Length: 
  * Note: Variant inventory details JSON
* Field: propertyKey
  * Definition: Product logistics property key
  * Type: string
  * Length: 200
  * Note: Product logistics property keywords


Product Type



* Product Type: ORDINARY_PRODUCT
  * Description: Ordinary product, managed by CJ for inventory management
  * Note: Managed by CJ for inventory and shipping
* Product Type: SERVICE_PRODUCT
  * Description: Service product, If you need to transfer your own goods to CJ warehouse and CJ provides warehousing services, we will mark it as a service item
  * Note: Your own products with CJ warehousing services
* Product Type: PACKAGING_PRODUCT
  * Description: Packaging product are used for packaging when shipped from the warehouse. They do not support separate shipping and need to be shipped together with other goods
  * Note: For packaging only, cannot be sold separately
* Product Type: SUPPLIER_PRODUCT
  * Description: Supplier product, It is a merchant that collaborates with CJ to manage inventory of goods
  * Note: Supplier products, managed and shipped by CJ
* Product Type: SUPPLIER_SHIPPED_PRODUCT
  * Description: Shipped by supplier management
  * Note: Supplier products, managed and shipped by suppliers


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |Error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |Return message                     |string |200   |                               |
|data     |Return data                        |object |      |Business data                  |
|requestId|Request ID                         |string |48    |Flag request for logging errors|


### [#](#_1-3-global-warehouse-list-get) 1.3 Global Warehouse List(GET)

Get the list of all available global warehouses.

#### [#](#url-3) URL

https://developers.cjdropshipping.com/api2.0/v1/product/globalWarehouseList

#### [#](#curl-3) CURL

#### [#](#request-parameters) Request Parameters

No parameters required

#### [#](#return-3) Return

success


|Field      |Definition         |Type   |Length|Note                                              |
|-----------|-------------------|-------|------|--------------------------------------------------|
|areaCn     |Warehouse name (CN)|string |200   |Chinese name of the warehouse                     |
|areaEn     |Warehouse name (EN)|string |200   |English name of the warehouse                     |
|areaId     |Warehouse ID       |int    |20    |Unique warehouse identifier                       |
|countryCode|Country code       |string |10    |ISO country code, e.g., CN, US, GB                |
|nameEn     |Country name (EN)  |string |200   |English name of the country                       |
|valueEn    |Warehouse code     |string |10    |Warehouse code value, usually matches country code|
|disabled   |Is disabled        |boolean|1     |true-disabled, false-available                    |
|zh         |Chinese name       |string |200   |Multi-language support - Chinese                  |
|en         |English name       |string |200   |Multi-language support - English                  |
|de         |German name        |string |200   |Multi-language support - German                   |
|fr         |French name        |string |200   |Multi-language support - French                   |
|th         |Thai name          |string |200   |Multi-language support - Thai                     |
|id         |Warehouse string ID|string |20    |String format of warehouse ID                     |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |Error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |Return message                     |string |200   |                               |
|data     |Return data                        |object |      |Business data                  |
|requestId|Request ID                         |string |48    |Flag request for logging errors|


### [#](#_1-4-product-list-get) 1.4 Product List(GET)

Get all available products from CJ, criteria inquiry supported. 20 results for each page, fixed.

Note:

1.  Maximum return of 200 data per page.
2.  Free users or v1 users are limited to a maximum of 1000 requests per day.(2024-09-30 update)
3.  One IP is limited to a maximum of three users.(2024-09-30 update)
4.  Query the product list and add "deliveryTime" field (hours). The values are 24, 48, 72, or null (2024-11-15 update)

#### [#](#url-4) URL

https://developers.cjdropshipping.com/api2.0/v1/product/list

#### [#](#curl-4) CURL



* Parameter: pageNum
  * Definition: Page number
  * Type: int
  * Required: N
  * Length: 20
  * Note: Default 1, specifies the page number of the product list to retrieve
* Parameter: pageSize
  * Definition: Quantity of results on each page
  * Type: int
  * Required: N
  * Length: 20
  * Note: Default 20, number of products returned per page, maximum 200
* Parameter: categoryId
  * Definition: category id
  * Type: string
  * Required: N
  * Length: 200
  * Note: Inquiry criteria, filter products by category ID
* Parameter: pid
  * Definition: Product id
  * Type: string
  * Required: N
  * Length: 200
  * Note: Filter products by unique product identifier
* Parameter: productSku
  * Definition: Product sku
  * Type: string
  * Required: N
  * Length: 200
  * Note: Filter products by SKU
* Parameter: productName
  * Definition: Product name
  * Type: string
  * Required: N
  * Length: 200
  * Note: Fuzzy match by product Chinese name
* Parameter: productNameEn
  * Definition: Product name(en)
  * Type: string
  * Required: N
  * Length: 200
  * Note: Fuzzy match by product English name
* Parameter: productType
  * Definition: Product type
  * Type: string
  * Required: N
  * Length: 200
  * Note: Optional values: ORDINARY_PRODUCT, SUPPLIER_PRODUCT - Returns all types if not provided
* Parameter: countryCode
  * Definition: countryCode
  * Type: string
  * Required: N
  * Length: 200
  * Note: Example: CN, US - Filter products with inventory in specified countries
* Parameter: deliveryTime
  * Definition: Delivery Time (hours)
  * Type: string
  * Required: N
  * Length: 200
  * Note: Optional values: 24 (ships within 24 hours), 48 (ships within 48 hours), 72 (ships within 72 hours) - Returns only products meeting the specified delivery time
* Parameter: verifiedWarehouse
  * Definition: Verified Inventory Type
  * Type: number
  * Required: N
  * Length: 1
  * Note: Optional values: 1 (Verified), 2 (Unverified) - Not passing values means not restricting queries based on that type
* Parameter: startInventory
  * Definition: the minimum inventory
  * Type: number
  * Required: N
  * Length: 
  * Note: eg: 2, filter products with inventory greater than or equal to this value
* Parameter: endInventory
  * Definition: the highest inventory
  * Type: number
  * Required: N
  * Length: 
  * Note: eg: 10, filter products with inventory less than or equal to this value
* Parameter: createTimeFrom
  * Definition: create time(start)
  * Type: string
  * Required: N
  * Length: 200
  * Note: format: yyyy-MM-dd hh:mm:ss, filter products created after this time
* Parameter: createTimeTo
  * Definition: create time(end)
  * Type: string
  * Required: N
  * Length: 200
  * Note: format: yyyy-MM-dd hh:mm:ss, filter products created before this time
* Parameter: brandOpenId
  * Definition: brand id
  * Type: long
  * Required: N
  * Length: 200
  * Note: Inquiry criteria, filter by brand ID
* Parameter: minPrice
  * Definition: minimum price
  * Type: number
  * Required: N
  * Length: 200
  * Note: Example: 1.0 - Filter products with price greater than or equal to this value
* Parameter: maxPrice
  * Definition: maximum price
  * Type: number
  * Required: N
  * Length: 200
  * Note: Example: 2.5 - Filter products with price less than or equal to this value
* Parameter: searchType
  * Definition: Search Type
  * Type: number
  * Required: N
  * Length: 5
  * Note: Optional values: 0 (All products), 2 (Trending Products), 21 (Trending Products View More) - Default is 0
* Parameter: minListedNum
  * Definition: Minimum Listed Num
  * Type: number
  * Required: N
  * Length: 10
  * Note: Example: 1 - Returns products with listing count greater than or equal to this value
* Parameter: maxListedNum
  * Definition: Maximum Listed Num
  * Type: number
  * Required: N
  * Length: 10
  * Note: Example: 10 - Returns products with listing count less than or equal to this value
* Parameter: sort
  * Definition: Sort Type
  * Type: string
  * Required: N
  * Length: 4
  * Note: Optional values: desc (descending order), asc (ascending order) - Default: desc
* Parameter: orderBy
  * Definition: Sort field
  * Type: string
  * Required: N
  * Length: 20
  * Note: Optional values: createAt (sort by creation time), listedNum (sort by listing count) - Default: createAt
* Parameter: isSelfPickup
  * Definition: Does the product support self pickup
  * Type: number
  * Required: N
  * Length: 1
  * Note: Optional values: 1 (supported), 0 (not supported)
* Parameter: supplierId
  * Definition: Supplier Id
  * Type: string
  * Required: N
  * Length: 40
  * Note: Filter products by supplier ID
* Parameter: isFreeShipping
  * Definition: Is Free Shipping?
  * Type: int
  * Required: N
  * Length: 1
  * Note: Optional values: 0 (not free), 1 (free shipping)
* Parameter: customizationVersion
  * Definition: Customization Version
  * Type: int
  * Required: N
  * Length: 1
  * Note: Optional values: 1 (Platform Customized Version V1), 2 (Platform Customized Version V2), 3 (Customer Customized Version V1), 4 (Customer Customized Version V2), 5 (POD 3.0 Platform Customized) - Filter POD products by customization version


#### [#](#return-4) Return

success



* Field: pageNum
  * Definition: Page number
  * Type: int
  * Length: 20
  * Note: Current page number
* Field: pageSize
  * Definition: Quantity of results on each page
  * Type: int
  * Length: 20
  * Note: Number of products per page
* Field: total
  * Definition: Total quantity of results
  * Type: int
  * Length: 20
  * Note: Total number of products matching criteria
* Field: list
  * Definition: Product list
  * Type: Product[]
  * Length: 
  * Note: List of product data
* Field: pid
  * Definition: Product ID
  * Type: string
  * Length: 200
  * Note: Unique product identifier
* Field: productName
  * Definition: Product name
  * Type: string
  * Length: 200
  * Note: Product Chinese name, may be a JSON array string with multiple names
* Field: productNameEn
  * Definition: Product name(EN)
  * Type: string
  * Length: 200
  * Note: Product English name
* Field: productSku
  * Definition: Product sku
  * Type: string
  * Length: 200
  * Note: Product SKU code
* Field: productImage
  * Definition: Product image
  * Type: string
  * Length: 200
  * Note: Product main image URL
* Field: productWeight
  * Definition: Product weight
  * Type: int
  * Length: 200
  * Note: Unit: g
* Field: productType
  * Definition: Product type
  * Type: byte
  * Length: 200
  * Note: Product type code
* Field: productUnit
  * Definition: Product unit
  * Type: string
  * Length: 48
  * Note: Product selling unit
* Field: categoryId
  * Definition: Category id
  * Type: string
  * Length: 200
  * Note: Product category ID
* Field: categoryName
  * Definition: Category name
  * Type: string
  * Length: 200
  * Note: Product category name
* Field: remark
  * Definition: Remark
  * Type: string
  * Length: 200
  * Note: Product remark information
* Field: addMarkStatus
  * Definition: Is shipping free? (Deprecated, please use isFreeShipping)
  * Type: int
  * Length: 1
  * Note: 0=Not free shipping, 1=free shipping
* Field: isFreeShipping
  * Definition: Is shipping free?
  * Type: boolean
  * Length: 1
  * Note: true for free shipping, false for paid shipping
* Field: listedNum
  * Definition: Listed number
  * Type: int
  * Length: 200
  * Note: Number of listings for this product on the platform
* Field: supplierName
  * Definition: Supplier name
  * Type: string
  * Length: 200
  * Note: Product supplier name
* Field: supplierId
  * Definition: Supplier id
  * Type: string
  * Length: 200
  * Note: Product supplier ID
* Field: sellPrice
  * Definition: Sell price
  * Type: decimal
  * Length: -
  * Note: Product selling price
* Field: createTime
  * Definition: Create time
  * Type: string
  * Length: -
  * Note: Product creation time on the platform
* Field: isVideo
  * Definition: Has video
  * Type: int
  * Length: 1
  * Note: 1 means includes video, 0 means no video
* Field: saleStatus
  * Definition: Sale status
  * Type: int
  * Length: 20
  * Note: 3 means approved for sale
* Field: customizationVersion
  * Definition: Customization Version
  * Type: int
  * Length: 1
  * Note: Custom product version number


Product Type



* Product Type: ORDINARY_PRODUCT
  * Description: Ordinary product， managed by CJ for inventory management
* Product Type: SERVICE_PRODUCT
  * Description: Service product, If you need to transfer your own goods to CJ warehouse and CJ provides warehousing services, we will mark it as a service item;
* Product Type: PACKAGING_PRODUCT
  * Description: Packaging product are used for packaging when shipped from the warehouse. They do not support separate shipping and need to be shipped together with other goods;
* Product Type: SUPPLIER_PRODUCT
  * Description: Supplier product,  It is a merchant that collaborates with CJ to manage inventory of goods
* Product Type: SUPPLIER_SHIPPED_PRODUCT
  * Description: shipped by supplier management


Product Status


|Status Code|Description|
|-----------|-----------|
|3          |On Sale    |


Customization Version


|Customization Version|remark                        |
|---------------------|------------------------------|
|0                    |Non-pod products              |
|1                    |Platform Customized Version V1|
|2                    |Platform Customized Version V2|
|3                    |Customer Customized Version V1|
|4                    |Customer Customized Version V2|
|5                    |POD 3.0 Platform Customized   |


Error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_1-3-product-details-get) 1.3 Product Details(GET)

#### [#](#url-5) URL

https://developers.cjdropshipping.com/api2.0/v1/product/query

#### [#](#curl-5) CURL



* Parameter: pid
  * Definition: Product id
  * Type: string
  * Required: Choose one of pid, productSku, variantSku
  * Length: 200
  * Note: Inquiry criteria, unique product identifier
* Parameter: productSku
  * Definition: Product sku
  * Type: string
  * Required: Choose one of pid, productSku, variantSku
  * Length: 200
  * Note: Inquiry criteria, product SPU code
* Parameter: variantSku
  * Definition: variant sku
  * Type: string
  * Required: Choose one of pid, productSku, variantSku
  * Length: 200
  * Note: Inquiry criteria, variant SKU code
* Parameter: features
  * Definition: features
  * Type: List
  * Required: N
  * Length: 200
  * Note: Optional values: enable_combine (includes combination variants, returns combination product info when passed), enable_video (includes videos, returns product video info when passed), enable_inventory (includes inventory, returns variant inventory info (include storage id) when passed)
* Parameter: countryCode
  * Definition: Country Code
  * Type: string
  * Required: N
  * Length: 2
  * Note: Country code such as CN, US - Only returns variants with inventory in that country, no restriction if not passed


#### [#](#return-5) Return

Success

Product



* Field: pid
  * Definition: Product ID
  * Type: string
  * Length: 200
  * Note: Unique product identifier
* Field: productName
  * Definition: Product name
  * Type: string
  * Length: 20
  * Note: Product Chinese name, in JSON array format
* Field: productNameEn
  * Definition: Product name(EN)
  * Type: string
  * Length: 200
  * Note: Product English name
* Field: productSku
  * Definition: Product sku
  * Type: string
  * Length: 200
  * Note: Product SKU code
* Field: productImage
  * Definition: Product image
  * Type: string
  * Length: 200
  * Note: Product main image URL
* Field: productWeight
  * Definition: Product weight
  * Type: int
  * Length: 200
  * Note: Unit: g
* Field: productType
  * Definition: Product type
  * Type: byte
  * Length: 200
  * Note: Product type code
* Field: productUnit
  * Definition: Product unit
  * Type: string
  * Length: 48
  * Note: Product selling unit
* Field: categoryId
  * Definition: Category id
  * Type: string
  * Length: 200
  * Note: Product category ID
* Field: categoryName
  * Definition: Category name
  * Type: string
  * Length: 200
  * Note: Product category name
* Field: entryCode
  * Definition: HS code
  * Type: string
  * Length: 200
  * Note: Product customs code
* Field: entryName
  * Definition: Customs name
  * Type: string
  * Length: 200
  * Note: Product customs Chinese name
* Field: entryNameEn
  * Definition: Customs name (EN)
  * Type: string
  * Length: 200
  * Note: Product customs English name
* Field: materialName
  * Definition: Material
  * Type: string
  * Length: 200
  * Note: Product material Chinese name
* Field: materialNameEn
  * Definition: Material (EN)
  * Type: string
  * Length: 200
  * Note: Product material English name
* Field: materialKey
  * Definition: Material attribute
  * Type: string
  * Length: 200
  * Note: Product material attribute keywords
* Field: packWeight
  * Definition: Package weight
  * Type: int
  * Length: 200
  * Note: Unit: g, total weight including packaging
* Field: packingName
  * Definition: Package name
  * Type: string
  * Length: 200
  * Note: Packaging material Chinese name
* Field: packingNameEn
  * Definition: Package name (EN)
  * Type: string
  * Length: 200
  * Note: Packaging material English name
* Field: packingKey
  * Definition: Package attribute
  * Type: string
  * Length: 200
  * Note: Packaging material attribute keywords
* Field: productKey
  * Definition: Product attribute
  * Type: string
  * Length: 200
  * Note: Product attribute keywords
* Field: productKeyEn
  * Definition: Product attribute (EN)
  * Type: string
  * Length: 200
  * Note: Product attribute English keywords
* Field: productProSet
  * Definition: Product logistics attributes(Chinese)
  * Type: string[]
  * Length: 
  * Note: Chinese description of product logistics attributes
* Field: productProEnSet
  * Definition: Product logistics attributes(English)
  * Type: string[]
  * Length: 
  * Note: English description of product logistics attributes
* Field: addMarkStatus
  * Definition: Is Free Shipping?
  * Type: int
  * Length: 1
  * Note: 0=not Free, 1=Free
* Field: description
  * Definition: Description
  * Type: string
  * Length: 200
  * Note: Detailed product description
* Field: sellPrice
  * Definition: sell price
  * Type: string
  * Length: 200
  * Note: Product selling price
* Field: createrTime
  * Definition: creater time
  * Type: string
  * Length: 20
  * Note: Product creation time on the platform
* Field: productVideo
  * Definition: Product video ID list
  * Type: string[]
  * Length: 200
  * Note: If the product contains videos and features are passed in enable_video, it will return
* Field: status
  * Definition: status
  * Type: string
  * Length: 20
  * Note: 3 means approved for sale
* Field: suggestSellPrice
  * Definition: suggest sell price
  * Type: string
  * Length: 20
  * Note: Suggested retail price range
* Field: listedNum
  * Definition: listed number
  * Type: int
  * Length: 20
  * Note: Number of listings for this product
* Field: supplierName
  * Definition: supplier name
  * Type: string
  * Length: 20
  * Note: Product supplier name
* Field: supplierId
  * Definition: supplier Id
  * Type: string
  * Length: 20
  * Note: Product supplier ID
* Field: customizationVersion
  * Definition: customization version
  * Type: int
  * Length: 20
  * Note: Custom product version number
* Field: customizationJson1
  * Definition: customization json
  * Type: string
  * Length: 200
  * Note: Custom information JSON data 1
* Field: customizationJson2
  * Definition: customization json
  * Type: string
  * Length: 200
  * Note: Custom information JSON data 2
* Field: customizationJson3
  * Definition: customization json
  * Type: string
  * Length: 200
  * Note: Custom information JSON data 3
* Field: customizationJson4
  * Definition: customization json
  * Type: string
  * Length: 200
  * Note: Custom information JSON data 4
* Field: variants
  * Definition: Variants
  * Type: Variant[]
  * Length: 
  * Note: List of product variants


Variant



* Field: vid
  * Definition: Variant Id
  * Type: string
  * Length: 200
  * Note: Unique variant identifier
* Field: pid
  * Definition: Product Id
  * Type: string
  * Length: 20
  * Note: Parent product identifier
* Field: variantName
  * Definition: Variant Name
  * Type: string
  * Length: 200
  * Note: Variant Chinese name
* Field: variantNameEn
  * Definition: Variant Name(en)
  * Type: string
  * Length: 200
  * Note: Variant English name
* Field: variantSku
  * Definition: Variant SKU
  * Type: string
  * Length: 200
  * Note: Variant SKU code
* Field: variantImage
  * Definition: Variant Image
  * Type: string
  * Length: 200
  * Note: Variant image URL
* Field: variantStandard
  * Definition: Variant Standard
  * Type: string
  * Length: 200
  * Note: Variant specification description
* Field: variantUnit
  * Definition: Variant Unit
  * Type: string
  * Length: 200
  * Note: Variant selling unit
* Field: variantProperty
  * Definition: Variant Property
  * Type: string
  * Length: 200
  * Note: Variant property type
* Field: variantKey
  * Definition: Variant Key
  * Type: string
  * Length: 200
  * Note: Variant attribute keywords
* Field: variantLength
  * Definition: Variant Length
  * Type: int
  * Length: 200
  * Note: Unit: mm
* Field: variantWidth
  * Definition: Variant Width
  * Type: int
  * Length: 200
  * Note: Unit: mm
* Field: variantHeight
  * Definition: Variant Height
  * Type: int
  * Length: 200
  * Note: Unit: mm
* Field: variantVolume
  * Definition: Variant Volume
  * Type: int
  * Length: 200
  * Note: Unit: mm3
* Field: variantWeight
  * Definition: Variant Weight
  * Type: double
  * Length: 200
  * Note: Unit: g
* Field: variantSellPrice
  * Definition: Variant SellPrice
  * Type: double
  * Length: 200
  * Note: unit: $ (USD)
* Field: variantSugSellPrice
  * Definition: Variant Suggest SellPrice
  * Type: double
  * Length: 200
  * Note: unit: $ (USD)
* Field: createTime
  * Definition: Vreater Time
  * Type: string
  * Length: 200
  * Note: Variant creation time
* Field: combineNum
  * Definition: number of Combine Variants
  * Type: int
  * Length: 
  * Note: Number of sub-variants in combined products
* Field: combineVariants
  * Definition: Combine Variants
  * Type: Variant[]
  * Length: 200
  * Note: List of sub-variants for combined products
* Field: inventories
  * Definition: Variant inventory
  * Type: Inventory[]
  * Length: 200
  * Note: List of variant inventory (include storage id)
* Field: - countryCode
  * Definition: inventory country code
  * Type: string
  * Length: 200
  * Note: Two-letter code of the country where the warehouse is located.for example:US
* Field: - totalInventory
  * Definition: total inventory number
  * Type: integer
  * Length: 200
  * Note: 
* Field: - cjInventory
  * Definition: Inventory management in CJ warehouse
  * Type: integer
  * Length: 200
  * Note: 
* Field: - factoryInventory
  * Definition: Inventory management in factory
  * Type: integer
  * Length: 200
  * Note: 
* Field: - verifiedWarehouse
  * Definition: Verified Inventory type
  * Type: string
  * Length: 200
  * Note: 1: verified, 2: unverified
* Field: - stock
  * Definition: Sub warehouse inventory info
  * Type: Stock[]
  * Length: 200
  * Note: 
* Field: -- stockId
  * Definition: Sub warehouse ID
  * Type: string
  * Length: 200
  * Note: 
* Field: -- inventory
  * Definition: Sub warehouse Inventory management in CJ warehouse
  * Type: integer
  * Length: 200
  * Note: 
* Field: -- factoryInventory
  * Definition: Sub warehouse Inventory management in factory
  * Type: integer
  * Length: 200
  * Note: 


Product Type


|Product Type            |Description             |
|------------------------|------------------------|
|ORDINARY_PRODUCT        |Ordinary product        |
|SERVICE_PRODUCT         |Service product         |
|PACKAGING_PRODUCT       |Packaging product       |
|SUPPLIER_PRODUCT        |Supplier product        |
|SUPPLIER_SHIPPED_PRODUCT|Supplier shipped product|


Product Status


|product status|remark |
|--------------|-------|
|3             |On Sale|


Customization Version


|Customization Version|remark                        |
|---------------------|------------------------------|
|0                    |Non-pod products              |
|1                    |Platform Customized Version V1|
|2                    |Platform Customized Version V2|
|3                    |Customer Customized Version V1|
|4                    |Customer Customized Version V2|
|5                    |POD 3.0 Platform Customized   |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_1-4-add-to-my-product-post) 1.4 Add to My Product (POST)

#### [#](#url-6) URL

https://developers.cjdropshipping.com/api2.0/v1/product/addToMyProduct

#### [#](#curl-6) CURL


|Parameter|Definition   |Type  |Required|Length|Note|
|---------|-------------|------|--------|------|----|
|productId|CJ product id|string|Y       |100   |    |


#### [#](#return-6) Return

success

error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_1-3-my-product-list-get) 1.3 My Product List(GET)

#### [#](#url-7) URL

https://developers.cjdropshipping.com/api2.0/v1/product/myProduct/query

#### [#](#curl-7) CURL


|Parameter   |Definition          |Type  |Required|Length|Note|
|------------|--------------------|------|--------|------|----|
|keyword     |sku/spu/product name|string|N       |200   |    |
|categoryId  |category id         |string|N       |200   |    |
|startAt     |start time          |string|N       |200   |    |
|endAt       |ent time            |string|N       |200   |    |
|isListed    |isListed            |int   |N       |200   |    |
|visiable    |visiable            |int   |N       |200   |    |
|hasPacked   |hasPacked           |int   |N       |200   |    |
|hasVirPacked|hasVirPacked        |int   |N       |200   |    |


#### [#](#return-7) Return

success

product


|Field        |Definition      |Type  |Length|Note         |
|-------------|----------------|------|------|-------------|
|productId    |Product ID      |string|200   |             |
|productName  |Product name    |list  |20    |             |
|nameEn       |Product name(EN)|string|200   |             |
|sku          |Product sku     |string|200   |             |
|bigImage     |Product image   |string|200   |             |
|totalPrice   |Product weight  |double|200   |unit: $ (USD)|
|productType  |Product type    |byte  |200   |             |
|listedShopNum|listed Shop Num |string|48    |             |
|createAt     |Added Time      |string|200   |             |
|trialFreight |trial Freight   |string|200   |             |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


[#](#_2-variant) 2 Variant
--------------------------

### [#](#_2-1-inquiry-of-all-variants-get) 2.1 Inquiry Of All Variants (GET)

#### [#](#url-8) URL

https://developers.cjdropshipping.com/api2.0/v1/product/variant/query

#### [#](#curl-8) CURL



* Parameter: pid
  * Definition: Product id
  * Type: string
  * Required: Choose one of three
  * Length: 200
  * Note: Inquiry criteria
* Parameter: productSku
  * Definition: Product sku
  * Type: string
  * Required: Choose one of three
  * Length: 200
  * Note: Inquiry criteria
* Parameter: variantSku
  * Definition: variant sku
  * Type: string
  * Required: Choose one of three
  * Length: 200
  * Note: Inquiry criteria
* Parameter: countryCode
  * Definition: Country Code
  * Type: string
  * Required: N
  * Length: 2
  * Note: If the parameter has a value, only variants with inventory in that country will be returned. If no value is passed, inventory will not be restricted


#### [#](#return-8) Return

success


|Field              |Definition                |Type      |Length|Note         |
|-------------------|--------------------------|----------|------|-------------|
|vid                |Variant ID                |string    |200   |             |
|pid                |Product ID                |string    |200   |             |
|variantName        |Variant name              |string    |200   |             |
|variantNameEn      |Variant name (EN)         |string    |200   |             |
|variantImage       |Variant image             |string    |200   |             |
|variantSku         |Variant sku               |string    |200   |             |
|variantUnit        |Variant unit              |string    |200   |             |
|variantProperty    |Variant property          |string    |200   |             |
|variantKey         |Variant Key               |string    |200   |             |
|variantLength      |Variant length            |int       |200   |Unit: mm     |
|variantWidth       |Variant width             |int       |200   |Unit: mm     |
|variantHeight      |Variant height            |int       |200   |Unit: mm     |
|variantVolume      |Variant volume            |int       |200   |Unit: mm3    |
|variantWeight      |Variant weight            |int       |200   |Unit: g      |
|variantSellPrice   |Variant sell price        |BigDecimal|200   |Unit: $ (USD)|
|createTime         |Create time               |string    |200   |             |
|variantStandard    |variant standard          |string    |200   |             |
|variantSugSellPrice|variant suggest sell price|BigDecimal|200   |Unit: $ (USD)|


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_2-2-variant-id-inquiry-get) 2.2 Variant Id Inquiry (GET)

#### [#](#url-9) URL

https://developers.cjdropshipping.com/api2.0/v1/product/variant/queryByVid

#### [#](#curl-9) CURL



* Parameter: vid
  * Definition: Variant ID
  * Type: string
  * Required: Y
  * Length: 200
  * Note: Inquiry criteria
* Parameter: features
  * Definition: features
  * Type: string
  * Required: N
  * Length: 200
  * Note: enable_inventory (includes inventory, returns variant inventory info (include storage id) when passed)


#### [#](#return-9) Return

success



* Field: vid
  * Definition: Variant id
  * Type: string
  * Length: 200
  * Note: 
* Field: pid
  * Definition: Product id
  * Type: string
  * Length: 200
  * Note: 
* Field: variantName
  * Definition: Variant name
  * Type: string
  * Length: 200
  * Note: 
* Field: variantNameEn
  * Definition: Variant name (EN)
  * Type: string
  * Length: 200
  * Note: 
* Field: variantImage
  * Definition: Variant image
  * Type: string
  * Length: 200
  * Note: 
* Field: variantSku
  * Definition: Variant sku
  * Type: string
  * Length: 200
  * Note: 
* Field: variantUnit
  * Definition: Variant unit
  * Type: string
  * Length: 200
  * Note: 
* Field: variantProperty
  * Definition: Variant property
  * Type: string
  * Length: 200
  * Note: 
* Field: variantKey
  * Definition: Variant key
  * Type: string
  * Length: 200
  * Note: 
* Field: variantLength
  * Definition: Variant length
  * Type: int
  * Length: 200
  * Note: Unit: mm
* Field: variantWidth
  * Definition: Variant width
  * Type: int
  * Length: 200
  * Note: Unit: mm
* Field: variantHeight
  * Definition: Variant height
  * Type: int
  * Length: 200
  * Note: Unit: mm
* Field: variantVolume
  * Definition: Variant volume
  * Type: int
  * Length: 200
  * Note: Unit: mm3
* Field: variantWeight
  * Definition: Variant weight
  * Type: int
  * Length: 200
  * Note: Unit: g
* Field: variantSellPrice
  * Definition: Variant sell price
  * Type: BigDecimal
  * Length: 200
  * Note: Unit: $ (USD)
* Field: createTime
  * Definition: Create time
  * Type: string
  * Length: 200
  * Note: 
* Field: variantStandard
  * Definition: Variant standard
  * Type: string
  * Length: 200
  * Note: 
* Field: inventories
  * Definition: Variant inventory
  * Type: Inventory[]
  * Length: 200
  * Note: List of variant inventory (include storage id)
* Field: - countryCode
  * Definition: inventory country code
  * Type: string
  * Length: 200
  * Note: Two-letter code of the country where the warehouse is located.for example:US
* Field: - totalInventory
  * Definition: total inventory number
  * Type: integer
  * Length: 200
  * Note: 
* Field: - cjInventory
  * Definition: Inventory management in CJ warehouse
  * Type: integer
  * Length: 200
  * Note: 
* Field: - factoryInventory
  * Definition: Inventory management in factory
  * Type: integer
  * Length: 200
  * Note: 
* Field: - verifiedWarehouse
  * Definition: Verified Inventory type
  * Type: string
  * Length: 200
  * Note: 1: verified, 2: unverified
* Field: - stock
  * Definition: Sub warehouse inventory info
  * Type: Stock[]
  * Length: 200
  * Note: 
* Field: -- stockId
  * Definition: Sub warehouse ID
  * Type: string
  * Length: 200
  * Note: 
* Field: -- inventory
  * Definition: Sub warehouse Inventory management in CJ warehouse
  * Type: integer
  * Length: 200
  * Note: 
* Field: -- factoryInventory
  * Definition: Sub warehouse Inventory management in factory
  * Type: integer
  * Length: 200
  * Note: 


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


[#](#_3-inventory) 3 Inventory
------------------------------

### [#](#_3-1-inventory-inquiry-get) 3.1 Inventory Inquiry(GET)

#### [#](#url-10) URL

https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryByVid?vid=7874B45D-E971-4DC8-8F59-40530B0F6B77

#### [#](#curl-10) CURL


|Parameter|Definition|Type  |Required|Length|Note                     |
|---------|----------|------|--------|------|-------------------------|
|vid      |Variant id|string|Y       |200   |Unique variant identifier|


#### [#](#return-10) Return

success



* Field: vid
  * Definition: Variant id
  * Type: bigint
  * Length: 200
  * Note: Unique variant identifier
* Field: areaId
  * Definition: Warehouse id
  * Type: int
  * Length: 20
  * Note: Warehouse area ID
* Field: areaEn
  * Definition: Warehouse name
  * Type: string
  * Length: 200
  * Note: Warehouse area name
* Field: countryCode
  * Definition: Country code(EN)
  * Type: string
  * Length: 20
  * Note: Country code where warehouse is located
* Field: storageNum
  * Definition: total inventory number, please use totalInventoryNum
  * Type: int
  * Length: 20
  * Note: Deprecated, please use totalInventoryNum
* Field: totalInventoryNum
  * Definition: total inventory number
  * Type: int
  * Length: 20
  * Note: Total inventory quantity of this variant in the warehouse
* Field: cjInventoryNum
  * Definition: Inventory management in CJ warehouse
  * Type: int
  * Length: 20
  * Note: Inventory quantity managed directly by CJ
* Field: factoryInventoryNum
  * Definition: Inventory management in factory
  * Type: int
  * Length: 20
  * Note: Inventory quantity managed by the factory
* Field: stock
  * Definition: Sub warehouse inventory info
  * Type: Stock[]
  * Length: 200
  * Note: 
* Field: -- stockId
  * Definition: Sub warehouse ID
  * Type: string
  * Length: 200
  * Note: 
* Field: -- inventory
  * Definition: Sub warehouse Inventory management in CJ warehouse
  * Type: integer
  * Length: 200
  * Note: 
* Field: -- factoryInventory
  * Definition: Sub warehouse Inventory management in factory
  * Type: integer
  * Length: 200
  * Note: 


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_3-2-query-inventory-by-sku-get) 3.2 Query Inventory by SKU (GET)

#### [#](#url-11) URL

https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryBySku?sku=CJDS2012593

#### [#](#curl-11) CURL


|Parameter|Definition|Type  |Required|Length|Note|
|---------|----------|------|--------|------|----|
|sku      |SKU or SPU|string|Y       |200   |    |


#### [#](#return-11) Return

success


|Field              |Definition                                        |Type   |Length|Note|
|-------------------|--------------------------------------------------|-------|------|----|
|vid                |Variant id                                        |bigint |200   |    |
|areaId             |Warehouse id                                      |int    |20    |    |
|areaEn             |Warehouse name                                    |string |200   |    |
|countryCode        |Country code(EN)                                  |string |200   |    |
|countryNameEn      |Country name                                      |string |200   |    |
|totalInventoryNum  |total inventory number                            |int    |20    |    |
|cjInventoryNum     |Inventory management in CJ warehouse              |int    |20    |    |
|factoryInventoryNum|Inventory management in factory                   |int    |20    |    |
|stock              |Sub warehouse inventory info                      |Stock[]|200   |    |
|-- stockId         |Sub warehouse ID                                  |string |200   |    |
|-- inventory       |Sub warehouse Inventory management in CJ warehouse|integer|200   |    |
|-- factoryInventory|Sub warehouse Inventory management in factory     |integer|200   |    |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_3-3-query-inventory-by-product-id-get) 3.3 Query inventory by product ID (GET)

#### [#](#url-12) URL

https://developers.cjdropshipping.com/api2.0/v1/product/stock/getInventoryByPid?pid=1444929719182168064

#### [#](#curl-12) CURL


|Parameter|Definition|Type  |Required|Length|Note|
|---------|----------|------|--------|------|----|
|pid      |Product Id|string|Y       |40    |    |


#### [#](#return-12) Return

success



* Field: code
  * Definition: error code
  * Type: int
  * Length: 20
  * Note: Reference error code
* Field: result
  * Definition: Whether or not the return is normal
  * Type: boolean
  * Length: 1
  * Note: 
* Field: message
  * Definition: return message
  * Type: string
  * Length: 200
  * Note: 
* Field: data
  * Definition: Product Inventory Object
  * Type: object
  * Length: 
  * Note: 
* Field: - inventories
  * Definition: product inventory list
  * Type: list
  * Length: 
  * Note: 
* Field: -- areaEn
  * Definition: Warehouse Name
  * Type: string
  * Length: 20
  * Note: China Warehouse
* Field: -- areaId
  * Definition: Warehouse id
  * Type: int
  * Length: 1
  * Note: 1
* Field: -- countryCode
  * Definition: Country Code
  * Type: string
  * Length: 2
  * Note: CN
* Field: -- totalInventoryNum
  * Definition: total inventory number
  * Type: int
  * Length: 20
  * Note: 
* Field: -- cjInventoryNum
  * Definition: Inventory management in CJ warehouse
  * Type: int
  * Length: 20
  * Note: 
* Field: -- factoryInventoryNum
  * Definition: Inventory management in factory
  * Type: int
  * Length: 20
  * Note: 
* Field: -- countryNameEn
  * Definition: Country Name
  * Type: string
  * Length: 200
  * Note: China Warehouse
* Field: - variantInventories
  * Definition: variant inventory list
  * Type: list
  * Length: 
  * Note: 
* Field: -- vid
  * Definition: variant id
  * Type: string
  * Length: 20
  * Note: China Warehouse
* Field: -- inventory
  * Definition: inventory list
  * Type: list
  * Length: 
  * Note: 1
* Field: --- countryCode
  * Definition: Country Code
  * Type: string
  * Length: 2
  * Note: CN
* Field: --- totalInventoryNum
  * Definition: total inventory number
  * Type: int
  * Length: 20
  * Note: 
* Field: --- cjInventoryNum
  * Definition: Inventory management in CJ warehouse
  * Type: int
  * Length: 20
  * Note: 
* Field: --- factoryInventoryNum
  * Definition: Inventory management in factory
  * Type: int
  * Length: 20
  * Note: 
* Field: --- verifiedWarehouse
  * Definition: Verified Inventory type
  * Type: int
  * Length: 200
  * Note: 1: verified, 2: unverified
* Field: --- stock
  * Definition: Sub warehouse inventory info
  * Type: Stock[]
  * Length: 200
  * Note: 
* Field: ---- stockId
  * Definition: Sub warehouse ID
  * Type: string
  * Length: 200
  * Note: 
* Field: ---- inventory
  * Definition: Sub warehouse Inventory management in CJ warehouse
  * Type: integer
  * Length: 200
  * Note: 
* Field: ---- factoryInventory
  * Definition: Sub warehouse Inventory management in factory
  * Type: integer
  * Length: 200
  * Note: 
* Field: requestId
  * Definition: requestId
  * Type: string
  * Length: 48
  * Note: Flag request for logging errors


[#](#_4-product-reviews) 4 Product Reviews
------------------------------------------

### [#](#_4-1-inquiry-reviews-get) 4.1 Inquiry Reviews (GET)

#### [#](#url-13) URL

https://developers.cjdropshipping.com/api2.0/v1/product/comments

> Will be deprecated on June 1, 2024, Please use the new api [Inquiry Reviews](about:/en/api/api2/api/product.html#_4-2-inquiry-reviews-get)

#### [#](#curl-13) CURL


|Parameter|Definition |Type   |Required|Length|Note            |
|---------|-----------|-------|--------|------|----------------|
|pid      |Product id |string |Y       |200   |Inquiry criteria|
|score    |score      |integer|N       |20    |Inquiry criteria|
|pageNum  |page number|int    |N       |20    |default: 1      |
|pageSize |page size  |int    |N       |20    |default: 20     |


#### [#](#return-13) Return

success


|Field      |Definition  |Type    |Length|Note|
|-----------|------------|--------|------|----|
|pid        |Product id  |String  |200   |    |
|commentId  |Comment id  |long    |20    |    |
|comment    |Comment     |string  |200   |    |
|commentUrls|Comment url |string[]|200   |    |
|commentUser|Comment user|string  |200   |    |
|score      |score       |int     |20    |    |
|countryCode|Country code|string  |20    |    |
|commentDate|Comment date|string  |200   |    |
|flagIconUrl|FlagIcon url|string  |200   |    |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_4-2-inquiry-reviews-get) 4.2 Inquiry Reviews (GET)

#### [#](#url-14) URL

https://developers.cjdropshipping.com/api2.0/v1/product/productComments

#### [#](#curl-14) CURL


|Parameter|Definition |Type   |Required|Length|Note            |
|---------|-----------|-------|--------|------|----------------|
|pid      |Product id |string |Y       |200   |Inquiry criteria|
|score    |score      |integer|N       |20    |Inquiry criteria|
|pageNum  |page number|int    |N       |20    |default: 1      |
|pageSize |page size  |int    |N       |20    |default: 20     |


#### [#](#return-14) Return

success


|Field      |Definition  |Type    |Length|Note|
|-----------|------------|--------|------|----|
|pid        |Product id  |String  |200   |    |
|commentId  |Comment id  |long    |20    |    |
|comment    |Comment     |string  |200   |    |
|commentUrls|Comment url |string[]|200   |    |
|commentUser|Comment user|string  |200   |    |
|score      |score       |int     |20    |    |
|countryCode|Country code|string  |20    |    |
|commentDate|Comment date|string  |200   |    |
|flagIconUrl|FlagIcon url|string  |200   |    |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


[#](#_5-sourcing) 5 Sourcing
----------------------------

### [#](#_5-1-create-sourcing-post) 5.1 Create Sourcing (POST)

#### [#](#url-15) URL

https://developers.cjdropshipping.com/api2.0/v1/product/sourcing/create

#### [#](#curl-15) CURL


|Parameter      |Definition       |Type      |Required|Length       |Note|
|---------------|-----------------|----------|--------|-------------|----|
|thirdProductId |third product id |string    |N       |200          |    |
|thirdVariantId |third variant id |string    |N       |200          |    |
|thirdProductSku|third product sku|string    |N       |200          |    |
|productName    |product name     |string    |Y       |200          |    |
|productImage   |product image    |string    |Y       |200          |    |
|productUrl     |product url      |string    |N       |200          |    |
|remark         |remark           |string    |N       |200          |    |
|price          |price            |BigDecimal|200     |Unit: $ (USD)|    |


#### [#](#return-15) Return

success


|Field       |Definition    |Type  |Length|Note|
|------------|--------------|------|------|----|
|cjSourcingId|CJ sourcing id|string|50    |    |
|result      |search results|string|20    |    |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|


### [#](#_5-2-query-sourcing-post) 5.2 Query Sourcing(POST)

#### [#](#url-16) URL

https://developers.cjdropshipping.com/api2.0/v1/product/sourcing/query

#### [#](#curl-16) CURL


|Parameter|Definition    |Type    |Required|Length|Note|
|---------|--------------|--------|--------|------|----|
|sourceIds|CJ sourcing id|string[]|Y       |200   |    |


#### [#](#return-16) Return

success


|Field          |Definition       |Type  |Length|Note|
|---------------|-----------------|------|------|----|
|sourceId       |CJ sourcing id   |string|50    |    |
|sourceNumber   |Search short code|string|20    |    |
|productId      |product id       |string|50    |    |
|variantId      |variant id       |string|50    |    |
|shopId         |shop id          |string|50    |    |
|shopName       |shop name        |string|50    |    |
|sourceStatus   |status           |string|10    |    |
|sourceStatusStr|status (chinese) |string|50    |    |
|cjProductId    |CJ product id    |string|50    |    |
|cjVariantSku   |CJ variant sku   |string|50    |    |


error


|Field    |Definition                         |Type   |Length|Note                           |
|---------|-----------------------------------|-------|------|-------------------------------|
|code     |error code                         |int    |20    |Reference error code           |
|result   |Whether or not the return is normal|boolean|1     |                               |
|message  |return message                     |string |200   |                               |
|data     |return data                        |object |      |interface data return          |
|requestId|requestId                          |string |48    |Flag request for logging errors|

