# Flinty — Dashboard de qualification leads

> Produit SaaS interne — Thomas Callendreau (Kames AI)
> Cold email prospection : Next.js 15 + Google Sheets + n8n + Claude Opus 4.6
> Dernière mise à jour : 2026-04-16

---

## Règle globale — Skills

**Avant chaque réponse, vérifier si un skill disponible correspond à la demande et l'invoquer si pertinent.** Ne pas répondre directement si un skill couvre le besoin — l'exécuter d'abord.

Claude a une tendance naturelle à **sous-déclencher** les skills. Corriger ce biais : si la demande touche de près ou de loin au domaine d'un skill, l'invoquer.

---

## Stack technique (source de vérité absolue)

| Composant | Valeur |
|---|---|
| **Frontend** | Next.js 15.1.7, App Router, TypeScript, Tailwind CSS (thème dark custom — **pas de shadcn**) |
| **Tests** | Vitest (cycle TDD obligatoire) |
| **Animations** | Framer Motion 12 |
| **Icônes** | Lucide React |
| **Google Sheets** | googleapis 144.0.0 — 1 feuille maître (Index) + N feuilles enfants (1 par campagne) |
| **IA scoring** | Claude Opus 4.6 via **OpenRouter** (`openai` SDK + `OPENROUTER_API_KEY`) |
| **Automation** | n8n sur Hetzner → `staging-n8n.kamesai.com` / `agent.kamesai.com` |
| **Emails** | Resend (transactionnel + webhooks statut) |
| **Déploiement** | Vercel (CI/CD auto depuis GitHub `main`) |
| **IDE** | Cursor (macOS) + Claude Code |

**Variables d'environnement critiques** (voir `.env.local`) :

| Variable | Rôle |
|---|---|
| `GOOGLE_INDEX_SHEET_ID` | ID de la feuille maître Flinty Index |
| `GOOGLE_DRIVE_FOLDER_ID` | Dossier Drive pour créer les feuilles enfants |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Auth Google Service Account |
| `GOOGLE_PRIVATE_KEY` | Clé privée Service Account |
| `OPENROUTER_API_KEY` | Scoring Claude Opus 4.6 via OpenRouter |
| `N8N_BASE_URL` | URL base n8n production |
| `N8N_STAGING_URL` | URL base n8n staging |
| `N8N_WF1_WEBHOOK` → `N8N_WF4_WEBHOOK` | Webhooks des 4 workflows n8n |
| `RESEND_API_KEY` | Envoi emails |
| `RESEND_FROM` | Adresse expéditeur |

---

## Règles absolues

### Ne jamais faire
- Utiliser `docker-compose` (non installé → crash immédiat)
- Référencer AWS EC2, RDS ou Supabase Pro (stack morte)
- Installer ou utiliser shadcn — UI custom Tailwind dark uniquement
- Mélanger des données entre campagnes hors du Contacts_Registry (BLOC 4)
- Refetcher un `sheet_id` déjà en cache — toujours vérifier le cache d'abord
- Committer `.env.local` (contient des credentials en clair)
- Déclarer "c'est terminé" sans preuve concrète que ça fonctionne
- Proposer un fix sans avoir identifié la root cause
- Modifier plusieurs choses à la fois pour déboguer
- Toucher du code adjacent non lié à la demande : style, commentaires, type hints, formatage, dead code non cassé
- "Améliorer" du code fonctionnel lors d'un bug fix ou d'une feature — chaque ligne modifiée doit être traçable directement à la demande
- Choisir silencieusement entre plusieurs interprétations d'une demande ambiguë — toujours les présenter et demander

### Toujours faire
- Travailler staging → valider → merge prod
- Respecter l'isolation par campagne : chaque campagne a son propre GSheet enfant
- Écrire le test Vitest AVANT le code pour tout fichier `lib/*.ts` ou `app/**/*.ts`
- Donner des commandes copy-paste complètes avec chemin exact
- Avertir des risques (downtime, perte de données) AVANT d'agir
- Indiquer le résultat attendu après chaque étape
- **Exécuter tous les tests soi-même** avec les outils disponibles (Bash, n8n MCP, GitHub MCP, etc.) — ne jamais demander à Thomas de tester quelque chose que Claude peut vérifier seul. Communiquer uniquement les résultats.

