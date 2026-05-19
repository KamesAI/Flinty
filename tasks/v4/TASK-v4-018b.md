# Task v4-018b : Mode `warmup_campaign` UI + flag campagne + soft warm-up flow 2 sem
**Status**: 🚧 Partiel — 2026-05-19 (J1 réel envoyé + 5 replies positives ; attente J14/santé)

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
- [ ] Campagne warmup J14 : max 20 emails envoyés
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
- ⬜ Reste : J1 réel lancé le 2026-05-19 ; J14 + replies positives restent à confirmer.

## Avancement 2026-05-19 — warm-up réel minimal lancé
- ✅ Rotation API key Resend confirmée par Thomas ; rotation générale de toutes les clés prévue avant production.
- ✅ Ajout du mode `SMOKE_MODE=warmup` dans `scripts/prepare-phase1-smoke-fixture.mjs`.
- ✅ Campagne warm-up créée : `smoke_m1_20260519101708_mvok`, sheet `1INuinPyNOfNNJKZS85N6Jejy38RWV0nYiD4jknjkJ2Y`, 5 contacts fournis par Thomas insérés en `statut_email=new`.
- ✅ Route `POST /api/campaigns/[id]/send-j0` patchée pour transmettre `sheet_id` à WF3.
- ✅ WF3 staging patché : lecture/update `Leads_Qualified` sur le GSheet enfant via `body.sheet_id`; clé Resend alignée sur la clé rotée ; `lead_id` ajouté au mapping d'update.
- ✅ J1 warm-up déclenché : WF3 execution `5445` a appliqué le cap à 5 items, `Send Resend Email` a retourné 5 IDs Resend, `Email_Events` a écrit 5 événements.
- ✅ L'échec post-send de `Update statut_email` sur execution `5445` a été corrigé côté WF3 ; les 5 lignes warm-up déjà envoyées ont été réparées en `contacted` via `scripts/mark-warmup-contacted.mjs`.
- ✅ Anti-duplication vérifiée : relance de `/send-j0` après réparation → 200 `{success:false, message:"Aucun lead avec statut 'new' à contacter"}`.
- ✅ Email Health live après envoi : `allowed=true`, bounce 7j `0.0000`, complaint 7j `0.0000`.
- ✅ 5/5 replies positives confirmées par Thomas le 2026-05-19 ; `scripts/mark-warmup-positive-replies.mjs` a ajouté 5 turns `warmup_positive_reply` dans `Conversations` et mis `Config.warmup_positive_replies=5`.
- ✅ Preuves : `npm run test -- 'app/api/campaigns/[id]/send-j0/route.test.ts' lib/warmup.test.ts lib/setter-graduation.test.ts` → 3 fichiers / 18 tests ; `npm run build` → OK ; Vercel `dpl_UdsUoS8rkT1VR6fdsgvwWcUCPZty`, puis `dpl_7UmA9Vr7csg4JnH82GQJPS6sTWRX`.

**Reste avant ✅** :
- Attendre la fin réelle du warm-up 14 jours (J14 attendu le 2026-06-02 si démarrage le 2026-05-19).
- Confirmer absence de bounce/complaint après les replies et l'observation du domaine.
- Ne pas relancer `/send-j0` sur cette campagne sauf si de nouveaux contacts warm-up sont ajoutés volontairement.

## Dependencies
**Blocked By**: v4-015 (page settings), v4-000 (domaine Resend prêt)

## Complexity & Estimates
Medium · 3h · Risk: Low
