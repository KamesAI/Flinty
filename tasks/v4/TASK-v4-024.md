# Task v4-024 : `lib/pacing.ts` — Gauss LI + caps daily/weekly 100 + ramp-up 4 sem + human hours + typing speed + note ratio
**Status**: ✅ 2026-05-19

## Autonomie
🤖 **Claude 100%** — code TypeScript + tests Vitest (TDD).

## Context
Le pacing LinkedIn est critique pour éviter le ban du compte Thomas. HARD CAP LinkedIn : 100 invitations/semaine tous comptes confondus. Ce module étend lib/pacing.ts (v4-002b qui couvre email) avec toutes les règles LI.

**Références** : PRD-v4 F12 · ARCHI-v4 §Pacing engine

## Objective
`lib/pacing.ts` complété avec pacing LinkedIn complet et tests unitaires Vitest.

## Requirements

### Must Have
- [x] Constantes LI :
  ```typescript
  const CAPS_LI_WEEKLY = { invitations: 100 } // HARD CAP LinkedIn
  const CAPS_LI_DAILY_WARM = { invitations: 20, dms: 50, views: 200, removals: 50 }
  const CAPS_LI_DAILY_NEW = { invitations: 5, dms: 20, views: 50, removals: 10 }
  const RAMP_UP_LI = { week_1: 5, week_2: 10, week_3: 15, week_4: 20 } // invits/j
  const NOTE_RATIO = { with_note: 0.6, without_note: 0.4 }
  ```
- [x] `nextLIDelayMs(action: 'invitation'|'dm'|'reply'): number` — Gauss µ=360s/240s/60s σ=40%
- [x] `checkLIDailyCap(action, sentToday, accountAge): boolean`
- [x] `checkLIWeeklyCap(invitsSentThisWeek): boolean` — retourne false si ≥100
- [x] `getRampUpLimit(accountCreatedAt: Date, action: 'invitation'): number` — invits/j selon semaine compte
- [x] `shouldAddNote(invitsSentToday: number): boolean` — alterne 60/40 selon ratio
- [x] `typingDurationMs(text: string): number` — 35±10 wpm Gauss, min 2000ms
- [x] Tests Vitest : weekly cap (99→ok, 100→block), ramp-up semaine 1/2/3/4, shouldAddNote distribution, typing duration (≥2000ms), human hours LI (même fonction v4-002b)

### Must NOT
- Ne pas permettre d'overrider le cap weekly 100 — hardcodé, non configurable
- Pacing calculé en mémoire — ne pas écrire dans GSheets depuis lib/pacing.ts

## Technical Approach

```typescript
// lib/pacing.ts — ajout LI (section séparée)
export const LI_CAPS = {
  WEEKLY_HARD: 100,
  DAILY_WARM: { invitations: 20, dms: 50, views: 200, removals: 50 },
  DAILY_NEW: { invitations: 5, dms: 20, views: 50, removals: 10 },
} as const

export function checkLIWeeklyCap(invitsSentThisWeek: number): boolean {
  return invitsSentThisWeek < LI_CAPS.WEEKLY_HARD
}

export function getRampUpLimit(accountCreatedAt: Date): number {
  const weeksSince = Math.floor((Date.now() - accountCreatedAt.getTime()) / (7 * 86400000))
  const RAMP = [5, 10, 15, 20]
  return weeksSince < 4 ? RAMP[weeksSince] : 20
}

export function shouldAddNote(invitsSentToday: number): boolean {
  // 60% avec note, 40% sans — alterne selon index
  return (invitsSentToday % 10) < 6
}
```

## Acceptance Criteria
- [x] `npm run test` — tous les tests pacing LI passent (75/75 ✅ 2026-05-19)
- [x] `checkLIWeeklyCap(100)` retourne false
- [x] `getRampUpLimit(dateNow-6j)` retourne 5 (semaine 1)
- [x] `shouldAddNote` sur 10 appels → 6 true, 4 false
- [x] `typingDurationMs("Bonjour Thomas")` ≥ 2000ms

## Dependencies
**Blocked By**: v4-020 (lib/unipile.ts pour contexte), v4-002b (gaussRandom déjà défini)

## Complexity & Estimates
High · 5h · Risk: Low (calcul pur — le ban est évité par checkLIWeeklyCap)
