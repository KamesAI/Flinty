# Task v4-001 : Calendly PAT + event types + env vars Vercel
**Status**: ✅ Done — 2026-05-13

## Autonomie
✅ **Variables configurées** par Claude dans `.env.local` (2026-05-12).

**Approche retenue : polling** — plan Calendly gratuit ne supporte pas les webhooks. Flinty vérifiera les nouveaux meetings toutes les 5 minutes via Vercel Cron.

### Variables dans `.env.local` ✅ Déjà fait

```env
CALENDLY_TOKEN=eyJraWQi...
CALENDLY_EVENT_TYPE_URI=https://api.calendly.com/event_types/0b5bf64b-d709-410b-b5f0-136195e4ea5f
CALENDLY_USER_URI=https://api.calendly.com/users/fd8f203d-7bb7-45b6-b3e9-f8b29be67d1e
```

Event type actif : **"30 Minute Meeting"** (`calendly.com/kames-ai/30min`)

### Étape restante — Ajouter sur Vercel ⬜

```bash
cd /Users/callendreau/Dev/Flinty/02-Implementation/interface/lead-qualifier-dashboard

vercel env add CALENDLY_TOKEN
# coller la valeur du .env.local → choisir "Preview" ET "Production"

vercel env add CALENDLY_EVENT_TYPE_URI
# https://api.calendly.com/event_types/0b5bf64b-d709-410b-b5f0-136195e4ea5f

vercel env add CALENDLY_USER_URI
# https://api.calendly.com/users/fd8f203d-7bb7-45b6-b3e9-f8b29be67d1e
```

## Context
Le Setter v4 propose des créneaux Calendly dynamiquement quand il détecte un prospect `meeting_ready`. Polling toutes les 5min via Vercel Cron — pas de webhook (plan gratuit Calendly).

**Références** : PRD-v4 F3 · ARCHI-v4 §Intégrations tierces Calendly

## Objective
Token Calendly v2 opérationnel + variables d'env sur Vercel staging et prod.

## Requirements

### Must Have
- [x] Personal Access Token Calendly créé — token "Flinty"
- [x] URI event type relevé — "30 Minute Meeting"
- [x] Variables en `.env.local` : `CALENDLY_TOKEN`, `CALENDLY_EVENT_TYPE_URI`, `CALENDLY_USER_URI`
- [ ] Variables sur Vercel staging + prod

### Must NOT
- Ne pas utiliser OAuth Calendly maintenant (Phase 3) — PAT suffit pour MVP
- Ne pas exposer le token côté client (env var sans préfixe `NEXT_PUBLIC_`)
- Ne pas implémenter de webhook (plan gratuit = non supporté)

## Technical Approach

```bash
# Vérifier token :
curl -H "Authorization: Bearer $CALENDLY_TOKEN" \
  "https://api.calendly.com/users/me"

# Vérifier slots disponibles :
curl -H "Authorization: Bearer $CALENDLY_TOKEN" \
  "https://api.calendly.com/event_type_available_times?event_type=$CALENDLY_EVENT_TYPE_URI&start_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)&end_time=$(date -u -v+7d +%Y-%m-%dT%H:%M:%SZ)"
```

## Acceptance Criteria
- [x] `curl /users/me` retourne profil Thomas sans erreur 401
- [ ] Variables Vercel staging vérifiées via `vercel env pull`

## Dependencies
**Blocked By**: aucune

## Complexity & Estimates
Low · 15min restant · Risk: Low
