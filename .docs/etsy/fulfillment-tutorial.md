Fulfillment Tutorial
important
These tutorials are subject to change as endpoints change during our feedback period development. We welcome your feedback! If you find an error or have a suggestion, please post it in the Open API GitHub Repository.

Fulfillment covers all shipping and handling activities required to ship and return customer orders. Additionally, when your app submits tracking information for shipping, Etsy triggers the final calculations for the purchase transaction, including Value Added Tax (VAT), tax, and shipping costs, resulting in complete receipts.

Throughout this tutorial, the instructions reference REST resources, endpoints, parameters, and response fields, which we cover in detail in Request Standards and URL Syntax.

Authorization and x-api-key header parameters#
The endpoints in this tutorial require an OAuth token in the header with transactions_r and transactions_w scope. See the Authentication topic for instructions on how to generate an OAuth token with these scopes.

In addition, all Open API V3 requests require the x-api-key: header with your shop's Etsy App API Key keystring and shared secret, separated by a colon (:), which you can find in Your Apps.

Fulfilling Digital Orders#
A seller typically does not need to do anything to fulfill orders for digital products after creating the listing and uploading files for buyers to buy. Buyers can download files from their purchase history forever once purchased, even if the seller stops offering that digital product for sale. However, there are a few important details a seller should be aware of following the fulfillment of a digital order:

Files purchased by buyers in the past aren't automatically updated when you update the listing with newer version of the file.
You must include any tax amounts applicable to the purchase in the purchase price, as Etsy doesn't add tax automatically to digital products except for calculated Value Added Tax (VAT) amounts. See How VAT Works on Digital Items for more information on calculated VAT for digital products.
Fulfilling Physical Product Orders#
You fulfill physical product orders by shipping them and using the createReceiptShipment to add the carrier and tracking information to your shop and customers. To get a list of shipping carriers for a shop, use getShippingCarriers or see Tracking updates for shipping carriers below. Etsy posts the final transaction total immidately after a seller posts shipping details, so the response from createReceiptShipment includes calculated taxes, discounts, gift wrap prices, etc. Additionally, successful createReceiptShipment requests send a notification email to the buyer.

Sellers enter shipping costs as part of a shipping profile using Shipping Profile endpoints. See the listings tutorial for instructions on adding a shipping profile to a listing. Sellers can purchase shipping through Etsy, but the Open API v3 does not include an endpoint to order shipping, so the seller must enter costs into shipping profiles, purchase shipping, and print shipping labels themselves. See How to Purchase Etsy Shipping Labels for all carriers Etsy supports directly in the seller tools.

The following procedure adds shipping tracking information to a receipt:

Form a valid URL for createReceiptShipment, which must include a shop_id for the shop and the receipt_id for the purchase. For example, if your shop_id is 12345678 and your receipt_id is 090898651, the createShopSection URL is:

https://api.etsy.com/v3/application/shops/12345678/receipts/090898651/tracking
Build the createReceiptShipment request body, which must include tracking_code string provided by the carrier and carrier_name string to identify the carrier. Etsy supports tracking updates for many shipping carriers as determined by the carrier_name parameter. See Tracking updates for shipping carriers below.

Enhanced shipment details (recommended)#
While only tracking_code and carrier_name fields are required, including additional shipment details will enable faster tracking updates and improve the delivery experience for both you and your buyers. We recommend including the following optional fields when available:

Package details:

mail_class - Service level (e.g., First-Class, Priority, Ground, Express)
weight and weight_units - Package weight (units: oz, grams, etc.)
length, width, height, and dimension_units - Package dimensions (units: in, cm, etc.)
ship_date - The date the package was or will be shipped. Key pieces:
ISO 8601 UTC timestamp
Example 2026-03-30T10:00:00Z
If the ship_date format is incorrect, then the date is silently ignored.
Shipping label information:

shipping_label_cost and shipping_label_currency - The purchase price the merchant paid for the shipping label.
International shipments:

ship_from_country - The physical origin country the package is shipping from.
ship_to_country - Final destination country the package is being shipped to.
incoterm - Delivery terms (e.g., DAP, DDP)
duty_amount and duty_currency - Import duties and taxes
customs_data - Array of customs information for items in the shipment:
country_of_origin - Country where the product was produced or manufactured
declared_value - Declared customs value
HS_code - Harmonized System code
Providing these details will help Etsy deliver more accurate tracking information and estimated delivery dates to your buyers.

