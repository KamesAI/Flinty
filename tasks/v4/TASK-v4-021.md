# Task v4-021 : Hosted auth flow — `/dashboard/settings/linkedin/connect` + callback `/api/unipile/callback` + tab Accounts
**Status**: 🚧 Partiel — 2026-05-18

## Autonomie
🤖 **Claude 100%** — page Next.js + route API + écriture GSheets.

## Context
Thomas doit connecter son compte LinkedIn via Unipile (hosted auth flow — Unipile gère la session LinkedIn). Cette page initie le flow et le callback stocke le `unipile_account_id` dans le tab `Accounts` du GSheet Index.

**Références** : PRD-v4 F6 · ARCHI-v4 §Frontend settings linkedin

## Objective
Flow complet de connexion LinkedIn via Unipile : page settings → redirect Unipile → callback → account_id stocké → statut affiché.

## Requirements

### Must Have
- [x] Page `app/dashboard/settings/linkedin/connect/page.tsx` :
  - Affiche statut actuel du compte LI (connecté/déconnecté/paused)
  - Bouton "Connecter LinkedIn" → POST `/api/unipile/auth/initiate` → redirect vers URL Unipile hosted auth
- [x] Route `POST /api/unipile/auth/initiate` — appel Unipile API pour générer l'URL d'auth → redirect
- [x] Route `GET /api/unipile/callback` — reçoit `account_id` + `status` → écrit dans tab `Accounts` Index → redirect vers `/dashboard/settings/linkedin/connect` avec message succès
- [x] Route `GET /api/unipile/status` — lit tab Accounts → retourne `{status, account_id, connected_at}`
- [x] Statut visible sur page : "Connecté depuis le XX/XX", "Expiré — reconnecter", "Suspendu — raison"

### Must NOT
- Ne pas stocker de session LinkedIn dans Next.js — uniquement l'account_id Unipile
- Pas d'OAuth LinkedIn officiel — uniquement Unipile hosted auth

## Technical Approach

Unipile hosted auth flow :
1. `POST /api/v1/users/link` avec `{providers: ['LINKEDIN'], success_redirect_url, failure_redirect_url}`
2. Retourne `{url: "https://auth.unipile.com/..."}` → redirect Thomas
3. Thomas se connecte sur la page Unipile → redirect vers `/api/unipile/callback?account_id=XXX`
4. Callback stocke dans tab Accounts : `{account_id, type: 'linkedin', provider: 'unipile', status: 'connected', connected_at}`

```typescript
// app/api/unipile/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('account_id')
  if (!accountId) return redirect('/dashboard/settings/linkedin/connect?error=missing_account_id')

  await appendAccountRow({ account_id: accountId, type: 'linkedin', status: 'connected', connected_at: new Date().toISOString() })
  return redirect('/dashboard/settings/linkedin/connect?success=true')
}
```

## Acceptance Criteria
- [x] Clic "Connecter LinkedIn" → redirect vers page Unipile hosted auth
- [x] Après auth Unipile → redirect vers `/dashboard/settings/linkedin/connect` avec "Compte connecté ✓"
- [x] Tab Accounts Index contient la nouvelle row avec account_id
- [x] Page affiche statut "Connecté depuis le ..." après callback
- [x] Route `/api/unipile/status` retourne le statut actuel

## Avancement

### 2026-05-18 — UI + routes livrées, smoke réel en attente
- Ajout page `/dashboard/settings/linkedin/connect` avec statut connecté/déconnecté/paused/expired et bouton hosted auth.
- Ajout routes `POST /api/unipile/auth/initiate`, `GET /api/unipile/callback`, `GET /api/unipile/status`.
- Ajout helpers `Accounts` dans `lib/sheets.ts` : création header, lecture dernier compte LI, upsert `account_id`.
- Ajout méthode `createHostedAuthLink()` dans `lib/unipile.ts`.
- Tests Vitest ajoutés sur les 3 routes.

**Reste avant ✅** :
- Configurer `UNIPILE_API_KEY` + `UNIPILE_DSN` staging/prod et faire un vrai flow Unipile avec le compte Thomas.

## Dependencies
**Blocked By**: v4-020 (lib/unipile.ts), v4-002 (tab Accounts dans Index)

## Complexity & Estimates
Medium · 3h · Risk: Medium (redirect flow Unipile)
