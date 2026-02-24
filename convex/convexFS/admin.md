Admin tools & disaster recovery
Development tools
clearAllFiles
The clearAllFiles internal action deletes all files from the filesystem. This is useful when iterating on your project during development and you want a clean slate.

To run it, open the Convex dashboard, navigate to your deployment’s Functions tab, find internal.ops.basics.clearAllFiles, and invoke it.

Even this operation uses soft-delete—the file records are removed immediately, but the underlying blobs remain until the garbage collector cleans them up. This gives you a clean filesystem view quickly while still allowing recovery if needed.

Safety protection
To prevent accidental data loss in production, clearAllFiles is disabled by default. You must explicitly enable it via the dashboard before it will run:

Open the Convex dashboard
Navigate to your deployment’s Data tab
Find the config table in the ConvexFS component
Edit the document with key: "storage"
Add allowClearAllFiles: true to the value object
Now you can invoke the function
Danger

Remember to set allowClearAllFiles: false (or remove it) after you’re done. Leaving it enabled in production is a risk—anyone with dashboard access could accidentally wipe your filesystem.

When things go wrong in production
Bugs happen. Sometimes you might delete files you didn’t mean to, or discover a subtle bug that’s been silently removing user data. ConvexFS provides tools to help you recover.

First line of defense: Freeze GC
If you suspect data loss, immediately freeze garbage collection. This prevents the GC jobs from permanently deleting any orphaned blobs while you investigate.

To freeze GC:

Open the Convex dashboard
Navigate to your deployment’s Data tab
Find the config table in the ConvexFS component
Edit the document with key: "storage"
Add freezeGc: true to the value object
Here’s exactly what you need to do:

Play
Once frozen, both GC jobs (upload GC and blob GC) will skip their cleanup work and log a message. All orphaned blobs will be preserved until you unfreeze.

Restoring deleted files
If a file was deleted but its blob hasn’t been garbage collected yet, you can restore it using the restore internal mutation.

In the Convex dashboard, navigate to the Functions tab, find internal.ops.basics.restore, and invoke it with:

blobId: The blob ID you want to restore
path: The file path where you want to restore it
This re-links the blob to a file path and increments its refCount so it won’t be garbage collected.

To find the blobId of a deleted file:

Use the dashboard to query the blobs table in the ConvexFS component. Look for blobs with refCount: 0—these are orphaned blobs awaiting GC. If you know the file’s size or content type, you can filter by those fields in the blob’s metadata.

Tip

Consider adding logging to your application’s file operations so you can correlate blob IDs with file paths. This makes recovery much easier when you need to find a specific deleted file.

Note

The restore mutation creates a new file record at the specified path. If a file already exists at that path, the restore will fail. Delete or move the existing file first.

After recovery
Once you’ve completed your investigation and restored any needed files:

Remove the freezeGc flag from the config document to re-enable garbage collection
Review your grace period—if this incident taught you that you need more recovery time, consider increasing blobGracePeriod (see Garbage collection)
Tip

For production systems with high stakes for data loss, we recommend a 7 or 14 day blob grace period. It often takes teams a few days to realize they have a subtle data loss bug. A longer grace period costs a bit more in storage but gives you much more time to discover and recover from bugs.