Execute a createReceiptShipment POST request with a transactions_w scope OAuth token and x-api-key. For example, a createReceiptShipment request to create the "Spiral Carpet" section might look like the following:
JavaScript fetch
PHP curl
var headers = new Headers();
headers.append("Content-Type", "application/x-www-form-urlencoded");
headers.append("x-api-key", "2lk6cu87j83a15eqnfmf7ysk:a1b2c3d4e5");
headers.append("Authorization", "Bearer 12345678.jKBPLnOiYt7vpWlsny_lDKqINn4Ny_jwH89hA4IZgggyzqmV_bmQHGJ3HOHH2DmZxOJn5V1qQFnVP9bCn9jnrggCRz");

var urlencoded = new URLSearchParams();
urlencoded.append("tracking_code", "KB6NANRE9noji32oOU34h");
urlencoded.append("carrier_name", "fedex");

var requestOptions = {
    method: 'POST',
    headers: headers,
    body: urlencoded,
    redirect: 'follow'
};

fetch("https://api.etsy.com/v3/application/shops/12345678/receipts/090898651/tracking", requestOptions)
.then(response => response.text())
.then(result => console.log(result))
.catch(error => console.log('error', error));
Tracking updates for shipping carriers#
Etsy supports tracking updates for several carriers, determined by the carrier_name submitted with a createShippingReceipt request. Tracking updates provide a tracking link in the shipping notification email and displays tracking updates for the shipment on Etsy.

The table below lists known carriers, the carrier_name parameter values, and whether Etsy supports tracking updates for that organization.

