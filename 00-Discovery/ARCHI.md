# Technical Architecture : Kames CRM

> Version 1.0 — 2026-03-11
> Basé sur le PRD.md validé le 2026-03-11

---

## Architecture Overview

**Philosophy**
Google Sheets comme base de données pour éliminer toute infrastructure backend — données directement accessibles par Thomas sans passer par l'application. n8n gère 100% de l'automatisation (génération, qualification, emails, stats). Le dashboard Next.js est un outil de lecture/déclenchement, pas une source de vérité.

**Tech Stack Summary**
- **Framework** : Next.js 15 (App Router) — TypeScript
- **Déploiement** : Vercel (CI/CD depuis GitHub)
- **Base de données** : Google Sheets API v4 (pas de DB SQL — décision MVP)
- **Automatisation** : n8n self-hosted Hetzner (staging + prod)
- **Email** : Resend (domaine outreach.kamesai.com)
- **Scoring IA** : Claude Haiku via OpenRouter
- **Scraping leads** : Firecrawl API
- **Source de leads** : Google Maps Places API
- **Analytics** : Aucune (MVP — KPIs calculés dans GSheet par WF6)

---

## Frontend Architecture

### Core Stack

- **Next.js 15 (App Router) + TypeScript**
  - Pourquoi : Server Components pour lire GSheet sans exposer les credentials côté client. App Router = layouts imbriqués sans duplication.
  - Trade-off : Pas de Server Actions (architecture simple avec API Routes suffisante).

- **Tailwind CSS (sans librairie UI externe)**
  - Pourquoi : Design system custom (fond noir, accent orange→pink). shadcn/ui non utilisé — composants écrits from scratch pour contrôle total.
  - Trade-off : Plus de code à maintenir mais design 100% maîtrisé.

- **Pas de state management global**
  - Pourquoi : Outil solo, pas d'état partagé complexe. Server Components + fetch natif suffisent.
  - Trade-off : Pas de cache côté client — chaque navigation refetch GSheet.

### Design System

```
Couleurs :
  Background       : #000000
  Cards            : #09090b (zinc-950)
  Bordures         : #27272a (zinc-800)
  Texte principal  : #ffffff
  Texte secondaire : #a1a1aa (zinc-400)
  Accent           : #f97316 (orange-500)
  Gradient CTA     : from-orange-500 to-pink-500

Composants :
  Cards KPI   : bg-zinc-950 border border-zinc-800 rounded-xl p-4-5
  Bouton CTA  : bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg
  Inputs      : bg-zinc-900 border border-zinc-700 focus:border-orange-500
  Tables      : zinc-950, hover bg-zinc-900, séparateurs zinc-900
  Badges      : px-2 py-1 rounded text-xs font-medium (couleurs sémantiques)
```

### Structure des fichiers

```
app/
├── layout.tsx                              → Layout racine
├── page.tsx                                → Redirect vers /dashboard
├── dashboard/
│   ├── layout.tsx                          → Sidebar (256px) + slot content
│   ├── page.tsx                            → Liste campagnes + KPIs globaux
│   ├── campaigns/
│   │   ├── new/
│   │   │   └── page.tsx                   → Formulaire création campagne
│   │   └── [campaign_id]/
│   │       ├── page.tsx                   → Détail campagne + tableau leads
│   │       └── leads/
│   │           └── [lead_id]/
│   │               └── page.tsx           → Fiche lead complète
│   └── vibes/                             → (expérimental)
├── api/
│   ├── campaigns/
│   │   ├── route.ts                       → GET liste / POST créer
│   │   └── [id]/route.ts                  → GET détail + leads filtrés
│   ├── leads/route.ts                     → GET tous leads (filtres optionnels)
│   ├── stats/route.ts                     → GET KPIs globaux agrégés
│   └── export/route.ts                    → GET export CSV
└── vibes/
    └── page.tsx
```

---

## Backend Architecture

### Base de données — Google Sheets

**Choix** : Google Sheets API v4 (pas de Prisma, pas de SQL)
- Pourquoi : Thomas accède aux données directement dans Sheets. Migration triviale vers une vraie DB plus tard. Parfait pour le volume solo (centaines de leads, pas des millions).
- Trade-off : Pas de requêtes SQL, pas de transactions, latence API (200-500ms/requête). Limite à ~10 requêtes concurrentes.
- Alternative écartée : Supabase (overkill MVP, coût, maintenance)

