/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actionHistory from "../actionHistory.js";
import type * as cjMyProducts from "../cjMyProducts.js";
import type * as copilot from "../copilot.js";
import type * as files from "../files.js";
import type * as medusaStaging from "../medusaStaging.js";
import type * as products from "../products.js";
import type * as variantMapping from "../variantMapping.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actionHistory: typeof actionHistory;
  cjMyProducts: typeof cjMyProducts;
  copilot: typeof copilot;
  files: typeof files;
  medusaStaging: typeof medusaStaging;
  products: typeof products;
  variantMapping: typeof variantMapping;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
