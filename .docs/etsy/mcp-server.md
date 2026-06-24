Dev MCP Server
Use the Etsy Dev MCP server to teach your AI assistant how to use the Etsy Open API. Instead of manually searching documentation and reading API specs, ask your assistant questions like:

"What can I build with the Etsy API?"
"What parameters does the findAllListingsActive endpoint accept?"
"Show me the ShopReceipt data model"
The MCP server provides your assistant with up-to-date endpoint details, request/response schemas, authentication requirements, and OAuth scopes - all derived directly from the Etsy OpenAPI specification.

Configuration#
The MCP server URL is:

https://mcp.api.etsycloud.com/mcp
Most MCP-compatible tools (Cursor, VS Code, Windsurf, etc.) use the same JSON configuration format. Add this to your tool's MCP config:

{
  "mcpServers": {
    "etsy": {
      "type": "http",
      "url": "mcp.api.etsycloud.com"
    }
  }
}
Available tools#
The MCP server provides five tools that your AI assistant can call:

Tool	Purpose
learn_etsy_api	Get an overview of the API including authentication, rate limits, endpoint groups, and a guide on how to use the other tools. Your assistant typically calls this first.
search_etsy_api	Search for endpoints or schemas by keyword. Use this to find relevant operations (e.g., search for "shipping" to find shipping profile endpoints).
list_endpoints	Browse all endpoints, optionally filtered by tag (e.g., ShopListing), HTTP method (e.g., GET), or endpoint group (e.g., Listing Management).
get_endpoint	Get full details for a specific endpoint by its operationId - parameters, request body, response schema, required OAuth scopes, and more.
get_schema	Inspect a data model by name (e.g., ShopListing, Money). Shows properties, types, nested schemas, and which endpoints reference it.
list_guides	Browse all available guides covering topics like authentication, rate limits, webhooks, and common integration patterns.
get_guide	Retrieve the full content of a specific guide by name. Use this to get step-by-step instructions and detailed explanations for a topic.
What's covered#
The server covers the full Etsy Open API v3 spec - 90+ endpoints and 50+ data models across listings, shops, orders, payments, shipping, reviews, and users.

It does not call the Etsy API directly - it provides the spec knowledge your assistant needs to help you build integrations.

Example prompts#
Here are some things you can ask your AI assistant once the MCP server is connected:

Learning the API:

"What APIs does Etsy offer?"

Exploring endpoints:

"Find all endpoints related to shipping profiles"

"Show me all DELETE endpoints"

"What endpoints are in the Shop Management group?"

Getting endpoint details:

"What parameters does createDraftListing accept?"

"Show me the details for the getShopReceipts endpoint"

Understanding data models:

"What does the ShopListing schema look like?"

"What fields are in a ShopReceipt?"

Building integrations:

"Build me a web app that searches Etsy listings by keyword and displays results with images, titles, and prices"

"How do I update inventory levels for a listing?"

Browsing guides:

"What guides are available for the Etsy API?"

"Show me all guides related to authentication"

Reading a guide:

"Show me the guide on OAuth 2.0 authentication"

"Give me the webhooks guide"

