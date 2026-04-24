import { NextResponse } from "next/server";
import type { z } from "zod";

/**
 * Parse le corps JSON et valide avec Zod — pattern partagé par les routes POST sensibles.
 */
export async function withValidation<T>(
  req: Request,
  schema: z.ZodType<T>
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 }),
    };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Validation refusée", issues: parsed.error.flatten() },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: parsed.data };
}
