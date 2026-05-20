# Configuration Claude Code — Flinty

## Règles projet (`.claude/rules/`)

- **`flinty-core.md`** — chargée à chaque session (skills, garde-fous, Thomas).
- **`flinty-dashboard.md`** — chargée en lazy load quand un fichier du dashboard `*.ts` / `*.tsx` est concerné (BLOCs, n8n, GSheet, TDD).
- **`flinty-tasks.md`** — lazy load pour `tasks/v3/**` et `.workflows/02-Implementation/Dev-Log.md`.

Le hub humain reste [`../CLAUDE.md`](../CLAUDE.md) à la racine du repo.

## Slash commands (`.claude/commands/`)

| Commande | Rôle |
|----------|------|
| `/run-tests` | Vitest dashboard |
| `/task-done` | MAJ TASKS + TASK-XXX + Dev-Log |
| `/pr-ready` | Tests + résumé PR |
| `/n8n-vercel-checklist` | Callbacks WF1/WF2 + env Vercel |
| `/smoke-campaign-api` | Rappel smoke API (sans secrets) |

## Hooks ([`settings.json`](settings.json) + [`hooks/`](hooks/))

- **PostToolUse** (`Write` \| `Edit`) : après toucher un `.ts` / `.tsx` du dashboard, injecte un rappel factuel sur `npm run test` (pas de formatage automatique : le projet utilise ESLint via `npm run lint`).
- **Stop** : si le dernier message ressemble à une livraison « terminée » sans mention de tests ni exemption, **une** relance demande la preuve Vitest (`stop_hook_active` évite les boucles).

Pour désactiver temporairement tous les hooks : `"disableAllHooks": true` dans `.claude/settings.local.json` (voir doc Claude Code).

## Fichier local

`.claude/settings.local.json` (permissions MCP, etc.) **ne doit pas être commité** s’il contient des secrets — vérifier `.gitignore`.
