# Task 017: Drag & drop Kanban + optimistic UI
**Status**: ✅ Complété

## Context
Rendre les cartes draggables entre colonnes avec persistance serveur immédiate et UI optimiste.

**References**: PRD §3 F4

## Objective
Le drag d'une carte déplace instantanément, puis PATCH l'API ; en cas d'erreur, rollback UI + toast.

## Requirements
### Must Have
- [ ] `<DndContext>` avec `<SortableContext>` par colonne
- [ ] `onDragEnd` : met à jour le state local immédiatement (optimiste)
- [ ] Fire-and-remember : `fetch('/api/leads/{id}/status', { method: 'PATCH', body: { sheet_id, campaign_id, statut_email } })`
- [ ] Si PATCH échoue → rollback state + `<Toast error>`
- [ ] Bloquer le drag vers les colonnes dérivées uniquement depuis Resend (`opened/clicked/replied/bounced`) ? → Décision : **autoriser** (PRD F4 : Thomas force manuellement si info externe)
- [ ] Mapping colonne → statut_email clair (Contactés = `contacted`)

### Must NOT
- [ ] Pas de bulk-drag multi-cartes

## Technical Approach
```tsx
const [cards, setCards] = useState(initialCards);
async function onDragEnd({ active, over }) {
  const prev = cards; setCards(moved); // optimistic
  const res = await fetch(...);
  if (!res.ok) { setCards(prev); toast.error('Échec de la mise à jour'); }
}
```

## Acceptance Criteria
- [ ] Drag visible <50ms (optimistic)
- [ ] PATCH effective dans Sheets (vérif manuelle)
- [ ] Rollback + toast si 500

## Dependencies
**Blocked By**: Task 016

## Complexity & Estimates
Medium-High · 2.5h
