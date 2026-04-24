# TASKS — Lead Qualifier Dashboard

> Fichier maître des tâches. Chaque tâche a son propre fichier détaillé dans ce dossier.
> Chemin app : `clients/lead-gen/02-Implementation/interface/lead-qualifier-dashboard/`

---

## Statuts

| Symbole | Signification |
|---|---|
| ✅ | Complété |
| 🔄 | En cours |
| ⏳ | À faire (priorité normale) |
| 🔴 | À faire (bloquant / urgent) |
| 💡 | Backlog |

---

## Phase 1 — MVP (Terminé)

| # | Tâche | Statut |
|---|---|---|
| 001 | Setup Google Sheets (4 onglets) | ✅ |
| 002 | Google Cloud Service Account | ✅ |
| 003 | Configurer Resend + domaine outreach.kamesai.com | ✅ |
| 004 | Initialiser projet Next.js 15 | ✅ |
| 005 | lib/sheets.ts — API Google Sheets | ✅ |
| 006 | API Route GET/POST /api/campaigns | ✅ |
| 007 | API Route GET /api/campaigns/[id] | ✅ |
| 008 | API Route GET /api/leads + /api/leads/[id] | ✅ |
| 009 | API Route GET /api/stats | ✅ |
| 010 | API Route GET /api/export (CSV) | ✅ |
| 011 | Page /dashboard — liste campagnes + KPIs | ✅ |
| 012 | Page /dashboard/campaigns/new — formulaire | ✅ |
| 013 | Page /dashboard/campaigns/[id] — détail + tableau leads | ✅ |
| 014 | Page /dashboard/campaigns/[id]/leads/[id] — fiche lead | ✅ |
| 015 | Layout sidebar + design system complet | ✅ |

---

## Phase 2 — Cockpit (En cours)

Objectif : transformer le dashboard de "visualisation" en "pilotage".
Ordre d'implémentation par ROI décroissant.

| # | Tâche | Priorité | Statut | Fichier |
|---|---|---|---|---|
| 020 | Vue "Leads chauds" sur dashboard home | 🔴 P1 | ✅ | [TASK-020.md](./TASK-020.md) |
| 021 | Boutons actions + indicateur pipeline campagne | 🔴 P1 | ✅ | [TASK-021.md](./TASK-021.md) |
| 022 | Afficher raison_score sur fiche lead | 🟠 P2 | ✅ | [TASK-022.md](./TASK-022.md) |
| 023 | Filtres statut + score sur tableau leads | 🟠 P2 | ✅ | [TASK-023.md](./TASK-023.md) |
| 024 | Sidebar enrichie (campagnes actives + badge chauds) | 🟡 P3 | ✅ | [TASK-024.md](./TASK-024.md) |
| 025 | Funnel visuel par campagne (barre de progression) | 🟡 P3 | ✅ | [TASK-025.md](./TASK-025.md) |

---

## Phase 3 — Production (À planifier)

| # | Tâche | Priorité | Statut | Fichier |
|---|---|---|---|---|
| 016 | Déploiement Vercel (CI/CD + env vars) | 🔴 | ⏳ | [TASK-016.md](./TASK-016.md) |
| 017 | Timeline email (onglet Email_Events GSheet) | 🟠 | ✅ | [TASK-017.md](./TASK-017.md) |
| 018 | Actions manuelles sur leads (changer statut, forcer relance) | 🟠 | ⏳ | [TASK-018.md](./TASK-018.md) |
| 019 | Mode mobile responsive | 🟡 | ✅ | [TASK-019.md](./TASK-019.md) |

---

## Phase 4 — CRM Upgrade (Vision cible)

Objectif : faire evoluer le dashboard lead-gen vers un vrai CRM commercial Flinty, email-first, avec calendrier, data, timeline conversations et inbox centralisee.

| # | Tâche | Priorité | Statut | Fichier |
|---|---|---|---|---|
| 026 | Templates v2 avec support video + preview enrichie | 🔴 P1 | ✅ | [TASK-026.md](./TASK-026.md) |
| 027 | Calendar / Meetings en lecture seule via Calendly | 🔴 P1 | ✅ | [TASK-027.md](./TASK-027.md) |
| 028 | Onglet Data business + marketing + commercial | 🔴 P1 | ✅ | [TASK-028.md](./TASK-028.md) |
| 029 | Timeline conversations unifiee sur fiche lead | 🟠 P2 | ✅ | [TASK-029.md](./TASK-029.md) |
| 030 | Unified Inbox en lecture centralisee | 🟡 P3 | ✅ | [TASK-030.md](./TASK-030.md) |

---

## Contexte technique

**Fichiers clés à connaître avant de modifier quoi que ce soit :**

```
lib/sheets.ts                               ← Types + parsers (Campaign, Lead)
app/dashboard/layout.tsx                    ← Sidebar (Server Component, lit les campagnes)
app/dashboard/page.tsx                      ← Dashboard home (KPIs + liste campagnes)
app/dashboard/templates/page.tsx            ← Vue Templates par campagne
app/dashboard/templates/TemplatesEditor.tsx ← Editeur templates V1 deja en place
app/dashboard/campaigns/[campaign_id]/page.tsx     ← Détail campagne + tableau leads
app/dashboard/campaigns/[campaign_id]/leads/[lead_id]/page.tsx  ← Fiche lead
app/api/campaigns/route.ts                  ← GET liste + POST création
app/api/campaigns/[id]/route.ts             ← GET détail avec leads filtrés
app/api/leads/route.ts                      ← GET leads (filtrable ?campaign_id=)
app/api/stats/route.ts                      ← KPIs agrégés
app/api/templates/route.ts                  ← Sauvegarde templates V1
lib/email-templates.ts                      ← Modèle de templates email
```

**Design system à respecter :**
- Background: `bg-black`
- Cards: `bg-zinc-950 border border-zinc-800 rounded-xl`
- Texte: `text-white` / `text-zinc-400` / `text-zinc-500`
- Accent: `text-orange-400` / `bg-gradient-to-r from-orange-500 to-pink-500`
- Badges: `bg-[color]/20 text-[color]-400` format

**n8n webhooks staging :**
- WF1 (Génération) : `https://staging-n8n.kamesai.com/webhook/kai-v2-gen-leads`
- WF2 (Qualification) : `https://staging-n8n.kamesai.com/webhook/kames-qualify-leads`
- WF3 (Email J0) : `https://staging-n8n.kamesai.com/webhook/kames-send-email-j0`
- WF4 (Webhooks Resend) : `https://staging-n8n.kamesai.com/webhook/kames-resend-events`
