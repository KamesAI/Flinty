# Task v4-018b : Mode `warmup_campaign` UI + flag campagne + soft warm-up flow 2 sem
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — code UI + logique campagne.

## Context
Avant d'envoyer des cold emails réels depuis `outreach.kamesai.com`, un soft warm-up de 2 semaines est obligatoire (5→20 emails/jour vers contacts amis/collègues avec replies positives). Ce mode campagne spécial bypass le scoring ICP et cap le volume.

**Références** : PRD-v4 F15 · ARCHI-v4 §Pacing email

## Objective
Mode warmup_campaign configurable via UI, avec bypass scoring + cap volume + tag replies positives.

## Requirements

### Must Have
- [ ] Champ `warmup_campaign` dans Config enfant (boolean, défaut=false)
- [ ] Page settings campagne (v4-015) : section "Mode warm-up" avec toggle + explainer
- [ ] Si warmup_campaign=true dans WF1/WF2 : bypass scoring (tous les leads passent, score forcé à 100), cap 5 emails J1→20 emails J14 (ramp-up linéaire)
- [ ] WF3 : si warmup_campaign=true → tag subject avec `[WARMUP]` pour identification facile
- [ ] Inbox : si reply reçu sur email warmup → bouton "Marquer comme reply positive" → tag `warmup_positive_reply` dans Conversations
- [ ] Compteur warm-up dans UI settings : "J7/J14 — X replies positives"
- [ ] Auto-switch vers mode normal après 14 jours (ou action manuelle)

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
- [ ] Toggle warmup_campaign visible dans page settings campagne
- [ ] Campagne warmup : WF2 n'écarte aucun lead (score forcé à 100)
- [ ] Campagne warmup J1 : max 5 emails envoyés
- [ ] Campagne warmup J14 : max 20 emails envoyés
- [ ] Reply positive taggée manuellement depuis inbox

## Dependencies
**Blocked By**: v4-015 (page settings), v4-000 (domaine Resend prêt)

## Complexity & Estimates
Medium · 3h · Risk: Low
