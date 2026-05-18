---
name: subagent-driven-development
description: Use when a task spans multiple layers (n8n + API + Sheets + TypeScript) or requires parallel implementation; defines subagent dispatch protocol and status handling for Flinty
---

# Subagent-Driven Development (Flinty Edition)

Basé sur superpowers v5.0 — adapté au stack Flinty (n8n + Next.js + Google Sheets + Claude).

## Principe

Un subagent par tâche atomique. Revue en deux étapes. Jamais en parallèle.

```
Plan → dispatch subagent 1 → statut → review → dispatch subagent 2 → ...
```

## Quand utiliser

- Tâche touche 3+ fichiers ou layers
- Callback n8n + route API + lib TypeScript en même périmètre
- Migration Sheets (ex : migrate-sheets-v4)
- Setter automation multi-étapes
- Toute TASK-v4 estimée > 2h

## Protocol de dispatch

### 1. Préparer le brief subagent

```
Contexte : [layer concerné, ex: "lib/setter.ts — automation setter v4"]
Scope EXACT : [fichiers à modifier — pas plus]
Livrable : [ce que le subagent doit retourner comme preuve]
Interdits : [ex: "ne pas toucher replies.ts"]
Tests requis : [ex: "npm run test -- setter.test.ts doit passer"]
```

### 2. Statuts et réponses

| Statut | Signification | Action parent |
|--------|--------------|---------------|
| `DONE` | Travail terminé, preuves fournies | Passer en spec compliance review |
| `DONE_WITH_CONCERNS` | Fonctionne mais problème mineur signalé | Traiter le concern AVANT review ; noter dans TASK-v4-XXX |
| `NEEDS_CONTEXT` | Manque d'info pour avancer | Fournir contexte manquant, re-dispatcher **même subagent** |
| `BLOCKED` | Bloqué — voir tableau ci-dessous | Diagnostiquer type de blocage |

### 3. Déblocage selon type

| Type de blocage | Réponse |
|----------------|---------|
| Contexte manquant (sheet_id, env var) | Fournir info, re-dispatcher |
| Tâche trop large | Découper en sous-tâches, re-dispatcher |
| Credential prod manquant | Escalade Thomas |
| Ambiguïté métier | Poser question à Thomas, ne pas deviner |

## Séquence de review (après DONE)

```
1. Spec compliance : le code correspond à ce qui était demandé ?
2. Code quality : patterns corrects, pas de régression ?
3. Si problème → subagent implementer fix → re-review (ne pas sauter)
```

## Cas Flinty typiques

### Callback n8n + route API

```
Subagent A : implémenter route /api/campaigns/[id]/setter-callback
  → DONE + test curl + npm run test
Parent : spec review (callback reçoit le bon payload ?)
Subagent B : mettre à jour lib/setter.ts pour consommer callback
  → DONE + setter.test.ts vert
Parent : quality review (isolation campagne respectée ?)
```

### Migration Sheets

```
Subagent A : scripts/migrate-sheets-v4.ts — dry-run
  → DONE + output console montrant les lignes à migrer
Parent : valider output avant d'autoriser --execute
Subagent B : même script --execute
  → DONE + Sheets réels mis à jour (screenshot ou lecture MCP)
```

### Setter automation

```
Subagent A : lib/setter.ts — logique d'envoi
  → DONE + setter.test.ts vert
Subagent B : n8n WF4 — nœud HTTP → /api/setter-trigger
  → DONE + exécution test MCP n8n avec output JSON valide
Parent : vérification end-to-end (setter déclenché → Sheets mis à jour)
```

## Règles absolues

- Jamais deux subagents en parallèle sur le même layer
- Jamais marquer TASK-v4 en `✅` sur `DONE` subagent seul — parent doit confirmer
- `DONE_WITH_CONCERNS` : le concern doit apparaître dans TASK-v4-XXX avant `✅`
- Isolation campagne maintenue par chaque subagent — vérifier en review

## Intégration avec autres skills

- `local-verification-before-completion` — s'applique au parent après chaque `DONE`
- `local-test-driven-development` — chaque subagent écrit tests avant code
- `local-systematic-debugging` — si subagent reporte `BLOCKED` sur bug
