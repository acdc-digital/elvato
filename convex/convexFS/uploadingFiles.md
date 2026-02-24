Uploading files
Let’s break down the detailed steps for uploading one file:

Your app, in the browser, POSTs a file to the component’s registered blob upload handler. (In our examples, this is handler is mounted at /fs/upload.)
If the component successfully writes the blob to bunny.net, it will return a JSON object back to the app, like so: {blobId: "XXXX"}. This blobId is a UUIDv4 that represents the raw file data.
Your app now calls a simple mutation in your Convex backend like api.files.commitFile({path: "/myfile.jpg",blobId:"XXXX"}).
This mutation uses the ConvexFS instance fs to invoke fs.commitFiles(ctx, [{path: "/myfile.jpg",blobId:"XXXX"}]).
And when that mutation succeeds, that path will successfully reference that blobId.

Note

If we had uploaded two or more blobs, and wanted to commit them all at the same time, our app could have a mutation that passes through multiple blobId + path pairs to the underlying ConvexFS method. But we’ll go much deeper on those kinds of use cases later.

Let’s look at the bare minimum code on the frontend and backend to actually implement this flow.

The commitFile mutation
The mutation is as easy as it gets—granted, we’re not handling authentication yet.

In convex/files.ts:

import { v } from "convex/values";
import { action } from "./_generated/server";
import { fs } from "./fs";
export const commitFile = action({
  args: {
    blobId: v.string(),
    filename: v.string(),
  },
  handler: async (ctx, args) => {
    const path = "/" + args.filename; // or whatever path structure you want
    await fs.commitFiles(ctx, [{ path, blobId: args.blobId }]);
  },
});

The react app
Here’s a very simple React component that uses a file input to upload a single file:

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const commitFile = useAction(api.files.commitFile);

  // Derive the .site URL from your Convex URL
  const siteUrl = (import.meta.env.VITE_CONVEX_URL ?? "").replace(
    /\.cloud$/,
    ".site",
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // 1. Upload blob to ConvexFS endpoint
      const res = await fetch(`${siteUrl}/fs/upload`, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { blobId } = await res.json();

      // 2. Commit the file to a path
      await commitFile({
        blobId,
        filename: file.name,
      });
      alert("Upload complete!");
    } catch (err) {
      alert("Upload failed: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };
  return <input type="file" onChange={handleUpload} disabled={uploading} />;
}
export default FileUpload;

Path conventions
Any UTF-8 string is a valid path in ConvexFS. You may choose to separate namespaces with slashes and use a leading slash (e.g., /users/123/avatar.jpg), but ConvexFS does not treat any character as special.

This means:

Spaces are valid: /my documents/report.pdf
Unicode is valid: /用户/文档.txt
No character escaping is required
If you need to ensure path safety for operating systems, URL safety for web contexts, or any other constraints, that is up to your application functions and whatever conventions are appropriate for your domain.

Note that the list() function’s prefix parameter performs a simple string prefix match—it is not a directory listing. For example, prefix: "/users" (without trailing slash) will match both /users/alice.txt and /users-backup/data.bin. With prefix: "/users/" (trailing slash), paths like /users/alice.txt or /users/nested/deep/file.txt would match—not just direct children, but any path starting with that exact prefix.

What’s next
Now that you’ve uploaded a file, let’s serve it!

Previous
Installing & configuring
