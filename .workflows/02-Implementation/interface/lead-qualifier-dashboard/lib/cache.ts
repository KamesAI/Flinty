type Entry = { value: unknown; expiresAt: number };

const store = new Map<string, Entry>();

/** TTL par défaut : 5 minutes (TASK-022). */
export const DEFAULT_TTL_MS = 300_000;

export function cacheGet<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

export function cacheClear(): void {
  store.clear();
}

/** À appeler après mutation de l’Index (ex. POST campagne) pour éviter sheet_id obsolète. */
export function invalidateCampaignSheetIdCache(): void {
  cacheClear();
}
