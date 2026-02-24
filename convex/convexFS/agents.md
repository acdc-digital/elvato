AGENTS.md - Guidelines for AI Coding Agents
This document provides guidelines for AI agents working on the ConvexFS codebase.

Project Overview
ConvexFS is a Convex component providing virtual filesystem semantics backed by external blob storage (S3-compatible or Bunny.net). It's structured as:

src/component/ - Convex backend (queries, mutations, actions, schema)
src/client/ - Client SDK (ConvexFS class, registerRoutes)
src/react/ - React hooks
example/ - Demo app with Vite frontend + Convex backend
Build/Lint/Test Commands
# Install dependencies
npm install

# Development (runs backend, frontend, and build watcher)
npm run dev

# Build TypeScript
npm run build
npm run build:clean    # Clean rebuild with codegen

# Type checking
npm run typecheck

# Linting
npm run lint

# Run all tests with type checking
npm test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npx vitest run src/component/blobstore/s3.test.ts

# Run tests matching a pattern
npx vitest run -t "put"

# Run a single test by name
npx vitest run -t "sends PUT request with presigned URL"

# Debug tests
npm run test:debug

# Regenerate Convex types
npx convex dev --once
Code Style Guidelines
Formatting
Prettier with trailing commas ("trailingComma": "all")
2 spaces for indentation (TypeScript default)
Run npx prettier -w <file> to format
Imports
External packages first (convex, vitest, etc.)
Internal absolute imports second
Relative imports last
Use .js extension for relative imports (ESM requirement)
Separate import type from value imports
// External
import { v } from "convex/values";
import { describe, it, expect } from "vitest";

// Internal - types separate
import type { BlobMetadata } from "./blobstore/index.js";
import { createBlobStore } from "./blobstore/index.js";

// Relative
import { configValidator } from "./validators.js";
TypeScript
Strict mode enabled - no implicit any, strict null checks
Use type keyword for type-only imports: import type { Foo } from ...
Prefer interfaces for object shapes, types for unions/intersections
Use Infer<typeof validator> to derive types from Convex validators
Prefix unused parameters with underscore: _ctx, _opts
// Deriving types from validators
export const configValidator = v.object({ ... });
export type Config = Infer<typeof configValidator>;

// Unused parameters
async generateUploadUrl(_key: string, _opts?: UploadUrlOptions): Promise<string>
Naming Conventions
Files: camelCase.ts for modules, camelCase.test.ts for tests
Classes: PascalCase (e.g., ConvexFS, BlobStore)
Functions/methods: camelCase (e.g., createBlobStore, getDownloadUrl)
Constants: UPPER_SNAKE_CASE for true constants, camelCase otherwise
Types/Interfaces: PascalCase (e.g., BlobMetadata, StorageConfig)
Validators: camelCaseValidator suffix (e.g., configValidator)
Convex Patterns
// Queries/mutations/actions export pattern
export const myQuery = query({
  args: { path: v.string() },
  returns: v.union(v.null(), fileMetadataValidator),
  handler: async (ctx, args) => { ... },
});

// Internal functions use internalQuery/internalMutation/internalAction
export const myInternalQuery = internalQuery({ ... });

// Schema definition
export default defineSchema({
  tableName: defineTable({
    field: v.string(),
  }).index("indexName", ["field"]),
});
Error Handling
Throw Error with descriptive messages for expected failures
Use try/catch in HTTP handlers, return appropriate status codes
Log errors with console.error() before returning error responses
// In actions/mutations
if (!config) {
  throw new Error("Storage not configured");
}

// In HTTP handlers
try {
  const result = await doSomething();
  return new Response(JSON.stringify(result), { status: 200 });
} catch (error) {
  console.error("Operation failed:", error);
  return new Response("Error message", { status: 500 });
}
Testing Patterns
Use Vitest with describe/it/expect
Mock globalThis.fetch for HTTP tests
Use beforeEach/afterEach for setup/teardown
Test files adjacent to source: foo.ts -> foo.test.ts
describe("createS3BlobStore", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("does something", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(...));
    globalThis.fetch = mockFetch;
    // test logic
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
Documentation
Use JSDoc comments for public APIs with @example blocks
Document complex parameters with @param
Keep inline comments brief and focused on "why" not "what"
Project-Specific Patterns
BlobStore Interface
All storage backends implement the BlobStore interface:

interface BlobStore {
  generateUploadUrl(key: string, opts?: UploadUrlOptions): Promise<string>;
  generateDownloadUrl(key: string, opts?: DownloadUrlOptions): Promise<string>;
  put(key: string, data: Blob | Uint8Array, opts?: PutOptions): Promise<void>;
  head(key: string): Promise<BlobMetadata | null>;
  delete(key: string): Promise<DeleteResult>;
}
Discriminated Union Config
Storage config uses discriminated unions with type field:

type StorageConfig =
  | { type: "s3"; accessKeyId: string; ... }
  | { type: "bunny"; apiKey: string; ... };

// Factory pattern
function createBlobStore(config: StorageConfig): BlobStore {
  switch (config.type) {
    case "s3": return createS3BlobStore(config);
    case "bunny": return createBunnyBlobStore(config);
  }
}
HTTP Routes
Use corsRouter from convex-helpers for CORS support:

const cors = corsRouter(http, {
  allowedOrigins: ["*"],
  allowedHeaders: ["Content-Type", "Content-Length"],
});

cors.route({
  path: "/upload",
  method: "POST",
  handler: httpActionGeneric(async (ctx, req) => { ... }),
});
Common Tasks
Adding a new storage backend
Create src/component/blobstore/newbackend.ts implementing BlobStore
Add config type to src/component/blobstore/types.ts
Add validator to src/component/validators.ts
Add to factory in src/component/blobstore/index.ts
Add client types to src/client/types.ts
Write tests in src/component/blobstore/newbackend.test.ts
Modifying schema
Update src/component/schema.ts
Run npx convex dev --once to regenerate types
Clear existing data if schema change is incompatible