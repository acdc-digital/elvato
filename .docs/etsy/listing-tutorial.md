Listings Tutorial
important
These tutorials are subject to change as endpoints change during our feedback period development. We welcome your feedback! If you find an error or have a suggestion, please post it in the Open API GitHub Repository.

Listings are the pages containing products for sale in an Etsy shop. The Etsy Open API v3 supports managing listings either for an individual shop or across the Etsy marketplace as a whole, depending on your application's Access Level.

Throughout this tutorial, the instructions reference REST resources, endpoints, parameters, and response fields, which we cover in detail in Request Standards and URL Syntax.

Authorization and x-api-key header parameters#
The endpoints in this tutorial require an OAuth token in the header with listings_r and listings_w scope. If your app also deletes listings, then the token requires the listings_d scope as well. See the Authentication topic for instructions on how to generate an OAuth token with these scopes.

In addition, all Open API V3 Requests require the x-api-key: parameter in the header with your shop's Etsy App API Key keystring and shared secret, separated by a colon (:), which you can find in Your Apps.

Listing lifecycle and state#
After creating a listing, your users, Etsy, or your application can change the listing to reflect several states that determine how customers interact with the listing and the effective changes available to sellers, which map to API endpoints. The following table summarizes the states and the change operations available from the API.

state	description	Actions and endpoints
draft	inactive listing because its state is not "active" or lacks at least one image	Publish (updateListing), Delete (deleteListing)
published	active listing searchable by users, with > 0 unsold inventory	Deactivate (updateListing), Delete (deleteListing)
deactivated	previously published listing deliberately deactivated, unsearchable, and unsellable	Publish (updateListing), Delete (deleteListing)
sold out	published listing with 0 unsold inventory	Delete (deleteListing)
expired	previously published listing older that was not renewed after expiring (not charged)	Publish (updateListing), Delete (deleteListing)
Listing a physical product for sale#
To add a new listing to a shop, use the createDraftListing endpoint, which adds a single item for sale to an Etsy Shop. All published listings require at least one listing image, so your application must either:

use images already uploaded to the shop, or
upload listing images - see Adding an image to a listing
The following procedure adds a listing using images already uploaded to the shop:

Form a valid URL for createDraftListing, which must include a shop_id for the shop that hosts the listing. For example, if your shop_id is : "12345678", the createDraftListing URL is:

https://api.etsy.com/v3/application/shops/12345678/listings
Build the createDraftListing request body, which must include at a minimum:

quantity
title
description
price
who_made
when_made
taxonomy_id
image_ids required for active listings
shipping_profile_id required for physical listings
readiness_state_id required for physical listings
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
urlencoded.append("shipping_profile_id", "6722757781");
urlencoded.append("readiness_state_id", "18201076875");

