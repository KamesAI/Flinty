# Task v4-016 : Validation mode forcé sur question IA (Voss exception + EU AI Act)
**Status**: ✅ Terminé — 2026-05-18

## Autonomie
🤖 **Claude 100%** — logique dans lib/setter.ts + WF7 n8n.

## Context
L'article 50 de l'EU AI Act impose qu'un système IA déclare sa nature si un humain le demande explicitement. Si un prospect demande "êtes-vous une IA ?" ou équivalent, le Setter doit : passer en validation forcée pour ce thread (même si validation=false pour la campagne), et ajouter un disclaimer dans la réponse.

**Références** : PRD-v4 F5 · ARCHI-v4 §Security EU AI Act

## Objective
Détection de question IA dans le thread → forced validation pour ce lead + disclaimer dans réponse Setter.

## Requirements

### Must Have
- [x] Fonction `detectsAIQuestion(message: string): boolean` dans `lib/setter.ts` — patterns : "êtes-vous une IA", "are you an AI", "vous êtes un robot", "bot ?", "automatique ?", etc. (liste extensible)
- [x] Si `detectsAIQuestion(lastProspectMessage)=true` dans WF7 → forcer `setter_validation=true` pour ce turn (override Config) + ajouter tag `forced_validation_ai_question` dans Conversations
- [x] Prompt Setter modifié si AI question : ajouter en fin de réponse "— Cette réponse a été préparée par un assistant IA et validée par [signature]." (ou variante naturelle)
- [x] Tests Vitest : detectsAIQuestion (vrais positifs + faux négatifs)

### Must NOT
- Ne pas mentir si prospect demande directement — réponse honnête obligatoire
- Ne pas forced-validate tous les futurs turns du thread — uniquement ce turn spécifique

## Technical Approach

```typescript
// lib/setter.ts
const AI_QUESTION_PATTERNS = [
  /êtes.vous.une?\s+ia/i,
  /are\s+you\s+an?\s+(ai|bot|robot)/i,
  /vous\s+êtes\s+un\s+(robot|bot|programme)/i,
  /c['']est\s+(automatique|un\s+bot)/i,
  /est.ce\s+qu.?un\s+(humain|bot)/i,
]

export function detectsAIQuestion(message: string): boolean {
  return AI_QUESTION_PATTERNS.some(p => p.test(message))
}

// Dans classifyIntent ou routeAction :
const isAIQuestion = detectsAIQuestion(ctx.lastProspectMessage)
if (isAIQuestion) {
  // Override validation + modifier prompt système
}
```

WF7 n8n : `Code` node après classify → `if (detectsAIQuestion) { forceValidation = true; tag = 'forced_ai_question' }`

## Acceptance Criteria
- [x] `npm run test` — tests detectsAIQuestion passent (5 vrais positifs, 3 faux négatifs vérifiés)
- [x] Avec message "Vous êtes un robot ?" → turn Setter créé avec `forced_validation=true` même si Config setter_validation=false
- [x] Réponse générée contient le disclaimer EU AI Act
- [x] Turn taggé `forced_validation_ai_question` dans Conversations

## Avancement

### 2026-05-18 — Forced validation IA + disclaimer
- Ajout de `detectsAIQuestion()` et du disclaimer EU AI Act dans `lib/setter.ts`; le disclaimer utilise la signature campagne.
- `processEmailReply()` force `setter_validation=true` uniquement pour le turn courant quand `ai_disclosure=true`, retourne `forced_validation=true`, et écrit le tag `forced_validation_ai_question`.
- Extension de `Conversations` avec colonne `tags`; le header est rafraîchi avant append lorsqu'un tag est écrit, et le script migration v4 reflète la colonne.
- Aucun changement n8n graph nécessaire : WF7 consomme déjà `setter_validation` depuis `/api/setter/email-reply`; l'override backend pilote donc la branche validation.
- Preuves : `npm run test` → 68 fichiers / 356 tests ; `npm run build` → OK.

## Dependencies
**Blocked By**: v4-005 (generateResponse base), v4-015 (toggle validation mode)

## Complexity & Estimates
Medium · 2h · Risk: Low