Carrier	carrier_name	Tracking Updates
4PX Worldwide Express	4px	Yes
A1Post	a1post	Yes
ABF Freight	abf	Yes
ACS Courier	acscourier	Yes
AeroFlash	aeroflash	Yes
Afghan Post	afghan-post	No
Amazon Logistics UK	amazon-uk-api	Yes
Amazon Logistics US	amazon	Yes
An Post	an-post	Yes
Anguilla Postal Service	anguilla-post	No
APC Postal Logistics	apc	Yes
Aramex	aramex	Yes
Asendia UK	asendia-uk	Yes
Asendia USA	asendia-usa	Yes
Australia Post	australia-post	Yes
Austrian Post	austrian-post	Yes
Austrian Post Registered	austrian-post-registered	Yes
Bahrain Post	bahrain-post	No
Bangladesh Post Office	bangladesh-post	No
Belgium Post Domestic	bpost	Yes
Belgium Post International	bpost-international	Yes
Belposhta	belpost	Yes
BH Posta	bh-posta	No
Blue Dart	bluedart	Yes
BotswanaPost	botswanapost	No
Brunei Postal Services	brunei-post	No
Bulgarian Posts	bgpost	Yes
Cambodia Post	cambodia-post	Yes
Canada Post	canada-post	Yes
Canpar Courier	canpar	Yes
Ceska Posta	ceska-posta	Yes
China EMS	china-ems	Yes
China Post	china-post	Yes
Chit Chats	chitchats	Yes
Chronopost France	chronopost-france	Yes
Chronopost Portugal	chronopost-portugal	Yes
Chunghwa Post	taiwan-post	Yes
City Link	city-link	Yes
Colissimo	colissimo	Yes
Collect+	collectplus	Yes
Correios de Brasil	brazil-correios	Yes
Correios de Macau	correios-macau	No
Correios de Portugal (CTT)	portugal-ctt	Yes
Correo Argentino Domestic	correo-argentino	Yes
Correo Argentino International	correo-argentino-intl	Yes
Correo Uruguayo	correo-uruguayo	No
Correos - Espana	spain-correos-es	Yes
Correos Chile	correos-chile	Yes
Correos De Mexico	correos-de-mexico	Yes
Correos de Costa Rica	correos-de-costa-rica	Yes
Correos del Ecuador	correos-ecuador	No
Courier Post	courierpost	Yes
Couriers Please	couriers-please	Yes
Cyprus Post	cyprus-post	Yes
Deltec Courier	deltec-courier	Yes
Deutsche Post	deutsch-post	Yes
DHL Benelux	dhl-benelux	Yes
DHL Express	dhl	Yes
DHL Germany	dhl-germany	Yes
DHL Global Mail	dhl-global-mail	Yes
DHL Netherlands	dhl-nl	Yes
DHL Parcel NL	dhlparcel-nl	Yes
DHL Polska	dhl-poland	Yes
DHL Spain Domestic	dhl-es	Yes
DHL eCommerce	dhl-global-mail-asia	Yes
Direct Link	directlink	Yes
DPD	dpd	Yes
DPD Germany	dpd-de	Yes
DPD Polska	dpd-poland	Yes
DPD UK	dpd-uk	Yes
DTDC India	dtdc	Yes
EC-Firstclass	ec-firstclass	Yes
Egypt Post	egypt-post	No
El Correo	el-correo	No
Elta Courier	elta-courier	Yes
Empost	emirates-post	Yes
Empresa de Correos de Bolivia	correos-bolivia	No
Estafeta	estafeta	Yes
Estes	estes	Yes
Estonian Post	estonian-post	No
Ethiopian Postal Service	ethiopian-post	No
Evergreen	evergreen	No
Fastway Australia	fastway-au	Yes
Fastway Couriers	fastway-ireland	Yes
Fastway New Zealand	fastway-nz	Yes
Fastways Couriers South Africa	fastway-za	Yes
FedEx	fedex	Yes
Fedex UK (Domestic)	fedex-uk	Yes
First Flight Couriers	first-flight	Yes
Flash Courier	flash-courier	Yes
Freightquote by C. H. Robinson	freightquote	Yes
GATI-KWE	gati-kwe	Yes
Ghana Post	ghana-post	No
Globegistics	globegistics	Yes
GLS	gls	Yes
Greyhound	greyhound	Yes
Guernsey Post	guernsey-post	No
Hay Post	hay-post	No
Hellenic Post	hellenic-post	No
Hermes	hermes-de	Yes
Hermes Italy	hermes-it	Yes
Hermes UK	hermes	Yes
Hong Kong Post	hong-kong-post	Yes
Hrvatska Posta	hrvatska-posta	Yes
i-parcel	i-parcel	Yes
India Post	india-post	Yes
India Post International	india-post-int	Yes
Interlink Express	interlink-express	Yes
International Seur	international-seur	Yes
Ipostel	ipostel	No
Iran Post	iran-post	No
Islandspostur	islandspostur	No
Isle of Man Post Office	isle-of-man-post	No
Israel Post	israel-post	Yes
Israel Post Domestic	israel-post-domestic	Yes
Jamaica Post	jamaica-post	No
Japan Post	japan-post	Yes
Jersey Post	jersey-post	No
Jordan Post	jordan-post	No
Kazpost	kazpost	No
Korea Post	kpost	Yes
Korea Post EMS	korea-post	Yes
Kuehne + Nagel	kn	Yes
La Poste	la-poste-colissimo	Yes
La Poste Monaco	poste-monaco	No
La Poste du Senegal	poste-senegal	No
La Poste Tunisienne	poste-tunisienne	No
Landmark Global	landmark-global	Yes
LaserShip	lasership	Yes
Latvijas Pasts	latvijas-pasts	No
LibanPost	libanpost	No
Lietuvos Pastas	lietuvos-pastas	Yes
Magyar Posta	magyar-posta	Yes
Makedonska Posta	makedonska-posta	No
Malaysia Pos Daftar	malaysia-post-posdaftar	Yes
Maldives Post	maldives-post	No
MaltaPost	maltapost	No
Mauritius Post	mauritius-post	No
Mondial Relay	mondialrelay	Yes
MRW	mrw-spain	Yes
Multipack	mexico-multipack	Yes
myHermes UK	myhermes-uk	Yes
Nacex	nacex-spain	Yes
New Zealand Post	new-zealand-post	Yes
Nexive	tntpost-it	Yes
Nieuwe Post Nederlandse Antillen (PNA)	nieuwe-post-nederlandse-antillen-pna	No
Nigerian Postal Service	nipost	Yes
Nova Poshta	nova-poshta	Yes
OCA	oca-ar	Yes
OPEK	opek	Yes
Oman Post	oman-post	No
OnTrac	ontrac	Yes
OPT	opt	No
OPT de Nouvelle-Caledonie	opt-nouvelle-caledonie	No
Pakistan Post	pakistan-post	No
Parcelforce Worldwide	parcel-force	Yes
Poczta Polska	poczta-polska	Yes
Pos Indonesia	pos-indonesia	Yes
Pos Indonesia International	pos-indonesia-int	Yes
Pos Malaysia	malaysia-post	Yes
Post Aruba	post-aruba	No
Post Fiji	post-fiji	No
Post Luxembourg	post-luxembourg	No
PostNL Domestic	postnl	Yes
PostNL International	postnl-international	Yes
PostNL International 3S	postnl-3s	Yes
PostNord	danmark-post	Yes
PostNord Logistics	postnord	Yes
Posta	posta	No
Posta Kenya	posta-kenya	No
Posta Moldovei	posta-moldovei	No
Posta Romana	posta-romana	Yes
Posta Shqiptare	posta-shqiptare	No
Posta Slovenije	posta-slovenije	No
Posta Srbije	posta-srbije	No
Posta Uganda	posta-uganda	No
Poste Italiane	poste-italiane	Yes
Poste Italiane Paccocelere	poste-italiane-paccocelere	Yes
Poste Maroc	poste-maroc	No
Posten AB	sweden-posten	Yes
Posten Norge	posten-norge	Yes
Posti	posti	Yes
Postmates	postmates	Yes
PTT Posta	ptt-posta	Yes
Purolator	purolator	Yes
Qatar Post	qatar-post	No
Red Express	red-express	Yes
Redpack	mexico-redpack	Yes
Royal Mail	royal-mail	No
RL Carriers	rl-carriers	Yes
RPX Indonesia	rpx	Yes
Russian Post	russian-post	Yes
S.F International	sfb2c	Yes
Safexpress	safexpress	Yes
Sagawa	sagawa	Yes
Saudi Post	saudi-post	Yes
SDA Express Courier	italy-sda	Yes
Selektvracht	selektvracht	Yes
Senda Express	mexico-senda-express	Yes
Sendle	sendle	Yes
Serpost	serpost	No
SEUR Espana (Domestico)	spanish-seur	Yes
SEUR Portugal (Domestico)	portugal-seur	Yes
SF Express	sf-express	Yes
Singapore Post	singapore-post	Yes
Singapore SpeedPost	singapore-speedpost	Yes
Siodemka	siodemka	Yes
Skynet Malaysia	skynet-malaysia	Yes
SkyNet Wordwide Express	skynetworldwide	Yes
Skynet Worldwide Express	skynetworldwide	Yes
Slovenska posta	slovenska-posta	No
South Africa Post Office	sapo	Yes
Stallion Express	stallionexpress	Yes
StarTrack	star-track	Yes
Swiss Post	swiss-post	Yes
TA-Q-BIN Hong Kong	taqbin-hk	Yes
TA-Q-BIN Japan	taqbin-jp	Yes
TA-Q-BIN Malaysia	taqbin-my	Yes
TA-Q-BIN Singapore	taqbin-sg	Yes
TGX	tgx	Yes
Thailand Post	thailand-post	Yes
TNT	tnt	Yes
TNT Australia	tnt-au	Yes
TNT France	tnt-fr	Yes
TNT Italia	tnt-it	Yes
TNT UK	tnt-uk	Yes
Toll Global Express	toll-global-express	No
Toll Priority	toll-priority	Yes
TTPost	ttpost	No
UK Mail	uk-mail	Yes
UkrPoshta	ukrposhta	Yes
UPS	ups	Yes
UPS Freight	ups-freight	Yes
uShip	uship	Yes
USPS	usps	Yes
Vanuatu Post	vanuatu-post	No
Vietnam Post	vnpost	Yes
Vietnam Post EMS	vnpost-ems	Yes
Whistl	whistl	Yes
Xend	xend	Yes
Yakit	yakit	Yes
Yanwen	yanwen	Yes
Yemen Post	yemen-post	No
Yodel	yodel	Yes
Yodel International	yodel-international	Yes
YRC Freight	yrc	Yes
Zampost	zampost	No
Zimpost	zimpost	No
Countries requiring postal codes#
Shipping profiles require valid postal code inputs for the following countries:

