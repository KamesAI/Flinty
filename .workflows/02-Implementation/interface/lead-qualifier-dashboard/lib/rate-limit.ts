type Entry = { count: number; windowStart: number };

const store = new Map<string, Entry>();

/** Tests uniquement — réinitialise les compteurs entre scénarios. */
export function resetRateLimitStore(): void {
  store.clear();
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real?.trim()) return real.trim();
  return "unknown";
}

/**
 * Fenêtre fixe : au plus `max` requêtes par fenêtre de `windowMs` ms.
 * @returns retryAfter en secondes (pour header Retry-After) si refusé
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
  now: number = Date.now()
): { ok: true } | { ok: false; retryAfter: number } {
  let e = store.get(key);
  if (!e || now >= e.windowStart + windowMs) {
    e = { count: 0, windowStart: now };
  }
  if (e.count >= max) {
    const retryAfter = Math.max(
      1,
      Math.ceil((e.windowStart + windowMs - now) / 1000)
    );
    return { ok: false, retryAfter };
  }
  e.count += 1;
  store.set(key, e);
  return { ok: true };
}
