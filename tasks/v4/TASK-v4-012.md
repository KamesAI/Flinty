# Task v4-012 : Refonte `/dashboard/inbox` — 3 tabs (à valider / à répondre / bookings)
**Status**: ✅ Complété — 2026-05-17

## Autonomie
🤖 **Claude 100%** — refonte page Next.js + composants UI.

## Context
L'inbox v3 est basique. v4 introduit 3 tabs distincts correspondant aux 3 états du pipeline Setter : drafts à valider, threads escaladés à traiter manuellement, et réunions bookées. Page centrale du workflow Thomas.

**Références** : PRD-v4 F4 · ARCHI-v4 §Frontend Architecture inbox

## Objective
Page `/dashboard/inbox` avec 3 tabs fonctionnels, alimentés par les routes `/api/replies/*`.

## Avancement 2026-05-15
- ✅ `/dashboard/inbox` refondue autour de 3 tabs : `À valider`, `À répondre`, `Bookings`.
- ✅ Tab `À valider` alimentée par `listSetterDraftQueue()` : drafts Setter non validés + dernier message prospect + thread.
- ✅ Tab `Bookings` lit `Meetings`.
- ✅ `GET /api/inbox/summary` ajouté.
- ✅ Tests page inbox mis à jour.
- ⬜ Reste : tab `À répondre` réelle pour escalades, regroupement bookings par semaine, polling 60s/client-side tab switch.

## Avancement 2026-05-17
- ✅ Tab `À répondre` alimentée par les threads Setter escaladés (`validated_by` préfixé `escalated`, en cohérence avec `/api/replies/[lead_id]/escalate` avant le fix v4-011 `setter_action`).
- ✅ Chaque thread manuel affiche prospect, dernier message, intent et raison d'escalade.
- ✅ Bookings groupés par semaine.
- ✅ Compteurs inbox rafraîchis côté client toutes les 60s via `GET /api/inbox/summary`.
- ✅ Couleurs actives migrées vers `hsl(var(--primary))`.
- ✅ Tests ajoutés : escalades, groupement weekly bookings, compteur summary.

## Requirements

### Must Have
- [x] Page `app/dashboard/inbox/page.tsx` — 3 tabs avec compteurs badges
- [x] **Tab "À valider"** : liste les threads où dernier turn setter a `validated_by=null` (drafts Setter en attente)
- [x] **Tab "À répondre"** : liste les threads où `setter_action=escalated` (Thomas doit répondre manuellement)
- [x] **Tab "Bookings"** : liste les meetings du tab Meetings (statut=booked), groupés par semaine
- [x] Chaque item dans "À valider" : nom prospect + intent classifié + extrait draft + date
- [x] Chaque item dans "À répondre" : nom prospect + dernier message + intent + raison escalade
- [x] Polling toutes 60s pour rafraîchir les compteurs (ou route Server-Sent Events si simple)
- [x] URL persistante : `?tab=validate|reply|bookings` (synchronisation avec `searchParams`)

### Must NOT
- Pas de shadcn UI — Tailwind custom + @radix-ui/react-tabs
- Pas de rechargement complet de page — client-side tab switch

## Technical Approach

```tsx
// app/dashboard/inbox/page.tsx
import * as Tabs from '@radix-ui/react-tabs'

export default function InboxPage() {
  const [tab, setTab] = useState('valider')
  // fetch /api/inbox/summary → {to_validate: n, to_reply: n, bookings: n}
  return (
    <Tabs.Root value={tab} onValueChange={setTab}>
      <Tabs.List className="flex border-b border-border">
        <Tabs.Trigger value="valider">À valider <Badge>{toValidate}</Badge></Tabs.Trigger>
        <Tabs.Trigger value="repondre">À répondre <Badge>{toReply}</Badge></Tabs.Trigger>
        <Tabs.Trigger value="bookings">Bookings <Badge>{bookings}</Badge></Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="valider"><ValidateList /></Tabs.Content>
      <Tabs.Content value="repondre"><ReplyList /></Tabs.Content>
      <Tabs.Content value="bookings"><BookingsList /></Tabs.Content>
    </Tabs.Root>
  )
}
```

Route summary : `GET /api/inbox/summary` — compte les items par catégorie.

## Acceptance Criteria
- [x] Page accessible sur `/dashboard/inbox` en dev
- [x] 3 tabs visibles avec badges compteurs
- [x] Tab "À valider" affiche les drafts Setter non validés
- [x] Tab "Bookings" affiche les meetings
- [x] URL `?tab=reply` charge directement le bon tab
- [x] Couleur UI : hsl(var(--primary)) pour les badges actifs

## Dependencies
**Blocked By**: v4-011 (routes /api/replies/*)

## Complexity & Estimates
Medium · 4h · Risk: Low
