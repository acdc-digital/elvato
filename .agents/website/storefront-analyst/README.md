# Storefront Analyst Agent

An AI-powered e-commerce storefront reviewer specializing in **residential designer lighting**. This agent browses your website, takes screenshots, researches competitors via Brave Search, and produces detailed, actionable review reports using Claude's vision capabilities.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Storefront Analyst Agent (TypeScript CLI)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CLI: npx tsx src/agent.ts --url https://www.elvato.shop/       │
│                                                                 │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐     │
│  │ Brave Search │  │  Playwright   │  │  Claude Vision   │     │
│  │   API        │  │  (Headless)   │  │  (Anthropic API) │     │
│  │              │  │              │  │                  │     │
│  │ • Web search │  │ • Screenshots │  │ • Image analysis │     │
│  │ • Competitor │  │ • Scroll      │  │ • UX evaluation  │     │
│  │   research   │  │ • DOM inspect │  │ • Recommendations│     │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘     │
│         │                 │                    │               │
│         └────────────┬────┘                    │               │
│                      ▼                         │               │
│         ┌─────────────────────────┐            │               │
│         │     Agent Loop          │◄───────────┘               │
│         │  (tool_use cycle)       │                            │
│         │                         │                            │
│         │  Claude decides which   │                            │
│         │  tools to use, analyzes │                            │
│         │  results, iterates      │                            │
│         └────────────┬────────────┘                            │
│                      ▼                                         │
│         ┌─────────────────────────┐                            │
│         │   Review Report (.md)   │                            │
│         │   → reviews/ directory  │                            │
│         └─────────────────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Available Tools

| Tool | Description |
|------|-------------|
| `brave_search` | Search the web for competitors, best practices, trends |
| `screenshot_page` | Navigate to a URL and capture a screenshot |
| `scroll_and_screenshot` | Scroll to a position and screenshot that section |
| `get_page_info` | Extract page metadata, headings, link/image counts |
| `get_page_links` | Extract and categorize all links (header, footer, main) |
| `write_review` | Save the final review as a dated markdown file |

## Prerequisites

1. **Node.js 18+**
2. **Anthropic API key** — [Get one here](https://console.anthropic.com/)
3. **Brave Search API key** — [Get one here](https://brave.com/search/api/)

## Setup

```bash
cd .agents/storefront-analyst

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Copy and fill in your API keys
cp .env.example .env
```

## Usage

```bash
# Default: Review elvato.shop homepage
npx tsx src/agent.ts

# Review a specific URL
npx tsx src/agent.ts --url https://www.elvato.shop/ca/store

# Use a different model
npx tsx src/agent.ts --model claude-opus-4-20250514

# Add a specific focus area
npx tsx src/agent.ts --prompt "Focus on mobile responsiveness and checkout flow"

# Increase max turns for deeper analysis
npx tsx src/agent.ts --max-turns 50

# Verbose mode (logs tool inputs)
npx tsx src/agent.ts --verbose
```

## How It Works

1. **You provide a URL** (default: `https://www.elvato.shop/`)
2. **Claude receives the URL** with a comprehensive system prompt encoding lighting e-commerce expertise
3. **Claude autonomously decides** which tools to use:
   - Screenshots the homepage (above-fold, then scrolling down)
   - Extracts page structure and metadata
   - Searches Brave for competitor benchmarks
   - Screenshots competitor sites for comparison
   - Analyzes everything it sees with vision capabilities
4. **Claude writes a review** with prioritized, actionable recommendations
5. **Review is saved** to `reviews/` with a date-stamped filename

## Review Output

Reviews are saved to:
```
.agents/storefront-analyst/reviews/review-MMDDYYYY-N.md
```

Each review includes:
- Executive Summary
- Screenshots analyzed
- Strengths
- Issues & Recommendations (Critical > High > Medium > Low)
- Competitive Gaps
- Quick Wins
- Strategic Recommendations

## Domain Expertise

The agent has deep knowledge of:
- Lighting category hierarchy and merchandising (chandeliers, pendants, ceiling, wall, floor/table, outdoor, controls)
- Buyer personas (designers, homeowners, contractors)
- Conversion drivers specific to lighting e-commerce
- Competitive landscape (Lumens, YLighting, AllModern, West Elm, Rejuvenation)
- SEO and content strategy for lighting verticals

## Cost Estimates

Using Claude Sonnet (default):
- Typical review: 15-25 turns, ~$0.50-$2.00
- Vision tokens (screenshots) are the primary cost driver
- Each screenshot: ~1,500 tokens ($0.0045)

Using Claude Opus:
- More thorough analysis, 2-3x cost
- Recommended for comprehensive competitive reviews
