---
tags: [CJ API Docs]
title: CJ API Docs 009
created: '2025-12-31T02:51:08.228Z'
modified: '2025-12-31T02:52:17.906Z'
---

# CJ API Docs 009

# Access Frequency Restrictions | CJ Docs
[#](#access-frequency-restrictions) Access Frequency Restrictions
-----------------------------------------------------------------

Once you got the access token, your application can successfully call the various interfaces provided by the CJ backend to manage or access the resources of the CJ backend.

In order to prevent application errors from causing an abnormal load on the CJ server, by default, each CJ user is limited to a certain rate of interface calls, and when this limit is exceeded, the corresponding interface call will receive a error code.

The following is the current default frequency limit, which may be adjusted by the CJ backend depending on operational conditions.

[#](#base-frequency) Base Frequency
-----------------------------------

1.  No more than 10 requests/second per IP address;
2.  The maximum call frequency for non-login interfaces is 30 requests/second.
3.  Specific interfaces have separate settings:

*   /api2.0/v1/authentication/getAccessToken
    *   Once every 5 minutes
*   /api2.0/v1/authentication/refreshAccessToken
    *   5 times per minute

[#](#special-frequency) Special Frequency
-----------------------------------------

Special settings:

*   The interface restricts user access frequency based on user level:
*   For Free users or the sales level is 0 or 1, it is limited to 1 request/second;
*   For Plus users or the sales level is 2, it is limited to 2 requests/second;
*   For Prime users or the sales level is 3, it is limited to 4 requests/second;
*   For Advanced users or the sales level is 4 or 5, it is limited to 6 requests/second.
