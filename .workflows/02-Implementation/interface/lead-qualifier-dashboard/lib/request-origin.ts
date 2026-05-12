/**
 * Origine publique pour construire des URLs absolues (callbacks n8n vers l’app).
 * Préfère l’origine dérivée de `req.url` ; sinon `VERCEL_URL` ; dernier repli localhost.
 */
export function getPublicOrigin(req: Request): string {
  try {
    const origin = new URL(req.url).origin;
    if (origin && origin !== "null") return origin;
  } catch {
    /* req.url absent ou non URL */
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}
