/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as blog from "../blog.js";
import type * as cj_certifications from "../cj/certifications.js";
import type * as cj_myProducts from "../cj/myProducts.js";
import type * as customerComments from "../customerComments.js";
import type * as files from "../files.js";
import type * as fs from "../fs.js";
import type * as http from "../http.js";
import type * as marketplace_imagePipeline from "../marketplace/imagePipeline.js";
import type * as medusa_staging from "../medusa/staging.js";
import type * as medusa_variantMapping from "../medusa/variantMapping.js";
import type * as products_actionHistory from "../products/actionHistory.js";
import type * as products_products from "../products/products.js";
import type * as services_billing from "../services/billing.js";
import type * as shipping_tracking from "../shipping/tracking.js";
import type * as utils_copilot from "../utils/copilot.js";
import type * as utils_files from "../utils/files.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  blog: typeof blog;
  "cj/certifications": typeof cj_certifications;
  "cj/myProducts": typeof cj_myProducts;
  customerComments: typeof customerComments;
  files: typeof files;
  fs: typeof fs;
  http: typeof http;
  "marketplace/imagePipeline": typeof marketplace_imagePipeline;
  "medusa/staging": typeof medusa_staging;
  "medusa/variantMapping": typeof medusa_variantMapping;
  "products/actionHistory": typeof products_actionHistory;
  "products/products": typeof products_products;
  "services/billing": typeof services_billing;
  "shipping/tracking": typeof shipping_tracking;
  "utils/copilot": typeof utils_copilot;
  "utils/files": typeof utils_files;
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

