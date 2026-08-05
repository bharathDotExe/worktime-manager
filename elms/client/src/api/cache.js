// Lightweight in-memory cache for API responses.
// Cache survives React re-renders and route changes within the same session.
// It's intentionally NOT persisted to localStorage (stale data risk).

const store = new Map();

/**
 * Get a cached value. Returns undefined if missing or expired.
 * @param {string} key
 */
export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Set a cached value with a TTL in milliseconds (default 60s).
 * @param {string} key
 * @param {*} value
 * @param {number} ttlMs
 */
export function cacheSet(key, value, ttlMs = 60_000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Invalidate one or more cache keys (e.g. after a mutation).
 * Pass a string or a prefix string ending with '*' to bust by prefix.
 * @param {string} keyOrPrefix
 */
export function cacheInvalidate(keyOrPrefix) {
  if (keyOrPrefix.endsWith("*")) {
    const prefix = keyOrPrefix.slice(0, -1);
    for (const k of store.keys()) {
      if (k.startsWith(prefix)) store.delete(k);
    }
  } else {
    store.delete(keyOrPrefix);
  }
}

/** Clear entire cache (e.g. on logout). */
export function cacheClear() {
  store.clear();
}
