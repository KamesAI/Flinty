# Task v4-001 : Calendly PAT + event types + env vars Vercel
**Status**: ⬜ À faire

## Autonomie
🧑 **Thomas requis** — Accès au compte Calendly de Thomas. Claude ne peut pas générer un Personal Access Token ni configurer les event types à sa place.

**Actions Thomas** :
1. Aller sur [app.calendly.com/integrations/api_webhooks](https://app.calendly.com/integrations/api_webhooks)
2. Créer un Personal Access Token → copier la valeur
3. Relever l'URI de l'event type principal (ex: `https://api.calendly.com/event_types/XXXX`)
4. Créer un webhook Calendly `invitee.created` pointant vers `https://[domaine]/api/calendly/webhook`
5. Copier le webhook signing key
6. Ajouter dans `.env.local` et Vercel (staging + prod) :
   - `CALENDLY_TOKEN=eyJ...`
   - `CALENDLY_WEBHOOK_SECRET=...`
   - `CALENDLY_EVENT_TYPE_URI=https://api.calendly.com/event_types/XXXX`

## Context
Le Setter v4 propose des créneaux Calendly dynamiquement quand il détecte un prospect `meeting_ready`. Il a besoin d'un token pour appeler l'API Calendly v2 et d'un webhook secret pour valider les callbacks `invitee.created`.

**Références** : PRD-v4 F3 · ARCHI-v4 §Intégrations tierces Calendly

## Objective
Token Calendly v2 opérationnel + webhook configuré + variables d'env sur Vercel staging et prod.

## Requirements

### Must Have
- [ ] Personal Access Token Calendly créé (scope : `default`)
- [ ] URI event type Thomas relevé (meeting 30min ou 1h — selon préférence)
- [ ] Webhook Calendly `invitee.created` créé pointant vers `/api/calendly/webhook`
- [ ] Signing key webhook récupérée
- [ ] Variables en `.env.local` : `CALENDLY_TOKEN`, `CALENDLY_WEBHOOK_SECRET`, `CALENDLY_EVENT_TYPE_URI`
- [ ] Variables sur Vercel staging : identique `.env.local`
- [ ] Variables sur Vercel prod : identique (peut être le même Calendly ou un event type prod dédié)

### Must NOT
- Ne pas utiliser OAuth Calendly maintenant (Phase 3) — PAT suffit pour MVP
- Ne pas exposer le token côté client (env var sans préfixe `NEXT_PUBLIC_`)

## Technical Approach

```bash
# Test API token après setup :
curl -H "Authorization: Bearer $CALENDLY_TOKEN" \
  "https://api.calendly.com/users/me"
# Doit retourner le profil Thomas

# Test slots disponibles :
curl -H "Authorization: Bearer $CALENDLY_TOKEN" \
  "https://api.calendly.com/event_type_available_times?event_type=$CALENDLY_EVENT_TYPE_URI&start_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)&end_time=$(date -u -d '+7 days' +%Y-%m-%dT%H:%M:%SZ)"
```

## Acceptance Criteria
- [ ] `curl /users/me` retourne profil Thomas sans erreur 401
- [ ] `curl /event_type_available_times` retourne ≥1 slot disponible
- [ ] Variables Vercel staging vérifiées via `vercel env pull`
- [ ] Webhook Calendly créé et visible dans dashboard Calendly

## Dependencies
**Blocked By**: aucune (peut faire en parallèle de v4-000)

## Complexity & Estimates
Low · 1h · Risk: Low
