# Product Requirements Document : Flinty

> Version 2.0 (v3 produit) — 2026-04-15
> Statut : v1 (MVP) en prod — v3 en phase de spécification
> Source : `docs/plans/flinty-plan-v3.md`

---

## 1. Overview

### Problem Statement
En v1, Flinty trouve des leads, les score et envoie des emails. Mais toutes les campagnes vivent dans un GSheet unique : au-delà de quelques campagnes en parallèle, les performances chutent, les données s'entremêlent (RGPD compromis dès qu'un client est invité), et les leads enrichis restent pauvres — pas de hook personnalisé, pas de signal d'achat, pas de raison de rejet tracée. Le scoring IA actuel (Haiku) ne produit que 7 champs basiques et ne s'appuie pas sur un ICP propre à chaque campagne.

### Product Vision
Flinty v3 devient un moteur d'intelligence commerciale par campagne : chaque campagne vit dans son propre GSheet isolé, l'IA (Claude Opus 4.6) enrichit chaque lead avec signaux d'achat / hook email prêt à coller / raison de rejet documentée, et l'ICP de campagne est généré via un dialogue avec Claude avant lancement.

### Target Launch Date
v3 S1–S4 avril–mai 2026. BLOC 0 (architecture GSheet-par-campagne) priorité 1 — pré-requis de tout le reste.

---

## 2. Target Users

### Primary Persona : Thomas (Fondateur Flinty / Kames AI)
- **Rôle** : CEO solo, responsable de son acquisition + prospection pour clients agence
- **Contexte** : Prospecte des TPE/PME françaises pour vendre des automatisations IA (500–2500 €/mois). Lance désormais plusieurs campagnes en parallèle par secteur/zone
- **Pain Points** :
  - Tout est mélangé dans un GSheet global → illisible à >3 campagnes actives
  - Les leads rejetés disparaissent sans trace → risque de re-prospection
  - Les emails manquent de personnalisation → taux d'ouverture stagnant
  - Créer l'ICP d'une nouvelle campagne prend 30+ min à la main
- **Goals** : Lancer 10+ campagnes isolées en parallèle sans perdre en qualité, doubler le taux de réponse grâce aux hooks perso, pouvoir partager une campagne à un client sans exposer les autres

### Secondary Persona : Client agence (lecture seule)
- **Rôle** : PME cliente de Kames AI qui reçoit un accès lecture à sa propre campagne
- **Contexte** : Reçoit l'URL d'UN GSheet enfant isolé (pas de contact avec les autres clients)
- **Pain Points** : Aujourd'hui impossible de partager les résultats sans exposer l'ensemble
- **Goals** : Voir en temps réel les leads générés pour sa campagne, pouvoir exporter en CSV/Instantly

---

## 3. Core Features (v3 Scope)

### Feature 1 : Architecture 1 GSheet par campagne (BLOC 0)
**Priorité** : P0 (Must Have — fondation)

**Description** : WF1 crée dynamiquement un GSheet enfant par campagne (4 onglets : Leads_Raw, Leads_Qualified, Leads_Rejected, Config) et enregistre sa référence dans un GSheet maître "Flinty Index".

**User Stories** :
- En tant que Thomas, je veux que chaque campagne ait son propre GSheet isolé pour garantir la conformité RGPD et pouvoir partager une campagne sans exposer les autres.
- En tant que Thomas, je veux qu'un GSheet maître référence toutes les campagnes pour avoir une vue d'ensemble dans le dashboard sans avoir à ouvrir chaque fichier.

