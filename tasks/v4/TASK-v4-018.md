# Task v4-018 : E2E smoke Phase 1 — reply test → Setter draft → validation → send → Calendly slot → tab Meetings
**Status**: ✅ Done — 2026-05-18

## Autonomie
🤝 **Mixte** — Claude prépare le script smoke + guide les étapes. Thomas doit déclencher le test en staging et vérifier la réception de l'email réel + le booking Calendly.

**Actions Claude** : prépare script curl + payload Resend simulé + checklist de vérification.
**Actions Thomas** : déclenche le webhook WF7 manuellement en staging → valide le draft dans l'inbox UI → vérifie l'email reçu → clique un slot Calendly → vérifie tab Meetings.

## Context
Avant de valider le milestone M1, un smoke test end-to-end complet est requis : simuler un reply prospect → Setter génère draft → Thomas valide → email envoyé → prospect "clique" Calendly → réunion bookée dans Meetings.

**Références** : ARCHI-v4 §Milestones M1

## Objective
Smoke E2E Phase 1 réussi en staging sans erreur sur le chemin complet.

## Requirements

### Must Have
**Préparation Claude** :
- [x] Script `scripts/smoke-phase1.sh` avec payload Resend simulé `email.replied`
- [x] Checklist exhaustive des points à vérifier à chaque étape

**Exécution Thomas** :
- [x] Déclencher WF7 avec payload simulé (lead existant en staging)
- [x] Vérifier dans Conversations enfant : turn prospect + turn setter créés
- [x] Ouvrir `/dashboard/inbox?tab=valider` → draft visible avec bon intent
- [x] Cliquer "Envoyer" → vérifier email reçu dans boîte Thomas
- [x] Simuler webhook Calendly `invitee.created` (curl) → vérifier tab Meetings
- [x] Vérifier statut lead = `booked` dans Leads_Qualified

### Must NOT
- Ne pas utiliser un lead prod réel pour le smoke — créer un lead test dédié
- Ne pas skip si une étape échoue — noter le bug et bloquer le milestone

## Smoke Script

```bash
# scripts/smoke-phase1.sh
#!/bin/bash
# Déclenche WF7 avec payload Resend email.replied simulé

STAGING_URL="${STAGING_URL:-https://flinty-staging.vercel.app}"
WF7_URL="${N8N_WF7_WEBHOOK}"

curl -X POST "$WF7_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "email.replied",
    "data": {
      "email_id": "smoke-test-001",
      "from_email": "thomas+smoke@kamesai.com",
      "to_email": "thomas@outreach.kamesai.com",
      "subject": "Re: [TEST SMOKE] Votre offre",
      "text": "Bonjour, votre offre m intéresse mais je veux en savoir plus sur les tarifs. Quand pouvez vous m appeler ?"
    }
  }'

echo "WF7 déclenché. Vérifier dans 30s :"
echo "1. Conversations enfant (tab Google Sheets)"
echo "2. /dashboard/inbox?tab=valider"
```

## Acceptance Criteria
- [x] WF7 run complet en <30s sans erreur n8n
- [x] Draft Setter visible dans inbox avec intent=objection_price ou interested
- [x] Email envoyé via WF8 → reçu par Thomas
- [x] Webhook Calendly simulé → row créée dans tab Meetings
- [x] Lead statut = booked dans Leads_Qualified
- [x] Setter intent accuracy évaluée : correct ? (tag `intent_correct` dans Conversations)

## Avancement 2026-05-18
- ✅ Ajout `scripts/smoke-phase1.sh` avec payload Resend `email.replied` paramétrable via env.
- ✅ Checklist smoke imprimée par le script : WF7, Conversations, inbox, WF8, Calendly poll, Meetings, statut lead.
- ⬜ Exécution réelle staging reportée comme demandé (campagne/lead test + email/Calendly réels).

