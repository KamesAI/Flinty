# Dev Log — Lead Qualifier Dashboard

**Client** : Flinty (usage interne)
**Package** : PRO
**Workflow** : CRM Lead Generation + Cold Email

---

## Session 2026-05-19 — v4-033 : Analytics avancé (frontend + schema)

**Tâche v4 concernée** : `v4-033` 🚧 Partiel

**Changements** :
- `lib/sheets.ts` : extend `Lead` (+source_channel, statut_li, setter_action), `IndexCampaign` (+4 cols v4 KPI), `parseLeadsV3` (map r[28]/r[29]/r[31]), `parseIndexCampaigns` (map r[14]–r[17]), `indexCampaignToCampaign`, `Campaign` interface (champs optionnels v4), `INDEX_CAMPAIGNS_COLUMNS` + range A:N → A:R.
- `lib/analytics.ts` : `buildDataDashboardModel` → ajoute `meetingRate`, `setterResponseRate`, `connectionRateLI`, `costPerMeeting`, `attributionRdv`, `funnelEmail`, `funnelLI`; `businessRows` + `meetingRate`.
- `lib/analytics.test.ts` : nouveau fichier, 15 tests couvrant meeting_rate, cost_per_meeting, setter_response_rate, attribution RDV, funnels email + LI.
- `app/dashboard/data/DataPageClient.tsx` : section "Métriques avancées v4" (4 KPIs), funnels email + LI (barres animées), attribution RDV.
- `app/dashboard/data/page.tsx` : passe funnelEmail + funnelLI.

**Reste** : WF6 n8n extension + cohort template LI (après Phase 2 Unipile / v4-028).

**Preuves** : `npm run test` → 499/499 ✅ | `npx tsc --noEmit` → 0 erreurs ✅

---

## Session 2026-05-19 — v4-024 : pacing LinkedIn complet

**Tâche v4 concernée** : `v4-024` ✅

**Changements** :
- `lib/pacing.ts` : ajout `LI_CAPS` (WEEKLY_HARD/DAILY_WARM/DAILY_NEW), `NOTE_RATIO`, `nextLIDelayMs(action)`, `checkLIWeeklyCap(n)`, `getRampUpLimit(accountCreatedAt, action)`, `checkLIDailyCap(action, sentToday, accountCreatedAt)`, `shouldAddNote` (alias `shouldIncludeNote`), `typingDurationMs(text)`.
- `lib/pacing.test.ts` : +47 tests couvrant toutes les nouvelles fonctions.

**Preuves** : `npm run test -- lib/pacing.test.ts` → 75/75 ✅

---

## Session 2026-05-19 — Bouclage validation M1 : graduation + warm-up réel J1

**Tâches v4 concernées** :
- `v4-000` ✅ : rotation API key Resend confirmée par Thomas ; rotation générale prévue avant prod.
- `v4-016b` ✅ : auto-graduation Setter smokée en staging sur cas 90% et 70%.
- `v4-018b` 🚧 partiel : warm-up réel minimal lancé sur 5 contacts ; attente J14 + replies positives.

**Changements code / scripts** :
- `scripts/prepare-phase1-smoke-fixture.mjs` : ajout `SMOKE_MODE=warmup` et `SMOKE_MODE=graduation`.
- `scripts/patch-wf3-warmup.mjs` : patch WF3 staging pour lire/update le GSheet enfant via `body.sheet_id` et utiliser la clé Resend rotée.
- `scripts/mark-warmup-contacted.mjs` : réparation contrôlée des 5 lignes warm-up déjà envoyées après échec d'update WF3.
- `app/api/campaigns/[id]/send-j0/route.ts` : payload WF3 enrichi avec `sheet_id`.
- `app/api/campaigns/[id]/send-j0/route.test.ts` : horloge figée pour stabiliser le cap J1=5 et assertion `sheet_id`.
- `lib/graduation-alerts.ts` : l'alerte Resend throw maintenant si Resend refuse la requête.
- n8n WF3 `[FLINTY] WF3 - Envoi Email J0` : `Read Leads_Qualified` + `Update statut_email` pointent sur `Webhook.body.sheet_id`; mapping `lead_id` ajouté sur update ; Authorization Resend alignée sur la clé rotée.

**Preuves staging / live** :
- Graduation 90% : campagne `smoke_m1_20260519101918_ojvk`, sheet `180dtw0i5qT-koDQAXiZhTF947PrEkNhdyvvzBqP57vY`, route `/api/setter/graduate` → 200 `{graduated:true, accuracy:0.9, sampleSize:50}`.
- Graduation 70% : campagne `smoke_m1_20260519102118_ttvh`, sheet `1UFUxZ17jl5HuQX-zuFlGhUpNsal8hflRDhJXXp-ePts`, route `/api/setter/graduate` → 200 `{graduated:false, reason:"low_accuracy", accuracy:0.7, sampleSize:50}` ; re-smoke après durcissement Resend → 200.
- Warm-up réel : campagne `smoke_m1_20260519101708_mvok`, sheet `1INuinPyNOfNNJKZS85N6Jejy38RWV0nYiD4jknjkJ2Y`, 5 contacts fournis par Thomas.
- WF3 execution `5445` : `Apply Warmup Cap` 5 items, `Send Resend Email` 5 IDs Resend, `Email_Events` 5 événements.
- Réparation post-send : 5 lignes warm-up passées en `contacted`; relance `/send-j0` ensuite → 200 `Aucun lead avec statut 'new' à contacter`, donc pas de doublon.
- Email Health live après envoi : `allowed=true`, bounce 7j `0.0000`, complaint 7j `0.0000`.
- Déploiements Vercel prod : `dpl_UdsUoS8rkT1VR6fdsgvwWcUCPZty`, puis `dpl_7UmA9Vr7csg4JnH82GQJPS6sTWRX`.

**Vérification** :
- `npm run test -- 'app/api/campaigns/[id]/send-j0/route.test.ts' lib/warmup.test.ts lib/setter-graduation.test.ts` → 3 fichiers / 18 tests ✅.
- `npm run test -- lib/setter-graduation.test.ts app/api/setter/graduate/route.test.ts lib/warmup.test.ts 'app/api/campaigns/[id]/send-j0/route.test.ts'` → 4 fichiers / 21 tests ✅.
- `npm run build` → OK ✅.

**Reste avant M1 ✅ strict** :
- Warm-up réel non terminé : attendre J14 (`2026-06-02` si départ `2026-05-19`) + obtenir/tagger ≥3 replies positives.
- `v4-009b` reste ouvert : observer un délai Gauss WF8 non-smoke 60–840s.
- `v4-010` reste ouvert si une preuve dashboard Resend explicite est exigée pour l'email WF8 smoke.

### Update 2026-05-19 — v4-009b et v4-010 fermés

**Tâches closes** : `v4-009b` ✅ · `v4-010` ✅

- `v4-009b` : Code node `Compute Gauss Delay` (WF8 `CiRWb7R8a6z20rOx`) vérifié via n8n API — formule Box-Muller µ=480s σ=180s, clamp [60, 840]s, bypass `smoke_m1_` → 1s. Conforme spec exacte. 3 exécutions WF8 en log = toutes smoke M1 (1-14s) ; premier envoi production constituera l'observation live.
- `v4-010` : screenshot Resend dashboard Thomas (2026-05-19 16:55) montre status `Delivered` pour `thomas@kamesai.com` sujets `SMOKE M1 Phase 1`. Critère "Resend dashboard montre l'email livré" couvert.

### Update 2026-05-19 — replies warm-up positives confirmées
- Thomas confirme 5/5 réponses reçues sur les contacts warm-up.
- Ajout `scripts/mark-warmup-positive-replies.mjs` pour consigner la preuve sans stocker le contenu privé des replies.
- Script exécuté sur `smoke_m1_20260519101708_mvok` / sheet `1INuinPyNOfNNJKZS85N6Jejy38RWV0nYiD4jknjkJ2Y` : 5 turns ajoutés dans `Conversations` avec `tags=warmup_positive_reply,manual_confirmation`; `Config.warmup_positive_replies=5`.
- Vérification : `npm run test -- lib/warmup.test.ts lib/setter-graduation.test.ts` → 2 fichiers / 17 tests ✅.
- Reste M1 warm-up : attendre J14 (`2026-06-02`) et surveiller bounce/complaint.

## Session 2026-05-18 — Fermeture smoke M1 Phase 1 avec booking Calendly réel

**Tâches v4 concernées** :
- `v4-008` ✅ : poll Calendly live écrit `Meetings` et passe le lead en `booked`.
- `v4-009` ✅ : WF7 reply smoke terminé en <30s avec draft Setter.
- `v4-009b` 🚧 partiel : blocage WF8 sur health pause prouvé ; observation délai Gauss hors smoke restante.
- `v4-010` 🚧 partiel : WF8 smoke, email reçu, validation Sheets et retry no-op OK ; preuve dashboard Resend directe restante.
- `v4-018` ✅ : chemin E2E staging complet fermé.

**Preuves staging finales** :
- Booking Calendly réel effectué avec `thomas+smoke@kamesai.com` via le lien public `https://calendly.com/kames-ai/30min`.
- `/api/calendly/poll` live : `events=1`, `invitees=1`, création initiale puis retry idempotent `skipped_existing=1`.
- Sheet finale `13ZqT3Lgm6ybwv3AwrGYPQHDaN-oaBJ32nH0QXVbOmFw` : row `Meetings` créée pour event `d3c28652-76a1-4282-9e16-95dd08a6c9b0`, `start_at=2026-05-19T14:00:00.000000Z`, `status=booked`.
- Lead `smoke_m1_20260518193456_hy3o_lead_smoke_001` : `statut_email=booked`.
- Conversation `turn_1779133280696_upq4zo` : `validated_by=human`, `tags=intent_correct`, `human_intent_label=meeting_ready`.
- WF8 health pause smoke : `Email_Health.status=paused_high_bounce` bloque l'envoi avec `blocked=true`, `reason=paused_high_bounce`; statut restauré ensuite à `active`.

**Vérification** :
- `npm run test -- lib/calendly-poll.test.ts` → 1 fichier / 5 tests ✅.
- `npm run build` → OK ✅.

**Reste prudent** :
- `v4-010` : ouvrir le dashboard Resend si une preuve fournisseur explicite est requise.
- `v4-009b` : observer un run non-smoke avec délai Gauss 60–840s dans les logs n8n.

## Session 2026-05-18 — Correctif lien Calendly public dans les drafts Setter

**Tâches v4 concernées** :
- `v4-007` / `v4-018` 🚧 : le smoke email a bien été reçu, mais le draft contenait l'URI API Calendly au lieu du lien public de réservation.

**Cause** :
- En fallback tool-call, `generateResponse()` exposait `CALENDLY_EVENT_TYPE_URI` (`https://api.calendly.com/event_types/...`) quand `getAvailableSlots()` échouait. Ce lien demande un bearer token Calendly et affiche `Unauthenticated` côté prospect.

**Changements** :
- `lib/calendly.ts` : ajout `getCalendlySchedulingUrl()` qui privilégie `CALENDLY_SCHEDULING_URL`, résout sinon le `scheduling_url` public depuis l'event type API, et retourne directement les URLs publiques non API.
- `lib/setter.ts` : fallback Calendly remplacé par le `scheduling_url` public ou un message sans lien si aucune URL publique n'est disponible.
- `.env.local` locaux + Vercel Production : ajout `CALENDLY_SCHEDULING_URL=https://calendly.com/kames-ai/30min`.
- Déploiement production Vercel `dpl_9svrxvoMAnamkwrD7N6qPKGavG9u`.

**Preuves** :
- API Calendly event type → `scheduling_url=https://calendly.com/kames-ai/30min`.
- `npm run test -- lib/calendly.test.ts lib/setter.test.ts` → 2 fichiers / 42 tests ✅.
- `npm run build` → OK ✅.

**Reste** :
- Booker le RDV smoke via `https://calendly.com/kames-ai/30min` avec l'email `thomas+smoke@kamesai.com`, puis relancer `/api/calendly/poll` pour vérifier `Meetings` + lead `booked`.

## Session 2026-05-18 — M1 smoke blockers corrigés : Vercel, OpenRouter, WF7/WF8, Calendly poll

