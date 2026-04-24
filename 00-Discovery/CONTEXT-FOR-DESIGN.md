# Flinty — Contexte Design (réalité implémentée)

> Ce document décrit l'état **réel** du projet au 2026-03-05, à destination de Claude Web + Figma MCP pour améliorer le design de l'interface.

---

## 1. C'est quoi ce projet ?

Un **CRM interne de prospection cold email** — produit SaaS **Flinty**.
Usage : Thomas (fondateur) l'utilise seul pour piloter ses campagnes de lead generation B2B.

**Pipeline complet :**
1. Thomas crée une campagne (secteur + ville + offre)
2. n8n génère automatiquement des leads via Google Maps Places API
3. n8n qualifie chaque lead avec Firecrawl (scrape site) + Claude (score /100)
4. n8n envoie les emails J0, J+3, J+7 via Resend
5. Le dashboard affiche tout en temps réel depuis Google Sheets

---

## 2. Architecture technique

| Couche | Techno | Détail |
|---|---|---|
| UI | Next.js 15 (App Router) + TypeScript + Tailwind | Local sur localhost:3000 |
| Data | Google Sheets API v4 | Spreadsheet ID: `14Uf6GlvmlCxzaFxENExW-FkCV0CZNQ_7zwzik9SAelY` |
| Automation | n8n self-hosted (staging: staging-n8n.kamesai.com) | 6 workflows actifs |
| Email | Resend (domaine outreach.kamesai.com) | |
| Scoring IA | Claude Haiku via OpenRouter | |

**Google Sheets — 4 onglets :**
- `Campagnes` — une ligne par campagne
- `Leads_Raw` — leads bruts de Google Maps
- `Leads_Qualified` — leads scorés par Claude
- `Config` — paramètres globaux

---

## 3. Les 5 écrans existants

### Écran 1 — `/dashboard` — Liste des campagnes
**Rôle :** vue d'ensemble, point d'entrée principal

**Layout :**
- Header : titre "Campagnes Cold Email" + bouton CTA "Nouvelle campagne" (gradient orange→pink)
- KPIs globaux : 4 cards (Campagnes / Leads Qualifiés / Emails envoyés / Taux ouverture)
- Liste des campagnes : une card par campagne avec stats inline (raw, qualifiés, emails, ouverture%, réponse%)
- Chaque card affiche un dot de statut coloré (vert=active, bleu=generating, jaune=scheduled, gris=paused)

**État vide :** message "Aucune campagne" + CTA centré

---

### Écran 2 — `/dashboard/campaigns/new` — Création de campagne
**Rôle :** formulaire de lancement d'une nouvelle campagne

