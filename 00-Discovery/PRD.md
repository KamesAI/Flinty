# Product Requirements Document : Kames CRM

> Version 1.0 — 2026-03-11
> Statut : MVP implémenté (staging) — déploiement prod en cours

---

## 1. Overview

### Problem Statement
Thomas Callendreau (fondateur solo de Kames AI) consacrait plusieurs heures par semaine à la prospection manuelle : recherche d'entreprises, qualification, envoi d'emails, relances. Sans système structuré, le taux de conversion restait faible et l'effort non scalable.

### Product Vision
Un CRM interne qui automatise 100% du pipeline de prospection cold email — de la génération de leads jusqu'aux relances automatiques — permettant à Thomas de lancer une campagne en 2 minutes et d'en suivre les résultats en temps réel.

### Target Launch Date
Staging opérationnel depuis mars 2026 — déploiement Vercel (prod) en cours (Task 016)

---

## 2. Target Users

### Primary Persona : Thomas (Fondateur Kames AI)
- **Rôle** : CEO solo, responsable de sa propre acquisition client
- **Contexte** : Prospecte des TPE/PME françaises pour vendre des automatisations IA (500-2500€/mois)
- **Pain Points** :
  - Trouver des leads qualifiés manuellement prend 3-5h/semaine
  - Pas de visibilité sur l'état des séquences en cours
  - Impossible de scaler sans automatisation
- **Goals** : Signer 3-5 nouveaux clients/mois sans y passer plus de 2h/semaine

---

## 3. Core Features (MVP Scope)

### Feature 1 : Création de campagne
**Priorité** : P0 (Must Have)

**Description** : Formulaire qui déclenche le pipeline complet (génération → qualification → emails) via un webhook n8n.

**User Stories** :
- En tant que Thomas, je veux créer une campagne en 2 minutes (secteur + ville + offre) pour lancer une prospection ciblée sans configuration technique.
- En tant que Thomas, je veux choisir un template email existant pour que les messages soient cohérents avec mon ICP.

**Acceptance Criteria** :
- [x] Formulaire avec : nom, secteur, ville, taille d'équipe, poste ciblé, offre Kames, template email
- [x] Soumission déclenche WF1 via webhook POST (n8n)
- [x] Campagne apparaît immédiatement dans la liste avec statut "generating"
- [x] Redirection automatique vers la liste des campagnes après création

---

### Feature 2 : Pipeline de qualification automatique
**Priorité** : P0 (Must Have)

**Description** : n8n génère des leads via Google Maps, scrape leurs sites avec Firecrawl, et les score via Claude (0-100).

**User Stories** :
- En tant que Thomas, je veux que les leads soient scorés automatiquement pour ne voir que les prospects pertinents.
- En tant que Thomas, je veux voir le score de chaque lead d'un coup d'œil pour prioriser mes actions.

**Acceptance Criteria** :
- [x] WF1 alimente `Leads_Raw` depuis Google Maps Places API
- [x] WF2 scrape chaque site (Firecrawl) + génère un score /100 (Claude Haiku)
- [x] Score coloré : ≥70 = vert / ≥50 = jaune / <50 = gris
- [x] Leads qualifiés visibles dans le tableau de la vue campagne

---

### Feature 3 : Séquence email automatique J0/J+3/J+7
**Priorité** : P0 (Must Have)

**Description** : Envoi automatique des 3 touches email via Resend, avec tracking ouverture/clic/réponse/rebond.

**User Stories** :
- En tant que Thomas, je veux que les emails partent automatiquement sans action manuelle pour ne pas dépendre de ma disponibilité.
- En tant que Thomas, je veux voir le statut de chaque lead (J0 envoyé, ouvert, répondu…) pour savoir où en est la relation.

**Acceptance Criteria** :
- [x] WF3 envoie J0 immédiatement après qualification
- [x] WF5 (schedule horaire) envoie J+3 et J+7 automatiquement
- [x] WF4 reçoit les webhooks Resend et met à jour `statut_email` dans le GSheet
- [x] Badges colorés sur la fiche campagne : contacted / opened / clicked / replied / bounced

---

### Feature 4 : Dashboard de suivi
**Priorité** : P0 (Must Have)

**Description** : Vue d'ensemble des campagnes avec KPIs globaux et détail par campagne.

