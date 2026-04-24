# Task 013: Preview Markdown éditable + POST campagne avec icp_md
**Status**: ✅ Complété

## Context
Thomas doit pouvoir éditer l'ICP généré avant lancement. Puis déclencher la campagne avec le Markdown final.

**References**: PRD §3 F3

## Objective
Après `generate-icp`, l'UI affiche le Markdown en preview éditable (textarea + render) puis POST `/api/campaigns` avec `icp_md` inclus.

## Requirements
### Must Have
- [ ] Split view : textarea à gauche, render Markdown à droite (lib `react-markdown`)
- [ ] Autosize textarea (ou rows=30)
- [ ] Bouton "Lancer la campagne" → POST `/api/campaigns`
- [ ] Formulaire léger au-dessus : nom campagne, secteur, localisation, offre_kames (déduits par défaut des answers)
- [ ] Après 202 → redirect `/dashboard` avec toast succès
- [ ] Loading state pendant le POST

### Must NOT
- [ ] Pas d'éditeur WYSIWYG lourd (textarea suffit)

## Technical Approach
Payload POST :
```ts
{ nom, secteur, localisation, offre_kames, icp_md, villes, taille_equipe, poste_cible, template_email, score_minimum: 60 }
```

## Acceptance Criteria
- [ ] Édition du textarea met à jour le render en live
- [ ] POST campagne envoie `icp_md` non vide
- [ ] Redirection dashboard après succès

## Dependencies
**Blocked By**: Tasks 011, 012

## Complexity & Estimates
Medium · 2h
