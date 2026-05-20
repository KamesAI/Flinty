---
description: Next.js dashboard Flinty — API, lib, UI, Sheets, n8n, BLOCs
paths:
  - ".workflows/02-Implementation/interface/lead-qualifier-dashboard/**/*.ts"
  - ".workflows/02-Implementation/interface/lead-qualifier-dashboard/**/*.tsx"
---

# Flinty — dashboard (lead-qualifier-dashboard)

**Chemin** : `.workflows/02-Implementation/interface/lead-qualifier-dashboard/`  
Commandes : `npm run dev` | `npm run test` | `npm run build` | `npm run lint`

## Stack

Next.js 15.1.7 App Router, TypeScript, Tailwind (thème light custom — **pas shadcn**), Vitest, Framer Motion, Lucide, Kanban `@dnd-kit/*`, googleapis Sheets, Claude Sonnet 4.5 via **OpenRouter**, n8n (staging / prod), Resend, Vercel.

## TDD

Pour tout `lib/*.ts` et `app/**/*.ts` : **test Vitest avant code** (Rouge → Vert → Refactor). `npm run test` depuis ce dossier.

## Architecture v3 — BLOCs

| BLOC | P | Description |
|------|---|----------------|
| **BLOC 0** | P0 | 1 GSheet par campagne (Index + enfants) |
| **BLOC 1** | P0 | Enrichissement IA 14 champs (OpenRouter) |
| **BLOC 3** | P0 | Générateur ICP |
| **BLOC 2** | P1 | Kanban 6 colonnes |
| **BLOC 4** | P1 | Dédup Contacts_Registry |
| **BLOC 5** | P1 | Export multi-format |

## Workflows n8n (rappel)

| WF | Rôle |
|----|------|
| **WF1** | Lead gen → Leads_Raw + GSheet enfant |
| **WF2** | Qualification → Qualified / Rejected |
| **WF3** | Email J0 Resend |
| **WF4** | Webhooks Resend → statuts |
| **WF5** | Relances J+3 / J+7 |
| **WF6** | Stats horaires |

**Callbacks Index** : le dashboard envoie des URLs de rappel au webhook n8n.

- **WF1** : `POST /api/campaigns` → `generation_callback_url` (`getPublicOrigin`, repli `VERCEL_URL`). Fin : n8n `POST` → `generation-complete`. Sans `N8N_WF1_WEBHOOK` : **503**, Index en **`paused`** (évite blocage infini `generating`).
- **Dépannage** campagne bloquée `generating` : vérifier env Vercel, exécutions WF1, nœud HTTP vers `generation_callback_url`. Secours : `POST /api/campaigns/<id>/generation-complete` avec `{ "raw_count": <n>, "status": "completed" }`.
- **WF2** : `POST /api/campaigns/[id]/qualify` → `qualification_callback_url` ; fin : `POST` → `/api/campaigns/{id}/qualification-complete` avec `{ "status": "completed"|"failed", "qualified_count": <n> }`.

## GSheet enfant (4 onglets)

`Leads_Raw`, `Leads_Qualified`, `Leads_Rejected`, `Config`.

## MCP utiles Flinty

n8n, GitHub, firecrawl, context7, Figma, Vercel, Notion — config utilisateur `~/.claude.json`.

## `lib/` (exemples)

`sheets.ts`, `campaigns`, `openrouter`, `cache`, `rate-limit`, `qualified-leads`, `api-schemas`, etc.
