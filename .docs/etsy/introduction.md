Etsy Open API v3
Welcome to the improved Etsy Open API v3, a REST API that extends support for inventory, sales orders, and shop management on the Etsy platform. These guides support current and future app developers as they build tools to integrate with and automate processes for Etsy shops and customers.

Getting started#
Our updated documentation is divided into a few sections, geared towards different use cases.

Quick Start Guide
API reference
API essentials
Tutorials
MCP Server
Build with AI#
The OpenAPI Dev MCP server connects AI coding assistants directly to the Etsy Open API, providing access to endpoint details, request and response schemas, authentication requirements, and OAuth scopes. Ask your assistant questions like "How do I create a listing?" or "What fields are in a ShopReceipt?" and get accurate, current answers backed by the live API spec.

Compatible with Claude, Cursor, VS Code, and other MCP-compatible tools. No API key is required to use the MCP server.

Developing a New Open API App#
To develop a new application using Etsy's Open API v3, register your app with Etsy. Registration generates an Etsy App API Key keystring and a shared secret, which you can find in Your Apps and allows you to use v3 Open API endpoints. Registered apps begin with personal access to our production systems. An application that has not made a succesful request to Etsy's OpenAPI service in 6 months will be marked as dormant and banned.

Personal Access#
By default, all new applications support personal access, which is authenticated read/write access to a shop granted by the owner and controlled by Oauth token scopes. This supports designing access controls for different application users into the app, such as reading data on receipts and billing or creating, editing, and deleting your shop's listings. Personal access is permitted to connect with up to 5 shops.

Commercial Access#
General-purpose applications that can assist any seller manage their shop, not just your shop, require commercial access. To request commercial access, click the "Request Commercial Access" link next to your app in Apps You've Made.

important
If you're only accessing data from your own shop, you do not need commercial access. To implement Oauth authentication to protect access to your shop, see Authentication.

Etsy reviews requests for commercial access against the following criteria:

Applications and their home pages must comply with our API Terms of Use.
Applications must follow the caching policies identified in Section 1 of the API Terms of Use.
Applications must clearly distinguish themselves from Etsy, as noted in Section 6 of the API Terms of Use. Particularly, the following phrase must appear in a prominent position in your application: "The term 'Etsy' is a trademark of Etsy, Inc. This application uses the Etsy API but is not endorsed or certified by Etsy, Inc."
Applications must not sidestep the API to retrieve or post Etsy data. Screen-scraping is not allowed.
Applications that access private member data must use OAuth authentication to do so.
Application names and artwork, including icons and home pages, must follow our Trademark Policy.
Applications with commercial access that use the transaction_r permission scope must request access to the buyer_email field separately. Etsy approves these requests on a case by case basis.