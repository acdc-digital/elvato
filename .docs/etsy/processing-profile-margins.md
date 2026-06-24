Processing Profiles Migration
Summary of changes#
In order to provide a more granular way to distinguish between different processing times for different products inside the same listing, we are introducing processing profiles.

Currently, in order to provide Etsy with processing time values, sellers are required to send min_processing_time and max_processing_time in their shipping profile requests, either through createShopShippingProfile or updateShopShippingProfile. These values are always associated at listing level, which means that even if the listing has variations, all of the resulting products will have the same processing time.

Processing profiles are comprised of:

shop_id
readiness_state_id (This value will be automatically assigned, users do not need to provide it)
readiness_state
min_processing_time
max_processing_time
For the readiness_state parameter the possible values can be either "made_to_order" or "ready_to_ship", depending on the state a product listed is in.

Each product will be linked to a specific processing profile through the readiness_state_id, which will give us the ability to link their processing time and readiness state values to them. After a listing’s processing times are associated with a processing profile, it can no longer be switched back to using shipping profiles.

important
Just like shipping profiles, requirements for a linked processing profile only applies to physical listings. Digital listings cannot have processing profiles.

Customer requirements#
To support your customers through this new workflow, your systems will need the following capabilities:

Listing creation/updating mechanisms require the ability to set a readiness_state_id.
Inventory management mechanisms require the ability to optionally vary the readiness_state_id by one or both variation properties and set it for each product.
Mechanisms for managing processing profiles, including creation, modification, and deletion are encouraged but not required.
Integration phase#
Etsy is making this feature available to the OpenAPI developer community on July 16th. This early access period will allow you to familiarize yourselves with the new API calls and update your applications before the feature goes live to all buyers and sellers on Shop Manager and the Etsy Seller app.

Third parties can continue using shipping profile processing time updates for the next 60 days, giving developers time to migrate to the new processing profiles. However, sellers won't be able to set or view processing profiles on Shop Manager until a later date.

This guide will assist you in transitioning from shipping profiles to processing profiles, during this early access phase. Any Processing Profiles you create or link to listings will be considered non-production and transient. As we approach the Shop Manager and Etsy Seller app launch, Etsy will populate this data with values from sellers’ production settings. However, during the transition period, any test data created by third-party developers will not be overwritten.

During this phase, Etsy advises the following:

Third-party developers MUST use test shops/accounts when implementing and testing the new endpoints.
This functionality should NOT be exposed to real users or linked to live seller accounts during this migration and testing phase.
The new features should NOT be made available for real seller/shop data or customer-facing workflows until Etsy officially announces a go-live date.
Transitioning your system to use processing profiles#
To utilize the new features associated with processing profiles, you’ll need to include a legacy=false query parameter in API requests. This will enable the use of the new parameters and response values related to processing profiles.

When using the legacy=false flag, API responses may include new fields related to processing profiles. Be sure to update your system to handle these new fields and structures in the API responses to ensure compatibility with the processing profile feature.

Note: Usage of legacy query parameters while utilizing processing profiles via legacy=false will result in a 400 status code.

Linking processing time to a listing or specific products#
Legacy: through shipping profiles#
Shipping profiles assemble shipping details such as shipping price and processing time for recipients grouped by country or region. Every listing requires a shipping profile, so you add shipping profiles to your shop with createShopShippingProfile, and assign a shipping profile to a listing using a shipping_profile_id when you create or update the listing. For more details you can see the "Adding a shipping profile to a listing" section of the listings tutorial.

New: through processing profiles#
Processing profiles contain information about the processing details of a product. Every listing requires at least one processing profile to be linked to it. You can create processing profiles for your shop with createShopReadinessStateDefinition, and link it to a listing using the readiness_state_id when you create a new listing through createDraftListing or to specific products when you update a listing's inventory through updateListingInventory.

Create a processing profile#
The following procedure creates a new processing profile and returns the readiness_state_id in the response:

Form a valid URL for createShopReadinessStateDefinition, which must include a shop_id. For example, if your shop_id is "12345678", then the createShopReadinessStateDefinition URL is:

https://api.etsy.com/v3/application/shops/12345678/readiness-state-definitions

Build the createShopReadinessStateDefinition request body, which must include:

readiness_state: The state a product can be in production wise, values can be either "ready_to_ship" or "made_to_order".
min_processing_time: The minimum time required to process to ship products with this processing profile.
max_processing_time: The maximum time required to process to ship products with this processing profile.
processing_time_unit: The unit used to represent how long a processing time is. A week is equivalent to 5 business days. Values can be "days" or "weeks". If none is provided, the unit is set to "days".
Execute a createShopReadinessStateDefinition POST request with your shops_w scoped OAuth token and x-api-key, and read the generated readiness_state_id from the response, which you’ll use to link it to specific products later on. For example, a createReadinessStateDefinition request for a product that’s made to order and the processing time is 5-8 days might look like the following:
JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/x-www-form-urlencoded");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var urlencoded = new URLSearchParams();
urlencoded.append("readiness_state", "made_to_order");
urlencoded.append("min_processing_time", "5");
urlencoded.append("max_processing_time", "8");
urlencoded.append("processing_time_unit", "days");