### Couleur accent
`#FFA318` (orange Flinty) — à respecter dans tous les composants UI

---

## Comportement attendu

### Pour toute tâche non triviale (3+ étapes ou décision d'architecture)
1. Lister les hypothèses implicites et les présenter explicitement
2. Si plusieurs approches existent (perf vs. simplicité vs. coût), les nommer — ne jamais choisir silencieusement
3. Écrire un plan dans `tasks/v3/todo.md` avec cases à cocher
4. Valider le plan avec Thomas avant d'implémenter
5. Cocher les étapes au fur et à mesure

### Pour tout bug ou comportement inattendu
→ **Invoquer skill `local-systematic-debugging` AVANT de proposer quoi que ce soit**
- Phase 1 obligatoire : identifier la root cause (lire les logs, reproduire, tracer le data flow)
- Ne jamais proposer un fix sans avoir complété la Phase 1
- Un seul changement à la fois, jamais plusieurs en simultané
- Si 3 fixes échouent → STOP, remettre en question l'architecture, discuter avec Thomas

### Pour tout code Next.js / TypeScript
→ **Invoquer skill `local-test-driven-development`**
- Écrire le test AVANT le code (cycle Rouge → Vert → Refactor)
- Ne jamais marquer une tâche complète sans que tous les tests passent
- `npm run test` depuis `02-Implementation/interface/lead-qualifier-dashboard/`

### Avant de dire "c'est terminé"
→ **Invoquer skill `local-verification-before-completion`**
- Exécuter les tests soi-même : `npm run test` (Vitest), `n8n_test_workflow` (MCP), curl, logs Bash — selon le contexte
- Prouver que ça fonctionne avec les sorties réelles des outils
- Jamais de "ça devrait marcher" — uniquement "voici la preuve que ça marche"
- **Ne jamais demander à Thomas de tester quelque chose que Claude peut vérifier lui-même**

### Structure des réponses (pour les tâches techniques)
1. Diagnostic rapide en 2 lignes
2. Plan d'action numéroté
3. Commandes copy-paste avec localisation explicite (Terminal / Cursor / Local)
4. Résultat attendu après chaque étape
5. Plan B si ça ne marche pas

### Après chaque correction de Thomas
Ajouter la leçon dans `tasks/v3/lessons.md` selon ce format :
```
| [Date] | [Erreur commise] | [Règle permanente pour l'éviter] |
```

### Règle suivi des tâches TASK-XXX (v3)

**Après chaque réalisation d'une tâche v3, mettre à jour obligatoirement :**
1. `tasks/v3/TASKS.md` — passer le statut de ⏳ à ✅
2. `tasks/v3/TASK-XXX.md` — passer `**Statut** : ⏳ À faire` en `**Statut** : ✅ Complété`
3. `02-Implementation/Dev-Log.md` — ajouter une entrée de session (date, tâche, changements)

---

## Architecture v3 — BLOCs et priorités

| BLOC | Priorité | Description |
|---|---|---|
| **BLOC 0** | P0 | 1 GSheet par campagne (maître Index + enfants) — **FONDATION** |
| **BLOC 1** | P0 | Enrichissement IA 14 champs (Claude Opus 4.6 via OpenRouter) |
| **BLOC 3** | P0 | Générateur ICP (dialogue 8 questions → markdown preview) |
| **BLOC 2** | P1 | Kanban drag-drop (6 colonnes : new → contacted → opened → clicked → replied → bounced) |
| **BLOC 4** | P1 | Déduplication cross-campagnes (Contacts_Registry) |
| **BLOC 5** | P1 | Export multi-format (CSV standard / JSON / Instantly-ready) |

### 6 Workflows n8n

| WF | Rôle |
|---|---|
| **WF1** | Lead generation — Google Maps → Leads_Raw + création GSheet enfant |
| **WF2** | Qualification — Firecrawl + Claude → Qualified / Rejected (14 champs) |
| **WF3** | Email J0 — envoi via Resend |
| **WF4** | Webhooks Resend — mise à jour statut (opened, clicked, replied, bounced) |
| **WF5** | Auto-relance — J+3 et J+7 |
| **WF6** | Agrégation stats — toutes les heures |

