# Task v4-004 : `lib/setter.ts` — buildContext + classifyIntent (Claude Sonnet 4.6 JSON mode)
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — code TypeScript + tests Vitest (TDD).

## Context
Première moitié du module AI Setter. `buildContext` construit le prompt avec ICP + offre + lead + thread, et active le prompt caching Anthropic. `classifyIntent` envoie à Claude Sonnet 4.6 et retourne l'intent structuré. La seconde moitié (generateResponse) est en v4-005.

**Références** : ARCHI-v4 §AI Setter Pipeline steps 1-2 · PRD-v4 F1 F2

## Objective
`buildContext` et `classifyIntent` fonctionnels et testés. Prompt caching activé sur ICP+offre.

## Requirements

### Must Have
- [ ] Types : `Intent` enum (9 valeurs), `IntentResult`, `SetterContext`, `Turn`
- [ ] `buildContext(lead: Lead, campaign: Campaign, thread: Turn[]): SetterContext` — assemble ICP md + offre + ton + signature + lead 14 champs + thread formaté en string
- [ ] `classifyIntent(ctx: SetterContext): Promise<IntentResult>` — appel `@anthropic-ai/sdk` Sonnet 4.6 JSON mode, retourne `{intent, confidence, reasoning}`
- [ ] Prompt caching : ICP md + offre (cacheable\_content) marqué avec `cache_control: {type: 'ephemeral'}` pour TTL Anthropic 5 min
- [ ] Retry 1x si JSON parse échoue (same pattern v3)
- [ ] Tests Vitest : buildContext (vérifie contenu prompt), classifyIntent avec mock Anthropic (vérifie intent parsé)

### Must NOT
- Ne pas appeler Anthropic via OpenRouter pour le Setter — utiliser `@anthropic-ai/sdk` directement avec `ANTHROPIC_API_KEY`
- Ne pas hardcoder le model name — lire `process.env.SETTER_MODEL`
- Ne pas envoyer le thread complet sans limiter à N derniers turns (garder les 10 derniers max pour éviter dépassement context)

## Technical Approach

```typescript
// lib/setter.ts (partie 1)
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = process.env.SETTER_MODEL ?? 'claude-sonnet-4-6'

export type Intent =
  | 'interested' | 'objection_price' | 'objection_timing'
  | 'objection_need' | 'objection_trust' | 'meeting_ready'
  | 'off_topic' | 'unsubscribe' | 'hostile'

export interface IntentResult {
  intent: Intent
  confidence: number  // 0.0–1.0
  reasoning: string
}

export function buildContext(lead: Lead, campaign: Campaign, thread: Turn[]): SetterContext {
  const recentThread = thread.slice(-10) // max 10 derniers turns
  return {
    icpMd: campaign.icp_md,
    offer: campaign.offer,
    tone: campaign.setter_tone ?? 'formal',
    signature: campaign.setter_signature ?? 'Thomas',
    lead14fields: formatLead14(lead),
    threadStr: recentThread.map(t => `[${t.role}]: ${t.content}`).join('\n'),
  }
}

export async function classifyIntent(ctx: SetterContext): Promise<IntentResult> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: [
      {
        type: 'text',
        text: ctx.icpMd + '\n\n' + ctx.offer,
        cache_control: { type: 'ephemeral' }, // prompt caching
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Thread:\n${ctx.threadStr}\n\nClassifie l'intent du DERNIER message prospect. RÉPONDS UNIQUEMENT LE JSON:\n{"intent":"<enum>","confidence":<0-1>,"reasoning":"<court>"}`,
      },
    ],
  })
  // parse + retry si fail
}
```

## Acceptance Criteria
- [ ] `npm run test` — tests setter buildContext + classifyIntent passent
- [ ] `buildContext` inclut les 10 derniers turns max
- [ ] `classifyIntent` avec mock retourne IntentResult bien typé
- [ ] Cache headers Anthropic présents dans le payload (vérifiable via sdk debug)
- [ ] Retry 1x si JSON invalide avant de throw

## Dependencies
**Blocked By**: v4-003 (lib/conversations.ts pour le type Turn)

## Complexity & Estimates
High · 4h · Risk: Medium (intégration Anthropic SDK + prompt caching)
