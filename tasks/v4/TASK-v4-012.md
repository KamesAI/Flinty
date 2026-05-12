# Task v4-012 : Refonte `/dashboard/inbox` — 3 tabs (à valider / à répondre / bookings)
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — refonte page Next.js + composants UI.

## Context
L'inbox v3 est basique. v4 introduit 3 tabs distincts correspondant aux 3 états du pipeline Setter : drafts à valider, threads escaladés à traiter manuellement, et réunions bookées. Page centrale du workflow Thomas.

**Références** : PRD-v4 F4 · ARCHI-v4 §Frontend Architecture inbox

## Objective
Page `/dashboard/inbox` avec 3 tabs fonctionnels, alimentés par les routes `/api/replies/*`.

## Requirements

### Must Have
- [ ] Page `app/dashboard/inbox/page.tsx` — 3 tabs avec compteurs badges
- [ ] **Tab "À valider"** : liste les threads où dernier turn setter a `validated_by=null` (drafts Setter en attente)
- [ ] **Tab "À répondre"** : liste les threads où `setter_action=escalated` (Thomas doit répondre manuellement)
- [ ] **Tab "Bookings"** : liste les meetings du tab Meetings (statut=booked), groupés par semaine
- [ ] Chaque item dans "À valider" : nom prospect + intent classifié + extrait draft + date
- [ ] Chaque item dans "À répondre" : nom prospect + dernier message + intent + raison escalade
- [ ] Polling toutes 60s pour rafraîchir les compteurs (ou route Server-Sent Events si simple)
- [ ] URL persistante : `?tab=valider|repondre|bookings` (synchronisation avec `searchParams`)

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
- [ ] Page accessible sur `/dashboard/inbox` en dev
- [ ] 3 tabs visibles avec badges compteurs corrects
- [ ] Tab "À valider" affiche les drafts Setter non validés
- [ ] Tab "Bookings" affiche les meetings bookés
- [ ] URL `?tab=repondre` charge directement le bon tab
- [ ] Couleur UI : hsl(var(--primary)) pour les badges actifs

## Dependencies
**Blocked By**: v4-011 (routes /api/replies/*)

## Complexity & Estimates
Medium · 4h · Risk: Low
