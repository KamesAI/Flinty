# Task v4-009 : WF7 n8n — webhook Resend `email.replied` → classify + generate → Conversations
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — via MCP n8n.

## Context
WF7 est le déclencheur central du Setter email. Quand un prospect répond à un email Flinty, Resend envoie un webhook `email.replied`. WF7 orchestre : résolution campagne → chargement contexte → classify intent via `/api/setter/classify` → generate via `/api/setter/generate` → persist dans Conversations → si validation ON: draft inbox / si OFF: déclenche WF8.

**Références** : ARCHI-v4 §n8n WF7 · PRD-v4 F1 F2

## Objective
WF7 opérationnel en staging : reçoit webhook Resend reply → Setter classifie et génère → turn stocké dans Conversations.

## Requirements

### Must Have
- [ ] Trigger Webhook n8n `POST /flinty-wf7-setter-email` — recevoir payload Resend `email.replied`
- [ ] Node Extract : récupère `email_id`, `from_email`, `subject`, `text` (body reply), `to_email`
- [ ] Node Sheets (Index) : résout `sheet_id` + `campaign_id` via `email_id` (tag dans `message_id` Resend = `campaign_id`)
- [ ] Node Sheets (enfant) : lit lead via `from_email` → obtient `lead_id` + lead 14 champs
- [ ] Node Sheets (enfant) : lit thread Conversations pour ce `lead_id`
- [ ] Node HTTP POST `/api/setter/classify` : `{lead, campaign, thread, new_message: {content, channel:'email'}}`
- [ ] Node HTTP POST `/api/setter/generate` : `{lead, campaign, thread, intent}` → `{draft_content}`
- [ ] Node Sheets enfant : écrit turn prospect (role=prospect) + turn setter (role=setter, validated_by=null) dans Conversations
- [ ] Node IF : lit `Config.setter_validation` — si true → STOP (Thomas voit draft en inbox) / si false → call WF8
- [ ] Idempotent sur `email_id` (dedup en tête de WF)
- [ ] Latence cible : <30 sec end-to-end

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
- [ ] Turn prospect + setter créés dans Conversations enfant
- [ ] Latence mesurée <30s sur staging
- [ ] Si setter_validation=true → draft visible dans inbox (pas d'envoi auto)
- [ ] Si email_id déjà traité → WF7 s'arrête sans double-écriture

## Dependencies
**Blocked By**: v4-004 (classify), v4-005 (generate), v4-003 (conversations)

## Complexity & Estimates
High · 4h · Risk: Medium (orchestration multi-nodes + timing)
