Multi Personalization Migration Guide#
To make it easier for sellers with personalizable listings to collect the information they need from buyers and more efficiently process personalizable orders, we are replacing the single free-text personalization field with an architecture that supports multiple, typed personalization inputs: text inputs, dropdowns, and file upload questions. More information about the reasoning behind this project can be found in the GitHub announcement.

Timeline#
Multiple personalization migration timeline

Integration Stages#
Endpoint Migration (60-day migration window, Feb. 6 - Apr. 9 2026)

Starting February 6th, 2026, a new personalization data structure will be introduced, along with a new suite of personalization-specific endpoints. Third-party developers can start using the new endpoints and response/data formats for all users from day 1.
The new data structure is backwards compatible with the current personalization data. Existing listing personalization data (i.e. instructions, character limit, and required setting) will be returned in the new format (as a single text input question) and can be updated via the new endpoints. No visual changes will be required during this period.
Legacy personalization fields will be deprecated on April 9th, 2026, and listing create/update requests containing legacy personalization fields will return an error.
Multiple + New Question Type Support (early access for developer test accounts through a Developer Preview begins Feb. 6. The General Audience production release is slated for May 11, 2026).

Listings will support up to 5 personalization questions and 3 question types: text input, dropdown, and file upload.
Third party applications that read listing personalization data must be updated to correctly display multiple personalization questions.
Applications that read personalization data on transactions may also be required to update, depending on their integration.
For applications that write personalization data, changes allowing sellers to write multiple personalization questions and/or new question types must not be released to production users until the Etsy General Audience launch date (May 11th).
To facilitate development and testing prior to the General Audience launch, we will give developers early access to these features via authorized test accounts starting on Feb. 6th, 2026.
The file-upload question type is currently under development so it won’t be available starting Feb 6th. This feature will be available for testing on Feb, 29, 2026, confirmation of its release will be provided via a GitHub announcement.
Consult other sections of this tutorial for detailed migration guidance, examples, and recommended steps for integrators.