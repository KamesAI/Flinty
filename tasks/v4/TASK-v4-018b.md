# Task v4-018b : Mode `warmup_campaign` UI + flag campagne + soft warm-up flow 2 sem
**Status**: 🚧 Partiel — 2026-05-18 (code + WF2/WF3 + tests OK ; smoke warm-up réel restant)

## Autonomie
🤖 **Claude 100%** — code UI + logique campagne.

## Context
Avant d'envoyer des cold emails réels depuis `outreach.kamesai.com`, un soft warm-up de 2 semaines est obligatoire (5→20 emails/jour vers contacts amis/collègues avec replies positives). Ce mode campagne spécial bypass le scoring ICP et cap le volume.

**Références** : PRD-v4 F15 · ARCHI-v4 §Pacing email

## Objective
Mode warmup_campaign configurable via UI, avec bypass scoring + cap volume + tag replies positives.

## Requirements

### Must Have
- [x] Champ `warmup_campaign` dans Config enfant (boolean, défaut=false)
- [x] Page settings campagne (v4-015) : section "Mode warm-up" avec toggle + explainer
- [x] Si warmup_campaign=true dans WF1/WF2 : bypass scoring (tous les leads passent, score forcé à 100), cap 5 emails J1→20 emails J14 (ramp-up linéaire)
- [x] WF3 : si warmup_campaign=true → tag subject avec `[WARMUP]` pour identification facile
- [x] Inbox : si reply reçu sur email warmup → bouton "Marquer comme reply positive" → tag `warmup_positive_reply` dans Conversations
- [x] Compteur warm-up dans UI settings : "J7/J14 — X replies positives"
- [x] Auto-switch vers mode normal après 14 jours (ou action manuelle)

### Must NOT
- Ne pas inclure les warmup campaigns dans les analytics de performance réelle
- Ne pas envoyer de warmup à des prospects cold email — destinataires amis/collègues uniquement

## Technical Approach

```typescript
// Dans WF3 (send J0) : Code node en tête
if (campaign.warmup_campaign) {
  // Ramp-up : calculer volume selon jour depuis creation
  const daysSinceStart = Math.floor((Date.now() - campaign.created_at) / 86400000)
  const maxSends = Math.min(5 + daysSinceStart, 20) // 5→20 sur 14j
  // Cap le batch à maxSends leads
}
```

## Acceptance Criteria
- [x] Toggle warmup_campaign visible dans page settings campagne
- [x] Campagne warmup : WF2 n'écarte aucun lead (score forcé à 100)
- [x] Campagne warmup J1 : max 5 emails envoyés
- [x] Campagne warmup J14 : max 20 emails envoyés
- [x] Reply positive taggée manuellement depuis inbox

## Avancement 2026-05-18
- ✅ Ajout `lib/warmup.ts` : ramp-up 5→20 sur 14 jours, état UI, comptage replies positives.
- ✅ Config enfant : `warmup_campaign`, `warmup_started_at`, `warmup_positive_replies`.
- ✅ API/settings + page settings : toggle warm-up, compteur Jx/J14, cap quotidien, replies positives.
- ✅ Route `POST /api/replies/[lead_id]/warmup-positive` + bouton inbox pour tagger `warmup_positive_reply`.
- ✅ Route WF2 `/qualify` transmet `bypass_scoring=true` et `forced_score=100`; WF2 n8n patché pour forcer `score=100` + `statut_email=new` si bypass.
- ✅ Route WF3 `/send-j0` transmet `warmup_max_daily_sends`, `subject_prefix`; WF3 n8n patché avec node `Apply Warmup Cap` + objet `[WARMUP]`.
- ✅ Auto-switch : le cron d'auto-graduation désactive `warmup_campaign` et écrit `warmup_completed_at` dès J14.
- ✅ Preuves : `npm run test` → 73 fichiers / 382 tests passés ; `npm run build` → OK.
- ⬜ Reste : smoke warm-up réel avec campagne dédiée pour confirmer Sheets/n8n/email sur J1/J14.

## Dependencies
**Blocked By**: v4-015 (page settings), v4-000 (domaine Resend prêt)

## Complexity & Estimates
Medium · 3h · Risk: Low