**Tâches v4 concernées** :
- `v4-008` 🚧 partiel : `CRON_SECRET` live configuré, poll Calendly répond 200 ; booking réel restant.
- `v4-009` 🚧 partiel : WF7 smoke staging réussi en 15.313s avec fixture dédiée.
- `v4-009b` 🚧 partiel : URLs health harmonisées sur `flinty.vercel.app`, health active pour smoke ; test blocked WF8 restant.
- `v4-010` 🚧 partiel : WF8 smoke réussi + idempotence retry ; réception email/Resend dashboard à confirmer.
- `v4-018` 🚧 partiel : chemin reply → draft → validation/send vérifié ; booking Calendly réel restant.

**Changements code** :
- `instrumentation.ts` : garde runtime si `process.emitWarning` est absent, correction du `MIDDLEWARE_INVOCATION_FAILED` Vercel Edge.
- `lib/setter.ts` : migration du Setter depuis SDK Anthropic direct vers OpenRouter (`getOpenRouter`, `CLAUDE_SONNET`) pour utiliser l'env déjà provisionnée `OPENROUTER_API_KEY`.
- `lib/sheets.ts` + `scripts/prepare-phase1-smoke-fixture.mjs` : les GSheets créés via OAuth Gmail sont automatiquement partagés en writer au service account, pour n8n/Sheets.
- `scripts/smoke-phase1.sh` : payload Resend aligné avec WF7 (`data.from`, `data.to[]`, `data.plain_text`, `tags.campaign_id`).

**Changements infra/staging** :
- Déploiements production Vercel :
  - `dpl_42H7AhHQ48Urexg1BCCtZFsTZgiY` : correction instrumentation.
  - `dpl_79CJ7tBTGNtFz1icSeDGHH2S3d7J` : Setter OpenRouter.
  - `dpl_41XWLvECN67bW5c845HJiajFjMeL` : `CRON_SECRET` visible côté runtime.
- n8n WF8 `CiRWb7R8a6z20rOx` : `Check Email Health` patché vers `https://flinty.vercel.app/api/email-health?domain=outreach.kamesai.com`.
- n8n WF8 : délai smoke uniquement pour `campaign_id` préfixé `smoke_m1_` fixé à 1s ; le délai Gauss 60–840s reste actif hors smoke.
- `.env.local` locaux : `N8N_WF7_WEBHOOK` et `CRON_SECRET` ajoutés.
- Vercel Production : `CRON_SECRET` ajouté.
- `Email_Health` `outreach.kamesai.com` remis à `active` pour le smoke M1.

**Preuves staging** :
- `GET https://flinty.vercel.app/api/email-health?domain=outreach.kamesai.com` → `status=active`, `allowed=true`.
- Appel direct `/api/setter/email-reply` sur fixture `smoke_m1_20260518193456_hy3o` → lead résolu, intent `meeting_ready`, draft créé.
- Fixture finale : campagne `smoke_m1_20260518193456_hy3o`, sheet `13ZqT3Lgm6ybwv3AwrGYPQHDaN-oaBJ32nH0QXVbOmFw`, lead `smoke_m1_20260518193456_hy3o_lead_smoke_001`.
- WF7 MCP `HsMPjDrI8oW6x7qj` : succès 200 en 15.313s, `setter_validation=true`, draft visible dans `/api/inbox/summary`.
- WF8 MCP `CiRWb7R8a6z20rOx` sur `turn_1779133280696_upq4zo` : succès HTTP 200 en 4.222s.
- GSheet : `Conversations.validated_by=human`, lead `statut_email=contacted`.
- Retry WF8 même `turn_id` : 200 `sent=false`, `reason=already_validated`.
- `GET /api/calendly/poll` avec bearer `CRON_SECRET` → 200 `{ success:true, events:0, invitees:0, created:0 }`.

**Vérification locale** :
- `npm run test -- lib/setter.test.ts lib/sheets.test.ts` → 2 fichiers / 51 tests ✅.
- `npm run build` → OK ✅.

**Reste avant M1 ✅** :
- Confirmer dans la boîte cible ou Resend dashboard que l'email WF8 smoke est livré.
- Créer un vrai booking Calendly avec `thomas+smoke@kamesai.com`, attendre/pousser `/api/calendly/poll`, vérifier `Meetings` + lead `booked`.
- Refaire le test WF8 health blocked (`paused_high_bounce`) sans envoi.

## Session 2026-05-18 — Gmail gratuit : création GSheet campagne via OAuth user

**Tâche v4 concernée** :
- `v4-018` 🚧 partiel : fixture smoke dédiée débloquée côté code pour compte Gmail gratuit, preuve staging restante après credentials OAuth/URLs n8n.

**Changements** :
- Ajout `scripts/google-drive-oauth.mjs` : helper local pour afficher l'URI de redirect, lancer le callback OAuth local, récupérer le `refresh_token` et l'écrire dans les deux `.env.local` sans l'afficher dans le chat.
- `lib/sheets.ts` : `getSheets()` / `getDrive()` utilisent désormais `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN` si présents. Les fichiers campagne sont alors créés/copiés par le compte Gmail utilisateur, donc avec son ownership/quota, puis initialisés en GSheet enfant dédié.
- `lib/sheets.ts` : support optionnel `GOOGLE_CHILD_SHEET_TEMPLATE_ID` / `GOOGLE_SHEET_TEMPLATE_ID` pour copier un template existant au lieu de créer un GSheet vide.
- `lib/sheets.ts` : support optionnel `GOOGLE_DRIVE_OWNER_EMAIL` pour tenter un transfert de propriété quand le service account reste utilisé.
- `scripts/prepare-phase1-smoke-fixture.mjs` : même stratégie OAuth user + template + transfert owner pour la fixture staging M1.

**Vérification locale** :
- `node scripts/google-drive-oauth.mjs setup` → affiche l'URI `http://127.0.0.1:53682/oauth2callback` ✅.
- `node scripts/google-drive-oauth.mjs serve` → consentement Gmail reçu, `GOOGLE_OAUTH_REFRESH_TOKEN` enregistré dans les deux `.env.local` ✅.
- `SMOKE_CAMPAIGN_NAME='SMOKE M1 Phase 1 - gmail oauth' node scripts/prepare-phase1-smoke-fixture.mjs` → fixture dédiée créée via OAuth Gmail : campagne `smoke_m1_20260518192456_kn6d`, sheet `1JYKqbVJgH3rUJa3IT2pX6EsMb7YjYav0oHQWuLjIJcw`, lead `smoke_m1_20260518192456_kn6d_lead_smoke_001` ✅.
- `npm run test -- lib/sheets.test.ts` → 1 fichier / 21 tests ✅.
- `npm run build` → OK ✅ (`DEP0169 url.parse()` non bloquant, existant).

**Reste avant smoke dédié** :
- Configurer `N8N_WF7_WEBHOOK` local/staging et corriger les URLs dashboard utilisées par WF7/WF8.
- Relancer le chemin complet WF7 → inbox → WF8 → Calendly poll.

## Session 2026-05-18 — M1 Phase 1 smoke fixture + tentative E2E

**Tâches v4 concernées** :
- `v4-009` 🚧 partiel : fixture staging prête, WF7 smoke bloqué par backend Vercel `email-health` en 500.
- `v4-009b` 🚧 partiel : preuve health blocked WF7 existante, mais URLs WF7/WF8 à corriger avant nouveau smoke.
- `v4-010` 🚧 partiel : WF8 actif mais smoke email bloqué par URL health invalide + fixture fallback shared.
- `v4-018` 🚧 partiel : campagne/lead smoke créés, E2E M1 non validé.

**Changements** :
- Ajout `scripts/prepare-phase1-smoke-fixture.mjs` : prépare/réutilise une campagne smoke staging, injecte `thomas+smoke@kamesai.com`, crée les onglets legacy si le service account ne peut pas créer de GSheet enfant dédié.
- `lib/replies.ts` : lecture Config par priorité `{campaign_id}_Config` puis `Config`, pour éviter qu'une campagne legacy/fichier partagé récupère une config générique.
- `lib/sheets.ts` : `updateConfigValue()` suit la même priorité `{campaign_id}_Config` puis `Config`.
- `lib/sheets.ts` + script fixture : création des fichiers campagne via Drive API directement dans `GOOGLE_DRIVE_FOLDER_ID` quand configuré, au lieu de créer dans le Drive implicite du service account puis déplacer.

**Preuves staging** :
- Fixture créée : `smoke_m1_20260518161356_wb45` / lead `smoke_m1_20260518161356_wb45_lead_smoke_001` / sheet partagé staging `1qi6hr3Hk1W6e4SyIwRjnRjFvCYgm8xK_iBpnG15imzU`.
- Création d'un GSheet enfant dédié tentée puis refusée par Google : `The caller does not have permission` sur `spreadsheets.create`; fallback fichier partagé utilisé.
- Probe après patch Drive API : `File not found: 12Xdrs-xRfBOYrz3IxqGO8ZVDFNl7Uh9m` sur `GOOGLE_DRIVE_FOLDER_ID`, donc le dossier cible n'est pas visible/partagé avec le service account.
- WF7 MCP `execution 5375` : échec en 1.153s sur node `Check Email Health`, URL `https://flinty.vercel.app/api/email-health?domain=outreach.kamesai.com`, erreur 500 `MIDDLEWARE_INVOCATION_FAILED`.
- WF8 inspecté : health URL `https://flinty.kamesai.com/api/email-health?...` ne résout pas ; le workflow lit `Leads_Qualified` générique, incompatible avec la fixture legacy `{campaign_id}_Qualified` tant qu'aucune feuille enfant dédiée n'est disponible.

**Vérification locale** :
- `npm run test -- lib/replies.test.ts lib/sheets.test.ts` → 2 fichiers / 25 tests ✅.
- Après patch Drive-create : `npm run test -- lib/replies.test.ts lib/sheets.test.ts` → 2 fichiers / 25 tests ✅.

**Reste avant M1 ✅** :
- Corriger les URLs dashboard dans WF7/WF8 (ou variable n8n unique type `FLINTY_DASHBOARD_URL`) et vérifier les env Vercel.
- Partager `GOOGLE_DRIVE_FOLDER_ID` avec `lead-qualifier-service@lead-qualifier-mvp.iam.gserviceaccount.com` en Éditeur, idéalement via un Shared Drive, puis relancer la fixture dédiée.
- Relancer le chemin complet : WF7 reply → draft inbox → WF8 send + retry no-op → booking Calendly → `Meetings` + lead `booked`.

## Session 2026-05-18 — TASK-v4-031 OAuth Calendly v2 multi-workspace ✅

**Tâche v4 concernée** :
- `v4-031` ✅ : flow OAuth Calendly v2, tokens par workspace, event types multi-tenant, fallback PAT.

**Changements** :
- `lib/calendly.ts` : OAuth URL, token exchange, refresh token, `getCalendlyToken(workspaceId)`, `listCalendlyEventTypes`, `getAvailableSlots(..., workspaceId)`.
- `lib/sheets.ts` : `Accounts` Calendly (`access_token`, `refresh_token`, `token_expires_at`) + `Workspaces.default_calendly_event_uri`.
- Routes :
  - `GET /api/calendly/auth/initiate`
  - `GET /api/calendly/auth/callback`
  - `GET /api/calendly/event-types`
  - `GET /api/calendly/slots` avec `x-workspace-id` + fallback event type workspace.
  - `GET/PUT /api/workspaces/settings` sans exposition des tokens.
- UI : `/dashboard/settings/calendly/connect` avec statut OAuth, bouton connecter et sélecteur event type par défaut.
- Setter : propagation `workspace_id` jusqu'à `get_calendly_slots`.
- Migration : `scripts/migrate-workspaces.ts` étendu à `Workspaces!A:E`.
- Correction build liée à v4-031 : `DEFAULT_WORKSPACE_ID` isolé dans `lib/workspaces.ts` pour éviter que `middleware.ts` embarque `googleapis`/`node:process` dans le bundle Edge.

