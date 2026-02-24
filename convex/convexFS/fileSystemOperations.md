Filesystem operations
Beyond creating and serving files in ConvexFS, your application will need to manage those files in the filesystem. This includes paging through the entire filesystem, copying, deleting, and renaming files.

As usual, all of these operations are achieved via methods on the ConvexFS object.

Let’s walk them!

Listing files
The fs.list() method returns a paginated list of files, sorted alphabetically by path.

Creating the query
First, create a wrapper query in your Convex backend that exposes fs.list():

convex/files.ts
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { fs } from "./fs";

export const listFiles = query({
  args: {
    prefix: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await fs.list(ctx, {
      prefix: args.prefix,
      paginationOpts: args.paginationOpts,
    });
  },
});

Using in React
ConvexFS re-exports usePaginatedQuery from convex-helpers for convenient pagination in React:

import { usePaginatedQuery } from "convex-fs/react";
import { api } from "../convex/_generated/api";

function FileList() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.files.listFiles,
    {}, // args (prefix is optional)
    { initialNumItems: 20 },
  );

  return (
    <div>
      {results.map((file) => (
        <div key={file.path}>
          {file.path} - {file.contentType} ({file.size} bytes)
        </div>
      ))}

      {status === "CanLoadMore" && (
        <button onClick={() => loadMore(20)}>Load more</button>
      )}

      {status === "LoadingMore" && <div>Loading...</div>}
    </div>
  );
}

Each file in results includes metadata fields like path, blobId, contentType, and size. We’ll cover these in detail in the stat section below.

Filtering by prefix
To list only files under a specific path prefix (e.g., all files in /images/), pass the prefix argument:

const { results, status, loadMore } = usePaginatedQuery(
  api.files.listFiles,
  { prefix: "/images/" },
  { initialNumItems: 20 },
);

Note

Prefix filtering uses a Convex database index, so lookups are O(log n) regardless of how many files are in your filesystem.

Retrieving file details
The fs.stat() method retrieves metadata for a single file by its path. It returns null if the file doesn’t exist, making it useful for both fetching file details and checking existence.

Creating the query
convex/files.ts
import { query } from "./_generated/server";
import { v } from "convex/values";
import { fs } from "./fs";

export const getFile = query({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    return await fs.stat(ctx, args.path);
  },
});

File metadata fields
When a file exists, fs.stat() returns an object with:

Field	Type	Description
path	string	The file’s full path
blobId	string	Unique identifier for the blob (used for downloads)
contentType	string	MIME type (e.g., "image/png", "application/pdf")
size	number	File size in bytes
attributes	object	Optional file attributes (see File expiration)
Checking if a file exists
Since fs.stat() returns null for missing files, you can use it to check existence:

export const fileExists = query({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    const file = await fs.stat(ctx, args.path);
    return file !== null;
  },
});

Using in React
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function FileDetails({ path }: { path: string }) {
  const file = useQuery(api.files.getFile, { path });

  if (file === undefined) {
    return <div>Loading...</div>;
  }

  if (file === null) {
    return <div>File not found</div>;
  }

  return (
    <div>
      <p>Path: {file.path}</p>
      <p>Type: {file.contentType}</p>
      <p>Size: {file.size} bytes</p>
    </div>
  );
}

Downloading file contents
For server-side processing, ConvexFS provides two methods to download file contents directly: fs.getFile() and fs.getBlob(). Both return the raw bytes as an ArrayBuffer.

Note

These methods are actions (not queries) because they fetch data from external blob storage. They’re designed for server-side use cases like image processing, not for serving files to browsers—use the download URL endpoints for that (see Serving files).

getFile - Download by path
The fs.getFile() method looks up a file by path and downloads its contents:

convex/files.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { fs } from "./fs";

