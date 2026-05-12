# Technical Architecture : Flinty

> Version 2.0 (v3 produit) — 2026-04-15
> Basé sur `PRD.md` v2 (15 avril 2026)
> Source d'implémentation : `docs/plans/flinty-plan-v3.md`

---

## Architecture Overview

**Architecture Philosophy**
Isolation par campagne > structure centralisée : chaque campagne vit dans son propre GSheet enfant pour garantir RGPD et performance. Un GSheet maître "Flinty Index" sert de registre et ne stocke que des références (sheet_id) + des stats agrégées. Claude Opus 4.6 devient le moteur d'intelligence commerciale (scoring + ICP gen + hook gen) — on quitte l'approche Haiku générique pour une IA pilotée par l'ICP de chaque campagne.

**Tech Stack Summary**
- **Framework** : Next.js 15 (App Router) — TypeScript
- **Déploiement** : Vercel
- **Base de données** : Google Sheets API v4 (1 maître Flinty Index + N enfants, 1 par campagne)
- **Automatisation** : n8n self-hosted Hetzner (staging + prod)
- **Email** : Resend (domaine outreach.kamesai.com)
- **IA scoring + ICP gen** : Claude Opus 4.6 (SDK `@anthropic-ai/sdk` côté Next.js, HTTP direct côté n8n)
- **Scraping** : Firecrawl API
- **Source de leads** : Google Maps Places API
- **Drag & drop Kanban** : `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`

---

## Frontend Architecture

### Core Stack