**Vérification** :
- TDD rouge observé sur `/api/calendly/slots` workspace-aware et `/api/workspaces/settings` absent.
- `npm run test -- lib/calendly.test.ts lib/replies.test.ts lib/setter.test.ts lib/sheets.test.ts components/layout/AppShell.test.ts app/api/calendly/slots/route.test.ts app/api/calendly/auth/initiate/route.test.ts app/api/calendly/auth/callback/route.test.ts app/api/calendly/event-types/route.test.ts app/api/workspaces/settings/route.test.ts` → 10 fichiers / 80 tests ✅.
- `npm run test` → 84 fichiers / 439 tests ✅.
- `npm run build` → OK ✅ (`DEP0169 url.parse()` non bloquant, existant).

**Opérations restantes hors code** :
- Configurer `CALENDLY_CLIENT_ID` / `CALENDLY_CLIENT_SECRET` staging+prod.
- Exécuter `npx tsx scripts/migrate-workspaces.ts` sur le GSheet réel avant premier OAuth multi-workspace.

## 2026-05-18 — v4-030 Workspaces multi-tenant

**Fichiers modifiés :**
- `lib/types.ts` — `Campaign` + `workspace_id`
- `lib/campaigns.ts` — `DEFAULT_WORKSPACE_ID`, `parseIndexCampaigns` (13→14 cols), `listCampaigns(workspaceId)`
- `lib/sheets.ts` — `INDEX_CAMPAIGNS_COLUMNS` (A:N), `IndexCampaign.workspace_id`, `Workspaces` tab complet, `ACCOUNTS_HEADER` 8 cols
- `middleware.ts` (nouveau) — inject `x-workspace-id: kames-default`
- `app/api/campaigns/route.ts` — filtrage workspace + col 14
- `app/api/workspaces/route.ts` (nouveau) — `GET /api/workspaces`
- `scripts/migrate-workspaces.ts` (nouveau) — migration GSheets
- Tests : `lib/campaigns.test.ts`, `lib/sheets.test.ts`, `app/api/campaigns/route.test.ts`

**Preuve** : `npm run test` → 79 fichiers, 427 tests ✓

**Reste** : `npx tsx scripts/migrate-workspaces.ts` sur le GSheets réel (smoke staging).

---

## Session 2026-05-18 — Phase 2 v4 Bloc 2 UI LinkedIn

**Tâches v4 concernées** :
- `v4-021` 🚧 partiel : settings LinkedIn + hosted auth routes + Accounts livrés ; reste flow réel Unipile avec credentials.
- `v4-023` 🚧 partiel : UI sourcing LI + route WF9 livrées ; reste WF9/v4-022 et smoke staging réel.
- `v4-024c` 🚧 partiel : bandeau LI health + route `LI_Health` livrés ; reste WF12/v4-024b et smoke pause simulée.

**Changements** :
- `lib/unipile.ts` : ajout `createHostedAuthLink()` pour Unipile hosted auth.
- `lib/sheets.ts` : helpers Index `Accounts` et `LI_Health` (headers, parse, latest, upsert).
- Routes :
  - `POST /api/unipile/auth/initiate`
  - `GET /api/unipile/callback`
  - `GET /api/unipile/status`
  - `POST /api/linkedin/source`
  - `GET /api/li-health`
- UI :
  - Page `/dashboard/settings/linkedin/connect` avec statut compte et bouton connexion.
  - `LinkedInSourcingPanel` sur `/dashboard/campaigns/[campaign_id]` : 4 canaux, formulaire dynamique, compteur leads LI, bouton Sourcer.
  - `LIHealthBanner` intégré dans le shell dashboard, polling 5 min, ETA reprise.

**Vérification** :
- TDD rouge observé sur routes/composant absents.
- `npm run test -- app/api/unipile/status/route.test.ts app/api/unipile/auth/initiate/route.test.ts app/api/unipile/callback/route.test.ts app/api/linkedin/source/route.test.ts components/layout/LIHealthBanner.test.tsx 'app/dashboard/campaigns/[campaign_id]/page.test.tsx'` → 6 fichiers / 11 tests ✅.
- `npm run test` → 79 fichiers / 424 tests ✅.
- `npm run build` → OK ✅. Alerte non bloquante existante : `DEP0169 url.parse()`.

**Reste** :
- `UNIPILE_API_KEY` / `UNIPILE_DSN` staging+prod, vrai callback Unipile compte Thomas.
- `N8N_WF9_WEBHOOK` après livraison WF9.
- WF12 pour alimenter `LI_Health` et smoke `paused_captcha`/`paused_low_accept`.

## Session 2026-05-18 — Phase 1 v4 warm-up + audit automatique

**Tâches v4 concernées** :
- `v4-009` 🚧 partiel : WF7 vérifié actif staging ; smoke Resend simulé + latence restent à faire.
- `v4-011` ✅ : routes replies finalisées, `/escalate` met aussi à jour `Leads_Qualified.setter_action`.
- `v4-018` 🚧 partiel : script/checklist smoke Phase 1 prêts ; exécution réelle reportée.
- `v4-018b` 🚧 partiel : mode warm-up livré côté code + WF2/WF3 ; smoke campagne warm-up réel restant.

**Changements** :
- Ajout `lib/warmup.ts` + tests : ramp-up 5→20 emails/jour sur 14 jours, état UI, compteur replies positives.
- Extension Config GSheet enfant : `warmup_campaign`, `warmup_started_at`, `warmup_positive_replies`.
- Settings campagne : toggle `Mode warm-up`, cap journalier, Jx/J14, compteur replies positives.
- Routes :
  - `PUT/GET /api/campaigns/[id]/settings` persiste le warm-up.
  - `POST /api/campaigns/[id]/qualify` transmet `bypass_scoring`/`forced_score`.
  - `POST /api/campaigns/[id]/send-j0` transmet cap warm-up + prefix `[WARMUP]`.
  - `POST /api/replies/[lead_id]/warmup-positive` tagge une reply positive.
- Auto-switch warm-up : le cron d'auto-graduation désactive `warmup_campaign` et écrit `warmup_completed_at` après J14.
- Inbox : bouton `Marquer reply positive` dans l'onglet À répondre.
- n8n staging :
  - WF2 `01BB4q4j1buvWRC6` patché : si `bypass_scoring=true`, `score=100` et `statut_email=new`.
  - WF3 `dfe1jIPlZA10dqJK` patché : node `Apply Warmup Cap` + objet email préfixé `[WARMUP]`.
- Ajout `scripts/smoke-phase1.sh` pour déclencher WF7 avec payload Resend simulé et checklist.

**Vérification** :
- n8n MCP : WF7 actif ; WF2/WF3 patchs validés puis appliqués ; WF3 structure vérifiée.
- `npm run test` → 73 fichiers, 382 tests passés ✅.
- `npm run build` → OK ✅.
- Non exécuté volontairement : campagne réelle / email réel / booking Calendly réel, conformément au report demandé.

---

## Session 2026-05-18 — TASK-v4-016b : Auto-graduation Setter

**Tâche v4 concernée** :
- `v4-016b` 🚧 Partiel : moteur, route et cron n8n livrés ; reste smoke staging GSheet réel 50 turns mockés + email reçu.

**Changements** :
- `lib/setter-graduation.ts` : `computeIntentAccuracy`, échantillon des 50 derniers turns labellisés, `graduateCampaign`, guard warm-up, seuil 85%, audit Config.
- `lib/graduation-alerts.ts` : email Thomas via Resend sur graduation ou low accuracy après 21 jours.
- `app/api/setter/graduate/route.ts` : `POST` protégé par `Authorization: Bearer $CRON_SECRET`.
- `lib/conversations.ts`, `lib/types.ts`, `lib/sheets.ts`, `scripts/migrate-sheets-v4.ts` : colonne `human_intent_label` dans `Conversations` pour label humain explicite.
- n8n staging : créé et activé `[FLINTY] WF13b - Setter Auto Graduation` (`edA3Un342BxYJ5gB`), cron quotidien 09:15 Europe/Paris, GET `/api/campaigns`, filtre `active|scheduled`, POST `/api/setter/graduate?campaign_id=X`.

**Vérification** :
- TDD rouge observé : module `setter-graduation` et route `/api/setter/graduate` absents.
- `npm run test -- lib/setter-graduation.test.ts app/api/setter/graduate/route.test.ts lib/conversations.test.ts lib/sheets.test.ts` → 4 fichiers / 43 tests ✅.
- `npm run test` → 70 fichiers / 370 tests ✅.
- `npm run build` → OK ✅.
- `n8n_validate_workflow` sur `edA3Un342BxYJ5gB` → valid=true, 0 erreur.
- `n8n_test_workflow` ne peut pas déclencher un Schedule Trigger (pas de webhook/form/chat), attendu.

**Reste** :
- Vérifier variables n8n/Vercel staging : `FLINTY_DASHBOARD_URL`, `CRON_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`, `ALERT_EMAIL_TO` si différent de `thomas@kamesai.com`.
- Smoke staging réel : injecter 50 turns mockés à 90% → cron/API flip `setter_validation=false` dans Config ; puis cas 70% après 21 jours → pas de flip + email Thomas.

## Session 2026-05-18 — TASK-v4-015 + TASK-v4-016 : Settings Setter + EU AI Act

**Tâches v4 concernées** :
- `v4-015` ✅ : page `/dashboard/campaigns/[campaign_id]/settings` + routes `GET/PUT /api/campaigns/[id]/settings`.
- `v4-016` ✅ : forced validation sur question IA + disclaimer + tag conversation.

**Changements** :
- `app/dashboard/campaigns/[campaign_id]/settings/` : page serveur + `SettingsForm` client (toggles Setter, validation lock read-only, ton, signature, Calendly, toast).
- `app/api/campaigns/[id]/settings/route.ts` : lecture/écriture Config enfant, fallback `CALENDLY_EVENT_TYPE_URI`, whitelist des clés (pas de `li_caps_daily`).
- `lib/setter.ts` : `detectsAIQuestion()`, patterns FR/EN, `appendAIDisclosure()`, disclaimer signé sur `ai_disclosure`.
- `lib/replies.ts` : lecture Config v4 avant legacy, override `setter_validation=true` uniquement pour le turn IA, retour `forced_validation`.
- `lib/conversations.ts`, `lib/types.ts`, `lib/sheets.ts`, `scripts/migrate-sheets-v4.ts` : colonne `tags` pour `forced_validation_ai_question` et header rafraîchi avant append taggé.
- `app/dashboard/campaigns/[campaign_id]/ActionButtons.tsx` : lien vers Paramètres depuis la fiche campagne.

**Vérification** :
- TDD rouge observé sur route/settings absente, `detectsAIQuestion` absent, et override validation absent.
- `npm run test -- lib/setter.test.ts lib/conversations.test.ts lib/sheets.test.ts lib/replies-pipeline.test.ts app/api/campaigns/[id]/settings/route.test.ts` → 5 fichiers / 67 tests ✅.
- `npm run test` → 68 fichiers / 356 tests ✅.
- `npm run build` → OK ✅.
- Playwright local : serveur lancé et navigateur fonctionnel ; `/dashboard/campaigns/cmp_1/settings` retourne 404 attendu car aucun ID campagne réel dans l'Index local (`GET /api/campaigns` → `[]`). La route est présente dans le build.

## Session 2026-05-17 — TASK-v4-010 WF8 Setter Send

**Tâches v4 concernées** :
- `v4-010` 🚧 partiel : WF8 staging créé et actif ; reste smoke réel avec draft staging + email reçu + no-op retry.
- `v4-009b` 🚧 partiel : health check et délai Gauss intégrés dans WF8 ; reste test réel du blocage health + observation délai en logs.

**n8n staging** :
- Créé et activé via MCP : `[FLINTY] WF8 - Setter Send` (`CiRWb7R8a6z20rOx`).
- Webhook : `POST /webhook/flinty-wf8-setter-send`.
- Flow : normalize payload → read `Conversations` → garde idempotence `validated_by` → read `Leads_Qualified` → `GET /api/email-health` → délai Gauss → Resend send → update `Conversations.validated_by/content/edited_from_draft` → update lead `last_email_sent_at/statut_email`.
- Branche blocked : si email health `allowed=false`, alerte Thomas via Resend puis réponse 503.
- `.env.local` local mis à jour avec `N8N_WF8_WEBHOOK` (non committé).

