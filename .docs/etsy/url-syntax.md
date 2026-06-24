URL Syntax
The URL for any Open API v3 request determines which specific resource or collection of resources services the request. Open API v3 URLs have the following syntax:

https://api.etsy.com/v3/application/<resource>[?<parameter=value>{&<parameter=value>}]
where

https://api.etsy.com/v3/application/ is the default context root and directory for accessing REST API resources.
<resource> is the name of the REST API resource, all of which are listed in API reference
?<parameter=value> specifies a parameter name and value pair that a request accepts. The endpoint definitions provide details on which parameters to use for each request.
For example, in

https://api.etsy.com/v3/application/listings?state=active
https://api.etsy.com/v3/application/ is the default context root and directory for accessing REST API resources.
listings is the name of the shop listings REST API resource, described in the getListingsByShop endpoint reference.
?state=active is a state parameter to filter the listings results.
Asset ID Parameters#
Resource paths in a URL can contain the unique IDs of Etsy assets such as shops, listings, transactions, receipts, images, etc. For example, you would use the following URL pattern to send requests to the delete listing image endpoint:

DELETE https://api.etsy.com/v3/application/shop/{shop_id}/listings/{listing_id}/images/{listing_image_id}
Where the {shop_id}, {listing_id}, and {listing_image_id} parameters must be replaced by specific IDs identifying the shop, listing, and listing image to delete. Resource path parameters must appear in the URL; applications cannot send them in the HTTP Header and all ID parameters listed in the URL pattern must be present.

Parameter Types#
Many API methods take one or more parameters, either as query parameters of the URL itself, or as POST parameters in the HTTP header. The documentation for each method references these standard types:

Param Type	Meaning
Array of <type>	A list of values, separated by commas (","). Do not include parentheses or brackets. Each value must be a valid instance of type.
boolean	A logical true or false value. May be passed to API requests as the strings "true" or "false" or "1" and "0". In JSON output, symbolic constants are used.
Enum: values	A predefined list of string values, for example "oz", "lb", "g", and "kg" Assigning any value not in the list results in an error.
integer	A whole number value.
number <type>	A number with or without a decimal point. Represented in output as a string, to avoid precision errors. Values must be a valid instance of type.
Nullable	Accepts null as a value.
string	Any string.
string <type>	A string representing something other than text. For example, if type is binary, the string represents an image or if type is ISO 3166-1 alpha-2 the string is a country code.
Standard Parameters#
Here is a list of standard parameters that are accepted by many or all API methods:

Parameter	Type	Meaning
x-api-key	string	Your Etsy App API Key keystring and shared secret, separated by a colon (:), which you can find in Your Apps. Required for all endpoint requests. Should be passed as a header
limit	integer	Specifies the maximum number of records to return for a request that returns multiple results. The default value is 25.
offset	integer	Skips the first N records before returning results. Combine with limit for pagination. The default value is 0.
Pagination#
The minimum and default records returned per call is 25, and the maximum number that can be returned is 100. We provide limit and offset parameters to allow navigation through larger data sets. Responses include a count field, which specifies the total number of records available via pagination. For performance reasons, the offset parameter is limited to a maximum value of 12000.

The count property in the response body will provide the total number of records without the limit applied. Here's an example of sequential requests to paginate through the most recent 300 listings, 50 at a time:

https://api.etsy.com/v3/application/listings?state=active&limit=50&offset=0
https://api.etsy.com/v3/application/listings?state=active&limit=50&offset=50
https://api.etsy.com/v3/application/listings?state=active&limit=50&offset=100
https://api.etsy.com/v3/application/listings?state=active&limit=50&offset=150
https://api.etsy.com/v3/application/listings?state=active&limit=50&offset=200
https://api.etsy.com/v3/application/listings?state=active&limit=50&offset=250