export declare const components: {
  fs: {
    lib: {
      commitFiles: FunctionReference<
        "mutation",
        "internal",
        {
          config: {
            blobGracePeriod?: number;
            downloadUrlTtl?: number;
            storage:
              | {
                  apiKey: string;
                  cdnHostname: string;
                  region?: string;
                  storageZoneName: string;
                  tokenKey?: string;
                  type: "bunny";
                }
              | { type: "test" };
          };
          files: Array<{
            attributes?: { expiresAt?: number };
            basis?: null | string;
            blobId: string;
            path: string;
          }>;
        },
        null
      >;
      copyByPath: FunctionReference<
        "mutation",
        "internal",
        {
          config: {
            blobGracePeriod?: number;
            downloadUrlTtl?: number;
            storage:
              | {
                  apiKey: string;
                  cdnHostname: string;
                  region?: string;
                  storageZoneName: string;
                  tokenKey?: string;
                  type: "bunny";
                }
              | { type: "test" };
          };
          destPath: string;
          sourcePath: string;
        },
        null
      >;
      deleteByPath: FunctionReference<
        "mutation",
        "internal",
        {
          config: {
            blobGracePeriod?: number;
            downloadUrlTtl?: number;
            storage:
              | {
                  apiKey: string;
                  cdnHostname: string;
                  region?: string;
                  storageZoneName: string;
                  tokenKey?: string;
                  type: "bunny";
                }
              | { type: "test" };
          };
          path: string;
        },
        null
      >;
      getDownloadUrl: FunctionReference<
        "action",
        "internal",
        {
          blobId: string;
          config: {
            blobGracePeriod?: number;
            downloadUrlTtl?: number;
            storage:
              | {
                  apiKey: string;
                  cdnHostname: string;
                  region?: string;
                  storageZoneName: string;
                  tokenKey?: string;
                  type: "bunny";
                }
              | { type: "test" };
          };
          extraParams?: Record<string, string>;
        },
        string
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          config: {
            blobGracePeriod?: number;
            downloadUrlTtl?: number;
            storage:
              | {
                  apiKey: string;
                  cdnHostname: string;
                  region?: string;
                  storageZoneName: string;
                  tokenKey?: string;
                  type: "bunny";
                }
              | { type: "test" };
          };
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          prefix?: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            attributes?: { expiresAt?: number };
            blobId: string;
            contentType: string;
            path: string;
            size: number;
          }>;
        }
      >;
      moveByPath: FunctionReference<
        "mutation",
        "internal",
        {
          config: {
            blobGracePeriod?: number;
            downloadUrlTtl?: number;
            storage:
              | {
                  apiKey: string;
                  cdnHostname: string;
                  region?: string;
                  storageZoneName: string;
                  tokenKey?: string;
                  type: "bunny";
                }
              | { type: "test" };
          };
          destPath: string;
          sourcePath: string;
        },
        null
      >;
      registerPendingUpload: FunctionReference<
        "mutation",
        "internal",
        {
          blobId: string;
          config: {
            blobGracePeriod?: number;
            downloadUrlTtl?: number;
            storage:
              | {
                  apiKey: string;
                  cdnHostname: string;
                  region?: string;
                  storageZoneName: string;
                  tokenKey?: string;
                  type: "bunny";
                }
              | { type: "test" };
          };
          contentType: string;
          size: number;
        },
        null
      >;
      stat: FunctionReference<
        "query",
        "internal",
        {
          config: {
            blobGracePeriod?: number;
            downloadUrlTtl?: number;
            storage:
              | {
                  apiKey: string;
                  cdnHostname: string;
                  region?: string;
                  storageZoneName: string;
                  tokenKey?: string;
                  type: "bunny";
                }
              | { type: "test" };
          };
          path: string;
        },
        null | {
          attributes?: { expiresAt?: number };
          blobId: string;
          contentType: string;
          path: string;
          size: number;
        }
      >;
      transact: FunctionReference<
        "mutation",
        "internal",
        {
          config: {
            blobGracePeriod?: number;
            downloadUrlTtl?: number;
            storage:
              | {
                  apiKey: string;
                  cdnHostname: string;
                  region?: string;
                  storageZoneName: string;
                  tokenKey?: string;
                  type: "bunny";
                }
              | { type: "test" };
          };
          ops: Array<
            | {
                dest: { basis?: null | string; path: string };
                op: "move";
                source: {
                  attributes?: { expiresAt?: number };
                  blobId: string;
                  contentType: string;
                  path: string;
                  size: number;
                };
              }
            | {
                dest: { basis?: null | string; path: string };
                op: "copy";
                source: {
                  attributes?: { expiresAt?: number };
                  blobId: string;
                  contentType: string;
                  path: string;
                  size: number;
                };
              }
            | {
                op: "delete";
                source: {
                  attributes?: { expiresAt?: number };
                  blobId: string;
                  contentType: string;
                  path: string;
                  size: number;
                };
              }
            | {
                attributes: { expiresAt?: null | number };
                op: "setAttributes";
                source: {
                  attributes?: { expiresAt?: number };
                  blobId: string;
                  contentType: string;
                  path: string;
                  size: number;
                };
              }
          >;
        },
        null
      >;
    };
    ops: {
      basics: {
        copyByPath: FunctionReference<
          "mutation",
          "internal",
          {
            config: {
              blobGracePeriod?: number;
              downloadUrlTtl?: number;
              storage:
                | {
                    apiKey: string;
                    cdnHostname: string;
                    region?: string;
                    storageZoneName: string;
                    tokenKey?: string;
                    type: "bunny";
                  }
                | { type: "test" };
            };
            destPath: string;
            sourcePath: string;
          },
          null
        >;
        deleteByPath: FunctionReference<
          "mutation",
          "internal",
          {
            config: {
              blobGracePeriod?: number;
              downloadUrlTtl?: number;
              storage:
                | {
                    apiKey: string;
                    cdnHostname: string;
                    region?: string;
                    storageZoneName: string;
                    tokenKey?: string;
                    type: "bunny";
                  }
                | { type: "test" };
            };
            path: string;
          },
          null
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            config: {
              blobGracePeriod?: number;
              downloadUrlTtl?: number;
              storage:
                | {
                    apiKey: string;
                    cdnHostname: string;
                    region?: string;
                    storageZoneName: string;
                    tokenKey?: string;
                    type: "bunny";
                  }
                | { type: "test" };
            };
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            prefix?: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              attributes?: { expiresAt?: number };
              blobId: string;
              contentType: string;
              path: string;
              size: number;
            }>;
          }
        >;
        moveByPath: FunctionReference<
          "mutation",
          "internal",
          {
            config: {
              blobGracePeriod?: number;
              downloadUrlTtl?: number;
              storage:
                | {
                    apiKey: string;
                    cdnHostname: string;
                    region?: string;
                    storageZoneName: string;
                    tokenKey?: string;
                    type: "bunny";
                  }
                | { type: "test" };
            };
            destPath: string;
            sourcePath: string;
          },
          null
        >;
        stat: FunctionReference<
          "query",
          "internal",
          {
            config: {
              blobGracePeriod?: number;
              downloadUrlTtl?: number;
              storage:
                | {
                    apiKey: string;
                    cdnHostname: string;
                    region?: string;
                    storageZoneName: string;
                    tokenKey?: string;
                    type: "bunny";
                  }
                | { type: "test" };
            };
            path: string;
          },
          null | {
            attributes?: { expiresAt?: number };
            blobId: string;
            contentType: string;
            path: string;
            size: number;
          }
        >;
      };
      transact: {
        commitFiles: FunctionReference<
          "mutation",
          "internal",
          {
            config: {
              blobGracePeriod?: number;
              downloadUrlTtl?: number;
              storage:
                | {
                    apiKey: string;
                    cdnHostname: string;
                    region?: string;
                    storageZoneName: string;
                    tokenKey?: string;
                    type: "bunny";
                  }
                | { type: "test" };
            };
            files: Array<{
              attributes?: { expiresAt?: number };
              basis?: null | string;
              blobId: string;
              path: string;
            }>;
          },
          null
        >;
        transact: FunctionReference<
          "mutation",
          "internal",
          {
            config: {
              blobGracePeriod?: number;
              downloadUrlTtl?: number;
              storage:
                | {
                    apiKey: string;
                    cdnHostname: string;
                    region?: string;
                    storageZoneName: string;
                    tokenKey?: string;
                    type: "bunny";
                  }
                | { type: "test" };
            };
            ops: Array<
              | {
                  dest: { basis?: null | string; path: string };
                  op: "move";
                  source: {
                    attributes?: { expiresAt?: number };
                    blobId: string;
                    contentType: string;
                    path: string;
                    size: number;
                  };
                }
              | {
                  dest: { basis?: null | string; path: string };
                  op: "copy";
                  source: {
                    attributes?: { expiresAt?: number };
                    blobId: string;
                    contentType: string;
                    path: string;
                    size: number;
                  };
                }
              | {
                  op: "delete";
                  source: {
                    attributes?: { expiresAt?: number };
                    blobId: string;
                    contentType: string;
                    path: string;
                    size: number;
                  };
                }
              | {
                  attributes: { expiresAt?: null | number };
                  op: "setAttributes";
                  source: {
                    attributes?: { expiresAt?: number };
                    blobId: string;
                    contentType: string;
                    path: string;
                    size: number;
                  };
                }
            >;
          },
          null
        >;
      };
    };
    transfer: {
      getDownloadUrl: FunctionReference<
        "action",
        "internal",
        {
          blobId: string;
          config: {
            blobGracePeriod?: number;
            downloadUrlTtl?: number;
            storage:
              | {
                  apiKey: string;
                  cdnHostname: string;
                  region?: string;
                  storageZoneName: string;
                  tokenKey?: string;
                  type: "bunny";
                }
              | { type: "test" };
          };
          extraParams?: Record<string, string>;
        },
        string
      >;
      registerPendingUpload: FunctionReference<
        "mutation",
        "internal",
        {
          blobId: string;
          config: {
            blobGracePeriod?: number;
            downloadUrlTtl?: number;
            storage:
              | {
                  apiKey: string;
                  cdnHostname: string;
                  region?: string;
                  storageZoneName: string;
                  tokenKey?: string;
                  type: "bunny";
                }
              | { type: "test" };
          };
          contentType: string;
          size: number;
        },
        null
      >;
    };
  };
};
