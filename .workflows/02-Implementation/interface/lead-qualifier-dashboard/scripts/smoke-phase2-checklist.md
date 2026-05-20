# Smoke Phase 2 LinkedIn — Unipile Trial Prep

## Pré-requis

- `UNIPILE_API_KEY`, `UNIPILE_DSN`, `UNIPILE_WEBHOOK_SECRET` configurés en staging.
- Compte LinkedIn Thomas connecté via Unipile Hosted Auth.
- `UNIPILE_ACCOUNT_ID` récupéré depuis `Accounts`.
- Lead test consentant avec `TEST_LINKEDIN_PROFILE_ID`.
- Webhooks n8n staging disponibles : `N8N_WF10_WEBHOOK`, `N8N_WF11_WEBHOOK`, `N8N_WF12_WEBHOOK`.

## Commande

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

- `message.received` : doit appeler WF11, écrire `Conversations.channel=linkedin`, générer un draft Setter LI visible dans `/dashboard/inbox`.
- `invitation.accepted` : doit déclencher le DM post-acceptance, puis mettre `statut_li=connected` ou `dm_sent`.
- `paused_captcha` : doit écrire `LI_Health.status=paused_captcha`, afficher le bandeau rouge dashboard, et faire stopper WF10 avant toute action.

## Vérifications UI / Sheets

- Onglet `Conversations` enfant : dernier turn prospect puis setter avec `channel=linkedin`.
- Inbox `À valider` : badge LinkedIn sur le dernier message et dans le thread.
- Onglet `LI_Health` Index : `last_check_at` récent, `acceptance_rate_7d` rempli, `status` conforme.
- Dashboard : bandeau rouge visible si `status != active`.
- Logs n8n : WF11 complet en moins de 30s ; WF10 ne poursuit pas si `paused_*`.

## Critères de sortie

- 0 test Vitest failing sur `lib/unipile`, `lib/pacing`, `lib/li-health`, inbox.
- Le smoke simulé produit les lignes Sheets attendues.
- Le smoke réel reste à faire pendant l’essai Unipile avant de fermer v4-028.
