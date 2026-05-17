# Task v4-002b : `lib/pacing.ts` — caps email daily/hourly + Gauss µ=8min σ=3min + ramp-up + human hours + `checkEmailHealth(domain)` + tests Vitest
**Status**: ✅ Done — 2026-05-14

## Autonomie
🤖 **Claude 100%** — code TypeScript + tests Vitest.

## Context
Le pacing email évite que le domaine `outreach.kamesai.com` soit blacklisté. Gauss delays entre envois + caps horaires + human hours + ramp-up domaine neuf + helper `checkEmailHealth()` qui interroge le tab `Email_Health` avant chaque envoi.

**Références** : PRD-v4 F15 · ARCHI-v4 §Pacing engine

## Objective
Module `lib/pacing.ts` avec pacing email complet et tests unitaires Vitest couvrant la distribution Gauss, les caps et le circuit breaker email.

## Requirements

### Must Have
- [x] `gaussRandom(mu: number, sigma: number): number` — Box-Muller transform
- [x] `nextEmailDelayMs(): number` — µ=480s (8min) σ=180s (3min), min 60s
- [x] `checkEmailDailyCap(domain: string, sentToday: number): boolean` — retourne false si cap atteint (20/j domaine neuf <2sem, 200/j domaine warm)
- [x] `checkEmailHourlyCap(domain: string, sentLastHour: number): boolean` — 50/h max
- [x] `isHumanHour(): boolean` — 9h–19h jours ouvrés uniquement (Europe/Paris TZ)
- [x] `checkEmailHealth(domain: string): Promise<{allowed: boolean, reason?: string}>` — lit tab `Email_Health` Index, retourne false si `status != 'active'`
- [x] Tests Vitest : distribution gaussRandom (mean ≈ µ, std ≈ σ sur 1000 samples), caps daily, caps hourly, human hours (mock Date), checkEmailHealth (mock sheets)

### Must NOT
- Ne pas lire GSheets dans les fonctions de calcul pur (séparation concerns)
- Ne pas hardcoder timezone — utiliser `Intl.DateTimeFormat` ou `date-fns-tz`

## Technical Approach

```typescript
// lib/pacing.ts (extrait)
export function gaussRandom(mu: number, sigma: number): number {
  // Box-Muller transform
  const u1 = Math.random(), u2 = Math.random()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mu + sigma * z0
}

export const EMAIL_CAPS = {
  DAILY_NEW: 20,   // domaine <2 sem
  DAILY_WARM: 200, // domaine >2 sem
  HOURLY: 50,
  DELAY_MU_SEC: 480,
  DELAY_SIGMA_SEC: 180,
} as const

export const EMAIL_HEALTH_THRESHOLDS = {
  BOUNCE_MAX_7D: 0.05,
  COMPLAINT_MAX_7D: 0.003,
} as const

export function nextEmailDelayMs(): number {
  const delay = gaussRandom(EMAIL_CAPS.DELAY_MU_SEC, EMAIL_CAPS.DELAY_SIGMA_SEC)
  return Math.max(60, delay) * 1000
}

export function isHumanHour(date = new Date()): boolean {
  const paris = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const hour = paris.getHours()
  const day = paris.getDay() // 0=Sun, 6=Sat
  return day >= 1 && day <= 5 && hour >= 9 && hour < 19
}
```

Tests :
```typescript
// lib/__tests__/pacing.email.test.ts
import { gaussRandom, isHumanHour, checkEmailDailyCap } from '../pacing'

test('gaussRandom distribution', () => {
  const samples = Array.from({ length: 1000 }, () => gaussRandom(480, 180))
  const mean = samples.reduce((a, b) => a + b) / samples.length
  expect(mean).toBeCloseTo(480, 0) // ± 20
})
```

## Acceptance Criteria
- [x] `npm run test` — tous les tests pacing email passent
- [x] Distribution gaussRandom : mean ≈ 480s ± 30s sur 1000 samples
- [x] `isHumanHour` retourne false pour samedi 15h et lundi 8h
- [x] `checkEmailDailyCap` retourne false si sentToday >= 20 (domaine neuf)
- [x] `checkEmailHealth` retourne `{allowed: false, reason: 'paused_high_bounce'}` si status=paused_high_bounce

## Dependencies
**Blocked By**: v4-002 (tab Email_Health doit exister pour checkEmailHealth)

## Complexity & Estimates
Medium · 3h · Risk: Low
