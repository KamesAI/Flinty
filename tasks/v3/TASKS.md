# Implementation Tasks: Flinty v3

## Overview
- **Total Tasks**: 22
- **Estimated Total Time**: 48–62h (~S1→S4, avril–mai 2026)
- **Generated From**: PRD v2.0 (v3 produit), ARCHI v2.0
- **Generated On**: 2026-04-15

## Progress Tracker

**Owner Legend** : 🧑 Toi (accès Google Drive/Sheets, console Vercel, UI n8n, comptes tiers) · 🤖 Claude (code repo, tests, fichiers locaux) · 🤝 Mixte

| # | Task | Owner | Priority | Status | Dependencies | Est. Time |
|---|------|-------|----------|--------|--------------|-----------|
| 001 | Provision Flinty Index GSheet + env vars | 🧑 | P0 | ✅ Done | None | 1.5h |
| 002 | `lib/sheets.ts` + `lib/campaigns.ts` — résolution sheet_id via Index | 🤖 | P0 | ✅ Done | 001 | 2h |
| 003 | WF1 refonte — création GSheet enfant + écriture Index | 🤖 | P0 | ✅ Done | 001 | 3h |
| 004 | API `/api/campaigns` GET/POST sur Index | 🤖 | P0 | ✅ Done | 002, 003 | 2h |
| 005 | API `/api/campaigns/[id]` GET détail via Index→enfant | 🤖 | P0 | ✅ Done | 002 | 1.5h |
| 006 | WF6 refonte — loop Index + update stats maître | 🤖 | P0 | ✅ Done | 003 | 2h |
| 007 | WF2 — prompt Claude Opus 4.6 14 champs JSON + lecture Config.icp_md | 🤖 | P0 | ✅ Done | 003 | 3h |
| 008 | WF2 — Code node Web Quality Score (post-Firecrawl) | 🤖 | P0 | ✅ Done | 007 | 1.5h |
| 009 | WF2 — IF branche Qualified/Rejected + onglet Leads_Rejected | 🤖 | P0 | ✅ Done | 007 | 2h |
| 010 | UI fiche lead enrichie (hook, buying_signal, growth, web_quality) | 🤖 | P0 | ✅ Done | 005, 007 | 3h |
| 011 | `lib/openrouter.ts` + API `/api/campaigns/generate-icp` | 🤖 | P0 | ✅ Done | 001 | 2h |
| 012 | UI `/dashboard/campaigns/new` — chat séquentiel 8 questions | 🤖 | P0 | ✅ Done | 011 | 3h |
| 013 | Preview Markdown éditable + POST campagne avec icp_md | 🤖 | P0 | ✅ Done | 011, 012 | 2h |
| 014 | WF1 — écriture `icp_md` dans Config enfant | 🤖 | P0 | ✅ Done | 003, 013 | 1h |
| 015 | Install `@dnd-kit/*` + PATCH `/api/leads/[id]/status` | 🤖 | P1 | ✅ Done | 002 | 2h |
| 016 | Page Kanban `/dashboard/campaigns/[id]/kanban` + tab nav | 🤖 | P1 | ✅ Done | 015 | 3h |
| 017 | Drag & drop + optimistic UI Kanban | 🤖 | P1 | ✅ Done | 016 | 2.5h |
| 018 | Contacts_Registry + WF1 filtre doublons domaine | 🤖 | P1 | ✅ Done | 003 | 2h |
| 019 | WF3 append Contacts_Registry après envoi J0 | 🤖 | P1 | ✅ Done | 018 | 1h |
| 020 | API `/api/campaigns/[id]/export` (csv/json/instantly) + 3 boutons | 🤖 | P1 | ✅ Done | 005 | 2.5h |
| 021 | Rate limiting + validation Zod (generate-icp + POST campaigns) | 🤖 | P1 | ✅ Done | 004, 011 | 2h |
| 022 | Cache LRU sheet_id (TTL 5min) + tests E2E + déploiement v3 | 🤝 | P2 | ✅ Done (code + CI ; prod = Thomas) | 005, 017, 020 | 3h |

Status Legend: ⬜ Todo | 🔄 In Progress | ✅ Done | ⏸️ Blocked

### Répartition

- **🧑 Toi (1 tâche, ~1.5h)** : 001 — créer GSheet "Flinty Index", le dossier Drive, configurer les env vars Vercel (preview + prod) et partager les droits au service account. Seule étape qui nécessite tes accès Google/Vercel.
- **🤖 Claude (20 tâches, ~44h)** : tout le reste — code Next.js (002, 004, 005, 010–013, 015–017, 020, 021) **et** workflows n8n via MCP (003, 006, 007, 008, 009, 014, 018, 019).
- **🤝 Mixte (1 tâche, ~3h)** : 022 — je code cache + E2E + bascule workflows n8n prod via MCP ; tu valides le smoke test (1 campagne réelle envoyée).

## Dependency Graph

```
[001: Index + env] ─┬─► [002: lib sheets/campaigns] ─┬─► [004: API campaigns]
                    │                                ├─► [005: API [id]]
                    └─► [003: WF1 refonte] ─────────┬─► [006: WF6 stats]
                                                    ├─► [007: WF2 14 champs] ─┬─► [008: Web Quality]
                                                    │                         ├─► [009: IF Qualified/Rejected]
                                                    │                         └─► [010: Fiche lead UI]
                                                    ├─► [014: WF1 icp_md] ◄── [013]
                                                    └─► [018: Dedup] ──► [019: WF3 append]

[001] ─► [011: lib anthropic + API ICP] ─► [012: Chat UI] ─► [013: Preview + POST]

[002] ─► [015: dnd-kit + PATCH] ─► [016: Page Kanban] ─► [017: Drag drop]
[005] ─► [020: Export]
[004,011] ─► [021: Rate limiting]
[005,017,020] ─► [022: Cache + E2E + deploy]
```

## Milestones

### Milestone S1 : BLOC 0 — Fondation GSheet par campagne (Tasks 001–006)
- [x] Flinty Index opérationnel + GSheet enfant créé par WF1
- [x] API routes lisent l'Index puis l'enfant
- [x] WF6 met à jour les stats dans le maître

### Milestone S2 : BLOC 1 + BLOC 5 — Enrichissement + Export (Tasks 007–010, 020)
- [x] Claude Opus 4.6 retourne 14 champs, scoring piloté par ICP
- [x] Leads_Rejected tracés avec rejection_reason
- [x] Export CSV / JSON / Instantly opérationnel

### Milestone S3 : BLOC 3 — ICP chat + finitions fiche lead (Tasks 011–014)
- [x] `lib/openrouter.ts` + `POST /api/campaigns/generate-icp` opérationnel
- [ ] Chat 8 questions → ICP.md → preview éditable → lancement WF1
- [ ] icp_md injecté dans Config du GSheet enfant

### Milestone S4 : BLOC 2 + BLOC 4 — Kanban + Dedup (Tasks 015–019)
- [ ] Kanban drag & drop persiste statut dans GSheet enfant
- [ ] Déduplication inter-campagnes via Contacts_Registry

### Milestone Go-live v3 (Tasks 021–022)
- [x] Rate limiting + validation Zod en place
- [x] Cache sheet_id + tests E2E verts (Vitest + Playwright HTTP + workflow GitHub)
- [ ] Déploiement prod Vercel (Thomas)

## Notes

- v1 déjà en prod : garder les workflows v1 intacts jusqu'à validation v3 staging.
- Tests WF1/WF2 en staging-n8n avant bascule agent.kamesai.com.
- Coût Opus : ~$0.01/lead — valider budget avant ouverture >5 campagnes.