### Structure GSheet enfant (par campagne)

Chaque GSheet enfant contient 4 onglets :
- `Leads_Raw` — leads bruts depuis WF1
- `Leads_Qualified` — leads enrichis (14 champs) depuis WF2
- `Leads_Rejected` — leads rejetés avec `rejection_reason`
- `Config` — paramètres de la campagne

---

## Structure du dossier

```
Flinty/
├── CLAUDE.md                               ← Ce fichier
├── .claude/
│   └── settings.local.json                 ← Config locale Claude Code
├── .env.local                              ← Variables d'environnement (ne jamais committer)
├── 00-Discovery/
│   ├── PRD.md                              ← Source de vérité produit (v2.0, 2026-04-15)
│   ├── ARCHI.md                            ← Architecture technique v3
│   ├── ICP.md                              ← Profil client idéal
│   └── email-templates-library.md
├── 01-Architecture/
│   ├── lead-gen-plan-v1.md
│   └── dashboard-plan-v2.md
├── 02-Implementation/
│   ├── interface/lead-qualifier-dashboard/ ← CODE PRINCIPAL (Next.js)
│   │   ├── app/                            ← Routes App Router (pages + Server Components)
│   │   └── lib/                            ← sheets.ts, campaigns.ts, anthropic.ts
│   └── Dev-Log.md                          ← Log de développement (MAJ après chaque session)
├── tasks/
│   ├── v2/                                 ← Tâches v2 (archivées)
│   └── v3/                                 ← Tâches actives v3 (source de vérité suivi)
├── docs/plans/
│   └── flinty-plan-v3.md
└── skills/                                 ← 18 skills locaux
```

**Chemin du code principal** : `02-Implementation/interface/lead-qualifier-dashboard/`
- `npm run dev` — serveur de développement
- `npm run test` — Vitest
- `npm run build` — build production

---

## MCP Configurés

> Config Claude Code : `~/.claude.json` (scope user)

| MCP | Usage dans Flinty |
|---|---|
| **n8n** | Créer / modifier les 6 workflows Flinty |
| **github** | PRs, issues, code review |
| **firecrawl** | Scraping sites dans WF2 (enrichissement) |
| **context7** | Documentation Next.js, googleapis, Vitest |
| **Figma** | Lecture des maquettes UI |
| **Vercel** | Déploiements, variables d'env, logs |
| **Notion** | Notes de projet |

---

## Skills disponibles

### Référence rapide — Situation → Skill

| Situation | Skill à invoquer |
|---|---|
| Bug ou comportement inattendu | `local-systematic-debugging` |
| Nouveau code Next.js / TypeScript | `local-test-driven-development` |
| Avant de déclarer une tâche terminée | `local-verification-before-completion` |
| Projet multi-étapes à planifier | `local-writing-plan` |
| Architecture d'un nouveau BLOC | `local-create-architecture` |
| Décomposition d'un BLOC en tâches | `local-create-tasks` |
| Nouvelle feature / idée produit | `local-brainstorming` |
| Créer / modifier un workflow n8n | Skills `n8n-*` + n8n MCP |

---

## Contexte Thomas

- Non-développeur avec forte capacité d'exécution technique (no-code, n8n, Next.js)
- Besoin d'instructions exactes à la lettre : où cliquer, quoi taper, résultat attendu
- Préfère une seule façon de faire (la bonne), pas plusieurs options
- SSH via Terminal macOS : `ssh kames@<IP>` — connexion Hetzner en tant que `kames`
- Workflow dev : toujours staging → validation → prod
- Projets stockés dans `~/Dev/` — ce projet : `/Users/callendreau/Dev/Flinty/`

---

## Leçons apprises

→ Voir `tasks/v3/lessons.md` (source de vérité — ne pas écrire les leçons ici)

---

## Objectifs immédiats (v3)

1. **BLOC 0** (P0) : Migrer architecture → 1 GSheet par campagne
2. **BLOC 1** (P0) : Enrichissement Claude Opus 4.6 (14 champs)
3. **BLOC 3** (P0) : Générateur ICP dialogique (8 questions → markdown)
4. Déploiement Vercel production (bloquant pour tests réels)
5. Lancement v3 : cible **mai 2026**
