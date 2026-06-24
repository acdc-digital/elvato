# Using eBay RESTful APIs

**Guide Group:** Using eBay RESTful APIs

---

## Overview

This guide explains the high-level REST call and response mechanics. It also provides other information that you'll need as you write applications with the eBay APIs (including how to generate OAuth tokens and how to parse error messages).  
  

[What is REST?](#rest)  
[Benefits of using REST](#benefits)

##### What is REST?

REST stands for _Representational State Transfer_. Pragmatically, it means that you or your program communicates with a remotely-run service using standard web commands and protocols such as HTTP requests and responses. You send the service an API command wrapped in an HTTP request, and it responds with a success or failure indicator and any results data, all wrapped in an HTTP response.

This means the REST API itself is stateless. State is maintained on either the client side or the service side, but not within the API. Thus the full name; Representational State Transfer. REST APIs transfer state from client to server or vice versa.

##### Benefits of using REST

A key benefit of REST is that HTTP is widely used. Plus, sending and receiving HTTP requests and responses doesn't take much bandwidth.

In addition, the syntax and protocols used by REST (JSON and the URI addressing protocol) are well known and baked into how you already use the web. The underlying system has already been built and installed, and it's available for anyone to use. This minimizes the amount of work users and developers have to do to get their applications up and running. In theory, all RESTful APIs have the same, easy to learn, interface format.

REST architecture emphasizes that interactions between clients and services are enhanced by having a limited number of operations with which it acts. Specifically, there are four common HTTP _methods_ that give you full "CRUD" capabilities: Create, Retrieve, Update, and Delete. Each of the main HTTP methods (GET, POST, PUT, and DELETE) has a specific meaning in the REST architecture, and in this way REST avoids ambiguity. You can think of the HTTP methods as the _verbs_ in a rest operation.

For flexibility, we assign _resources_ their own unique Universal Resource Identifiers (URIs). Resources are the nouns in a REST operations, and often consist of either a single entity, or a group of like entities.

The topics in this guide cover the following information:

*   **Making a call** — How to make calls to the eBay APIs in 3 steps.
*   **Request Components** — What makes up a REST request, and how you put one together.
*   **Response Components** — What makes up a REST response, and how you parse and interpret it.
*   **Handling Error Messages** — This topic describes eBay's common format for how HTTP responses return error and warning messages.
*   **Using API Explorer to run sample calls** — API Explorer is a tool that lets you run sample calls for all the methods in the eBay APIs.
*   **Versioning and API lifecycle**— Each API travels through the API lifecycle, where it goes through the different stages of release, updates, and eventually deprecation.
*   **Support for application development** — Where and how to get help if you have problems developing your application.

## Making a call

To make your first eBay REST API call, follow the steps below:

*   Step 1: If you don’t have an eBay Developers Program account, follow the steps on [Join the eBay Developers Program](/api-docs/static/gs_join-the-ebay-developers-program.html). If you do have an account, skip to Step 2.

*   Step 2: Get an access token and create a keyset

*   Create a Sandbox or Production keyset by following the instructions in the [Create the eBay API keysets](/api-docs/static/gs_create-the-ebay-api-keysets.html) topic.
*   Generate an OAuth application token for your application by following the instructions in the [The client credentials grant flow](/api-docs/static/oauth-client-credentials-grant.html) topic.

*   Step 3: Use the [API Explorer tool](https://developer.ebay.com/my/api_test_tool) to make a [getItemConditionPolicies](https://developer.ebay.com/my/api_test_tool?index=0&env=production&api=metadata&call=marketplace-marketplace_id_get_item_condition_policies__GET&variation=json) call. Use the application token you just created in Step 3. See [Use the API Explorer to try out APIs](/api-docs/static/gs_use-the-api-explorer-to-try.html) for more information.

## Request components

The three main request components are itemized below, and covered in subsequent sub-sections:  
  
[HTTP request headers](#headers)  
[REST API endpoints](#operation)  
[Request payload](#body)

##### HTTP request headers

Every eBay REST API method requires at least one HTTP request header, and some methods require several headers. These headers can include both standard HTTP headers and eBay custom headers. All eBay custom headers start with "`X-EBAY-C-`".

Some eBay custom headers are _packed headers_, meaning they can contain multiple name/value pairs. The format for a name/value pair is `<name>=<value>`, and you must separate multiple values in a single header by commas. The following example shows the general format:

  X-EBAY-C-PACKED-EXAMPLE: fig=7,bar="quux",value=42

The table below presents the standard request headers that eBay accepts, as well as the custom eBay headers that you can use.

**Note:** All headers should be treated as case-insensitive and must follow RFC standards.

  

HTTP headers for eBay REST requests

HTTP Header

Required

Description

`Authorization`

Required

`Authorization` specifies the OAuth token and token type used to authorize the request.

You must supply this request header in each request you make to the eBay REST interfaces. For details, see [OAuth access tokens](/api-docs/static/oauth-tokens.html).

**Example:**  
  `Authorization: Bearer <accessToken>`

`Accept`

Conditionally required

`Accept` indicates the formats the client accepts for the response.

This header pairs with the `Content-Type` header, which specifies the format required by eBay for the request body. Currently, most eBay REST interfaces require request bodies to be formatted in JSON. See **Content-Type** Header for details and other supported headers.

JSON is the default and only format returned in response bodies.

**Example:**  
  `Accept: application/json`

`Accept-Charset`

Optional

`Accept-Charset` indicates the character sets the client accepts for the response.

If the server cannot respond using the value specified in `Accept-Charset`, the server usually ignores the value and without an error responds in `utf-8`.

**Example:**  
  `Accept-Charset: utf-8`

`Accept-Encoding`

Optional –  
Conditionally recommended

`Accept-Encoding` indicates the compression-encoding algorithms the client accepts for the response.

We strongly recommend you include this header in all requests that can potentially return large response payloads. Compression encoding can increase performance by dramatically reducing response-payload size.

Currently, `gzip` is the only supported compression format.

**Example:**  
  `Accept-Encoding: gzip`

`Accept-Language`

Conditionally required

`Accept-Language` indicates the natural language and locale preferred by the client for the response.

While recommended for all requests, you must supply this header when you are targeting the specific locale of a marketplace that supports multiple locales. For example:

*   Use `fr-BE` when targeting the Française locale of the Belgium marketplace.
*   Use `fr-CA` when targeting the Française locale of the Canadian marketplace.

For the language values and locales supported by the different eBay marketplaces, see [Marketplace ID values](#marketpl).

**Example:**  
  `Accept-Language: fr-CA`

`Content-Type`

Conditionally required

`Content-Type` indicates the format of the request body provided by the client.

This header pairs with the `Accept` header, which indicates the formats the client accepts for the response. Currently, all Accept headers are formatted in JSON. See **Accept** Header for details.

This header is usually required for all `POST` and `PUT` operations. If omitted in the request, this header defaults to **application/json**. Supported values include:  
  `Content-Type: application/json`  
  `Content-Type: multipart/form-data`  
  `Content-Type: application/octet-stream`

`Content-Language`

Conditionally required

This header sets the natural language that will be used in request payload fields that support user-defined text. Supported values for this header include `en-US` for English or `de-DE` for German.

While recommended for all requests, you must supply this header when you are targeting the specific locale of a marketplace that supports multiple locales. For example:

*   Use `fr-BE` when targeting the Française locale of the Belgium marketplace.
*   Use `fr-CA` when targeting the Française locale of the Canadian marketplace.

For the language values and locales supported by the different eBay marketplaces, see [Marketplace ID values](#marketpl).

In addition to this set of common HTTP headers, some methods or APIs make use of additional headers. Check the documentation of the method for details on any additional headers that might be required to make a request to the interface.

###### Marketplace ID values

The following table lists supported Marketplace IDs, their associated countries/regions, the URLs to the marketplaces, and the locales supported by each marketplace:

Marketplace IDs

Country/Region

Marketplace Site

Locale Support

`EBAY_US`

United States

[https://www.ebay.com](https://www.ebay.com)  
(For items in the US motor vehicles or the P&A categories, use [EBAY\_MOTORS\_US](#EBAY_MOTORS_US).)

`en-US`

`EBAY_AT`

Austria

[https://www.ebay.at](https://www.ebay.at)

`de-AT`

`EBAY_AU`

Australia

[https://www.ebay.com.au](https://www.ebay.com.au)

`en-AU`

`EBAY_BE`

Belgium

[https://www.benl.ebay.be/](https://www.benl.ebay.be/) (Nederlandse)  
[https://www.befr.ebay.be/](https://www.befr.ebay.be/) (Française)

`nl-BE, fr-BE`

`EBAY_CA`

Canada

[https://www.ebay.ca](https://www.ebay.ca) (English)  
[https://www.cafr.ebay.ca/](https://www.cafr.ebay.ca/) (Française)

`en-CA, fr-CA`

`EBAY_CH`

Switzerland

[https://www.ebay.ch](https://www.ebay.ch)

`de-CH`

`EBAY_DE`

Germany

[https://www.ebay.de](https://www.ebay.de)

`de-DE`

`EBAY_ES`

Spain

[https://www.ebay.es](https://www.ebay.es)

`es-ES`

`EBAY_FR`

France

[https://www.ebay.fr](https://www.ebay.fr)

`fr-FR`

`EBAY_GB`

Great Britain

[https://www.ebay.co.uk](https://www.ebay.co.uk)

`en-GB`

`EBAY_HK`

Hong Kong

[https://www.ebay.com.hk](https://www.ebay.com.hk)

`zh-HK`

`EBAY_IE`

Ireland

[https://www.ebay.ie](https://www.ebay.ie)

`en-IE`

`EBAY_IT`

Italy

[https://www.ebay.it](https://www.ebay.it)

`it-IT`

`EBAY_MY`

Malaysia

[https://www.ebay.com.my](https://www.ebay.com.my)

`en-US`

`EBAY_NL`

Netherlands

[https://www.ebay.nl](https://www.ebay.nl)

`nl-NL`

`EBAY_PH`

Philippines

[https://www.ebay.ph](https://www.ebay.ph)

`en-PH`

`EBAY_PL`

Poland

[https://www.ebay.pl](https://www.ebay.pl)

`pl-PL`

`EBAY_SG`

Singapore

[https://www.ebay.com.sg](https://www.ebay.com.sg)

`en_US`

`EBAY_TW`

Taiwan

[https://www.ebay.com.tw](https://www.ebay.com.tw)

`zh-TW`

`EBAY_MOTORS_US`

United States

[https://www.ebay.com/motors](https://www.ebay.com/motors)  
(Resolves to the parent "Auto Parts and Vehicles" category on the EBAY\_US site.)

`en-US`

##### REST API endpoints

You make a RESTful request by addressing a _REST operation_, which is made up of an **HTTP method** and an associated **Uniform Resource Identifier (URI)**.

###### HTTP methods

All available HTTP methods are defined by the W3C in [RFC 9110, Section 9.3](https://www.rfc-editor.org/rfc/rfc9110.html#name-method-definitions). The following table shows the HTTP methods that eBay REST APIs support:

HTTP methods

HTTP Method

Description

`POST`

POST methods request that the server accept the entity enclosed in the request as a new subordinate of the web resource identified by the URI. As examples, the POSTed data could be an annotation for existing resources; a message for a bulletin board, newsgroup, mailing list, or comment thread; a block of data that is the result of submitting a web form to a data-handling process; or an item to add to a database.

`PUT`

PUT methods request that the enclosed entity (passed in the body of the request) be stored under the supplied URI. If the URI refers to an already existing resource, the resource is modified. If the URI does not point to an existing resource, then the server can create the resource with that URI.

`GET`

GET methods request a representation of the specified resource. For example, a method that retrieves an address resource gets a _representation_ of a specific address resource (or set of address resources). Requests using GET should only retrieve data, they should have no other effect or side-effect.

`DELETE`

DELETE methods remove the specified resource(s).

###### REST operation URIs

The URI part of a REST operation points to the _resource_ upon which the operation acts. As an example, the following is a URI that is used in a **Fulfillment API** `GET` operation to retrieve the contents of an order based on its unique identifier, _orderId_:

`https://api.ebay.com/sell/fulfillment/v1/order/{orderId}?fieldGroups=_string_`

This URI is created by combining several separate pieces of information:

The components of an eBay REST URI

URI Property

Description

`https://api.ebay.com`

The domain where the API resides (the API location).  
eBay supports different API _environments_, such as the production environment and the Sandbox environment. See [eBay API environments](#environments) for details on how to address the supported eBay API environments.

`/sell`

The API context (such as Buy, Sell, Commerce, or Developer).

`/fulfillment`

The API name.

`/v1`

The _major_ version of the API.

`/order`

The resource upon which the operation acts. Some methods may act upon a specific instance of a resource, and other methods may act upon/retrieve multiple instances of the resource. Unless the URI addresses a specific resource, the operation addresses a _resource collection_ (a resource collection is a set of like resources).

`/{orderId}`

Known as a _path parameter_, these are most often used to specify a specific instance of a resource.

`?fieldGroups=_string_`

Some operations support one or more _query parameters_, which provide for more control over what is addressed by the operation.

###### URI parameters

As shown above, REST operations can include _parameters_ in their URIs. Specifically, they can have both path parameters and query parameters:

*   **Path parameters** are variables that are part of the "path" segment of an operation. Because these variables are part of the operation's path, they are always required.
*   Separate multiple query parameters with an ampersand ("&"). **Query parameters** can be optional, conditionally required, or mandatory depending on the design of the REST method..

###### URL encoding query parameter values

While some path parameters do not require you to include a value for the parameter to take effect, some path parameters do required you to include a value with the parameter. Consider a **sort** query parameter, which normally requires you to specify a field on which to sort the result.

Whenever path parameters require added values, you must _URL encode_ the values you add. URL encoding is sometimes referred to as "_percent-encoding_."

Consider the following example:

/buy/browse/v1/item\_summary/search?q=shirt&category\_ids=15724&aspect\_filter=categoryId:15724,Color:{Red}

The above URI includes three query parameters, **q**, **category\_ids**, and **aspect\_filter**. While the first two parameters are straight-forward, the third (**aspect\_filter**) is a bit more complex, it specifies two separate values. Still, each of the values supplied to these query parameters must be URL encoded as the following table shows:

URL Encoding Query Parameter Values

Path Parameter Value

URL Encoded Value

`shirt`

`shirt`

`15724`

`15724`

`categoryId:15724,Color:{Red}`

`categoryId%3A15724%2CColor%3A%7BRed%7D`

As you can see, the URL encoding for the first two values does not alter their string values. However, the third value contains some characters that, when encoded, get rendered with a special encoding. With this example, the full URL encoded URI to the operation is as follows:

/buy/browse/v1/item\_summary/search?q=shirt&category\_ids=15724&aspect\_filter=categoryId%3A15724%2CColor%3A%7BRed%7D

For more on URL encoding, see [Percent-encoding](https://en.wikipedia.org/wiki/Percent-encoding).

###### eBay API sandbox environment

Most eBay REST APIs support a sandbox environment where applications can be tested with various APIs before moving to the production environment. The reference documentation for each method within a REST API will contain the Production URI and the Sandbox URI. Generally, the base URI paths are very similar. So if the base Production URI is [https://api.ebay.com](https://api.ebay.com), the Sandbox URI will be [https://api.sandbox.ebay.com](https://api.sandbox.ebay.com).

For details on how to test using the sandbox, see [Create a test sandbox user](/api-docs/static/gs_create-a-test-sandbox-user.html).

##### Request payload

A request body, often called a "payload," is provided with a request whenever you what to create or update a resource. In the eBay REST APIs, most request payloads and all response payloads are formatted in JSON. The API Reference documentation describes the fields supported in the body of each method.

The following sample request payload is for a `POST https://api.ebay.com/sell/marketing/v1/item_promotion` request, a method that creates an item discount:

{
    "marketplaceId": "EBAY\_US",
    "inventoryCriterion": {
        "listingIds": \[
            "142250172493",
            "132073034350"
        \],
        "inventoryCriterionType": "INVENTORY\_BY\_VALUE"
    },
    "endDate": "2027-03-01T20:00:00.000Z",
    "discountRules": \[
        {
            "discountSpecification": {
                "numberOfDiscountedItems": 1,
                "forEachQuantity": 1
            },
            "ruleOrder": 0,
            "discountBenefit": {
                "percentageOffItem": "5"
            }
        }
    \],
    "name": "Buy 1 and get 2nd one 5% off -part 2",
    "description": "Buy 1 and get 2nd one 5% off -part 2",
    "startDate": "2025-02-11T19:58:18.918Z",
    "promotionStatus": "DRAFT"
}

## Response components

The three main response components are itemized below, and covered in subsequent sub-sections:  
  
[HTTP status codes](#status)  
[Response payload](#payload)  
[HTTP response headers](#responseheaders)

##### HTTP status codes

Each response from a request to an eBay REST operation contains an _HTTP status code_ that relays the status of your request. HTTP status codes are defined by W3C _RFC 2616, section 10_. The high-level codes are defined as follows:

HTTP status code

High-level HTTP Status Code

Description

`1_xx_`

**Informational**—Codes returned in the 100 range denote the response contains informational data, such as a switching protocol message.

`2_xx_`

**Success**—Codes returned in 200 range indicate the request was successfully received, understood, and accepted. While a code of `200` indicates **OK**, other 200 codes can indicate other types of success.

`200`

**OK**—The request succeeded. The information returned with the response is dependent on the method used in the request.

`201`

**Created**—The request was fulfilled and a new resource was created. The newly created resource can be referenced by the URI(s) returned _Location_ header field.

`202`

**Accepted**—The request has been accepted for processing, but the processing has not been completed.

`204`

**No Content**—The server fulfilled the request, but does not need to return an entity-body (payload).

`3_xx_`

**Redirection**—Codes returned in the 300 range indicate your request was redirected.

`4_xx_`

**Client Error**—Codes returned in the 400 range denotes that some sort of client error was encountered. Please check the error code for more information on the type of error encountered.

`400`

**Bad Request—**The request could not be understood by the server due to a syntax error.

`401`

**Unauthorized—**The request requires user authentication that was not provided, or user authentication was provided and has been rejected.

`404`

**Not Found—**The server could not find anything matching the request URI. 

`5_xx_`

**Server Error**—Codes returned in the 500 range denote an error occurred on the server side. Refer to the specific error for details.

##### Response payload

Like the request payloads, all successful responses from a call to an eBay REST operation contain payloads formatted in JSON (where applicable).

The following code example shows a response payload from a call to `GET https://api.sandbox.ebay.com/buy/v1/deals`, which contains a list of the current eBay Deals items for a specified category:

{
  "deals": \[
    {
      "groupId": "v1|1\*\*\*\*\*\*\*\*\*\*\*|0",
      "title": {
        "content": "Apple iPhone 4S - 32GB - White Smartphone-14485"
      },
      "imageLink": "http://i.ebayimg.ebay.com/0\*\*\*\*\*/$\_35.JPG",
      "minPrice": {
        "value": 300,
        "currency": "USD"
      },
      "maxPrice": {
        "value": 300,
        "currency": "USD"
      },
      "categoryIdentifier": "Cell Phones & Smartphones",
      "quantitySold": 12,
      "discount": true,
      "originalPrice": {
        "value": 401,
        "currency": "USD"
      },
      "quantityLimitPerBuyer": 5,
      "priceDisplayCondition": "ALWAYS\_SHOW",
      "itemGroup": "/buy/v1/item\_group/v1|1\*\*\*\*\*\*\*\*\*\*\*|0",
      "dealEndtime": {
        "value": "2024-11-27T14:59:00.000Z",
        "formattedValue": "2024-11-27T14:59:00.000Z"
      }
    },
    {
      "groupId": "v1|1\*\*\*\*\*\*\*\*\*\*\*|0",
      "title": {
        "content": "Packing and Shipping boxes - 19273-1445985364525"
      },
      ...
      }
    }
  \]
}

##### HTTP response headers

The response from each call to an eBay REST operation contains a set of _HTTP headers_. The headers returned by each operation are unique to the specific operation, although most operations do return the HTTP headers described in the following table.

**Note:** All headers should be treated as case-insensitive and must follow RFC standards.

Common HTTP response headers

HTTP response header

Description

`Content-type`

Describes character set and/or MIME type of the response, which should be the same as the values specified in the `Accept-Charset and Accept-Encoding` request headers, respectively.

If the server cannot return the result specified in either of those request headers, the server usually ignores those values and returns the result in the value(s) specified by `Content-Type`, without returning an error code.

Note that there can be multiple Content-Type response headers, with one identifying the character set and another the MIME encoding.

**Examples:**

`Content-Type: application/json; charset=utf-8`

`Content-Type: application/jsonl`

`Content-Type: charset=utf-8`

`Content-Language`

Describes the natural language of the response. This should be the language specified in the `Accept-Language` request header. However, if the server cannot return the result in the value specified by `Accept-Language`, the server usually ignores Accept-Language, and returns a value that is either a language code or a language code with a country option (for example, `en-US` for United States English as opposed to British English). See [Marketplace ID and language header values](/api-docs/static/rest-request-components.html#marketpl) for the values supported by eBay.

Example: `Accept-Language: en-US`

`Location`

When creating a new resource with a `POST` call, eBay does not return a response with a payload. Instead, the response contains a `Location` header that contains a URI to the newly-created resource. Parse the URI to get the ID of the resource, or you can use the URI in a `GET` request to retrieve the ID of the resource.

`Warning`

Carries additional information about the status or transformation of a message that might not be reflected in the status code.

Refer to the documentation on each REST operation for the specifics of the HTTP headers that can be returned by that call.

**Note:** The eBay calls return multiple response headers. When contacting DTS for support, please be sure to track the response headers from the calls for which you have questions; they help the support staff determine the specifics of call(s) you are referencing.

## Handling errors

If your request encounters problems during processing, the eBay servers can respond with either an error or warning condition. While processing might continue if a warning is encountered, the processing stops when errors are encountered.

[API error and warning responses](#api)  
[Common errors](#common)

##### API error and warning responses

There are three different types of response components that you can receive after you send a request. Depending on what happens during the request processing, you can receive either errors or warnings, as follows:

*   There is a `warnings` component and no `errors` component. This happens when no error occurred during processing, but one or more warnings occurred.
*   There is an `errors` component and no `warnings` component. This happens when one or more errors occurred during processing. While warnings may also have occurred during processing, they are not included in any response with an error component.
*   There is neither an `errors` or `warnings` component. This happens when no warnings and no errors occurred during processing.

Returned error and warning objects are the same type (`ErrorData`) and have the same fields.

The following sections show typical responses for each of the three possibilities. The table in the Error and warning field values section below lists all fields that could be included in a response when either errors or warnings occurred during request processing.

###### A warning response

The following example shows a `warnings` response component with no `errors` component:

 {
    "warnings": \[
      {
        "errorId": long,
        "domain": "string",
        "subDomain": "string",
        "category": "ErrorCategory",
        "message": "string", 
        "longMessage": "string",
        "inputRefIds": \["string"\],
        "outputRefIds": \["string"\],
        "parameters": \[ErrorParameter\]
      }
    \],
    "resource": "Hello, eBay followers!"
  }

Note that because warnings do not stop processing, the HTTP status code returns as `200`.

###### An error response

Here is an `errors` response component with no `warnings` component:

  {
    "errors": \[
      {
        "errorId": long,
        "domain": "string",
        "subDomain": "string",
        "category": "ErrorCategory",
        "message": "string", 
        "longMessage": "string",
        "inputRefIds": \["string"\],
        "outputRefIds": \["string"\],
        "parameters": \[ErrorParameter\]
      }
    \]
  }

###### A response without errors or warnings

And finally, here's a response without either an `errors` or `warnings` component:

  HTTP/1.1 200 OK

  {
    "resource": "Hello, eBay follower!!"
  }

###### Error and warning response field values

The following table describes the fields that can be returned in an `errors` or `warnings` container:

API error and warning fields

Field

Type

Description

errorData

object

The `errors` or `warnings` object type.

errorData.**category**

ErrorCategory

The category type for this error or warning. It takes an `ErrorCategory` object which can have one of three values:

*   `APPLICATION`: Indicates an exception or error occurred in the application code or at runtime. Examples include catching an exception in a service's business logic, system failures, or request errors from a dependency.
*   `BUSINESS`: Used when your service or a dependent service refused to continue processing on the resource because of a business rule violation such as "Seller does not ship item to Antarctica" or "Buyer ineligible to purchase an alcoholic item". Business errors are not syntactical input errors.
*   `REQUEST`: Used when there is anything wrong with the request, such as; authentication, syntactical errors, rate limiting or missing headers, bad HTTP header values, and so on.

errorData.**domain**

string

Name of the domain containing the service or application.

errorData.**errorId**

number  
(long)

A positive integer that uniquely identifies the specific error condition that occurred. Your application can use error codes as identifiers in your customized error-handling algorithms.

errorData.**inputRefIds**

string

Identifies specific request elements associated with the error, if any. `inputRefId`'s response is format specific. For JSON, use _JSONPath_ notation.

errorData.**longMessage**

string

An expanded version of `message` that should be around 100-200 characters long, but is not required to be such.

errorData.**message**

string

An end user and app developer friendly device agnostic message. It explains what the error or warning is, and how to fix it (in a general sense). Its value is at most 50 characters long. If applicable, the value is localized in the end user's requested locale.

errorData.**outputRefIds**

string

Identifies specific response elements associated with the error, if any. Path format is the same as `inputRefId`.

errorData.**parameters**

ErrorParameter

This optional complex field type contains a list of one or more context-specific `ErrorParameter` objects, with each item in the list entry being a parameter (or input field name) that caused an error condition. Each `ErrorPrameter` objects consist of two fields, a `name` and a `value`.

errorData.parameters.**name**

string

This is the name of the parameter/field for which the error was thrown.

errorData.parameters.**value**

string

This is the value of the parameter/field for which the error was thrown.

errorData.**subDomain**

string

Name of the domain’s subsystem or subdivision. For example, `checkout` is a subdomain in the `buying` domain.

###### An example error response

The following error shows a sample response if there is a problem with one of the parameters passed into the call:

 {
  "errors": \[
    {
      "errorId": 15008,
      "domain": "API\_ORDER",
      "category": "REQUEST",
      "message": "Invalid Field : itemId.",
      "inputRefIds": \[
        "$.lineItemInputs\[0\].itemId"
      \],
      "parameters": \[
        {
          "name": "itemId",
          "value": "v1|2\*\*\*\*\*\*\*\*\*|0"
        }
      \]
    }
  \]
}

##### Common errors

When you make a call to an eBay API, you can get a response that contains errors or warnings as described above. However, each API can also return _common errors_, which are error conditions that can occur while processing a call to any API. Common errors stop processing and they must be addressed before you can get a successful response from your call.

The common errors use the same error response structure that the individual interfaces use:

  {
    "errors": \[
      {
        "errorId": long,
        "domain": "string",
        "subDomain": "string",
        "category": "ErrorCategory",
        "message": "string", 
        "longMessage": "string",
        "inputRefIds": \["string"\],
        "outputRefIds": \["string"\],
        "parameters": \[ErrorParameter\]
      }
    \]
  }

Below is a list of the most frequently encountered common errors:

Common error messages

Error ID

Error Category

Message

Long Message

Domain

HTTP Status Code

1001

REQUEST

Invalid access token

Invalid access token. Check the value of the Authorization HTTP request header.

OAuth

401

1002

REQUEST

Missing access token

Access token is missing in the Authorization HTTP request header.

OAuth

400

1003

REQUEST

"Token type in the Authorization header is invalid:" + scheme

"Token type in the Authorization header is invalid:" plus scheme

OAuth

400

1004

REQUEST

Internal error

Error process the access token.

OAuth

500

1100

REQUEST

Access denied

Insufficient permissions to fulfill the request.

OAuth

403

2001

REQUEST

Too many requests

The request limit has been reached for the resource.

ACCESS

429

2002

REQUEST

Resource not resolved

A resource (URI) associated with the request could not be resolved.

ACCESS

404

2003

APPLICATION

Internal error

There was a problem with an eBay internal system or process. Contact eBay developer support for assistance.

ACCESS

500

2004

REQUEST

Invalid request

Request has errors. For help, see the documentation for this API.

ACCESS

400

3001

REQUEST

Request rejected

ROUTING

400

3002

REQUEST

Malformed request

The request has errors. For help, see the documentation for this API.

ROUTING

400

3003

REQUEST

Resource not found

A resource (URI) associated with the request could not be resolved.

ROUTING

404

3004

APPLICATION

Internal error

ROUTING

500

3005

APPLICATION

Internal error

ROUTING

502

  

For details on HTTP status codes, see HTTP status codes.

## Versioning and the API lifecycle

Each API travels through the _API lifecycle_, where it goes through the different stages of release, updates, and eventually deprecation.

[API versioning](#versioning)  
[API launch stages](#stages)  
[Limited Release APIs](#Limited)  
[Experimental APIs](#experimental)  
[eBay deprecation policy](#deprecation)

##### API versioning

The eBay RESTful APIs have three part version numbers, where each part is separated by periods ("."). For example, version 1.0.0 designates the first release of an API, and later releases of the API will update one or more of the version-number parts. Despite the similarity to decimal points, any or all three of the version-number parts can be greater than 9. For example, 1.12.47 is a valid version number.

The three version-number parts are defined as the major.minor.maintenance versions of a release, where each version-number part represents a different type of change in the API. With this, you can interpret an API at Version 1.3.7 as being at major version 1, minor version 3, and maintenance version 7.

To illustrate how you should handle new versions of an API, the following list outlines a series of updates that start with Version 1.3.7:

*   **Version 1.3.8** increments the third version number. This is a _maintenance release_ of backwards-compatible bug fixes, or similar updates, that were applied to the previous version (Version 1.3.7).
    *   This change should have no effect on you other than noticing that the version has been updated. You do not need to make any changes to your code.
*   **Version 1.4.0** increments the _minor release_ number. This represents new, backwards-compatible functionality applied to Version 1.3.8.
    *   The API now has additional response fields, new optional parameters, new commands, or something similar. You can continue using the API with your existing code, but you should update it to make use of the API's new feature(s).
*   **Version 2.0.0** is a _major release_. The major release number is incremented, and the other version numbers are zeroed out. Major version releases include _backwards-incompatible_ API changes from the previous release of the API.
    *   The API has deprecated a method, added a new required parameter, etc. You should update your code, including your API call URIs, so it works with the new version. However, you can continue to use the old version with no code changes, at least for a while (see below for eBay's version deprecation policies).
    *   Major version changes require a change in the URIs you use to make calls to that API. As discussed in [REST operation URIs](/api-docs/static/rest-request-components.html#uris), the URI in the operation includes the API's major version number.

##### API launch stages

eBay has three stages of release for APIs and developer products: _Alpha_, _Beta_, and _General Availability_ (GA). In addition to release stages, an API can also have _Experimental_ releases. Experimental is not a release phase in the same sense as Alpha, Beta, and GA; it does not represent a maturity model and can occur at any of the three release stages. This table summarizes the purpose and usage of each type of release:

Characteristic

Launch Stage

Alpha

Beta

General Availability (GA)

**Purpose and benefit**

Purpose is to test and develop API features and functionality requirements. Opportunity to preview and influence future eBay API features.

Purpose is to release API capabilities for feedback. Opportunity to get early access to new APIs before GA.

Purpose is to release API features for production use.

**Who can access**

Available to select eBay Developers Program Members with NDA.

Available to all eBay Developers Program Members, may be subject to eligibility criteria.

Available to all eBay Developers Program Members, may be subject to eligibility criteria.

**What support is provided**

Support is provided by account management support only, and may not have formal documentation

Standard technical support channel available, with draft documentation.

Standard technical support, with full documentation available.

**API design stability**

Changes to API likely from feedback in Alpha testing, and Beta may not be backward compatible with Alpha.

Changes to API possible during Beta period and GA may not be backward compatible with Beta.

Stable Interface Design

**Quality**

May have significant design and availability issues.

May have design and availability issues.

Production

**Intended use:**

Test environments or limited-use testing.

Limited production use but not for business critical use.

Production

**Usable for customer onboarding?**

No

Yes

Yes

**Usable for load testing?**

No

No

Yes

##### Limited Release APIs

Some eBay RESTful public APIs or specific API methods are not available to all developers. These capabilities are designated as _Limited Release_. eBay restricts access to these APIs and methods to developers/applications that provide the most value to eBay, eBay buyers and sellers, and the eBay developer community. Access to Limited Release APIs is contingent upon invitation from eBay and/or a rigorous business case review and signed contracts.

**Note:** Limited Release is not a release phase, such as Beta or GA, which implies API maturity. However, the release phases apply to Limited Release APIs. That is, a Limited Release API may be in any release phase, such as Experimental or GA.

As with all of the RESTful public APIs, access is controlled through scopes. Once an application has been approved to use a Limited Release API, the required scopes will be made available, allowing access tokens to be generated with the necessary permissions.

Refer to the documentation of the API to learn if or how you can get access.

##### Experimental APIs

The purpose of eBay’s _experimental_ APIs is testing and research. eBay uses experimental releases to test new business capabilities or features and analyze impact. Experimental APIs are not tied to release phases and eBay has no commitment to refine or deliver to full maturity (i.e., GA release). Experimental may apply to a complete API, an individual resource, or a method. An experimental resource or method can be added to (or removed from) an API at any of the three launch phases.

**Note:** Experimental does not imply low quality, lack of support, or poor performance. Experimental is not a release phase, such as Beta or GA, which implies API maturity. However, changes to an experimental API may not be backward compatible and can occur at any time. API or interfaces may be removed with little notice. Use at your own risk. Experimental APIs are suitable for limited production use, but not for business critical use.

Experimental API access could be subject to eligibility criteria. Refer to the API documentation for more information.

##### eBay deprecation policy

Although eBay strives to make updates to its APIs compatible with all previous versions, there are times when an API becomes outdated and eBay must deprecate the API in order to provide a better service to its customers. The API endpoints will continue to be available during the deprecation period. The deprecation details are documented on the [API deprecation status](/docs/api-deprecation) page.

## Support for application development

For support resources to help you through the development process, see [Get Support](/api-docs/static/gs_get-support.html).

  

[eBay feature information](#eBay3)  
[The eBay Community](#The)  
[Sign in with eBay](#sign-in-with-ebay)

##### eBay feature information

In addition to the resources that directly support your eBay application development, the following resources provide additional details:

*   [eBay Help pages](https://www.ebay.com/help/home) (US)
    
*   [eBay Seller Center](https://pages.ebay.com/seller-center/index.html) (US)
    
*   [eBay Policies index](https://www.ebay.com/help/policies/az-index/az-index-policies?id=4649)
    
*   [eBay Seller Updates](https://pages.ebay.com/seller-center/seller-updates/index.html)
    

##### The eBay Community

Lastly, the _eBay Community_ is an eBay-hosted location that allows users to meet and share information. Plug in to the eBay Community to stay on top of the latest eBay news, supplied for and by eBay users:

*   [The eBay Community](https://community.ebay.com/ "User-supported eBay community")

##### Sign in with eBay

Providing a Sign in with eBay option can create a great user experience. For more information, refer to the [Sign in with eBay integration guidelines](/develop/sign-in-with-ebay).

## Related Topics

- [More Guides](/develop/guides)

