---
description: Règles globales Flinty — toute session (skills, interdits, Thomas, env, suivi tâches)
---

# Flinty — règles cœur

Réponses à l’utilisateur en **français**.

## Skills (ne pas sous-déclencher)

Avant de répondre, vérifier si un skill du repo (`skills/`) correspond à la demande ; **l’appliquer** plutôt que d’improviser.

| Situation | Skill (`local-*` si plugin) |
|-----------|-----------------------------|
| Bug / comportement inattendu | `local-systematic-debugging` |
| Nouveau code Next.js / TypeScript | `local-test-driven-development` |
| Avant « terminé » | `local-verification-before-completion` |
| Plan multi-étapes | `local-writing-plan` |
| Architecture BLOC | `local-create-architecture` |
| Découpage tâches | `local-create-tasks` |
| Idée produit | `local-brainstorming` |
| Copy, ICP, cold email, marketing (hors code) | `local-flinty-product-marketing-context` — puis [skills/sales-message-generator/SKILL.md](../../skills/sales-message-generator/SKILL.md) si messages ; vendor `external/marketingskills` selon [skills/vendor/marketingskills-INDEX.md](../../skills/vendor/marketingskills-INDEX.md) |
| n8n | skills `n8n-*` + MCP n8n |

## Ne jamais faire

- `docker-compose` (non installé)
- Référencer AWS EC2, RDS ou Supabase Pro comme stack vivante
- Installer shadcn via CLI — UI Tailwind custom (primitives `@radix-ui/*` autorisées)
- Mélanger des données entre campagnes hors **Contacts_Registry** (BLOC 4)
- Refetcher un `sheet_id` déjà en cache sans vérifier le cache
- Committer `.env.local`
- Dire « c’est terminé » sans preuve (tests / sorties d’outils)
- Corriger un bug sans **root cause** identifiée
- Modifier plusieurs choses à la fois pour déboguer
- Code hors périmètre (style, formatage, refactors gratuits)
- Choisir silencieusement entre interprétations ambiguës — les exposer et demander

## Toujours faire

- **staging → valider → prod** pour les changements sensibles
- Isolation par campagne : 1 GSheet enfant par campagne
- **TDD** : test Vitest **avant** le code pour `lib/*.ts` et `app/**/*.ts` du dashboard (voir règle dashboard)
- Commandes copy-paste avec chemins complets ; annoncer les risques avant action sensible
- **Exécuter** `npm run test` (et ce qui s’impose) depuis le dossier dashboard — ne pas demander à Thomas de vérifier ce que l’agent peut lancer

### Couleur UI

`#006596` (TrueHorizon blue — `hsl(200 100% 29%)`) — utiliser `hsl(var(--primary))` en CSS ; ne pas hardcoder l’ancienne charte orange.

## Variables d’environnement (noms)

`GOOGLE_INDEX_SHEET_ID`, `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `OPENROUTER_API_KEY`, `N8N_BASE_URL`, `N8N_STAGING_URL`, `N8N_WF1_WEBHOOK` … `N8N_WF4_WEBHOOK`, `RESEND_API_KEY`, `RESEND_FROM`.

## Comportement

### Tâche non triviale (3+ étapes / archi)

Hypothèses explicites ; options nommées si trade-offs ; plan dans `tasks/v3/todo.md` avec validation Thomas avant gros chantier.

### Bug

Skill `local-systematic-debugging` : Phase 1 = root cause ; un changement à la fois ; après 3 échecs → STOP avec Thomas.

### Structure des réponses (tâches techniques)

1. Diagnostic court  
2. Plan numéroté  
3. Commandes copy-paste (chemins explicites)  
4. Résultat attendu par étape  
5. Plan B  

### Après correction par Thomas

Entrée dans `tasks/v3/lessons.md` (tableau).

## Contexte Thomas

Instructions pas à pas ; une voie privilégiée ; ne pas lui faire tester ce que l’agent peut exécuter localement. SSH Hetzner : `ssh kames@<IP>` (utilisateur `kames`). Projets sous `~/Dev/` — Flinty : `/Users/callendreau/Dev/Flinty/`.

## Leçons

Source de vérité : `tasks/v3/lessons.md` (ne pas dupliquer ici).

## Règle suivi des tâches v3

Après chaque tâche réalisée : mettre à jour `tasks/v3/TASKS.md`, `tasks/v3/TASK-XXX.md`, et `02-Implementation/Dev-Log.md` (format dans la règle `flinty-tasks.md`).
