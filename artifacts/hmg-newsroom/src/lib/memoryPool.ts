/**
 * Memory pools and object-URL hygiene. The biggest leak vector in this app is
 * orphan `URL.createObjectURL()` blobs from WebEdit previews and image
 * frames; the pool tracks every URL we hand out and revokes them on
 * release/cleanup. Other "pools" are best-effort buffers that reuse plain
 * JS object shells — useful only for hot loops; safe to ignore otherwise.
 */

interface ObjectUrlEntry {
  url: string;
  ownerId: string;
  createdAt: number;
  size: number;
}

const objectUrls = new Map<string, ObjectUrlEntry>();
let memoryPoolHits = 0;
let memoryPoolMisses = 0;

export interface MemoryPoolStats {
  objectUrlCount: number;
  estimatedBlobBytes: number;
  hits: number;
  misses: number;
}

/**
 * Wrap `URL.createObjectURL` so we can revoke later. `ownerId` lets a
 * component (e.g. the WebEdit view) revoke all URLs it owns on unmount.
 */
export function acquireObjectUrl(blob: Blob, ownerId: string): string {
  const url = URL.createObjectURL(blob);
  objectUrls.set(url, {
    url,
    ownerId,
    createdAt: Date.now(),
    size: blob.size,
  });
  memoryPoolMisses += 1;
  return url;
}

export function releaseObjectUrl(url: string | null | undefined): void {
  if (!url) return;
  const entry = objectUrls.get(url);
  if (entry) {
    objectUrls.delete(url);
    memoryPoolHits += 1;
  }
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
}

export function releaseObjectUrlsByOwner(ownerId: string): number {
  let n = 0;
  for (const [url, entry] of objectUrls.entries()) {
    if (entry.ownerId === ownerId) {
      objectUrls.delete(url);
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
      n += 1;
    }
  }
  return n;
}

export function stalePresets(maxAgeMs: number): ObjectUrlEntry[] {
  const cutoff = Date.now() - maxAgeMs;
  const stale: ObjectUrlEntry[] = [];
  for (const e of objectUrls.values()) {
    if (e.createdAt < cutoff) stale.push(e);
  }
  return stale;
}

export function memoryPoolStats(): MemoryPoolStats {
  let bytes = 0;
  for (const e of objectUrls.values()) bytes += e.size;
  return {
    objectUrlCount: objectUrls.size,
    estimatedBlobBytes: bytes,
    hits: memoryPoolHits,
    misses: memoryPoolMisses,
  };
}

// -------------------------------------------------------------------------
// Generic typed pool — useful for transcript words / pack section results /
// frame buffers when allocations are hot and shape is uniform. Best-effort:
// V8 hidden classes already make plain object alloc cheap, so the pool's
// real value is the explicit `release()` semantic that makes leaks harder.
// -------------------------------------------------------------------------

export class TypedPool<T> {
  private free: T[] = [];
  private inUse = 0;
  private created = 0;
  constructor(
    private readonly factory: () => T,
    private readonly reset: (item: T) => void,
    private readonly maxIdle = 32,
  ) {}
  acquire(): T {
    const item = this.free.pop();
    if (item) {
      this.inUse += 1;
      memoryPoolHits += 1;
      return item;
    }
    this.inUse += 1;
    this.created += 1;
    memoryPoolMisses += 1;
    return this.factory();
  }
  release(item: T): void {
    this.inUse = Math.max(0, this.inUse - 1);
    if (this.free.length < this.maxIdle) {
      try {
        this.reset(item);
      } catch {
        /* ignore */
      }
      this.free.push(item);
    }
  }
  drain(): void {
    this.free = [];
  }
  stats() {
    return { free: this.free.length, inUse: this.inUse, created: this.created };
  }
}

export const transcriptWordPool = new TypedPool<{
  word: string;
  start: number;
  end: number;
}>(
  () => ({ word: "", start: 0, end: 0 }),
  (w) => {
    w.word = "";
    w.start = 0;
    w.end = 0;
  },
);
