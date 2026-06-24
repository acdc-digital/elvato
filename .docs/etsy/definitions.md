Definitions
The following definitions will help with the OpenAPI reference section to understand what some of the objects and options mean. This is not an exhaustive list, but rather a list of requested clarifications.

State Field Possible Values#
In the ShopListing endpoints there is a field called state with these potential values:

Value	Meaning
active	Currently active listing that has at least one quantity and is has not expired.
inactive or edit	A listing that once was, but is no longer active and is ready for modifications.
sold_out	A once active listing that no longer has any available quantity.
draft	A new listing that has yet to be promoted to active state.
expired	A once active listing that has reached it's ending date and was not set to auto renew.
Money Object#
A money object represents a price for a listing in a specific currency. The money object contains the following fields:

Field Name	Meaning
amount	This is the base amount by which the currency can not be divided further. For instance, in United States dollars, the base value is one penny or 1. So a listing for five dollars US, would be 500 pennies.
divisor	This is the number used to divide the amount to get the currency value. So a listing for 500 in the amount, will be divided by 100 pennies to come up with 5 dollars.
currency_code	This is the 3 letter code for a given currency, such as USD for United States Dollar or CAD for Canadian Dollar.
Order Status Values#
When retrieving receipts in the OpenAPI, an order (AKA receipt) can have one of the following status values:

Value	Meaning
open	The order has been created, but payment has not yet been submitted. This is a legacy value and was used when sellers were accepting direct payments and not using Etsy checkout.
paid	The order has been created and paid for and is ready for shipping.
completed	The order has been shipped and is considered complete.
payment processing	The order has been created and payment data submitted, but has not been fully processed.
canceled	The order was canceled.