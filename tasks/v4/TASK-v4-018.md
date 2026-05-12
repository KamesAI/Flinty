# Task v4-018 : E2E smoke Phase 1 — reply test → Setter draft → validation → send → Calendly slot → tab Meetings
**Status**: ⬜ À faire

## Autonomie
🤝 **Mixte** — Claude prépare le script smoke + guide les étapes. Thomas doit déclencher le test en staging et vérifier la réception de l'email réel + le booking Calendly.

**Actions Claude** : prépare script curl + payload Resend simulé + checklist de vérification.
**Actions Thomas** : déclenche le webhook WF7 manuellement en staging → valide le draft dans l'inbox UI → vérifie l'email reçu → clique un slot Calendly → vérifie tab Meetings.

## Context
Avant de valider le milestone M1, un smoke test end-to-end complet est requis : simuler un reply prospect → Setter génère draft → Thomas valide → email envoyé → prospect "clique" Calendly → réunion bookée dans Meetings.

**Références** : ARCHI-v4 §Milestones M1

## Objective
Smoke E2E Phase 1 réussi en staging sans erreur sur le chemin complet.

## Requirements

### Must Have
**Préparation Claude** :
- [ ] Script `scripts/smoke-phase1.sh` avec payload Resend simulé `email.replied`
- [ ] Checklist exhaustive des points à vérifier à chaque étape

**Exécution Thomas** :
- [ ] Déclencher WF7 avec payload simulé (lead existant en staging)
- [ ] Vérifier dans Conversations enfant : turn prospect + turn setter créés
- [ ] Ouvrir `/dashboard/inbox?tab=valider` → draft visible avec bon intent
- [ ] Cliquer "Envoyer" → vérifier email reçu dans boîte Thomas
- [ ] Simuler webhook Calendly `invitee.created` (curl) → vérifier tab Meetings
- [ ] Vérifier statut lead = `booked` dans Leads_Qualified

### Must NOT
- Ne pas utiliser un lead prod réel pour le smoke — créer un lead test dédié
- Ne pas skip si une étape échoue — noter le bug et bloquer le milestone

## Smoke Script

```bash
# scripts/smoke-phase1.sh
#!/bin/bash
# Déclenche WF7 avec payload Resend email.replied simulé

STAGING_URL="${STAGING_URL:-https://flinty-staging.vercel.app}"
WF7_URL="${N8N_WF7_WEBHOOK}"

curl -X POST "$WF7_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "email.replied",
    "data": {
      "email_id": "smoke-test-001",
      "from_email": "thomas+smoke@kamesai.com",
      "to_email": "thomas@outreach.kamesai.com",
      "subject": "Re: [TEST SMOKE] Votre offre",
      "text": "Bonjour, votre offre m intéresse mais je veux en savoir plus sur les tarifs. Quand pouvez vous m appeler ?"
    }
  }'

echo "WF7 déclenché. Vérifier dans 30s :"
echo "1. Conversations enfant (tab Google Sheets)"
echo "2. /dashboard/inbox?tab=valider"
```

## Acceptance Criteria
- [ ] WF7 run complet en <30s sans erreur n8n
- [ ] Draft Setter visible dans inbox avec intent=objection_price ou interested
- [ ] Email envoyé via WF8 → reçu par Thomas
- [ ] Webhook Calendly simulé → row créée dans tab Meetings
- [ ] Lead statut = booked dans Leads_Qualified
- [ ] Setter intent accuracy évaluée : correct ? (tag `intent_correct` dans Conversations)

## Dependencies
**Blocked By**: v4-009 → v4-016 (tous les composants Phase 1)

## Complexity & Estimates
Medium · 3h (prep 1h + smoke 2h avec Thomas) · Risk: Medium
