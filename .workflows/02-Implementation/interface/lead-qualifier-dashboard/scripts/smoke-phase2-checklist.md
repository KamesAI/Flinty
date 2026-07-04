# Smoke Phase 2 LinkedIn — Unipile Trial Prep

## Workflows staging créés

| WF | ID n8n | Webhook path | Statut |
|----|--------|--------------|--------|
| WF9 LI Sourcing | `8BC66iPd5NdQ0wxi` | `/webhook/flinty-wf9-li-source` | actif dry-run |
| WF10 LI Outreach | `32k4hm48Lp4hhubi` | `/webhook/flinty-wf10-li-outreach` | webhook actif dry-run ; cron désactivé jusqu'au live |
| WF11 Setter LI | `5yBywgtkggNlS3x6` | `/webhook/flinty-wf11-setter-li` | actif dry-run |
| WF12 LI Health | `161OqYZPQgClGKAr` | `/webhook/flinty-wf12-li-health` | webhook actif dry-run ; cron désactivé jusqu'au live |

## Pré-requis

- `UNIPILE_API_KEY`, `UNIPILE_DSN`, `UNIPILE_WEBHOOK_SECRET` configurés en staging.
- Compte LinkedIn Thomas connecté via Unipile Hosted Auth.
- `UNIPILE_ACCOUNT_ID` récupéré depuis `Accounts`.
- Lead test consentant avec `TEST_LINKEDIN_PROFILE_ID`.
- Webhooks n8n staging disponibles : `N8N_WF9_WEBHOOK`, `N8N_WF10_WEBHOOK`, `N8N_WF11_WEBHOOK`, `N8N_WF12_WEBHOOK`.

## Commande

```bash
cd .workflows/02-Implementation/interface/lead-qualifier-dashboard
N8N_WF9_WEBHOOK="https://staging-n8n.kamesai.com/webhook/flinty-wf9-li-source" \
N8N_WF10_WEBHOOK="https://staging-n8n.kamesai.com/webhook/flinty-wf10-li-outreach" \
N8N_WF11_WEBHOOK="https://staging-n8n.kamesai.com/webhook/flinty-wf11-setter-li" \
N8N_WF12_WEBHOOK="https://staging-n8n.kamesai.com/webhook/flinty-wf12-li-health" \
UNIPILE_WEBHOOK_SECRET="..." \
UNIPILE_ACCOUNT_ID="acc_..." \
TEST_LINKEDIN_PROFILE_ID="..." \
./scripts/smoke-phase2.sh
```

`UNIPILE_WEBHOOK_SECRET` est optionnel pour les dry-runs, mais si présent le script signe chaque payload avec `X-Unipile-Signature: sha256=<hmac>`.

## Ordre exact de smoke simulé

1. **WF12 pause simulée**
   - Payload `paused_captcha`, `dry_run=true`.
   - Attendu : `health_payload.status=paused_captcha`, `should_alert=true`.
   - Pour persister dans `LI_Health`/`LI_Health_History`, relancer avec `dry_run=false`, `app_base_url`, et `api_bearer` correspondant à `CRON_SECRET`.

2. **WF9 dry-run sourcing**
   - Canal `linkedin_search` avec profil simulé.
   - Attendu : lead normalisé `{name, linkedin_url, title, company}`, `source_channel=linkedin_search`, cap `max_results=100`, aucun doublon registry.

3. **WF10 dry-run cap weekly**
   - `invites_sent_week=97` + 4 leads `new`.
   - Attendu : 3 invitations maximum, puis `organic_action=view` après la 3e invitation.
   - Variante pause : envoyer `health_status=paused_captcha`; attendu `stopped=true`, `planned_actions=[]`.

4. **WF11 draft Setter LI**
   - Payload `message.received`.
   - Attendu : `conversation_event.channel=linkedin`, `action=draft_inbox`, `draft.calendly_mode=text_link_only`.

## Commande legacy manuelle

```bash
cd .workflows/02-Implementation/interface/lead-qualifier-dashboard
N8N_WF11_WEBHOOK="https://staging-n8n.kamesai.com/webhook/..." \
N8N_WF10_WEBHOOK="https://staging-n8n.kamesai.com/webhook/..." \
N8N_WF12_WEBHOOK="https://staging-n8n.kamesai.com/webhook/..." \
UNIPILE_ACCOUNT_ID="acc_..." \
TEST_LINKEDIN_PROFILE_ID="..." \
./scripts/smoke-phase2.sh
```

## Payloads simulés

- `paused_captcha` : doit écrire `LI_Health.status=paused_captcha` seulement en mode persistance, afficher le bandeau rouge dashboard, et faire stopper WF10 avant toute action.
- `linkedin_search` / `post_engagers` / `profile_visitors` / `external_post` : WF9 doit normaliser les profils et dédupliquer par `linkedin_url`.
- `scheduled_invitations` : WF10 doit respecter `cap weekly 100` et intercaler `organic_action` après 3 invitations.
- `message.received` : doit appeler WF11, écrire `Conversations.channel=linkedin` en mode live, générer un draft Setter LI visible dans `/dashboard/inbox`.

## Vérifications UI / Sheets

- Onglet `Conversations` enfant : dernier turn prospect puis setter avec `channel=linkedin`.
- Inbox `À valider` : badge LinkedIn sur le dernier message et dans le thread.
- Onglet `LI_Health` Index : `last_check_at` récent, `acceptance_rate_7d` rempli, `status` conforme.
- Dashboard : bandeau rouge visible si `status != active`.
- Logs n8n : WF11 complet en moins de 30s ; WF10 ne poursuit pas si `paused_*`.

## Critères de sortie

- 0 test Vitest failing sur `lib/unipile`, `lib/pacing`, `lib/li-health`, inbox.
- Le smoke simulé dry-run retourne les JSON attendus pour WF9-WF12.
- Le smoke persistant produit les lignes Sheets attendues dès que `app_base_url` + `CRON_SECRET` sont configurés.
- Le smoke réel reste à faire pendant l'essai Unipile avant de fermer v4-028.
