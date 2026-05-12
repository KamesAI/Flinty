# Task v4-005 : `lib/setter.ts` — generateResponse + Voss/NoQuestions prompt + prompt caching + persistTurn
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — code TypeScript + tests Vitest (TDD).

## Context
Seconde moitié du Setter. Sur intent ≠ unsubscribe/hostile/off_topic, génère une réponse ≤120 mots appliquant les techniques Voss (mirroring + No-Oriented Questions). Si `meeting_ready`, appelle le tool call Calendly. Si `objection_trust`, bascule sur Opus 4.6. Stocke le draft/turn dans Conversations.

**Références** : ARCHI-v4 §AI Setter Pipeline steps 3-5 · PRD-v4 F2

## Objective
`generateResponse` et `persistTurn` fonctionnels. Pipeline Setter complet (classify → generate → persist).

## Requirements

### Must Have
- [ ] `generateResponse(ctx: SetterContext, intent: IntentResult): Promise<GeneratedResponse>` — appel Sonnet 4.6 avec system prompt Voss + ton miroir + ≤120 mots
- [ ] Fallback Opus 4.6 si `intent.intent === 'objection_trust'` (lire `SETTER_FALLBACK_MODEL`)
- [ ] Tool call `get_calendly_slots` défini dans le schema Anthropic SDK — appelé si `intent=meeting_ready`
- [ ] `persistTurn(sheetId: string, content: string, validationRequired: boolean): Promise<Turn>` — appelle `conversations.appendTurn` avec role='setter', validated_by=null
- [ ] `routeAction(intent: Intent): 'respond'|'escalate'|'stop'` — mapping intent → action
- [ ] System prompt Setter (cacheable) : techniques Voss + No-Oriented Questions + format + ton
- [ ] Tests Vitest : generateResponse (mock Anthropic), routeAction (tous les intents), persistTurn (mock sheets)

### Must NOT
- Pas de templates détectables dans les réponses
- Ne pas envoyer la réponse si validation_required=true — uniquement stocker draft
- Ne pas appeler Calendly directement depuis setter.ts — passer par `lib/calendly.ts` (v4-006)

## Technical Approach

```typescript
// System prompt Voss (cached)
const VOSS_SYSTEM = `Tu es ${ctx.signature}, assistant commercial.
Techniques obligatoires :
- Mirroring Voss : reformule 1-3 mots clés du dernier message prospect (ex: "Pas de budget..." → "Pas de budget en ce moment ?")
- Si objection : UNE seule No-Oriented Question ("Est-ce que ce serait compliqué de...?")
- Ton : miroir du prospect (formel si formel, décontracté si décontracté)
- Longueur : ≤120 mots. Pas de jargon. Pas de template.
- Si meeting_ready : propose 3 créneaux format naturel (ex: "Mardi 14h, mercredi 10h, ou jeudi 16h ?")
RÉPONDS UNIQUEMENT LA RÉPONSE EMAIL, sans préambule.`

// Tool call Calendly dans le schema
const tools = [{
  name: 'get_calendly_slots',
  description: 'Récupère 3 prochains créneaux Calendly disponibles',
  input_schema: {
    type: 'object',
    properties: { event_type_uri: { type: 'string' } },
    required: ['event_type_uri'],
  },
}]
```

## Acceptance Criteria
- [ ] `npm run test` — tous les tests generateResponse passent
- [ ] Réponse générée ≤120 mots sur prompt test "C'est trop cher"
- [ ] Réponse `meeting_ready` contient 3 slots formatés
- [ ] Fallback Opus déclenché sur `objection_trust`
- [ ] `persistTurn` écrit un turn avec role=setter et validated_by=null
- [ ] `routeAction('unsubscribe')` retourne 'stop', `routeAction('interested')` retourne 'respond'

## Dependencies
**Blocked By**: v4-004 (buildContext + classifyIntent), v4-006 (lib/calendly.ts pour tool call)

## Complexity & Estimates
High · 5h · Risk: Medium (prompt Voss + tool calls Anthropic SDK)
