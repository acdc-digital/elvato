Multiple + New Question Type Support#
We will roll out new personalization features to sellers on May 11th (General Audience launch), allowing them to configure up to 5 personalization questions on a listing using 3 question types: text input (introduced during the Endpoint Migration period), dropdown, and file upload.

danger
The ability to write multiple questions and/or new question types must not be released to production users until the Etsy.com General Audience release (May 11th).

To facilitate development and testing prior to the General Audience launch, we will give developers early access to these features via authorized test accounts starting on Feb. 6th (a.k.a. “developer preview”).

info
Developer Preview

To access the Multiple + New Question Type Support changes prior to the General Audience launch, external developers must use a seller account in developer mode.

Use the following links while logged in to the account you intend to use for testing to get your account set up:

To get your shop in developer mode: Visit https://www.etsy.com/developers/shop
To register for the Developer Preview: Visit https://www.etsy.com/your/shops/me/dashboard?enroll-seller-perso-closed-beta=true
If you’ve successfully registered for Developer Preview you’ll see a green success toast and will have immediate access to the feature. If the enrollment failed, you’ll see a red failure toast.

Developer Preview success toast
If you’re looking for more information about how to use personalization features in Etsyweb, be sure to check out the Help Center article: How to Offer Personalized Listings as a Beta Participant. For more detailed examples refer to the Examples for the Multiple + New Questions Type Support Period section.

Required changes#
To ensure your integration is compatible with the new personalization features, you must make the following changes. These updates should be released to users as soon as possible after Etsy’s General Audience launch (May 11th).

If you read personalization data on transactions:#
Personalization data will continue to be returned in the transaction variation array in the existing format. If your integration relies on the formatted_name being "Personalization" or there being one item with property_id: 54, this may need to be updated.
If you read personalization data on listings:#
Your integration will need to be updated to correctly display multiple questions with new types (test input, dropdown, and file-upload).
If you write personalization data on listings:#
Your integration will need to be updated to support adding multiple questions with new question types.
Breakdown of the changes#
With multiple and new question types, we aim to streamline the purchasing experience for personalized items by reducing the amount of text buyers need to read when making a purchase.

As part of this update, we are introducing a new 120 character limit to the instructions field (reduced from the previous 256 character limit). Please review the following sections to understand how this change may affect your application.

Reading transaction personalization data#
Currently, personalization data for a transaction is returned (if present) as part of the variations array on a transaction object:

{
  ... // other transaction data 
  "variations": [
    ... // other variation data
    {
      "formatted_name": "Personalization",
      "formatted_value": string,
      "property_id": 54,
      "value_id": int|null
    }
  ]
}
Transaction personalization will continue to be returned in the same format, but be advised of the following changes:

The formatted_name may be a seller-configured value.
There may be multiple objects with property_id 54.
For file uploads, the formatted_value will be a URL.
Reading listing personalization data#
As specified in the Endpoint Migration section of the guide, listing personalization data can be fetched via the following endpoints:

getListingPersonalization - GET /v3/application/listings/{listing_id}/personalization
getListingsByShop - GET /v3/application/shops/{shop_id}/listings?includes=personalization
getListing - GET /v3/application/listings/{listing_id}?includes=personalization
getListingsByListingIds - GET /v3/application/listings/batch?includes=personalization
The personalization_questions array may contain up to 5 questions with 3 types: text input, dropdown, and file upload. The question data structure introduced in the Endpoint Migration will be extended to encompass the new question types:

{
  "question_id": int,
  "question_type": ENUM // "text_input", "dropdown", "unlabeled_upload", "labeled_upload"
  "question_text": string,
  "instructions": string, // only applicable to text_input and upload questions
  "required": bool,
  "max_allowed_characters": int, // only applicable to text_input questions
  "max_allowed_files": int, // only applicable to upload questions
  "options": [ // applicable for dropdowns and labeled_upload questions
    {
      "option_id": int,
      "label": string
    }
  ]
}
Examples of each question type are given in the Examples for the Multiple + New Question Type Support Period section.

Existing instructions values that exceed the 120 character limit will still be returned in full by GET requests and will not be automatically truncated. However, any updates to these questions via POST requests must comply with the new 120 character limit.

Writing listing personalization data#
As specified in the Endpoint Migration section of this guide, listing personalization can be written via the updatePersonalizationEndpoint endpoint (POST https://api.etsy.com/v3/application/shops/{shop_id}/listings/{listing_id}/personalization).

For authorized developer test accounts during the Developer Preview period, and for all production seller accounts following the General Audience launch, this endpoint will accept an array of up to 5 personalization_questions and support all question types.

{
  "personalization_questions": [
    {
      "question_id": int,
      "question_type": ENUM // "text_input", "dropdown", "unlabeled_upload", "labeled_upload"
      "question_text": string,
      "instructions": string, // only allowed for text_input and upload questions, limited to 120 characters
      "required": bool,
      "max_allowed_characters": int, // required for text_input questions
      "max_allowed_files": int, // required for upload questions
      "options": [ // required for dropdowns and labeled_upload questions
        {
          "label": string
        }
      ]
    },
   ...
  ]
}
Please note the following constraints:

The personalization_questions array must contain between 1 and 5 elements.
At most one upload-type question (either unlabeled_upload or labeled_upload) may be sent per listing.
warning
When you release the update to support multiple questions and new question types, please also append ?supports_multiple_personalization_questions=true when calling this endpoint. This will allow us to track adoption and prevent inadvertent overwrites of seller data from non-updated apps. Without this query param, attempts to write data that would delete previously configured personalization questions will fail with a 409 Conflict error.

Adding the param without updating your application can lead to deleting data provided by the seller on Etsyweb.

There are also field-level constraints:

question_text
Must be between 1 and 45 characters
Must begin with a letter or number
instructions
Must be empty or null for dropdowns
Optional for the other question types
Must not exceed 120 characters when provided (requests will fail validation otherwise)
Must begin with a letter or number
Must not contain 3 or more consecutive all-caps words (a word being defined as a sequence of 3 or more letters)
max_allowed_characters
Required for text_input questions; not allowed for other question types
Must be between 1 and 1024
max_allowed_files
Required for upload questions (either labeled or unlabeled); not allowed for other question types
Must be between 1 and 10
For labeled_upload questions, max_allowed_files must be 2 or more
options
Required for dropdown and labeled_upload questions; not allowed for other question types
For dropdowns:
Must contain 1 - 30 options
Each label must be 1 - 20 characters
Labels must be unique within the question
For labeled uploads:
Length must equal max_allowed_files
Each label must be 1 - 45 characters
question_id
optional, but encouraged if you are updating or adding to existing personalization on a listing (example)