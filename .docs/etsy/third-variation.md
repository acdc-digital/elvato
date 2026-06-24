Third Variation Tutorial
important
This is an upcoming feature. OpenAPI devs need to be ready by June 1st 2026, but Etsy will communicate the exact date of launch closer to cutover.

The maximum number of listing properties to be used in a listing's inventory is now 3. Set the new query parameter max_variations_supported to 3 to write listing inventory with 3 variations.

The third variation has to be one of the properties of the listing's taxonomy node and can only use the property's predefined values("possible_values"). The third variation cannot be a custom variation or have custom values. When using predefined properties and values, buyers can find your listings via search filters.

Reading Listings with a Third Variation#
warning
Ensure you update your app to support reading all three variations before June 1st 2026. After that date, your app may incorrectly process listings with three variations and fail silently.

Endpoints that return inventory and variation data may now have up to three variations.

If a listing has three variations:

when calling getListingInventory, all the "products" > "property_values" arrays have three elements.
when calling getListing with the includes=Inventory query param, the "inventory" > "products" > "property_values" arrays have three elements.
when calling getShopReceiptTransaction for a transaction for the listing, the "variations" array has three elements.
when calling getShopReceipt for a receipt for the listing, the "transactions" > "product_data" arrays and the "transactions" > "variations" array have three elements.
Example Response for getListingInventory

{
    "products": [
        {
            "product_id": 12345678979,
            "sku": "",
            "is_deleted": false,
            "offerings": [
                {
                    "offering_id": 34567891284,
                    "quantity": 9,
                    "is_enabled": true,
                    "is_deleted": false,
                    "price": { "amount": 100, "divisor": 100, "currency_code": "USD" },
                    "readiness_state_id": 1020304051823
                }
            ],
            "property_values": [
                {
                    "property_id": 52047899318,
                    "property_name": "Size",
                    "scale_id": 30,
                    "scale_name": "US numeric",
                    "value_ids": [108450111039],
                    "values": ["Preemie"]
                },
                {
                    "property_id": 200,
                    "property_name": "Primary color",
                    "scale_id": null,
                    "scale_name": null,
                    "value_ids": [49928889192],
                    "values": ["Blue"]
                },
                {
                    "property_id": 52047899002,
                    "property_name": "Secondary color",
                    "scale_id": null,
                    "scale_name": null,
                    "value_ids": [52751447102],
                    "values": ["Black"]
                }
            ]
        },
        // ....other products with three variations
    ],
    "price_on_property": [52047899318, 200, 52047899002],
    "quantity_on_property": [],
    "sku_on_property": [],
    "readiness_state_on_property": [],
    "listing": {
        "listing_id": 4444446484,
        "taxonomy_id": 496,     
        // ....other listing fields   
    }
}
Writing Listings with a Third Variation#
The updateListingInventory accepts values for a third variation. If the query parameter max_variations_supported is set to 3, adding or updating the third variation is enabled. The third variation cannot be a custom variation or have custom values. The *_on_property fields can have zero, one, or all the variation properties.

Related endpoints: updateListingInventory
Structure changes: The request and response structures remain the same.
New parameters: Optional integer query parameter max_variations_supported with accepted values [2, 3].
If included and set to 3, the endpoint accepts requests with three variations and/or updates to listings with three variations.
If omitted or set to 2, the endpoint rejects requests with three variations and/or updates to listings with three variations and return an appropriate error message.
Invalid values for this parameter return an appropriate error message.
For requests with two or less variations this parameter is not required.
Errors:
400: Invalid value (X) for query parameter max_variations_supported.
400: Could not update inventory with unsupported number of variations. The maximum number of supported variations is X.
400: Could not update inventory because the third variation uses a custom variation property (513 or 514).
400: Could not update inventory because the third variation does not support custom values. Use the property's value ids defined by the listing's taxonomy node.
400: X_on_property: unsupported number of property IDs. Supports only zero, one, or all variation properties (Y).
Parameter Conditionals#
Query parameter max_variations_supported is omitted or set to 2.
Listing	Request Payload	Result
Has up to two variations	Has up to two variations	Request succeeds, listing has request variations
Has up to three variations	Has three variations	Request fails with a 400 error, listing has original variations
Has three variations	Has up to three variations	Request fails with a 400 error, listing has original variations
Query parameter max_variations_supported is set to 3.
Listing	Request Payload	Result
Has up to three variations	Has up to three variations	Request succeeds, listing has request variations
Notes:

