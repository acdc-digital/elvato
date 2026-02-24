Transactions & atomicity
ConvexFS provides the ability to specify preconditions on all filesystem operations to ensure no data races and therefore no data loss. By checking that files are in an expected state before modifying them, you can build robust applications that handle concurrent updates gracefully.

Caution

These APIs are powerful but complex. If you just want a basic experience with ConvexFS, stick to the operations in Filesystem operations. Come back here when you need to handle concurrent updates or build transactional workflows.

The problem: data races
Consider a simple file rename operation:

// Read the file
const file = await fs.stat(ctx, "/uploads/photo.jpg");

// ... time passes, other mutations run ...

// Move it to a new location
await fs.move(ctx, "/uploads/photo.jpg", "/archive/photo.jpg");

Between reading the file and moving it, another user might have:

Deleted the file
Replaced it with different content
Already moved it somewhere else
The basic fs.move() method will fail if the file doesn’t exist, but it can’t detect if the file was replaced with different content. You might accidentally archive the wrong version.

The solution: preconditions
ConvexFS solves this with preconditions—assertions about what state a file should be in before an operation proceeds. If the precondition fails, the operation is rejected and you can re-read the current state and decide what to do.

There are two APIs that support preconditions:

transact() - For move, copy, and delete operations
commitFiles() - For committing uploaded blobs to paths
Both use the same concept: you provide a basis that specifies your expected state, and the operation only succeeds if reality matches your expectation.

Using transact()
The fs.transact() method executes one or more filesystem operations atomically. Each operation specifies:

A source file (from fs.stat()) that includes the expected blobId
For move/copy: a destination with an optional basis precondition
Source preconditions
Every operation in transact() requires a source object from fs.stat(). This object includes the file’s current blobId, which acts as a version identifier. If the file has changed (different blobId) or been deleted since you called stat(), the operation fails.

convex/files.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { fs } from "./fs";

export const processAndDelete = action({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    // Get current file state
    const file = await fs.stat(ctx, args.path);
    if (!file) {
      throw new Error("File not found");
    }

    // Do something with the file contents (e.g., send to external API)
    const data = await fs.getFile(ctx, args.path);
    await sendToExternalService(data);

    // Delete only if file hasn't changed since we read it
    // If someone modified or replaced it, this will fail
    await fs.transact(ctx, [{ op: "delete", source: file }]);
  },
});

Note

Why not just use a normal Convex mutation? Convex mutations are already transactional, but they can’t make external calls (HTTP requests, etc.). When you need to read a file, process it externally, then update based on what you read, you must use an action—and actions don’t have automatic transactional guarantees. That’s where preconditions come in.

Destination preconditions
For move and copy operations, the dest.basis field controls what happens at the destination path:

basis value	Meaning	Use case
undefined	No check—overwrite if exists	”Just put it there”
null	Destination must NOT exist	”Create only, don’t replace”
"<blobId>"	Destination must have this exact blobId	”Replace this specific version”
export const safeCopy = mutation({
  args: {
    sourcePath: v.string(),
    destPath: v.string(),
  },
  handler: async (ctx, args) => {
    const source = await fs.stat(ctx, args.sourcePath);
    if (!source) {
      throw new Error("Source not found");
    }

    // Copy only if destination doesn't exist
    await fs.transact(ctx, [
      {
        op: "copy",
        source,
        dest: { path: args.destPath, basis: null },
      },
    ]);
  },
});

Multiple operations
transact() accepts an array of operations that execute in-order and atomically. Each operation sees the effects of previous operations in the array. If any operation fails its preconditions, the entire transaction is rejected—no partial changes occur.

