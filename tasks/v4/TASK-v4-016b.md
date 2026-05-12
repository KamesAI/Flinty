# Task v4-016b : Auto-graduation Setter — flip `setter_validation=false` post-warm-up si KPI ≥85%
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — module + cron n8n.

## Context
Objectif Thomas : Setter IA totalement autonome sur email + LinkedIn, sans validation préalable. Sécurité : on garde validation forcée pendant warm-up 2 sem (v4-018b), puis on bascule auto à `setter_validation=false` uniquement si l'accuracy d'intent classify ≥85% sur les 50 derniers turns (KPI M1).

L'exception EU AI Act (v4-016 — `detectsAIQuestion`) reste forcée même après graduation.

**Références** : PRD-v4 F5 · M1 KPI · v4-015 (toggle) · v4-016 (exception légale) · v4-018b (warm-up)

## Objective
Script + cron qui, à la fin du warm-up d'une campagne, mesure l'accuracy Setter et flip auto le toggle validation si seuil atteint.

## Requirements

### Must Have
- [ ] `lib/setter-graduation.ts` :
  - `computeIntentAccuracy(turns: ConversationTurn[]): number` — compare `setter_intent` vs label humain (`human_intent_label` si présent, sinon `validated=true && unchanged`) sur les 50 derniers turns d'une campagne.
  - `graduateCampaign(campaignId: string): Promise<{ graduated: boolean; accuracy: number; reason?: string }>` — si `now >= setter_validation_locked_until` ET accuracy ≥0.85 → update Config `setter_validation=false` + write Dev-Log entry + return `{graduated:true}`. Sinon return reason (`warmup_active` | `low_accuracy` | `insufficient_turns`).
- [ ] Cron n8n quotidien (extension WF13 ou nouveau WF13b) qui itère sur campagnes actives en mode warm-up et appelle `/api/setter/graduate?campaign_id=X`.
- [ ] Route `POST /api/setter/graduate` (auth via secret n8n) → appelle `graduateCampaign`.
- [ ] Email Thomas si graduation effectuée OU si après 21 jours accuracy toujours <85% (escalade).
- [ ] Tests Vitest : `computeIntentAccuracy` (cas ≥85% / <85% / <50 turns) + `graduateCampaign` (warmup actif / accuracy basse / OK).

### Must NOT
- Ne jamais flip si `setter_validation_locked_until` futur.
- Ne jamais flip si moins de 50 turns labellisés.
- Ne pas toucher au flag `forced_validation_ai_question` (v4-016 — EU AI Act intouchable).
- Pas de bascule retour auto à `true` (si Thomas veut re-locker, manuel).

## Technical Approach

```typescript
// lib/setter-graduation.ts
export async function graduateCampaign(campaignId: string) {
  const config = await readCampaignConfig(campaignId)
  if (new Date() < new Date(config.setter_validation_locked_until)) {
    return { graduated: false, accuracy: 0, reason: 'warmup_active' }
  }
  const turns = await readLastTurns(campaignId, 50)
  if (turns.length < 50) {
    return { graduated: false, accuracy: 0, reason: 'insufficient_turns' }
  }
  const accuracy = computeIntentAccuracy(turns)
  if (accuracy < 0.85) {
    return { graduated: false, accuracy, reason: 'low_accuracy' }
  }
  await updateCampaignConfig(campaignId, { setter_validation: false })
  await appendDevLog(`Setter graduated for ${campaignId} (accuracy=${accuracy})`)
  return { graduated: true, accuracy }
}
```

## Acceptance Criteria
- [ ] `npm run test setter-graduation` passe (6+ cas).
- [ ] Smoke staging : campagne avec 50 turns mock @ accuracy 90% → cron déclenche flip → Config `setter_validation=false` visible GSheet.
- [ ] Campagne avec accuracy 70% → reste verrouillée + email Thomas après 21j.
- [ ] Test EU AI Act : même après graduation, reply "êtes-vous un bot ?" → turn taggé `forced_validation_ai_question` (v4-016 toujours actif).

## Dependencies
**Blocked By**: v4-015 (toggle + locked_until), v4-016 (forced AI question), v4-018b (warm-up), v4-003 (Conversations read)

## Complexity & Estimates
Medium · 3h · Risk: Medium (mesure accuracy fiable dépend du label humain qualité)
