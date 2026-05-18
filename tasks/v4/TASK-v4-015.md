# Task v4-015 : Page `/dashboard/campaigns/[id]/settings` — toggle setter_validation, ton, signature
**Status**: ✅ Terminé — 2026-05-18

## Autonomie
🤖 **Claude 100%** — nouvelle page Next.js.

## Context
Chaque campagne peut avoir ses propres paramètres Setter : validation requise ou non, ton (formel/casual), signature utilisée. Cette page permet à Thomas de configurer ces paramètres par campagne depuis l'UI, stockés dans `Config` tab de l'enfant.

**Références** : PRD-v4 F5 · ARCHI-v4 §Frontend settings page

## Objective
Page settings campagne fonctionnelle avec sauvegarde dans Config GSheet enfant.

## Requirements

### Must Have
- [x] Page `app/dashboard/campaigns/[id]/settings/page.tsx`
- [x] Section "AI Setter" avec 4 contrôles :
  - Toggle `setter_enabled` (activer/désactiver Setter pour cette campagne)
  - Toggle `setter_validation` (validation humaine requise — défaut `true` **pendant warm-up**, flip auto à `false` après M1 KPI atteint via v4-016b)
  - Champ lecture seule `setter_validation_locked_until` (date fin warm-up — empêche bascule manuelle avant)
  - Select `setter_tone` : Formel / Casual
  - Textarea `setter_signature` : nom affiché dans emails Setter
- [x] Section "Calendly" : input `calendly_event_uri` (pré-rempli depuis env var, éditable par campagne)
- [x] Bouton "Sauvegarder" → PUT `/api/campaigns/[id]/settings` → update Config tab
- [x] Feedback toast "Sauvegardé" ou "Erreur"
- [x] Load actuel depuis Config tab au chargement de la page

- [x] Route `GET /api/campaigns/[id]/settings` — lit Config tab enfant
- [x] Route `PUT /api/campaigns/[id]/settings` — update Config tab enfant

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
- [x] Page accessible depuis `/dashboard/campaigns/[id]/settings`
- [x] Toggles chargent les valeurs actuelles depuis Config
- [x] Clic "Sauvegarder" → Config tab mis à jour → toast confirmation
- [x] Toggle setter_validation=false visible dans WF7 (vérifiable en relisant Config)

## Avancement

### 2026-05-18 — Implémentation dashboard settings
- Ajout de la page `/dashboard/campaigns/[campaign_id]/settings` avec formulaire AI Setter + Calendly et lien depuis la fiche campagne.
- Ajout de `GET/PUT /api/campaigns/[id]/settings`, normalisation booléens Config, fallback `CALENDLY_EVENT_TYPE_URI`, et écriture limitée aux clés autorisées (pas de `li_caps_daily` exposé).
- `readCampaignConfig` lit désormais l'onglet `Config` v4 avant le fallback legacy `{campaignId}_Config`.
- Preuves : `npm run test` → 68 fichiers / 356 tests ; `npm run build` → OK.

## Dependencies
**Blocked By**: v4-002 (Config tab avec nouvelles lignes)

## Complexity & Estimates
Medium · 2h · Risk: Low
