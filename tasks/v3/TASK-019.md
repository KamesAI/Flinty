# Task 019: WF3 append Contacts_Registry après envoi J0
**Status**: ✅ Complété

## Context
Complément à TASK-018 : alimenter le registre au moment de l'envoi pour que les campagnes suivantes puissent filtrer.

**References**: PRD §3 F5

## Objective
Après chaque envoi Resend J0 réussi, WF3 append domain + timestamp dans le maître.

## Requirements
### Must Have
- [ ] Node Sheets après node Resend succès
- [ ] Append dans `Flinty Index.Contacts_Registry` : `domain | new Date().toISOString() | campaign_id | 'contacted'`
- [ ] Domaine normalisé avant append (même fonction que TASK-018)
- [ ] Pas d'append si Resend retourne erreur

### Must NOT
- [ ] Pas de dédup pré-append (on tolère doublons — le filtre lit tout)

## Technical Approach
Node Google Sheets "Append" avec ID `GOOGLE_INDEX_SHEET_ID` et range `Contacts_Registry!A:D`.

## Acceptance Criteria
- [ ] Envoyer 1 email test → 1 ligne ajoutée dans registre
- [ ] Email bounced → pas d'ajout (ou ajout avec statut `bounced` - décision produit à trancher, v1 : on append quand même)

## Dependencies
**Blocked By**: Task 018

## Complexity & Estimates
Low · 1h
