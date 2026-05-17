# Task v4-017 : Tests Vitest — setter classify + generate + calendly slots formatter
**Status**: ✅ Done — 2026-05-14

## Autonomie
🤖 **Claude 100%** — suite de tests Vitest.

## Context
Phase 1 complète les tests unitaires du core Setter. Les fonctions lib/ doivent atteindre >80% de couverture avant le smoke E2E. Tests écrits TDD donc certains existent déjà ; cette task consolide et complète.

**Références** : ARCHI-v4 §Lessons v3 TDD obligatoire

## Objective
Suite Vitest complète couvrant les chemins critiques de lib/setter.ts et lib/calendly.ts.

## Requirements

### Must Have
**`lib/__tests__/setter.classify.test.ts`** :
- [x] `buildContext` : vérifie que ICP md et thread sont bien inclus dans le contexte retourné
- [x] `buildContext` : thread > 10 turns → seulement les 10 derniers inclus
- [x] `classifyIntent` : mock Anthropic retourne JSON valide → IntentResult bien typé
- [x] `classifyIntent` : mock retourne JSON invalide → retry → succès au 2ème appel
- [x] `classifyIntent` : mock retourne JSON invalide 2x → throw

**`lib/__tests__/setter.generate.test.ts`** :
- [x] `routeAction` : chacun des 9 intents → action correcte
- [x] `generateResponse` : mock Anthropic → réponse ≤120 mots
- [x] `generateResponse` : intent=meeting_ready → tool call déclenché + slots dans réponse
- [x] `generateResponse` : intent=objection_trust → modèle fallback Opus utilisé
- [x] `detectsAIQuestion` : 5 patterns testés (fr + en)

**`lib/__tests__/calendly.test.ts`** :
- [x] `formatSlotsNatural` : 3 slots fixtures → string fr-FR correct
- [x] `formatSlotsNatural` : 0 slots → chaîne vide ou message fallback
- [x] `verifyWebhookSignature` : HMAC valide → true, invalide → false

### Must NOT
- Ne pas appeler Anthropic ou Calendly en réel dans les tests (tout mocké)
- Pas de `test.skip` — si test échoue, corriger le code source

## Technical Approach

```typescript
// Mock Anthropic SDK
import { vi } from 'vitest'
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: '{"intent":"interested","confidence":0.92,"reasoning":"Prospect positif"}' }],
      }),
    }
  },
}))
```

## Acceptance Criteria
- [x] `npm run test` — 0 failing tests sur les fichiers setter + calendly
- [x] Couverture setter.ts > 80% (vérifiable via `npm run test -- --coverage`)
- [x] Cas retry JSON documenté et testé
- [x] Tous les 9 intents couverts dans `routeAction`

## Dependencies
**Blocked By**: v4-005 (generateResponse), v4-006 (calendly formatSlotsNatural), v4-016 (detectsAIQuestion)

## Complexity & Estimates
Medium · 4h · Risk: Low