**Acceptance Criteria** :
- [ ] GSheet maître "Flinty Index" créé avec onglet `Campagnes` (13 colonnes) + `Contacts_Registry`
- [ ] WF1 appelle Google Drive API pour créer un GSheet enfant nommé `Flinty — [secteur] [ville] [MM/YYYY]`
- [ ] WF1 écrit une ligne dans `Flinty Index` avec `campaign_id`, `sheet_id`, `sheet_url`, statut `new`
- [ ] Chaque GSheet enfant a les 4 onglets + headers corrects dès sa création
- [ ] Variable `GOOGLE_INDEX_SHEET_ID` présente dans `.env.local` et Vercel
- [ ] API `/api/campaigns` lit l'Index, API `/api/campaigns/[id]` résout `sheet_id` puis lit l'enfant
- [ ] WF6 parcourt l'Index et met à jour les stats (colonnes J→M du maître) toutes les heures

---

### Feature 2 : Enrichissement IA augmenté (BLOC 1)
**Priorité** : P0 (Must Have)

**Description** : WF2 passe de 7 à 14 champs en sortie Claude : ajout de `score_reason`, `hiring_signals`, `growth_stage`, `buying_signal`, `personalized_hook`, `rejection_reason`, plus un `web_quality_score` calculé côté n8n depuis le contenu Firecrawl.

**User Stories** :
- En tant que Thomas, je veux recevoir un hook email perso (≤20 mots) pour chaque lead qualifié afin de personnaliser massivement sans effort manuel.
- En tant que Thomas, je veux connaître la raison du rejet de chaque lead pour éviter de le re-prospecter et détecter les faux négatifs.
- En tant que Thomas, je veux que le scoring s'appuie sur l'ICP de la campagne (pas des critères génériques) pour qu'il reflète vraiment mon intention commerciale.

**Acceptance Criteria** :
- [ ] Nouveau prompt Claude Opus 4.6 dans WF2 retourne un JSON à 14 clés
- [ ] WF2 lit `Config.icp_md` et `Config.score_minimum` du GSheet enfant avant le scoring
- [ ] Leads avec `score >= score_minimum` → écrits dans `Leads_Qualified` avec les 7 nouveaux champs
- [ ] Leads avec `score < score_minimum` → écrits dans `Leads_Rejected` avec `rejection_reason` + `processed_at`
- [ ] Code node post-Firecrawl calcule `web_quality_score` (0–100) + `web_quality_signals`
- [ ] Fiche lead UI affiche : hook copiable, buying_signal, hiring_signals, growth_stage (badge coloré), web_quality_score
- [ ] 100% des leads traités atterrissent dans Qualified OU Rejected (taux de perte = 0)

---

### Feature 3 : ICP.md généré par dialogue Claude (BLOC 3)
**Priorité** : P0 (Must Have)

**Description** : Le bouton "+ Nouvelle campagne" ouvre une interface chat où Claude pose 8 questions stratégiques, synthétise un ICP.md structuré, affiche une preview Markdown, puis déclenche WF1 avec l'ICP injecté dans le `Config` du GSheet enfant.

**User Stories** :
- En tant que Thomas, je veux répondre à 8 questions dans un chat plutôt que remplir un formulaire pour créer un ICP complet en moins de 5 minutes.
- En tant que Thomas, je veux valider / éditer l'ICP.md avant le lancement pour corriger la synthèse Claude si besoin.

**Acceptance Criteria** :
- [ ] Page `/dashboard/campaigns/new` affiche un chat séquentiel (1 question à la fois)
- [ ] Route `POST /api/campaigns/generate-icp` appelle Claude Opus 4.6 (SDK `@anthropic-ai/sdk`)
- [ ] ICP.md généré avec structure fixe : profil cible / problème / offre / signaux + / signaux - / exclusions / grille scoring / hook type
- [ ] Preview Markdown éditable avant lancement
- [ ] `POST /api/campaigns` envoie `icp_md` dans le payload à WF1
- [ ] WF1 écrit `icp_md` dans l'onglet `Config` du GSheet enfant

---

### Feature 4 : Vue Kanban des leads (BLOC 2)
**Priorité** : P1 (Should Have)

