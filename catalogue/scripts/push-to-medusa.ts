#!/usr/bin/env npx tsx
/// <reference types="node" />
/**
 * Push Staged Products from Convex to Medusa
 * 
 * This script reads products from the Convex medusaProducts staging table
 * that are marked as ready to sync, and creates them in Medusa via the Admin API.
 * 
 * Usage:
 *   npx tsx scripts/push-to-medusa.ts
 * 
 * Options:
 *   --dry-run     Show what would be pushed without actually pushing
 *   --limit N     Only push first N products
 *   --product-id  Push a specific Convex medusaProducts ID
 *   --random N    Push N random products (for testing)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

// Configuration
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const MEDUSA_ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const MEDUSA_ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;

// =============================================================================
// PRODUCT TYPE, TAG, AND CATEGORY MAPPINGS
// =============================================================================

// Product Types (created via create-medusa-types.ts)
const PRODUCT_TYPE_IDS: Record<string, string> = {
  "Chandeliers": "ptyp_01KF7331ET11VZXEDJ16AP9S40",
  "Pendants": "ptyp_01KF7331F53JWM7232WC1GB87S",
  "Wall": "ptyp_01KF7331FBRP67VBZN868BDSRJ",
  "Ceiling": "ptyp_01KF7331FGT6NGBQJ6YYJ3TN20",
  "Table & Floor": "ptyp_01KF7331FNH30XX3P0WW8NAJSP",
  "Outdoor": "ptyp_01KF7331FT3ET088R4KFRASG9X",
  "Accessories": "ptyp_01KF7331FZJJ0ZM6WHWB6GD7T5",
};

// Product Tags - LED tag
// Note: LED_TAG_ID is included in SUBCATEGORY_TAG_IDS for unified tag management

// Subcategory Tag IDs (created via create-medusa-tags.ts) - 285 tags total
const SUBCATEGORY_TAG_IDS: Record<string, string> = {
  "LED": "ptag_01KF7331G5EQDVAC94SFNADA62",
  "Accent": "ptag_01KF74WW40X2W2JQYV5ZK940CY",
  "Accent Lamps": "ptag_01KF74WW5TSV3KEDTPFSS8EZZZ",
  "Accent Lighting": "ptag_01KF74WW7M4YCASQX2FJQ96R34",
  "Accent Lights": "ptag_01KF74WW9E0H6P4FBBRS22MZNK",
  "Acrylic": "ptag_01KF74WWB9PEARE4FHGXE8NE24",
  "Acrylic Fixtures": "ptag_01KF74WWD6PDFERF4C28A99SA7",
  "Adjustable": "ptag_01KF74WWF6H0V75F2P8PYNAJCN",
  "Adjustable Lamps": "ptag_01KF74WWH6DW3SQ4B2X5Z0ST8Y",
  "Ambient": "ptag_01KF74WWK5TMCMF3VGXFWJBY3F",
  "Ambient Lighting": "ptag_01KF74WWN5ZBH5BS2ZGKBVMDD2",
  "American Style": "ptag_01KF74WWQ4X1NWXCFEY8WDRZYV",
  "Animal": "ptag_01KF74WWS0X3M3M7JJ1Z3Y4M30",
  "Animal Themed": "ptag_01KF74WWTRZ23PXBX3XNXZHY8M",
  "Antler Fixtures": "ptag_01KF74WWWHF3D8BRRKJ5FSNCHE",
  "Arc Lamps": "ptag_01KF74WWYB4N4TKFDG6YXXCEE4",
  "Aromatherapy": "ptag_01KF74WX0B8BWZD7BR5P0D95WJ",
  "Art Deco": "ptag_01KF74WX26QJFS5DBYZRNQ86CH",
  "Art Glass": "ptag_01KF74WX3Z7KF1EJTQBVH49M2R",
  "Artisan": "ptag_01KF74WX5Q8PF73GN4X5SEN0FC",
  "Artistic": "ptag_01KF74WX7ECHX40QCKP1BZM8KV",
  "Asian Inspired": "ptag_01KF74WX9720A5GW1RXKHVFMFC",
  "Asian Style": "ptag_01KF74WXAZKDGHV38H77Z1SQR5",
  "Asian-Inspired": "ptag_01KF74WXCQTGY19CER1WHPTM4B",
  "Atmosphere Lamps": "ptag_01KF74WXEGD164FW5S2Q860J9Z",
  "Automotive": "ptag_01KF74WXGCGR5K7D8ERGGDJNQ7",
  "Balcony": "ptag_01KF74WXJEZV5CHYCQ7DQ39XKF",
  "Bamboo": "ptag_01KF74WXMFQHMQVRVCTDAEXJA5",
  "Bamboo Accessories": "ptag_01KF74WXPD0KVB767CZTV2EFTT",
  "Bamboo Fixtures": "ptag_01KF74WXR936RHA7QXWNHJMW8F",
  "Bar Lighting": "ptag_01KF74WXTAATTEQETM6Y66D5Y1",
  "Bathroom": "ptag_01KF74WXWCTRR6S460WKXQ0CWX",
  "Bathroom Mirrors": "ptag_01KF74WXYF0HMZWWMW25QKYK8P",
  "Battery Operated": "ptag_01KF74WY0C8852FEJP25KN8R1W",
  "Bedroom": "ptag_01KF74WY2D35JS01005R8GN388",
  "Bedroom Lights": "ptag_01KF74WY4D0S1KBNVEV53K05Q7",
  "Bedside": "ptag_01KF74WY6CHPZH905XZE43586F",
  "Bedside Lamps": "ptag_01KF74WY8DM1T2PB0V2VJ3SPAT",
  "Bedside Lighting": "ptag_01KF74WYAF43EN3NR9B4X8T80F",
  "Bedside Lights": "ptag_01KF74WYCPGCRWYG0EQV21Q5YQ",
  "Bedside Pendants": "ptag_01KF74WYERFEC8E8YZGCH9JKFR",
  "Black Metal": "ptag_01KF74WYGRR41P8WCYVFDKGD31",
  "Bluetooth Speakers": "ptag_01KF74WYJR1E92DZAP62FM7QCJ",
  "Bohemian": "ptag_01KF74WYMT0ZTRE5GV5VRFVF4B",
  "Bohemian Style": "ptag_01KF74WYPXX3C15F5CR1HZ4ZF6",
  "Boho": "ptag_01KF74WYS13XB9GAC60CXT6JHW",
  "Boho Style": "ptag_01KF74WYV4XXRPYSC18H6V4J7W",
  "Botanical": "ptag_01KF74WYX5TJAJ9HVPD0AR79CS",
  "Bowl Style": "ptag_01KF74WYZ7NJTEB2NN88NKK8HE",
  "Brass": "ptag_01KF74WZ17CHW3PS34K7Z0VHC3",
  "Brass Fixtures": "ptag_01KF74WZ384TKFABR23GE7XGAF",
  "Bronze": "ptag_01KF74WZ55Q50441QNM93GR00Q",
  "Butterfly": "ptag_01KF74WZ75Y7TYJJ050FV1AE1Z",
  "Cafe & Restaurant": "ptag_01KF74WZ96PH7WEVP8GF3B350J",
  "Cartoon": "ptag_01KF74WZB8XZVJB5K07HWN2W7H",
  "Ceiling": "ptag_01KF74WZDA5C4731RNCRTR4G6E",
  "Ceiling Fans": "ptag_01KF74WZFCTSVP981PNBMG6CM4",
  "Ceiling Fixtures": "ptag_01KF74WZHFGA6DG1TTMRV94C09",
  "Ceiling Lights": "ptag_01KF74WZKNVGJBSCT91MDTRA2J",
  "Ceiling Mount": "ptag_01KF74WZNQKNRY3N1VM7WBQCMN",
  "Ceiling Mounted": "ptag_01KF74WZQR34DHTFE647ZGWNB7",
  "Ceramic": "ptag_01KF74WZSSTPZS8DX8NNJMHHPH",
  "Chandeliers": "ptag_01KF74WZVQHPNBFR2FT4QZZTT4",
  "Classic": "ptag_01KF74WZXJZC5FZMYQ9CFJFCV2",
  "Classical": "ptag_01KF74WZZDY0EVR3BYBARFQTF3",
  "Coastal": "ptag_01KF74X017C7AS5FCMZ9428C6B",
  "Colonial Style": "ptag_01KF74X0378T6D7Q8K7PDV9808",
  "Color Changing": "ptag_01KF74X053QVQSNK61Q6E5Z7TX",
  "Colored Fixtures": "ptag_01KF74X07429FPZZMPCV29YSAC",
  "Colored Glass": "ptag_01KF74X097D3V4CGZ14VJH9F61",
  "Colorful": "ptag_01KF74X0B72ESFDK8RC10GQVJN",
  "Commercial": "ptag_01KF74X0D7SKTEBKWAXQRPEFYR",
  "Concrete": "ptag_01KF74X0FBZHKW36QWM95JDVHH",
  "Connected Lighting": "ptag_01KF74X0HB6VP8PN5Q0YW7S008",
  "Contemporary": "ptag_01KF74X0K6Q0PW9HQBMHP33J5F",
  "Contemporary Sconces": "ptag_01KF74X0N3F94H35ZANMQKQXMZ",
  "Copper": "ptag_01KF74X0Q3AG0Z4AWSJN6HP9TD",
  "Copper Accents": "ptag_01KF74X0S4TCB1Y5CMNDXW71RP",
  "Copper Fixtures": "ptag_01KF74X0V5MFETYJP6Q9WJ6DVZ",
  "Copper/Brass": "ptag_01KF74X0X977KMC6XPDDV9RJ5N",
  "Corner Lamps": "ptag_01KF74X0ZBH9CX96WVTX9DSFEF",
  "Corridor": "ptag_01KF74X11DWCMKG6M9X5S7H9DM",
  "Corridor Lights": "ptag_01KF74X13CQQA8V7RWQCGX3CYD",
  "Country Style": "ptag_01KF74X15BYPQYQHKJVWZ1WYDJ",
  "Covered Areas": "ptag_01KF74X17BS1P9A2DH5CR597BE",
  "Creative": "ptag_01KF74X19BGXJKYWJB5W33Z2WG",
  "Creative Design": "ptag_01KF74X1BESZ2TWXZ1F6AQHJFM",
  "Crystal": "ptag_01KF74X1DGCX07AP9BW3X6WTMT",
  "Crystal Fixtures": "ptag_01KF74X1FNQPT6WZAC3X465TKP",
  "Custom": "ptag_01KF74X1HP5NK72SBHAPEKQPQ6",
  "Decorative": "ptag_01KF74X1KNTQC9BVNJNPQVDMM9",
  "Decorative Lamps": "ptag_01KF74X1NFS7CVQDYJNE6N9TJD",
  "Designer": "ptag_01KF74X1Q7EJM0Z17V0EEJ9SZV",
  "Desk Lamps": "ptag_01KF74X1RZ85C7W839MNYDZ47S",
  "Dimmable": "ptag_01KF74X1V0727FKA58MNNHR4FF",
  "Dining Room": "ptag_01KF74X1WVDJ1PMVMAPZKS10EP",
  "Downlights": "ptag_01KF74X1YM08HQDE4HP5XTP2F0",
  "Edison Style": "ptag_01KF74X20D4K48DP68QX2550PR",
  "Ethnic": "ptag_01KF74X2262SBKA0DGS194YPQB",
  "European Style": "ptag_01KF74X240KVNBV9WSGWF4QS5K",
  "Exterior": "ptag_01KF74X25TNEHCJ3EENE8S3G9J",
  "Eye Care": "ptag_01KF74X27S2EDZFA1TTVRZ8B2W",
  "Fabric": "ptag_01KF74X29T901Y3H49423PRJJ2",
  "Fairy Lights": "ptag_01KF74X2BX7ZW0W2SXXNFFV9J6",
  "Farmhouse": "ptag_01KF74X2DVQE89V1KBCVGP7C4Q",
  "Farmhouse Style": "ptag_01KF74X2FW4GWV5118S2TGQ6RM",
  "Feather": "ptag_01KF74X2HWFGEY4C8FJBM5JT93",
  "Festive": "ptag_01KF74X2KZDA8R1YVDA8RX79X6",
  "Fire/Flame Effect": "ptag_01KF74X2NZF4DK0Z8T2GGTV3G5",
  "Flameless": "ptag_01KF74X2R2MKFC4RF54SHFWJWS",
  "Floor Lamps": "ptag_01KF74X2T6CZM0XMRE29MHEVWY",
  "Floral": "ptag_01KF74X2W9KGCTEA7ZFDCNQXG1",
  "Flush Mount": "ptag_01KF74X2YAXEPZF8DRM1ZTJTY9",
  "Folding": "ptag_01KF74X30C9E3GBAXFQPRZF80P",
  "French Country": "ptag_01KF74X32C06RB1QWDEC4PXJ6C",
  "French Style": "ptag_01KF74X34EXB5G830RPTEHYKS4",
  "Frosted Glass": "ptag_01KF74X36GXV6YBKSWYMY34PPW",
  "Functional": "ptag_01KF74X38JJVNSCDTM5SYDXB4F",
  "Futuristic": "ptag_01KF74X3AKJXD0JBD380ZCCSKV",
  "Garden": "ptag_01KF74X3CGCCEXPQMCT31C6NC3",
  "Garden Decor": "ptag_01KF74X3EGD4B85A66B95ZGSKN",
  "Garden Lighting": "ptag_01KF74X3GH6J4APDVH60RAFP6Q",
  "Geometric": "ptag_01KF74X3JMF6WCM5TYFXGXEM70",
  "Gift Items": "ptag_01KF74X3MMYQ5CF9Q4SXSMHA0M",
  "Glass": "ptag_01KF74X3PM6EDVAYVAZPW4TVP2",
  "Glass Fixtures": "ptag_01KF74X3RKQ4Q860JBRXANPFZQ",
  "Globe Style": "ptag_01KF74X3TK1ZAV8Q1BCQWFXDW3",
  "Gold Finish": "ptag_01KF74X3WFPQ3XBV7Q092XFJD6",
  "Gothic": "ptag_01KF74X3Y97NGVPEAA0J3VAKT5",
  "Ground Lights": "ptag_01KF74X4075F370RT69NRFASP0",
  "Hallway": "ptag_01KF74X42848CQN098RQAJS568",
  "Hallway Lights": "ptag_01KF74X44A0QDGQBHZJ6CWDC66",
  "Hanging": "ptag_01KF74X46DF47KB0K90PM09AJM",
  "Hanging Decor": "ptag_01KF74X48CBVBR70J3S1G0GZM5",
  "Himalayan Salt": "ptag_01KF74X4AEPTCFBDQC611XEB9Y",
  "Holiday": "ptag_01KF74X4CGFFKRXFXBHMWAMXJ0",
  "Holiday Lighting": "ptag_01KF74X4EG4JE2Y0S0M6AN14WA",
  "Home Decor": "ptag_01KF74X4GDDSPG1Q6DY9KHGPBX",
  "Home Office": "ptag_01KF74X4J9RHAGJASKEFS2S018",
  "Hotel Style": "ptag_01KF74X4M8Z3DDRM5BRNW9E6C5",
  "Industrial": "ptag_01KF74X4P8WVN9THP4762S9Y38",
  "Island Lights": "ptag_01KF74X4R90REX6JYTCA4S8A1S",
  "Japanese Style": "ptag_01KF74X4TAP6ZPMPESJFQDF0HE",
  "Kids Room": "ptag_01KF74X4WCXQ0PE2WSHX505J23",
  "Kitchen": "ptag_01KF74X4YD5A4JH67VFG13YQ4R",
  "Kitchen Pendants": "ptag_01KF74X50DJNBN3FFM3BCKTZFB",
  "Lamp Bases": "ptag_01KF74X52E7CJB1QT44HDMTS9T",
  "Landscape": "ptag_01KF74X54G81MHMD61P0X403CR",
  "Lantern Style": "ptag_01KF74X56CYRWDWWZVPVXGQ4VG",
  "Lanterns": "ptag_01KF74X586XHYQFPCG7NFCCQBS",
  "Large": "ptag_01KF74X5A6GQNQBSDDJV2F54CC",
  "Laundry Room": "ptag_01KF74X5C7FYQVVGW4TCZGH33W",
  "LED Fixtures": "ptag_01KF74X5E8GHPT7GR6SN7R8D4P",
  "LED Strip": "ptag_01KF74X5G9HCD9NARBZA0KH5T9",
  "Lighting": "ptag_01KF74X5JAB2D9AFDPKMFCNT6C",
  "Linear": "ptag_01KF74X5MBXMNJ74A00KTBCGVF",
  "Living Room": "ptag_01KF74X5PCAZNT6EGJ5PVBJSA7",
  "Loft Style": "ptag_01KF74X5RGTHPB3PG6NY61HHJ7",
  "Long Pendants": "ptag_01KF74X5TGM6VFSHBJTPABN6ZQ",
  "Luxury": "ptag_01KF74X5WJVRDXBH0MNW0THA1E",
  "Luxury Fixtures": "ptag_01KF74X5YN2W3Z0XKQKST11Q03",
  "Macrame": "ptag_01KF74X60KMFD621H9VMK09R9C",
  "Marble": "ptag_01KF74X62GHS53M4FKHT4H9TPQ",
  "Mediterranean": "ptag_01KF74X64FZAT2X7XBQNJBK0YG",
  "Metal": "ptag_01KF74X66CM3REM0E5E6ZA5GEY",
  "Metal Fixtures": "ptag_01KF74X68CY5GAC5RTB4QY8F5H",
  "Mid-Century": "ptag_01KF74X6A6MP7CJNJQS6SKH9QX",
  "Mid-Century Modern": "ptag_01KF74X6C46TY89FSJMPBX2K02",
  "Minimalist": "ptag_01KF74X6E4RAW5GADZGPGNGHVK",
  "Modern": "ptag_01KF74X6G1APV3ZEE6PPCZC3JA",
  "Moroccan": "ptag_01KF74X6HVC8V32T8J381H191J",
  "Motion Sensor": "ptag_01KF74X6KKM6ZZEDSEHQAZC4XH",
  "Multi-Head": "ptag_01KF74X6NC96CDES7A64XTKYPA",
  "Multi-Light": "ptag_01KF74X6QCK6QBNSBGE18F8ENK",
  "Music Sync": "ptag_01KF74X6SB6JKGFB8Z3375NEW1",
  "Natural": "ptag_01KF74X6V6C63DHPNDX3PDBV5E",
  "Natural Materials": "ptag_01KF74X6X07V64FN833X9KXFTQ",
  "Nautical": "ptag_01KF74X6YS2H8E7AAKJZZ268ZF",
  "Neon Signs": "ptag_01KF74X70HW4ZAN2DFAPTXP085",
  "Night Lights": "ptag_01KF74X72BCDM5T9XCKAKB0F1T",
  "Nordic": "ptag_01KF74X745MKREKEQY6T1W9Z84",
  "Nordic Style": "ptag_01KF74X763RX9CVBVP1QKS6D75",
  "Novelty": "ptag_01KF74X7828FNV7B0VTG1C070K",
  "Nursery": "ptag_01KF74X7A41CFKWFBX8SXX52FE",
  "Office": "ptag_01KF74X7C6BAPPP2FK4W976N8V",
  "Ornate": "ptag_01KF74X7EAWJ00QY256E5R7Y9C",
  "Outdoor": "ptag_01KF74X7GEZ47E3SWR9XFB8B2W",
  "Outdoor Decor": "ptag_01KF74X7JF1TRN6F5VHBGXSYJY",
  "Outdoor Living": "ptag_01KF74X7MG4FCKMQTFDCE97HJM",
  "Outdoor Walls": "ptag_01KF74X7PJHJ9EBJQ49PHQ3AJQ",
  "Paper": "ptag_01KF74X7RM10A43J3J7ZBTNEYB",
  "Party Lights": "ptag_01KF74X7TMEY38HHY3VJV06SDX",
  "Pathway": "ptag_01KF74X7WNXZ261YNTN5GYYAP3",
  "Pathway Lights": "ptag_01KF74X7YHZ9J8D585Q6DE3730",
  "Patio": "ptag_01KF74X80HRR4CQX7YBENS9NV2",
  "Pendant": "ptag_01KF74X82K6B0SNY2SQWHWJKKK",
  "Pendant Lights": "ptag_01KF74X84N611DTNNW3F70KZQE",
  "Picture Lights": "ptag_01KF74X86TZ9CPSK2Y0ABHCBKR",
  "Plug-In": "ptag_01KF74X88W0XN1TSEX4HN9GTPC",
  "Pool Area": "ptag_01KF74X8AZR5QQF2ZWFAR6FVST",
  "Porch": "ptag_01KF74X8D0HS8ZQZW3YRDC36ZF",
  "Portable": "ptag_01KF74X8F1TFF2ZQ2RBJVQ8DZC",
  "Post Lights": "ptag_01KF74X8H13F3DDGGM7T7KPK6N",
  "Postmodern": "ptag_01KF74X8K25CG3Q8GMGCNQZYR2",
  "Projection": "ptag_01KF74X8N2ZYA7M121XFAY7PRS",
  "Rattan": "ptag_01KF74X8Q4PMCX17E04K6GW7HT",
  "Reading Lamps": "ptag_01KF74X8S3X3J7ZR0YRJ7NJEQF",
  "Rechargeable": "ptag_01KF74X8V28H7GNTYKXD5KT2WQ",
  "Reclaimed Materials": "ptag_01KF74X8X32ACCRG5ZTJ9KMPEY",
  "Remote Control": "ptag_01KF74X8Z78CTFNBMFC3C0E2D3",
  "Restaurant": "ptag_01KF74X9127FZ5NGMQB92XJDBZ",
  "Retro": "ptag_01KF74X92XZH0A9V3KD7XGJTGG",
  "Ring Style": "ptag_01KF74X94Z5JBKWH1T34NYRYBA",
  "Romantic": "ptag_01KF74X971DX67FH0S71WV7N10",
  "Rope": "ptag_01KF74X991BNRZ8GW3EKXGJJH9",
  "Rustic": "ptag_01KF74X9B1FMYK74943EXAV7B6",
  "Rustic Style": "ptag_01KF74X9D0EQCSJ355JC08H5WA",
  "Scandinavian": "ptag_01KF74X9F0RTK1JXV5V77XPR17",
  "Sconces": "ptag_01KF74X9GZAVBSEZ4EJHPAHJRM",
  "Sculptural": "ptag_01KF74X9JX0CC982KT5YKPF36W",
  "Semi-Flush": "ptag_01KF74X9MXNY6EZDV3DDTR89A8",
  "Sensor Lights": "ptag_01KF74X9PY5JTFTVRVSMYDRSNG",
  "Shabby Chic": "ptag_01KF74X9RYPA9QA2T9ZGRE94RE",
  "Shades": "ptag_01KF74X9TYC9J4P5J3M5GMAD7H",
  "Simple": "ptag_01KF74X9WVQAEAD68V82HG5X9F",
  "Single Pendant": "ptag_01KF74X9YY9F08AZWB02SMA3PR",
  "Smart": "ptag_01KF74XA0ZSRP10YZXQZ86RC0E",
  "Smart Home": "ptag_01KF74XA2YNT6Z5P6YRQQ7GKBM",
  "Smart Lighting": "ptag_01KF74XA4YJXJE76S0PPGFJKJA",
  "Solar": "ptag_01KF74XA6ZDCBFF5BSCB3ZHBQB",
  "Solar Lights": "ptag_01KF74XA91Z3MT6XGCQR67VY9Q",
  "Solar Powered": "ptag_01KF74XAB113CCM2HVHFZVGKRJ",
  "Specialty": "ptag_01KF74XAD0DPZNQQNHCXJERNTG",
  "Spiral": "ptag_01KF74XAF0HVZYXQQ0PMC3D2G6",
  "Spotlights": "ptag_01KF74XAH0XDMX4FHJ9SANW1AD",
  "Stained Glass": "ptag_01KF74XAK08WAG0DSE7V52WBJK",
  "Staircase": "ptag_01KF74XAN096G88TRX2GN0KEJ5",
  "Staircase Lights": "ptag_01KF74XAQ0C9GS0V18PNJ63SM7",
  "Stairway": "ptag_01KF74XAS0MZ35A3CD34CNY9E6",
  "Steampunk": "ptag_01KF74XAV0NEXFAHTAJE7GC39Z",
  "String Lights": "ptag_01KF74XAX0P717H9GP62DR4WMP",
  "Study": "ptag_01KF74XAZ1D77507Y9176SF597",
  "Study Lamps": "ptag_01KF74XB15EDVJFCT596PWNW3N",
  "Swing Arm": "ptag_01KF74XB369JJ3A1Y229T1X8M9",
  "Table Lamps": "ptag_01KF74XB57YWA3FJG0W4BPECWS",
  "Task Lighting": "ptag_01KF74XB78W6ZW812T9VT4M8H9",
  "Task Lights": "ptag_01KF74XB978SDCEG7XCB6NJPGY",
  "Themed": "ptag_01KF74XBB4R43A0P9Y584YJAJQ",
  "Tiffany Style": "ptag_01KF74XBD0DENJSHM6V6FAD8FA",
  "Touch Control": "ptag_01KF74XBESA7HMQ1RBTJGET0HW",
  "Traditional": "ptag_01KF74XBGJWCYTBS6HB2QN8HVM",
  "Traditional Style": "ptag_01KF74XBJCT35RYZKTM90TEQD5",
  "Tree Lights": "ptag_01KF74XBM9VB6AGJVX67TBFF2C",
  "Tripod Lamps": "ptag_01KF74XBP569Q6PG3SG77QZGEE",
  "Tropical": "ptag_01KF74XBR5HKV8KS6DAMQGKD2Q",
  "Tube Lights": "ptag_01KF74XBSZ605G9BQXHV7PSR1A",
  "Underwater": "ptag_01KF74XBVPHJEYKT7E35W64K6R",
  "Unique": "ptag_01KF74XBXF59E6MB2ECAA41N6B",
  "Uplights": "ptag_01KF74XBZ9GSRMXXX0EXEMTANP",
  "Urban": "ptag_01KF74XC1BW0W3F0JBKEYMYQQE",
  "USB Powered": "ptag_01KF74XC3B2E2EN67KVAJXVTP0",
  "Vanity": "ptag_01KF74XC5CWMY6NPC0P1ZC8R9S",
  "Vanity Lighting": "ptag_01KF74XC7DJ0B1984EANZYXHFD",
  "Vanity Lights": "ptag_01KF74XC9BVPX040JS4KZ8BFJJ",
  "Vanity Mirrors": "ptag_01KF74XCBAFNGJ4W01XT40Q67K",
  "Victorian": "ptag_01KF74XCD6DJT8WS6WQFH5V1MD",
  "Village Style": "ptag_01KF74XCF6J4YBW1D57S2CB6F0",
  "Vintage": "ptag_01KF74XCH5R8BWTNPSSCJ33WKR",
  "Vintage Style": "ptag_01KF74XCK5GMPHXXRAPZ953APB",
  "Wall": "ptag_01KF74XCN686WS722WHSKDC92J",
  "Wall Art": "ptag_01KF74XCQ8SKAG7KTZ8NCXS1GT",
  "Wall Decor": "ptag_01KF74XCSB5ACR6RKRSD7V65EN",
  "Wall Fixtures": "ptag_01KF74XCV76YMV9NKRM8HZP2GZ",
  "Wall Lamps": "ptag_01KF74XCX5WGNCKPA2CNSCAW4J",
  "Wall Mounted": "ptag_01KF74XCZ5SB2T4SK06883Z0YW",
  "Wall Sconces": "ptag_01KF74XD1686NTCF4DPQVMHBCZ",
  "Waterproof": "ptag_01KF74XD35DVXGPJHC00HJX04N",
  "Weatherproof": "ptag_01KF74XD58CGDJ9V1N2VC2XVQP",
  "Wedding": "ptag_01KF74XD72BTT674PYQYQ3KERM",
  "Wedding Decor": "ptag_01KF74XD8WJT7Y5F1DD8GNZDV8",
  "Wireless": "ptag_01KF74XDAP5KND51Z291XT4Q4E",
  "Wood": "ptag_01KF74XDCP4R8XDMBJJRV6MCVG",
  "Wood Fixtures": "ptag_01KF74XDEPY7MTQGQ9S5TRDMJA",
  "Wooden": "ptag_01KF74XDGQHQA09NXHFFMDYES8",
  "Wrought Iron": "ptag_01KF74XDJPPA5W14BWJGTAWJZE",
};

// Main Category IDs (created via create-medusa-categories.ts)
const CATEGORY_IDS: Record<string, string> = {
  "Chandeliers": "pcat_01KF736S869NMN0XA35AA07XPM",
  "Pendants": "pcat_01KF73711R8NF7FV7BKB96PWA6",
  "Wall": "pcat_01KF7375B8QDW6HP07AHYCKZQ8",
  "Ceiling": "pcat_01KF737B8B0SPRD4DV9W2RGTM8",
  "Table & Floor": "pcat_01KF737DY59JFQDPA35FTCZ7HM",
  "Outdoor": "pcat_01KF737MPK7JZFATG1DBV0RBC8",
  "Accessories": "pcat_01KF737PCZPCQ39EMRNTJHQT9B",
};

// Collection IDs (created via create-medusa-collections.ts)
// Each collection mirrors a main category for easy product grouping
const COLLECTION_IDS: Record<string, string> = {
  "Chandeliers": "pcol_01KF768J0QE6XBWRTS1TT3H0VB",
  "Pendants": "pcol_01KF768J2H911VGF1NF6CQQR26",
  "Wall": "pcol_01KF768J4AJFEPWG2R8DARQMKN",
  "Ceiling": "pcol_01KF768J66BBN019ZT861X7PWM",
  "Table & Floor": "pcol_01KF768J83WCFA7QY898Y1J0ZW",
  "Outdoor": "pcol_01KF768JA0ACV347S4661J4D7A",
  "Accessories": "pcol_01KF768JBY5KVN9QHV9R1FPVTH",
};

// =============================================================================
// AUTHENTICATION
// =============================================================================

// Store session token after authentication
let authToken: string | null = null;

async function authenticateWithMedusa(): Promise<boolean> {
  if (!MEDUSA_ADMIN_EMAIL || !MEDUSA_ADMIN_PASSWORD) {
    console.error('❌ MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD must be set');
    return false;
  }
  
  try {
    // First, get a session by logging in
    const response = await fetch(`${MEDUSA_BACKEND_URL}/auth/user/emailpass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: MEDUSA_ADMIN_EMAIL,
        password: MEDUSA_ADMIN_PASSWORD,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Authentication failed: ${response.status} - ${errorText}`);
      return false;
    }
    
    const result = await response.json();
    authToken = result.token;
    console.log('✅ Authenticated with Medusa Admin API');
    return true;
  } catch (error) {
    console.error('❌ Authentication error:', error instanceof Error ? error.message : error);
    return false;
  }
}

interface StagedProduct {
  _id: Id<"medusaProducts">;
  title: string;
  handle: string;
  externalId: string; // CJ product ID
  status: 'draft' | 'proposed' | 'published' | 'rejected';
  isGiftcard: boolean;
  discountable: boolean;
  description?: string;
  thumbnail?: string;
  weight?: string;
  length?: string;
  height?: string;
  width?: string;
  originCountry?: string;
  hsCode?: string;
  material?: string;
  metadata?: Record<string, unknown>;
  variants: {
    _id: Id<"medusaProductVariants">;
    title: string;
    sku?: string;
    allowBackorder: boolean;
    manageInventory: boolean;
    weight?: number;
    length?: number;
    height?: number;
    width?: number;
    options?: Record<string, string>;
    prices: {
      currencyCode: string;
      amount: number;
    }[];
  }[];
  images: {
    url: string;
    rank: number;
  }[];
}

interface MedusaProductPayload {
  title: string;
  handle?: string;
  external_id?: string;
  status?: string;
  is_giftcard?: boolean;
  discountable?: boolean;
  description?: string;
  thumbnail?: string;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  origin_country?: string;
  hs_code?: string;
  material?: string;
  metadata?: Record<string, unknown>;
  images?: { url: string }[];
  options?: { title: string; values: string[] }[];
  variants?: {
    title: string;
    sku?: string;
    allow_backorder?: boolean;
    manage_inventory?: boolean;
    weight?: number;
    length?: number;
    height?: number;
    width?: number;
    prices?: { currency_code: string; amount: number }[];
    options?: Record<string, string>;
  }[];
  // New: Product type, tags, categories, and collection
  type_id?: string;
  tags?: { id: string }[];
  categories?: { id: string }[];
  collection_id?: string;
}

// Helper to get classification from product metadata
function getClassification(product: StagedProduct): { mainType?: string; isLED?: boolean; subcategories?: string[] } {
  const metadata = product.metadata as { classification?: { mainType?: string; isLED?: boolean; subcategories?: string[] } } | undefined;
  return metadata?.classification || {};
}

async function createProductInMedusa(
  product: StagedProduct,
  dryRun: boolean
): Promise<{ success: boolean; medusaId?: string; variantMappings?: { convexVariantId: Id<"medusaProductVariants">; medusaVariantId: string }[]; error?: string }> {
  
  // Get classification data
  const classification = getClassification(product);
  
  // Transform to Medusa API format
  const payload: MedusaProductPayload = {
    title: product.title,
    handle: product.handle,
    status: product.status,
    is_giftcard: product.isGiftcard,
    discountable: product.discountable,
    description: product.description || '',
    thumbnail: product.thumbnail,
    metadata: product.metadata,
    external_id: product.externalId, // CJ product ID for reference
  };
  
  // Add Product Type based on classification
  if (classification.mainType && PRODUCT_TYPE_IDS[classification.mainType]) {
    payload.type_id = PRODUCT_TYPE_IDS[classification.mainType];
  }
  
  // Add tags for all subcategories + LED if applicable
  const tags: { id: string }[] = [];
  if (classification.subcategories && classification.subcategories.length > 0) {
    for (const subcategory of classification.subcategories) {
      if (SUBCATEGORY_TAG_IDS[subcategory]) {
        tags.push({ id: SUBCATEGORY_TAG_IDS[subcategory] });
      }
    }
  }
  if (classification.isLED && !tags.find(t => t.id === SUBCATEGORY_TAG_IDS["LED"])) {
    // Add LED tag if not already added (LED might be in subcategories too)
    tags.push({ id: SUBCATEGORY_TAG_IDS["LED"] });
  }
  if (tags.length > 0) {
    payload.tags = tags;
  }
  
  // Add main category based on mainType
  if (classification.mainType && CATEGORY_IDS[classification.mainType]) {
    payload.categories = [{ id: CATEGORY_IDS[classification.mainType] }];
    // Note: Subcategories could be added here too if we have their IDs cached
  }
  
  // Add to collection (mirrors the category)
  if (classification.mainType && COLLECTION_IDS[classification.mainType]) {
    payload.collection_id = COLLECTION_IDS[classification.mainType];
  }
  
  // Add physical attributes
  // Material: use stored material, or extract from metadata.extractedSpecs
  if (product.material) {
    payload.material = product.material;
  } else if (product.metadata?.extractedSpecs && typeof product.metadata.extractedSpecs === 'object') {
    const specs = product.metadata.extractedSpecs as Record<string, string>;
    if (specs.Material) {
      payload.material = specs.Material;
    }
  }
  
  // Origin country: default to CN for all CJ products
  payload.origin_country = product.originCountry || 'CN';
  
  // Weight (convert string to number if needed)
  if (product.weight) {
    const weight = typeof product.weight === 'string' ? parseFloat(product.weight) : product.weight;
    if (!isNaN(weight)) payload.weight = weight;
  }
  
  // Dimensions (convert string to number if needed)
  if (product.length) {
    const length = typeof product.length === 'string' ? parseFloat(product.length) : product.length;
    if (!isNaN(length)) payload.length = length;
  }
  if (product.height) {
    const height = typeof product.height === 'string' ? parseFloat(product.height) : product.height;
    if (!isNaN(height)) payload.height = height;
  }
  if (product.width) {
    const width = typeof product.width === 'string' ? parseFloat(product.width) : product.width;
    if (!isNaN(width)) payload.width = width;
  }
  
  // HS Code if available
  if (product.hsCode) {
    payload.hs_code = product.hsCode;
  }
  
  // Add images
  if (product.images && product.images.length > 0) {
    payload.images = product.images
      .sort((a, b) => a.rank - b.rank)
      .map(img => ({ url: img.url }));
  }
  
  // Add options and variants
  // Medusa v2 requires at least one option for products with variants
  if (product.variants && product.variants.length > 0) {
    // Build options dynamically from variant options data
    // Collect all unique option titles and their values
    const optionsMap = new Map<string, Set<string>>();
    
    for (const variant of product.variants) {
      if (variant.options) {
        for (const [optionTitle, optionValue] of Object.entries(variant.options)) {
          if (!optionsMap.has(optionTitle)) {
            optionsMap.set(optionTitle, new Set());
          }
          optionsMap.get(optionTitle)!.add(optionValue);
        }
      }
    }
    
    // If no options found in variants, fall back to Default
    if (optionsMap.size === 0) {
      const uniqueVariantTitles = [...new Set(product.variants.map(v => v.title))];
      payload.options = [{
        title: 'Default',
        values: uniqueVariantTitles.length > 0 ? uniqueVariantTitles : ['Default'],
      }];
    } else {
      // Build options array from collected data
      payload.options = Array.from(optionsMap.entries()).map(([title, values]) => ({
        title,
        values: Array.from(values),
      }));
    }
    
    payload.variants = product.variants.map(variant => {
      const v: MedusaProductPayload['variants'][0] = {
        title: variant.title,
        sku: variant.sku,
        allow_backorder: variant.allowBackorder,
        manage_inventory: variant.manageInventory,
        // Use variant's options if available, otherwise fallback to Default
        options: variant.options || { Default: variant.title },
      };
      
      if (variant.weight) v.weight = variant.weight;
      if (variant.length) v.length = variant.length;
      if (variant.height) v.height = variant.height;
      if (variant.width) v.width = variant.width;
      
      // Add prices
      if (variant.prices && variant.prices.length > 0) {
        v.prices = variant.prices.map(p => ({
          currency_code: p.currencyCode.toLowerCase(),
          amount: p.amount, // Already in cents
        }));
      }
      
      return v;
    });
  }
  
  if (dryRun) {
    console.log('   📋 Payload:', JSON.stringify(payload, null, 2));
    return { success: true, medusaId: 'dry-run-id' };
  }
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${MEDUSA_BACKEND_URL}/admin/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   HTTP Error ${response.status}:`, errorText.substring(0, 500));
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      return { success: false, error: errorMessage };
    }
    
    const result = await response.json();
    const createdProduct = result.product;
    
    // Map variant IDs
    const variantMappings: { convexVariantId: Id<"medusaProductVariants">; medusaVariantId: string }[] = [];
    
    if (createdProduct.variants && product.variants) {
      // Match by SKU or order
      for (let i = 0; i < product.variants.length; i++) {
        const convexVariant = product.variants[i];
        const medusaVariant = createdProduct.variants.find(
          (mv: { sku?: string }) => mv.sku === convexVariant.sku
        ) || createdProduct.variants[i];
        
        if (medusaVariant) {
          variantMappings.push({
            convexVariantId: convexVariant._id,
            medusaVariantId: medusaVariant.id,
          });
        }
      }
    }
    
    return { 
      success: true, 
      medusaId: createdProduct.id,
      variantMappings,
    };
    
  } catch (error) {
    console.error('   Full error:', error);
    if (error && typeof error === 'object' && 'message' in error) {
      return { success: false, error: (error as Error).message };
    }
    return { 
      success: false, 
      error: String(error) || 'An unknown error occurred.' 
    };
  }
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   Convex → Medusa Push Script');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    limit: 10,
    productId: '',
    random: 0,
    category: '',
  };

  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    options.limit = parseInt(args[limitIndex + 1], 10);
  }
  
  const productIdIndex = args.indexOf('--product-id');
  if (productIdIndex !== -1 && args[productIdIndex + 1]) {
    options.productId = args[productIdIndex + 1];
  }
  
  const randomIndex = args.indexOf('--random');
  if (randomIndex !== -1 && args[randomIndex + 1]) {
    options.random = parseInt(args[randomIndex + 1], 10);
  }
  
  const categoryIndex = args.indexOf('--category');
  if (categoryIndex !== -1 && args[categoryIndex + 1]) {
    options.category = args[categoryIndex + 1];
  }

  console.log('Options:', options);
  console.log('');

  // Validate configuration
  if (!CONVEX_URL) {
    console.error('❌ Error: NEXT_PUBLIC_CONVEX_URL environment variable not set');
    process.exit(1);
  }

  const convex = new ConvexHttpClient(CONVEX_URL);
  
  console.log(`🔗 Convex URL: ${CONVEX_URL}`);
  console.log(`🏪 Medusa Backend: ${MEDUSA_BACKEND_URL}`);
  console.log('');

  try {
    // Authenticate with Medusa (unless dry-run)
    if (!options.dryRun) {
      const authenticated = await authenticateWithMedusa();
      if (!authenticated) {
        console.error('❌ Failed to authenticate with Medusa');
        process.exit(1);
      }
      console.log('');
    }
    
    // Get products ready to sync
    let products: StagedProduct[];
    
    if (options.productId) {
      // Fetch specific product
      const product = await convex.query(api.medusaStaging.getProductWithChildren, {
        productId: options.productId as Id<"medusaProducts">,
      });
      
      if (!product) {
        console.error(`❌ Product not found: ${options.productId}`);
        process.exit(1);
      }
      
      products = [product as StagedProduct];
      console.log(`📦 Fetched specific product: ${product.title}`);
    } else if (options.random > 0) {
      // Fetch random products from all products (not just ready to sync)
      console.log(`🎲 Selecting ${options.random} random products${options.category ? ` from category: ${options.category}` : ''}...`);
      const allProducts = await convex.query(api.medusaStaging.getAllProducts, {
        limit: 1000,
      });
      
      // Filter to only products with classification (and optionally by category)
      const classifiedProducts = allProducts.filter(p => {
        const meta = p.metadata as { classification?: { mainType?: string } } | undefined;
        const mainType = meta?.classification?.mainType;
        if (!mainType) return false;
        if (options.category && mainType !== options.category) return false;
        return true;
      });
      
      // Shuffle and pick random
      const shuffled = classifiedProducts.sort(() => Math.random() - 0.5);
      const randomIds = shuffled.slice(0, options.random).map(p => p._id);
      
      // Fetch with children
      products = [];
      for (const id of randomIds) {
        const product = await convex.query(api.medusaStaging.getProductWithChildren, {
          productId: id,
        });
        if (product) {
          products.push(product as StagedProduct);
        }
      }
      
      console.log(`📦 Selected ${products.length} random classified products`);
    } else {
      // Fetch products ready to sync
      products = await convex.query(api.medusaStaging.getProductsReadyToSync, {
        limit: options.limit,
      }) as StagedProduct[];
      console.log(`📦 Found ${products.length} products ready to sync`);
    }
    
    if (products.length === 0) {
      console.log('');
      console.log('⚠️  No products found.');
      console.log('   Use --random N to push random products, or mark products ready with markReadyToSync.');
      console.log('');
      process.exit(0);
    }
    
    console.log('');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const product of products) {
      const classification = getClassification(product);
      
      console.log(`📤 Pushing: ${product.title}`);
      console.log(`   Handle: ${product.handle}`);
      console.log(`   Type: ${classification.mainType || 'None'} ${classification.isLED ? '[LED]' : ''}`);
      console.log(`   Variants: ${product.variants?.length || 0}`);
      console.log(`   Images: ${product.images?.length || 0}`);
      
      // Mark as syncing
      if (!options.dryRun) {
        await convex.mutation(api.medusaStaging.updateSyncStatus, {
          medusaProductId: product._id,
          status: 'syncing',
        });
      }
      
      const result = await createProductInMedusa(product, options.dryRun);
      
      if (result.success) {
        console.log(`   ✅ Success! Medusa ID: ${result.medusaId}`);
        successCount++;
        
        // Update sync status
        if (!options.dryRun) {
          await convex.mutation(api.medusaStaging.updateSyncStatus, {
            medusaProductId: product._id,
            status: 'synced',
            medusaId: result.medusaId,
            variantMappings: result.variantMappings,
          });
        }
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
        failCount++;
        
        // Update sync status
        if (!options.dryRun) {
          await convex.mutation(api.medusaStaging.updateSyncStatus, {
            medusaProductId: product._id,
            status: 'failed',
            error: result.error,
          });
        }
      }
      
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Done! Success: ${successCount}, Failed: ${failCount}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