If the max_variations_supported query parameter is set to a different value than 2 or 3 the request returns a 400 error.
If the listing has three variations and the request payload has less than three variations, the missing variations is deleted.
Writing a Third Variation#
Use the endpoint getPropertiesByTaxonomyId to get the list of properties that can be used for variations ("supports_variations": true). The third variation can't be a custom variation. Custom variations use property_ids 513 and 514. The first two variations can be custom or property variations.

Examples#
Parameter set to 3
Parameter unset or set to 2
Parameter set to 3, custom variation
Context:
Request for listing with two or less variations, request adds a third variation.
Query parameter max_variations_supported is set to 3. (max_variations_supported=3)
Response changes:
All products[].property_values have three elements.
The *_on_property fields may have zero, one, or all three properties.
Example Payload

{
    "products": [
        {
            "offerings": [
                {
                    "price": 10.0,
                    "quantity": 1,
                    "is_enabled": true,
                    "readiness_state_id": 1020304051823
                }
            ],
            "property_values": [
                {
                    "property_id": 513,
                    "property_name": "My custom variation",
                    "value_ids": [],
                    "values": ["Custom value 1"],
                    "scale_id": null
                },
                {
                    "property_id": 200,
                    "property_name": "Primary color",
                    "value_ids": [9],
                    "values": ["Red"],
                    "scale_id": null
                },
                {
                    "property_id": 102868018123,
                    "property_name": "Gemstone type",
                    "value_ids": [4535],
                    "values": ["Agate"],
                    "scale_id": null
                }
            ],
            "sku": ""
        }
        // ...other products with three variations
    ],
    "price_on_property": [],
    "quantity_on_property": [],
    "readiness_state_on_property": [],
    "sku_on_property": []
}
Example Response

{
    "products": [
        {
            "product_id": 30328811353,
            "sku": "",
            "is_deleted": false,
            "offerings": [
                {
                    "offering_id": 123456284729,
                    "quantity": 1,
                    "is_enabled": true,
                    "is_deleted": false,
                    "price": { "amount": 1000, "divisor": 100, "currency_code": "USD" },
                    "readiness_state_id": 1020304051823
                }
            ],
            "property_values": [
                {
                    "property_id": 513,
                    "property_name": "My custom variation",
                    "scale_id": null,
                    "scale_name": null,
                    "value_ids": [1474406756737],
                    "values": ["Custom value 1"]
                },
                {
                    "property_id": 200,
                    "property_name": "Primary color",
                    "scale_id": null,
                    "scale_name": null,
                    "value_ids": [52041479599],
                    "values": ["Red"]
                },
                {
                    "property_id": 102868018123,
                    "property_name": "Gemstone",
                    "scale_id": null,
                    "scale_name": null,
                    "value_ids": [1014715895892],
                    "values": ["Agate"]
                }
            ]
        },
        // ...other products with three variations
    ],
    "price_on_property": [],
    "quantity_on_property": [],
    "sku_on_property": [],
    "readiness_state_on_property": []
}
Writing a Third Variation: Value Types#
The values of the third variation must be predefined for the property. There are three kinds of properties that support variations for the third variation:

Properties with predefined values, for example Color(200): The third variation can only use the predefined values.
Properties with predefined scales and predefined values, for example Bed pillow size (148789511779): The third variation can only use the predefined scales with the predefined values.
Properties with predefined scales and no predefined values, for example Width(47626759898): The third variation can use the predefined scales with custom values.
Use the endpoint getPropertiesByTaxonomyId to get the valid value_id or scale_id for the related properties of the listing's taxonomy node.

