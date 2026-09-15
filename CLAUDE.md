# Flinty — Instructions agents

Produit de prospection B2B : dashboard Next.js, Google Sheets, n8n, Resend et IA.

## Priorité et sources

1. Demande de Thomas.
2. Code réel sous `.workflows/02-Implementation/interface/lead-qualifier-dashboard/`.
3. PRD/ARCHI v4 sous `.workflows/00-Discovery/`.
4. `tasks/v4/`, règles spécialisées et `Dev-Log.md`.
5. `AGENTS.md` / `CLAUDE.md`.
6. Hypothèses.

- Le vault `.ai-context/obsidian-kames` est en lecture seule par défaut.
- Les skills généraux sont user-scope ; `skills/` contient seulement les éléments projet/vendor.
- Conserver les tâches v3 historiques ; les nouvelles tâches suivent le format du tracker actif.

## Workflow Kames

Nouveau produit : `brainstorming` → validation marché si nécessaire → `glossaire-metier` → `writing-plan` si gros effort → `create-prd` → `create-architecture` → `create-tasks` → `analyze` → `task-research` → `frontend-design-quality` si UI → plan → TDD.

Projet existant : `brainstorming` → `create-tasks` → `analyze` → `task-research` → design UI si nécessaire → plan → TDD.

- `task-research` inspecte le dashboard, les workflows, les Sheets, les tests et les seams avant le code.
- `create-architecture` consigne décisions `DEC-###`, contrats, intégrations, env et rollback ; aucun ADR séparé.
- `create-tasks` produit des tâches verticales avec recherche, design, test, sécurité, staging smoke et rollback.
- `frontend-design-quality` route automatiquement Foundation, Task UI ou Visual gate et doit être relancé après l’implémentation.

## Développement et preuve

- `handoff` avant un rafraîchissement de contexte ou une fin de session longue.
- Avant merge/déploiement : `security-review` si concerné ; charge : `load-test` ; incident prod/Sentry : `error-triage`.

- Code principal : lancer les commandes depuis `.../lead-qualifier-dashboard/`.
- `test-driven-development` : test rouge → code → refactor ; bug : `systematic-debugging`.
- Doute UI : `prototype`. Après une phase : `converge` puis `verification-before-completion`.
- Une tâche n’est ✅ que si Requirements, Acceptance Criteria, tracker et preuves sont à jour.
- Promotion : tests locaux → build → staging → `staging-smoke` PASS → validation Thomas → production.
- Le smoke utilise Sheets, n8n, credentials et emails de test ; aucune campagne réelle.

## Commandes et intégrations

## Brain Kames partagé

- Le contexte stratégique et les SOP partagés Codex/Claude Code sont dans `.ai-context/obsidian-kames`.
- Ce chemin est un symlink vers le clone local du repo GitHub `KamesAI/kames-obsidian-vault`.
- Lire le Brain en priorité pour le contexte Kames ; le code et la demande actuelle restent prioritaires en cas de contradiction.
- Le Brain est en lecture seule par défaut ; ne jamais y transférer données de prospection, PII ou secrets.
- Une mise à jour explicite passe par le clone local puis `scripts/sync-obsidian-brain.sh` si le script existe.

- `npm run dev`, `npm run test`, `npm run test:e2e`, `npm run build`, `npm run test:all`.
- Vercel héberge le dashboard ; n8n staging et production sont distincts.
- Ne jamais synchroniser un vrai Google Sheet ou envoyer un email sans validation explicite.
- Les appels externes sans credentials retournent une erreur explicite, jamais une fausse réussite.

## Suivi, sécurité et Git

- Après chaque tâche v4 : mettre à jour `tasks/v4/TASKS.md`, la fiche `TASK-v4-XXX.md` et `Dev-Log.md`.
- `🚧 Partiel` reste obligatoire si smoke, workflow n8n, Sheets réel ou acceptance manque.
- Secrets dans `.env.local`, jamais dans logs, commits ou exports.
- Pas de reset, clean, restore, branch -D ou push force sans validation explicite.
- Pas de push direct sur `main` ; branches `feat/`, `fix/`, `chore/`, `client/` puis PR.
- `AGENTS.md` et `CLAUDE.md` doivent être strictement identiques et rester sous 150 lignes.