Country name	iso_code
Åland Islands	AX
Albania	AL
Algeria	DZ
American Samoa	AS
Andorra	AD
Argentina	AR
Armenia	AM
Australia	AU
Austria	AT
Azerbaijan	AZ
Bahrain	BH
Bangladesh	BD
Barbados	BB
Belarus	BY
Belgium	BE
Bermuda	BM
Bhutan	BT
Bosnia and Herzegovina	BA
Brazil	BR
British Indian Ocean Territory	IO
British Virgin Islands	VG
Brunei	BN
Bulgaria	BG
Cambodia	KH
Canada	CA
Cape Verde	CV
Cayman Islands	KY
Chile	CL
China	CN
Christmas Island	CX
Cocos (Keeling) Islands	CC
Colombia	CO
Costa Rica	CR
Croatia	HR
Cyprus	CY
Czech Republic	CZ
Denmark	DK
Dominican Republic	DO
Ecuador	EC
Egypt	EG
El Salvador	SV
Estonia	EE
Ethiopia	ET
Falkland Islands (Malvinas)	FK
Faroe Islands	FO
Finland	FI
France	FR
French Guiana	GF
French Polynesia	PF
Georgia	GE
Germany	DE
Gibraltar	GI
Greece	GR
Greenland	GL
Guadeloupe	GP
Guam	GU
Guatemala	GT
Guernsey	GG
Guinea	GN
Guinea-Bissau	GW
Haiti	HT
Heard Island and McDonald Islands	HM
Holy See (Vatican City State)	VA
Honduras	HN
Hungary	HU
Iceland	IS
India	IN
Indonesia	ID
Iran	IR
Iraq	IQ
Ireland	IE
Isle of Man	IM
Israel	IL
Italy	IT
Japan	JP
Jersey	JE
Jordan	JO
Kazakhstan	KZ
Kenya	KE
Kuwait	KW
Kyrgyzstan	KG
Laos	LA
Latvia	LV
Lebanon	LB
Lesotho	LS
Liberia	LR
Liechtenstein	LI
Lithuania	LT
Luxembourg	LU
Macedonia	MK
Madagascar	MG
Malaysia	MY
Maldives	MV
Malta	MT
Marshall Islands	MH
Martinique	MQ
Mauritius	MU
Mayotte	YT
Mexico	MX
Micronesia, Federated States of	FM
Moldova	MD
Monaco	MC
Mongolia	MN
Montenegro	ME
Morocco	MA
Myanmar (Burma)	MM
Nepal	NP
New Caledonia	NC
New Zealand	NZ
Nicaragua	NI
Niger	NE
Nigeria	NG
Norfolk Island	NF
Northern Mariana Islands	MP
Norway	NO
Oman	OM
Pakistan	PK
Palau	PW
Papua New Guinea	PG
Paraguay	PY
Peru	PE
Philippines	PH
Poland	PL
Portugal	PT
Puerto Rico	PR
Reunion	RE
Romania	RO
Russia	RU
Saint Barthélemy	BL
Saint Helena	SH
Saint Martin (French part)	MF
Saint Pierre and Miquelon	PM
Saint Vincent and the Grenadines	VC
San Marino	SM
Saudi Arabia	SA
Senegal	SN
Serbia	RS
Singapore	SG
Slovakia	SK
Slovenia	SI
Somalia	SO
South Africa	ZA
South Georgia and the South Sandwich Islands	GS
South Korea	KR
Spain	ES
Sri Lanka	LK
Svalbard and Jan Mayen	SJ
Swaziland	SZ
Sweden	SE
Switzerland	CH
Taiwan	TW
Tajikistan	TJ
Tanzania	TZ
Thailand	TH
The Netherlands	NL
Tunisia	TN
Turkey	TR
Turkmenistan	TM
Turks and Caicos Islands	TC
Ukraine	UA
United Kingdom	GB
United States	US
United States Minor Outlying Islands	UM
Uruguay	UY
U.S. Virgin Islands	VI
Uzbekistan	UZ
Venezuela	VE
Vietnam	VN
Wallis and Futuna	WF
Western Sahara	EH
Zambia	ZM
Country Holidays#
Mapping of holidays that each country observes and it's corresponding ID.

United States	holiday_id
New Years Day	1
Martin Luther King Jr. Day	2
Presidents Day	3
Memorial Day	4
Juneteenth	5
Independence Day	6
Labor Day	7
Columbus Day	8
Veterans Day	9
Thanksgiving Day	10
Christmas Day	11
Canada	holiday_id
Good Friday	12
Easter	13
Victoria Day	14
Canada Day	15
Truth and Reconciliation Day	16
Rememberance Day	17
Civic Holiday	18
Boxing Day	19
New Years Day	20
Labour Day	21
Thanksgiving Day	22
Christmas Day	23