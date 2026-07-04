# TASK-v4-037 — Landing page publique + pages Signup/Login (UI)

**Statut** : 🚧 Partiel — 2026-07-04
**Owner** : 🤖
**Priority** : P1
**Phase** : 3 (préparation commercialisation SaaS)
**Deps** : —
**Est.** : 6h

## Contexte

Préparer la commercialisation de Flinty post-v4 : landing page marketing FR sur `/` (inspirée de mimikflow.com — structure haute-conversion — et de qualioflow.fr — hero avec mockup produit + fonctionnalités en quinconce), plus pages `/login` et `/signup` en **UI seule** (Supabase Auth = tâche ultérieure).

Plan approuvé : `~/.claude/plans/actuellement-flinty-v4-est-structured-tarjan.md`.

## Requirements

- [x] Route group `(marketing)` : landing sur `/` (le `redirect("/dashboard")` de `app/page.tsx` est supprimé ; le dashboard reste sur `/dashboard`)
- [x] Header sticky (ancres `#fonctionnalites` / `#tarifs` / `#faq`, Connexion, CTA Commencer, menu mobile Sheet)
- [x] Hero : tagline PRD, double CTA, mockup dashboard CSS, ligne de confiance
- [x] Section problème (3 douleurs)
- [x] 6 fonctionnalités en quinconce (01→06) avec mockups pur CSS (setter, inbox, scoring, séquences, booking, kanban)
- [x] Comment ça marche (4 étapes)
- [x] Résultats attendus (chiffres PRD, sans faux témoignages)
- [x] Pricing 3 plans placeholders (49/99/149 €) + toggle mensuel/annuel −20 % + badge Populaire
- [x] FAQ accordéon (7 questions — Radix accordion ajouté)
- [x] CTA final + footer (liens produit / légal placeholders)
- [x] Pages `/login` et `/signup` : validation zod champ par champ (messages FR), toast sonner « bientôt disponible » à la soumission valide
- [x] Fonts : Inter chargée via next/font (corps), M PLUS Rounded conservée (titres) ; metadata marketing racine + metadata « Dashboard » déplacée
- [x] TDD : `lib/pricing-model.ts`, `lib/auth-form-model.ts`, `lib/marketing-content.ts` (tests écrits avant le code)

## Acceptance Criteria

- [x] `npm run test` vert (537 tests, 92 fichiers)
- [x] `npm run build` vert (`/` statique, `/login`, `/signup` générées)
- [x] Vérif navigateur desktop : landing complète, ancres, toggle pricing (39/79/119 € en annuel), accordéon FAQ, toasts login/signup, `/dashboard` intact
- [ ] Vérif responsive mobile réelle (resize navigateur non appliqué par l'extension pendant la session — classes Tailwind mobile-first en place, à confirmer visuellement)
- [ ] Tarifs définitifs validés par Thomas (placeholders actuels)
- [ ] Pages légales réelles (liens footer en `#` placeholder)
- [ ] Branchement Supabase Auth (tâche ultérieure dédiée)

## Avancement

### 2026-07-04
- Livré : landing + auth UI complètes (détail fichiers dans Dev-Log).
- Fix visuel : badge « Populaire » rogné par `overflow-hidden` de `.card-premium` → `overflow-visible` sur la carte pricing.
- Reste : vérif mobile visuelle, tarifs définitifs, pages légales, Supabase Auth.
