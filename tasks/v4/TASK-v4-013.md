# Task v4-013 : Composant `<ConversationThread>` — timeline cross-canal
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — composant React TypeScript.

## Context
Thomas doit voir le thread complet d'une conversation (emails sortants v3 + reply prospect + draft Setter + éventuels DM LinkedIn) dans un format chronologique lisible, avec badges canal (email/linkedin) et rôle (prospect/setter/human).

**Références** : PRD-v4 F4 · ARCHI-v4 §Frontend components ConversationThread

## Objective
Composant `<ConversationThread>` qui affiche la timeline complète d'un lead avec badges canal et actions inline.

## Requirements

### Must Have
- [ ] Props : `{thread: Turn[], leadName: string, onSend: (turnId: string) => void, onEscalate: (turnId: string) => void}`
- [ ] Chaque turn rendu différemment selon `role` : prospect (bulle gauche grise), setter (bulle droite bleue avec badge "IA"), human (bulle droite verte)
- [ ] Badge canal : `email` ou `linkedin` (icône + label) sur chaque turn
- [ ] Turn setter non validé (`validated_by=null`) : fond distinct + bandeau "Draft — en attente de validation"
- [ ] Scroll automatique au dernier message
- [ ] Date formatée en français relative (ex: "il y a 3h", "hier à 14h")
- [ ] Accessible : role="feed" + aria-label par turn

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
- [ ] Thread de 5 turns (prospect + setter + human + prospect + setter draft) s'affiche correctement
- [ ] Badge "email" ou "linkedin" visible sur chaque turn
- [ ] Turn setter draft : fond distinct + mention "Draft"
- [ ] Scroll automatique au bas du thread
- [ ] Dates en français relatif

## Dependencies
**Blocked By**: v4-012 (page inbox qui l'intègre)

## Complexity & Estimates
Medium · 3h · Risk: Low
