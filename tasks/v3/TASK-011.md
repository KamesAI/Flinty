# Task 011: `lib/openrouter.ts` + API `/api/campaigns/generate-icp`
**Status**: ✅ Done

## Context
Le chat ICP a besoin d'une route serveur qui synthétise 8 Q&A en un `ICP.md` structuré via Claude Sonnet 4.5.
**OpenRouter remplace l'API Anthropic directe** — on utilise le SDK `openai` avec `baseURL: openrouter.ai/api/v1`.

**References**: PRD §3 F3 · ARCHI §Intégrations

## Objective
`POST /api/campaigns/generate-icp { answers: string[] }` retourne `{ icp_md: string }`.

## Requirements
### Must Have
- [ ] Installer `openai` npm package
- [ ] `lib/openrouter.ts` exporte `getOpenRouter()` (singleton lazy, baseURL OpenRouter)
- [ ] Route `app/api/campaigns/generate-icp/route.ts` (POST only)
- [ ] Valide `answers.length === 8` (sinon 400)
- [ ] Prompt système fixe : structure ICP.md (profil cible / problème / offre / signaux+ / signaux- / exclusions / grille scoring / hook type)
- [ ] Modèle : `anthropic/claude-sonnet-4-5`, `max_tokens: 2048`
- [ ] Timeout 30s
- [ ] Header `HTTP-Referer: https://flinty.kamesai.com` (requis par OpenRouter)

### Must NOT
- [ ] Pas de streaming dans cette tâche (réponse complète suffit)
- [ ] Pas d'écriture Sheets ici
- [ ] Ne pas installer `@anthropic-ai/sdk`

## Technical Approach

### `lib/openrouter.ts`
```ts
import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenRouter(): OpenAI {
  return (client ??= new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY!,
    defaultHeaders: {
      'HTTP-Referer': 'https://flinty.kamesai.com',
    },
  }));
}

export const CLAUDE_SONNET = 'anthropic/claude-sonnet-4-5';
```

### `app/api/campaigns/generate-icp/route.ts`
```ts
import { NextResponse } from 'next/server';
import { getOpenRouter, CLAUDE_SONNET } from '@/lib/openrouter';

const ICP_SYSTEM_PROMPT = `Tu es un expert en stratégie commerciale B2B. 
À partir des réponses d'un utilisateur, génère un ICP.md structuré avec exactement ces sections :
## Profil cible
## Problème principal
## Offre
## Signaux positifs
## Signaux négatifs
## Exclusions
## Grille de scoring
## Type de hook
Sois précis, actionnable, concis. Réponds uniquement le Markdown.`;

export async function POST(req: Request) {
  const { answers } = await req.json();
  if (!Array.isArray(answers) || answers.length !== 8) {
    return NextResponse.json({ error: '8 réponses requises' }, { status: 400 });
  }
  const userContent = answers.map((a, i) => `Q${i + 1}: ${a}`).join('\n');
  try {
    const completion = await getOpenRouter().chat.completions.create({
      model: CLAUDE_SONNET,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: ICP_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    }, { timeout: 30_000 });
    const icp_md = completion.choices[0]?.message?.content ?? '';
    return NextResponse.json({ icp_md });
  } catch {
    return NextResponse.json({ error: 'Erreur génération ICP' }, { status: 500 });
  }
}
```

## Acceptance Criteria
- [ ] `curl -X POST /api/campaigns/generate-icp -d '{"answers":["a","b","c","d","e","f","g","h"]}'` → 200 avec `icp_md` Markdown
- [ ] 400 si `answers.length !== 8`
- [ ] 500 géré si OpenRouter down

## Dependencies
**Blocked By**: Task 001

## Complexity & Estimates
Low-Medium · 2h
