# Task v4-013 : Composant `<ConversationThread>` — timeline cross-canal
**Status**: ✅ Complété — 2026-05-17

## Autonomie
🤖 **Claude 100%** — composant React TypeScript.

## Context
Thomas doit voir le thread complet d'une conversation (emails sortants v3 + reply prospect + draft Setter + éventuels DM LinkedIn) dans un format chronologique lisible, avec badges canal (email/linkedin) et rôle (prospect/setter/human).

**Références** : PRD-v4 F4 · ARCHI-v4 §Frontend components ConversationThread

## Objective
Composant `<ConversationThread>` qui affiche la timeline complète d'un lead avec badges canal et actions inline.

## Avancement 2026-05-15
- ✅ Composant `app/dashboard/inbox/ConversationThread.tsx` ajouté et intégré à l'inbox.
- ✅ Turns rendus en bulles gauche/droite selon rôle prospect vs setter/human.
- ⬜ Reste : badges canal visibles, distinction human verte, mention draft, dates relatives, accessibilité feed/aria et scroll automatique.

## Avancement 2026-05-17
- ✅ Badges canal `Email` / `LinkedIn` avec icônes sur chaque turn.
- ✅ Distinction visuelle prospect / setter draft / human.
- ✅ Bandeau `Draft — en attente de validation` sur les turns Setter non validés.
- ✅ Dates relatives en français via `Intl.RelativeTimeFormat`.
- ✅ Timeline accessible avec `role="feed"` et `aria-label` par turn.
- ✅ Scroll automatique vers le dernier message au changement de thread.

## Requirements

### Must Have
- [x] Props : `{thread: Turn[], leadName: string, onSend: (turnId: string) => void, onEscalate: (turnId: string) => void}`
- [x] Chaque turn rendu différemment selon `role` : prospect à gauche, setter/human à droite
- [x] Badge canal : `email` ou `linkedin` (icône + label) sur chaque turn
- [x] Turn setter non validé (`validated_by=null`) : fond distinct + bandeau "Draft — en attente de validation"
- [x] Scroll automatique au dernier message
- [x] Date formatée en français relative (ex: "il y a 3h", "hier à 14h")
- [x] Accessible : role="feed" + aria-label par turn

### Must NOT
- Pas de dépendance externe pour le formatage de dates — utiliser `Intl.RelativeTimeFormat`
- Pas d'édition inline dans ce composant — déléguée à `<SetterDraftCard>` (v4-014)

## Technical Approach

```tsx
// components/ConversationThread.tsx
type TurnBubbleProps = { turn: Turn; onSend?: (id: string) => void; onEscalate?: (id: string) => void }

function TurnBubble({ turn, onSend, onEscalate }: TurnBubbleProps) {
  const isRight = turn.role !== 'prospect'
  const bgClass = turn.role === 'setter'
    ? 'bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.3)]'
    : turn.role === 'human' ? 'bg-green-50' : 'bg-gray-100'
  return (
    <div className={`flex ${isRight ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[70%] rounded-lg p-3 ${bgClass}`}>
        {/* Canal badge */}
        {/* Contenu */}
        {/* Actions si draft non validé */}
      </div>
    </div>
  )
}
```

## Acceptance Criteria
- [x] Thread s'affiche dans l'inbox
- [x] Badge "email" ou "linkedin" visible sur chaque turn
- [x] Turn setter draft : fond distinct + mention "Draft"
- [x] Scroll automatique au bas du thread
- [x] Dates en français relatif

## Dependencies
**Blocked By**: v4-012 (page inbox qui l'intègre)

## Complexity & Estimates
Medium · 3h · Risk: Low
