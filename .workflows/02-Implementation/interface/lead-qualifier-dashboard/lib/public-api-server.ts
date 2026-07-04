import { NextResponse } from "next/server";

import { getApiKeyRows } from "@/lib/sheets";
import { resolveWorkspaceIdFromRows } from "@/lib/public-api";

/**
 * Résout le workspace associé au header `x-api-key` (onglet ApiKeys de l'Index).
 * Retourne null si la clé est absente ou inconnue.
 */
export async function resolveWorkspaceIdFromRequest(request: Request): Promise<string | null> {
  const apiKey = request.headers.get("x-api-key") ?? "";
  if (!apiKey.trim()) return null;
  const rows = await getApiKeyRows();
  return resolveWorkspaceIdFromRows(apiKey, rows);
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, message: "Clé API invalide ou manquante (header x-api-key)" },
    { status: 401 }
  );
}
