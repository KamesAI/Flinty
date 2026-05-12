# Task v4-009b : WF7/WF8 — appel `checkEmailHealth(domain)` avant chaque send + respect délai Gauss + cap hourly
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — ajout nodes dans WF7 et WF8 n8n + route API health check.

## Context
Avant d'envoyer tout email via WF8 (réponse Setter validée), et avant de planifier un envoi, vérifier que le domaine `outreach.kamesai.com` n'est pas en pause et que les caps hourly ne sont pas dépassés. Intégrer aussi les délais Gauss (µ=8min) pour éviter les patterns suspects.

**Références** : PRD-v4 F15 · ARCHI-v4 §Pacing engine email

## Objective
WF8 vérifie `checkEmailHealth` avant tout envoi. Délais Gauss respectés entre sends.

## Requirements

### Must Have
- [ ] Route `GET /api/email-health?domain=outreach.kamesai.com` — lit Email_Health tab → retourne `{allowed, reason?, sent_today, sent_last_hour}`
- [ ] WF7 (avant classify) : appel `GET /api/email-health` — si `allowed=false` → STOP + log reason
- [ ] WF8 (avant Resend send) : appel `GET /api/email-health` — si `allowed=false` → STOP + alerte Thomas
- [ ] WF8 : `Wait` node Gauss delay (calcul µ=480s σ=180s en JS Code node) avant envoi si cap hourly non atteint
- [ ] Test n8n : simuler `Email_Health.status=paused_high_bounce` → WF8 s'arrête sans envoyer

### Must NOT
- Ne pas ignorer le health check en cas d'urgence — la pause est automatique et non contournable
- Ne pas implémenter de délai Gauss côté client ou en dehors de n8n

## Technical Approach

```javascript
// Code node n8n : calcul délai Gauss
function gaussRandom(mu, sigma) {
  const u1 = Math.random(), u2 = Math.random()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return Math.max(60, mu + sigma * z0)
}
const delaySeconds = gaussRandom(480, 180) // 8min ± 3min
// → utiliser dans Wait node de WF8
```

## Acceptance Criteria
- [ ] Route `/api/email-health` retourne `{allowed: false, reason: 'paused_high_bounce'}` si status paused
- [ ] WF8 s'arrête proprement si health check retourne `allowed=false`
- [ ] Délai Gauss entre 60s et ~840s (3 sigma) observé dans logs WF8

## Dependencies
**Blocked By**: v4-002b (lib/pacing.ts + tab Email_Health), v4-009 (WF7 base)

## Complexity & Estimates
Low · 1h · Risk: Low