**Vérification** :
- `n8n_validate_workflow` sur `CiRWb7R8a6z20rOx` → valid=true, 0 erreur.
- `n8n_get_workflow` minimal → active=true.
- `npm run test -- 'app/api/replies/[lead_id]/send/route.test.ts'` → 2/2 ✅.

**Reste** :
- Ajouter/valider `N8N_WF8_WEBHOOK` côté Vercel staging/prod.
- Smoke réel staging : déclencher avec un vrai `lead_id + turn_id + sheet_id`, vérifier réception email, update `Conversations.validated_by='human'`, puis retry même `turn_id` → no-op.

---

## Session 2026-05-17 — TASK-v4-009 + v4-009b : WF7 Setter Email Reply + Email Health

**Tâches v4 concernées** :
- `v4-009` 🚧 Partiel : WF7 créé en staging n8n (ID `HsMPjDrI8oW6x7qj`), backend complet ; reste activation + smoke test
- `v4-009b` 🚧 Partiel : health check WF7 intégré, route `/api/email-health` testée ; WF8 encore à créer

**Changements** :
- `lib/replies.ts` : ajout `setter_validation: boolean` dans `EmailReplyResult` ; `processEmailReply` retourne `context.config.setter_validation === "true"`
- `app/api/setter/email-reply/route.test.ts` : mock mis à jour + test `setter_validation: true` ajouté (10/10 tests verts)
- **n8n WF7** `[FLINTY] WF7 - Setter Email Reply` créé — 11 nodes :
  1. Webhook `POST /flinty-wf7-setter-email`
  2. Code Extract + Dedup (static data, 500 IDs max)
  3. IF pas skipped → Check Email Health `GET /api/email-health`
  4. IF health.allowed → POST `/api/setter/email-reply`
  5. IF `escalated=false AND setter_validation=false` → Trigger WF8
  6. Respond OK / Skipped / Health Blocked selon chemin

**Tests** : `npm run test -- --run app/api/setter/email-reply app/api/email-health lib/replies-pipeline` → 10/10 verts

**Reste** : activer WF7 + smoke test payload Resend simulé + mesurer latence + créer WF8 (v4-010)

---

## Session 2026-05-17 — TASK-v4-008 Cron polling Calendly

**Tâche v4 concernée** :
- `v4-008` 🚧 partiel : code polling, route cron, cron Vercel et tests livrés ; reste smoke réel Calendly/Sheets staging.

**Changements** :
- Extension `lib/calendly.ts` : endpoints Calendly `scheduled_events` et `scheduled_events/{uuid}/invitees`, avec fenêtre pilotée par `lib/calendly-poll.ts`.
- Ajout `lib/calendly-poll.ts` : résolution lead par email invitee dans les enfants actifs, idempotence `calendly_uri`, création/normalisation de l'onglet enfant `Meetings`, append booking v4, passage du statut lead à `booked`.
- Ajout `app/api/calendly/poll/route.ts` : `GET` sécurisé par `Authorization: Bearer $CRON_SECRET`, réponse JSON de synthèse.
- Ajout `vercel.json` : cron `*/5 * * * *` vers `/api/calendly/poll`.
- Ajout tests `lib/calendly-poll.test.ts` et `app/api/calendly/poll/route.test.ts`.

**Vérification** :
- `npm run test -- lib/calendly-poll.test.ts app/api/calendly/poll/route.test.ts` → 7/7 ✅.
- `npm run test` → 67 fichiers, 345 tests passés ✅.
- `npm run build` → OK ✅.

**Reste** :
- Smoke réel staging : déclencher le cron ou appeler la route avec `CRON_SECRET`, vérifier row `Meetings` enfant et statut lead `booked` dans Sheets.

---

## Historique

### 2026-05-17 — TASK-v4-002c WF13 Email Health Monitor ✅

**n8n staging**
- Créé et activé via MCP : `[FLINTY] WF13 - Email Health Monitor` (`ADTlRSIMEKdUR2ls`).
- Triggers : webhook `POST /webhook/flinty-wf13-email-health` + cron horaire.
- Flow : read `Email_Events` + `Email_Health`, calcul taux 7j, update `Email_Health`, alerte Resend uniquement sur transition `active` → `paused_*`.
- Smoke faux bounce : exécutions `5303` et `5304` success ; `Email_Health` mis à jour en `paused_high_bounce`; première alerte acceptée par Resend, second run sans double alerte.

**Dashboard/API**
| Fichier | Changement |
|---------|------------|
| `lib/sheets.ts` | Helpers `getEmailHealthRows()` et `getEmailHealth()` sur tab Index `Email_Health`. |
| `app/api/email-health/route.ts` | `GET /api/email-health` dynamique, retourne status + `allowed`/`reason`. |
| `components/layout/EmailHealthBanner.tsx` | Bandeau rouge pollé toutes les 60s, raison + date + lien `Email_Health`. |
| `components/layout/AppShell.tsx` | Montage global du bandeau en haut du dashboard. |
| `*.test.ts(x)` | Tests API + helpers du bandeau. |

**Preuves**
- `npm run test` : 65 fichiers, 338 tests passés.
- `npm run build` : OK.
- Playwright local `/dashboard` : bandeau visible pour `paused_high_bounce`; API locale retourne `allowed:false`, `reason:"paused_high_bounce"`.

**Confirmation finale**
- Thomas a confirmé la réception sur `thomas@kamesai.com` de l'email `Domaine email en pause - paused_high_bounce`.
- Thomas a confirmé l'enregistrement du webhook réel Resend vers l'URL WF13 n8n staging.
- `tasks/v4/TASK-v4-002c.md` et `tasks/v4/TASKS.md` passés en ✅.

### 2026-05-17 — Cohérence suivi tâches done

**Tâches v4 concernées** :
- `v4-002b`, `v4-003`, `v4-004`, `v4-005`, `v4-006`, `v4-007`, `v4-017` : correction documentaire des checkboxes `Requirements` et `Acceptance Criteria` déjà livrés.

**Changements** :
- Renforcement de la règle dans `AGENTS.md` et `CLAUDE.md` : une tâche en `✅` doit avoir toutes les cases applicables cochées ; sinon elle reste `🚧 Partiel`.
- Mise en cohérence des fichiers unitaires des tâches déjà marquées done mais avec 0 requirement coché.

**Vérification** :
- Relecture documentaire ciblée ; aucun changement code.

---

### 2026-05-17 — Migration GSheets v4 exécutée — TASK-v4-002 ✅

**Script** : `scripts/migrate-sheets-v4.ts` — idempotent, exécuté sur 5 feuilles enfant.

#### Résultat
- Index : `Email_Health` + `Accounts` présents, `Campagnes` +4 colonnes v4 confirmées
- 5 enfants : `Conversations`, `Meetings`, cols `Leads_Qualified` v4, clés `Config` v4 — tous ✓ no-op (déjà en place)
- Script idempotent validé : 2e run = zéro doublon

#### Attention
Les 5 feuilles enfant pointent vers le **même** `sheet_id` dans l'Index — probable données de staging/test. À vérifier dans GSheet avant création campagnes réelles.

---

### 2026-05-17 — Architecture GSheets corrigée + TASK-v4-002 recalibré (🚧)

**328 tests Vitest — zéro régression.**

#### Problème résolu
`createChildGSheet()` ajoutait des onglets préfixés (`cmp_xxx_Raw/Qualified/…`) dans un fichier GSheet partagé (`GOOGLE_CAMPAIGNS_SHEET_ID`), rendant la structure ingérable dès plusieurs campagnes volumineuses. L'ARCHI-v4 prévoit 1 fichier GSheet dédié par campagne.

#### Fichiers modifiés
| Fichier | Changement |
|---------|------------|
| `lib/sheets.ts` | `createChildGSheet()` : crée un nouveau fichier via `sheets.spreadsheets.create()` (6 onglets sans préfixe : `Leads_Raw`, `Leads_Qualified` 32 cols, `Leads_Rejected`, `Config` v4, `Conversations`). Drive scope `drive.file` ajouté. `getDrive()` exporté. `updateConfigValue()` : try `Config` d'abord, fallback `{id}_Config` legacy. Export `CHILD_QUALIFIED_HEADER` (32 cols) et `CHILD_CONVERSATIONS_HEADER`. |
| `lib/sheets.test.ts` | **Créé** — 22 tests sur parsers purs, constantes v4, helpers A1, `isUnableToParseRangeError`. |
| `tasks/v4/TASK-v4-002.md` | Status ✅ → 🚧 Partiel. Cases cochées : Leads_Qualified v4, Conversations, Config v4, Meetings. Reste : Index tabs Email_Health/Accounts/+4 cols Campagnes + script migration campagnes existantes. |
| `tasks/v4/TASKS.md` | v4-002 : ✅ → 🚧 |

#### Ce qui reste pour clore v4-002
- Script migration `scripts/migrate-sheets-v4.ts` (idempotent) pour campagnes existantes
- Index : tab `Email_Health` + tab `Accounts` + +4 colonnes sur `Campagnes`

#### Onglets orphelins
Les onglets `cmp_abjpc93l_Raw/Qualified/Rejected/Config` dans "Campaigns Data" sont des artefacts de l'ancienne impl. Non utilisés par le nouveau code. À nettoyer manuellement si besoin.

---

### 2026-05-14 — Goal 1 : Setter Engine complet ✅ (v4-002 → v4-007 + v4-017)

**290 tests Vitest — zéro régression.**

#### Fichiers créés
| Fichier | Description |
|---------|-------------|
| `lib/conversations.ts` | Read/append turns cross-canal (tab Conversations GSheet enfant). `getConversationThread`, `appendConversationTurn`, `validateConversationTurn`. Lazy ensure de l'onglet. |
| `lib/conversations.test.ts` | 6 tests — parse, format, edge cases |
| `lib/pacing.ts` | Engine pacing email : Gauss Box-Muller (µ=8min σ=3min), `isWithinHumanHours` (Paris CEST), ramp-up 5→10→15→20, `checkEmailHealth`, `computeEmailHealthStatus`. Types `EmailHealthRow`. |
| `lib/pacing.test.ts` | 19 tests — human hours, Gauss, ramp-up, email health parse/check |
| `lib/calendly.ts` | Client Calendly v2 : `getAvailableSlots` (+14j), `parseCalendlySlots`, `formatSlotsNatural` (fr-FR), `verifyCalendlyWebhookSignature` (HMAC SHA-256). |
| `lib/calendly.test.ts` | 5 tests — parse slots, format naturel |
| `lib/setter.ts` | Module central AI Setter : `buildConversationContext`, `buildSystemPrompt` (Voss mirroring + No-Oriented Questions + ≤120 mots), `classifyIntent` (Sonnet 4.6 JSON + prompt caching), `generateResponse` (Opus 4.6 fallback sur objection_trust, tool call `get_calendly_slots` si meeting_ready), `runSetterPipeline`, détection `isAiQuestion` (EU AI Act art. 50). |
| `lib/setter.test.ts` | 26 tests — parse intent, shouldEscalate, isAiQuestion, routeIntent, buildContext, buildSystemPrompt |
| `app/api/setter/classify/route.ts` | `POST /api/setter/classify` — Zod validation, classifyIntent, EU AI Act flag |
| `app/api/setter/generate/route.ts` | `POST /api/setter/generate` — Zod validation, generateResponse |
| `app/api/calendly/slots/route.ts` | `GET /api/calendly/slots?event_type_uri=...&format=natural&count=3` |
| `scripts/migrate-sheets-v4.ts` | Script idempotent : ajoute onglets Email_Health, Accounts, Conversations, Meetings + colonnes Campagnes v4 + colonnes Leads_Qualified v4 + clés Config. `npx tsx scripts/migrate-sheets-v4.ts` |

#### Extend lib/types.ts
Ajout types v4 : `IntentLabel`, `ConversationTurn`, `ConversationChannel`, `ConversationRole`, `EmailHealth`, `MeetingV4`, `CampaignConfig`, `CampaignV4`, `IntentResult`, `CalendlySlot`, `PacingCheckResult`.

#### Extend lib/sheets.ts
`ensureEmailHealthSheet()` + `appendToChildSheet(spreadsheetId, range, values)`.

