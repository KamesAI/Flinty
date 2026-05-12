# Task v4-028 : Tests + E2E Phase 2 — sourcing → invitation → DM → reply → Setter LI → Calendly + smoke captcha simulé → pause auto
**Status**: ⬜ À faire

## Autonomie
🤝 **Mixte** — Claude prépare scripts + checklist. Thomas exécute le smoke en staging sur son vrai compte LinkedIn.

**Actions Claude** : scripts curl de simulation, checklist vérification, tests Vitest lib/unipile.ts.
**Actions Thomas** : connecter son compte LI via Unipile sur staging → valider sourcing d'un lead test → vérifier DM envoyé → répondre depuis son compte test → valider draft Setter LI → simuler captcha → vérifier pause.

## Context
Avant le milestone M2, smoke test end-to-end du canal LinkedIn : du sourcing jusqu'au booking via Setter LI, plus validation du circuit breaker (captcha simulé → auto-pause).

**Références** : ARCHI-v4 §Milestones M2

## Objective
Smoke E2E Phase 2 réussi en staging : sourcing LI → invitation → DM → reply → Setter LI draft → validation → Calendly link → réunion bookée.

## Requirements

### Must Have
**Tests Vitest Claude** :
- [ ] `lib/__tests__/unipile.test.ts` complet : sendInvitation, sendDM, verifyWebhookSignature
- [ ] `lib/__tests__/pacing.li.test.ts` complet : weekly cap, ramp-up, shouldAddNote, typingDurationMs

**Smoke Thomas** :
- [ ] Compte LI Thomas connecté via Unipile staging
- [ ] WF9 déclenché → ≥1 lead LI sourcé dans Leads_Raw
- [ ] WF10 run → invitation envoyée au lead test → lead.statut_li=invited
- [ ] Simuler `invitation.accepted` → DM envoyé → lead.statut_li=dm_sent
- [ ] Simuler webhook `message.received` Unipile → WF11 → draft Setter LI dans inbox
- [ ] Valider draft → DM Calendly link envoyé
- [ ] Simuler captcha payload → WF12 → status=paused_captcha → bandeau rouge dashboard

### Must NOT
- Ne pas tester sur de vrais prospects LinkedIn non consentants — utiliser compte test Thomas (ex: compte secondaire)
- Ne pas passer en prod avant smoke staging réussi

## Smoke Script

```bash
# scripts/smoke-phase2.sh

# 1. Simuler message.received Unipile
curl -X POST "$N8N_WF11_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '{"event": "message_created", "account_id": "'$UNIPILE_ACCOUNT_ID'", "message": {"text": "Votre approche m intéresse, mais j ai besoin de plus d info sur les prix", "sender": {"profile_id": "test-profile-123"}}}'

# 2. Simuler LI_Health captcha pour test circuit breaker
# (mettre status=paused_captcha directement dans GSheets + vérifier bandeau UI)
```

## Acceptance Criteria
- [ ] Tests Vitest lib/unipile.ts + pacing LI : 0 failing
- [ ] WF11 run complet < 30s sur payload simulé
- [ ] Draft Setter LI visible dans inbox avec channel=linkedin
- [ ] Circuit breaker : status=paused_captcha → WF10 s'arrête + bandeau rouge dashboard
- [ ] KPIs M2 vérifiables (accept rate Unipile logué)

## Dependencies
**Blocked By**: v4-022 → v4-027 (toute la Phase 2)

## Complexity & Estimates
High · 4h (prep 1h + smoke 3h avec Thomas) · Risk: Medium
