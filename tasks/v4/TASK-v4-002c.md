# Task v4-002c : WF13 NEW — Email Health Monitor (Resend webhooks + cron 1h + auto-pause + bandeau UI)
**Status**: ✅ Complété — 2026-05-17

## Autonomie
🤖 **Claude 100%** — n8n via MCP + code route Next.js + composant UI.

## Context
Si le domaine `outreach.kamesai.com` atteint bounce>5% ou complaint>0.3% sur 7 jours glissants, il faut auto-pauser les campagnes et alerter Thomas avant que Resend suspende le compte. WF13 surveille les webhooks Resend et met à jour le tab `Email_Health`.

**Références** : PRD-v4 F15 · ARCHI-v4 §n8n WF13

## Objective
WF13 opérationnel sur n8n staging : reçoit bounced/complained → update Email_Health → auto-pause si seuils dépassés + bandeau rouge dashboard + email Thomas.

## Requirements

### Must Have
**WF13 n8n** :
- [x] Trigger 1 : Webhook `POST /flinty-wf13-email-health` — reçoit events Resend `email.bounced` + `email.complained`
- [x] Trigger 2 : Cron toutes les heures
- [x] Node : lit tab `Email_Health` pour le domaine `outreach.kamesai.com`
- [x] Node : calcule `bounce_rate_7d` et `complaint_rate_7d` sur fenêtre glissante 7j
- [x] Node : si `bounce_rate_7d > 0.05` → update status `paused_high_bounce`
- [x] Node : si `complaint_rate_7d > 0.003` → update status `paused_high_complaint`
- [x] Node : si pause → envoie email Thomas (Resend template simple) avec reason + date
- [x] Node : update `last_check_at` à chaque run

**Dashboard UI** :
- [x] Composant `<EmailHealthBanner>` : bandeau rouge en haut du dashboard si `email_health.status != 'active'`
- [x] Affiche reason + date pause + lien vers Email_Health tab
- [x] Disparaît automatiquement si status repasse à `active`

**Route API** :
- [x] `GET /api/email-health` — lit tab Email_Health Index → retourne status courant (pour polling UI)

### Must NOT
- Ne pas envoyer l'alerte Thomas à chaque run cron — seulement au moment du passage en pause
- Ne pas supprimer les données Email_Health existantes à chaque run

## Technical Approach

Resend webhooks setup : Dashboard Resend > Webhooks > Add endpoint :
- URL : `https://[staging-url]/api/email-health/webhook`
- Events : `email.bounced`, `email.complained`
- Signing secret → env var `RESEND_WEBHOOK_SECRET`

WF13 n8n nodes :
1. `Webhook` trigger (POST /flinty-wf13-email-health)
2. `Google Sheets` read Email_Health row (domain = outreach.kamesai.com)
3. `Code` : calcul rates 7j + décision pause
4. `Google Sheets` update row (status + last_check_at)
5. `IF` status changed to paused → `HTTP Request` POST /email (Resend alerte Thomas)

## Acceptance Criteria
- [x] WF13 déclenchable manuellement en staging (test avec faux payload bounce)
- [x] Tab Email_Health mis à jour après déclenchement
- [x] Si status=paused_high_bounce simulé → email reçu par Thomas
- [x] Bandeau `<EmailHealthBanner>` visible sur dashboard quand status paused
- [x] Bandeau absent quand status=active

## Avancement

### 2026-05-17 — Partiel livré via MCP n8n
- WF13 créé et activé sur n8n staging : `[FLINTY] WF13 - Email Health Monitor` (`ADTlRSIMEKdUR2ls`), webhook `POST /webhook/flinty-wf13-email-health`, cron horaire, read/update `Email_Health`, calcul 7j, auto-pause, alerte Resend seulement sur transition `active` → `paused_*`.
- Smoke MCP n8n : payload `email.bounced` simulé → exécution `5303` success, `Email_Health` amorcé/pausé en `paused_high_bounce`, Resend a accepté l'alerte (`id` retourné). Exécution `5304` success confirme qu'un second run met à jour sans renvoyer d'alerte.
- Dashboard : route `GET /api/email-health`, helper Sheets, composant `EmailHealthBanner` pollé toutes les 60s dans `AppShell`.
- Vérifications : `npm run test` (338 tests), `npm run build`, Playwright local `/dashboard` → bandeau visible quand `status=paused_high_bounce`.

**Reste à confirmer avant ✅** :
- Confirmé par Thomas le 2026-05-17 : email reçu sur `thomas@kamesai.com` avec objet `Domaine email en pause - paused_high_bounce`.
- Confirmé par Thomas le 2026-05-17 : webhook Resend réel enregistré vers `https://staging-n8n.kamesai.com/webhook/flinty-wf13-email-health`.

### 2026-05-17 — Done confirmé
- Réception inbox Thomas confirmée pour l'alerte `paused_high_bounce`.
- Webhook réel Resend branché sur l'URL WF13 n8n staging.
- Tous les critères applicables sont cochés ; tâche passée en ✅.

## Dependencies
**Blocked By**: v4-002b (pacing email doit exister), v4-000 (domaine Resend prêt)

## Complexity & Estimates
Medium · 3h · Risk: Medium (webhooks Resend en staging)
