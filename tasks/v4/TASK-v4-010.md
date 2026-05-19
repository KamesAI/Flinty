# Task v4-010 : WF8 n8n — `/api/replies/.../send` → Resend send + tag validated
**Status**: ✅ 2026-05-19

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

## Avancement 2026-05-18 — smoke M1
- ✅ Fixture staging disponible : campagne `smoke_m1_20260518161356_wb45`, lead `smoke_m1_20260518161356_wb45_lead_smoke_001`, email `thomas+smoke@kamesai.com`.
- ❌ WF8 non déclenché jusqu'à l'envoi réel : le workflow lit `Leads_Qualified` générique et appelle `https://flinty.kamesai.com/api/email-health`, qui ne résout pas.
- ⬜ Reste : soit créer une vraie feuille enfant dédiée avec onglet `Leads_Qualified`, soit rendre WF8 compatible `{campaign_id}_Qualified`; puis corriger l'URL health avant le test email reçu + retry no-op.

## Avancement 2026-05-18 — smoke WF8 débloqué
- ✅ Fixture dédiée avec onglet `Leads_Qualified` créée via OAuth Gmail + partagée au service account n8n : sheet `13ZqT3Lgm6ybwv3AwrGYPQHDaN-oaBJ32nH0QXVbOmFw`.
- ✅ WF8 `Check Email Health` patché vers `https://flinty.vercel.app/api/email-health?domain=outreach.kamesai.com`.
- ✅ Raccourci smoke uniquement `campaign_id` préfixé `smoke_m1_` : délai WF8 = 1s ; le délai Gauss 60–840s reste inchangé pour les autres campagnes.
- ✅ WF8 MCP déclenché avec draft `turn_1779133280696_upq4zo` : réponse HTTP 200 en 4.222s.
- ✅ GSheet vérifié : `Conversations.validated_by=human`, `Leads_Qualified.statut_email=contacted`.
- ✅ Retry même `turn_id` : réponse 200 `sent=false`, `reason=already_validated` en 1.993s.
- ✅ Thomas confirme réception de l'email test.
- ✅ Lien Calendly invalide dans l'ancien email corrigé côté code/env : fallback public `https://calendly.com/kames-ai/30min`.
- ✅ Resend dashboard confirmé 2026-05-19 : screenshot Thomas montre emails "Delivered" pour thomas@kamesai.com sujets smoke M1 Phase 1.

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
- [x] WF8 déclenché manuellement → email reçu par destinataire test
- [x] Turn dans Conversations mis à jour : `validated_by='human'`
- [x] Deuxième trigger même turn_id → no-op (garde WF8 sur `validated_by`, smoke réel restant)
- [x] Resend dashboard montre l'email livré (screenshot 2026-05-19, status Delivered)

## Dependencies
**Blocked By**: v4-002 (tab Conversations), v4-009 (WF7 pour le contexte flow), v4-009b (health check)

## Complexity & Estimates
Medium · 2h · Risk: Low
