# Task v4-014 : Composant `<SetterDraftCard>` + actions valider/éditer/escalader
**Status**: ✅ Complété — 2026-05-17

## Autonomie
🤖 **Claude 100%** — composant React TypeScript.

## Context
Thomas voit les drafts Setter dans l'inbox. Pour chaque draft, il peut : valider en 1 clic (envoi immédiat), éditer le texte puis envoyer, ou escalader (retirer du pipeline auto). Ce composant est l'interface centrale de contrôle humain sur le Setter.

**Références** : PRD-v4 F4 F5 · ARCHI-v4 §Frontend components SetterDraftCard

## Objective
Composant `<SetterDraftCard>` avec les 3 actions et feedback visuel immédiat.

## Avancement 2026-05-15
- ✅ Composant `app/dashboard/inbox/SetterDraftCard.tsx` ajouté.
- ✅ Affiche le draft dans une textarea éditable.
- ✅ Actions : envoyer via `POST /api/replies/[lead_id]/send`, escalader via `POST /api/replies/[lead_id]/escalate`.
- ✅ Bouton envoyer désactivé si draft vide, feedback succès/erreur.
- ⬜ Reste : confidence/reasoning, diff visuel avancé, confirmation modal escalade, disparition automatique de la card après escalade, raccourcis clavier.

## Avancement 2026-05-17
- ✅ Props `turn`, `leadId`, callbacks optionnels `onSend` / `onEscalate` supportés, compatibilité maintenue avec l'ancien couple `turnId` / `draft`.
- ✅ Intent, confidence et reasoning collapsible affichés quand disponibles.
- ✅ Diff visuel jaune entre draft original et version éditée.
- ✅ Enter envoie, Shift+Enter insère une nouvelle ligne, Escape annule l'édition.
- ✅ Escalade protégée par modal de confirmation ; card masquée après succès.
- ✅ États d'envoi : pending, `Envoyé ✓`, erreurs et bouton désactivé si draft vide.

## Requirements

### Must Have
- [x] Props : `{turn: Turn, leadId: string, onSend: () => void, onEscalate: () => void}`
- [x] Affiche : contenu draft + intent classifié + confidence + reasoning (collapsible)
- [x] Bouton **"Envoyer"** : POST `/api/replies/[lead_id]/send` → feedback succès/erreur
- [x] Édition inline via textarea — envoie `edited_content` à `/send`
- [x] Bouton **"Escalader"** : POST `/api/replies/[lead_id]/escalate`
- [x] Diff visuel entre draft original et version éditée (fond jaune sur modifications)
- [x] Keyboard : Enter pour envoyer, Escape pour annuler édition

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
- [x] Clic "Envoyer" → spinner → "Envoyé ✓" → card désactivée
- [x] Clic "Éditer" → textarea visible avec contenu pré-rempli
- [x] Diff visuel entre original et édition visible
- [x] Clic "Escalader" → modal confirmation → card disparaît
- [x] Draft vide → bouton "Envoyer" désactivé

## Dependencies
**Blocked By**: v4-013 (ConversationThread qui l'intègre), v4-011 (routes /send + /escalate)

## Complexity & Estimates
Medium · 3h · Risk: Low
