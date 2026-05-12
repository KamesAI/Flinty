# Task v4-035 : Monitoring tokens Anthropic/Unipile/Calendly + alertes seuils
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — code TypeScript + n8n cron + UI.

## Context
Le coût mensuel Flinty dépend principalement des tokens Anthropic (Setter classify + generate) et de l'abonnement Unipile. Sans monitoring, une campagne mal configurée peut exploser le budget. Cette task ajoute des compteurs et des alertes seuil.

**Références** : PRD-v4 §Open Questions coût monitoring · ARCHI-v4 §Performance Optimization

## Objective
Monitoring coûts actifs avec compteurs tokens par campagne + alertes si seuil dépassé.

## Requirements

### Must Have
- [ ] Compteur tokens dans chaque appel Setter : extraire `usage.input_tokens + usage.output_tokens` depuis la réponse Anthropic SDK
- [ ] Tab `Cost_Tracking` dans Index : `date | campaign_id | anthropic_tokens | anthropic_cost_usd | unipile_actions | calendly_calls`
- [ ] WF cron quotidien (WF14 ou extension WF6) : aggregate tokens par campagne → update Cost_Tracking
- [ ] Route `GET /api/monitoring/costs?workspace_id=...` → retourne coûts actuels + projection mensuelle
- [ ] Alertes : si `cost_per_meeting > $15` sur les 7 derniers meetings → email Thomas + alerte UI
- [ ] UI `/dashboard/data` : section "Coûts" avec total tokens mois + cost/meeting courant + projection
- [ ] Seuil configurable dans Config global (Index) : `alert_cost_per_meeting_threshold=15`

### Must NOT
- Ne pas tracker les tokens Unipile au niveau API call (trop granulaire) — utiliser estimation forfaitaire $59/mois ÷ actions
- Pas de monitoring temps réel — agrégation quotidienne suffisante

## Technical Approach

```typescript
// Dans lib/setter.ts, après chaque appel Claude :
const usage = response.usage
const cost = (usage.input_tokens * 0.003 + usage.output_tokens * 0.015) / 1000
// Append dans Cost_Tracking (ou buffer + flush quotidien)

// Estimation coût Anthropic :
// Sonnet 4.6 input : $3/1M tokens → $0.003/1k
// Sonnet 4.6 output : $15/1M tokens → $0.015/1k
// Opus 4.6 fallback : $15/1M input, $75/1M output
```

Cron quotidien WF (extension WF6) :
1. Lit tous les Cost_Tracking du mois
2. Calcule cost_per_meeting = total_cost / meetings_booked_mois
3. Si > seuil → Resend alerte Thomas

## Acceptance Criteria
- [ ] Tab Cost_Tracking dans Index créé avec headers
- [ ] Après run Setter → tokens loggués dans Cost_Tracking (ou buffer)
- [ ] Route `/api/monitoring/costs` retourne projection mensuelle
- [ ] Si cost/meeting > $15 simulé → email alerte Thomas reçu
- [ ] Section "Coûts" visible dans `/dashboard/data`

## Dependencies
**Blocked By**: v4-005 (Setter generate — source des tokens), v4-020 (Unipile pour compter les actions)

## Complexity & Estimates
Low · 2h · Risk: Low