**User Stories** :
- En tant que Thomas, je veux voir les KPIs de toutes mes campagnes d'un coup d'œil pour évaluer la performance globale.
- En tant que Thomas, je veux accéder au détail d'une campagne et de chaque lead pour qualifier manuellement si besoin.

**Acceptance Criteria** :
- [x] Page `/dashboard` : 4 KPIs globaux + liste des campagnes avec stats inline
- [x] Page `/dashboard/campaigns/[id]` : 6 KPIs + tableau leads qualifiés
- [x] Page `/dashboard/campaigns/[id]/leads/[id]` : fiche complète du lead
- [x] Données lues en temps réel depuis Google Sheets API v4

---

### Feature 5 : Timeline email sur fiche lead
**Priorité** : P1 (Should Have)

**Description** : Historique chronologique des événements email (J0 envoyé, ouvert le X, cliqué le Y) sur la fiche de chaque lead.

**User Stories** :
- En tant que Thomas, je veux voir l'historique complet des interactions email d'un lead pour adapter mon approche (relancer ou arrêter).

**Acceptance Criteria** :
- [ ] Onglet `Email_Events` dans Google Sheets alimenté par WF3/WF4/WF5
- [ ] Timeline affichée sur la fiche lead avec date + type d'événement
- [ ] Statut actuel mis en évidence (dernier événement)

---

## 4. Out of Scope (v1)

| Feature | Raison du report |
|---|---|
| Mode mobile | Usage exclusivement desktop (Thomas) |
| Multi-utilisateurs | Outil solo, pas de besoin immédiat |
| A/B testing des templates | Complexité non justifiée avant d'avoir des données |
| Intégration CRM externe (HubSpot, Pipedrive) | GSheet suffit pour le volume actuel |
| Graphiques de performance dans le temps | Nice-to-have, pas bloquant pour l'usage |
| Actions manuelles sur les leads (forcer relance) | P2 — utile mais pas critique pour le MVP |

---

## 5. Success Metrics

| Métrique | Cible | Délai | Mesure |
|---|---|---|---|
| Taux d'ouverture email | >30% | 1er mois de campagnes | Google Sheets `taux_ouverture` |
| Taux de réponse email | >5% | 1er mois | Google Sheets `taux_réponse` |
| Temps de création campagne | <2 min | Dès la V1 | Chronométrage manuel |
| Leads qualifiés générés/campagne | >30 | Par campagne | `total_leads_qualified` |
| Appels de découverte générés | 3-5/mois | Mois 1-2 | Suivi manuel |

---

## 6. Technical Constraints

- **Platform** : Web desktop (Next.js 15, App Router, TypeScript, Tailwind)
- **Base de données** : Google Sheets API v4 (Spreadsheet ID : `14Uf6GlvmlCxzaFxENExW-FkCV0CZNQ_7zwzik9SAelY`)
- **Automatisation** : n8n self-hosted sur Hetzner (staging : staging-n8n.kamesai.com / prod : agent.kamesai.com)
- **Email** : Resend (domaine outreach.kamesai.com)
- **Scoring IA** : Claude Haiku via OpenRouter
- **Scraping** : Firecrawl API
- **Déploiement** : Vercel (CI/CD depuis GitHub)
- **Pas de base de données SQL** : décision MVP, GSheet suffit pour le volume solo

---

## 7. Open Questions

- [ ] Quel template email par défaut pour chaque offre Kames ? (lié à ICP.md + email-templates-library.md)
- [ ] Quand migrer de GSheet vers une vraie DB ? (à partir de quel volume de leads ?)
- [ ] Intégrer les templates de email-templates-library.md dans le select "Template email" du formulaire ?

---

## 8. Appendix

### User Flow principal : Lancer une campagne

```
Thomas ouvre /dashboard
  → Clique "Nouvelle campagne"
  → Remplit le formulaire (secteur + ville + offre + template)
  → Soumet → webhook WF1 déclenché
  → Redirection /dashboard — campagne visible en statut "generating"
  → WF1 génère leads → Leads_Raw
  → WF2 qualifie + score → Leads_Qualified
  → Campagne passe en statut "active"
  → WF3 envoie J0 → statut leads = "contacted"
  → J+3 et J+7 envoyés automatiquement par WF5
  → Thomas consulte /dashboard/campaigns/[id] pour voir les réponses
```

### Statuts email du pipeline
```
new → contacted (J0) → relance_1 (J+3) → relance_2 (J+7)
                    ↘ opened → clicked → replied
                    ↘ bounced / disqualified
```
