# Flinty — B2B Cold Email Automation Dashboard

> Open-source cold outreach automation stack for solopreneurs and small agencies  
> Next.js 15 · Google Sheets · n8n · Claude Sonnet (via OpenRouter)

---

## What it does

Flinty is a self-hosted B2B lead generation and cold email automation tool. It finds local leads via Google Maps, scores them with AI, sends cold email sequences via Resend, and tracks everything in a real-time Next.js dashboard — with Google Sheets as the database.

**Zero-SQL, zero custom backend**: Google Sheets stores everything, n8n orchestrates workflows, Claude scores leads.

---

## Pipeline complet

```
Création de campagne (secteur + ville + offre)
        ↓
WF1 — Génération leads via Google Maps Places API  →  onglet Leads_Raw
        ↓
WF2 — Qualification IA (Firecrawl scrape + Claude score /100)  →  Leads_Qualified
        ↓
WF3 — Email J0 via Resend (outreach.kamesai.com)
        ↓
WF5 — Relances automatiques J+3 et J+7
        ↓
WF4 — Webhooks Resend (opened / clicked / replied / bounced)
        ↓
WF6 — Calcul KPIs toutes les heures  →  onglet Campagnes
        ↓
Dashboard — Affichage temps réel depuis Google Sheets
```

---

## Stack

| Couche | Techno |
|--------|--------|
| UI | Next.js 15 App Router · TypeScript · Tailwind CSS |
| Primitives UI | Radix UI · Framer Motion · Lucide |
| Tests | Vitest · Playwright |
| Base de données | Google Sheets API v4 (service account) |
| Emails | Resend — domaine `outreach.kamesai.com` |
| Scoring IA | Claude Sonnet via OpenRouter |
| Automatisation | n8n self-hosted |
| Déploiement | Vercel |

---

## Modules du dashboard

| Module | Description |
|--------|-------------|
| **Campaigns** | Vue d'ensemble des campagnes, statuts, KPIs par ligne |
| **Leads** | Liste qualifiée avec score IA, statut email, tri drag-and-drop |
| **Inbox / Replies** | Gestion des réponses entrantes, setter view |
| **Meetings** | Suivi des rendez-vous via Calendly |
| **Templates** | Bibliothèque d'emails et séquences de relances |
| **LinkedIn** | Suivi santé profil + actions LI |
| **Frank** | Brief quotidien IA — récapitulatif et recommandations |
| **Stats** | KPIs globaux, sparklines, taux d'ouverture/réponse |
| **Monitoring** | Santé des workflows n8n et webhooks |

---

## Lancer en local

```bash
cd .workflows/02-Implementation/interface/lead-qualifier-dashboard
npm install
npm run dev        # http://localhost:3000
npm run test       # suite Vitest
npm run test:e2e   # Playwright
```

### Variables d'environnement requises (`.env.local`)

```env
GOOGLE_INDEX_SHEET_ID=
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

OPENROUTER_API_KEY=

N8N_BASE_URL=
N8N_STAGING_URL=
N8N_WF1_WEBHOOK=
N8N_WF2_WEBHOOK=
N8N_WF3_WEBHOOK=
N8N_WF4_WEBHOOK=

RESEND_API_KEY=
RESEND_FROM=
```

---

## Architecture Google Sheets

```
Index Sheet  (GOOGLE_INDEX_SHEET_ID)
└── Campagnes  — liste et KPIs de toutes les campagnes

Par campagne (GSheet enfant créé automatiquement) :
├── Leads_Raw        — leads bruts Google Maps
├── Leads_Qualified  — leads scorés par Claude
├── Emails           — statuts d'envoi et tracking Resend
└── Campagne         — KPIs agrégés de la campagne
```

---

## Déploiement

Le projet déploie automatiquement sur Vercel depuis la branche `main`.  
Les variables d'environnement sont gérées via `vercel env`.

---

## License

MIT — Thomas Callendreau (Kames AI)
