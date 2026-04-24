import { NextResponse } from "next/server";
import { generateIcpBodySchema } from "@/lib/api-schemas";
import { getOpenRouter, CLAUDE_OPUS } from "@/lib/openrouter";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { withValidation } from "@/lib/with-validation";

const ICP_SYSTEM_PROMPT = `Tu es un expert en stratégie commerciale B2B. À partir des réponses d'un utilisateur, génère un ICP.md structuré avec exactement ces sections :

## Profil cible
## Problème principal
## Offre
## Signaux positifs
## Signaux négatifs
## Exclusions
## Grille de scoring
## Type de hook

Sois précis, actionnable, concis. Réponds uniquement le Markdown, sans blocs de code ni backticks.`;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`generate-icp:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes", retryAfter: rl.retryAfter },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      }
    );
  }

  const validated = await withValidation(req, generateIcpBodySchema);
  if (!validated.ok) return validated.response;

  const { answers } = validated.data;

  const userContent = answers.map((a, i) => `Q${i + 1}: ${a}`).join("\n");

  try {
    const completion = await getOpenRouter().chat.completions.create(
      {
        model: CLAUDE_OPUS,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: ICP_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      },
      { timeout: 30_000 }
    );

    const icp_md = completion.choices[0]?.message?.content ?? '';
    return NextResponse.json({ icp_md });
  } catch {
    return NextResponse.json({ error: "Erreur génération ICP" }, { status: 500 });
  }
}
