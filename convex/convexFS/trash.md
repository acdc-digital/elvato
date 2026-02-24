Garbage collection
ConvexFS automatically manages storage cleanup through two background garbage collection (GC) jobs. You don’t need to do anything to enable them—they run automatically as part of the component.

How deletes work
When you delete a file (via fs.delete(), fs.transact(), or by overwriting a path), ConvexFS performs a “soft delete”—the file record is removed immediately, but the underlying blob data isn’t deleted right away. Instead:

The file record is deleted from the files table
The blob’s refCount is decremented
When refCount reaches 0, the blob is considered “orphaned”
After a grace period, the orphaned blob is deleted from storage
This design enables several important features:

Atomic operations - Transactions can safely roll back without losing data
Disaster recovery - Accidentally deleted files can be restored during the grace period (see Admin tools)
Efficient copies - Multiple files can reference the same blob without duplicating storage
Garbage collection routines
ConvexFS runs three separate garbage collection jobs on cron schedules:

Upload GC (UGC)
Runs: Every hour at :00

Purpose: Cleans up abandoned uploads—blobs that were uploaded but never committed to a file path.

This happens when:

A user starts an upload but navigates away before completing
An upload succeeds but the commitFiles() call fails or never runs
Uploads have 4 hours to be committed. After that, the upload GC will clean them up on its next hourly run.

Blob GC (BGC)
Runs: Every hour at :20

Purpose: Cleans up orphaned blobs—blobs with refCount=0 that are no longer referenced by any file.

This happens when:

A file is deleted
A file is overwritten with new content
The blob GC respects the configured grace period before deleting (default: 24 hours). This gives you time to recover from accidental deletions.

File GC (FGC)
Runs: Every 15 seconds

Purpose: Deletes files that have passed their expiresAt time. See File expiration for details on setting expiration.

When a file expires:

The file record is deleted
The blob’s refCount is decremented
The blob enters the normal BGC process (deleted after grace period)
Note

FGC does not respect the freezeGc flag because it doesn’t delete blob data from storage—it only removes file records. The underlying data is preserved until BGC runs, giving you time to recover if needed.

Blob grace period
The blob GC uses a grace period to avoid deleting data too quickly. By default, orphaned blobs are kept for 24 hours before being deleted. This gives you time to recover from accidental deletions.

To configure the blob grace period:

const fs = new ConvexFS(components.fs, {
  storage: {
    /* ... */
  },
  blobGracePeriod: 86400, // 24 hours in seconds (default)
});

Tip

Shorter grace periods save storage costs but reduce your recovery window. Longer grace periods give more time to recover from mistakes but use more storage. The default of 24 hours is a reasonable balance for early apps.

For mature, critical applications, we recommend a 7 or 14 day grace period. It often takes teams a few days to realize they have a subtle data loss bug in production, and a little extra money spent on soft-deletion windows is worth it.

Batch processing and error handling
Each GC run processes up to 100 items. If there are more items to clean up, the job automatically schedules an immediate follow-up run to continue processing.

If storage errors occur (e.g., Bunny.net is temporarily unavailable), the GC job stops scheduling follow-ups to avoid hammering the storage service during an outage. The next scheduled cron run will resume.