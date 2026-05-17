# Flinty — Dashboard de qualification leads

> Produit SaaS interne — Thomas Callendreau (Kames AI)  
> Cold email prospection : Next.js 15 + Google Sheets + n8n + Claude Sonnet 4.5  
> Dernière mise à jour : 2026-05-17

---

## Mémoire projet (hub)

Les instructions détaillées sont découpées pour limiter la **context rot** :

| Fichier | Quand ça charge |
|---------|-----------------|
| [`.claude/rules/flinty-core.md`](.claude/rules/flinty-core.md) | Toujours (skills, interdits, Thomas, env, couleur) |
| [`.claude/rules/flinty-dashboard.md`](.claude/rules/flinty-dashboard.md) | Fichiers sous `02-Implementation/interface/lead-qualifier-dashboard/**/*.ts(x)` |
| [`.claude/rules/flinty-tasks.md`](.claude/rules/flinty-tasks.md) | `tasks/v3/**`, `tasks/v4/**`, `02-Implementation/Dev-Log.md` |

**Skills exécutables** : répertoire [`skills/`](skills/) (préfixe `local-*` côté Claude Code si plugin).  
**Marketing / contexte Kames** : hub [`skills/flinty-product-marketing-context/SKILL.md`](skills/flinty-product-marketing-context/SKILL.md) ; vendor [Corey Haines marketingskills](https://github.com/coreyhaines31/marketingskills) en sous-module [`external/marketingskills`](external/marketingskills) — index [skills/vendor/marketingskills-INDEX.md](skills/vendor/marketingskills-INDEX.md), stratégie [skills/vendor/README.md](skills/vendor/README.md).  
**Blocs prompts WF2 / ICP** : [`01-Architecture/marketingskills-prompt-blocks.md`](01-Architecture/marketingskills-prompt-blocks.md).  
**Automatisation Claude Code** : [`.claude/commands/`](.claude/commands/) (slash commands), [`.claude/hooks/`](.claude/hooks/), [`.claude/settings.json`](.claude/settings.json).

---

## Stack (résumé)

| Composant | Valeur |
|-----------|--------|
| **Frontend** | Next.js 15.1.7, App Router, TypeScript, Tailwind (light custom — **pas shadcn** ; `@radix-ui/*` ok) |
| **Tests** | Vitest — TDD obligatoire pour `lib/*.ts` et `app/**/*.ts` du dashboard |
| **Données** | googleapis — 1 Index + N GSheets enfants ; isolation stricte |
| **IA** | Claude Sonnet 4.5 via **OpenRouter** |
| **Automation** | n8n — `staging-n8n.kamesai.com` / `agent.kamesai.com` |
| **Emails** | Resend |
| **Déploiement** | Vercel (GitHub `main`) |

Variables d’environnement : voir **flinty-core** (noms des clés) et `.env.local` (ne jamais committer).

---

## Découverte & architecture produit

- [`00-Discovery/PRD.md`](00-Discovery/PRD-v4.md) — PRD  
- [`00-Discovery/ARCHI.md`](00-Discovery/ARCHI-V4.md) — architecture  
- [`01-Architecture/`](01-Architecture/) — plans dashboard / lead gen  

---

## Arborescence utile

```
Flinty/
├── CLAUDE.md                    ← ce hub
├── .claude/
│   ├── rules/                   ← règles modulaires (lazy load)
│   ├── commands/                ← slash commands Kames
│   ├── hooks/                   ← scripts hooks Claude Code
│   └── settings.json            ← hooks versionnés (+ settings.local.json local)
├── .cursor/rules/flinty.mdc     ← Cursor (miroir partiel)
├── 02-Implementation/interface/lead-qualifier-dashboard/  ← code Next.js
├── tasks/v3/                    ← TASKS.md, TASK-XXX.md, lessons.md
├── tasks/v4/                    ← TASKS.md, TASK-v4-XXX.md
├── skills/                      ← skills métier + ingénierie
└── external/marketingskills/    ← sous-module (Corey Haines — skills marketing)
```

**Code principal** : `02-Implementation/interface/lead-qualifier-dashboard/`  
`npm run dev` | `npm run test` | `npm run build` depuis ce dossier.

---

## Suivi tâches obligatoire

Après chaque avancée concrète sur une tâche v4, mettre à jour dans le même tour :

1. [`tasks/v4/TASKS.md`](tasks/v4/TASKS.md) — statut global de la ligne concernée (`⬜`, `🚧`, `✅`) et libellé si le périmètre a changé.
2. Fichier unitaire [`tasks/v4/TASK-v4-XXX.md`](tasks/v4/) — `**Status**`, section d'avancement datée, cases cochées uniquement pour ce qui est réellement livré.
3. [`02-Implementation/Dev-Log.md`](02-Implementation/Dev-Log.md) ou [`.workflows/02-Implementation/Dev-Log.md`](.workflows/02-Implementation/Dev-Log.md) selon le dossier actif — entrée datée avec résumé des fichiers/zones modifiés et preuves de tests.

Règle de cohérence : une tâche passée en `✅` doit avoir toutes ses cases applicables cochées dans `Requirements` et `Acceptance Criteria`. Avant de marquer `✅`, relire le fichier unitaire et cocher chaque requirement réellement livré ; si une case reste décochée, la tâche n'est pas done et doit rester `🚧 Partiel — YYYY-MM-DD` avec le reste à faire listé explicitement.

Règle de prudence : ne jamais passer une tâche en `✅` si un workflow n8n, smoke staging, update Sheets réel, ou critère d'acceptance reste à faire. Utiliser `🚧 Partiel — YYYY-MM-DD` et lister explicitement le reste.

---

## Statut v3 (2026-04-25)

Les 22 TASK-001→022 sont ✅ en staging.

Avant prod : variables Vercel prod + smoke campagne ; bascule n8n staging → prod ; cible lancement **mai 2026**.

---

## Dépannage rapide

Campagne bloquée **`generating`** : voir **flinty-dashboard** (WF1, `generation_callback_url`, `N8N_WF1_WEBHOOK`, secours `generation-complete`).
