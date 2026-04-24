# Flinty Dashboard — Vue d'ensemble

> **Dernière mise à jour :** 2026-03-10
> **Statut :** 27/30 tâches complétées — 3 restantes avant prod

---

## Ce que c'est

Un CRM interne de prospection cold email (**Flinty**), utilisé par Thomas pour piloter ses campagnes B2B de prospection commerciale.

**Principe :** Google Sheets comme base de données, n8n comme moteur d'automatisation, Next.js comme interface. Pas de SQL, pas de backend custom.

---

## Pipeline complet

```
Thomas crée une campagne (secteur + ville + offre)
        ↓
n8n WF1 — Génère des leads via Google Maps Places API → onglet Leads_Raw
        ↓
n8n WF2 — Qualifie chaque lead (Firecrawl scrape + Claude score /100) → onglet Leads_Qualified
        ↓
n8n WF3 — Envoie l'email J0 via Resend (outreach.kamesai.com)
        ↓
n8n WF5 — Relances automatiques J+3 et J+7 (schedule horaire)
        ↓
n8n WF4 — Reçoit les webhooks Resend (opened / clicked / replied / bounced) → met à jour statut_email
        ↓
n8n WF6 — Calcule les KPIs toutes les heures → met à jour onglet Campagnes
        ↓
Dashboard Next.js — Affiche tout en temps réel depuis Google Sheets
```

---

## Stack technique

| Couche | Techno | Détail |
|---|---|---|
| UI | Next.js 15 App Router + TypeScript + Tailwind | localhost:3000 en dev |
| Base de données | Google Sheets API v4 | Service account Flinty |
| Emails | Resend | Domaine outreach.kamesai.com |
| Scoring IA | Claude Haiku via OpenRouter | |
| Automatisation | n8n self-hosted | staging-n8n.kamesai.com (dev) / agent.kamesai.com (prod) |
| Déploiement cible | Vercel | ⚠️ Pas encore déployé |

---

## Google Sheets — Structure

| Onglet | Rôle | Colonnes clés |
|---|---|---|
| `Campagnes` | Une ligne par campagne | campaign_id, nom, statut, taux_ouverture, taux_réponse |
| `Leads_Raw` | Leads bruts Google Maps | lead_id, campaign_id, nom, site, ville |
| `Leads_Qualified` | Leads scorés par Claude | lead_id, campaign_id, score, statut_email, last_email_sent_at |
| `Email_Events` | Événements email Resend | event_id, lead_id, event_type, email_type, timestamp |
| `Meetings` | Rendez-vous Calendly | meeting_id, lead_id, start_at, status, source |
| `Email_Templates` | Templates emails par campagne | campaign_id, sequence_key, subject, body |
| `Analytics_Daily` | Snapshots KPIs quotidiens | snapshot_date, campaign_id, opens, clicks, replies |

---

## Pages du dashboard

### `/dashboard` — Accueil
- Bloc "Leads chauds" (replied + clicked) — accès direct à la fiche
- KPIs globaux : campagnes / réponses / taux ouverture / meetings semaine
- Upcoming meetings Calendly (top 4)
- Liste des top campagnes avec funnel visuel

### `/dashboard/campaigns/new` — Nouvelle campagne
- Formulaire : secteur, ville, taille équipe, poste ciblé, offre Flinty
- Appelle WF1 via webhook n8n au submit

### `/dashboard/campaigns/[id]` — Détail campagne
- KPIs de la campagne (leads raw / qualifiés / emails / taux)
- Tableau des leads qualifiés avec filtres statut + score
- Badge statut email coloré par lead

### `/dashboard/campaigns/[id]/leads/[id]` — Fiche lead
- Infos complètes : nom, poste, ville, email, téléphone, site, score IA
- Analyse Claude (raison du score)
- **Timeline unifiée** : emails (sent/opened/clicked/replied/bounced) + meetings, triés chronologiquement, avec badges canal (Email / Meeting)

### `/dashboard/meetings` — Calendrier meetings
- Vue hebdomadaire des meetings Calendly
- Filtre par statut (scheduled / completed / cancelled / no_show)

### `/dashboard/inbox` — Unified Inbox
- Onglets : "À répondre" / "Meeting planifié" / "En attente" / "Tout"
- Filtre par campagne
- Badge vert dans la sidebar avec le count "À répondre"
- Chaque ligne : canal + prospect + statut + dernier événement + date relative → lien fiche lead

### `/dashboard/templates` — Templates emails
- Vue et édition des templates par campagne
- Support video + preview enrichie

### `/dashboard/data` — Données business
- Onglets analytics : marketing, commercial, business
- KPIs avancés et snapshots quotidiens

---

## n8n Workflows

| Workflow | Trigger | Rôle |
|---|---|---|
| WF1 — Génération Leads | Webhook POST | Google Maps → Leads_Raw |
| WF2 — Qualification | Webhook POST | Firecrawl + Claude → Leads_Qualified |
| WF3 — Email J0 | Webhook POST | Envoi email initial via Resend |
| WF4 — Webhooks Resend | Webhook POST | MAJ statut_email (opened / clicked / replied / bounced) |
| WF5 — Relances Auto | Schedule horaire | Relances J+3 et J+7 automatiques |
| WF6 — Calcul Stats | Schedule horaire | Agrège KPIs dans onglet Campagnes |

