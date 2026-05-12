# Task v4-019 : Souscription Unipile + API key + DSN + webhooks secret
**Status**: ⬜ À faire

## Autonomie
🧑 **Thomas requis** — Accès à la souscription Unipile et à la configuration des webhooks. Claude ne peut pas créer de compte ni générer les clés.

**Actions Thomas** :
1. Aller sur [unipile.com](https://unipile.com) → souscrire plan Cloud (~$59/mois/compte)
2. Dashboard Unipile → récupérer `API_KEY` et `DSN` (ex: `https://api.unipile.com:13447`)
3. Configurer webhook secret dans Unipile dashboard (pour validation HMAC)
4. Ajouter dans `.env.local` et Vercel (staging + prod) :
   - `UNIPILE_API_KEY=...`
   - `UNIPILE_DSN=https://api.unipile.com:13447`
   - `UNIPILE_WEBHOOK_SECRET=...`
5. Configurer les webhooks Unipile pour pointer vers staging : `https://[staging]/api/unipile/webhook`

## Context
Unipile est le proxy API LinkedIn qui permet d'envoyer invitations et DMs sans utiliser l'API officielle LinkedIn (pas d'accès officiel). Phase 2 entière dépend de cette souscription.

**Références** : PRD-v4 F6 · ARCHI-v4 §Intégrations tierces Unipile

## Objective
Compte Unipile actif avec credentials configurés en local et Vercel staging. Webhooks pointant vers l'app.

## Requirements

### Must Have
- [ ] Souscription Unipile Cloud active
- [ ] `UNIPILE_API_KEY` récupérée
- [ ] `UNIPILE_DSN` récupérée
- [ ] `UNIPILE_WEBHOOK_SECRET` configurée
- [ ] Webhook Unipile configuré vers `/api/unipile/webhook` staging
- [ ] Variables dans `.env.local`
- [ ] Variables dans Vercel staging

### Must NOT
- Ne pas utiliser un plan partagé entre Thomas et un client sans isolation (workspace_id distinct)
- Vérifier que l'IP fournie par Unipile est bien résidentielle (obligatoire pour anti-ban LI)

## Technical Approach

```bash
# Test API key après setup :
curl -H "X-API-KEY: $UNIPILE_API_KEY" \
  "$UNIPILE_DSN/api/v1/users/me"
# Doit retourner le profil du compte Unipile
```

## Acceptance Criteria
- [ ] `curl /api/v1/users/me` retourne 200 avec profil Unipile
- [ ] Variables Vercel staging vérifiées via `vercel env pull`
- [ ] Dashboard Unipile : webhook configuré et actif (status green)

## Dependencies
**Blocked By**: Phase 1 stable (v4-018 smoke réussi)

## Complexity & Estimates
Low · 1h · Risk: Low (tâche administrative)
