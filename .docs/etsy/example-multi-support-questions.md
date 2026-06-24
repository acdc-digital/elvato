Examples for the Multiple + New Questions Type Support Period#
Examples of new question types#
Dropdown questions#
{
      "question_text": "Font",
      "question_type": "dropdown",
      "options": [
            {
                "label": "Arial"
            },
            {
                "label": "Century Gothic"
            },
            {
                "label": "Times New Roman"
            }
        ],
      "required": true
    }
Unlabeled file uploads#
{
      "question_text": "Family pictures",
      "instructions": "Add images of the members of the family members that you want in your family portrait",
      "question_type": "unlabeled_upload",
      "required": true,
      "max_allowed_files": 10
}
Labeled file uploads#
{
      "question_text": "Family pictures",
      "instructions": "Add images of the members of the family members that you want in your family portrait",
      "question_type": "labeled_upload",
      "options": [
        {
            "label": "Dad"
        },
        {
            "label": "Mom"
        },
        {
            "label": "Children"
        }
      ],
      "required": true,
      "max_allowed_files": 3
}
note
For labeled file upload questions, the max_allowed_files value must match the number of labels provided in the options array.

Adding multiple personalization questions to a listing#
To create or update personalization questions for a listing you must first have an existing listing. If you do not have one, you can create a new listing using the createDraftListing endpoint before utilizing this endpoint.

During the Developer Preview and after the General Audience launch (if you’ve updated your application to support multiple questions), you must include the query parameter ?supports_multiple_personalization_questions=true in your request to successfully update the listing. If this parameter is omitted or incorrect, the request will result in a 409 Conflict response. Adding the param without updating the application can lead to deleting data provided by the seller on Etsyweb.

The following procedure creates and attaches personalization profile to a specific listing with the maximum number of personalization questions allowed and an unlabeled file upload question:

Form a valid URL for updateListingPersonalization, which must include a shop_id and a listing_id and include a ?supports_multiple_personalization_questions=true param.
For example, if your shop_id is "12345678", and your listing_id is “987654” then the createListingPersonalization URL would be:

https://api.etsy.com/v3/application/shops/12345678/listings/987654/personalization?supports_multiple_personalization_questions=true

Build the updateListingPersonalization request body, which must include:

