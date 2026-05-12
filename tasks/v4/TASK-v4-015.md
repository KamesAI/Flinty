# Task v4-015 : Page `/dashboard/campaigns/[id]/settings` — toggle setter_validation, ton, signature
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — nouvelle page Next.js.

## Context
Chaque campagne peut avoir ses propres paramètres Setter : validation requise ou non, ton (formel/casual), signature utilisée. Cette page permet à Thomas de configurer ces paramètres par campagne depuis l'UI, stockés dans `Config` tab de l'enfant.

**Références** : PRD-v4 F5 · ARCHI-v4 §Frontend settings page

## Objective
Page settings campagne fonctionnelle avec sauvegarde dans Config GSheet enfant.

## Requirements

### Must Have
- [ ] Page `app/dashboard/campaigns/[id]/settings/page.tsx`
- [ ] Section "AI Setter" avec 4 contrôles :
  - Toggle `setter_enabled` (activer/désactiver Setter pour cette campagne)
  - Toggle `setter_validation` (validation humaine requise — défaut `true` **pendant warm-up**, flip auto à `false` après M1 KPI atteint via v4-016b)
  - Champ lecture seule `setter_validation_locked_until` (date fin warm-up — empêche bascule manuelle avant)
  - Select `setter_tone` : Formel / Casual
  - Textarea `setter_signature` : nom affiché dans emails Setter
- [ ] Section "Calendly" : input `calendly_event_uri` (pré-rempli depuis env var, éditable par campagne)
- [ ] Bouton "Sauvegarder" → POST `/api/campaigns/[id]/settings` → update Config tab
- [ ] Feedback toast "Sauvegardé" ou "Erreur"
- [ ] Load actuel depuis Config tab au chargement de la page

- [ ] Route `GET /api/campaigns/[id]/settings` — lit Config tab enfant
- [ ] Route `PUT /api/campaigns/[id]/settings` — update Config tab enfant

### Must NOT
- Ne pas exposer `li_caps_daily` dans cette page (Phase 2)
- Pas d'auto-save (sauvegarder uniquement sur clic bouton)

## Technical Approach

```tsx
// app/dashboard/campaigns/[id]/settings/page.tsx
export default async function CampaignSettings({ params }: { params: { id: string } }) {
  const settings = await fetch(`/api/campaigns/${params.id}/settings`).then(r => r.json())
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Paramètres — AI Setter</h1>
      <SettingsForm initialSettings={settings} campaignId={params.id} />
    </div>
  )
}
```

```typescript
// Valeurs Config tab clés :
// setter_enabled | setter_validation | setter_validation_locked_until | setter_tone | setter_signature | calendly_event_uri
```

## Acceptance Criteria
- [ ] Page accessible depuis `/dashboard/campaigns/[id]/settings`
- [ ] Toggles chargent les valeurs actuelles depuis Config
- [ ] Clic "Sauvegarder" → Config tab mis à jour → toast confirmation
- [ ] Toggle setter_validation=false visible dans WF7 (vérifiable en relisant Config)

## Dependencies
**Blocked By**: v4-002 (Config tab avec nouvelles lignes)

## Complexity & Estimates
Medium · 2h · Risk: Low
