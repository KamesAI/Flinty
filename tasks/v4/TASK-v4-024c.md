# Task v4-024c : Bandeau dashboard `<LIHealthBanner>` — rouge si status != active + raison + ETA reprise
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — composant React TypeScript.

## Context
Quand le compte LinkedIn Thomas est en pause (captcha, warning, accept_rate bas), Thomas doit le voir immédiatement en ouvrant le dashboard — sans avoir à aller dans les settings. Le bandeau rouge apparaît en haut de toutes les pages dashboard.

**Références** : PRD-v4 F14 · ARCHI-v4 §Frontend LIHealthBanner

## Objective
Composant `<LIHealthBanner>` intégré dans le layout dashboard, visible uniquement si status LI != active.

## Requirements

### Must Have
- [ ] Composant `components/LIHealthBanner.tsx`
- [ ] Affiché dans `app/dashboard/layout.tsx` (toutes les pages dashboard)
- [ ] Données : `GET /api/li-health` (polling toutes 5 min)
- [ ] Si `status=active` → invisible (null render)
- [ ] Si `status=paused_*` → bandeau rouge avec :
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
- [ ] Status=active → bandeau invisible
- [ ] Status=paused_captcha → bandeau rouge avec message correct
- [ ] ETA reprise calculé et affiché (ex: "Reprise dans 23h")
- [ ] Bandeau visible sur toutes les pages dashboard (layout intégration)

## Dependencies
**Blocked By**: v4-024b (WF12 + route /api/li-health)

## Complexity & Estimates
Low · 2h · Risk: Low