personalization_questions - Array of question objects, with the following shape:
{
  "personalization_questions": [
    {
      "question_text": "What name would you like engraved?",
      "instructions": "Please enter your family lastname",
      "question_type": "text_input",
      "required": true,
      "max_allowed_characters": 50
    },
    {
      "question_text": "What message would you like in the card?",
      "instructions": "Please enter the message you would like added in the giftcard.",
      "question_type": "text_input",
      "required": true,
      "max_allowed_characters": 680
    },
    {
      "question_text": "Family pictures",
      "instructions": "Add images of the members of your family that you want in your family portrait",
      "question_type": "unlabeled_upload",
      "required": true,
      "max_allowed_files": 10
    },
    {
      "question_text": "Font",
      "question_type": "dropdown",
      "options": [
            {
                "label": "Arial"
            },
            {
                "label": "Century Gothic"
            },
            {
                "label": "Times New Roman"
            }
        ],
      "required": true
    },
    {
      "question_text": "Frame color",
      "question_type": "dropdown",
      "options": [
            {
                "label": "Dark brown"
            },
            {
                "label": "Light brown"
            },
            {
                "label": "White"
            },
            {
                "label": "Black"
            }
        ],
      "required": true
    }
  ]
}
Execute a updateListingPersonalization POST request with your listings_w scoped OAuth token and x-api-key. For example, a request with the previous personalization_question might look like this:
JavaScript fetch
```javascript var headers = new Headers(); headers.append("Content-Type", "application/json"); headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5"); headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");
    var raw = JSON.stringify({
        "personalization_questions": [
            {
                "question_text": "What name would you like engraved?",
                "instructions": "Please enter your family lastname",
                "question_type": "text_input",
                "required": true,
                "max_allowed_characters": 50
            },
            {
                "question_text": "What message would you like in the card?",
                "instructions": "Please enter the message you would like added in the giftcard.",
                "question_type": "text_input",
                "required": true,
                "max_allowed_characters": 680
            },
            {
                "question_text": "Family pictures",
                "instructions": "Add images of the members of your family that you want in your family portrait",
                "question_type": "unlabeled_upload",
                "required": true,
                "max_allowed_files": 10
            },
            {
                "question_text": "Font",
                "question_type": "dropdown",
                "options": [
                    {
                        "label": "Arial"
                    },
                    {
                        "label": "Century Gothic"
                    },
                    {
                        "label": "Times New Roman"
                    }
                ],
                "required": true
            },
            {
                "question_text": "Frame color",
                "question_type": "dropdown",
                "options": [
                    {
                        "label": "Dark brown"
                    },
                    {
                        "label": "Light brown"
                    },
                    {
                        "label": "White"
                    },
                    {
                        "label": "Black"
                    }
                ],
                "required": true
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
You should get a 201 Created response that would look similar to this:
{
    "personalization_questions": [
        {
            "question_text": "What name would you like engraved?",
            "instructions": "Please enter your family lastname",
            "question_id": 18205669682,
            "question_type": "text_input",
            "required": true,
            "max_allowed_characters": 50,
            "max_allowed_files": null
        },
        {
            "question_text": "What message would you like in the card?",
            "instructions": "Please enter the message you would like added in the giftcard.",
            "question_id": 18205669686,
            "question_type": "text_input",
            "required": true,
            "max_allowed_characters": 680,
            "max_allowed_files": null
        },
        {
            "question_text": "Family pictures",
            "instructions": "Add images of the members of your family that you want in your family portrait",
            "question_id": 18205849779,
            "question_type": "unlabeled_upload",
            "required": true,
            "max_allowed_characters": null,
            "max_allowed_files": 10
        },
        {
            "question_text": "Font",
            "instructions": null,
            "question_id": 18205849781,
            "question_type": "dropdown",
            "required": true,
            "max_allowed_characters": null,
            "max_allowed_files": null,
            "options": [
                {
                    "option_id": 18205669694,
                    "label": "Arial"
                },
                {
                    "option_id": 18205849785,
                    "label": "Century Gothic"
                },
                {
                    "option_id": 18205669696,
                    "label": "Times New Roman"
                }
            ]
        },
        {
            "question_text": "Frame color",
            "instructions": null,
            "question_id": 18205849787,
            "question_type": "dropdown",
            "required": true,
            "max_allowed_characters": null,
            "max_allowed_files": null,
            "options": [
                {
                    "option_id": 18205849789,
                    "label": "Dark brown"
                },
                {
                    "option_id": 18205849791,
                    "label": "Light brown"
                },
                {
                    "option_id": 18205849793,
                    "label": "White"
                },
                {
                    "option_id": 18205849795,
                    "label": "Black"
                }
            ]
        }
    ]
}
Updating a listing with existing personalization#
When updating personalization on a listing, please be aware that the payload should contain all the personalization information that you want on the listing, as the POST request will replace the existing listing personalization data.

If the update includes existing questions - for instance, if you are adding an additional question to existing ones – please include the question_id for each of the existing questions in your POST request to the updateListingPersonalization endpoint.

The following procedure updates listing personalization with an existing question:

Obtain the question_id through the getListingPersonalization GET endpoint, a valid url must include a listing_id. For example, if your listing_id is "987654", the URL is:

https://api.etsy.com/v3/application/listings/987654/personalization

Read the question_id value from the response.

{
    "personalization_questions": [
        {
            "question_text": "What name would you like engraved?",
            "instructions": "Please enter your family lastname",
            "question_id": 1458181502381,
            "question_type": "text_input",
            "required": true,
            "max_allowed_characters": 50,
            "max_allowed_files": null
        }
    ]
}
Form a valid URL for updateListingPersonalization, which must include a shop_id and a listing_id and include a ?supports_multiple_personalization_questions=true param.
For example, if your shop_id is "12345678", and your listing_id is “987654” then the createListingPersonalization URL would be:

https://api.etsy.com/v3/application/shops/12345678/listings/987654/personalization?supports_multiple_personalization_questions=true

Build the updateListingPersonalization request body, which must include:

personalization_questions - Array of question objects, each question should include its question_id if you’re editing an existing question:
{
    "personalization_questions": [
        {
            "question_text": "What name would you like engraved?", // existing question
            "instructions": "Please enter your family lastname",
            "question_id": 1458181502381,
            "question_type": "text_input",
            "required": true,
            "max_allowed_characters": 50,
        },
        {
            "question_text": "Font", // new question
            "question_type": "dropdown",
            "required": true,
            "options": [
                {
                    "label": "Arial"
                },
                {
                    "label": "Century Gothic"
                },
                {
                    "label": "Times New Roman"
                }
]
            
        }
    ]
}
Execute a updateListingPersonalization POST request with your listings_w scoped OAuth token and x-api-key, similar to the example above.
You should get a 201 Created response that would look similar to this:
{
    "personalization_questions": [
        {
            "question_text": "What names would you like engraved?",
            "instructions": "Please enter the names of your family members.",
            "question_id": 1458184327757,
            "question_type": "text_input",
            "required": true,
            "max_allowed_characters": 100,
            "max_allowed_files": null
        },
        {
            "question_text": "Font",
            "question_type": "dropdown",
            "question_id": 1458184327768,
            "required": true,
            "options": [
                            {
            "option_id": 18205849800,
                                "label": "Arial"
                            },
                            {
                        "option_id": 18205849801,
                                "label": "Century Gothic"
                            },
                            {
            "option_id": 18205849802,
                                "label": "Times New Roman"
                            }
            ]
        }
    ]
}
Keep in mind that the question_id is not stable and it might change in a successful response if Etsy detects any changes to the current question.