var requestOptions = {
    method: 'POST',
    headers: headers,
    body: urlencoded,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/12345678/listings", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));

To sell variations of the same product in the same listing, such as different colored products with specific quantities for sale in each color, see Listing inventory with different properties, quantities, and prices below.

Listing a digital product for sale#
To list a digital product for sale, use createDraftListing just as you would for a physical product, but your application must set the listing's type parameter to "download" and upload a digital product file for the digital product listing using uploadListingFile. If you already uploaded a digital product file to your shop, for example as part of previous listing, you can associate the file with a listing using uploadListingFile with its file ID as well. Each file in a shop is unique and managed separately, so you cannot assign or upload a file with createDraftListing.

The following procedure uploads a digital product file to a listing and updates the listing's type parameter to "download":

Form a valid URL for uploadListingFile, which must include a shop_id and listing_id to assign the digital product file to a listing. For example, if your shop_id is "12345678" and your listing_id is "192837465," then the uploadListingFile URL is:

https://api.etsy.com/v3/application/shops/12345678/listings/192837465/files
Build the uploadListingFile request body, which must include either a file (binary) parameter for a digital product file to upload or a file_id for a file already uploaded to the shop, but not both.

Execute an uploadListingFile POST request with your listings_w scoped OAuth token and x-api-key. For example, an uploadListingFile request might look like the following:

JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/x-www-form-urlencoded");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var urlencoded = new URLSearchParams();
urlencoded.append("file", "v8%&^%&$38owf87leshif;hnvygsldjkhnvusidsba',;bf.r;'e,rl;rtkjrj87^*^&_Iuyibdsa*^5765FtIG YtfDbf86af*rfdiidtbsdiGIgdi7vleikvvvkdljke ... d[L>(*BKbaukyfgdg'jsdkbklvh");

var requestOptions = {
    method: 'POST',
    headers: headers,
    body: urlencoded,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/12345678/listings/192837465/files", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
Set the listing's type to "download" with an updateListing PATCH request that includes shop_id and listing_id in the URL, a listings_w scoped OAuth token and x-api-key in the header, and the type setting in the request body. For example, an updateListing request might look like the following:
JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/x-www-form-urlencoded");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var urlencoded = new URLSearchParams();
urlencoded.append("type", "download");

var requestOptions = {
    method: 'PATCH',
    headers: headers,
    body: urlencoded,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/12345678/listings/192837465", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
Converting a physical product listing to a digital product listing#
In the event that a physical product listing needs to be changed to a digital listing, this can be accomplished via the updateListing endpoint and passing type as "download". However, note that if the physical product listing has any variations or inventory beyond a single product, updateListing will return a 409 error. Before converting any physical listing to digital, the inventory must be reset to a single product using the uploadListingInventory endpoint.

The following is an example body of the uploadListingInventory post (set your price as a float value and your sku):

{
    "products": [
        {
            "sku": "YOUR SKU HERE",
            "offerings": [
                {
                    "quantity": 1,
                    "is_enabled": true,
                    "price": 1.23,
                    "readiness_state_id": 18201076875
                }
            ],
            "property_values": []
        }
    ],
    "price_on_property": [],
    "quantity_on_property": [],
    "sku_on_property": []
}
Adding an image to a listing#
Published listings require at least one listing image, as noted above. To upload a new image and add it to a listing, use the uploadListingImage endpoint with the shop and listing IDs, and add the image binary file in the image parameter. To make a listing active after uploading a required image, use the updateListing endpoint with the state parameter set to "active." As noted above, you can associate images with listings in a createDraftListing request using the image_ids parameter if images are already uploaded to your shop.

The following procedure uploads an image to a listing and updates the listing to active:

Form a valid URL for uploadListingImage, which must include a shop_id and listing_id to assign the image to a listing. For example, if your shop_id is "12345678" and your listing_id is "192837465," then the uploadListingImage URL is:

https://api.etsy.com/v3/application/shops/12345678/listings/192837465/images
Build the uploadListingImage request body, which must include either an image (binary) parameter with a digital image as its value or a listing_image_id for an image uploaded to the shop, but not both.

Execute an uploadListingImage POST request with your listings_w scoped OAuth token and x-api-key. For example, an uploadListingImage request might look like the following:

JavaScript fetch
Node JS
PHP curl
var myHeaders = new Headers();
myHeaders.append("Content-Type", "multipart/form-data");
myHeaders.append("x-api-key", "112233445566778899:a1b2c3d4e5");
myHeaders.append("Authorization", "Bearer abcd1234efgh5678ijkl90mnopqrst");

var formdata = new FormData();
formdata.append("image", fileInput.files[0], "image.jpg");

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: formdata,
  redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/xxxxxxxx/listings/yyyyyyyy/images", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
Set the Listing's state to "active" with an updateListing PATCH request that includes shop_id and listing_id in the URL, a listings_w scoped OAuth token and x-api-key in the header, and the new state in the request body. For example, an updateListing request might look like the following:
JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/x-www-form-urlencoded");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var urlencoded = new URLSearchParams();
urlencoded.append("state", "active");

var requestOptions = {
    method: 'PATCH',
    headers: headers,
    body: urlencoded,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/12345678/listings/192837465", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
Listing inventory with different properties, quantities, and prices#
Inventory is a list of products for sale in a listing. The products are customizable, so understanding the inventory request structure is vital to offering different variations of the same product in one listing. Inventory defines products using the following components:

sku: Stock Keeping Unit (SKU) assigned to this product.
offerings: a list of prices and quantities associated with a specific product, representing purchase options visible to buyers on the Etsy shop.
quantity: the number of products available at this offering price
price: a number indicating the price of this product interpreted in the default currency of the listing/shop, which is US pennies by default.
is_enabled: when true, the offering is visible to buyers in the listing.
readiness_state_id: the processing profile associated with the offering, if processing profile is set at listing level this id will be the same across all offerings.
property_values: A list of properties differentiating this product from other products in a listing. For example, to sell sets of bed sheets in different color (white, blue, magenta, forest green, etc) and size (twin, full, queen, king) combinations, use property_values for color and size.
property_id: a unique number identifying this property.
property_name: a string name for a property.
scale_id: a number indexing an Etsy-defined scale. There are a lot of these, but for example shoe sizes have three available scales:
Scale ID	Scale Name	Value IDs and Names
17	US/Canada	value_id:1329,"name":"0 (Baby)", value_id:1330,"name":"0.5 (Baby)", value_id:1331,"name":"1 (Baby)", value_id:1332,"name":"1.5 (Baby)", value_id:1333,"name":"2 (Baby)", value_id:1334,"name":"2.5 (Baby)", value_id:1335,"name":"3 (Baby)", value_id:1336,"name":"3.5 (Baby)", value_id:1337,"name":"4 (Baby)", value_id:1338,"name":"4.5 (Walker)", value_id:1339,"name":"5 (Walker)", value_id:1340,"name":"5.5 (Walker)", value_id:1341,"name":"6 (Walker)", value_id:1342,"name":"6.5 (Walker)", value_id:1343,"name":"7 (Walker)", value_id:1344,"name":"7.5 (Toddler)", value_id:1345,"name":"8 (Toddler)", value_id:1346,"name":"8.5 (Toddler)", value_id:1347,"name":"9 (Toddler)", value_id:1348,"name":"9.5 (Toddler)", value_id:1349,"name":"10 (Toddler)", value_id:1350,"name":"10.5 (Toddler)", value_id:1351,"name":"11 (Toddler)", value_id:1352,"name":"11.5 (Toddler)", value_id:1353,"name":"12 (Toddler)", value_id:1354,"name":"12.5 (Youth)", value_id:1355,"name":"13 (Youth)", value_id:1356,"name":"13.5 (Youth)", value_id:1357,"name":"1 (Youth)", value_id:1358,"name":"1.5 (Youth)", value_id:1359,"name":"2 (Youth)", value_id:1360,"name":"2.5 (Youth)", value_id:1361,"name":"3 (Youth)", value_id:1362,"name":"3.5 (Youth)", value_id:1363,"name":"4 (Youth)", value_id:1364,"name":"4.5 (Youth)", value_id:1365,"name":"5 (Youth)", value_id:1366,"name":"5.5 (Youth)", value_id:1367,"name":"6 (Youth)", value_id:1368,"name":"6.5 (Youth)", value_id:1369,"name":"7 (Youth)"
18	EU	"value_id":1370,"name":"15", "value_id":1371,"name":"16", "value_id":1372,"name":"17", "value_id":1373,"name":"18", "value_id":1374,"name":"19", "value_id":1375,"name":"20", "value_id":1376,"name":"21", "value_id":1377,"name":"22", "value_id":1378,"name":"23", "value_id":1379,"name":"24", "value_id":1380,"name":"25", "value_id":1381,"name":"26", "value_id":1382,"name":"27", "value_id":1383,"name":"28", "value_id":1385,"name":"29", "value_id":1386,"name":"30", "value_id":1387,"name":"31", "value_id":1388,"name":"32", "value_id":1389,"name":"33", "value_id":1390,"name":"34", "value_id":1391,"name":"35", "value_id":1392,"name":"36", "value_id":1393,"name":"37", "value_id":1394,"name":"38", "value_id":1395,"name":"39"
19	UK	value_id:1396,"name":"0 (Baby)", value_id:1397,"name":"0.5 (Baby)", value_id:1399,"name":"1 (Baby)", value_id:1401,"name":"1.5 (Baby)", value_id:1402,"name":"2 (Baby)", value_id:1403,"name":"2.5 (Baby)", value_id:1404,"name":"3 (Baby)", value_id:1405,"name":"3.5 (Walker)", value_id:1406,"name":"4 (Walker)", value_id:1407,"name":"4.5 (Walker)", value_id:1408,"name":"5 (Walker)", value_id:1409,"name":"5.5 (Walker)", value_id:1410,"name":"6 (Walker)", value_id:1411,"name":"6.5 (Toddler)", value_id:1412,"name":"7 (Toddler)", value_id:1413,"name":"7.5 (Toddler)", value_id:1414,"name":"8 (Toddler)", value_id:1415,"name":"8.5 (Toddler)", value_id:1416,"name":"9 (Toddler)", value_id:1417,"name":"9.5 (Toddler)", value_id:1418,"name":"10 (Toddler)", value_id:1419,"name":"10.5 (Toddler)", value_id:1420,"name":"11 (Toddler)", value_id:1421,"name":"11.5 (Youth)", value_id:1422,"name":"12 (Youth)", value_id:1423,"name":"12.5 (Youth)", value_id:1424,"name":"13 (Youth)", value_id:1425,"name":"13.5 (Youth)", value_id:1426,"name":"1 (Youth)", value_id:1428,"name":"2 (Youth)", value_id:1429,"name":"2.5 (Youth)", value_id:1430,"name":"3 (Youth)", value_id:1431,"name":"3.5 (Youth)", value_id:1432,"name":"4 (Youth)", value_id:1433,"name":"4.5 (Youth)", value_id:1434,"name":"5 (Youth)", value_id:1435,"name":"5.5 (Youth)", value_id:1436,"name":"6 (Youth)"
value_ids: a list of numbers valid for the scale_id selected indicating the product variations.
values: a list of strings matching the value ids selected.
The following endpoints change the listing properties and inventory for an existing listing:

updateListingProperty adds properties to a listing
updateListingInventory assigns skus to offerings for different property combinations
Updating Inventory#
The following procedure adds a product for sale in a listing:

Form a valid URL for updateListingInventory, which must include a listing_id to change the inventory in a listing. For example, if your listing_id is "192837465," then the updateListingInventory URL is:

https://api.etsy.com/v3/application/listings/192837465/inventory
Build the updateListingInventory request body, which must include at least one product in the products parameter with nested offerings and property_values lists.

Execute an updateListingInventory PUT request with a listings_w scoped OAuth token and x-api-key. For example, an updateListingInventory request to add 10 US/Canada size 4 shoes with a sku of 7836646 might look like the following:

JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/json");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var productsArray = {
    "products": [
        {
            "sku": "7836646",
            "property_values": [
                {
                    "property_id": 54142601979,
                    "property_name": "Kids' shoe size",
                    "scale_id": 17,
                    "value_ids": [
                        1363
                    ],
                    "values": [
                        "4 (Youth)"
                    ],
                }
            ],
            "offerings": [
                {
                    "price": 500,
                    "quantity": 10,
                    "is_enabled": true,
                    "readiness_state_id": 18201076875
                }
            ]
        }
    ]
};

var requestOptions = {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(productsArray),
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/listings/192837465/inventory", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
NOTES:

When updating inventory, the entire set of products (based on variations) must be in the products array.

To get the product array, call getListingInventory for the listing. From the getListingInventory response, remove the following fields: product_id, offering_id, scale_name, is_deleted and value_pairs. Also change the price array in offerings to be a decimal value instead of an array.

The *_on_property values should match the property_id values, but only if those properties affect the price, quantity or sku. See the sample below for handling variations.

The *_on_property fields can be empty, have one property, or all the properties used for variations.

Use Custom Variations if any of the existing properties don't exist or fit your use case.

Handling Variations in Inventory Updates#
The following example updates a listing inventory where there are two variations:

Material - "Pine", "Oak", "Walnut"

Height - "3", "4", "5"

In this example, the material variation affects the price, while the height variation affects the quantity and sku of the product.

In the products array, you will have 9 entries (3 materials x 3 heights).

Due to the height affecting both quantity and sku, when quantity is updated it must be the same value across all products sharing the same sku. The sku "woodthing3" has 3 entries in the array, but the quantity value for all three of those arrays (inside offerings) must be the same value (33 in this example).

Similarly, because material affects pricing, in each product you will see that the "Walnut" property value indicates the price in offerings is 8.00 while "Oak" is 7.00 and "Pine" is 6.00.

Note that since there is only one variation that affects the price, the price_on_property value is a single value of 47626760362, which is the property_id for "Material". Since height affects both quantity and sku, the quantity_on_property and sku_on_property values are a single value of 47626759834, which is the property_id for "Height".

The processing profile is shared across all offerings, which means that the profile is set at a listing level. See Adding a processing profile to a listing for more details about processing profiles.

JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/json");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var productsArray = {
    "products": [
        {
            "sku": "woodthing3",
            "offerings": [
                {
                    "quantity": 33,
                    "is_enabled": true,
                    "price": 8.00,
                    "readiness_state_id": 18201076875
                }
            ],
            "property_values": [
                {
                    "property_id": 47626759834,
                    "property_name": "Height",
                    "scale_id": 5,
                    "value_ids": [
                        18156809190
                    ],
                    "values": [
                        "3"
                    ]
                },
                {
                    "property_id": 47626760362,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        283
                    ],
                    "values": [
                        "Walnut"
                    ]
                }
            ]
        },
        {
            "sku": "woodthing3",
            "offerings": [
                {
                    "quantity": 33,
                    "is_enabled": true,
                    "price": 7.00,
                    "readiness_state_id": 18201076875
                }
            ],
            "property_values": [
                {
                    "property_id": 47626759834,
                    "property_name": "Height",
                    "scale_id": 5,
                    "value_ids": [
                        18156809190
                    ],
                    "values": [
                        "3"
                    ]
                },
                {
                    "property_id": 47626760362,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        188
                    ],
                    "values": [
                        "Oak"
                    ]
                }
            ]
        },
        {
            "sku": "woodthing3",
            "offerings": [
                {
                    "quantity": 33,
                    "is_enabled": true,
                    "price": 6.00,
                    "readiness_state_id": 18201076875
                }
            ],
            "property_values": [
                {
                    "property_id": 47626759834,
                    "property_name": "Height",
                    "scale_id": 5,
                    "value_ids": [
                        18156809190
                    ],
                    "values": [
                        "3"
                    ]
                },
                {
                    "property_id": 47626760362,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        203
                    ],
                    "values": [
                        "Pine"
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
                    "price": 8.00,
                    "readiness_state_id": 18201076875
                }
            ],
            "property_values": [
                {
                    "property_id": 47626759834,
                    "property_name": "Height",
                    "scale_id": 5,
                    "value_ids": [
                        18107494140
                    ],
                    "values": [
                        "4"
                    ]
                },
                {
                    "property_id": 47626760362,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        283
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
                    "price": 7.00,
                    "readiness_state_id": 18201076875
                }
            ],
            "property_values": [
                {
                    "property_id": 47626759834,
                    "property_name": "Height",
                    "scale_id": 5,
                    "value_ids": [
                        18107494140
                    ],
                    "values": [
                        "4"
                    ]
                },
                {
                    "property_id": 47626760362,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        188
                    ],
                    "values": [
                        "Oak"
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
                    "readiness_state_id": 18201076875
                }
            ],
            "property_values": [
                {
                    "property_id": 47626759834,
                    "property_name": "Height",
                    "scale_id": 5,
                    "value_ids": [
                        18107494140
                    ],
                    "values": [
                        "4"
                    ]
                },
                {
                    "property_id": 47626760362,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        203
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
                    "property_id": 47626759834,
                    "property_name": "Height",
                    "scale_id": 5,
                    "value_ids": [
                        18107397735
                    ],
                    "values": [
                        "5"
                    ]
                },
                {
                    "property_id": 47626760362,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        283
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
                    "price": 7.00,
                    "readiness_state_id": 18201076875
                }
            ],
            "property_values": [
                {
                    "property_id": 47626759834,
                    "property_name": "Height",
                    "scale_id": 5,
                    "value_ids": [
                        18107397735
                    ],
                    "values": [
                        "5"
                    ]
                },
                {
                    "property_id": 47626760362,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        188
                    ],
                    "values": [
                        "Oak"
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
                    "readiness_state_id": 18201076875
                }
            ],
            "property_values": [
                {
                    "property_id": 47626759834,
                    "property_name": "Height",
                    "scale_id": 5,
                    "value_ids": [
                        18107397735
                    ],
                    "values": [
                        "5"
                    ]
                },
                {
                    "property_id": 47626760362,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        203
                    ],
                    "values": [
                        "Pine"
                    ]
                }
            ]
        }
    ],
    "price_on_property": [47626760362],
    "quantity_on_property": [47626759834],
    "sku_on_property": [47626759834],
    "readiness_state_on_property": []
};