export const swapFiles = mutation({
  args: {
    pathA: v.string(),
    pathB: v.string(),
  },
  handler: async (ctx, args) => {
    const fileA = await fs.stat(ctx, args.pathA);
    const fileB = await fs.stat(ctx, args.pathB);

    if (!fileA || !fileB) {
      throw new Error("Both files must exist");
    }

    // Atomic swap: A -> temp, B -> A, temp -> B
    // All three operations succeed or none do
    await fs.transact(ctx, [
      { op: "move", source: fileA, dest: { path: "/tmp/swap" } },
      { op: "move", source: fileB, dest: { path: args.pathA } },
      {
        op: "move",
        source: { ...fileA, path: "/tmp/swap" },
        dest: { path: args.pathB },
      },
    ]);
  },
});

Using commitFiles()
The fs.commitFiles() method commits uploaded blobs to file paths. Like transact(), it supports a basis precondition on each file:

basis value	Meaning	Use case
undefined	No check—overwrite if exists	Simple upload
null	File must NOT exist	Create new file only
"<blobId>"	File must have this exact blobId	Update specific version
export const createFileIfNotExists = mutation({
  args: {
    path: v.string(),
    blobId: v.string(),
  },
  handler: async (ctx, args) => {
    // Only create if file doesn't exist
    await fs.commitFiles(ctx, [
      { path: args.path, blobId: args.blobId, basis: null },
    ]);
  },
});

Compare-and-swap updates
The basis field enables compare-and-swap (CAS) semantics. This is useful when updating a file based on its current contents:

"use node";
import sharp from "sharp";

export const cropToFace = action({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    // Read current file state and contents
    const file = await fs.stat(ctx, args.path);
    if (!file) {
      throw new Error("File not found");
    }
    const imageData = await fs.getFile(ctx, args.path);

    // Use sharp to detect face and crop (external library call)
    const cropped = await sharp(imageData.data)
      .extract(await detectFaceRegion(imageData.data))
      .toBuffer();

    // Upload the processed image
    const newBlobId = await fs.writeBlob(ctx, cropped, "image/jpeg");

    // Only overwrite if file hasn't changed since we read it
    await fs.commitFiles(ctx, [
      { path: args.path, blobId: newBlobId, basis: file.blobId },
    ]);
  },
});

If another process updated the image between reading and writing, the basis check fails and you can re-read and retry.

Handling conflicts
When a precondition fails, ConvexFS throws a ConvexError with structured conflict data. You can catch this and implement retry logic:

import { ConvexError } from "convex/values";
import { isConflictError } from "convex-fs";

export const robustUpdate = mutation({
  args: { path: v.string(), newBlobId: v.string() },
  handler: async (ctx, args) => {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const file = await fs.stat(ctx, args.path);
      const basis = file?.blobId ?? null;

      try {
        await fs.commitFiles(ctx, [
          { path: args.path, blobId: args.newBlobId, basis },
        ]);
        return; // Success!
      } catch (e) {
        if (e instanceof ConvexError && isConflictError(e.data)) {
          // Conflict—retry with fresh state
          continue;
        }
        throw e; // Unknown error
      }
    }

    throw new Error("Failed after max retries");
  },
});

Conflict error details
The conflict error includes details about what went wrong:

Field	Description
code	Error type (see below)
path	Which file had the conflict
expected	The blobId you expected (or null for “must not exist”)
found	The actual blobId (or null if file doesn’t exist)
operationIndex	For transact(): which operation failed (1-indexed)
Conflict codes:

Code	Meaning
SOURCE_NOT_FOUND	Source file doesn’t exist
SOURCE_CHANGED	Source file’s blobId doesn’t match
DEST_EXISTS	Destination exists when basis: null
DEST_NOT_FOUND	Destination doesn’t exist when basis: "<blobId>"
DEST_CHANGED	Destination blobId doesn’t match basis
CAS_CONFLICT	commitFiles() basis check failed
When to use preconditions
Use preconditions when:

Concurrent access is possible - Multiple users or processes might modify the same files
Data integrity matters - You can’t afford to overwrite or lose changes
Building workflows - Multi-step processes where each step depends on the previous state
For simple single-user scenarios or append-only workflows, the basic operations in Filesystem operations are simpler and sufficient.