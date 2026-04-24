# Task 009: WF2 — IF branche Qualified/Rejected + append Leads_Rejected
**Status**: ✅ Complété

## Context
Atteindre 100 % de taux de documentation des rejets : chaque lead scoré atterrit dans Qualified OU Rejected, jamais perdu.

**References**: PRD §3 F2

## Objective
Branche IF sur `score >= score_minimum` ; append vers `Leads_Qualified` (21 colonnes) ou `Leads_Rejected` (avec `rejection_reason` + `processed_at`).

## Requirements
### Must Have
- [ ] Node IF : condition `$json.score >= $json.score_minimum`
- [ ] Branche TRUE → append `Leads_Qualified` (enfant) avec 21 colonnes (ARCHI)
- [ ] Branche FALSE → append `Leads_Rejected` (enfant) : lead_id, campaign_id, nom, site, score, rejection_reason, processed_at (ISO)
- [ ] TRUE → déclenche WF3 webhook (inchangé)
- [ ] Headers `Leads_Rejected` créés par WF1 (TASK-003)

### Must NOT
- [ ] Pas de double écriture (un lead = une seule branche)

## Technical Approach
`statut_email` initial = `new`. `rejection_reason` vient du JSON Claude (clé obligatoire même si score passant → null).

## Acceptance Criteria
- [ ] Test 20 leads → somme(Qualified) + somme(Rejected) = 20
- [ ] Chaque ligne Rejected a un `rejection_reason` non vide

## Dependencies
**Blocked By**: Task 007

## Complexity & Estimates
Medium · 2h
