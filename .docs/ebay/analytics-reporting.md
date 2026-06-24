# Analytics and Reporting Guide

**Guide Group:** Analytics and Reporting

---

## Overview

The eBay Sell Analytics and Reporting APIs provide sellers with insights into their business performance, allowing them to track metrics related to sales, traffic, and service performance. These APIs help sellers make data-driven decisions by analyzing key metrics and downloading detailed reports.

## API use cases

[Monitoring seller standards metrics](#standardsmetrics)  
[Evaluating customer service performance](#serviceperformance)  
[Retrieving buyer engagement insights](#engagementinsights)  

##### Monitoring seller standards metrics

This use case focuses on retrieving a seller's performance data in relation to eBay's seller standards policy. By accessing the current and projected sales performance metrics, sellers can evaluate their adherence to eBay's requirements and identify areas for improvement.

The following methods are available under the **seller\_standards\_profile** resource of the [Sell Analytics API](/api-docs/sell/analytics/resources/methods):

*   Use [findSellerStandardsProfiles](/api-docs/sell/analytics/resources/seller_standards_profile/methods/findSellerStandardsProfiles) to view a seller's ratings and statistics across multiple selling metrics. The three ratings are Top-Rated, Above Standard, and Below Standard. Seller standard ratings and metrics are shown for eBay US, eBay UK, and eBay Germany marketplaces. If the seller sells on more than one of these marketplaces, cumulative metrics for those marketplaces will also be shown.
*   Use [getSellerStandardsProfile](/api-docs/sell/analytics/resources/seller_standards_profile/methods/getSellerStandardsProfile) to retrieve ratings and metrics for a specific eBay marketplace or to access global ratings and metrics. Users have the option to view their current ratings and metrics from the last evaluation period or to see projected ratings and metrics for the current evaluation period.

The following outlines the standard metrics and evaluation process used by eBay to assess seller performance:

*   **Standard metrics evaluated monthly**:

*   **Late shipment rate**: Measures the percentage of transactions where items were shipped after the expected handling time.
*   **Cases closed without seller resolution**: Tracks the number of cases closed without a resolution from the seller.
*   **Transaction defect rate**: Indicates the percentage of transactions with defects, such as cancellations or returns.

*   **Standard metrics evaluated yearly**:

*   **Transactions (12-month)**: The total number of transactions completed in the past 12 months.
*   **Total sales (12-month)**: The total sales volume over the past 12 months.

*   **Seller activity duration on eBay**:

*   The **Number of days active on eBay** measures the total number of days that the seller has been active on eBay lifetime.

See the [eBay Seller Standards program](https://www.sps.ebay.com/sd/sdrequirements) page in your eBay account to get full details on the required metrics needed by sellers to qualify for Top Rated or Above Standard rating.

##### Evaluating customer service performance

This use case focuses on obtaining and analyzing detailed reports on customer service metrics, such as Item Not as Described or Item Not Received reports or cases. Understanding these metrics allows sellers to benchmark their performance and identify areas for improvement.

The [getCustomerServiceMetric](/api-docs/sell/analytics/resources/customer_service_metric/methods/getCustomerServiceMetric) method retrieves a seller's performance and rating for specific customer service metrics. It provides detailed insights into the total number of Item Not as Described or Item Not Received reports or cases for the specified evaluation period.

The response can be configured using additional parameters:

*   **customer\_service\_metric\_type**: This parameter specifies the type of customer service metrics and benchmark data to be returned for the seller. Supported types include ITEM\_NOT\_AS\_DESCRIBED and ITEM\_NOT\_RECEIVED.
*   **evaluation\_type**: This parameter determines the evaluation period for the performance metrics. For more details on supported values, refer to [EvaluationTypeEnum](/api-docs/sell/analytics/types/api:EvaluationTypeEnum).
*   **evaluation\_marketplace\_id**: This parameter specifies the Marketplace ID for which the customer service metrics and benchmark data should be evaluated. For a list of supported marketplaces, see [Analytics API requirements and restrictions](/api-docs/sell/analytics/static/overview.html#requirements).

The data is organized across various dimensions and metrics:

*   **Dimensions**:

*   **Item Not as Described**: Reports are categorized by listing categories, helping sellers identify potential product-related issues.
*   **Item Not Received**: Reports are categorized by shipping regions, including both domestic and international, allowing sellers to address logistical challenges.

*   **Metrics evaluated**:

*   **Total reports/cases**: This is the total number of reported issues, such as "Item Not as Described" or "Item Not Received," during a specific month. The evaluation considers factors like listing categories and shipping regions.
*   **Peer benchmarking data**: This compares a seller's performance to a peer group in similar categories or regions. It uses a "PEER\_BENCHMARK" to provide an average rating, helping sellers understand their standing in the marketplace.
*   **Transaction count**: This metric, labeled "TRANSACTION\_COUNT," indicates the number of transactions completed by either the peer group or the seller. It helps assess the volume of transactions evaluated for customer service metrics.
*   **Rate**: This metric calculates the percentage of defect cases by dividing the number of defect cases by the total transactions (TRANSACTION\_COUNT). The seller's performance is rated by comparing their rate to the benchmark average, with ratings from "LOW" to "VERY HIGH." A lower deviation indicates better performance.

Currently, the metric data is primarily used for peer benchmarking, allowing sellers to compare their performance with peers. For more details on how peer benchmarking works, refer to the [Service metrics policy](https://www.ebay.com/help/policies/selling-policies/seller-performance-policy/service-metrics-policy?id=4769).

To effectively use and interpret the response from this method, see [Interpreting customer service metric ratings](/api-docs/sell/static/performance/customer-service-metric.html).

##### Retrieving buyer engagement insights

This use case is about understanding buyer interactions with listings by analyzing traffic data. Sellers can use this information to optimize their listings for better visibility and sales performance.

The following method is available under the **traffic\_report** resource of the [Sell Analytics API](/api-docs/sell/analytics/resources/methods):

Use [getTrafficReport](/api-docs/sell/analytics/resources/traffic_report/methods/getTrafficReport) to retrieve various statistics related to your eBay listings, such as listing impressions, clickthrough rates, sales conversion rates, etc. The user can customize which statistics they would like to view.  See the [Traffic report details](/api-docs/sell/static/performance/traffic-report.html#metric-parameters) page for the full list of statistics that are available. Sellers have the option to get statistics across all listings, or they can retrieve statistics on specific listings.

## Code samples

## Error handling

*   If no data is returned in [findSellerStandardsProfiles](/api-docs/sell/analytics/resources/seller_standards_profile/methods/findSellerStandardsProfiles), ensure that the seller has an active account with sufficient transaction history for evaluation.
*   If the [getSellerStandardsProfile](/api-docs/sell/analytics/resources/seller_standards_profile/methods/getSellerStandardsProfile) call returns an error, ensure that the seller profile ID you provided is valid and exists within the system. Additionally, verify that you are using supported values defined in the [ProgramEnum](/api-docs/sell/analytics/types/ssp:ProgramEnum) and [CycleTypeEnum](/api-docs/sell/analytics/types/ssp:CycleTypeEnum).
*   When [getCustomerServiceMetric](/api-docs/sell/analytics/resources/customer_service_metric/methods/getCustomerServiceMetric) fails, ensure that the specified [evaluation type](/api-docs/sell/analytics/types/api:EvaluationTypeEnum) and [metric type](/api-docs/sell/analytics/types/api:CustomerServiceMetricTypeEnum) are valid and that the marketplace is supported. See this [list](/api-docs/sell/analytics/static/overview.html#requirements) for eBay marketplaces that support customer service metrics.
*   If [getTrafficReport](/api-docs/sell/analytics/resources/traffic_report/methods/getTrafficReport) returns an invalid date range error, verify that the specified date range does not span more than 90 days and that the start date does not go back more than two years in the past.
*   When using [getTrafficReport](/api-docs/sell/analytics/resources/traffic_report/methods/getTrafficReport), be sure to use one of the supported dimension values, one or more of the metrics defined [here](/api-docs/sell/static/performance/traffic-report.html#metric-parameters), and be sure to follow the required syntax when using one or more [filter](/api-docs/sell/analytics/resources/traffic_report/methods/getTrafficReport#uri.filter) values.

## Best practices

*   When specifying date ranges in the filter parameter, use the YYYYMMDD..YYYYMMDD format for the America/Los\_Angeles time zone. For all other time zones, utilize ISO 8601 format dates with a UTC offset to ensure clarity and consistency across different regions.
*   Verify that your OAuth token is valid, properly formatted, and includes necessary scopes to avoid authentication errors such as invalid or missing tokens.
*   For internal server errors, such as maintenance or application issues, retry the request after a short wait. Persistent issues should be reported to eBay Developer Support.
*   Double-check that all resource URIs and request formats are correct to avoid unresolved resource or malformed request errors.

## Code Samples

### Retrieving seller standard metrics for US seller

**Label:** Retrieving seller standard metrics for US seller

#### Bash Sample

```bash
curl -X GET "https://api.ebay.com/sell/analytics/v1/seller_standards_profile/PROGRAM_US/CURRENT"
-H "Authorization:Bearer OAUTH_token"
```

### Retrieving SNAD metrics for US Marketplace

**Label:** Retrieving SNAD metrics for US Marketplace

#### Bash Sample

```bash
curl -X GET "https://api.ebay.com/sell/analytics/v1/customer_service_metric/ITEM_NOT_AS_DESCRIBED/CURRENT?evaluation_marketplace_id=EBAY_US"
-H "Authorization:Bearer OAUTH_token"
```

## Related Topics

- [Sell Analytics API](/api-docs/sell/analytics/resources/methods)
- [eBay Seller Standards program](https://www.sps.ebay.com/sd/sdrequirements)
- [More Guides](/develop/guides)

