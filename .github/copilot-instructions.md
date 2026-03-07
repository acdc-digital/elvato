# Elvato Project Custom Instructions

This project uses a multi-folder workspace with the following tech stack:

## Tech Stack Overview

- **Admin Backend**: MedusaJS - Digital commerce platform with customizable Framework
- **Storefront**: Next.js 14+ (App Router) with Tailwind CSS
- **Catalogue**: Next.js 14+ (App Router) with Tailwind CSS and Convex

## General Guidelines

- Follow the specific conventions and best practices outlined in the reference documentation for each technology
- Prioritize clean, maintainable, and well-documented code
- Use TypeScript for all new code
- Follow the existing file structure and naming conventions in each folder

## Reference Documentation

For detailed documentation on each technology:

- [MedusaJS Reference](.github/medusa.md) - Commerce platform framework, modules, and APIs
- [Next.js Reference](.github/nextjs.md) - React framework with App Router patterns
- [Tailwind CSS Reference](.github/tailwind.md) - Utility-first CSS framework

## Project Structure

- `/admin` - Medusa backend application (Node.js, TypeScript)
- `/storefront` - Customer-facing Next.js storefront with Tailwind CSS
- `/catalogue` - Next.js application with Convex real-time backend

## Code Generation Preferences

- Use functional React components with TypeScript
- Prefer server components in Next.js unless client interactivity is required
- Use Tailwind CSS utility classes for styling
- Follow Medusa's framework conventions for API routes, workflows, and modules
- Include proper error handling and loading states
- Write self-documenting code with clear variable and function names

## Terminal / Scripting

- **Never use inline `node -e` or `node -p` with multi-line JS in zsh** — zsh mangles quotes, backticks, and special characters. Always write a temporary `.mjs` script file and run it with `node scripts/debug/_tmp.mjs`, then delete after.
- Place temporary debug scripts in `scripts/debug/` with a `_tmp` prefix.