Examples#
Predefined values
Predefined scaled values
Scaled custom values
Custom values
Context:
Payload has a third variation with predefined values.
Query parameter max_variations_supported is set to 3. (max_variations_supported=3)
Response changes:
All products[].property_values have three elements.
The *_on_property fields may have zero, one, or all three properties.
Example Payload

{
    "products": [
        {
            "offerings": [
                {
                    "price": 10.0,
                    "quantity": 1,
                    "is_enabled": true,
                    "readiness_state_id": 1020304051823
                }
            ],
            "property_values": [
                {
                    "property_id": 513,
                    "property_name": "My custom variation",
                    "value_ids": [1474406756737],
                    "values": ["Custom value 1"],
                    "scale_id": null
                },
                {
                    "property_id": 200,
                    "property_name": "Primary color",
                    "value_ids": [9],
                    "values": ["Red"],
                    "scale_id": null
                },
                {
                    "property_id": 102868018123,
                    "property_name": "Gemstone type",
                    "value_ids": [4535],
                    "values": ["Agate"],
                    "scale_id": null
                }
            ],
            "sku": ""
        },
        // ...other products with three variations
    ],
    "price_on_property": [],
    "quantity_on_property": [],
    "readiness_state_on_property": [],
    "sku_on_property": []
}
Example Response

{
    "products": [
        {
            "product_id": 30328811353,
            "sku": "",
            "is_deleted": false,
            "offerings": [
                {
                    "offering_id": 123456284729,
                    "quantity": 1,
                    "is_enabled": true,
                    "is_deleted": false,
                    "price": { "amount": 1000, "divisor": 100, "currency_code": "USD" },
                    "readiness_state_id": 1020304051823
                }
            ],
            "property_values": [
                {
                    "property_id": 513,
                    "property_name": "My custom variation",
                    "scale_id": null,
                    "scale_name": null,
                    "value_ids": [1474406756737],
                    "values": ["Custom value 1"]
                },
                {
                    "property_id": 200,
                    "property_name": "Primary color",
                    "scale_id": null,
                    "scale_name": null,
                    "value_ids": [52041479599],
                    "values": ["Red"]
                },
                {
                    "property_id": 102868018123,
                    "property_name": "Gemstone",
                    "scale_id": null,
                    "scale_name": null,
                    "value_ids": [1014715895892],
                    "values": ["Agate"]
                }
            ]
        }
        // ...other products with three variations
    ],
    "price_on_property": [],
    "quantity_on_property": [],
    "sku_on_property": [],
    "readiness_state_on_property": []
}
Writing a Third Variation: On Property#
For listings with a third variation, you can use the *_on_property fields as follows:

Leave all of them empty, OR
Add one property to any of them, OR
Add all three properties to any of them.
When the listing has three variations, adding only two properties to any of these fields returns an error.

Examples#
Empty on_property fields
Up to one element
Three elements
Two elements
Context:
Payload has a third variation and empty *_on_property fields.
Query parameter max_variations_supported is set to 3. (max_variations_supported=3)
Response changes:
All products[].property_values have three elements.
The *_on_property fields are empty.
Example Payload

{
    "products": [
        {
            "offerings": [
                {
                    "price": 10.0,
                    "quantity": 1,
                    "is_enabled": true,
                    "readiness_state_id": 1020304051823
                }
            ],
            "property_values": [
                {
                    "property_id": 513,
                    "property_name": "My custom variation",
                    "value_ids": [1474406756737],
                    "values": ["Custom value 1"],
                    "scale_id": null
                },
                {
                    "property_id": 200,
                    "property_name": "Primary color",
                    "value_ids": [52041479599],
                    "values": ["Red"],
                    "scale_id": null
                },
                {
                    "property_id": 102868018123,
                    "property_name": "Gemstone type",
                    "value_ids": [1014715895892],
                    "values": ["Agate"],
                    "scale_id": null
                }
            ],
            "sku": ""
        }
        // ...other products with three variations
    ],
    "price_on_property": [],
    "quantity_on_property": [],
    "readiness_state_on_property": [],
    "sku_on_property": []
}
Example Response