**Description** : Page Kanban par campagne avec 6 colonnes (Nouveaux → Contactés → Ouvert → Cliqué → Répondu → Bounced), cartes drag & drop qui persistent le statut dans le GSheet enfant.

**User Stories** :
- En tant que Thomas, je veux voir le pipeline de ma campagne en colonnes pour détecter d'un coup d'œil où en sont les leads.
- En tant que Thomas, je veux forcer manuellement un statut (drag & drop) quand je sais par ailleurs qu'un lead a répondu (ex: sur LinkedIn).

**Acceptance Criteria** :
- [ ] Dépendances installées : `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- [ ] Route `/dashboard/campaigns/[campaign_id]/kanban/page.tsx` créée
- [ ] Cartes affichent nom, ville, score coloré, hook perso au hover
- [ ] Drag & drop appelle `PATCH /api/leads/[id]/status` avec `sheet_id` en body
- [ ] Onglet de navigation "Kanban" ajouté sur la page campagne

---

### Feature 5 : Déduplication inter-campagnes (BLOC 4)
**Priorité** : P1 (Should Have — activable à 5+ campagnes actives)

**Description** : Un onglet `Contacts_Registry` dans le GSheet maître trace chaque domaine déjà contacté. WF1 filtre les doublons avant écriture dans `Leads_Raw` ; WF3 append au registre après chaque envoi J0.

**User Stories** :
- En tant que Thomas, je ne veux jamais prospecter deux fois le même domaine, même si je lance plusieurs campagnes qui se chevauchent.

**Acceptance Criteria** :
- [ ] Onglet `Contacts_Registry` (domain | last_contacted_at | campaign_id | statut) présent dans le maître
- [ ] WF1 lit le registre + filtre les leads dont le domaine est connu (code node)
- [ ] WF3 append au registre après envoi Resend J0

---

### Feature 6 : Export multi-format (BLOC 5)
**Priorité** : P1 (Should Have)

**Description** : 3 formats d'export pour une campagne : CSV standard (tous les champs v3), JSON développeur, CSV Instantly-ready (Email / Prénom / Company / Personalization = `personalized_hook`).

**User Stories** :
- En tant que Thomas, je veux importer mes leads dans Instantly en 1 clic avec le hook perso déjà rempli pour brancher l'outreach externe sans saisie manuelle.

**Acceptance Criteria** :
- [ ] Route `GET /api/campaigns/[id]/export?format=csv|json|instantly` opérationnelle
- [ ] CSV standard inclut les 16 colonnes v3 (dont score_reason, buying_signal, personalized_hook, hiring_signals, growth_stage, web_quality_score)
- [ ] Format Instantly filtre les leads sans email et mappe `personalized_hook` → colonne `Personalization`
- [ ] 3 boutons d'export affichés sur la page campagne

---

## 4. Out of Scope (v3)

| Feature | Raison du report |
|---|---|
| Version mobile | Usage desktop exclusif (Thomas + clients agence) |
| Authentification multi-user | Partage client se fait via URL Google Sheets natif (droits lecture) |
| A/B testing templates email | Pas de volume statistique suffisant avant 10+ campagnes closes |
| Migration vers Postgres | Déclencheur : >1000 leads/mois ou latence GSheet >1s soutenue |
| Intégration HubSpot / Pipedrive | Export Instantly / CSV suffit pour le volume actuel |
| Graphiques temporels de performance | Nice-to-have, pas bloquant pour piloter les campagnes |
| Timeline email sur fiche lead (Feature P1 v1) | Reporté en v3.2 après stabilisation du BLOC 0 |

---

## 5. Success Metrics

| Métrique | Cible | Délai | Mesure |
|---|---|---|---|
| Taux d'ouverture email | >35% | 1er mois v3 | `taux_ouverture` GSheet maître |
| Taux de réponse email | >8% | 1er mois v3 | `taux_réponse` GSheet maître |
| Temps de création campagne (chat ICP → lancement) | <5 min | Dès v3.1 | Chronométrage manuel |
| Leads qualifiés générés / campagne | >30 | Par campagne | `total_leads_qualified` onglet Campagnes |
| Hook coverage | 100% | Par campagne | % lignes `Leads_Qualified` avec `personalized_hook` non vide |
| Taux de rejet documenté | 100% | Par campagne | Chaque ligne `Leads_Rejected` a un `rejection_reason` |
| Appels de découverte générés | 5–8/mois | Mois 1–2 post v3 | Suivi manuel |

---

## 6. Technical Constraints

- **Platform** : Web desktop (Next.js 15 App Router, TypeScript, Tailwind)
- **Base de données** : Google Sheets API v4 — 1 maître + N enfants (1 par campagne)
- **Automatisation** : n8n self-hosted Hetzner (staging + prod)
- **Email** : Resend (domaine outreach.kamesai.com — inchangé)
- **Scoring IA** : Claude Opus 4.6 (v3 — upgrade depuis Haiku) pour enrichir les 14 champs + pour la génération ICP
- **Scraping** : Firecrawl (inchangé)
- **Déploiement** : Vercel (CI/CD depuis GitHub)
- **Nouvelles env vars** :
  - `GOOGLE_INDEX_SHEET_ID` — Vercel + `.env.local`
  - `GOOGLE_DRIVE_FOLDER_ID` — n8n (dossier où WF1 crée les enfants)
  - `ANTHROPIC_API_KEY` — Vercel + `.env.local` (pour `generate-icp`)

---

## 7. Open Questions

- [ ] `score_minimum` par défaut : 60 pour toutes les campagnes, ou configurable par secteur ?
- [ ] Seuil exact pour activer BLOC 4 (déduplication) — 5 campagnes actives confirmé ?
- [ ] Quand migrer vers Postgres (Neon) ? Volumétrie exacte observée en prod
- [ ] Faut-il un "mode dégradé" si Claude Opus retourne un JSON invalide (fallback Haiku ou rejet auto) ?
- [ ] Rate limiting sur `/api/campaigns/generate-icp` avant ouverture prod (éviter burn de tokens)

---

## 8. Appendix

### User Flow v3 : Lancer une campagne

```
Thomas ouvre /dashboard
  → Clique "+ Nouvelle campagne"
  → Chat : Claude pose 8 questions une par une
  → Claude synthétise un ICP.md structuré
  → Preview Markdown éditable → Thomas valide
  → POST /api/campaigns { icp_md, secteur, localisation, offre_kames, ... }
  → WF1 déclenché (webhook)
      → Google Drive API → crée GSheet enfant
      → Google Sheets API → crée 4 onglets + headers + écrit icp_md dans Config
      → Google Sheets API → append ligne dans Flinty Index (maître)
      → Google Maps Places API → filter → dedupe via Contacts_Registry
      → écrit dans Leads_Raw du GSheet enfant
  → WF2 scrape Firecrawl + scoring Claude Opus 4.6 (14 champs)
      → IF score ≥ seuil → Leads_Qualified (enfant)
      → ELSE → Leads_Rejected (enfant)
  → WF3 envoi J0 Resend → statut_email = contacted
      → append domaine dans Contacts_Registry (maître)
  → WF5 (horaire) envoie J+3 et J+7
  → WF4 reçoit webhooks Resend → MAJ statut_email
  → WF6 (horaire) agrège stats dans l'Index
  → Thomas consulte /dashboard/campaigns/[id] ou /kanban
  → Export CSV / JSON / Instantly en 1 clic
```

### Statuts email
```
new → contacted (J0) → relance_1 (J+3) → relance_2 (J+7)
                    ↘ opened → clicked → replied
                    ↘ bounced / disqualified
```

### Références
- Plan v3 détaillé : `docs/plans/flinty-plan-v3.md`
- Architecture technique : `00-Discovery/ARCHI.md` v2
- Templates email : `00-Discovery/email-templates-library.md`
