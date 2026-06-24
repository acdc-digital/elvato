Request Standards
Etsy API endpoints are accessible at URLs starting with https://api.etsy.com/v3/ or https://openapi.etsy.com/v3/. The two hostnames are equivalent and you can use either. Throughout this document we use api.etsy.com but openapi.etsy.com may be substituted instead.

Making Requests#
Every request to a v3 endpoint must include:

Category	Element	Code	Description
endpoint	protocol	https://	Etsy Open API endpoints require SSL/TLS requests which must use an https:// prefix.
endpoint	URL	api.etsy.com/v3/	Etsy API endpoints are accessible at URLs starting with https://api.etsy.com/v3/.
header	API key	x-api-key: ...	Your Etsy App API Key keystring and shared secret, separated by a colon (:), which you can find in Your Apps.
header	oauth token	Authorization: Bearer ...	Any request that requires an oauth2 scope (e.g., listings_w) requires an authorization header. The value following Bearer combines a numeric user id with an oauth2 token, separted by a period (.). See Authentication for details.
For example, if your

client ID is exJeyZtXODeekHfX8VRgMQ
shared secret is a1b2c3d4e5
numeric user ID is 12345678
access token is VJTv9qyjwJbYlARxdFmEEQ
the following is a valid request:

curl --request GET 'https://api.etsy.com/v3/application/listings?state=active' \
--header 'x-api-key: exJeyZtXODeekHfX8VRgMQ:a1b2c3d4e5' \
--header 'authorization: Bearer 12345678.VJTv9qyjwJbYlARxdFmEEQ' \
Encoding#
All network communication with Open API v3 uses UTF-8 encoding. When creating HTTP requests for a REST API application, specify UTF-8 encoding support. For example, to set the UTF-8 encoding support in an HTTP header for a POST request, include charset=utf-8 in the content-type field, as shown in the following code:

POST /v3/application/shops/12345/listings HTTPS/1.3
Host: api.etsy.com
Content-Type: application/x-www-form-urlencoded; charset=utf-8
When creating application code for a REST API application, provide UTF-8 encoding support using the language-specific content type settings. For example, to set the content type to UTF-8 in a Java HttpURLConnection object called conn, use the following code:

conn.setRequestProperty("contentType", "application/json; charset=utf-8");
