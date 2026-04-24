# Task 010: UI fiche lead enrichie
**Status**: ✅ Complété

## Context
Les 7 nouveaux champs (hook, buying_signal, growth, web_quality...) doivent être exposés dans l'UI pour être actionnables.

**References**: PRD §3 F2 · ARCHI `leads/[lead_id]/page.tsx`

## Objective
La page `/dashboard/campaigns/[campaign_id]/leads/[lead_id]` affiche tous les nouveaux champs avec bouton copier pour `personalized_hook`.

## Requirements
### Must Have
- [ ] Composant `LeadHeader` : nom, site (lien), ville, score (badge coloré selon seuil)
- [ ] Section "Hook perso" : bloc copiable + bouton Copy (navigator.clipboard)
- [ ] Section "Signaux d'achat" : `buying_signal` + `hiring_signals` + `growth_stage` en badges
- [ ] Section "Qualité web" : `web_quality_score` + liste `web_quality_signals`
- [ ] Section "Raison du score" : `score_reason` (text)
- [ ] Design cohérent (zinc-950 card, orange accent #FFA318)
- [ ] Mobile-friendly

### Must NOT
- [ ] Pas de mutation depuis cette page (lecture seule v3.1)

## Technical Approach
Page RSC qui appelle `/api/campaigns/[id]` côté serveur, filtre `leads_qualified.find(l => l.lead_id === lead_id)`. Bouton Copy → Client Component local.

## Acceptance Criteria
- [ ] 404 si lead inconnu
- [ ] Copie hook fonctionne (toast confirmation)
- [ ] Badge growth (`seed | series_a | scale`) coloré distinctement

## Dependencies
**Blocked By**: Tasks 005, 007

## Complexity & Estimates
Medium · 3h