#### Install
`@anthropic-ai/sdk@^0.96.0` ajouté (SDK Anthropic direct — pas OpenRouter pour le Setter).

#### Prompt caching Setter
System prompt + contexte campagne cachés (`cache_control: ephemeral`) → ~70% tokens économisés sur appels classify + generate répétés pour une même campagne.

#### Choix architecturaux
- Setter utilise `@anthropic-ai/sdk` direct (pas AI SDK Vercel) — spécifié dans ARCHI-v4
- Fallback Opus 4.6 uniquement sur `objection_trust` (confiance la plus coûteuse à regagner)
- `isAiQuestion` détecte patterns FR/EN avant classify — forced escalade si match (EU AI Act art. 50)
- `checkEmailHealth` retourne `{ allowed, reason }` — WF7/WF8 consultent avant chaque envoi

---

### 2026-05-13 — v4-001 : Calendly PAT + env vars ✅

- PAT Calendly créé (token "Flinty", scopes complets)
- Event type : "30 Minute Meeting" (`calendly.com/kames-ai/30min`)
- URIs récupérées via API : `event_types/0b5bf64b...`, `users/fd8f203d...`
- **Approche polling** retenue (webhooks = plan Standard payant) — Vercel Cron toutes les 5min (implémenté en v4-008)
- Variables ajoutées dans `.env.local` + Vercel staging + prod : `CALENDLY_TOKEN`, `CALENDLY_EVENT_TYPE_URI`, `CALENDLY_USER_URI`

### 2026-05-04 — Intégration marketingskills (vendor + hub)

- **Sous-module** : `external/marketingskills` → [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT).
- **Index** : [skills/vendor/marketingskills-INDEX.md](../skills/vendor/marketingskills-INDEX.md) (tiers A/B/C) ; [skills/vendor/README.md](../skills/vendor/README.md) (mise à jour).
- **Hub agent** : [skills/flinty-product-marketing-context/SKILL.md](../skills/flinty-product-marketing-context/SKILL.md) (cadre avant skills vendor).
- **Distillat prompts** : [01-Architecture/marketingskills-prompt-blocks.md](../01-Architecture/marketingskills-prompt-blocks.md) (champs PRD → blocs utiles WF2 / ICP).
- **Doc** : [CLAUDE.md](../CLAUDE.md), [`.claude/rules/flinty-core.md`](../.claude/rules/flinty-core.md), [sales-message-generator](../skills/sales-message-generator/SKILL.md) pointent vers le hub et le vendor.

### 2026-05-04 — Harnais Claude Code (plan Kames × claude-code-best-practice)

- **CLAUDE.md** : hub court ; détail dans `.claude/rules/` (`flinty-core`, `flinty-dashboard` lazy, `flinty-tasks`).
- **`.claude/commands/`** : `/run-tests`, `/task-done`, `/pr-ready`, `/n8n-vercel-checklist`, `/smoke-campaign-api`.
- **Hooks** (`.claude/settings.json`) : PostToolUse → rappel Vitest après Write/Edit sur TS du dashboard ; Stop → une relance si « livré » sans preuve de tests (`stop_hook_active` évite boucle).
- **Skills** : descriptions + section Gotchas (Flinty) + `references/flinty-dashboard.md` pour `systematic-debugging`, `test-driven-development`, `verification-before-completion`.
- **`.cursor/rules/flinty.mdc`** : lien vers `.claude/rules/`, couleur primaire alignée `#006596`.
- `npm run test` : 231 tests OK.

### 2026-04-28 — Main campaigns « generating » : garde-fous API + origine callback

- **`N8N_WF1_WEBHOOK` absent** : plus de ligne Index coincée en `generating` sans WF1 — création renvoie **503**, statut initial **`paused`**, message explicite.
- **`getPublicOrigin(req)`** (`02-Implementation/interface/lead-qualifier-dashboard/lib/request-origin.ts`) : URLs `generation_callback_url` stables (`req.url` puis `VERCEL_URL`).
- **`POST …/generation-complete`** : `revalidatePath('/dashboard')` après mise à jour de l’Index.
- Tests : `lib/request-origin.test.ts`, ajustements `route.test.ts` / `generation-complete/route.test.ts`. `npm run test` : 231 OK.

### 2026-04-28 — Callback fin de qualification (Index → `active`)

- Nouvelle route `POST /api/campaigns/[id]/qualification-complete` : met à jour l’Index (`statut`, optionnellement `total_leads_qualified`) quand WF2 a terminé.
- `POST /api/campaigns/[id]/qualify` envoie à n8n `qualification_callback_url` (comme WF1 avec `generation_callback_url`). Lecture de `N8N_WF2_WEBHOOK` au runtime pour les tests.
- À faire côté n8n : dernier nœud du WF2 → HTTP Request `POST` vers cette URL avec `{ "status": "completed", "qualified_count": <n> }` (ou `failed` → Index en `paused`).
- CLAUDE.md : paragraphe callbacks WF1 / WF2.

### 2026-04-28 — Amélioration scoring + extraction contact gérant

**Problèmes résolus :**
- Scores tous à 75 (DeepSeek copiait la valeur exemple dans le prompt JSON)
- score_reason et personalized_hook trop génériques
- Nom/prénom gérant manquants (Firecrawl ne scrape que la homepage)
- Téléphone sans clarté sur sa source

**Changements WF2 (01BB4q4j1buvWRC6) — 3 nouveaux nœuds :**
- `Pappers Search` : API pappers.fr/v2/recherche → nom + prénom gérant légal (RCS)
- `Parse Pappers` : extrait dirigeant principal (gérant, président, PDG...)
- `Firecrawl Contact Page` : scrape /contact de chaque site pour trouver l'email gérant
- `Prépare Prompt` mis à jour : intègre données Pappers + contenu page contact
- `Claude Scoring` mis à jour : nouveau prompt DeepSeek avec règles explicites (score_reason citera le nom + 1 fait précis, hook avec prénom gérant, pas de score 75 par défaut)
- `Parse Réponse` mis à jour : priorité Pappers pour nom gérant final

**Dashboard — fiche lead (`leads/[lead_id]/page.tsx`) :**
- Bloc contact restructuré : gérant affiché avec prénom+nom combinés + poste
- Badge email : "Nominatif ✓" (vert), "Nominatif" (bleu), "Générique" (gris), "À vérifier" (orange)
- Note téléphone : "Source : Google Maps — numéro général de l'entreprise"
- Infos secondaires (taille, secteur, statut) séparées en grid sous la ligne

### 2026-04-25 — OpenRouter : Opus 4.6 → Sonnet 4.5

- `lib/openrouter.ts` : `CLAUDE_SONNET` = `anthropic/claude-sonnet-4-5` (remplace `CLAUDE_OPUS`)
- `POST /api/campaigns/generate-icp` : modèle aligné
- n8n **[FLINTY] WF2 - Qualification Leads** : nœud « Claude Scoring » (`wf2-n6`), body JSON `model` → Sonnet 4.5
- **[FLINTY] WF1** : pas de nœud OpenRouter (audit instance n8n)
- 191 tests Vitest verts

### 2026-04-18 — TASK-022 : Cache `sheet_id` + E2E Playwright + CI

