# Task v4-033 : Analytics avancé — funnel par canal, cohorts, attribution RDV, cost/meeting
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — extension WF6 + dashboard analytics.

## Context
v3 a une page analytics basique. v4 ajoute le multi-canal (email vs LI), les cohorts de templates, l'attribution des RDV (via quel canal et quel Setter intent), et le coût par RDV (tokens Anthropic + APIs Unipile/Calendly).

**Références** : PRD-v4 F13 · ARCHI-v4 §WF6 stats étendu

## Objective
Dashboard `/dashboard/data` étendu avec les KPIs v4 : funnel multi-canal, meetings attribution, cost/meeting.

## Requirements

### Must Have
- [ ] Nouveaux KPIs dans `/dashboard/data` :
  - `connection_rate_li` : invited / accepted (%)
  - `setter_response_rate` : replies handled by Setter / total replies (%)
  - `meeting_rate` : meetings booked / leads qualified (%)
  - `cost_per_meeting` : (tokens Anthropic × $0.003/1k + Unipile calls × cost) / meetings booked
- [ ] Funnel email : leads_sourced → leads_qualified → emails_sent → replies → meetings
- [ ] Funnel LI : profiles_sourced → invited → accepted → dm_sent → replied → meetings
- [ ] Attribution RDV : pie chart email vs linkedin
- [ ] Cohort par template : quel template email/LI génère le plus de replies et meetings

**WF6 étendu** :
- [ ] Loop tab Conversations (enfant) → calcule setter_response_rate, meeting_rate
- [ ] Loop tab Meetings → compte booked_via (setter/manual), channel (email/linkedin)
- [ ] Update Index Campagnes : 4 nouvelles colonnes (connection_rate_li, setter_response_rate, meeting_rate, cost_per_meeting)

### Must NOT
- Pas de calcul temps réel coûteux — WF6 tourne toutes les 6h (cron existant)
- Ne pas exposer les coûts exacts Unipile dans l'UI (confidentiel commercial)

## Technical Approach

```typescript
// Cost per meeting estimé :
const ANTHROPIC_COST_PER_1K_TOKENS = 0.003 // Sonnet 4.6
const UNIPILE_COST_PER_MONTH = 59 // $59/mois → /nombre_actions
const AVG_TOKENS_PER_SETTER_CALL = 800 // classify + generate

const cost = (totalSetterCalls * AVG_TOKENS_PER_SETTER_CALL / 1000 * ANTHROPIC_COST_PER_1K_TOKENS)
const costPerMeeting = totalMeetings > 0 ? cost / totalMeetings : 0
```

## Acceptance Criteria
- [ ] `/dashboard/data` affiche les 4 nouveaux KPIs
- [ ] Funnel email + LI visible (barres ou chiffres)
- [ ] Attribution RDV : email vs LI répartition
- [ ] WF6 étendu s'exécute sans erreur (test manuel)

## Dependencies
**Blocked By**: v4-002 (schéma Conversations + Meetings), v4-028 (Phase 2 stable)

## Complexity & Estimates
Medium · 5h · Risk: Low
