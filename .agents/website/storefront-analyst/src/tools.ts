/**
 * Tool definitions for the Storefront Analyst Agent.
 * 
 * Tools:
 * - brave_search: Search the web via Brave Search API
 * - screenshot_page: Take a screenshot of a URL using Playwright
 * - scroll_and_screenshot: Scroll to a position and take a screenshot
 * - analyze_page_structure: Get the DOM structure / accessibility tree of a page
 */

import type Anthropic from "@anthropic-ai/sdk";

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "brave_search",
    description:
      "Search the web using Brave Search API. Use this to research competitors, lighting industry best practices, e-commerce trends, or find specific information about products and design standards.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query string",
        },
        count: {
          type: "number",
          description: "Number of results to return (default: 5, max: 20)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "screenshot_page",
    description:
      "Navigate to a URL and take a full-viewport screenshot. Returns a base64-encoded PNG image. Use this to visually inspect web pages, product pages, competitor sites, or any URL.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The full URL to navigate to and screenshot",
        },
        viewport_width: {
          type: "number",
          description: "Viewport width in pixels (default: 1280)",
        },
        viewport_height: {
          type: "number",
          description: "Viewport height in pixels (default: 800)",
        },
        full_page: {
          type: "boolean",
          description:
            "If true, capture the entire scrollable page. If false, capture only the visible viewport (default: false)",
        },
        wait_for_selector: {
          type: "string",
          description:
            "Optional CSS selector to wait for before taking the screenshot",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "scroll_and_screenshot",
    description:
      "Scroll to a specific vertical position on the current page and take a screenshot. Use this to inspect different sections of a long page after an initial screenshot_page call.",
    input_schema: {
      type: "object" as const,
      properties: {
        scroll_y: {
          type: "number",
          description:
            "Vertical scroll position in pixels from the top of the page",
        },
        url: {
          type: "string",
          description:
            "The URL of the page (must match the currently loaded page, or a new navigation will occur)",
        },
      },
      required: ["scroll_y", "url"],
    },
  },
  {
    name: "get_page_info",
    description:
      "Get metadata and structural information about the currently loaded page: title, meta description, heading hierarchy, link count, image count, and basic accessibility info. Does NOT return a screenshot.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The URL to analyze",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "get_page_links",
    description:
      "Extract all links from the currently loaded page, grouped by navigation area (header, footer, main content). Useful for understanding site structure and navigation.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The URL to extract links from",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "write_review",
    description:
      "Write the final review report as a markdown file. The review will be saved to .agents/storefront-analyst/reviews/ with a date-stamped filename.",
    input_schema: {
      type: "object" as const,
      properties: {
        content: {
          type: "string",
          description: "The full markdown content of the review report",
        },
        filename_suffix: {
          type: "string",
          description:
            "Optional suffix for the filename (e.g., 'homepage', 'product-page'). Default: 'review'",
        },
      },
      required: ["content"],
    },
  },
];
