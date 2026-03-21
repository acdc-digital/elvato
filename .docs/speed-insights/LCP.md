Largest Contentful Paint (LCP)




Philip Walton
Philip Walton
Barry Pollard
Barry Pollard

Published: August 8, 2019, Last updated: September 4, 2025



Largest Contentful Paint (LCP) is an important, stable Core Web Vital metric for measuring perceived load speed because it marks the point in the page load timeline when the page's main content has likely loaded—a fast LCP helps reassure the user that the page is useful.

Historically, it's been a challenge for web developers to measure how quickly the main content of a web page loads and is visible to users. Older metrics like load or DOMContentLoaded don't work well because they don't necessarily correspond to what the user sees on their screen. And newer, user-centric performance metrics like First Contentful Paint (FCP) only capture the very beginning of the loading experience. If a page shows a splash screen or displays a loading indicator, this moment isn't very relevant to the user.

In the past, we've recommended performance metrics like First Meaningful Paint (FMP) and Speed Index (SI) (both available in Lighthouse) to help capture more of the loading experience after the initial paint, but these metrics are complex, hard to explain, and often wrong—meaning they still don't identify when the main content of the page has loaded.

Based on discussions in the W3C Web Performance Working Group and research done at Google, we've found that a more accurate way to measure when the main content of a page is loaded is to look at when the largest element is rendered.

What is LCP?
LCP reports the render time of the largest image, text block, or video visible in the viewport, relative to when the user first navigated to the page.

Key Point: It is important to note that LCP includes any unload time from the previous page, connection set up time, redirect time, and other Time To First Byte (TTFB) delays which can be significant when measured in the field and can lead to differences between field and lab measurements.
What is a good LCP score?
To provide a good user experience, sites should strive to have Largest Contentful Paint of 2.5 seconds or less. To ensure you're hitting this target for most of your users, a good threshold to measure is the 75th percentile of page loads, segmented across mobile and desktop devices.

Good LCP values are 2.5 seconds or less, poor values are greater than 4.0 seconds, and anything in between needs improvement
A good LCP value is 2.5 seconds or less.
To learn more about the research and methodology behind this recommendation, see: Defining the Core Web Vitals metrics thresholds.

What elements are considered?
As specified in the Largest Contentful Paint API, the types of elements considered for Largest Contentful Paint are:

<img> elements (the first frame presentation time is used for animated content such as GIFs or animated PNGs)
<image> elements inside an <svg> element
<video> elements (the poster image load time or first frame presentation time for videos is used—whichever is earlier)
An element with a background image loaded using the url() function, (as opposed to a CSS gradient)
Block-level elements containing text nodes or other inline-level text element children.
Note that restricting the elements to this limited set was intentional in order to reduce complexity. Additional elements (like the full <svg> support) may be added in the future as more research is conducted.

As well as only considering some elements, LCP measurements use heuristics to exclude certain elements that users are likely to see as "non-contentful". For Chromium-based browsers, these include:

Elements with an opacity of 0, that are invisible to the user
Elements that cover the full viewport, that are likely considered as background rather than content
Placeholder images or other images with a low entropy, that likely don't reflect the true content of the page
Browsers are likely to continue to improve these heuristics to ensure we match user expectations of what the largest contentful element is.

These "contentful" heuristics may differ from those used by First Contentful Paint (FCP), which may consider some of these elements, such as placeholder images or full viewport images, even if they are ineligible to be LCP candidates. Despite both using "contentful" in their name, the aim of these metrics is different. FCP measures when any content is painted to screen and LCP when the main content is painted so LCP is intented to be more selective.

How is an element's size determined?
The size of the element reported for LCP is typically the size that's visible to the user within the viewport. If the element extends outside of the viewport, or if any of the element is clipped or has non-visible overflow, those portions don't count toward the element's size.

For image elements that have been resized from their intrinsic size, the size that gets reported is either the visible size or the intrinsic size, whichever is smaller.

For text elements, LCP considers only the smallest rectangle that can contain all text nodes.

For all elements, LCP doesn't consider margins, paddings, or borders applied using CSS.

