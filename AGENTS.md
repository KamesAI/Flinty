# Flinty — Dashboard de qualification leads

> Produit SaaS interne — Thomas Callendreau (Kames AI)  
> Cold email prospection : Next.js 15 + Google Sheets + n8n + Codex Sonnet 4.5  
> Dernière mise à jour : 2026-05-17

---

## Mémoire projet (hub)

Les instructions détaillées sont découpées pour limiter la **context rot** :

| Fichier | Quand ça charge |
|---------|-----------------|
| [`.claude/rules/flinty-core.md`](.claude/rules/flinty-core.md) | Toujours (skills, interdits, Thomas, env, couleur) |
| [`.claude/rules/flinty-dashboard.md`](.claude/rules/flinty-dashboard.md) | Fichiers sous `.workflows/02-Implementation/interface/lead-qualifier-dashboard/**/*.ts(x)` |
| [`.claude/rules/flinty-tasks.md`](.claude/rules/flinty-tasks.md) | `tasks/v3/**`, `tasks/v4/**`, `.workflows/02-Implementation/Dev-Log.md` |

**Skills exécutables** : répertoire [`skills/`](skills/) (préfixe `local-*` côté Codex si plugin).  
**Marketing / contexte Kames** : hub [`skills/flinty-product-marketing-context/SKILL.md`](skills/flinty-product-marketing-context/SKILL.md) ; vendor [Corey Haines marketingskills](https://github.com/coreyhaines31/marketingskills) en sous-module [`external/marketingskills`](external/marketingskills) — index [skills/vendor/marketingskills-INDEX.md](skills/vendor/marketingskills-INDEX.md), stratégie [skills/vendor/README.md](skills/vendor/README.md).  
**Blocs prompts WF2 / ICP** : [`01-Architecture/marketingskills-prompt-blocks.md`](01-Architecture/marketingskills-prompt-blocks.md).  
**Automatisation Codex** : [`.codex/hooks/`](.codex/hooks/), [`.codex/hooks.json`](.codex/hooks.json).  
**Automatisation Claude Code** : [`.claude/commands/`](.claude/commands/) (slash commands), [`.claude/hooks/`](.claude/hooks/), [`.claude/settings.json`](.claude/settings.json).

---

## Vault Obsidian Kames — base de connaissance locale

Le vault Obsidian Kames est disponible localement via :

`.ai-context/obsidian-kames`

Ce dossier est un lien symbolique vers le vault personnel Kames AI de Thomas.

Utilisation autorisée :
- comprendre le contexte business de Kames AI ;
- consulter les offres, décisions, SOP, notes stratégiques et patterns d'automatisation ;
- retrouver du contexte sur les projets, clients, contenus ou workflows Kames ;
- utiliser ces informations pour mieux orienter les décisions produit, code, contenu ou automatisation.

Règles strictes :
- utiliser le vault en lecture seule par défaut ;
- ne jamais modifier, supprimer, renommer ou déplacer de fichiers dans `.ai-context/obsidian-kames`, sauf demande explicite de Thomas ;
- ne jamais créer de nouveaux fichiers dans le vault sauf demande explicite ;
- ne jamais committer `.ai-context/` ;
- ne jamais copier de secrets, credentials, données client sensibles ou PII depuis le vault vers le code, les logs, les prompts ou les commits ;
- si une information du vault influence une décision importante, citer le chemin de la note consultée ;
- si le vault contredit le code actuel ou la demande de Thomas, signaler la contradiction au lieu de trancher seul ;
- pour toute action destructive, production, client-visible, financière ou irréversible : proposer un plan et attendre validation humaine.

Synchronisation opérationnelle du Brain :
- `MAJ Brain`, `mets à jour le Brain`, `mets à jour Obsidian` ou équivalent explicite autorise Codex à écrire dans `.ai-context/obsidian-kames` ;
- après une MAJ Brain, synchroniser automatiquement le repo GitHub `git@github.com:KamesAI/kames-obsidian-vault.git` via `/Users/callendreau/Dev/kames-workflows/scripts/sync-obsidian-brain.sh` ;
- committer uniquement les fichiers Markdown du vault modifiés/créés pendant la tâche courante, jamais les changements préexistants ;
- ne jamais committer `.obsidian/**`, secrets, credentials, PII, données client sensibles ou fichiers non Markdown sans validation explicite ;
- après le push GitHub, synchroniser le vault Hermes sur le VPS avec `ssh hermes-vps 'cd /home/kames/KamesOS/obsidian-vault && git pull --rebase origin main'` ;
- si `ssh hermes-vps` échoue, essayer le fallback explicite `ssh kames@135.181.41.46` ; si le push ou le pull VPS échoue encore, stopper et rapporter l'erreur au lieu de forcer.

Priorité de contexte :
1. Demande actuelle de Thomas.
2. Code et documentation du projet courant.
3. CLAUDE.md / AGENTS.md.
4. Vault Obsidian Kames.
5. Hypothèses de l'agent.

Avant toute tâche importante :
1. Identifier si le vault est utile.
2. Consulter seulement les notes nécessaires.
3. Résumer les notes utilisées si elles influencent la décision.
4. Proposer un plan avant modification significative.

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

- [`00-Discovery/PRD.md`](00-Discovery/PRD-v4.md) — PRD  
- [`00-Discovery/ARCHI.md`](00-Discovery/ARCHI-v4.md) — architecture
- [`01-Architecture/`](01-Architecture/) — plans dashboard / lead gen  

---

## Arborescence utile

```
Flinty/
├── AGENTS.md                    ← ce hub
├── .claude/
│   ├── rules/                   ← règles modulaires (lazy load)
│   ├── commands/                ← slash commands Kames
│   ├── hooks/                   ← scripts hooks Claude Code
│   └── settings.json            ← hooks versionnés (+ settings.local.json local)
├── .codex/
│   ├── hooks/                   ← scripts hooks Codex
│   └── hooks.json               ← hooks Codex versionnés
├── .cursor/rules/flinty.mdc     ← Cursor (miroir partiel)
├── .workflows/02-Implementation/interface/lead-qualifier-dashboard/  ← code Next.js
├── tasks/v3/                    ← TASKS.md, TASK-XXX.md, lessons.md
├── tasks/v4/                    ← TASKS.md, TASK-v4-XXX.md
├── skills/                      ← skills métier + ingénierie
└── external/marketingskills/    ← sous-module (Corey Haines — skills marketing)
```

**Code principal** : `.workflows/02-Implementation/interface/lead-qualifier-dashboard/`  
`npm run dev` | `npm run test` | `npm run build` depuis ce dossier.

---

## Suivi tâches obligatoire

Après chaque avancée concrète sur une tâche v4, mettre à jour dans le même tour :

1. [`tasks/v4/TASKS.md`](tasks/v4/TASKS.md) — statut global de la ligne concernée (`⬜`, `🚧`, `✅`) et libellé si le périmètre a changé.
2. Fichier unitaire [`tasks/v4/TASK-v4-XXX.md`](tasks/v4/) — `**Status**`, section d'avancement datée, cases cochées uniquement pour ce qui est réellement livré.
3. [`.workflows/02-Implementation/Dev-Log.md`](.workflows/02-Implementation/Dev-Log.md) — entrée datée avec résumé des fichiers/zones modifiés et preuves de tests.

Règle de cohérence : une tâche passée en `✅` doit avoir toutes ses cases applicables cochées dans `Requirements` et `Acceptance Criteria`. Avant de marquer `✅`, relire le fichier unitaire et cocher chaque requirement réellement livré ; si une case reste décochée, la tâche n'est pas done et doit rester `🚧 Partiel — YYYY-MM-DD` avec le reste à faire listé explicitement.

Règle de prudence : ne jamais passer une tâche en `✅` si un workflow n8n, smoke staging, update Sheets réel, ou critère d'acceptance reste à faire. Utiliser `🚧 Partiel — YYYY-MM-DD` et lister explicitement le reste.

---

## Statut v3 (2026-04-25)

Les 22 TASK-001→022 sont ✅ en staging.

Avant prod : variables Vercel prod + smoke campagne ; bascule n8n staging → prod ; cible lancement **mai 2026**.

---

## Dépannage rapide

Campagne bloquée **`generating`** : voir **flinty-dashboard** (WF1, `generation_callback_url`, `N8N_WF1_WEBHOOK`, secours `generation-complete`).
