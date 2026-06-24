Endpoint Migration (backwards compatible)#
We are introducing a new data structure for listing personalization, as well as a new suite of endpoints to manage this data. This new structure is designed to maintain backwards compatibility with the existing listing personalization data, which will be modeled as a single text input question.

tip
How to test: Use your normal process and be sure to follow these guidelines.

When to release: Since these changes are backwards compatible, you can release them to your users whenever you’ve finished development work. Keep in mind that POST requests will be enabled only for a single text question per listing during this period, writes of multiple and new question types will be allowed later in 2026. The legacy personalization fields will be deprecated on April 9th, 2026; your integration must be updated before then to avoid errors or missing data.

Required Changes#
If you read personalization data:#
Update your integration to use the new personalization data structure (details below).
Fetch listing personalization data via the new getListingPersonalization endpoint or by calling one of the following endpoints with personalization in the includes query param: getListingsByShop, getListing, or getListingsByListingIds.
The is_personalizable property will continue to be returned from the current listing endpoints.
If you write personalization data:#
Update your integration to use the new personalization POST and DELETE endpoints (updateListingPersonalization and deleteListingPersonalization). Expect requests to the new POST endpoint to fully replace existing personalization data.
Stop sending legacy personalization fields on listing create and update requests.
Migration Details#
The following sections detail the differences between the current and new behavior. You can consult the Examples for the Endpoint Migration period section to see detailed examples.

Reading listing personalization data#
Currently, listing personalization data is returned in the is_personalizable, personalization_is_required, personalization_char_count_max, and personalization_instructions fields from the following endpoints:

getListingsByShop - GET /v3/application/shops/{shop_id}/listings
getListing - GET /v3/application/listings/{listing_id}
getListingInventory - GET /v3/application/listings/{listing_id}/inventory using ?includes=Listing
getListingsByListingIds - GET /v3/application/listings/batch
findAllListingsActive - GET /v3/application/listings/active
findAllActiveListingsByShop - GET /v3/application/shops/{shop_id}/listings/active
getFeaturedListingsByShop - GET /v3/application/shops/{shop_id}/listings/featured
getListingsByShopSectionId - GET /v3/application/shops/{shop_id}/shop-sections/listings
getListingsByShopReceipt - GET /v3/application/shops/{shop_id}/receipts/{receipt_id}/listings
getListingsByShopReturnPolicy - GET /v3/application/shops/{shop_id}/policies/return/{return_policy_id}/listings
note
We will continue to return the is_personalizable property as part of the base listing data returned from these endpoints.

New: Through the dedicated personalization GET endpoint#
We are introducing a new getListingPersonalization endpoint (GET https://api.etsy.com/v3/application/listings/{listing_id}/personalization) to fetch personalization data by listing_id. It returns a personalization_questions array. If the listing has no personalization configured, the array is empty.

This endpoint will return existing listing personalization data in the following structure:

{
  "personalization_questions": [
    {
      "question_type": "text_input",
      "question_text": "Personalization",
      "instructions": string,
      "required": bool,
      "max_allowed_characters": int
    }
  ]
}
note
During the initial migration phase (before the start of the Multiple + New Question Type Support period), you can expect listings to have at most one text_input type question with the question_text “Personalization.”

New: Via endpoints that return listings with associations#
Additionally, you can retrieve the personalization data for a listing from the following endpoints by appending the ?includes=personalization query param:

getListingsByShop - GET /v3/application/shops/{shop_id}/listings
getListing - GET /v3/application/listings/{listing\_id}
getListingsByListingIds - GET /v3/application/listings/batch
The response body will include a personalization key, containing a possibly empty personalization_questions array. We will continue to return the is_personalizable property as part of the base listing level:

{
  "is_personalizable": bool,
  "personalization": {
    "personalization_questions": [
      {
        "question_type": "text_input",
        "question_text": "Personalization",
        "instructions": string,
        "required": bool,
        "max_allowed_characters": int
      }
    ]
  }
 ...
}
Adding or updating listing personalization data#
Currently, you can add or update personalization on a listing using the createDraftListing and the updateListing endpoints by sending the following params: is_personalizable, personalization_is_required, personalization_char_count_max, and personalization_instructions.

New: Through the dedicated personalization POST endpoint#
The new updateListingPersonalization endpoint (POST https://api.etsy.com/v3/application/shops/{shop_id}/listings/{listing_id}/personalization) creates or updates personalization data for a listing.

note
This endpoint fully replaces the existing listing personalization data on the listing with the sent data.

Current personalization data can be modeled as a single text_input question:

{
  "personalization_questions": [
    {
      "question_type": "text_input",
      "question_text": "Personalization",
      "instructions": string, // must be 256 characters or fewer during the endpoint migration phase
      "required": bool,
      "max_allowed_characters": int // must be between 1 and 1024
    }
  ]
}
info
Before the Multiple + New Question Type Support period starts, POST requests for production seller accounts must follow the following constraints:

The personalization_question array must contain one question object.
The question_type must be text_input.
To preserve compatibility with legacy UIs, which do not include a configurable title field, please send 'Personalization' as the default question_text value during the endpoint migration phase. Once multiple personalization questions are introduced (General Audience launch), this field can be configured by the seller and will be used as the title of each question.
instructions (if provided):
Must be 256 characters or fewer
Must begin with a letter or number
Must not contain 3 or more consecutive all-caps words (a word being defined as a sequence of 3 or more letters)
Deleting personalization from a listing#
Currently, to remove personalization from a listing, you can set is_personalizable to false via the updateListing endpoint.

New: Through the dedicated personalization DELETE endpoint#
The new deleteListingPersonalization endpoint (DELETE https://api.etsy.com/v3/application/shops/{shop_id}/listings/{listing_id}/personalization) can be used to turn off personalization for a listing and remove the associated data.

The is_personalizable property will be set to false on the main listing record as a result of this action.