**Service Account** : `lead-qualifier-service@lead-qualifier-mvp.iam.gserviceaccount.com`
**Spreadsheet ID** : `14Uf6GlvmlCxzaFxENExW-FkCV0CZNQ_7zwzik9SAelY`

#### Schéma Google Sheets

```
Onglet : Campagnes
─────────────────────────────────────────────────────
campaign_id | nom | secteur | localisation | offre_kames
taille_equipe | date_création | statut | total_leads_raw
total_leads_qualified | emails_envoyés | taux_ouverture | taux_réponse

Valeurs statut : generating | active | paused | scheduled | completed

Onglet : Leads_Raw
─────────────────────────────────────────────────────
lead_id | campaign_id | nom | site | ville | email
téléphone | secteur | taille_equipe | date_ajout

Onglet : Leads_Qualified
─────────────────────────────────────────────────────
lead_id | campaign_id | nom | site | ville | score
email | téléphone | prénom | poste | secteur
taille_equipe | has_ia_services | statut_email | last_email_sent_at

Valeurs statut_email :
  new | contacted | relance_1 | relance_2
  opened | clicked | replied | bounced | disqualified

Onglet : Config
─────────────────────────────────────────────────────
Paramètres globaux (clés/valeurs)

Onglet : Email_Templates  [← à alimenter depuis email-templates-library.md]
─────────────────────────────────────────────────────
campaign_id | touch | subject | body | status

Onglet : Email_Events  [← P1 — non implémenté]
─────────────────────────────────────────────────────
event_id | lead_id | campaign_id | touch | event_type
event_date | email_subject
```

### API Routes

| Route | Méthode | Description | Source données |
|---|---|---|---|
| `/api/campaigns` | GET | Liste toutes les campagnes | GSheet `Campagnes` |
| `/api/campaigns` | POST | Crée campagne + déclenche WF1 | GSheet + n8n webhook |
| `/api/campaigns/[id]` | GET | Détail campagne + leads qualifiés filtrés | GSheet `Leads_Qualified` |
| `/api/leads` | GET | Tous leads qualifiés (filtres optionnels) | GSheet `Leads_Qualified` |
| `/api/stats` | GET | KPIs globaux agrégés | GSheet `Campagnes` |
| `/api/export` | GET | Export CSV des leads | GSheet `Leads_Qualified` |

**Pattern API** : Server-side uniquement. Les credentials Google ne quittent jamais le serveur. Pas d'authentification utilisateur (outil solo local).

---

## Automatisation n8n

### Workflows actifs (staging-n8n.kamesai.com)

| ID | Nom | Trigger | Rôle | Statut |
|---|---|---|---|---|
| `OnpGdsIZQShrN4P1` | WF1 — Génération Leads | Webhook POST `/api/campaigns` | Google Maps Places API → `Leads_Raw` | ✅ Staging |
| `01BB4q4j1buvWRC6` | WF2 — Qualification | Webhook POST (déclenché par WF1) | Firecrawl scrape + Claude score → `Leads_Qualified` | ✅ Staging |
| `dfe1jIPlZA10dqJK` | WF3 — Email J0 | Webhook POST (déclenché par WF2) | Resend email J0 → `statut_email = contacted` | ✅ Staging |
| `oCViFcjPo2nNUjlR` | WF4 — Webhooks Resend | Webhook POST (Resend) | MAJ statuts opened/clicked/replied/bounced | ✅ Staging |
| `7re2WS3ghacqHsLE` | WF5 — Relances Auto | Schedule horaire | J+3 et J+7 automatiques selon `last_email_sent_at` | ✅ Staging |
| `oWm8alnIlzS9UCTd` | WF6 — Calcul Stats | Schedule horaire | Agrège KPIs dans onglet `Campagnes` | ✅ Staging |

### Data flow complet

