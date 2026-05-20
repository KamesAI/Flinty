#!/usr/bin/env bash
set -euo pipefail

required_env=(
  N8N_WF11_WEBHOOK
  UNIPILE_ACCOUNT_ID
  TEST_LINKEDIN_PROFILE_ID
)

for name in "${required_env[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required env: ${name}" >&2
    exit 1
  fi
done

WEBHOOK_SECRET_HEADER=()
if [[ -n "${UNIPILE_WEBHOOK_SECRET:-}" ]]; then
  WEBHOOK_SECRET_HEADER=(-H "X-Unipile-Signature: simulated-${UNIPILE_WEBHOOK_SECRET:0:6}")
fi

echo "== Phase 2 smoke: message.received -> WF11 Setter LI draft =="
curl -sS -X POST "$N8N_WF11_WEBHOOK" \
  -H "Content-Type: application/json" \
  "${WEBHOOK_SECRET_HEADER[@]}" \
  -d "{
    \"event\": \"message.received\",
    \"account_id\": \"$UNIPILE_ACCOUNT_ID\",
    \"message\": {
      \"id\": \"smoke_msg_$(date +%s)\",
      \"text\": \"Votre approche m'intéresse, mais j'ai besoin de plus d'informations sur les prix.\",
      \"sender\": {
        \"profile_id\": \"$TEST_LINKEDIN_PROFILE_ID\",
        \"name\": \"Lead Test Phase 2\"
      },
      \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }
  }"

echo
echo "Expected: WF11 <30s, Conversations append channel=linkedin, inbox draft visible."

if [[ -n "${N8N_WF10_WEBHOOK:-}" ]]; then
  echo
  echo "== Phase 2 smoke: invitation.accepted -> WF10 DM post-acceptance =="
  curl -sS -X POST "$N8N_WF10_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{
      \"event\": \"invitation.accepted\",
      \"account_id\": \"$UNIPILE_ACCOUNT_ID\",
      \"profile_id\": \"$TEST_LINKEDIN_PROFILE_ID\",
      \"accepted_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }"
  echo
  echo "Expected: lead.statut_li=connected or dm_sent, DM queued with LI pacing."
else
  echo
  echo "Skip invitation.accepted: N8N_WF10_WEBHOOK is not set."
fi

if [[ -n "${N8N_WF12_WEBHOOK:-}" ]]; then
  echo
  echo "== Phase 2 smoke: paused_captcha -> WF12 circuit breaker =="
  curl -sS -X POST "$N8N_WF12_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{
      \"event\": \"paused_captcha\",
      \"account_id\": \"$UNIPILE_ACCOUNT_ID\",
      \"status\": \"ACTION_NEEDED\",
      \"captcha_detected\": true,
      \"checked_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }"
  echo
  echo "Expected: LI_Health status=paused_captcha, dashboard red banner, WF10 stops."
else
  echo
  echo "Skip paused_captcha: N8N_WF12_WEBHOOK is not set."
fi