Note: Determining which text nodes belong to which elements can sometimes be tricky, especially for elements whose children includes inline elements and plain text nodes but also block-level elements. The key point is that every text node belongs to (and only to) its closest block-level ancestor element. In spec terms: each text node belongs to the element that generates its containing block.
When is LCP reported?
Web pages often load in stages, and as a result, it's possible that the largest element on the page might change.

To handle this potential for change, the browser dispatches a PerformanceEntry of type largest-contentful-paint identifying the largest contentful element as soon as the browser has painted the first frame. But then, after rendering subsequent frames, it will dispatch another PerformanceEntry any time the largest contentful element changes.

For example, on a page with text and a hero image the browser may initially just render the text—at which point the browser would dispatch a largest-contentful-paint entry whose element property would likely reference a <p> or <h1>. Later, once the hero image finishes loading, a second largest-contentful-paint entry would be dispatched and its element property would reference the <img>.

An element can only be considered the largest contentful element after it has rendered and is visible to the user. Images that haven't yet loaded aren't considered "rendered". Neither are text nodes using web fonts during the font block period. In such cases, a smaller element might be reported as the largest contentful element, but as soon as the larger element finishes rendering, another PerformanceEntry is created.

In addition to late-loading images and fonts, a page may add new elements to the DOM as new content becomes available. If any of these new elements is larger than the previous largest contentful element, a new PerformanceEntry will also be reported.

If the largest contentful element is removed from the viewport, or even from the DOM, it remains the largest contentful element unless a larger element is rendered.

Note: The browser will stop reporting new entries as soon as the user interacts with the page (via a tap, scroll, or keypress), as user interaction often changes what's visible to the user (which is especially true with scrolling).
For analysis purposes, you should only report the most recently dispatched PerformanceEntry to your analytics service.

Caution: Since users can open pages in a background tab, it's possible that largest-contentful-paint entries won't be dispatched until the user focuses the tab, which can be much later than when they first loaded it. Google tools that measure LCP don't report this metric if the page was loaded in the background, as it does not reflect the user-perceived load time.
Load time versus render time
For security reasons, the render timestamp of images was not originally exposed for cross-origin images that lack the Timing-Allow-Origin header. Instead, only their load time was exposed (since this is already exposed through many other web APIs).

The load time will usually be slightly after the resource download ends (responseEnd in Resource Timing) as it takes time for the browser to process the resource after the download completes, even before it starts to render it. However, where the LCP resource is preloaded, or the rendering is delayed, there can be a larger gap between the load time and the render time.

This can lead to the seemingly impossible situation where LCP is reported by web APIs as earlier than FCP. This is not the case but only appears so due to this security restriction.

This was resolved in late 2024 and a slightly coarsened render time is available from Chrome 133 even when Timing-Allow-Origin is not provided.

When possible, it's still recommended to set the Timing-Allow-Origin header, so your metrics will be more accurate, particular for browsers that don't include this recent change.

How are element layout and size changes handled?
To keep the performance overhead of calculating and dispatching new performance entries low, changes to an element's size or position don't generate new LCP candidates. Only the element's initial size and position in the viewport is considered.

This means images that are initially rendered off-screen and then transition on-screen may not be reported. It also means elements initially rendered in the viewport that then get pushed down, out of view will still report their initial, in-viewport size.

Examples
Here are some examples of when the Largest Contentful Paint occurs on a few popular websites:

Largest Contentful Paint timeline from cnn.com
An LCP timeline from cnn.com.
Largest Contentful Paint timeline from techcrunch.com
An LCP timeline from techcrunch.com.
In both of the timelines, the largest element changes as content loads. In the first example, new content is added to the DOM and that changes what element is the largest. In the second example, the layout changes and content that was previously the largest is removed from the viewport.

While it's often the case that late-loading content is larger than content already on the page, that's not necessarily the case. The next two examples show the LCP occurring before the page fully loads.

Largest Contentful Paint timeline from instagram.com
An LCP timeline from instagram.com.
In this example, the Instagram logo is loaded relatively early and it remains the largest element even as other content is progressively shown.

