# Flinty — Dashboard de qualification leads

> Produit SaaS interne — Thomas Callendreau (Kames AI)  
> Cold email prospection : Next.js 15 + Google Sheets + n8n + Codex Sonnet 4.5  
> Dernière mise à jour : 2026-05-04

---

## Mémoire projet (hub)

Les instructions détaillées sont découpées pour limiter la **context rot** :

| Fichier | Quand ça charge |
|---------|-----------------|
| [`.Codex/rules/flinty-core.md`](.Codex/rules/flinty-core.md) | Toujours (skills, interdits, Thomas, env, couleur) |
| [`.Codex/rules/flinty-dashboard.md`](.Codex/rules/flinty-dashboard.md) | Fichiers sous `02-Implementation/interface/lead-qualifier-dashboard/**/*.ts(x)` |
| [`.Codex/rules/flinty-tasks.md`](.Codex/rules/flinty-tasks.md) | `tasks/v3/**`, `02-Implementation/Dev-Log.md` |

**Skills exécutables** : répertoire [`skills/`](skills/) (préfixe `local-*` côté Codex si plugin).  
**Marketing / contexte Kames** : hub [`skills/flinty-product-marketing-context/SKILL.md`](skills/flinty-product-marketing-context/SKILL.md) ; vendor [Corey Haines marketingskills](https://github.com/coreyhaines31/marketingskills) en sous-module [`external/marketingskills`](external/marketingskills) — index [skills/vendor/marketingskills-INDEX.md](skills/vendor/marketingskills-INDEX.md), stratégie [skills/vendor/README.md](skills/vendor/README.md).  
**Blocs prompts WF2 / ICP** : [`01-Architecture/marketingskills-prompt-blocks.md`](01-Architecture/marketingskills-prompt-blocks.md).  
**Automatisation Codex** : [`.Codex/commands/`](.Codex/commands/) (slash commands), [`.Codex/hooks/`](.Codex/hooks/), [`.Codex/settings.json`](.Codex/settings.json).

---

## Stack (résumé)

| Composant | Valeur |
|-----------|--------|
| **Frontend** | Next.js 15.1.7, App Router, TypeScript, Tailwind (light custom — **pas shadcn** ; `@radix-ui/*` ok) |
| **Tests** | Vitest — TDD obligatoire pour `lib/*.ts` et `app/**/*.ts` du dashboard |
| **Données** | googleapis — 1 Index + N GSheets enfants ; isolation stricte |
| **IA** | Codex Sonnet 4.5 via **OpenRouter** |
| **Automation** | n8n — `staging-n8n.kamesai.com` / `agent.kamesai.com` |
| **Emails** | Resend |
| **Déploiement** | Vercel (GitHub `main`) |

Variables d’environnement : voir **flinty-core** (noms des clés) et `.env.local` (ne jamais committer).

---

## Découverte & architecture produit

- [`00-Discovery/PRD.md`](00-Discovery/PRD.md) — PRD  
- [`00-Discovery/ARCHI.md`](00-Discovery/ARCHI.md) — architecture v3  
- [`01-Architecture/`](01-Architecture/) — plans dashboard / lead gen  

---

## Arborescence utile

```
Flinty/
├── AGENTS.md                    ← ce hub
├── .Codex/
│   ├── rules/                   ← règles modulaires (lazy load)
│   ├── commands/                ← slash commands Kames
│   ├── hooks/                   ← scripts hooks Codex
│   └── settings.json            ← hooks versionnés (+ settings.local.json local)
├── .cursor/rules/flinty.mdc     ← Cursor (miroir partiel)
├── 02-Implementation/interface/lead-qualifier-dashboard/  ← code Next.js
├── tasks/v3/                    ← TASKS.md, TASK-XXX.md, lessons.md
├── skills/                      ← skills métier + ingénierie
└── external/marketingskills/    ← sous-module (Corey Haines — skills marketing)
```

**Code principal** : `02-Implementation/interface/lead-qualifier-dashboard/`  
`npm run dev` | `npm run test` | `npm run build` depuis ce dossier.

---

## Statut v3 (2026-04-25)

Les 22 TASK-001→022 sont ✅ en staging.

Avant prod : variables Vercel prod + smoke campagne ; bascule n8n staging → prod ; cible lancement **mai 2026**.

---

## Dépannage rapide

Campagne bloquée **`generating`** : voir **flinty-dashboard** (WF1, `generation_callback_url`, `N8N_WF1_WEBHOOK`, secours `generation-complete`).
