# TASK-v4-038 — Refonte thème (Poppins + vert émeraude) + sections landing façon Mimikflow

**Statut** : 🚧 Partiel — 2026-07-04
**Owner** : 🤖
**Priority** : P1
**Phase** : 3 (préparation commercialisation SaaS)
**Deps** : v4-037
**Est.** : 4h

## Contexte

Suite de v4-037. Demandes Thomas : (1) police de morningside.ai → **Poppins** (corps + titres ; PP Supply Sans écartée car licence commerciale payante), (2) remplacement du bleu par une **palette émeraude en dégradé** — primaire `#059669`, clair `#34d399`, profond `#064e3b` (photo satin fournie ; itérations : teal Mimikflow `#14b8a6` → émeraude profond `#124e35` → palette claire avec dégradé sur retours Thomas), (3) landing plus proche de Mimikflow : section chiffres (cartes % + funnel en barres), tableau comparatif concurrents, section « Réserver une démo ».

Décisions validées (AskUserQuestion) : thème sur **tout le site** (dashboard inclus) ; stats présentées comme **objectifs produit labellisés honnêtement** (pas de fausses métriques clients) ; comparatif **vs concurrents nommés** (Lemlist, Waalaxy, La Growth Machine) ; démo en **placeholder** (calendrier CSS, lien réel plus tard).

## Requirements

- [x] Poppins via next/font (`--font-poppins`), corps + titres (`font-flinty` = Poppins 600) ; M PLUS Rounded + Inter supprimées
- [x] Tokens émeraude : `--primary: 161 94% 30%` (#059669), glow #34d399, `--gradient-primary` profond→vif→clair, shadow-glow, sidebar, ring, accent
- [x] 59 occurrences `#006596` + `#00A8E8` en dur du dashboard remplacées (#059669 / #34d399), tests inclus
- [x] TDD `lib/marketing-content.ts` : RESULT_STATS enrichies (sublabel + progress), FUNNEL_STEPS décroissant + FUNNEL_NOTE « projection », COMPARISON_* (3 concurrents, 6 lignes, disclaimer), BOOK_DEMO
- [x] ResultsSection refondue : badge pill, 4 cartes stats (gros chiffre vert + barre de progression), funnel en barres décroissantes + footer 12+ RDV/mois + note d'honnêteté, fond dot-grid
- [x] ComparisonSection : tableau ✓ / Partiel / ✗, colonne Flinty surlignée, notes par cellule, disclaimer daté
- [x] BookDemoSection : mockup calendrier CSS placeholder + CTA (vers /signup en attendant le vrai lien)
- [x] `SectionBadge` (pill uppercase à point vert, façon Mimikflow) + utilitaire `.bg-dot-grid`
- [x] Ordre page : … → Results → Comparison → Pricing → FAQ → BookDemo → FinalCta

## Acceptance Criteria

- [x] `npm run test` vert (541 tests, 92 fichiers — 4 nouveaux tests contenu)
- [x] `npm run build` vert
- [x] Vérif navigateur desktop : hero Poppins/émeraude, stats + funnel, comparatif, pricing, démo, dashboard intact (thème vert appliqué)
- [ ] **Cellules du comparatif concurrents validées par Thomas avant mise en ligne** (affirmations publiques sur Lemlist/Waalaxy/LGM)
- [ ] Logo `logo-flinty-cropped.png` refait dans la nouvelle couleur (PNG encore ancien)
- [ ] Lien démo réel (Calendly/Cal.com) branché à la place du placeholder
- [ ] Vérif responsive mobile réelle

## Avancement

### 2026-07-04
- Livré : thème complet + 3 nouvelles sections, vérifié tests/build/navigateur (541 tests, build vert, screenshots desktop).
- Itérations couleur sur retours Thomas : teal #14b8a6 → émeraude profond #124e35 → palette dégradé émeraude #064e3b/#059669/#34d399 (revérifiée navigateur : hero, funnel, comparatif, dashboard).
- Reste : validation comparatif par Thomas, logo, lien démo, vérif mobile.