Note: In the first frame of the Instagram timeline, you may notice the camera logo does not have a green box around it. That's because it's an <svg> element, and <svg> elements are not considered LCP candidates at this time (though <img src="...svg"> elements are, as are individual <image> elements within <svg> elements). The first LCP candidate is the text in the second frame.
Largest Contentful Paint timeline from google.com
An LCP timeline from google.com.
In this Google Search results page example, the largest element is a paragraph of text that is displayed before any of the images or logo finish loading. Since all the individual images are smaller than this paragraph, it remains the largest element throughout the load process.

How to measure LCP
LCP can be measured in the lab or in the field, and it's available in the following tools:

Field tools
Chrome User Experience Report
PageSpeed Insights
Search Console (Core Web Vitals report)
web-vitals JavaScript library
Lab tools
Chrome DevTools
Lighthouse
PageSpeed Insights
WebPageTest
Measure LCP in JavaScript
To measure LCP in JavaScript, you can use the Largest Contentful Paint API. The following example shows how to create a PerformanceObserver that listens for largest-contentful-paint entries and logs them to the console.


new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    console.log('LCP candidate:', entry.startTime, entry);
  }
}).observe({type: 'largest-contentful-paint', buffered: true});
Warning: This code shows how to log largest-contentful-paint entries to the console, but measuring LCP in JavaScript is more complicated. For details, see Differences between the Metric and the API.
In the previous example, each logged largest-contentful-paint entry represents the current LCP candidate. In general, the startTime value of the last entry emitted is the LCP value—however, that is not always the case. Not all largest-contentful-paint entries are valid for measuring LCP.

The following section lists the differences between what the API reports and how the metric is calculated.

Differences between the metric and the API
The API will dispatch largest-contentful-paint entries for pages loaded in a background tab, but those pages should be ignored when calculating LCP.
The API will continue to dispatch largest-contentful-paint entries after a page has been backgrounded, but those entries should be ignored when calculating LCP (elements may only be considered if the page was in the foreground the entire time).
The API does not report largest-contentful-paint entries when the page is restored from the back/forward cache, but LCP should be measured in these cases since users experience them as distinct page visits.
The API does not consider elements within iframes but the metric does as they are part of the user experience of the page. In pages with an LCP within an iframe—for example a poster image on an embedded video—this will show as a difference between CrUX and RUM. To properly measure LCP you should consider them. Sub-frames can use the API to report their largest-contentful-paint entries to the parent frame for aggregation.
The API measures LCP from navigation start, but for prerendered pages LCP should be measured from activationStart since that corresponds to the LCP time as experienced by the user.
Rather than memorizing all these subtle differences, developers can use the web-vitals JavaScript library to measure LCP, which handles these differences for you (where possible—note the iframe issue is not covered):


import {onLCP} from 'web-vitals';

// Measure and log LCP as soon as it's available.
onLCP(console.log);
Refer to the source code for onLCP() for a complete example of how to measure LCP in JavaScript.

Note: In some cases (such as cross-origin iframes) it's not possible to measure LCP in JavaScript. See the limitations section of the web-vitals library for details.
What if the largest element isn't the most important?
In some cases the most important element (or elements) on the page is not the same as the largest element, and developers may be more interested in measuring the render times of these other elements instead. This is possible using the Element Timing API, as described in the article on custom metrics.

How to improve LCP
A full guide on optimizing LCP is available to guide you through the process of identifying LCP timings in the field and using lab data to drill down and optimize them.

Additional resources
Lessons learned from performance monitoring in Chrome by Annie Sullivan at performance.now() (2019)
Changelog
Occasionally, bugs are discovered in the APIs used to measure metrics, and sometimes in the definitions of the metrics themselves. As a result, changes must sometimes be made, and these changes can show up as improvements or regressions in your internal reports and dashboards.

To help you manage this, all changes to either the implementation or definition of these metrics will be surfaced in this Changelog.

If you have feedback for these metrics, you can provide it in the web-vitals-feedback Google group.