var requestOptions = {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(productsArray),
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/listings/192837465/inventory", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
Custom Variations#
Custom Variations behave just like normal variations, except you can assign your own custom name to them instead of needing to adhere to properties. There can be at most 2 custom variations. The property_ids for custom variations are 513 and 514. Use either of these when creating a custom variation.

How to Fetch Property Values for the Products Array?#
Since variations can not be added at the time of creation of a new listing, the following procedure should help with creating the products array for your updateListingInventory call.

The property_values is required but may be empty when attempting to post to the endpoint. The properties that may be used for variations on any given listing will depend upon the category the listing is placed in.

Property ids and possible values are available via the following endpoints: getSellerTaxonomyNodes and getPropertiesByTaxonomyId.

If you don't already have a list of property ids for the product properties you wish to use in the new listing, use a GET call to getSellerTaxonomyNodes first to retrieve the full hierarchy tree of seller taxonomy nodes.

In the taxonomy tree, you can look for the category you wish to use and note the id.

Perform a GET call to the getPropertiesByTaxonomyId endpoint with the id of the category. This will give you the possible properties for the category, along with their possible values. Only properties with the field "supports_variations": true can be used in property_values.

Notes about taxonomy:

Some of the common taxonomy node properties that Etsy uses, such as Color, have a list of common values/value ids. When you pass in value_id 4 we convert that to your shop's unique ID for the color "Green". If it's not already in the system for your shop, it will create one. And then you'll use your shop's unique ID over and over again in the values_ids field any time you provide "Green" for the color in the values field. Subsequent queries to get inventory should return your shop's unique ID and not our known common ID.

There are also getBuyerTaxonomyNodes and getPropertiesByBuyerTaxonomyId endpoints for use by more buyer-facing apps. The difference between the two is that the levels of hierarchy in the seller taxonomy is often deeper than that of Buyers. For example, a listing for "blue yarn" is in All categories → Craft Supplies & Tools. The Craft Supplies & Tools is a buyer taxonomy. But in reality, the listing is inside of All categories → Craft Supplies & Tools → Yarn & Fiber → Yarn. The Yarn & Fiber and Yarn category and sub category are the seller taxonomy. For sellers these are very useful categories for sorting and tracking listings. However, from a Buyer perspective, showing the category and subcategory in the category tree would end up cluttering the buyer experience. Since the yarn is really just a craft supply it makes sense to show it under that more top-level category.

Adding a shipping profile to a listing#
Shipping profiles assemble shipping details such as shipping price and processing time for recipients grouped by country or region. Every physical listing requires a shipping profile, so you add shipping profiles to your shop with createShopShippingProfile, and assign a shipping profile to a listing using a shipping_profile_id when you create or update the listing.

The following procedure creates a new shipping profile and returns the shipping_profile_id in the response:

Form a valid URL for createShopShippingProfile, which must include a shop_id. For example, if your shop_id is "12345678", then the createShopShippingProfile URL is:

https://api.etsy.com/v3/application/shops/12345678/shipping-profiles

Build the createShopShippingProfile request body, which must include at a minimum:

title: Use a title that indicates the country or region.
origin_country_iso: The ISO code of the country from which the listing ships.
primary_cost: The cost of shipping to this country/region alone, measured in the store's default currency.
secondary_cost: The cost of shipping to this country/region with another item, measured in the store's default currency.
min_processing_time: The minimum processing time required to process to ship listings with this shipping profile. This field is in deprecation phase and will be removed by Q1 2026.
max_processing_time: The maximum processing time required to process to ship listings with this shipping profile. This field is in deprecation phase and will be removed by Q1 2026.
One of destination_country_iso (see list of Alpha-2 codes here) OR destination_region (possible values are "eu" "non_eu" or "none"), but not both.
Execute an createShopShippingProfile POST request with your shops_w scoped OAuth token and x-api-key, and read the generated shipping_profile_id from the response. For example, a createShopShippingProfile request for shipments from the US to the EU with free shipping might look like the following:
JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/x-www-form-urlencoded");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var urlencoded = new URLSearchParams();
urlencoded.append("title", "Free shipping to the EU");
urlencoded.append("origin_country_iso", "US");
urlencoded.append("primary_cost", "0");
urlencoded.append("secondary_cost", "0");
urlencoded.append("min_processing_time", "1");
urlencoded.append("max_processing_time", "5");
urlencoded.append("destination_region", "eu");

var requestOptions = {
    method: 'POST',
    headers: headers,
    body: urlencoded,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/12345678/shipping-profiles", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
Set the listing's shipping_profile_id to the shipping profile ID read from the response to setting the shipping profile ID with an updateListing PATCH request that includes shop_id and listing_id in the URL, a listings_w scoped OAuth token and x-api-key in the header, and the new state in the request body. For example, an updateListing request might look like the following:
JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/x-www-form-urlencoded");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var urlencoded = new URLSearchParams();
urlencoded.append("shipping_profile_id", "6722757781");

var requestOptions = {
    method: 'PATCH',
    headers: headers,
    body: urlencoded,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/12345678/listings/192837465", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
Adding a processing profile to a listing#
Processing profiles contain information about the readiness state and processing time of a product. Every physical listing requires at least one processing profile to be linked to it. You can create processing profiles for your shop with createShopReadinessStateDefinition, and link it to a listing using the readiness_state_id when you create a new listing through createDraftListing or to specific products when you update a listing's inventory through updateListingInventory.

The following procedure creates a new processing profile and returns the readiness_state_id in the response:

Form a valid URL for createShopReadinessStateDefinition, which must include a shop_id. For example, if your shop_id is "12345678", then the createShopReadinessStateDefinition URL is:

https://api.etsy.com/v3/application/shops/12345678/readiness-state-definitions

Build the createShopReadinessStateDefinition request body, which must include at a minimum:

readiness_state: The state a product can be in production wise, values can be either "ready_to_ship" or "made_to_order".
min_processing_time: The minimum processing time required to process to ship listings with this shipping profile. This field is in deprecation phase and will be removed by Q1 2026.
max_processing_time: The maximum processing time required to process to ship listings with this shipping profile. This field is in deprecation phase and will be removed by Q1 2026.
processing_time_unit: The unit used to represent how long a processing time is. A week is equivalent to 5 business days. Values can be "days" or "weeks". If none is provided, the unit is set to "days".
Execute a createShopReadinessStateDefinition POST request with your shops_w scoped OAuth token and x-api-key, and read the generated readiness_state_id from the response, which you’ll use to link it to specific products later on. For example, a createShopReadinessStateDefinition request for a product that’s made to order and the processing time is 5-8 days might look like the following:
JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/x-www-form-urlencoded");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff");
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
Set the listing's readiness_state_id to the readiness state ID read from the response while creating a new listing through createDraftListing endpoint or while updating the listing through updateListingInventory endpoint. For example, an updateListingInventory request might look like the following:
JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/json");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff");
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
                    "property_id": 47626759834,
                    "property_name": "Height",
                    "scale_id": 5,
                    "value_ids": [
                        18107494140
                    ],
                    "values": [
                        "4"
                    ]
                },
                {
                    "property_id": 47626760362,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        283
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
                    "property_id": 47626759834,
                    "property_name": "Height",
                    "scale_id": 5,
                    "value_ids": [
                        18107494140
                    ],
                    "values": [
                        "4"
                    ]
                },
                {
                    "property_id": 47626760362,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        203
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
                    "property_id": 47626759834,
                    "property_name": "Height",
                    "scale_id": 5,
                    "value_ids": [
                        18107397735
                    ],
                    "values": [
                        "5"
                    ]
                },
                {
                    "property_id": 47626760362,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        283
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
                    "property_id": 47626759834,
                    "property_name": "Height",
                    "scale_id": 5,
                    "value_ids": [
                        18107397735
                    ],
                    "values": [
                        "5"
                    ]
                },
                {
                    "property_id": 47626760362,
                    "property_name": "Material",
                    "scale_id": null,
                    "value_ids": [
                        203
                    ],
                    "values": [
                        "Pine"
                    ]
                }
            ]
        }
    ],
    "price_on_property": [47626760362],
    "quantity_on_property": [47626759834],
    "sku_on_property": [47626759834],
    "readiness_state_on_property": [47626760362],
};

var requestOptions = {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(productsArray),
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/listings/192837465/inventory", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
As you can see in the above example, since processing profiles vary by the material property like price, we'll add a readiness_state_on_property value with the property_id corresponding to "Material" (47626760362).

Each product offering will have an associated readiness_state_id, in this case the same readiness_state_id needs to be used for all the offerings that have the same material. We have two offerings for each material, let’s take “Walnut” as an example:

Walnut - Height 4
Walnut - Height 5
Since they all share the “Walnut” property value they will use the same processing profile.

However, if you’d prefer to set the processing profile at a listing level, the body request for the updateListingInventory endpoint would be pretty similar to the case above, with two main differences:

The same readiness_state_id will be used for all the product offerings.
The readiness_state_on_property value will be empty, as none of the properties change the readiness state of the product.