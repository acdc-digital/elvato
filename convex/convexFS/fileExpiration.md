File expiration
ConvexFS supports automatic file expiration through the expiresAt attribute. When a file’s expiration time passes, it’s automatically deleted by a background garbage collection job.

Setting expiration on upload
When committing an uploaded file, you can set an expiresAt timestamp in the attributes field:

convex/files.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { fs } from "./fs";

export const commitTempFile = mutation({
  args: {
    path: v.string(),
    blobId: v.string(),
    expiresInMs: v.number(),
  },
  handler: async (ctx, args) => {
    const expiresAt = Date.now() + args.expiresInMs;

    await fs.commitFiles(ctx, [
      {
        path: args.path,
        blobId: args.blobId,
        attributes: { expiresAt },
      },
    ]);
  },
});

Setting expiration on existing files
Use fs.transact() with the setAttributes operation to update attributes on an existing file:

export const setFileExpiration = mutation({
  args: {
    path: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const file = await fs.stat(ctx, args.path);
    if (!file) {
      throw new Error("File not found");
    }

    await fs.transact(ctx, [
      {
        op: "setAttributes",
        source: file,
        attributes: { expiresAt: args.expiresAt },
      },
    ]);
  },
});

Clearing expiration
To remove expiration from a file (make it permanent), set expiresAt to null:

await fs.transact(ctx, [
  {
    op: "setAttributes",
    source: file,
    attributes: { expiresAt: null },
  },
]);

Note

In setAttributes, null means “clear this attribute”, while undefined means “leave unchanged”. This lets you update some attributes without affecting others.

Reading expiration
The expiresAt timestamp is returned by fs.stat() and fs.list() in the attributes field:

const file = await fs.stat(ctx, "/temp/upload.jpg");
if (file?.attributes?.expiresAt) {
  const expiresIn = file.attributes.expiresAt - Date.now();
  console.log(`File expires in ${expiresIn}ms`);
}

How expiration works
ConvexFS runs a File Garbage Collection (FGC) job every 15 seconds that:

Finds files where attributes.expiresAt is in the past
Deletes the file records
Decrements the blob reference count
The underlying blob data isn’t deleted immediately—it goes through the normal garbage collection process with the configured grace period. This means you can still recover expired files during the grace period if needed.

Tip

FGC runs every 15 seconds, so files are typically deleted within 15 seconds of their expiration time.

Attributes and file operations
File attributes are path-specific, not blob-specific. This means:

Move: Attributes are cleared when a file is moved to a new path
Copy: The copy does not inherit the source file’s attributes
Overwrite: When a file is overwritten, the old attributes are removed
This behavior ensures that expiration times don’t unexpectedly carry over when files are reorganized.

// Original file expires in 1 hour
await fs.commitFiles(ctx, [
  {
    path: "/temp/file.txt",
    blobId,
    attributes: { expiresAt: Date.now() + 3600000 },
  },
]);

// After move, the file at /archive/file.txt has NO expiration
await fs.move(ctx, "/temp/file.txt", "/archive/file.txt");

If you need to preserve attributes during a move, you can submit both operations in a single transact() call to update them atomically:

const file = await fs.stat(ctx, "/temp/file.txt");
if (!file) throw new Error("File not found");

// Move and restore attributes in one atomic transaction
await fs.transact(ctx, [
  { op: "move", source: file, dest: { path: "/archive/file.txt" } },
  {
    op: "setAttributes",
    source: { ...file, path: "/archive/file.txt" },
    attributes: file.attributes ?? {},
  },
]);

Use cases
Temporary upload staging
Stage uploaded files in a temp directory with automatic cleanup:

export const stageUpload = mutation({
  args: { blobId: v.string(), filename: v.string() },
  handler: async (ctx, args) => {
    const path = `/staging/${args.blobId}/${args.filename}`;
    const expiresAt = Date.now() + 4 * 60 * 60 * 1000; // 4 hours

    await fs.commitFiles(ctx, [
      { path, blobId: args.blobId, attributes: { expiresAt } },
    ]);

    return path;
  },
});

export const finalizeUpload = mutation({
  args: { stagingPath: v.string(), finalPath: v.string() },
  handler: async (ctx, args) => {
    // Move clears attributes, so the finalized file won't expire
    await fs.move(ctx, args.stagingPath, args.finalPath);
  },
});

Time-limited file sharing
Create download links that expire along with the file:

export const createShareableFile = mutation({
  args: {
    sourcePath: v.string(),
    shareId: v.string(),
    expiresInHours: v.number(),
  },
  handler: async (ctx, args) => {
    const source = await fs.stat(ctx, args.sourcePath);
    if (!source) throw new Error("File not found");

    const sharePath = `/shared/${args.shareId}`;
    const expiresAt = Date.now() + args.expiresInHours * 60 * 60 * 1000;

    // Copy to shared location with expiration
    await fs.transact(ctx, [{ op: "copy", source, dest: { path: sharePath } }]);

    // Set expiration on the copy
    const sharedFile = await fs.stat(ctx, sharePath);
    await fs.transact(ctx, [
      {
        op: "setAttributes",
        source: sharedFile!,
        attributes: { expiresAt },
      },
    ]);

    return sharePath;
  },
});

Session-scoped files
Clean up user files when their session expires:

export const createSessionFile = mutation({
  args: {
    userId: v.string(),
    sessionExpiresAt: v.number(),
    blobId: v.string(),
    filename: v.string(),
  },
  handler: async (ctx, args) => {
    const path = `/sessions/${args.userId}/${args.filename}`;

    await fs.commitFiles(ctx, [
      {
        path,
        blobId: args.blobId,
        attributes: { expiresAt: args.sessionExpiresAt },
      },
    ]);

    return path;
  },
});