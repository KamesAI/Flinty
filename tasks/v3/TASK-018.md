# Task 018: Contacts_Registry + WF1 filtre doublons domaine
**Status**: ✅ Complété

## Context
À 5+ campagnes actives, le risque de reprospecter le même domaine explose. Registre centralisé dans l'Index + filtre dans WF1.

**References**: PRD §3 F5 · ARCHI §BLOC 4

## Objective
WF1 filtre les leads dont le domaine est déjà dans `Contacts_Registry` avant écriture dans `Leads_Raw`.

## Requirements
### Must Have
- [ ] Onglet `Contacts_Registry` présent dans le maître (TASK-001)
- [ ] Code node dans WF1 après scraping Maps : normalise `site` → `new URL(site).hostname.replace(/^www\./, '').toLowerCase()`
- [ ] Node Sheets : lit `Contacts_Registry!A:A` → set de domaines connus
- [ ] Filter node : garde uniquement leads avec domaine non présent
- [ ] Log le nombre de leads filtrés

### Must NOT
- [ ] Pas d'écriture au registre ici (c'est TASK-019 dans WF3)

## Technical Approach
```js
// Code node dedup
const known = new Set($('Read Registry').all().map(r => r.json.domain));
return items.filter(it => {
  try { const d = new URL(it.json.site).hostname.replace(/^www\./, '').toLowerCase();
        return !known.has(d); }
  catch { return false; } // skip URLs invalides
});
```

## Acceptance Criteria
- [ ] Lancer WF1 2x avec même secteur → 2e run écrit 0 leads Raw
- [ ] URLs invalides skip sans crash

## Dependencies
**Blocked By**: Task 003

## Complexity & Estimates
Medium · 2h