**Champs du formulaire :**
- Nom de la campagne (texte libre, ex: "Plombiers Bordeaux - Jan 2026")
- Secteur cible (texte libre, ex: "plombier")
- Ville / Zone (texte libre, ex: "Bordeaux")
- Taille d'équipe cible (select: 1-5 / 1-10 / 10-50 / 50-200 / 200+)
- Poste ciblé (texte libre, ex: "Gérant")
- Offre Flinty (select: Répondeur IA 24/7 / Lead Scoring / Résumé appels CRM / Relances Email/SMS)
- Template email (select: Template #1 Intro / #2 Question / #3 Valeur)

**Actions :** Annuler | 🚀 Lancer la campagne (appelle WF1 via webhook n8n)

---

### Écran 3 — `/dashboard/campaigns/[campaign_id]` — Détail campagne
**Rôle :** vue d'une campagne avec tous ses leads qualifiés

**Layout :**
- Breadcrumb : Campagnes / {nom campagne}
- Header : nom campagne + sous-titre (offre · secteur · ville)
- KPIs de campagne : 6 cards (Leads Raw / Qualifiés / Emails / Ouverture% / Réponse% / Rebonds)
- Tableau des leads qualifiés : colonnes NOM (cliquable) / VILLE / POSTE / TAILLE / EMAIL / SCORE / STATUT

**Statuts email affichés avec badges colorés :**
- `new` → "Qualifié" (bleu)
- `contacted` → "📨 J0 envoyé" (gris)
- `relance_1` → "📨 J+3 envoyé" (jaune)
- `relance_2` → "📨 J+7 envoyé" (orange)
- `opened` → "👁 Ouvert" (vert)
- `clicked` → "🖱 Cliqué" (vert clair)
- `replied` → "✅ Répondu" (émeraude)
- `bounced` → "❌ Rebond" (rouge)
- `disqualified` → "Disqualifié" (gris foncé)

**Score coloré :** ≥70 = vert / ≥50 = jaune / <50 = gris

---

### Écran 4 — `/dashboard/campaigns/[campaign_id]/leads/[lead_id]` — Fiche lead
**Rôle :** détail complet d'un lead qualifié

**Layout :**
- Breadcrumb : Campagnes / Campagne / {nom lead}
- Card principale :
  - Titre : nom entreprise + secteur · ville
  - Score IA affiché en grand (format "75/100" avec couleur)
  - Grille de champs : Contact (prénom) / Poste / Email / Téléphone / Taille équipe / Services IA déjà? / Statut email
  - Lien site web (orange, ouvre dans un nouvel onglet)
- Card "Historique emails" : actuellement minimal (statut actuel + note TODO pour timeline complète)

**⚠️ Feature manquante :** la timeline email (J0, J+3, J+7 avec dates et événements Resend) n'est pas encore implémentée. Nécessite un onglet `Email_Events` dans le GSheet alimenté par WF3/WF4/WF5.

---

## 4. Design System actuel

### Couleurs
```
Background principal : #000000 (black)
Background cards :     #09090b (zinc-950)
Bordures :             #27272a (zinc-800)
Texte principal :      #ffffff
Texte secondaire :     #a1a1aa (zinc-400)
Texte subtil :         #71717a (zinc-500)
Accent primaire :      #f97316 (orange-500)
Gradient CTA :         from-orange-500 to-pink-500
```

### Sidebar (layout.tsx)
- Largeur fixe : 256px (w-64)
- Logo "K" carré avec gradient orange→pink
- Nav : 2 liens (Campagnes, Nouvelle campagne) avec icônes emoji
- Footer sidebar : indicateur "Live — Google Sheets" avec dot vert

### Typographie
- Titres de page : `text-3xl font-bold`
- Labels KPI : `text-xs font-semibold tracking-widest uppercase` (zinc-500)
- Valeurs KPI : `text-2xl-3xl font-bold`
- Labels de section : `text-xs font-semibold tracking-widest text-orange-400 uppercase` (style "eyebrow")

### Composants clés
- **Cards KPI** : `bg-zinc-950 border border-zinc-800 rounded-xl p-4-5`
- **Bouton CTA** : `bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg px-4 py-2 text-white font-medium`
- **Inputs** : `bg-zinc-900 border border-zinc-700 rounded-lg focus:border-orange-500`
- **Tables** : fond zinc-950, lignes séparées par `border-zinc-900`, hover `bg-zinc-900`
- **Badges statut** : `px-2 py-1 rounded text-xs font-medium` avec couleurs sémantiques

---

## 5. Données réelles (modèle Google Sheets)

### Onglet `Campagnes`
```
campaign_id | nom | secteur | localisation | offre_kames | taille_equipe
date_création | statut | total_leads_raw | total_leads_qualified
emails_envoyés | taux_ouverture | taux_réponse
```

### Onglet `Leads_Qualified`
```
lead_id | campaign_id | nom | site | ville | score | email | téléphone
prénom | poste | secteur | taille_equipe | has_ia_services | statut_email
last_email_sent_at
```

---

## 6. API Routes (Next.js)

| Route | Méthode | Description |
|---|---|---|
| `/api/campaigns` | GET | Liste toutes les campagnes depuis GSheet |
| `/api/campaigns` | POST | Crée campagne + appelle WF1 n8n webhook |
| `/api/campaigns/[id]` | GET | Détail campagne + leads qualifiés filtrés |
| `/api/leads` | GET | Tous les leads qualifiés (avec filtres optionnels) |
| `/api/stats` | GET | KPIs globaux agrégés |
| `/api/export` | GET | Export CSV des leads |

---

## 7. n8n Workflows (staging-n8n.kamesai.com)

| ID | Nom | Trigger | Rôle |
|---|---|---|---|
| `OnpGdsIZQShrN4P1` | WF1 - Génération Leads | Webhook POST | Google Maps → Leads_Raw |
| `01BB4q4j1buvWRC6` | WF2 - Qualification Leads | Webhook POST | Firecrawl + Claude → Leads_Qualified |
| `dfe1jIPlZA10dqJK` | WF3 - Envoi Email J0 | Webhook POST | Resend email J0 |
| `oCViFcjPo2nNUjlR` | WF4 - Webhooks Resend | Webhook POST | MAJ statuts email (opened/clicked/replied/bounced) |
| `7re2WS3ghacqHsLE` | WF5 - Relances Auto | Schedule horaire | Relances J+3 et J+7 automatiques |
| `oWm8alnIlzS9UCTd` | WF6 - Calcul Stats | Schedule horaire | Agrège KPIs dans onglet Campagnes |

---

## 8. Ce qui manque / pistes d'amélioration design

### Features non implémentées (potentielles)
- Timeline email complète sur la fiche lead (J0 → J+3 → J+7 avec dates et événements)
- Indicateur de progression visuel sur chaque campagne (funnel : raw → qualifiés → contactés → réponses)
- Actions manuelles sur les leads (changer statut, forcer relance)
- Recherche et filtres sur la liste des campagnes
- Graphiques de performance (courbes taux ouverture dans le temps)
- Mode mobile (actuellement desktop-only)

### Limites design actuelles
- Navigation sidebar très minimale (2 liens seulement)
- Pas de state de chargement sur les pages server components
- Historique email sur la fiche lead est un placeholder
- Pas de feedback visuel sur le score IA (barre de progression)
- Emojis dans la sidebar (📊 ➕) — non idéal pour un design pro

---

## 9. Stack de déploiement cible

- **Local dev** : localhost:3000 (Next.js dev server)
- **Prod** : Vercel (non encore déployé — Task 016 en cours)
- **n8n staging** : https://staging-n8n.kamesai.com
- **n8n prod** : https://agent.kamesai.com