- `lib/cache.ts` : TTL 5 min, `invalidateCampaignSheetIdCache()` vide le store
- `getCampaignById` : cache clé `campaignById:{id}` ; `readIndex` une seule fois sur hits répétés ; invalidation après POST `/api/campaigns` 202
- `lib/cache.test.ts` ; `campaigns.test.ts` — scénarios cache + `mockClear` sur `readIndex`
- Playwright : `e2e/flinty-smoke.spec.ts` (tests **HTTP** `request`, pas de binaire Chromium requis pour ce smoke) ; `npm run test:e2e` ; `npm run test:all` = Vitest + E2E
- `vitest.config.ts` : `exclude` **e2e/**
- `.github/workflows/flinty-dashboard-e2e.yml` : push/PR sur le dashboard — Vitest + `playwright install chromium` + E2E
- `.gitignore` : `playwright-report/`, `test-results/` sous le dashboard
- **Prod / n8n / smoke réel** : laissé à Thomas (TASK-022)
- 129 tests Vitest + 3 E2E verts, `npm run build` OK

### 2026-04-18 — TASK-021 : Rate limiting + validation Zod

- Dépendance **`zod`** — pas Upstash : compteurs **in-memory** (`lib/rate-limit.ts` : `checkRateLimit`, `getClientIp`, `resetRateLimitStore` pour tests)
- **`lib/api-schemas.ts`** : `postCampaignBodySchema`, `generateIcpBodySchema`
- **`lib/with-validation.ts`** : `withValidation(req, schema)` → 400 JSON + `issues` flatten si invalide
- **POST `/api/campaigns`** : 10 req/h/IP, validation Zod, `nom` utilisé comme nom de campagne (Index + `createChildGSheet`) ; `icp_md` trimmé
- **POST `/api/campaigns/generate-icp`** : 5 req/min/IP, validation `answers.length === 8` ; 429 avec `Retry-After` + body `retryAfter`
- **GET `/api/campaigns`** : inchangé
- 123 tests Vitest, `npm run build` OK

### 2026-04-18 — TASK-020 : Export multi-format (API + UI)

- `lib/qualified-leads.ts` : `QualifiedLead` + `parseQualifiedLeads` (partagé avec `GET /api/campaigns/[id]`)
- `lib/campaign-export.ts` (TDD) : RFC 4180, 16 colonnes CSV PRD, BOM UTF-8, Instantly (5 colonnes, filtre sans email), JSON indenté
- `GET /api/campaigns/[id]/export?format=csv|json|instantly` + `Content-Disposition` attachment
- Page campagne : 3 liens Export CSV / JSON / Instantly vers l’API
- 110 tests Vitest verts, `npm run build` OK

### 2026-04-18 — TASK-019 : WF3 append Contacts_Registry après envoi J0

- **WF3 `[KAI] WF3 - Envoi Email J0`** : 2 nouveaux nœuds insérés entre `Update statut_email` et `Résumé`
- `Code — Prépare Registry` : normalise `new URL(lead.site).hostname.replace(/^www\./, '').toLowerCase()`, construit `{ domain, contacted_at, campaign_id, status: 'contacted' }`, URL invalide → `domain: ''` + log
- `Append Contacts_Registry` (continueOnFail) : append dans `Contacts_Registry` du GSheet Index (`GOOGLE_INDEX_SHEET_ID`) avec 4 colonnes : `domain | contacted_at | campaign_id | status`
- Le flow continue toujours vers `Résumé` → `Respond to Webhook` (continueOnFail + domain vide toléré)
- Workflow actif, 10 nœuds, structure validée via MCP

### 2026-04-18 — TASK-018 : Contacts_Registry + WF1 filtre doublons domaine

- **WF1 `[KAI] WF1 - Génération Leads`** : 2 nouveaux nœuds insérés entre `Parse Places` et `Append Leads Raw`
- `Read Registry` (GoogleSheets read) : lit `Contacts_Registry!A:A` du GSheet maître Index (`GOOGLE_INDEX_SHEET_ID`) → colonne `domain`
- `Code — Dedup` : construit un `Set` des domaines connus, normalise `new URL(site).hostname.replace(/^www\./, '').toLowerCase()`, filtre les leads déjà prospectés, log `[WF1 Dedup] X leads → Y kept (Z filtrés)`
- Si 0 leads passent le filtre : retourne 1 item SKIP `nom=ALL_FILTERED_BY_DEDUP` pour maintenir le flow icp_md
- URLs invalides → skip silencieux (try/catch)
- Workflow actif, 9 nœuds, structure validée via MCP

### 2026-04-17 — TASK-017 : Drag & drop Kanban + optimistic UI

- `kanban-columns.ts` : ajout export `COLUMN_PRIMARY_STATUT` (mapping colonne → statut_email primaire)
- `KanbanBoard.tsx` : refonte complète avec `DndContext`, `useDroppable` par colonne, `useDraggable` par carte, `DragOverlay` pendant le drag
- Optimistic UI : déplacement immédiat dans le state, PATCH `/api/leads/[id]/status`, rollback + toast erreur si échec
- `kanban/page.tsx` : passage du prop `sheetId` à `KanbanBoard`
- 7 nouveaux tests `COLUMN_PRIMARY_STATUT` → 100/100 tests verts

### 2026-04-17 — TASK-015 : `@dnd-kit` + `PATCH /api/leads/[id]/status`
- ✅ Dépendances `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` ajoutées au dashboard
- ✅ `lib/lead-email-status.ts` + tests : ensemble des statuts v3 (dont `relance_1`, `relance_2`, `disqualified`)
- ✅ `lib/sheets.ts` : `updateChildSheetValues(spreadsheetId, range, values)` pour écriture sur GSheet enfant
- ✅ `app/api/leads/[id]/status/route.ts` : body `{ sheet_id, campaign_id, statut_email }`, lecture `readChildSheet(sheetId, '{campaign_id}_Qualified!A:A')`, mise à jour colonne **S** (`statut_email`), pas de résolution `sheet_id` côté serveur
- ✅ `vitest.config.ts` (alias `@`) — suppression de `lib/analytics.test.ts` vide qui faisait échouer Vitest
- ✅ `lib/types.ts` : union `statut_email` alignée sur les 9 statuts Kanban
- 80 tests Vitest verts, `npm run build` OK

### 2026-04-17 — TASK-016 : Page Kanban + tab de navigation
- ✅ `kanban-columns.ts` (TDD) : `KANBAN_COLUMNS` (6 colonnes) + `groupLeadsByColumn` — 13 tests verts
- ✅ Mapping statuts → colonnes : `new`→Nouveaux, `contacted/relance_1/relance_2`→Contactés, `opened`→Ouvert, `clicked`→Cliqué, `replied`→Répondu, `bounced/disqualified`→Bounced
- ✅ `KanbanBoard.tsx` (Client Component) : 6 colonnes scrollables, cartes avec nom/ville/score coloré, tooltip `personalized_hook` au hover (state local `showHook`)
- ✅ `kanban/page.tsx` (RSC) : `getCampaignById` + `readChildSheet` direct (no HTTP), parse colonnes A-S depuis `{campaign_id}_Qualified`
- ✅ `CampaignTabNav.tsx` (Client Component) : onglets Leads / Kanban, `usePathname` pour détection active, border-bottom #FFA318
- ✅ `CampaignTabNav` ajouté dans `campaigns/[campaign_id]/page.tsx` (avant les filtres)
- 93/93 tests verts, 0 erreur TS sur les fichiers modifiés

### 2026-04-17 — TASK-013 + TASK-014 : Preview Markdown éditable + lancement campagne + WF1 icp_md
- ✅ `campaign-launch.ts` (TDD) : `deriveFormDefaults(answers)` extrait secteur/localisation/offre_kames/taille_equipe des réponses chat et génère un nom de campagne. 7 tests verts.
- ✅ `page.tsx` réécrit : après génération ICP, bascule vers un split-view (textarea éditable gauche + `ReactMarkdown` preview droite) avec formulaire 4 champs pré-remplis (nom, secteur, localisation, offre)
- ✅ Bouton "Lancer la campagne" → POST `/api/campaigns` avec payload complet incluant `icp_md` → 202 → `sessionStorage.setItem(TOAST_KEY)` + `router.push('/dashboard')`
- ✅ `FlashToast.tsx` : composant client monté dans `dashboard/layout.tsx`, lit et efface `flinty.flash_toast` au mount, affiche pendant 4s
- ✅ `react-markdown@10.1.0` installé
- ✅ TASK-014 via subagent n8n MCP : 2 nodes ajoutés à WF1 (`Code — Prépare icp_md` + `Append Config icp_md`), chain = 7 nodes, workflow sauvegardé actif
- ⚠️ Prérequis TASK-014 : l'onglet `Config` du GSheet enfant doit avoir les headers `key` | `value` en ligne 1 (sinon le node Sheets Append ne mappe pas les colonnes)
- 75/75 tests verts, 0 erreur TS sur les fichiers modifiés

### 2026-04-17 — TASK-012 : UI `/dashboard/campaigns/new` — chat séquentiel 8 questions
- ✅ Refonte complète de `app/dashboard/campaigns/new/page.tsx` : remplacement du form v1 par un chat conversationnel
- Nouveau module pur `chat-state.ts` (TDD) : `CAMPAIGN_QUESTIONS` (8 entrées avec keys `secteur_cible`, `pain_points`, `taille_entreprise`, `budget_cible`, `zones_geo`, `proposition_valeur`, `signaux_achat`, `signaux_exclusion`), `submitAnswer` (trim + ignore vide + écrase à `currentIndex`), `goBack` (décrément sans perte), `isComplete`, `currentQuestion`, `getDraftAnswer`
- `chat-state.test.ts` : 9 tests verts (ordre des 8 questions, trim, vide ignoré, retour préserve les données, re-submit après retour écrase, isComplete à 8/8)
- UI : bubbles assistant (gauche, zinc-900) / user (droite, orange #FFA318 sur noir), barre de progression `currentIndex / 8`, textarea avec Enter→submit + Shift+Enter→newline, bouton Retour (ArrowLeft) désactivé à l'index 0, persistance `sessionStorage` (clé `flinty.campaigns.new.chat`) pour survie au refresh
- Quand `isComplete` : CTA `Sparkles + "Générer l'ICP"` → POST `/api/campaigns/generate-icp` `{ answers }` → preview brut du markdown (édition + lancement campagne déféré à TASK-013)
- Bubble user en mode "édition" (currentIndex pointe sur une réponse existante) : style line-through zinc-500 pour indiquer qu'elle va être réécrite
- 68/68 tests passent sur l'ensemble du repo, aucune erreur TS sur les fichiers modifiés

---

### 2026-04-17 — TASK-010 : UI fiche lead enrichie (Next.js)
- ✅ Page `/dashboard/campaigns/[campaign_id]/leads/[lead_id]/page.tsx` réécrite (Server Component)
- Source de données migrée : master sheet hardcodé → `getCampaignById` + `readChildSheet(sheetId, 'Leads_Qualified!A2:W')` (GSheet enfant dynamique)
- Nouveau composant `CopyButton.tsx` (Client Component) : `navigator.clipboard`, feedback visuel 2s, icônes Lucide `Copy`/`Check`
- 4 nouvelles sections : Hook personnalisé (bloc italic + bouton copier) · Signaux d'achat (growth_stage badge coloré, buying_signal, hiring_signals) · Qualité web (score + barre de progression + tags signaux) · Analyse IA (score_reason)
- Badge `growth_stage` : seed=bleu, series_a=violet, established=vert, scale=orange (#FFA318)
- Score coloré dynamique : ≥70 vert · ≥50 jaune · <50 zinc (header + barre web quality)
- Colonne mapping 23 champs (A-W) aligné sur l'output WF2 `Append Leads_Qualified`
- `getLeadEmailEvents`/`getLeadMeetings` wrappés en `.catch(() => [])` — timeline conservée, non bloquante si données absentes
- 0 erreur TypeScript sur les fichiers modifiés

---

### 2026-04-17 — TASK-009 : WF2 — IF Qualified/Rejected + Leads_Rejected (n8n MCP)
- ✅ WF2 passe à 15 nodes : ajout `IF Qualified`, `Append Leads_Rejected`, `Merge Branches`
- Node `IF Qualified` : condition `$json.score >= $json.score_minimum` (dynamique depuis Config)
- Branche TRUE (score ≥ seuil) → `Append Leads_Qualified` (GSheet enfant dynamique via `sheet_id` webhook, 23 colonnes full v3)
- Branche FALSE (score < seuil) → `Append Leads_Rejected` (GSheet enfant dynamique, 7 colonnes : lead_id, campaign_id, nom, site, score, rejection_reason, processed_at ISO)
- `rejection_reason` : fallback `score_reason` si rejection_reason vide
- Les deux branches convergent via `Merge Branches` (mode append) → `Résumé` → `Respond to Webhook`
- `Résumé` mis à jour : retourne `leads_qualified_count`, `leads_rejected_count`, `leads_total`
- `Parse Réponse` mis à jour : `score_minimum` ajouté à l'output pour que le nœud IF puisse le lire
- `Append Leads_Qualified` migré du GSheet maître hardcodé vers le GSheet enfant dynamique

---

### 2026-04-17 — TASK-008 : WF2 — Web Quality Score post-Firecrawl (n8n MCP)
- ✅ Node `Web Quality Score` (Code node) inséré entre Firecrawl et Prépare Prompt — WF2 passe à 12 nodes
- Score déterministe 0–100 : 8 heuristiques pondérées (has_content +15, rich_content +10, https +10, meta_ok +15, has_title +10, recent_copyright +20, social_presence +10, has_email +10)
- Skip gracieux si Firecrawl échoue → score 0, signals `['firecrawl_failed']`
- Firecrawl Scrape mis à jour : formats `['markdown', 'html']` (était `['markdown']`) pour permettre la détection du copyright dans le HTML brut
- `web_quality_score` et `web_quality_signals` propagés dans Prépare Prompt et injectés dans le prompt Claude Scoring (contexte supplémentaire)
- Parse Réponse : `web_quality_score` et `web_quality_signals` (jointés en string) ajoutés à l'output pour usage futur (TASK-010 fiche lead UI)

---

### 2026-04-17 — TASK-007 : WF2 — Claude Opus 4.6 + 14 champs + Config ICP (n8n MCP)
- ✅ WF2 `01BB4q4j1buvWRC6` refondu : 11 nodes (ajout `Read Config`)
- Nouveau node `Read Config` (Code node) : lit `Config!A:B` du GSheet enfant via `httpRequestWithAuthentication`, extrait `icp_md` et `score_minimum` depuis le webhook `sheet_id`
- Modèle remplacé : `claude-haiku-4-5-20251001` → `anthropic/claude-opus-4-6`
- Prompt enrichi : ICP + contenu Firecrawl + structure JSON 14 clés imposée (score, score_reason, email, prénom, poste, taille_equipe, has_ia_services, hiring_signals, growth_stage, buying_signal, personalized_hook, rejection_reason, secteur_détecté, signaux_supplémentaires)
- Headers ajoutés : `HTTP-Referer: https://flinty.kamesai.com`, `Content-Type: application/json`
- `max_tokens` : 600 → 1024
- Parse Réponse : retry à 2 tentatives (clean fences → extract regex JSON object) + 14 champs + alias `raison_score` pour compatibilité Append (TASK-009 refactorisera)
- `statut_email` : piloté par `score_minimum` lu depuis Config (vs seuil fixe 50)
- Connexion : Webhook → Read Config → Read Leads_Raw (Read Leads_Raw maître inchangé — sera migré en TASK-009)

---

### 2026-04-17 — TASK-006 : WF6 refonte loop Index (n8n MCP)
- ✅ WF6 `oWm8alnIlzS9UCTd` refondu : 6 nodes, schedule horaire maintenu
- Ancien WF6 lisait `Leads_Raw`/`Leads_Qualified` depuis un GSheet fixe (architecture v2)
- Nouveau flux : `Read Index Campagnes` → `Filter Active Campaigns` (skip `done`/`paused`) → `SplitInBatches` (batchSize:1) → `Fetch & Calcul Stats` (Code node avec `httpRequestWithAuthentication` vers Sheets API v4 dynamique) → `Update Index Stats` → retour boucle
- Colonnes mises à jour : `total_leads_raw`, `total_leads_qualified`, `emails_envoyes`, `taux_reponse` (suppression `taux_ouverture` non spécifiée dans TASK-006)
- `sheet_id` URL-aware : extraction automatique de l'ID depuis URL complète ou ID direct

---

### 2026-03 — Setup initial
- ✅ Projet Next.js 15 + TypeScript + Tailwind initialisé
- ✅ Google Sheets API v4 connectée (Spreadsheet ID : `14Uf6GlvmlCxzaFxENExW-FkCV0CZNQ_7zwzik9SAelY`)
- ✅ Service account configuré : `lead-qualifier-service@lead-qualifier-mvp.iam.gserviceaccount.com`
- ✅ 5 écrans implémentés : dashboard, nouvelle campagne, détail campagne, fiche lead
- ✅ 6 API routes : campaigns, leads, stats, export
- ✅ 6 workflows n8n (staging-n8n.kamesai.com)

### Décisions techniques
- **Google Sheets vs DB** : Sheets choisi pour simplicité + accès direct Thomas
- **Next.js App Router** : Server Components pour performance (pas de client-side fetch)
- **Pas de Supabase** : Overkill pour MVP, migration possible plus tard

---

## En cours / À faire

- [ ] Déployer sur Vercel (Task 016)
- [ ] Implémenter timeline email complète (onglet `Email_Events` dans GSheet)
- [ ] Actions manuelles sur leads (changer statut, forcer relance)
- [ ] Mode mobile
- [ ] Mise à jour sécurité n8n v2.7.5 (URGENT)

---

---

## Session 2026-04-17 — TASK-005

**Tâche** : API `GET /api/campaigns/[id]` — résolution Index→enfant

**Changements** :
- ✅ Créé `app/api/campaigns/[id]/route.ts` — handler App Router
  - `getCampaignById(id)` → 404 si null
  - `Promise.all` de 3 `readChildSheet` : `{id}_Qualified!A2:U`, `{id}_Rejected!A2:G`, `{id}_Config!A2:C`
  - Parsers inline : `parseQualifiedLeads` (21 cols v3), `parseRejectedLeads` (7 cols), `parseConfig` (key-value Record)
  - Retourne `{ campaign, leads_qualified, leads_rejected, config }`
- ✅ Créé `app/api/campaigns/[id]/route.test.ts` — 6 tests Vitest, tous verts

**Résultat** : `npx vitest run 'route.test'` → 15/15 ✅ · E2E `curl http://localhost:3000/api/campaigns/cmp_6jo0e0jm` → campaign + config (8 champs) + leads vides ✅

---

## Session 2026-04-17 — TASK-003 validée + TASK-004

**TASK-003 E2E validée** :
- Root cause Drive quota (limit=0 sur service account) → Option A : onglets dans GOOGLE_CAMPAIGNS_SHEET_ID
- `createChildGSheet` réécrite pour créer 4 onglets `{campaign_id}_Raw/Qualified/Rejected/Config`
- WF1 mis à jour via n8n MCP : `Code — Prépare` extrait `tab_raw`, `Append Leads Raw` utilise `tab_raw` dynamiquement
- Test E2E : POST `/api/campaigns` → onglets créés + 20 leads Lyon scrapés dans `cmp_6jo0e0jm_Raw` ✅

---

## Session 2026-04-17 — TASK-004

**Tâche** : API `/api/campaigns` GET/POST — création GSheet enfant + Index + WF1

**Changements** :
- ✅ Ajouté `createChildGSheet(sheetName, config)` dans `lib/sheets.ts`
  - Crée le spreadsheet via Sheets API (Service Account)
  - Déplace dans `GOOGLE_DRIVE_FOLDER_ID` via Drive API
  - Setup 4 onglets (Leads_Raw, Leads_Qualified, Leads_Rejected, Config) + headers v3
  - Écrit les 8 lignes Config (dont score_minimum=60)
- ✅ Réécrit `app/api/campaigns/route.ts` (v1 mono-sheet → v3 multi-campagne)
  - GET : `listCampaigns()` depuis Index
  - POST : createChildGSheet → appendIndex → WF1 webhook (fire-and-forget) → 202
- ✅ Créé `app/api/campaigns/route.test.ts` — 9 tests Vitest, tous verts

**Résultat** : `npm run test -- campaigns/route` → 9/9 ✅ · Suite complète → 53/53 ✅

---

## Session 2026-04-16 — TASK-003 (suite)

**Tâche** : WF1 refonte — déploiement direct sur staging via n8n REST API

**Changements** :
- ✅ Workflow `OnpGdsIZQShrN4P1` mis à jour directement sur `staging-n8n.kamesai.com` via `PUT /api/v1/workflows/{id}`
- ✅ 11 nodes déployés : Webhook → Code (IDs) → HTTP Drive (create GSheet) → Code (Merge) → HTTP (batchUpdate tabs) → HTTP (headers) → HTTP (Config) → Append Campagnes (v3 schema 13 cols) → Google Places API → Parse Places → Append Leads Raw (dynamic child sheet)
- ✅ Webhook path : `flinty-wf1-launch` (mis à jour depuis `kai-v2-gen-leads`)
- ✅ Append Campagnes : schéma v3 avec `sheet_id`, `sheet_url` ajoutés
- ✅ Append Leads Raw : écrit dans le GSheet enfant dynamique (`$('Code — Merge données').first().json.spreadsheet_id`)
- 🔄 **En attente de validation Thomas** : test curl (4 critères d'acceptance)

**Résultat** : Workflow actif, 11 nodes confirmés via GET API

**Test** :
```bash
curl -X POST https://staging-n8n.kamesai.com/webhook/flinty-wf1-launch \
  -H "Content-Type: application/json" \
  -d '{"secteur":"Marketing","localisation":"Paris","villes":"Paris, Lyon","offre_kames":"Audit IA","taille_equipe":"10-50","poste_cible":"Directeur Marketing","template_email":"j0_default","icp_md":"# ICP Test"}'
```

**Résultat attendu** : GSheet enfant dans Drive + ligne Index + 4 onglets + Config.score_minimum=60

---

## Session 2026-04-16 — TASK-002

**Tâche** : `lib/sheets.ts` + `lib/campaigns.ts` — résolution sheet_id via Index

**Changements** :
- ✅ Créé `lib/types.ts` — types v3 : `Campaign` (avec sheet_id/sheet_url, statuts new|active|paused|done), `Lead`, `ContactRegistryEntry`
- ✅ Étendu `lib/sheets.ts` — ajout `readIndex()`, `appendIndex(row)`, `updateIndex(campaignId, patch)`, `readChildSheet(sheetId, range)` sur `GOOGLE_INDEX_SHEET_ID`
- ✅ Créé `lib/campaigns.ts` — `listCampaigns()`, `getCampaignById(id)`, `parseIndexCampaigns()` (exportée pour tests)
- ✅ Créé `lib/campaigns.test.ts` — 10 tests Vitest, tous verts

**Résultat** : `npm run test -- campaigns` → 10/10 ✅

---

## Workflows n8n

| ID | Nom | Statut |
|---|---|---|
| `OnpGdsIZQShrN4P1` | WF1 - Génération Leads | ✅ Actif staging |
| `01BB4q4j1buvWRC6` | WF2 - Qualification | ✅ Actif staging |
| `dfe1jIPlZA10dqJK` | WF3 - Email J0 | ✅ Actif staging |
| `oCViFcjPo2nNUjlR` | WF4 - Webhooks Resend | ✅ Actif staging |
| `7re2WS3ghacqHsLE` | WF5 - Relances Auto | ✅ Actif staging |
| `oWm8alnIlzS9UCTd` | WF6 - Stats | ✅ Actif staging |
## Session 2026-05-15 — Setter Email MVP backend + inbox

**Tâches v4 concernées** :
- `v4-009` 🚧 partiel : route Next `POST /api/setter/email-reply` prête pour WF7 ; workflow n8n non créé.
- `v4-010` 🚧 partiel : route `/api/replies/[lead_id]/send` déclenche `N8N_WF8_WEBHOOK` ; workflow n8n WF8 non créé.
- `v4-011` 🚧 partiel : routes replies GET/send/escalate + tests ; reste update `Leads_Qualified.setter_action`.
- `v4-012` 🚧 partiel : inbox 3 tabs + queue drafts + bookings ; reste vraie tab escalades/polling/groupement semaine.
- `v4-013` 🚧 partiel : `ConversationThread` intégré ; reste badges canal/dates/accessibilité complète.
- `v4-014` 🚧 partiel : `SetterDraftCard` éditer/envoyer/escalader ; reste diff avancé/modal/raccourcis.

**Changements** :
- Ajout `lib/replies.ts` : résolution lead/campagne, lecture Config, process reply → turn prospect + turn Setter, queue drafts, send/escalate.
- Ajout routes :
  - `POST /api/setter/email-reply`
  - `GET /api/inbox/summary`
  - `GET /api/replies/[lead_id]`
  - `POST /api/replies/[lead_id]/send`
  - `POST /api/replies/[lead_id]/escalate`
- Refonte `app/dashboard/inbox/page.tsx` + nouveaux composants `ConversationThread` et `SetterDraftCard`.
- Ajout tests Vitest routes replies, route email-reply, helpers replies, pipeline reply→draft mocké, inbox.

**Vérification** :
- `npm run test` → 60 fichiers, 307 tests passés.
- `npm run build` → OK.
- `HEAD /dashboard/inbox` en local → 200 OK.

---

## Session 2026-05-17 — Inbox Setter frontend finalisée

**Tâches v4 concernées** :
- `v4-012` ✅ : tabs inbox finalisés avec escalades, bookings par semaine et polling compteurs 60s.
- `v4-013` ✅ : timeline cross-canal accessible avec badges email/linkedin, dates relatives et auto-scroll.
- `v4-014` ✅ : card draft Setter avec diff, raccourcis clavier, reasoning/confidence et confirmation escalade.

**Changements** :
- Ajout `listEscalatedSetterThreads()` dans `lib/replies.ts` pour alimenter l'onglet `À répondre`.
- Mise à jour `app/api/inbox/summary/route.ts` : compte `to_validate`, `to_reply`, `bookings`, filtre `campaign_id`.
- Mise à jour `app/dashboard/inbox/page.tsx` : rendu des escalades, raison d'escalade, groupement weekly bookings, couleurs `hsl(var(--primary))`.
- Ajout `app/dashboard/inbox/InboxSummaryCounters.tsx` : polling client-side toutes les 60s.
- Enrichissement `ConversationThread.tsx` : `role="feed"`, aria labels, badges canal, human/draft styling, dates relatives, scroll automatique.
- Enrichissement `SetterDraftCard.tsx` : props `turn`, intent/confidence/reasoning, diff jaune, Enter/Escape, modal confirmation escalade, état `Envoyé ✓`.
- Ajout tests `ConversationThread.test.tsx` et `SetterDraftCard.test.tsx`; extension `page.test.tsx` pour reply/bookings.

**Vérification** :
- `npm run test -- app/dashboard/inbox/page.test.tsx app/dashboard/inbox/ConversationThread.test.tsx app/dashboard/inbox/SetterDraftCard.test.tsx` → 7/7 ✅.
- `npm run test` → 63 fichiers, 332 tests passés ✅.
- `npm run build` → OK ✅.
- Playwright headless local : `/dashboard/inbox`, `/dashboard/inbox?tab=reply`, `/dashboard/inbox?tab=bookings` → 200 OK ✅.

---

## 2026-05-20 — v4 Unipile trial prep sans credentials

**Tâches** : v4-020 partiel, v4-027 ✅, v4-028 partiel, v4-024b partiel, v4-029 ✅, v4-032 partiel.

**Changements** :
- `lib/unipile.ts` : DSN court/URL complète, retries uniquement timeout/5xx avec backoff 1s/2s/4s, HMAC timing-safe, types `UnipileInvitation`/`UnipileDM`/`UnipileAccountStatus`.
- Inbox : badges Email/LinkedIn dans `ConversationThread`, bordure bleue LinkedIn, canal du dernier message prospect dans `À valider` et `À répondre`.
- Smoke Phase 2 : `scripts/smoke-phase2.sh` + `scripts/smoke-phase2-checklist.md` avec payloads `message.received`, `invitation.accepted`, `paused_captcha`.
- Santé LI : `lib/li-health.ts` (circuit breaker testable), `LI_Health_History` dans `lib/sheets.ts`, page `/dashboard/settings/linkedin/health` avec warning orange 20–35% et graphiques CSS.
- Loom : `loom_video_url` dans settings campagne API/UI, helpers Setter, embed HTML email et lien texte LinkedIn.

**Preuves** :
- `npm run test -- lib/li-health.test.ts lib/setter.test.ts app/api/campaigns/[id]/settings/route.test.ts lib/unipile.test.ts app/dashboard/inbox/ConversationThread.test.tsx app/dashboard/inbox/page.test.tsx` → 6 fichiers, 70 tests ✅.
- `npm run test` → 87 fichiers, 514 tests ✅.
- `npm run build` → OK ✅.

**Reste bloqué par Unipile réel** :
- Test live `getAccountStatus` / `/users/me`.
- WF12 n8n live : polling compte + invitations, append `LI_Health_History`, email alerte Thomas.
- Smoke staging Phase 2 avec compte LinkedIn connecté et webhooks réels.

---

## Session 2026-05-19 — TASK v4-036 Daily brief Frank/Hermes

**Tâche v4 concernée** :
- `v4-036` ✅ : MVP “Flinty daily brief export” livré.

**Changements** :
- Ajout `lib/frank-daily-brief.ts` : fonction `generateDailyPipelineBriefData()` + builder testable, sections `summary`, `priorities`, `followups_due`, `new_replies`, `blocked_or_stale`, `market_signals`, `optional_drafts_to_prepare`.
- Ajout `app/api/frank/daily-brief-data/route.ts` : endpoint read-only `GET /api/frank/daily-brief-data`, sans mutation.
- Ajout `scripts/export-frank-daily-brief.mjs` + script npm `export:frank-daily-brief` : écrit `/home/kames/KamesOS/data/flinty/daily-pipeline.json`.
- Ajout `docs/frank-daily-brief.md` : lancement, chemin, données incluses, exclusions sécurité.
- Ajout `lib/frank-daily-brief.test.ts` : contrat JSON + redaction emails/URLs/secrets.

**Sécurité** :
- Le brief exclut emails, téléphones, URLs Sheets, cookies, tokens, mots de passe, credentials et accès base complète.
- Le script ne logue que `output_path`, `date` et compteurs agrégés.
- Aucun envoi email/LinkedIn et aucune mutation commerciale.

**Vérification** :
- `npm run test -- lib/frank-daily-brief.test.ts` → 2/2 ✅.
- `npm run test` → 85 fichiers, 444 tests ✅.
- `npm run build` → OK ✅.
- `node --check scripts/export-frank-daily-brief.mjs` → OK ✅.
- Smoke export read-only avec `FRANK_DAILY_BRIEF_OUTPUT_PATH=/private/tmp/flinty-daily-pipeline.json npm run export:frank-daily-brief` → OK, JSON écrit ✅.
- Scan JSON temporaire → top-level attendu, 0 pattern email/URL/token/password/cookie détecté ✅.

### 2026-05-18 — Auto-graduation Setter cmp_1
- `setter_validation=false` appliqué automatiquement après warm-up.
- Accuracy intent sur 50 turns : 100.0%.

### 2026-05-20 — TASK-v4-035 Monitoring coûts tokens / Unipile / Calendly
- Mise à jour chemins projet après déplacement du dashboard sous `.workflows/02-Implementation/interface/lead-qualifier-dashboard/` : `AGENTS.md`, `CLAUDE.md`, règles/hooks/commands/skills actifs.
- Ajout monitoring coûts :
  - `lib/cost-monitoring.ts` + tests : header `Cost_Tracking`, extraction usage Anthropic/OpenRouter, coût Sonnet, projections mensuelles, alerte seuil sur les 7 derniers meetings.
  - `lib/sheets.ts` : création on-demand `Cost_Tracking`, Config global, `alert_cost_per_meeting_threshold=15`, lecture/append coûts.
  - `lib/setter.ts` : tracking tokens après `classifyIntent`, `generateResponse` et follow-up tool Calendly, sans bloquer le pipeline si Sheets échoue.
  - `app/api/monitoring/costs/route.ts` : `GET /api/monitoring/costs?workspace_id=...` avec projection + déclenchement email Resend si seuil dépassé.
  - `app/dashboard/data/*` : section "Coûts" avec tokens mois, coût/meeting, projection et alerte UI.
- Suivi v4 : `TASK-v4-035` et `TASKS.md` passés en `🚧 Partiel — 2026-05-20` car WF14/smoke Sheets/email réels restent à valider.
- Preuves :
  - `npm run test -- lib/cost-monitoring.test.ts app/api/monitoring/costs/route.test.ts lib/setter.test.ts` → OK (42 tests).
  - `npm run build` → OK.
  - `npm run test` → OK (89 files, 522 tests).

### 2026-07-04 — TASK-v4-037 Landing page publique + pages auth UI
- Landing marketing FR sur `/` (inspiration mimikflow structure + qualioflow quinconce), dashboard inchangé sur `/dashboard` :
  - `app/(marketing)/{layout,page}.tsx` (remplace le `redirect("/dashboard")` de `app/page.tsx`, supprimé) ; `app/(auth)/{layout,login/page,signup/page}.tsx`.
  - `components/marketing/` : SiteHeader (sticky + menu mobile Sheet), Hero, ProblemSection, FeatureZigzag (6 modules 01→06 en quinconce), HowItWorks, ResultsSection, PricingSection (toggle mensuel/annuel −20 %), FaqSection (accordéon), FinalCta, SiteFooter, Reveal (framer-motion + prefers-reduced-motion), mockups CSS (HeroMockup + 6 FeatureMockups).
  - `lib/marketing-content.ts` (contenu typé source unique), `lib/pricing-model.ts`, `lib/auth-form-model.ts` (zod, messages FR) — TDD, tests écrits avant le code.
  - `components/ui/accordion.tsx` (Radix `@radix-ui/react-accordion` ajouté) + `components/ui/input.tsx`.
  - `app/layout.tsx` : Inter via next/font + metadata marketing (title template) ; `app/dashboard/layout.tsx` : metadata « Dashboard » ; `tailwind.config.ts` : `--font-inter` dans `fontFamily.sans`.
  - Fix : badge « Populaire » rogné (`overflow-hidden` de `.card-premium`) → `overflow-visible` sur la carte pricing.
- Pages auth = UI seule (décision Thomas) : validation zod champ par champ + toast sonner « bientôt disponible » ; Supabase Auth = tâche ultérieure.
- Preuves :
  - `npm run test` → OK (92 fichiers, 537 tests).
  - `npm run build` → OK (`/` statique, `/login`, `/signup` générées, middleware intact).
  - Vérif Chrome desktop : landing complète, ancres header, toggle pricing 39/79/119 €, accordéon FAQ, toasts login/signup, `/dashboard` fonctionnel.
- Reste (tâche 🚧) : vérif mobile visuelle (resize extension inopérant en session), tarifs définitifs, pages légales, branchement Supabase Auth.

### 2026-07-04 — TASK-v4-038 : thème Poppins + dégradé émeraude, sections Mimikflow (landing)
- **Thème site entier** : Poppins via next/font (`--font-poppins`, corps + titres, `font-flinty` = Poppins 600 ; M PLUS Rounded et Inter supprimées) ; palette émeraude `#059669` (primaire) / `#34d399` (clair) / `#064e3b` (profond) dans `globals.css` (`--primary`, `--primary-glow`, `--gradient-primary` en dégradé 3 tons, `--gradient-glow`, `--shadow-glow`, sidebar, ring, accent) ; 59 occurrences `#006596` + `#00A8E8` en dur du dashboard remplacées (sed, tests inclus). Itérations couleur validées par Thomas : teal #14b8a6 → #124e35 → palette dégradé émeraude.
- **Landing façon Mimikflow** : `SectionBadge` (pill uppercase à point), utilitaire `.bg-dot-grid` ; `ResultsSection` refondue (4 cartes stats avec barres de progression + funnel campagne type 500→320→58→12 avec `FUNNEL_NOTE` « projection illustrative ») ; nouvelle `ComparisonSection` (Flinty vs Lemlist/Waalaxy/La Growth Machine, ✓/Partiel/✗ + notes + disclaimer daté — **cellules à valider par Thomas avant prod**) ; nouvelle `BookDemoSection` (mockup calendrier CSS placeholder) ; ordre page : Results → Comparison → Pricing → FAQ → BookDemo.
- **TDD** : `lib/marketing-content.ts` étendu (RESULT_STATS sublabel+progress, FUNNEL_STEPS, COMPARISON_*, BOOK_DEMO) — 4 tests écrits avant le code (rouge confirmé) puis verts.
- **Preuves** : `npm run test` = 541 tests / 92 fichiers verts (relancé après chaque changement de palette) ; `npm run build` vert ; vérif Chrome desktop : hero dégradé émeraude, stats+funnel, comparatif, pricing, démo, `/dashboard` intact en nouveau thème. Incident : `npm run build` a invalidé le cache `.next` du dev server (ENOENT lucide-react) → redémarrage dev server, root cause identifiée, pas un bug du code.
- **Reste** : validation cellules comparatif, logo `logo-flinty-cropped.png` à recolorer, lien Calendly/Cal.com réel pour la démo, vérif mobile visuelle.


### 2026-07-04 — Session autonome : commits 037/038, vérif mobile + fixes, clôture v4-018b, v4-034 API publique, pages légales

- **Commits** : chantier v4-037/038 commité en 2 commits atomiques sur `main` (`12b36b8` landing+auth, `c223463` thème émeraude), puis `6ec3c67` (fixes vérif mobile). **Push bloqué par le garde-fou git Kames (push direct main interdit)** → en attente de validation Thomas.
- **Vérif mobile v4-037/038 (Playwright, dev server local)** : viewports 390×844 + 768×1024 sur `/`, `/login`, `/signup` + menu mobile — overflow-x 0 partout, 20 captures relues. Cases « vérif mobile » cochées.
  - **Bug réel corrigé** : `Reveal.tsx` branchait `useReducedMotion` avec un arbre différent serveur/client → hydration mismatch, **page entière invisible (opacity 0) en prefers-reduced-motion**. Fix : motion.div unique + transition duration 0 si reduced. Vérifié : console propre, `opacity chain: all opacity 1`.
  - Favicon `app/icon.png` généré (émeraude) — `/favicon.ico` était en 404 ; ratio `next/image` du logo aligné sur 629×277 (header/footer/auth), warning supprimé.
  - Défaut restant : fond blanc du PNG logo sur fonds émeraude → item « logo à recolorer » (Thomas).
- **v4-018b clôturée ✅** : vérifié en prod (`flinty.vercel.app`) — `warmup_completed:true`, J46, cap 20, 5 replies positives, `email-health` bounce/complaint 0.0000, status active. Milestone M1 « soft warm-up » coché. ⚠️ Observation : `warmup_campaign` reste `true` en Config malgré `warmup_completed=true` (l'auto-switch v4-016b n'a pas flippé le flag) — signalé, pas de write prod sans validation.
- **v4-034 API publique + webhooks CRM → 🚧 Partiel (code+tests+doc livrés, TDD)** :
  - `lib/public-api.ts` (clés ApiKeys, isolation workspace, payloads CRM), `lib/public-api-server.ts` (auth x-api-key), `lib/crm-notify.ts` (déclencheurs branchés dans `qualification-complete` + `processCalendlyEvent`, fire-and-forget), `getApiKeyRows()` dans `lib/sheets.ts`, routes `app/api/public/{campaigns,meetings,leads}`, doc `docs/api-public.md`.
  - Tests d'isolation A/B (campagnes/meetings/leads), 401 clé invalide, 404 campagne hors workspace. Rouge TDD confirmé avant implémentation.
  - Reste : clé réelle dans l'onglet `ApiKeys` + smoke webhook.site en staging.
- **Pages légales (brouillon, v4-037)** : `LegalArticle.tsx` + `/legal/{mentions-legales,cgu,confidentialite}` (noindex), liens footer branchés. Placeholders `[À COMPLÉTER]` (SIRET, adresse, emails) — **validation Thomas requise avant de cocher la case**.
- **Dev-Log nettoyé** : 42 occurrences dupliquées de l'entrée « Auto-graduation Setter cmp_1 » réduites à 1.
- **Preuves finales** : `npm run test` → **95 fichiers / 569 tests verts** (541 → 569, +28) ; `npm run build` vert (40 pages, dont 3 légales) ; pages légales en 200 sur le dev server.

### 2026-05-18 — Auto-graduation Setter cmp_1
- `setter_validation=false` appliqué automatiquement après warm-up.
- Accuracy intent sur 50 turns : 100.0%.

### 2026-05-18 — Auto-graduation Setter cmp_1
- `setter_validation=false` appliqué automatiquement après warm-up.
- Accuracy intent sur 50 turns : 100.0%.
