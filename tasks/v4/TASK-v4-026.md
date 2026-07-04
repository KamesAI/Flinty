# Task v4-026 : WF11 Setter LI — webhook `message.received` Unipile → pipeline Setter (channel=linkedin)
**Status**: 🚧 Partiel — 2026-07-04

## Autonomie
🤖 **Claude 100%** — via MCP n8n.

## Context
WF11 est le Setter pour LinkedIn. Quand un prospect répond à un DM LinkedIn, Unipile envoie un webhook `message.received`. WF11 réutilise exactement le même pipeline Setter que WF7 (Phase 1), avec `channel=linkedin` dans le payload.

**Références** : PRD-v4 F9 · ARCHI-v4 §n8n WF11

## Objective
WF11 opérationnel : webhook Unipile message → pipeline Setter LI → draft dans Conversations (channel=linkedin).

## Requirements

### Must Have
- [x] Trigger Webhook n8n `POST /flinty-wf11-setter-li` — payload Unipile `message.received` (staging dry-run actif)
- [ ] Vérification signature HMAC-SHA256 Unipile (via route API)
- [x] Extract : `account_id`, `message_text`, `sender_profile_id`
- [ ] Résout `lead_id` + `sheet_id` via `linkedin_url` → Contacts_Registry → Leads_Qualified enfant
- [ ] Charge thread Conversations (channel=linkedin OU toutes les conversations pour ce lead)
- [ ] POST `/api/setter/classify` avec `channel: 'linkedin'` dans le payload
- [ ] POST `/api/setter/generate` — même pipeline Phase 1
- [ ] Append turns dans Conversations avec `channel=linkedin`
- [x] Si `meeting_ready` : Setter propose lien Calendly direct (pas embed LI — LI ne supporte pas) (dry-run)
- [x] If setter_validation → draft inbox / ELSE → Unipile send DM (routing dry-run)

### Must NOT
- Ne pas embed Calendly dans LI — envoyer un lien texte Calendly
- Ne pas répondre aux messages Unipile propres au système (filtrer sender != Thomas)

## Technical Approach

Nodes WF11 :
1. `Webhook` (POST /flinty-wf11-setter-li) + vérif HMAC
2. `IF` sender = compte Thomas → STOP (auto-message)
3. `HTTP Request` → résolution lead via linkedin_url
4. `Google Sheets` read Conversations (lead_id)
5. `HTTP Request` POST /api/setter/classify (channel=linkedin)
6. `IF` intent = unsubscribe|hostile → escalade → STOP
7. `HTTP Request` POST /api/setter/generate
8. `Google Sheets` append turns Conversations (channel=linkedin)
9. `IF` setter_validation → STOP / ELSE → `HTTP Request` Unipile sendDM

Pour le lien Calendly dans LI :
```
// Dans le prompt Setter si channel=linkedin && meeting_ready :
// "Proposer le lien Calendly directement : [CALENDLY_LINK]"
// (pas de format naturel 3 créneaux — lien direct suffit en LI)
```

## Acceptance Criteria
- [x] WF11 déclenché avec payload Unipile simulé → run complet sans erreur
- [ ] Turn prospect (channel=linkedin) + turn setter (channel=linkedin) créés dans Conversations
- [ ] DM de réponse envoyé via Unipile (mode validation OFF)
- [x] Intent classifié en <30s (dry-run rule, exécution webhook 141ms)

## Avancement

### 2026-07-04 — WF11 staging dry-run actif
- Créé et activé n8n `[FLINTY] WF11 - Setter LI (staging dry-run ready)` (`5yBywgtkggNlS3x6`), webhook `/webhook/flinty-wf11-setter-li`.
- Code node filtre les self-messages, extrait `profile_id`, `linkedin_url`, texte, et retourne `conversation_event.channel=linkedin`.
- Smoke MCP n8n `message.received` : `action=draft_inbox`, `draft.channel=linkedin`, intent `pricing_question`, `draft.calendly_mode=text_link_only`, durée 141ms.
- `scripts/smoke-phase2.sh` signe les payloads en HMAC `sha256=` quand `UNIPILE_WEBHOOK_SECRET` est présent.

**Reste avant ✅** :
- Vérifier réellement la signature HMAC côté workflow/API avec secret Unipile.
- Résoudre `lead_id`/`sheet_id` via `Contacts_Registry`, lire/append `Conversations`.
- Appeler `/api/setter/classify` et `/api/setter/generate` live.
- Envoyer le DM Unipile quand validation OFF et credentials présents.

## Dependencies
**Blocked By**: v4-005 (Setter generate), v4-020 (lib/unipile.ts), v4-025 (WF10 pour contexte DM)

## Complexity & Estimates
High · 4h · Risk: Medium (intégration Unipile webhooks)
