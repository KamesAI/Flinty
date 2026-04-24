# Task 020: Export multi-format — API + boutons UI
**Status**: ✅ Complété

## Context
Thomas veut pousser ses leads dans Instantly en 1 clic, avec `personalized_hook` déjà mappé.

**References**: PRD §3 F6 · ARCHI §F6

## Objective
`GET /api/campaigns/[id]/export?format=csv|json|instantly` + 3 boutons sur la page campagne.

## Requirements
### Must Have
- [x] Route `app/api/campaigns/[id]/export/route.ts` : query param `format`
- [x] `format=csv` → 16 colonnes PRD v3 (dont score_reason, buying_signal, personalized_hook, hiring_signals, growth_stage, web_quality_score)
- [x] `format=json` → tableau d’objets `QualifiedLead` (`JSON.stringify`, 2 espaces)
- [x] `format=instantly` → `Email, First Name, Last Name, Company Name, Personalization` (Personalization = personalized_hook)
- [x] CSV : escape RFC 4180 (`""`), pas de lib externe
- [x] Instantly : ignore les leads sans email (trim)
- [x] Headers `Content-Type` + `Content-Disposition: attachment; filename="flinty-{id}-…"`
- [x] 3 liens sur `/dashboard/campaigns/[campaign_id]` → `/api/campaigns/{id}/export?format=…` (équivalent navigation téléchargement)

### Must NOT
- [x] Pas de lib CSV externe (générer à la main, trivial)

## Technical Approach
```ts
function csvEscape(v: string) { return `"${String(v ?? '').replace(/"/g, '""')}"`; }
const rows = leads.map(l => [l.email, l.prenom, '', nomCompany, l.personalized_hook].map(csvEscape).join(','));
```

## Acceptance Criteria
- [x] CSV + BOM UTF-8 (tests unitaires + octets EF BB BF sur la route)
- [x] JSON parse sans erreur (test route)
- [ ] CSV Instantly sans warning — à valider dans l’UI Instantly avec un export réel

## Dependencies
**Blocked By**: Task 005

## Complexity & Estimates
Low-Medium · 2.5h
