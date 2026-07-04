#!/usr/bin/env bash
set -euo pipefail

required_env=(
  UNIPILE_ACCOUNT_ID
  TEST_LINKEDIN_PROFILE_ID
)

for name in "${required_env[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required env: ${name}" >&2
    exit 1
  fi
done

PHASE2_DRY_RUN="${PHASE2_DRY_RUN:-true}"
FLINTY_APP_BASE_URL="${FLINTY_APP_BASE_URL:-}"
PHASE2_API_BEARER="${PHASE2_API_BEARER:-${CRON_SECRET:-}}"
TEST_CAMPAIGN_ID="${TEST_CAMPAIGN_ID:-cmp_phase2_smoke}"
TEST_CAMPAIGN_SHEET_ID="${TEST_CAMPAIGN_SHEET_ID:-}"
TEST_LEAD_ID="${TEST_LEAD_ID:-lead_phase2_smoke_001}"

case "$PHASE2_DRY_RUN" in
  true|false) ;;
  *)
    echo "PHASE2_DRY_RUN must be true or false" >&2
    exit 1
    ;;
esac

if [[ "$PHASE2_DRY_RUN" == "false" ]]; then
  if [[ -z "$FLINTY_APP_BASE_URL" || -z "$PHASE2_API_BEARER" ]]; then
    echo "Persistent smoke requires FLINTY_APP_BASE_URL and PHASE2_API_BEARER or CRON_SECRET." >&2
    exit 1
  fi
fi

signature_header_args() {
  local payload="$1"
  if [[ -z "${UNIPILE_WEBHOOK_SECRET:-}" ]]; then
    return 0
  fi

  local signature
  signature="$(printf '%s' "$payload" | openssl dgst -sha256 -hmac "$UNIPILE_WEBHOOK_SECRET" | awk '{print $2}')"
  printf '%s\n' "-H"
  printf '%s\n' "X-Unipile-Signature: sha256=${signature}"
}

post_json() {
  local url="$1"
  local payload="$2"
  local -a signature_args=()

  if [[ -n "${UNIPILE_WEBHOOK_SECRET:-}" ]]; then
    while IFS= read -r line; do
      signature_args+=("$line")
    done < <(signature_header_args "$payload")
  fi

  curl -sS -X POST "$url" \
    -H "Content-Type: application/json" \
    "${signature_args[@]}" \
    -d "$payload"
}

if [[ -n "${N8N_WF12_WEBHOOK:-}" ]]; then
  echo "== Phase 2 smoke: WF12 paused_captcha circuit breaker =="
  payload=$(cat <<JSON
{
  "event": "paused_captcha",
  "dry_run": $PHASE2_DRY_RUN,
  "app_base_url": "$FLINTY_APP_BASE_URL",
  "api_bearer": "$PHASE2_API_BEARER",
  "account_id": "$UNIPILE_ACCOUNT_ID",
  "status": "ACTION_NEEDED",
  "captcha_detected": true,
  "invites_sent_7d": 12,
  "invites_accepted_7d": 5,
  "invites_sent_today": 2,
  "invites_sent_week": 38,
  "checked_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON
)
  post_json "$N8N_WF12_WEBHOOK" "$payload"
  echo
  echo "Expected: status=paused_captcha, should_alert=true, no persistence unless dry_run=false + app_base_url + api_bearer."
else
  echo "Skip WF12: N8N_WF12_WEBHOOK is not set."
fi

if [[ -n "${N8N_WF9_WEBHOOK:-}" ]]; then
  echo
  echo "== Phase 2 smoke: WF9 LI sourcing =="
  payload=$(cat <<JSON
{
  "dry_run": $PHASE2_DRY_RUN,
  "app_base_url": "$FLINTY_APP_BASE_URL",
  "api_bearer": "$PHASE2_API_BEARER",
  "campaign_id": "$TEST_CAMPAIGN_ID",
  "sheet_id": "$TEST_CAMPAIGN_SHEET_ID",
  "account_id": "$UNIPILE_ACCOUNT_ID",
  "channel": "linkedin_search",
  "params": { "title": "CEO", "location": "Bordeaux" },
  "profiles": [
    { "first_name": "Lead", "last_name": "Smoke", "public_identifier": "lead-smoke-phase2", "headline": "CEO", "company_name": "Smoke Co" }
  ],
  "registry_linkedin_urls": []
}
JSON
)
  post_json "$N8N_WF9_WEBHOOK" "$payload"
  echo
  echo "Expected: leads[0] normalized with linkedin_url, source_channel=linkedin_search, max_results=100."
else
  echo
  echo "Skip WF9: N8N_WF9_WEBHOOK is not set."
fi

if [[ -n "${N8N_WF10_WEBHOOK:-}" ]]; then
  echo
  echo "== Phase 2 smoke: WF10 weekly cap + organic action =="
  payload=$(cat <<JSON
{
  "dry_run": $PHASE2_DRY_RUN,
  "app_base_url": "$FLINTY_APP_BASE_URL",
  "api_bearer": "$PHASE2_API_BEARER",
  "campaign_id": "$TEST_CAMPAIGN_ID",
  "sheet_id": "$TEST_CAMPAIGN_SHEET_ID",
  "account_id": "$UNIPILE_ACCOUNT_ID",
  "health_status": "active",
  "invites_sent_today": 0,
  "invites_sent_week": 97,
  "daily_cap": 20,
  "leads": [
    { "lead_id": "lead_1", "linkedin_url": "https://www.linkedin.com/in/one", "statut_li": "new" },
    { "lead_id": "lead_2", "linkedin_url": "https://www.linkedin.com/in/two", "statut_li": "new" },
    { "lead_id": "lead_3", "linkedin_url": "https://www.linkedin.com/in/three", "statut_li": "new" },
    { "lead_id": "lead_4", "linkedin_url": "https://www.linkedin.com/in/four", "statut_li": "new" }
  ]
}
JSON
)
  post_json "$N8N_WF10_WEBHOOK" "$payload"
  echo
  echo "Expected: 3 invitations max because weekly cap 100, plus organic_action after third invitation."
else
  echo
  echo "Skip WF10: N8N_WF10_WEBHOOK is not set."
fi

if [[ -n "${N8N_WF11_WEBHOOK:-}" ]]; then
  echo
  echo "== Phase 2 smoke: WF11 message.received -> Setter LI draft =="
  payload=$(cat <<JSON
{
    "event": "message.received",
    "dry_run": $PHASE2_DRY_RUN,
    "app_base_url": "$FLINTY_APP_BASE_URL",
    "api_bearer": "$PHASE2_API_BEARER",
    "campaign_id": "$TEST_CAMPAIGN_ID",
    "sheet_id": "$TEST_CAMPAIGN_SHEET_ID",
    "lead_id": "$TEST_LEAD_ID",
    "account_id": "$UNIPILE_ACCOUNT_ID",
    "message": {
      "id": "smoke_msg_$(date +%s)",
      "text": "Votre approche m'interesse, mais j'ai besoin de plus d'informations sur les prix.",
      "sender": {
        "profile_id": "$TEST_LINKEDIN_PROFILE_ID",
        "name": "Lead Test Phase 2"
      },
      "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    }
  }
JSON
)
  post_json "$N8N_WF11_WEBHOOK" "$payload"
  echo
  echo "Expected: action=draft_inbox, conversation_event.channel=linkedin, draft.calendly_mode=text_link_only."
else
  echo
  echo "Skip WF11: N8N_WF11_WEBHOOK is not set."
fi
