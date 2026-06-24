Shop Management Tutorial
important
These tutorials are subject to change as endpoints change during our feedback period development. We welcome your feedback! If you find an error or have a suggestion, please post it in the Open API GitHub Repository.

An Etsy shop is a common resource to organize a seller's listings and service buyers, and every Etsy user has at least one shop. Shops contain references to all resource, listing, and sales records, including previously uploaded files, images, shipping profiles, and deleted listings. Apps create or update most of these references using resource-specific endpoints, but require a shop ID to access them. You can update the shop and create shop sections using requests to the shop resource directly. The Etsy Open API v3 supports managing individual shops or shops across the Etsy marketplace as a whole, depending on your application's Access Level.

Throughout this tutorial, the instructions reference REST resources, endpoints, parameters, and response fields, which we cover in detail in Request Standards and URL Syntax.

Authorization and x-api-key header parameters#
The endpoints in this tutorial require an OAuth token in the header with shops_r and shops_w scope. In addition, to assign Listings to a shop section (see below), you require an OAuth token with a listings_w scope. See the Authentication topic for instructions on how to generate an OAuth token with these scopes.

In addition, all Open API V3 requests require the x-api-key: parameter in the header with your shop's Etsy App API Key keystring and shared secret, separated by a colon (:), which you can find in Your Apps.

Customize announcements and sales messages#
You can assign and change the following attributes for a shop using the updateShop endpoint:

title: The title displayed at the top of all the shop's pages
announcement: A message displayed on the shop's homepage
sale_message: A message sent to the buyer's Etsy messages when they purchase any product from this shop
digital_sale_message: A message sent to the buyer's Etsy messages when they purchase any digital product from this shop
The following procedure changes the messages for a shop:

Form a valid URL for updateShop, which must include your shop_id. For example, if your shop_id is 12345678, the updateShop URL is:

https://api.etsy.com/v3/application/shops/12345678
Build the updateShop request body with the messages you want to update. All the parameters accept string values.

Execute an updateShop PUT request with a shops_r and shops_w combined scope OAuth token and x-api-key. For example, an updateShop request to update all messages for Manny's Land of Carpets would look like the following:

JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/x-www-form-urlencoded");
headers.append("x-api-key", "2lk6cu87j83a15eqnfmf7ysk:a1b2c3d4e5:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var urlencoded = new URLSearchParams();
urlencoded.append("title", "Manny's Land of Carpets");
urlencoded.append("announcement", "Welcome to the amazing world of carpets!");
urlencoded.append("sale_message", "Manny's Land of Carpets would like to personally congratulate you on your carpet purchase! We are assembling your order and will ship it to you immediately upon receiving payment. You should receive an email in the next 24 hours with a receipt for your purchase and shipping options for your region.");
urlencoded.append("digital_sale_message", "All digital carpet sales are final.");

var requestOptions = {
    method: 'PUT',
    headers: headers,
    body: urlencoded,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/12345678", requestOptions)
.then(response => response.text())
.then(result => console.log(result))
.catch(error => console.log('error', error));
Add a Shop Section#
Shop sections organize listings displayed in an Etsy shop. You can create shop sections using the createShopSection endpoint, which provides the new shop section ID in the response. To add a listing to a shop section, use the updateListing endpoint with the section_id parameter set to a section ID.

The following procedure creates a new shop section and updates a listing to display in the new shop section:

Form a valid URL for createShopSection, which must include your shop_id. For example, if your shop_id is 12345678, the createShopSection URL is:

https://api.etsy.com/v3/application/shops/12345678/sections
Build the createShopSection request body, which must include title with a string to display at the top of a section in the shop.

Execute a createShopSection POST request with a shops_w scope OAuth token and x-api-key. For example, a createShopSection request to create the "Spiral Carpet" section might look like the following:

JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/x-www-form-urlencoded");
headers.append("x-api-key", "2lk6cu87j83a15eqnfmf7ysk:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var urlencoded = new URLSearchParams();
urlencoded.append("title", "Spiral Carpet");

var requestOptions = {
    method: 'POST',
    headers: headers,
    body: urlencoded,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/12345678/sections", requestOptions)
.then(response => response.text())
.then(result => console.log(result))
.catch(error => console.log('error', error));
Set all listings' section_ids to the section ID for the section in which you want to display the listings with an updateListing PUT request that includes shop_id and listing_id in the URL, a listings_w scoped OAuth token and x-api-key in the header, and the new section ID in the request body. For example, if your shop_id is 12345678, your listing_id is 192837465, and your section_id is 55566585, then the updateListing URL is:
JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/x-www-form-urlencoded");
headers.append("x-api-key", "2lk6cu87j83a15eqnfmf7ysk:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var urlencoded = new URLSearchParams();
urlencoded.append("section_id", "55566585");

var requestOptions = {
    method: 'PUT',
    headers: headers,
    body: urlencoded,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/12345678/listings/192837465", requestOptions)
.then(response => response.text())
.then(result => console.log(result))
.catch(error => console.log('error', error));