```
[Dashboard] POST /api/campaigns
    → n8n WF1 webhook
        → Google Maps Places API
        → Leads_Raw (GSheet)
        → n8n WF2 webhook
            → Firecrawl (scrape site)
            → Claude Haiku via OpenRouter (score /100)
            → Leads_Qualified (GSheet)
            → n8n WF3 webhook
                → Resend (email J0)
                → statut_email = contacted

[Schedule horaire] WF5
    → Lit Leads_Qualified où statut = contacted ET last_email_sent_at > 3j
    → Resend (email J+3) → statut_email = relance_1
    → Lit Leads_Qualified où statut = relance_1 ET last_email_sent_at > 7j
    → Resend (email J+7) → statut_email = relance_2

[Resend webhook] → WF4
    → MAJ statut_email (opened / clicked / replied / bounced)

[Schedule horaire] WF6
    → Agrège taux_ouverture, taux_réponse dans Campagnes
```

---

## Intégrations tierces

### Google Maps Places API
- Usage : Génération des leads bruts (nom, adresse, site, téléphone) par secteur + ville
- Implémentation : WF1 n8n — Node HTTP Request vers Places API
- Coût : Gratuit tier jusqu'à 5000 requêtes/mois

### Firecrawl
- Usage : Scraping site web de chaque lead pour extraire contexte métier
- Implémentation : WF2 n8n — Node Firecrawl MCP
- Coût : 500 pages/mois gratuit — suffisant pour MVP

### Claude Haiku via OpenRouter
- Usage : Scoring des leads /100 basé sur le contenu scrapé
- Implémentation : WF2 n8n — Node HTTP Request vers OpenRouter
- Coût : ~$0.001/lead (Haiku = modèle économique)

### Resend
- Usage : Envoi des emails cold outreach (J0, J+3, J+7)
- Domaine : outreach.kamesai.com
- Implémentation : WF3/WF5 n8n — Node Resend
- Webhooks : WF4 reçoit opened/clicked/replied/bounced
- Coût : 3000 emails/mois gratuit

---

## DevOps & Déploiement

### Environnements

| Environnement | URL | n8n | Usage |
|---|---|---|---|
| Local dev | localhost:3000 | staging-n8n.kamesai.com | Développement |
| Production | kamesai.com (Vercel) | agent.kamesai.com | Live |

### CI/CD

```
Push GitHub (main)
  → Vercel build automatique
  → Deploy prod si build OK
```

### Variables d'environnement

```bash
# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=lead-qualifier-service@lead-qualifier-mvp.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=...
GOOGLE_SPREADSHEET_ID=14Uf6GlvmlCxzaFxENExW-FkCV0CZNQ_7zwzik9SAelY

# n8n webhooks
N8N_WEBHOOK_WF1=https://[env]-n8n.kamesai.com/webhook/...

# Pas d'auth utilisateur (outil solo)
```

---

## Sécurité

- [x] Credentials Google côté serveur uniquement (variables d'environnement Vercel)
- [x] Pas d'exposition de clés API côté client
- [x] Pas d'authentification (outil interne solo — accès par URL directe)
- [ ] Rate limiting sur `/api/campaigns` POST (à implémenter avant prod)
- [ ] Validation des inputs du formulaire avec Zod (à renforcer)

---

## Chemins de migration (post-MVP)

| Déclencheur | Migration |
|---|---|
| >1000 leads/mois ou latence GSheet >1s | Migrer vers PostgreSQL (Neon) + Prisma |
| Accès multi-utilisateurs | Ajouter authentification (Better Auth) |
| >5 campagnes actives simultanées | Redis pour le cache des KPIs |
| Besoin d'analyse temporelle fine | Migrer Email_Events vers une vraie table |

---

## Open Questions

- [ ] Intégrer `email-templates-library.md` comme source pour le select "Template email" du formulaire de création de campagne ?
- [ ] Ajouter validation Zod sur le formulaire de création de campagne (actuellement minimal)
- [ ] Rate limiting sur `/api/campaigns` POST avant déploiement prod ?
- [ ] Onglet `Email_Templates` dans GSheet : structure à aligner avec `email-templates-library.md`

---

## Prochaines étapes

1. [ ] **Task 016** : Déployer sur Vercel (variables d'environnement à configurer)
2. [ ] Créer onglet `Email_Events` dans GSheet + alimenter via WF3/WF4/WF5
3. [ ] Implémenter timeline email sur la fiche lead (Feature P1 du PRD)
4. [ ] Relier `email-templates-library.md` au select du formulaire de campagne
5. [ ] Migrer workflows staging → prod (agent.kamesai.com)