var requestOptions = {
    method: 'POST',
    headers: headers,
    body: urlencoded,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/12345678/readiness-state-definitions", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
Link a processing profile through createDraftListing#
This only applies to physical listings, Digital listings do not need a linked processing profile.

Once you have a readiness_state_id you can follow this process to link a processing profile to a physical listing:

Form a valid URL for createDraftListing, which must include a shop_id for the shop that hosts the listing. For example, if your shop_id is "12345678," the createDraftListing URL is:

https://api.etsy.com/v3/application/shops/12345678/listings?legacy=false
The legacy query param is required to use processing profiles but only during the transition period.

Build the createDraftListing request body, which must include at a minimum:

quantity
title
description
price
who_made
when_made
taxonomy_id
image_ids required for active listings
readiness_state_id which you obtained through createShopReadinessStateDefinition
Execute a createDraftListing POST request with your listings_w scoped OAuth token and x-api-key. For example, a createDraftListing request to list 5 yo-yos might look like the following:

JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/x-www-form-urlencoded");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var urlencoded = new URLSearchParams();
urlencoded.append("quantity", "5");
urlencoded.append("title", "Vintage Duncan Toys Butterfly Yo-Yo, Red");
urlencoded.append("description", "Vintage Duncan Yo-Yo from 1976 with string, steel axle, and plastic body.");
urlencoded.append("price", "1000");
urlencoded.append("who_made", "someone_else");
urlencoded.append("when_made", "1970s");
urlencoded.append("taxonomy_id", "1");
urlencoded.append("image_ids", "378848,238298,030076");
urlencoded.append("readiness_state_id", "6752737961");

var requestOptions = {
    method: 'POST',
    headers: headers,
    body: urlencoded,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/12345678/listings?legacy=false", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));

Following this process will associate the processing profile with the readiness_state_id you provided to the listing, associating in turn the processing times and readiness state stored in the processing profile.

As this endpoint doesn’t allow for the creation of variations of the same product in the same listing, such as different colored products with specific quantities or processing profiles for sale in each color, this will need to be done through the updateListingInventory endpoint.

Link a processing profile through updateListingInventory#
The following example updates a listing inventory where there are two variations:

Material - "Pine", "Walnut"
Size - "4", "5"
In this example, the material variation affects the price, while the size variation affects the quantity and sku of the product.

In the products array, you will have 4 entries (2 materials x 2 sizes).

Due to the size affecting both quantity and sku, when quantity is updated it must be the same value across all products sharing the same sku. The sku "woodthing4" has 2 entries in the array, but the quantity value for all three of those arrays (inside offerings) must be the same value (44 in this example).

Similarly, because material affects pricing, in each product you will see that the "Walnut" property value indicates the price in offerings is 8.00 while "Pine" is 6.00.

Note that since there is only one variation that affects the price, the price_on_property value is a single value of 507, which is the property_id for "Material". Since size affects both quantity and sku, the quantity_on_property and sku_on_property values are a single value of 100, which is the property_id for "Size".

Now, there are two possible approaches to take with processing profiles:

Processing profiles vary per product.
The same processing profile can be linked to all the products inside the listing.
We'll explore how to provide those values in the following examples.

Processing profiles vary per product#
Following the example above, let's add to the example that the processing profiles vary per material, just like price. In Etsy's Shop Manager web UI this distribution would look like this:

img alt

To obtain the available processing profiles for the shop and their corresponding readiness_state_id to link it to the specific products you can use the getShopReadinessStateDefinitions endpoint. For this example we'll use two different processing profiles for the two different materials the seller offers with the following values:

Material: Pine	Material: Walnut
readiness_state_id: 18201076875	readiness_state_id: 18201056977
readiness_state: mate_to_order	readiness_state: mate_to_order
min_processing_time: 3	min_processing_time: 4
max_processing_time: 5	max_processing_time: 6
processing_time_unit: weeks	processing_time_unit: days
Once we have the readiness_state_id for each of the profiles we want to use for these products we can include them in the body request for the updateListingInventory endpoint, which would be structured like this:

JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/json");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var productsArray = {
    "products": [
        {
            "sku": "woodthing4",
            "offerings": [
                {
                    "quantity": 44,
                    "is_enabled": true,
                    "price": 8.00,
                    "readiness_state_id": 18201076875
                }
            ],
            "property_values": [
                {
                    "property_id": 100,
                    "property_name": "Size",
                    "scale_id": 327,
                    "value_ids": [
                        18107494140
                    ],
                    "values": [
                        "4"
                    ]
                },
                {
                    "property_id": 507,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        18163610620
                    ],
                    "values": [
                        "Walnut"
                    ]
                }
            ]
        },
        {
            "sku": "woodthing4",
            "offerings": [
                {
                    "quantity": 44,
                    "is_enabled": true,
                    "price": 6.00,
                    "readiness_state_id": 18201056977
                }
            ],
            "property_values": [
                {
                    "property_id": 100,
                    "property_name": "Size",
                    "scale_id": 327,
                    "value_ids": [
                        18107494140
                    ],
                    "values": [
                        "4"
                    ]
                },
                {
                    "property_id": 507,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        18163610622
                    ],
                    "values": [
                        "Pine"
                    ]
                }
            ]
        },
        {
            "sku": "woodthing5",
            "offerings": [
                {
                    "quantity": 55,
                    "is_enabled": true,
                    "price": 8.00,
                    "readiness_state_id": 18201076875
                }
            ],
            "property_values": [
                {
                    "property_id": 100,
                    "property_name": "Size",
                    "scale_id": 327,
                    "value_ids": [
                        18107397735
                    ],
                    "values": [
                        "5"
                    ]
                },
                {
                    "property_id": 507,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        18163610620
                    ],
                    "values": [
                        "Walnut"
                    ]
                }
            ]
        },
        {
            "sku": "woodthing5",
            "offerings": [
                {
                    "quantity": 55,
                    "is_enabled": true,
                    "price": 6.00,
                    "readiness_state_id": 18201056977
                }
            ],
            "property_values": [
                {
                    "property_id": 100,
                    "property_name": "Size",
                    "scale_id": 327,
                    "value_ids": [
                        18107397735
                    ],
                    "values": [
                        "5"
                    ]
                },
                {
                    "property_id": 507,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        18163610622
                    ],
                    "values": [
                        "Pine"
                    ]
                }
            ]
        }
    ],
    "price_on_property": [507],
    "quantity_on_property": [100],
    "sku_on_property": [100],
    "readiness_state_on_property": [507],
};

