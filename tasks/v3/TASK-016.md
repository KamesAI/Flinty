# Task 016: Page Kanban + tab de navigation
**Status**: ✅ Complété

## Context
Construire la vue Kanban 6 colonnes sur la page campagne, accessible via un onglet.

**References**: PRD §3 F4 · ARCHI structure

## Objective
`/dashboard/campaigns/[id]/kanban` affiche les leads qualifiés répartis par `statut_email` en 6 colonnes.

## Requirements
### Must Have
- [ ] Page RSC qui fetch `/api/campaigns/[id]` → passe leads au Client Component `<Kanban>`
- [ ] 6 colonnes : Nouveaux (new) / Contactés (contacted, relance_1, relance_2) / Ouvert (opened) / Cliqué (clicked) / Répondu (replied) / Bounced (bounced, disqualified)
- [ ] Chaque carte affiche : nom, ville, score coloré, hook perso au hover (tooltip)
- [ ] Couleurs ARCHI respectées (border + text par colonne)
- [ ] Onglet "Kanban" ajouté sur `/dashboard/campaigns/[id]` à côté de "Leads"

### Must NOT
- [ ] Pas de drag & drop dans cette tâche (TASK-017)

## Technical Approach
```tsx
<Tabs>
  <TabLink href={`/dashboard/campaigns/${id}`}>Leads</TabLink>
  <TabLink href={`/dashboard/campaigns/${id}/kanban`}>Kanban</TabLink>
</Tabs>
```

## Acceptance Criteria
- [ ] Les 6 colonnes apparaissent vides ou remplies selon les data
- [ ] Navigation Leads ↔ Kanban OK
- [ ] Responsive (scroll horizontal sur mobile)

## Dependencies
**Blocked By**: Task 015

## Complexity & Estimates
Medium · 3h
