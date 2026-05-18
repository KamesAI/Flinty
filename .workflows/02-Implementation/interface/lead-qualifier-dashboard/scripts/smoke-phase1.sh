#!/usr/bin/env bash
set -euo pipefail

: "${N8N_WF7_WEBHOOK:?N8N_WF7_WEBHOOK doit pointer vers le webhook staging WF7}"

SMOKE_EMAIL_ID="${SMOKE_EMAIL_ID:-smoke-phase1-$(date +%Y%m%d%H%M%S)}"
SMOKE_FROM_EMAIL="${SMOKE_FROM_EMAIL:-thomas+smoke@kamesai.com}"
SMOKE_TO_EMAIL="${SMOKE_TO_EMAIL:-thomas@outreach.kamesai.com}"
SMOKE_SUBJECT="${SMOKE_SUBJECT:-Re: [TEST SMOKE] Votre offre}"

curl -sS -X POST "$N8N_WF7_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"email.replied\",
    \"data\": {
      \"email_id\": \"$SMOKE_EMAIL_ID\",
      \"from_email\": \"$SMOKE_FROM_EMAIL\",
      \"to_email\": \"$SMOKE_TO_EMAIL\",
      \"subject\": \"$SMOKE_SUBJECT\",
      \"text\": \"Bonjour, votre offre m interesse mais je veux en savoir plus sur les tarifs. Quand pouvez-vous m appeler ?\"
    }
  }"

printf '\n\nChecklist smoke Phase 1 staging:\n'
printf '1. WF7 execution success en moins de 30s, pas de branche health blocked.\n'
printf '2. GSheet enfant: Conversations contient le turn prospect puis le draft Setter.\n'
printf '3. Dashboard: /dashboard/inbox?tab=validate affiche le draft avec intent coherent.\n'
printf '4. Clic Envoyer: WF8 success, email recu, Conversations.validated_by=human.\n'
printf '5. Calendly: reserver un slot test, attendre /api/calendly/poll, Meetings contient la row.\n'
printf '6. Leads_Qualified: statut_email/statut passe a booked selon la colonne disponible.\n'