export const processFile = action({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    const result = await fs.getFile(ctx, args.path);

    if (!result) {
      throw new Error("File not found");
    }

    // result.data is an ArrayBuffer
    // result.contentType is the MIME type
    // result.size is the file size in bytes

    const text = new TextDecoder().decode(result.data);
    return { content: text, size: result.size };
  },
});

getBlob - Download by blobId
If you already have a blobId (e.g., from a previous fs.stat() call), you can download the blob directly:

Caution

This is a low-level API. Most of the time you should prefer getFile() which handles path lookup for you.

export const processBlobData = action({
  args: { blobId: v.string() },
  handler: async (ctx, args) => {
    const data = await fs.getBlob(ctx, args.blobId);

    if (!data) {
      throw new Error("Blob not found");
    }

    // data is an ArrayBuffer
    return { size: data.byteLength };
  },
});

Uploading file contents
For server-side file creation, ConvexFS provides two methods: fs.writeFile() and fs.writeBlob(). These are typically used to store transformed or generated data (e.g., resized images, generated reports) as part of a Convex action.

Note

These methods are actions (not mutations) because they write data to external blob storage. For client-side uploads, use the HTTP upload endpoint (see Uploading files).

writeFile - Write to a path
The fs.writeFile() method uploads data and commits it to a path in one call:

convex/files.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { fs } from "./fs";

export const saveProcessedImage = action({
  args: {
    data: v.bytes(),
    outputPath: v.string(),
  },
  handler: async (ctx, args) => {
    await fs.writeFile(ctx, args.outputPath, args.data, "image/webp");
  },
});

If a file already exists at the path, it will be overwritten.

writeBlob - Upload without committing
Use fs.writeBlob() to upload data and get a blobId, then commit separately with commitFiles():

export const createReport = action({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const data = generateReport(args.name);

    // Upload blob to storage
    const blobId = await fs.writeBlob(ctx, data, "application/pdf");

    // Commit to path
    await fs.commitFiles(ctx, [{ path: "/reports/latest.pdf", blobId }]);
  },
});

This is useful when you need to commit to multiple paths, or when using commitFiles() with CAS predicates for transactional semantics (see Transactions & atomicity).

Basic filesystem changes
ConvexFS provides convenience methods for common filesystem operations: move(), copy(), and delete(). These wrap the lower-level transact() call (see Transactions & atomicity) and follow familiar Unix-style conventions.

Caution

These methods are not safe against data races. If you need atomic operations with guarantees about file state, use transact() with CAS predicates instead.

Moving files
The fs.move() method renames or relocates a file to a new path. Like Unix mv, it fails if the destination already exists.

convex/files.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { fs } from "./fs";

export const moveFile = mutation({
  args: {
    sourcePath: v.string(),
    destPath: v.string(),
  },
  handler: async (ctx, args) => {
    await fs.move(ctx, args.sourcePath, args.destPath);
  },
});

Behavior:

Throws an error if the source file doesn’t exist
Throws an error if the destination path already exists
The move is atomic—only the path is updated, not the underlying blob data
Copying files
The fs.copy() method creates a copy of a file at a new path. Like Unix cp, it fails if the destination already exists.

export const copyFile = mutation({
  args: {
    sourcePath: v.string(),
    destPath: v.string(),
  },
  handler: async (ctx, args) => {
    await fs.copy(ctx, args.sourcePath, args.destPath);
  },
});

Behavior:

Throws an error if the source file doesn’t exist
Throws an error if the destination path already exists
Tip

Copy is efficient—ConvexFS uses reference counting internally, so the blob data isn’t duplicated. Both the original and the copy point to the same underlying blob until one is modified or deleted.

Deleting files
The fs.delete() method removes a file from the filesystem. Unlike move() and copy(), this operation is idempotent—calling it on a non-existent file is a no-op, not an error.

export const deleteFile = mutation({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    await fs.delete(ctx, args.path);
  },
});

Behavior:

Silently succeeds if the file doesn’t exist (idempotent)
The underlying blob data is garbage collected automatically after a grace period when no files reference it
