# Task v4-032 : Pacing fin avancé — alertes santé granulaires + dashboards LI_Health historiques
**Status**: 🚧 Partiel — 2026-07-04

## Autonomie
🤖 **Claude 100%** — UI dashboard + n8n ajustements.

## Context
v4-024 + v4-024b implémentent le pacing et le circuit breaker. v4-032 améliore la visibilité sur le pacing : graphiques historiques du compte LI (accept_rate sur 30j, invits/jour), alertes granulaires (pas seulement pause complète — warning si accept_rate entre 20%-35%).

**Références** : ARCHI-v4 §Milestones M3 · PRD-v4 F12

## Objective
Page `/dashboard/settings/linkedin/health` avec historique LI_Health sur 30j + alertes intermédiaires.

## Requirements

### Must Have
- [x] Page `app/dashboard/settings/linkedin/health/page.tsx` — accessible depuis la page connect LI
- [x] Graphique accept_rate_7d sur 30 derniers points (WF12 enregistre l'historique dans LI_Health avec timestamp)
- [x] Graphique invits_sent par jour (bar chart)
- [x] Alertes intermédiaires (warning non-bloquant) : accept_rate entre 20%-35% → bandeau orange (pas rouge)
- [x] ETA reprise si paused : calculé automatiquement selon TTL par status
- [x] WF12 : conserver l'historique (append plutôt qu'update une seule row) → tab `LI_Health_History` dans Index (API prête ; données live restantes)

### Must NOT
- Pas de bibliothèque charting externe lourde (Chart.js, Recharts) — SVG simple ou CSS bars
- Ne pas perdre l'historique en cas de reprise (LI_Health_History persist même après status=active)

## Technical Approach

```tsx
// Graphique simple en CSS/SVG (pas de dépendance)
function AcceptRateChart({ data }: { data: { date: string; rate: number }[] }) {
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div
            className={`w-full rounded-t ${d.rate > 0.35 ? 'bg-green-500' : d.rate > 0.20 ? 'bg-yellow-400' : 'bg-red-500'}`}
            style={{ height: `${d.rate * 200}px` }}
          />
        </div>
      ))}
    </div>
  )
}
```

Tab `LI_Health_History` dans Index : append chaque run WF12 avec timestamp + métriques complètes.

## Acceptance Criteria
- [x] Page `/dashboard/settings/linkedin/health` accessible
- [x] Graphique accept_rate sur ≥7 points historiques
- [x] Bandeau orange si accept_rate 20%-35% (warning non-bloquant)
- [ ] LI_Health_History tab : données cumulatives sur 30j

## Avancement

### 2026-05-20 — Page santé LinkedIn livrée côté UI
- Ajout `/dashboard/settings/linkedin/health` avec lien depuis la page connect LinkedIn.
- Graphiques CSS sans dépendance externe : accept_rate 7j et invitations 7j sur 30 points.
- Warning orange non bloquant pour accept_rate 20–35%, ETA de reprise pour statuts `paused_*`.
- `lib/sheets.ts` prépare `LI_Health_History` + parser/reader 30 derniers points.
- Fallback local sur 7 points à partir du dernier `LI_Health` tant que WF12 n'a pas encore append l'historique.

**Reste avant ✅** :
- WF12 réel doit append chaque run dans `LI_Health_History` pour disposer de données cumulatives staging/prod.

### 2026-07-04 — Append historique prêt côté API/WF12
- Ajout `POST /api/li-health` : upsert `LI_Health` et append `LI_Health_History` à chaque appel persistant.
- Extension des headers/parsers `LI_Health` et `LI_Health_History` avec `invites_sent_today`, `invites_sent_week`, `organic_action`.
- WF12 dry-run prépare `health_payload` complet avec `acceptance_rate_7d`, `invites_sent_7d`, `invites_accepted_7d`, compteurs jour/semaine.

**Reste avant ✅** :
- Exécuter WF12 en mode persistant avec app staging et vérifier des lignes cumulatives réelles dans `LI_Health_History`.

## Dependencies
**Blocked By**: v4-024b (WF12 source de données), v4-024c (LIHealthBanner pour cohérence UX)

## Complexity & Estimates
Low · 2h · Risk: Low