var requestOptions = {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(productsArray),
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/listings/192837465/inventory?legacy=false", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
As you can see in the above example, since processing profiles vary by the material property like price, we'll add a readiness_state_on_property value with the property_id corresponding to "Material" (507).

Each product offering will have an associated readiness_state_id, in this case the same readiness_state_id needs to be used for all the offerings that have the same material. We have two offerings for each material, lets take “Walnut” as an example:

Walnut - Size 4
Walnut - Size 5
Since they all share the “Walnut” property value they will use the same processing profile.

The same processing profile is used for all the products#
In this case the body request for the updateListingInventory endpoint would be pretty similar to the case above, with two main differences:

The same readiness_state_id will be used for all the product offerings.
The readiness_state_on_property value will be empty, as none of the properties that change the readiness state of the product.
NOTES:

When updating inventory, the entire set of products (based on variations) must be in the products array.

To get the product array, call getListingInventory for the listing. From the getListingInventory response, remove the following fields: product_id, offering_id, scale_name, is_deleted and value_pairs. Also change the price array in offerings to be a decimal value instead of an array.

The *_on_property values should match the property_id values, but only if those properties affect the price, quantity, sku, or processing profiles. See the sample below for handling variations.

Get processing time values#
Legacy: through shipping profiles#
You can get the processing time values associated with a listing through the getListing endpoint if you have a listing_id. The response will show the associated shipping profile and its values, including the processing time.

If you have a specific shipping_profile_id you can use the getShopShippingProfile endpoint to obtain the min_processing_days and max_processing_days.

New: through processing profiles#
You’ll be able to access the readiness_state_id associated with specific products through getListingInventory, getListingOffering or getListingProduct, where you’ll find the linked readiness_state_id inside the product offerings.

You can use the endpoint getShopReadinessStateDefinition with the readiness_state_id and shop_id to retrive the specific processing time values associated with that profile.

To get the processing profiles associated with a shop, you can use the endpoint getShopReadinessStateDefinitions using the shop_id. The response on this endpoint will return a list of all the processing profiles, and will include the processing time values for each one of them.

To get the processing profiles associated with a shop, you can use the endpoint getShopReadinessStateDefinitions using the shop_id. The response on this endpoint will return a list of all the processing profiles, and will include the processing time values for each one of them.

Update processing time values#
Legacy: through shipping profiles#
To update processing time in shipping profiles currently you need to use the updateShopShippingProfile endpoint and provide new min_processing_time, max_processing_time and processing_time_unit with the new values.

New: through processing profiles#
When using processing profiles you’ll need to use the updateShopReadinessStateDefinition, which will update an existing processing profile. The fields shop_id and readiness_state_id are required, while the fields readiness_state, min_processing_time, and max_processing_time, processing_time_unit would be optional.

Keep in mind that this update will apply to all product offerings that are linked to the processing profile.