{
    "products": [
        {
            "product_id": 30328811353,
            "sku": "",
            "is_deleted": false,
            "offerings": [
                {
                    "offering_id": 123456284729,
                    "quantity": 1,
                    "is_enabled": true,
                    "is_deleted": false,
                    "price": { "amount": 1000, "divisor": 100, "currency_code": "USD" },
                    "readiness_state_id": 1020304051823
                }
            ],
            "property_values": [
                {
                    "property_id": 513,
                    "property_name": "My custom variation",
                    "scale_id": null,
                    "scale_name": null,
                    "value_ids": [1474406756737],
                    "values": ["Custom value 1"]
                },
                {
                    "property_id": 200,
                    "property_name": "Primary color",
                    "scale_id": null,
                    "scale_name": null,
                    "value_ids": [52041479599],
                    "values": ["Red"]
                },
                {
                    "property_id": 102868018123,
                    "property_name": "Gemstone",
                    "scale_id": null,
                    "scale_name": null,
                    "value_ids": [1014715895892],
                    "values": ["Agate"]
                }
            ]
        }
        // ...other products with three variations
    ],
    "price_on_property": [],
    "quantity_on_property": [],
    "sku_on_property": [],
    "readiness_state_on_property": []
}
Removing the Third Variation#
To remove the third variation, use the updateListingInventory endpoint. Set the query parameter max_variations_supported to 3 and remove the variation property from property_values. Ensure that *_on_property fields only have properties used in the new inventory.

Examples#
Parameter set to 3
Parameter unset or set to 2
Context:
Request for listing with three variations, payload removes a variation
Query parameter max_variations_supported is set to 3. (max_variations_supported=3)
Response changes:
All products[].property_values have two elements.
The *_on_property fields may have zero, one, or all two properties.
Example Payload

{
    "products": [
        {
            "offerings": [
                {
                    "price": 10.0,
                    "quantity": 1,
                    "is_enabled": true,
                    "readiness_state_id": 1020304051823
                }
            ],
            "property_values": [
                {
                    "property_id": 513,
                    "property_name": "My custom variation",
                    "value_ids": [1474406756737],
                    "values": ["Custom value 1"],
                    "scale_id": null
                },
                {
                    "property_id": 102868018123,
                    "property_name": "Gemstone",
                    "value_ids": [1014715895892],
                    "values": ["Agate"],
                    "scale_id": null
                }
            ],
            "sku": ""
        }
        // ...other products with two variations
    ],
    "price_on_property": [],
    "quantity_on_property": [],
    "readiness_state_on_property": [],
    "sku_on_property": []
}
Example Response

{
    "products": [
        {
            "product_id": 30328811353,
            "sku": "",
            "is_deleted": false,
            "offerings": [
                {
                    "offering_id": 123456284729,
                    "quantity": 1,
                    "is_enabled": true,
                    "is_deleted": false,
                    "price": { "amount": 1000, "divisor": 100, "currency_code": "USD" },
                    "readiness_state_id": 1020304051823
                }
            ],
            "property_values": [
                {
                    "property_id": 513,
                    "property_name": "My custom variation",
                    "scale_id": null,
                    "scale_name": null,
                    "value_ids": [1474406756737],
                    "values": ["Custom value 1"]
                },
                {
                    "property_id": 102868018123,
                    "property_name": "Gemstone",
                    "scale_id": null,
                    "scale_name": null,
                    "value_ids": [1014715895892],
                    "values": ["Agate"]
                }
            ]
        }
        // ...other products with two variations
    ],
    "price_on_property": [],
    "quantity_on_property": [],
    "sku_on_property": [],
    "readiness_state_on_property": []
}