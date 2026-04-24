# Task 008: WF2 — Code node Web Quality Score post-Firecrawl
**Status**: ✅ Complété

## Context
Un score de qualité web déterministe (technos, récence, présence SEO) complète le scoring IA et évite les faux positifs sur sites fantômes.

**References**: PRD §3 F2

## Objective
Après Firecrawl, un Code node produit `web_quality_score` (0–100) et `web_quality_signals[]` ajoutés au payload.

## Requirements
### Must Have
- [ ] Code node JS après le node Firecrawl
- [ ] Heuristiques : présence `<title>`, `description`, HTTPS, réseaux sociaux détectés, année copyright récente, taille HTML >2kb
- [ ] Score = somme pondérée bornée 0–100
- [ ] `web_quality_signals` = array de labels (`"https", "meta_ok", "copyright_2024", ...`)
- [ ] Skip gracieux si Firecrawl a échoué → score 0, signals `["firecrawl_failed"]`

### Must NOT
- [ ] Pas de requête réseau externe dans ce node

## Technical Approach
```js
const html = $json.firecrawl?.html || '';
let score = 0; const signals = [];
if (html.includes('<meta name="description"')) { score += 15; signals.push('meta_ok'); }
if ($json.url?.startsWith('https://')) { score += 10; signals.push('https'); }
if (/©\s*20(2[2-9]|3\d)/.test(html)) { score += 20; signals.push('recent_copyright'); }
// ...
return { ...$json, web_quality_score: Math.min(score, 100), web_quality_signals: signals };
```

## Acceptance Criteria
- [ ] 5 sites tests → scores cohérents (site mort=0, SaaS récent>70)
- [ ] Pas d'exception si html vide

## Dependencies
**Blocked By**: Task 007

## Complexity & Estimates
Low · 1.5h
