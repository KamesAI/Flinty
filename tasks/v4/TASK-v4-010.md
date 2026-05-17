# Task v4-010 : WF8 n8n — `/api/replies/.../send` → Resend send + tag validated
**Status**: 🚧 Partiel — 2026-05-17 (WF8 staging actif ; smoke réel email/Sheets restant)

## Autonomie
🤖 **Claude 100%** — via MCP n8n.

## Context
WF8 est déclenché soit par WF7 (validation OFF, envoi auto) soit par Thomas via l'inbox (validation ON, clic "Envoyer"). Il récupère le draft depuis Conversations, l'envoie via Resend, et met à jour le turn avec `validated_by`.

**Références** : ARCHI-v4 §n8n WF8 · PRD-v4 F4

## Objective
WF8 opérationnel : reçoit `lead_id` + `turn_id` → fetch draft → Resend send → update Conversations validated_by.

## Avancement 2026-05-15
- ✅ Route dashboard `POST /api/replies/[lead_id]/send` créée.
- ✅ La route ne contacte pas Resend directement : elle valide le draft et déclenche `N8N_WF8_WEBHOOK` avec `{ lead_id, turn_id, sheet_id, campaign_id, validated_by, edited_content }`.
- ✅ Tests route ajoutés avec mock du déclenchement WF8.
- ✅ Workflow n8n WF8 staging créé et activé le 2026-05-17 : `[FLINTY] WF8 - Setter Send` (`CiRWb7R8a6z20rOx`).
- ⬜ Smoke réel restant : déclencher avec un vrai draft staging, vérifier email reçu + update Sheets + no-op au retry.

## Avancement 2026-05-17
- ✅ WF8 n8n créé via MCP : webhook `POST /flinty-wf8-setter-send`, lecture `Conversations`, idempotence `validated_by`, lecture `Leads_Qualified`, health check, délai Gauss, envoi Resend, updates Sheets, réponses JSON.
- ✅ Workflow activé : `CiRWb7R8a6z20rOx`.
- ✅ Validation MCP : `n8n_validate_workflow` → valid=true, 0 erreur.
- ✅ `.env.local` local mis à jour avec `N8N_WF8_WEBHOOK=https://staging-n8n.kamesai.com/webhook/flinty-wf8-setter-send` (non committé).
- ✅ Test route dashboard : `npm run test -- 'app/api/replies/[lead_id]/send/route.test.ts'` → 2/2.
- ⬜ Reste : ajouter la même variable sur Vercel staging/prod si absente, puis smoke réel.

## Requirements

### Must Have
- [x] Trigger Webhook n8n `POST /flinty-wf8-setter-send` — payload : `{lead_id, turn_id, sheet_id, validated_by?}`
- [x] Node Sheets enfant : lit turn depuis Conversations (turn_id) → récupère `content` (draft)
- [x] Node Sheets enfant : lit Leads_Qualified (lead_id) → récupère `email` destinataire
- [x] Node HTTP Resend : `POST /emails` avec `{from: RESEND_FROM, to, subject, text: draft_content}`
- [x] Node Sheets enfant : update turn dans Conversations → `validated_by = human` (si validé manuellement) ou `validated_by = auto` (si WF7 sans validation)
- [x] Node Sheets enfant : update Leads_Qualified → `last_contacted_at = now()` (implémenté sur colonne existante `last_email_sent_at`)
- [x] Idempotent sur `turn_id` (ne pas envoyer 2x si retry)

### Must NOT
- Ne pas envoyer si turn déjà `validated_by != null` (idempotence)
- Pas de Resend bulk — 1 email par WF8 run

## Technical Approach

Nodes WF8 :
1. `Webhook` (POST /flinty-wf8-setter-send)
2. `Google Sheets` — read Conversations row by turn_id → check validated_by null
3. `IF` validated_by != null → STOP (déjà envoyé)
4. `Google Sheets` — read Leads_Qualified (lead_id) → email
5. `HTTP Request` POST `https://api.resend.com/emails` (auth Bearer RESEND_API_KEY)
6. `Google Sheets` update Conversations : validated_by = `$json.validated_by ?? 'auto'`
7. `Google Sheets` update Leads_Qualified : last_contacted_at = now()

## Acceptance Criteria
- [ ] WF8 déclenché manuellement → email reçu par destinataire test
- [ ] Turn dans Conversations mis à jour : `validated_by='human'`
- [x] Deuxième trigger même turn_id → no-op (garde WF8 sur `validated_by`, smoke réel restant)
- [ ] Resend dashboard montre l'email livré

## Dependencies
**Blocked By**: v4-002 (tab Conversations), v4-009 (WF7 pour le contexte flow), v4-009b (health check)

## Complexity & Estimates
Medium · 2h · Risk: Low
