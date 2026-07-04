# Task v4-024c : Bandeau dashboard `<LIHealthBanner>` — rouge si status != active + raison + ETA reprise
**Status**: 🚧 Partiel — 2026-07-04

## Autonomie
🤖 **Claude 100%** — composant React TypeScript.

## Context
Quand le compte LinkedIn Thomas est en pause (captcha, warning, accept_rate bas), Thomas doit le voir immédiatement en ouvrant le dashboard — sans avoir à aller dans les settings. Le bandeau rouge apparaît en haut de toutes les pages dashboard.

**Références** : PRD-v4 F14 · ARCHI-v4 §Frontend LIHealthBanner

## Objective
Composant `<LIHealthBanner>` intégré dans le layout dashboard, visible uniquement si status LI != active.

## Requirements

### Must Have
- [x] Composant `components/LIHealthBanner.tsx`
- [x] Affiché dans `app/dashboard/layout.tsx` (toutes les pages dashboard)
- [x] Données : `GET /api/li-health` (polling toutes 5 min)
- [x] Si `status=active` → invisible (null render)
- [x] Si `status=paused_*` → bandeau rouge avec :
  - Icône ⚠️ + "Compte LinkedIn en pause"
  - Raison lisible (ex: "Taux d'acceptation <20% — Vérifiez votre ICP")
  - ETA reprise : "Reprise automatique dans X jours" (calculé depuis pause date + TTL)
  - Lien "Voir détails →" vers `/dashboard/settings/linkedin/connect`

### Must NOT
- Pas de bandeau si status=active — ne pas afficher inutilement
- Ne pas bloquer le chargement du dashboard en attendant /api/li-health

## Technical Approach

```tsx
// components/LIHealthBanner.tsx
const STATUS_MESSAGES: Record<string, { message: string; ttlDays: number }> = {
  paused_captcha: { message: "Captcha LinkedIn détecté", ttlDays: 1 },
  paused_warning: { message: "Email LinkedIn 'activité inhabituelle' reçu", ttlDays: 14 },
  paused_low_accept: { message: "Taux d'acceptation <20% — vérifiez votre ICP", ttlDays: 7 },
  paused_follow_mode: { message: "Mode 'Suivre' détecté sur ≥3 profils", ttlDays: 7 },
}

export function LIHealthBanner() {
  const { data } = useSWR('/api/li-health', fetcher, { refreshInterval: 300_000 })
  if (!data || data.status === 'active') return null
  const info = STATUS_MESSAGES[data.status]
  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-3">
      <span>⚠️</span>
      <span className="text-red-800 text-sm font-medium">Compte LinkedIn en pause — {info.message}</span>
      <a href="/dashboard/settings/linkedin/connect" className="text-red-700 underline text-sm ml-auto">Voir détails →</a>
    </div>
  )
}
```

## Acceptance Criteria
- [x] Status=active → bandeau invisible
- [x] Status=paused_captcha → bandeau rouge avec message correct
- [x] ETA reprise calculé et affiché (ex: "Reprise dans 23h")
- [x] Bandeau visible sur toutes les pages dashboard (layout intégration)

## Avancement

### 2026-05-18 — Bandeau + route LI_Health livrés, WF12 réel en attente
- Ajout `components/layout/LIHealthBanner.tsx`, intégré dans `AppShell` pour toutes les pages dashboard.
- Polling `/api/li-health` toutes les 5 minutes, rendu `null` tant que les données ne sont pas chargées ou si `status=active`.
- Messages pause `paused_captcha`, `paused_warning`, `paused_low_accept`, `paused_follow_mode` + ETA calculée depuis `pause_started_at`.
- Ajout helpers `LI_Health` dans `lib/sheets.ts` et route `GET /api/li-health`.
- Tests Vitest des helpers de label/ETA et du rendu initial.

**Reste avant ✅** :
- Voir mise à jour 2026-07-04 : WF12 dry-run produit `paused_captcha`; reste la persistance Sheets et preuve UI live.

### 2026-07-04 — Source WF12 dry-run disponible
- WF12 staging actif (`161OqYZPQgClGKAr`) retourne `health_payload.status=paused_captcha` sur payload simulé.
- `POST /api/li-health` peut persister `LI_Health` et `LI_Health_History` quand `dry_run=false`, `app_base_url` et `CRON_SECRET` sont fournis.

**Reste avant ✅** :
- Exécuter un smoke persistant qui écrit `status=paused_captcha` dans `LI_Health`.
- Vérifier le bandeau rouge dans le dashboard sur cette donnée Sheets réelle.

## Dependencies
**Blocked By**: v4-024b (WF12 + route /api/li-health)

## Complexity & Estimates
Low · 2h · Risk: Low
