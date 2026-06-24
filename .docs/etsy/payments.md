Payments Tutorial
important
These tutorials are subject to change as endpoints change during our feedback period development. We welcome your feedback! If you find an error or have a suggestion, please post it in the Open API GitHub Repository.

Payments and the Shop Ledger contain financial information for your shop's transactions. The Open API v3 endpoints for payments and the shop ledger are read-only operations — as buyers make purchases, sellers post shipping costs with the listing, and refunds are not automatic.

The API implements payments and the shop ledger to support reporting, receipt management, fees, and taxes. The differences between these two resources are:

a shop payment account ledger entry, identified by entry_id and ledger_id, represents the total payment account value after each debit or credit to the shop's payment account, including transactions made for purchases and fulfillment. This is similar to the running total in a bank account and you access it using the getShopPaymentAccountLedgerEntries endpoint. See Reading a shop payment account ledger below.
a payment, identified bypayment_id or receipt_id, represents all the payment details for a purchase after fulfillment, including fees, shipping, and taxes. This tells you how much a buyer paid, how Etsy divides up the payment to cover costs, and the payment method. You can access payments using the getPayments endpoint. See Viewing payments below.
For example, when a buyer pays for a purchase, an entry appears in the shop payment account ledger, but there is no payment record until the purchase ships.

Throughout this tutorial, the instructions reference REST resources, endpoints, parameters, and response fields, which we cover in detail in Request Standards and URL Syntax.

Authorization and x-api-key header parameters#
The endpoints in this tutorial require an OAuth token in the header with transactions_r scope. See the Authentication topic for instructions on how to generate an OAuth token with these scopes.

In addition, all Open API V3 requests require the x-api-key: parameter in the header with your shop's Etsy App API Key keystring and shared secret, separated by a colon (:), which you can find in Your Apps.

Reading a shop payment account ledger#
Each change in the shop payment account is recorded in an entry in the shop payment account ledger. This includes individual charges and payments recorded at the time they executed. For example, when you pay to renew a listing, Etsy adds an entry to the shop payment account ledger.

The following procedure displays all entries in a shop payment account ledger, 25 entries at a time, in chronological order:

Form a valid URL for getShopPaymentAccountLedgerEntries, which must include a shop_id for the shop. For example, if your shop_id is 12345678, the getShopPaymentAccountLedgerEntries URL is:

https://api.etsy.com/v3/application/shops/12345678/payment-account/ledger-entries
Add the query parameters to get all entries, 25 at a time:

?min_created=NaN&max_created=NaN&limit=25&offset=0
Execute a getShopPaymentAccountLedgerEntries GET request with a transactions_r scope OAuth token and x-api-key, which might look like the following:

JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/x-www-form-urlencoded");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var requestOptions = {
    method: 'GET',
    headers: headers,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/payment-account/ledger-entries?min_created=NaN&max_created=NaN&limit=25&offset=0", requestOptions)
.then(response => response.text())
.then(result => console.log(result))
.catch(error => console.log('error', error));
Viewing payments#
After shipping a purchase, a buyer's payment posts to the shop and the receipt updates to reflect the changes due to shipping, taxes, and fees. While the receipt contains only the details most useful to the buyer, the payment contains the monetary details of the transaction, such as the currency the buyer used, and the currencies used to pay fees, taxes, and shipping costs.

The following procedure displays all payments posted to an Etsy shop:

Form a valid URL for getPayments, which must include a shop_id for the shop. For example, if your shop_id is 12345678, the getPayments URL is:

https://api.etsy.com/v3/application/shops/12345678/payments
Execute a getPayments GET request with a transactions_r scope OAuth token and x-api-key, which might look like the following:

JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/x-www-form-urlencoded");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var requestOptions = {
    method: 'GET',
    headers: headers,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/12345678/payments", requestOptions)
.then(response => response.text())
.then(result => console.log(result))
.catch(error => console.log('error', error));
Viewing a payment associated with a specific ledger entry#
When you have ledger entries and want to know which payments included them, send a getPaymentAccountLedgerEntryPayments request including the ledger_id. For ledger entries for debits and credits involved in a payment, the response includes the payment details. The response is empty for ledger entries not included in a payment.

The following procedure displays all payments posted to an Etsy shop:

Form a valid URL for getPaymentAccountLedgerEntryPayments, which must include a shop_id for the shop. For example, if your shop_id is 12345678, the getPayments URL is:

https://api.etsy.com/v3/application/shops/12345678/payment-account/ledger-entries/payments
Add the query parameters to get the payments associated with specific ledger entries. For example, to get the payments associated with ledger entry IDs 42362821 and 42362821, the query parameters would be:

?ledger_entry_ids=42362821,69507139
Execute a getPaymentAccountLedgerEntryPayments GET request with a transactions_r scope OAuth token and x-api-key, which might look like the following:

JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/x-www-form-urlencoded");
headers.append("x-api-key", "1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var requestOptions = {
    method: 'GET',
    headers: headers,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/12345678/payment-account/ledger-entries/payments?ledger_entry_ids=42362821%2C69507139", requestOptions)
.then(response => response.text())
.then(result => console.log(result))
.catch(error => console.log('error', error));