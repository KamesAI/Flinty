# Task 012: UI `/dashboard/campaigns/new` — chat séquentiel 8 questions
**Status**: ✅ Done

## Context
Remplacer le formulaire v1 par un chat qui pose les 8 questions stratégiques une par une, dans un flux conversationnel.

**References**: PRD §3 F3

## Objective
La page `/dashboard/campaigns/new` présente un chat qui collecte 8 réponses et stocke l'état localement jusqu'à validation.

## Requirements
### Must Have
- [ ] 8 questions fixées (clés : secteur cible, pain points, taille entreprise cible, budget cible, zones géo, proposition de valeur, signaux d'achat, signaux d'exclusion)
- [ ] Display séquentiel : après submit d'une réponse, question suivante apparaît
- [ ] État local `useState<{ answers: string[]; currentIndex: number }>`
- [ ] Bubble style chat (user à droite, assistant à gauche) — design cohérent zinc/orange
- [ ] Bouton "Retour" pour revenir sur une réponse précédente
- [ ] Après Q8, bouton "Générer l'ICP" → POST `/api/campaigns/generate-icp`

### Must NOT
- [ ] Pas de persistance serveur intermédiaire (tout en state)
- [ ] Pas d'auto-complétion IA des réponses

## Technical Approach
Client Component (`'use client'`). Stocker questions dans un const local. Optionnel : `sessionStorage` pour survivre au refresh.

## Acceptance Criteria
- [ ] Les 8 questions s'enchaînent proprement
- [ ] Retour fonctionne sans perte de data
- [ ] Responsive desktop + iPad

## Dependencies
**Blocked By**: Task 011

## Complexity & Estimates
Medium · 3h