## Avancement 2026-05-18 — tentative fermeture M1
- ✅ Fixture staging créée/réutilisable via `scripts/prepare-phase1-smoke-fixture.mjs`.
- ✅ Campagne smoke : `smoke_m1_20260518161356_wb45` ; lead test : `smoke_m1_20260518161356_wb45_lead_smoke_001` ; email contrôlé : `thomas+smoke@kamesai.com`.
- ✅ GSheet fallback : le service account peut écrire dans le fichier partagé staging, mais ne peut pas créer un fichier enfant dédié (`spreadsheets.create` refusé).
- ✅ Code patché pour créer directement le fichier campagne dans `GOOGLE_DRIVE_FOLDER_ID` via Drive API avant initialisation Sheets.
- ✅ Compat Gmail gratuit : `lib/sheets.ts` et `scripts/prepare-phase1-smoke-fixture.mjs` savent utiliser un OAuth utilisateur (`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`) pour créer/copier les fichiers avec le compte Gmail owner ; support optionnel template (`GOOGLE_CHILD_SHEET_TEMPLATE_ID`) + tentative transfert owner (`GOOGLE_DRIVE_OWNER_EMAIL`) si le service account reste utilisé.
- ✅ Refresh token OAuth Gmail généré et enregistré en local via `scripts/google-drive-oauth.mjs`.
- ✅ Nouvelle fixture dédiée créée via OAuth Gmail : campagne `smoke_m1_20260518192456_kn6d`, sheet enfant `1JYKqbVJgH3rUJa3IT2pX6EsMb7YjYav0oHQWuLjIJcw`, lead `smoke_m1_20260518192456_kn6d_lead_smoke_001`.
- ❌ Probe dédié : `GOOGLE_DRIVE_FOLDER_ID=12Xdrs-xRfBOYrz3IxqGO8ZVDFNl7Uh9m` retourne `File not found`, donc le dossier n'est pas visible par `lead-qualifier-service@lead-qualifier-mvp.iam.gserviceaccount.com`.
- ❌ WF7 smoke MCP `execution 5375` bloqué au health check : `https://flinty.vercel.app/api/email-health` retourne 500 `MIDDLEWARE_INVOCATION_FAILED`.
- ❌ WF8 smoke non lancé : workflow cible `https://flinty.kamesai.com/api/email-health`, DNS non résolu, et lit `Leads_Qualified` générique alors que la fixture fallback utilise `{campaign_id}_Qualified`.
- ⬜ Reste avant ✅ : configurer `N8N_WF7_WEBHOOK`/corriger URL dashboard des workflows n8n, relancer WF7 → inbox → WF8 → Calendly poll → `booked`.

## Avancement 2026-05-18 — smoke WF7/WF8 validé
- ✅ Vercel `flinty.vercel.app` réparé : patch `instrumentation.ts` + déploiement production `dpl_41XWLvECN67bW5c845HJiajFjMeL`.
- ✅ Setter backend migré vers OpenRouter et déployé ; appel direct `/api/setter/email-reply` OK : lead `smoke_m1_20260518193456_hy3o_lead_smoke_001`, intent `meeting_ready`, draft `turn_1779133255689_vh6e1j`.
- ✅ Fixture dédiée finale : campagne `smoke_m1_20260518193456_hy3o`, sheet `13ZqT3Lgm6ybwv3AwrGYPQHDaN-oaBJ32nH0QXVbOmFw`, lead `smoke_m1_20260518193456_hy3o_lead_smoke_001`.
- ✅ WF7 MCP avec payload Resend simulé : succès 200 en 15.313s, intent `meeting_ready`, `setter_validation=true`.
- ✅ Draft visible via `/api/inbox/summary` : `turn_1779133280696_upq4zo`.
- ✅ WF8 MCP sur le draft : HTTP 200 en 4.222s ; GSheet `Conversations.validated_by=human`, lead `statut_email=contacted`.
- ✅ Retry WF8 même `turn_id` : no-op `sent=false`, `reason=already_validated`.
- ✅ `/api/calendly/poll` débloqué : `CRON_SECRET` ajouté local + Vercel, route répond 200 avec `events=0` quand aucun booking réel n'existe.
- ✅ Email WF8 reçu par Thomas.
- ✅ Bug lien Calendly identifié : l'ancien draft exposait l'URI API `api.calendly.com/event_types/...`, qui retourne `Unauthenticated` côté prospect.
- ✅ Correctif déployé : fallback Setter utilise désormais `CALENDLY_SCHEDULING_URL=https://calendly.com/kames-ai/30min` ou résout le `scheduling_url` public depuis Calendly.
- ✅ Booking Calendly réel via `https://calendly.com/kames-ai/30min` avec `thomas+smoke@kamesai.com`.
- ✅ Poll live après booking : 200 `{ events:1, invitees:1, created:1 }`, puis retry idempotent `{ skipped_existing:1 }`.
- ✅ GSheet final : row `Meetings` créée pour event `d3c28652-76a1-4282-9e16-95dd08a6c9b0`, lead `statut_email=booked`.
- ✅ Intent accuracy évaluée : `Conversations.tags=intent_correct`, `human_intent_label=meeting_ready` sur `turn_1779133280696_upq4zo`.
- ✅ Health blocked WF8 testé : `blocked=true`, `reason=paused_high_bounce`, puis `Email_Health` restauré `active`.

## Dependencies
**Blocked By**: v4-009 → v4-016 (tous les composants Phase 1)

## Complexity & Estimates
Medium · 3h (prep 1h + smoke 2h avec Thomas) · Risk: Medium
