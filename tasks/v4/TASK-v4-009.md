# Task v4-009 : WF7 n8n — webhook Resend `email.replied` → classify + generate → Conversations
**Status**: 🚧 Partiel — 2026-05-18

## Autonomie
🤖 **Claude 100%** — via MCP n8n.

## Context
WF7 est le déclencheur central du Setter email. Quand un prospect répond à un email Flinty, Resend envoie un webhook `email.replied`. WF7 orchestre : résolution campagne → chargement contexte → classify intent via `/api/setter/classify` → generate via `/api/setter/generate` → persist dans Conversations → si validation ON: draft inbox / si OFF: déclenche WF8.

**Références** : ARCHI-v4 §n8n WF7 · PRD-v4 F1 F2

## Objective
WF7 opérationnel en staging : reçoit webhook Resend reply → Setter classifie et génère → turn stocké dans Conversations.

## Avancement 2026-05-17
- ✅ Backend Next : `POST /api/setter/email-reply` orchestre classify + generate + Conversations
- ✅ `EmailReplyResult` enrichi avec `setter_validation: boolean` (lu depuis `Config.setter_validation`)
- ✅ Tests : route `email-reply` (5 tests) + pipeline `processEmailReply` (2 tests) — 10/10 verts
- ✅ **WF7 créé en staging n8n** — ID: `HsMPjDrI8oW6x7qj`, 11 nodes
  - Webhook `POST /flinty-wf7-setter-email`
  - Code Extract + Dedup (static data, garde 500 derniers email_ids)
  - IF pas skipped → Check Email Health → IF health.allowed
  - POST `/api/setter/email-reply` → IF auto-send (escalated=false AND setter_validation=false) → Trigger WF8
  - Responds OK / Skipped / Health Blocked selon cas
- ✅ WF7 activé en staging (`HsMPjDrI8oW6x7qj`)
- ⬜ Smoke test : payload Resend simulé → run complet staging
- ⬜ Latence mesurée <30s

**Reste à faire** : smoke test staging + mesure latence

## Requirements

### Must Have
- [x] Trigger Webhook n8n `POST /flinty-wf7-setter-email` — recevoir payload Resend `email.replied`
- [x] Node Extract : récupère `email_id`, `from_email`, `subject`, `text` (body reply), `to_email`
- [x] Route Next unique `POST /api/setter/email-reply` orchestre classify + generate + écriture Conversations (remplace les 3 nodes Sheets — la route résout lead/campaign elle-même)
- [x] Écriture turn prospect (role=prospect) + turn setter (role=setter, validated_by=null) dans Conversations côté Next
- [x] `setter_validation` retourné dans la réponse de la route → Node IF dans WF7 sans Sheets read supplémentaire
- [x] Node IF : setter_validation=true OU escalated=true → STOP / sinon → call WF8
- [x] Idempotent sur `email_id` (dedup via static data n8n, 500 IDs max)
- [x] WF7 activé en staging
- [ ] Latence cible : <30 sec end-to-end (à mesurer post-activation)

### Must NOT
- Ne pas répondre directement depuis WF7 si setter_validation=true
- Ne pas appeler Anthropic directement depuis n8n — passer par les routes Next.js `/api/setter/*`

## Technical Approach

Nodes WF7 :
1. `Webhook` (POST /flinty-wf7-setter-email)
2. `Code` — extract fields + dedup check (email_id déjà vu ?)
3. `Google Sheets` — read Index Campagnes (filter by campaign_id in message_id)
4. `Google Sheets` — read enfant Leads_Qualified (filter by email=from_email)
5. `Google Sheets` — read enfant Conversations (filter by lead_id)
6. `HTTP Request` POST `/api/setter/classify` → `{intent, confidence}`
7. `IF` intent in [unsubscribe, hostile, off_topic] → tag escalade → STOP
8. `HTTP Request` POST `/api/setter/generate` → `{draft_content}`
9. `Google Sheets` — append turn prospect + turn setter dans Conversations
10. `Google Sheets` — read Config setter_validation
11. `IF` setter_validation=false → `HTTP Request` POST WF8 webhook

## Acceptance Criteria
- [ ] WF7 déclenché manuellement avec payload Resend simulé → run complet sans erreur
- [x] Turn prospect + setter créés dans Conversations enfant côté route Next (couvert par tests mocks)
- [x] `setter_validation` exposé dans la réponse → IF node WF7 opérationnel
- [ ] Latence mesurée <30s sur staging
- [x] Si validation humaine → draft visible dans inbox via queue des drafts non validés
- [x] Si email_id déjà traité → WF7 s'arrête sans double-écriture (dedup static data)

## Avancement 2026-05-18
- ✅ Vérification n8n MCP : WF7 `[FLINTY] WF7 - Setter Email Reply` actif en staging.
- ⬜ Smoke payload Resend simulé et mesure <30s restent à faire avec campagne staging dédiée.

## Dependencies
**Blocked By**: v4-004 (classify), v4-005 (generate), v4-003 (conversations)

## Complexity & Estimates
High · 4h · Risk: Medium (orchestration multi-nodes + timing)