- **Next.js 15 (App Router) + TypeScript**
  - **Why** : Server Components pour lire Sheets sans exposer credentials. Layouts imbriqués pour la navigation par campagne.
  - **Trade-off** : Pas de Server Actions (API Routes suffisent pour l'architecture actuelle).

- **Tailwind CSS (design system custom)**
  - **Why** : Design 100% maîtrisé (fond noir, accent orange→pink). Pas de dépendance à shadcn.
  - **Trade-off** : Plus de CSS manuel, mais cohérence visuelle totale.

- **Pas de state management global**
  - **Why** : Outil solo, pas d'état partagé complexe. Server Components + fetch natif.
  - **Kanban** : `useState` local + mutation optimiste via PATCH API.

### Design System (inchangé depuis v1)

```
Couleurs :
  Background       : #000000
  Cards            : #09090b (zinc-950)
  Bordures         : #27272a (zinc-800)
  Texte principal  : #ffffff
  Texte secondaire : #a1a1aa (zinc-400)
  Accent           : #f97316 (orange-500)
  Accent v3        : #FFA318 (orange CTA)
  Gradient CTA     : from-orange-500 to-pink-500

Kanban — couleurs de colonnes :
  new       : border-zinc-600   / text-zinc-400
  contacted : border-blue-600   / text-blue-400
  opened    : border-yellow-600 / text-yellow-400
  clicked   : border-orange-500 / text-orange-400
  replied   : border-green-600  / text-green-400
  bounced   : border-red-600    / text-red-400
```

### Structure des fichiers (v3)

```
app/
├── layout.tsx
├── page.tsx                                → Redirect /dashboard
├── dashboard/
│   ├── layout.tsx                          → Sidebar + slot content
│   ├── page.tsx                            → Liste campagnes (depuis Flinty Index) + KPIs globaux
│   ├── campaigns/
│   │   ├── new/
│   │   │   └── page.tsx                   → [v3] Chat ICP (8 questions) + preview Markdown + lancement
│   │   └── [campaign_id]/
│   │       ├── page.tsx                   → Détail + tableau leads + export (3 formats) + onglets nav
│   │       ├── kanban/
│   │       │   └── page.tsx               → [v3 NEW] Kanban drag & drop 6 colonnes
│   │       └── leads/[lead_id]/page.tsx   → [v3] Fiche lead enrichie (hook, buying_signal, growth, web_score)
│   └── vibes/                              → expérimental
├── api/
│   ├── campaigns/
│   │   ├── route.ts                       → GET (lit Index) / POST (crée + déclenche WF1 avec icp_md)
│   │   ├── [id]/
│   │   │   ├── route.ts                   → GET détail + leads (résout sheet_id via Index)
│   │   │   └── export/route.ts            → [v3] GET ?format=csv|json|instantly
│   │   └── generate-icp/route.ts          → [v3 NEW] POST → Claude Opus 4.6 → icp_md
│   ├── leads/
│   │   ├── route.ts                       → GET (filtres optionnels)
│   │   └── [id]/status/route.ts           → [v3 NEW] PATCH (drag & drop Kanban)
│   └── stats/route.ts                     → GET KPIs globaux (agrégés Index)
└── lib/
    ├── sheets.ts                           → Client Google Sheets + helpers lecture Index/enfant
    ├── campaigns.ts                        → [v3] getCampaignById(id) → résolution sheet_id
    └── anthropic.ts                        → [v3 NEW] Client Anthropic + prompt ICP
```

---

## Backend Architecture

### Database — Google Sheets (architecture v3)

**Choix** : 1 GSheet maître "Flinty Index" + 1 GSheet enfant par campagne (auto-créé par WF1).

**Why** : Isolation RGPD totale (partage d'une campagne = partage d'UN fichier), performance garantie (<500 lignes par fichier), suppression d'une campagne = suppression d'un fichier entier.

**Trade-off** : Multiplication des fichiers Drive, logique de résolution `sheet_id` via Index à chaque requête (cachable plus tard si besoin). Latence API multipliée (2 appels : Index → enfant).

#### GSheet maître "Flinty Index"

```
Onglet : Campagnes (13 colonnes)
─────────────────────────────────────────────────────
campaign_id | nom | sheet_id | sheet_url | secteur | localisation
offre_kames | statut | date_création | total_leads_raw
total_leads_qualified | emails_envoyés | taux_réponse

Valeurs statut : new | active | paused | done

Onglet : Contacts_Registry (BLOC 4 — déduplication)
─────────────────────────────────────────────────────
domain | last_contacted_at | campaign_id | statut
```

#### GSheet enfant (1 par campagne — auto-créé par WF1)

```
Onglet : Leads_Raw
─────────────────────────────────────────────────────
lead_id | campaign_id | nom | site | ville | téléphone
rating | reviews_count | maps_url | found_at

Onglet : Leads_Qualified (21 colonnes — +7 vs v1)
─────────────────────────────────────────────────────
lead_id | campaign_id | nom | site | ville | score | score_reason
email | téléphone | prénom | poste | secteur | taille_equipe | has_ia_services
hiring_signals | growth_stage | buying_signal | personalized_hook
statut_email | web_quality_score | web_quality_signals

Statut_email : new | contacted | relance_1 | relance_2 | opened | clicked | replied | bounced | disqualified

Onglet : Leads_Rejected (NOUVEAU v3)
─────────────────────────────────────────────────────
lead_id | campaign_id | nom | site | score | rejection_reason | processed_at

Onglet : Config (paramètres + ICP de la campagne)
─────────────────────────────────────────────────────
param_key | param_value | description

Lignes pré-remplies par WF1 :
  icp_md          → contenu ICP.md généré par Claude
  secteur         → secteur cible
  villes          → liste villes (séparées virgule)
  taille_equipe   → taille cible
  poste_cible     → poste décideur
  offre_kames     → offre à proposer
  template_email  → template J0
  score_minimum   → seuil qualification (défaut 60)
```

### API Routes

| Route | Méthode | Description | Source |
|---|---|---|---|
| `/api/campaigns` | GET | Liste campagnes depuis Index | GSheet maître `Campagnes` |
| `/api/campaigns` | POST | Crée campagne + déclenche WF1 avec `icp_md` | POST webhook n8n WF1 |
| `/api/campaigns/[id]` | GET | Détail + leads qualifiés (résout sheet_id via Index) | Index → GSheet enfant `Leads_Qualified` |
| `/api/campaigns/[id]/export` | GET | Export CSV / JSON / Instantly (param `?format=`) | GSheet enfant |
| `/api/campaigns/generate-icp` | POST | Génère ICP.md via Claude Opus 4.6 | Anthropic API |
| `/api/leads` | GET | Tous leads (filtres optionnels) | GSheets enfants |
| `/api/leads/[id]/status` | PATCH | Update `statut_email` (drag & drop Kanban) | GSheet enfant (sheet_id dans body) |
| `/api/stats` | GET | KPIs globaux agrégés | GSheet maître `Campagnes` |

**Pattern API** : Server-side uniquement. Credentials Google côté serveur. Pas d'auth utilisateur (outil solo + partage clients via droits GSheet natifs).

---

## Automatisation n8n (v3)

### Workflows modifiés par la v3

| ID | Nom | Trigger | Rôle | Changements v3 |
|---|---|---|---|---|
| `OnpGdsIZQShrN4P1` | WF1 — Génération Leads | Webhook POST `/api/campaigns` | Crée GSheet enfant + écrit Index + scrape Maps → Leads_Raw | **Refonte majeure** : Google Drive API pour créer enfant, écrit Index, écrit icp_md dans Config, filtre via Contacts_Registry |
| `01BB4q4j1buvWRC6` | WF2 — Qualification | Webhook POST (déclenché par WF1) | Firecrawl + scoring Claude → Qualified ou Rejected | **Refonte majeure** : lit Config.icp_md, prompt Opus 4.6 14 champs, branche IF → Qualified/Rejected, Web Quality Score (code node) |
| `dfe1jIPlZA10dqJK` | WF3 — Email J0 | Webhook POST (WF2) | Resend + append Contacts_Registry | Append domain dans Contacts_Registry (BLOC 4) |
| `oCViFcjPo2nNUjlR` | WF4 — Webhooks Resend | Webhook (Resend) | MAJ statut_email | `sheet_id` dynamique (résolu via Index sur campaign_id) |
| `7re2WS3ghacqHsLE` | WF5 — Relances Auto | Schedule horaire | J+3 / J+7 | Itère sur l'Index, `sheet_id` dynamique |
| `oWm8alnIlzS9UCTd` | WF6 — Calcul Stats | Schedule horaire | Agrège stats dans Index | Loop sur Index → lit chaque enfant → update colonnes J-M du maître |

### Data flow v3

```
[Dashboard] Chat ICP (8 Q) → POST /api/campaigns/generate-icp
    → Anthropic Claude Opus 4.6
    → icp_md retourné au front → preview Markdown éditable

[Dashboard] Validation → POST /api/campaigns { icp_md, ... }
    → n8n WF1 webhook
        → [v3] Code node : génère campaign_id + sheet_name
        → [v3] Google Drive API : crée GSheet enfant
        → [v3] Google Sheets API : crée 4 onglets + headers
        → [v3] Google Sheets API : écrit icp_md dans Config (enfant)
        → [v3] Google Sheets API : append ligne dans Flinty Index (maître)
        → Google Maps Places API (loop villes × secteurs)
        → [v3] Dedupe via Contacts_Registry (lecture maître)
        → Leads_Raw (enfant)
        → n8n WF2 webhook { campaign_id, sheet_id }
            → [v3] Google Sheets : lit Config.icp_md + score_minimum (enfant)
            → Firecrawl (scrape site)
            → [v3] Code node : calcule web_quality_score
            → [v3] Claude Opus 4.6 (HTTP direct, 14 champs JSON)
            → [v3] IF score ≥ score_minimum
                → Leads_Qualified (enfant, 21 colonnes)
                → n8n WF3 webhook
                    → Resend email J0
                    → statut_email = contacted (enfant)
                    → [v3] Append Contacts_Registry (maître)
            → ELSE
                → [v3] Leads_Rejected (enfant, avec rejection_reason)

[Schedule horaire] WF5
    → Lit Index → pour chaque campagne active :
        → Lit Leads_Qualified (enfant) où statut_email = contacted ET J+3
        → Resend (J+3) → statut_email = relance_1
        → idem relance_2 à J+7

[Resend webhook] → WF4
    → Résout sheet_id via Index (à partir de campaign_id dans l'email tag)
    → MAJ statut_email (opened / clicked / replied / bounced)

[Schedule horaire] WF6
    → Loop sur Index → pour chaque campagne :
        → Compte Leads_Raw, Leads_Qualified, emails envoyés, taux de réponse
        → Update colonnes J-M du maître
```

---

## Intégrations tierces

### Google Drive API (NOUVEAU v3)
- **Usage** : WF1 crée dynamiquement un GSheet enfant par campagne
- **Implémentation** : n8n Node HTTP Request vers `POST /drive/v3/files` avec `mimeType: application/vnd.google-apps.spreadsheet`
- **Coût** : Gratuit (quota large)
- **Env var** : `GOOGLE_DRIVE_FOLDER_ID` (dossier parent où créer les enfants)

### Anthropic Claude Opus 4.6 (NOUVEAU v3)
- **Usage 1 — Scoring WF2** : analyse contenu scrapé + ICP → 14 champs JSON (score, buying_signal, personalized_hook, etc.)
- **Usage 2 — Génération ICP** : route `/api/campaigns/generate-icp` → synthèse 8 Q&A → ICP.md structuré
- **Implémentation** : SDK `@anthropic-ai/sdk` côté Next.js ; HTTP direct côté n8n (body JSON avec `response_format` strict)
- **Coût** : ~$0.01 / lead scoré (Opus premium vs $0.001 Haiku v1). Trade-off accepté pour la qualité des champs v3.
- **Env var** : `ANTHROPIC_API_KEY`

### Google Maps Places API (inchangé)
- WF1 — génération leads bruts. Gratuit jusqu'à 5000 req/mois.

### Firecrawl (inchangé)
- WF2 — scraping sites. 500 pages/mois gratuit.

### Resend (inchangé)
- WF3 + WF5 — envois. Webhooks WF4. 3000 emails/mois gratuit.

---

## Feature Implementation Guide

### F1 — Architecture 1 GSheet par campagne (BLOC 0)
**Complexité** : Haute (refonte WF1 + API routes + env + WF6)
**Libs** : aucune nouvelle côté Next.js ; n8n utilise Google Drive/Sheets APIs déjà disponibles
**Notes** : Tester WF1 à vide (sans Google Maps) avant d'ajouter la boucle de scraping

### F2 — Enrichissement IA augmenté (BLOC 1)
**Complexité** : Moyenne (prompt + IF + code node)
**Libs** : aucune (HTTP Request node dans n8n)
**Notes** : Forcer `"RÉPONDS UNIQUEMENT LE JSON"` en fin de prompt. Prévoir fallback si Claude retourne du texte.

### F3 — ICP.md généré par Claude (BLOC 3)
**Complexité** : Haute (nouvelle UI chat + route API + intégration lancement)
**Libs** : `@anthropic-ai/sdk`
**Notes** : UI chat séquentielle (pas toutes les questions en même temps). Preview Markdown avec bouton édition inline.

### F4 — Kanban (BLOC 2)
**Complexité** : Moyenne (drag & drop + optimistic UI + PATCH)
**Libs** : `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
**Notes** : Passer `sheet_id` dans le body du PATCH (résolu côté page via getCampaignById).

### F5 — Déduplication (BLOC 4)
**Complexité** : Basse (code node + append)
**Libs** : aucune
**Notes** : Clé = domaine normalisé (`new URL(site).hostname.replace('www.','').toLowerCase()`).

### F6 — Export multi-format (BLOC 5)
**Complexité** : Basse (route API + 3 boutons)
**Libs** : aucune
**Notes** : Format Instantly = `Email,First Name,Last Name,Company Name,Personalization`. Escape CSV avec `""`.

---

## DevOps & Déploiement

### Environnements

| Env | URL | n8n | Usage |
|---|---|---|---|
| Local dev | localhost:3000 | staging-n8n.kamesai.com | Développement |
| Production | kamesai.com (Vercel) | agent.kamesai.com | Live |

### CI/CD

```
Push GitHub main → Vercel build → deploy prod si build OK
```

### Variables d'environnement

```bash
# Google Sheets (inchangé)
GOOGLE_SERVICE_ACCOUNT_EMAIL=lead-qualifier-service@lead-qualifier-mvp.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=...

# v3 NOUVEAU
GOOGLE_INDEX_SHEET_ID=1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  # GSheet maître Flinty Index
ANTHROPIC_API_KEY=sk-ant-...                                              # Pour generate-icp côté Next.js

# n8n env vars (side)
GOOGLE_DRIVE_FOLDER_ID=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX                 # Dossier où WF1 crée les enfants

# n8n webhooks
N8N_WEBHOOK_WF1=https://[env]-n8n.kamesai.com/webhook/flinty-wf1-launch
```

---

## Security Considerations

- [x] Credentials Google + Anthropic côté serveur uniquement
- [x] Isolation RGPD : chaque campagne = 1 fichier GSheet séparé → partage client sans fuite croisée
- [ ] Rate limiting sur `/api/campaigns/generate-icp` (burn de tokens Anthropic)
- [ ] Rate limiting sur `/api/campaigns` POST (lancement intempestif WF1 → coûts Firecrawl/Maps)
- [ ] Validation Zod du payload `POST /api/campaigns` (secteur, localisation, icp_md non vide)
- [ ] Pas d'auth utilisateur (outil interne — accès contrôlé par URL Vercel protégée ou VPN si prod publique)

---

## Performance Optimization

- [ ] Cache en mémoire des `sheet_id` lus depuis l'Index (TTL 5min) pour éviter 2 appels Sheets par requête
- [ ] Pagination de `GET /api/leads` (actuellement charge tout)
- [ ] Server Components pour `/dashboard` (cache intégré Next.js)
- [ ] Lazy load du module Kanban (`@dnd-kit` — ~30kb gzipped)

---

## Open Technical Questions

- [ ] Cache des `sheet_id` : côté Next.js (LRU) ou côté GSheet (onglet Cache) ?
- [ ] Fallback si Claude Opus retourne un JSON invalide : retry 1x ? Downgrade Haiku ? Rejet auto ?
- [ ] Comment gérer la suppression d'une campagne (soft delete dans Index vs vraie suppression du GSheet enfant via Drive API) ?
- [ ] Pattern de migration Postgres (Neon) : quand déclencher exactement ? Seuil à trancher sur données réelles.

---

## Migration Paths (post v3)

| Déclencheur | Migration |
|---|---|
| >1000 leads/mois OU latence GSheet >1s soutenue | PostgreSQL (Neon) + Prisma |
| >5 campagnes actives simultanées | Activer BLOC 4 (déduplication) |
| Accès multi-utilisateurs (invité clients dans l'app) | Better Auth + rôles owner/viewer |
| Besoin d'analyse temporelle fine | Onglet `Email_Events` (report v1) migré vers table dédiée |

---

## Next Steps

1. [ ] **S1** — BLOC 0 complet (architecture GSheet par campagne)
2. [ ] **S2** — BLOC 1 (enrichissement IA) + BLOC 5 (export)
3. [ ] **S3** — BLOC 3 (ICP chat) + finitions BLOC 1 (UI fiche lead)
4. [ ] **S4** — BLOC 2 (Kanban) + BLOC 4 (déduplication)
5. [ ] Rate limiting + validation Zod avant ouverture prod v3