**Webhooks staging :**
- WF1 : `https://staging-n8n.kamesai.com/webhook/kai-v2-gen-leads`
- WF2 : `https://staging-n8n.kamesai.com/webhook/kames-qualify-leads`
- WF3 : `https://staging-n8n.kamesai.com/webhook/kames-send-email-j0`
- WF4 : `https://staging-n8n.kamesai.com/webhook/kames-resend-events`

---

## API Routes Next.js

| Route | Méthode | Rôle |
|---|---|---|
| `/api/campaigns` | GET | Liste toutes les campagnes |
| `/api/campaigns` | POST | Crée campagne + appelle WF1 |
| `/api/campaigns/[id]` | GET | Détail campagne + leads filtrés |
| `/api/leads` | GET | Tous les leads (filtrable par `?campaign_id=`) |
| `/api/leads/[id]` | GET | Fiche lead |
| `/api/leads/[id]/events` | GET | Email events d'un lead |
| `/api/meetings` | GET | Meetings (filtrable par campaign / status / week) |
| `/api/stats` | GET | KPIs globaux agrégés |
| `/api/export` | GET | Export CSV des leads |

---

## Fichiers clés du codebase

```
lib/sheets.ts               ← Couche d'accès Google Sheets (toutes les fonctions fetch)
lib/email-events.ts         ← Types + parsers + labels pour les événements email
lib/meetings.ts             ← Types + parsers + helpers pour les meetings
lib/timeline.ts             ← Normalisation multi-sources → TimelineItem unifié
lib/email-templates.ts      ← Modèle de templates email
lib/analytics.ts            ← Modèle snapshots analytics

app/dashboard/layout.tsx    ← Sidebar (Server Component, lit campagnes + compteurs)
app/dashboard/page.tsx      ← Dashboard home
app/dashboard/inbox/page.tsx           ← Unified Inbox
app/dashboard/meetings/page.tsx        ← Vue meetings
app/dashboard/templates/page.tsx       ← Templates
app/dashboard/data/page.tsx            ← Analytics / Data
app/dashboard/campaigns/[id]/page.tsx  ← Détail campagne
app/dashboard/campaigns/[id]/leads/[id]/page.tsx  ← Fiche lead + timeline
```

---

## Ce qui reste à faire avant prod

### TASK-016 — Déploiement Vercel ⚠️ BLOQUANT
Le dashboard tourne uniquement en local. Il n'est pas déployé.

**À faire :**
1. Créer un projet Vercel lié au repo GitHub
2. Configurer les variables d'environnement Vercel :
   - `GOOGLE_SHEETS_SPREADSHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
3. Vérifier que les webhooks n8n pointent vers la prod (`agent.kamesai.com`) et non staging
4. Tester toutes les pages en production

---

### TASK-018 — Actions manuelles sur leads
Actuellement, impossible de modifier un lead depuis le dashboard. Tout passe par Google Sheets manuellement.

**À faire :**
- Bouton "Changer statut" sur la fiche lead (ex: passer un lead de `waiting` à `replied` manuellement)
- Bouton "Forcer relance" pour déclencher WF3 manuellement sur un lead
- Éventuellement : champ note interne sur la fiche lead

**Impact :** Faible pour une V1 — le pipeline n8n automatise 95% des changements de statut. Mais utile pour les corrections manuelles et les leads contactés hors pipeline.

---

### TASK-019 — Mode mobile responsive
Le dashboard est actuellement **desktop uniquement**. Sur mobile, la sidebar et les tableaux débordent.

**À faire :**
- Sidebar : collapse en mobile (hamburger ou bottom nav)
- Tableaux leads : affichage en cards sur mobile
- Fiche lead : déjà lisible, ajustements mineurs
- Dashboard home : grille KPIs 2×2 au lieu de 4×1 sur mobile

**Impact :** Moyen — si Thomas accède parfois depuis son téléphone pour vérifier les leads chauds.

---

## Ordre recommandé avant le lancement

```
1. TASK-016 — Vercel (bloquant, rien ne tourne en prod sans ça)
2. TASK-018 — Actions manuelles (utile dès le premier jour en prod)
3. TASK-019 — Mobile (confort, pas critique pour le lancement)
```

---

## Design System (référence rapide)

| Élément | Classe Tailwind |
|---|---|
| Background | `bg-black` |
| Cards | `bg-zinc-950 border border-zinc-800 rounded-xl` |
| Texte principal | `text-white` |
| Texte secondaire | `text-zinc-400` / `text-zinc-500` |
| Accent | `text-orange-400` / `bg-orange-500` |
| Badges | `bg-[color]/20 text-[color]-400 px-2 py-0.5 rounded-full text-xs` |
| Labels section | `text-xs font-semibold tracking-widest uppercase text-zinc-500` |
