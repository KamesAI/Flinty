# Task v4-014 : Composant `<SetterDraftCard>` + actions valider/éditer/escalader
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — composant React TypeScript.

## Context
Thomas voit les drafts Setter dans l'inbox. Pour chaque draft, il peut : valider en 1 clic (envoi immédiat), éditer le texte puis envoyer, ou escalader (retirer du pipeline auto). Ce composant est l'interface centrale de contrôle humain sur le Setter.

**Références** : PRD-v4 F4 F5 · ARCHI-v4 §Frontend components SetterDraftCard

## Objective
Composant `<SetterDraftCard>` avec les 3 actions et feedback visuel immédiat.

## Requirements

### Must Have
- [ ] Props : `{turn: Turn, leadId: string, onSend: () => void, onEscalate: () => void}`
- [ ] Affiche : contenu draft + intent classifié + confidence + reasoning (collapsible)
- [ ] Bouton **"Envoyer"** : POST `/api/replies/[lead_id]/send` → spinner → "Envoyé ✓" (désactivation après)
- [ ] Bouton **"Éditer"** : ouvre textarea inline avec diff vs draft original — après édition, PUT content → POST /send
- [ ] Bouton **"Escalader"** : POST `/api/replies/[lead_id]/escalate` → card disparaît de la liste
- [ ] Diff visuel entre draft original et version éditée (fond jaune sur modifications)
- [ ] Keyboard : Enter pour envoyer, Escape pour annuler édition

### Must NOT
- Ne pas permettre l'envoi d'un draft vide (validation côté client)
- Pas de confirmation modal pour "Envoyer" (1 clic = envoi) — confirmation modal pour "Escalader"

## Technical Approach

```tsx
// components/SetterDraftCard.tsx
export function SetterDraftCard({ turn, leadId, onSend, onEscalate }: SetterDraftCardProps) {
  const [editing, setEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(turn.content)
  const [sending, setSending] = useState(false)

  async function handleSend() {
    setSending(true)
    // Si édité : PUT d'abord
    await fetch(`/api/replies/${leadId}/send`, { method: 'POST', body: JSON.stringify({ turn_id: turn.turn_id }) })
    onSend()
  }

  return (
    <div className="border border-[hsl(var(--primary)/0.4)] rounded-lg p-4 bg-[hsl(var(--primary)/0.05)]">
      {/* Intent badge + confidence */}
      {/* Draft content / textarea si editing */}
      {/* Actions */}
    </div>
  )
}
```

## Acceptance Criteria
- [ ] Clic "Envoyer" → spinner → "Envoyé ✓" → card désactivée
- [ ] Clic "Éditer" → textarea visible avec contenu pré-rempli
- [ ] Diff visuel entre original et édition visible
- [ ] Clic "Escalader" → modal confirmation → card disparaît
- [ ] Draft vide → bouton "Envoyer" désactivé

## Dependencies
**Blocked By**: v4-013 (ConversationThread qui l'intègre), v4-011 (routes /send + /escalate)

## Complexity & Estimates
Medium · 3h · Risk: Low
