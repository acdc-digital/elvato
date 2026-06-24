Examples for the Endpoint Migration period#
Getting personalization data through the dedicated personalization GET endpoint#
This endpoint retrieves a listing’s personalization questions by listing ID. It returns a personalization_questions array. If the listing has no personalization configured, the array is empty.

The following procedure retrieves the personalization questions attached to a listing.

Form a valid URL for getListingPersonalization, which must include a listing_id. For example, if your listing_id is "987654", the URL is:

https://api.etsy.com/v3/application/listings/987654/personalization

Execute a getListingPersonalization GET request with your x-api-key.

The response contains a personalization_questions object:

{
  "personalization_questions": [
    {
      "question_text": "Personalization",
      "instructions": "What name would you like engraved? Please enter their full name",
      "question_id": 18205840821,
      "question_type": "text_input",
      "required": true,
      "max_allowed_characters": 50,
      "max_allowed_files": null
    }
  ]
}
Getting personalization data via endpoints that return listings with associations#
You can still retrieve the personalization data for a listing by using the following endpoints and including the parameter ?includes=personalization in your requests:

getListingsByShop - GET /v3/application/shops/{shop_id}/listings
getListing - GET /v3/application/listings/{listing_id}
getListingsByListingIds - GET /v3/application/listings/batch
Example url for the getListing endpoint: https://api.etsy.com/v3/application/shops/12345678/listings?includes=personalization\&language=en

Example response:

During this phase we will continue to return the legacy keys related to personalization, since the new data shape is fully backwards compatible with the legacy one.

{
"listing_id": 429494249,
"title": "Example of personalizable listing",
"is_personalizable": true,
... // Legacy keys
"personalization_is_required": true, 
"personalization_char_count_max": 50,
"personalization_instructions": "Personalization\nWhat name would you like engraved? Please enter their full name",
... // New personalization data
"personalization": {
  "personalization_questions": [
      {
      "question_text": "Personalization", 
      "instructions": "What name would you like engraved? Please enter their full name", 
      "question_id": 18205840821, 
      "question_type": "text_input", 
      "required": true, 
      "max_allowed_characters": 50, 
      "max_allowed_files": null
      }
    ]
  }
}
Adding or updating personalization data through the dedicated personalization POST endpoint#
To create or update personalization questions for a listing you must first have an existing listing. If you do not have one, you can create a new listing using the createDraftListing endpoint before utilizing this endpoint.

The following procedure creates and attaches personalization profile to a specific listing:

Form a valid URL for updateListingPersonalization, which must include a shop_id and a listing_id. For example, if your shop_id is "12345678", and your listing_id is “987654” then the createListingPersonalization URL would be:

https://api.etsy.com/v3/application/shops/12345678/listings/987654/personalization

Build the updateListingPersonalization request body, which must include:

personalization_questions - Array of personalization_questions with a single text_input question and the question_text value must be “Personalization”, similar to:
{
  "personalization_questions": [
    {
      "question_text": "Personalization",
      "instructions": "What name would you like engraved? Please enter their full name",
      "question_type": "text_input",
      "required": true,
      "max_allowed_characters": 50
    }
  ]
}
Execute a updateListingPersonalization POST request with your listings_w scoped OAuth token and x-api-key. For example, a request with the previous personalization_question might look like this:
JavaScript fetch
```javascript
var headers = new Headers();
headers.append("Content-Type", "application/json");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var raw = JSON.stringify({
  personalization_questions: [
    {
      question_text: "Personalization",
      instructions: "What name would you like engraved? Please enter their full name",
      question_type: "text_input",
      required: true,
      max_allowed_characters: 50
    }
  ]
});

var requestOptions = {
    method: 'POST',
    headers: headers,
    body: raw,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/12345678/listings/987654/personalization", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
```
The response would look something like this:
{
  "personalization_questions": [
    {
      "question_text": "Personalization",
      "instructions": "What name would you like engraved? Please enter their full name",
      "question_id": 18205840821,
      "question_type": "text_input",
      "required": true,
      "max_allowed_characters": 50,
      "max_allowed_files": null
    }
  ]
}
The content of this request will replace any existing personalization data in this listing.
Deleting personalization from a listing through the dedicated DELETE endpoint#
This endpoint deletes personalization for a listing. It clears personalization by setting is_personalizable to false and removing the listing’s personalization data.

The following procedure deletes the personalization questions attached to a listing.

Form a valid URL for deleteListingPersonalization, which must include a shop_id and a listing_id. For example, if your shop_id is "12345678", and your listing_id is “987654” then the deleteListingPersonalization URL would be:

https://api.etsy.com/v3/application/shops/12345678/listings/987654/personalization

Execute a deleteListingPersonalization DELETE request with your listings_w scoped OAuth token and x-api-key.

Check the response. On success, the endpoint returns 204 No Content.