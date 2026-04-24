# TASK-028 — Onglet Data business + marketing + commercial

**Priorité** : 🔴 P1 — Tour de controle de Flinty
**Statut** : ✅ Complété
**Nécessite** : Donnees campagnes/leads existantes +, idealement, `TASK-026` et `TASK-027` pour enrichir les analyses
**Référence** : `clients/lead-gen/CRMupgrade.md` sections `3.E`, `5`, `11`, `13`

---

## Objectif

Créer un onglet `Data` exhaustif qui centralise :

- le **pilotage business**,
- l'**analyse marketing**,
- l'**analyse commerciale**.

Cette page doit devenir la tour de controle analytique du CRM, y compris pour les campagnes archivees.

---

## Ce qu'il faut faire

### 1. Créer la base analytique côté Google Sheets

Ajouter une source `Analytics_Daily` ou equivalent, qui permet de stocker des snapshots journaliers par campagne.

Structure minimale recommandee :

```txt
snapshot_date | campaign_id | campaign_status | leads_raw | leads_qualified | emails_sent | opens | clicks | replies | meetings | reply_rate | booking_rate | top_template | metadata
```

Si certains champs ne sont pas encore disponibles, ils peuvent etre calcules partiellement ou initialises a `0`.

### 2. Ajouter une couche d’agrégation dans Next.js

Creer les utilitaires necessaires pour :

- lire les donnees actives et archivees,
- consolider campagnes + leads + meetings + templates,
- calculer les KPIs globaux,
- produire des vues prêtes pour les composants UI.

### 3. Créer la page `/dashboard/data`

La page doit au minimum comporter 3 sous-vues claires :

- `Business`
- `Marketing`
- `Commercial`

Chaque sous-vue doit avoir :

- des KPI cards,
- des tableaux filtrables,
- des comparaisons utiles,
- une distinction entre campagnes actives et archivees.

### 4. Utiliser une base d’UI type shadcn

Le document produit demande des elements `shadcn`.

Si la stack n'est pas encore initialisee pour `shadcn/ui`, le minimum attendu est :

- une structure visuelle et interactionnelle inspirée de `shadcn`,
- composants reutilisables de type `Tabs`, `Card`, `Table`, `Badge`, `Select`, `Dialog` ou equivalent local.

### 5. Brancher les bons indicateurs

La page doit afficher, quand la donnee existe :

- campagnes totales / actives / archivees,
- leads generes / qualifies,
- emails envoyes,
- taux d'ouverture,
- taux de clic,
- taux de reponse,
- taux de booking,
- performances par template,
- performances par segment,
- reponses en attente,
- rendez-vous a venir.

---

## Must Have

- [x] Nouvelle page `/dashboard/data`
- [x] Vue active + archivee
- [x] 3 axes lisibles : business / marketing / commercial
- [x] KPIs globaux fiables a partir des donnees disponibles
- [x] Filtres minimum par campagne, statut et periode
- [x] UI homogène avec le design system noir/orange existant

## Should Have

- [ ] Comparaison periode courante vs periode precedente
- [x] Tableau des meilleurs templates
- [ ] Mini-funnel global
- [ ] Export CSV des donnees filtrees

## Must NOT

- [ ] Ne pas attendre une base SQL pour livrer cette page
- [ ] Ne pas introduire de graphiques lourds si des tableaux + barres suffisent
- [ ] Ne pas afficher des KPI faux quand la source manque : assumer `0` ou `N/A`
- [ ] Ne pas coupler la page uniquement aux campagnes actives

---

## Fichiers cibles

- `app/dashboard/layout.tsx`
- `app/dashboard/data/page.tsx`
- `app/api/stats/route.ts`
- `lib/sheets.ts`

Optionnel selon implementation :

- `app/dashboard/data/DataTabs.tsx`
- `app/dashboard/data/KpiCard.tsx`
- `app/dashboard/data/CampaignsPerformanceTable.tsx`
- `app/dashboard/data/TemplatesPerformanceTable.tsx`

---

## Critères de validation

- [x] La sidebar permet d'ouvrir `/dashboard/data`
- [x] Les campagnes archivees sont visibles dans l'analyse
- [x] Les sections `Business`, `Marketing`, `Commercial` sont clairement distinctes
- [x] Les KPIs se chargent sans erreur a partir de Google Sheets
- [x] Les filtres changent bien les tableaux et cards affiches
- [x] La page reste lisible meme avec peu de donnees

---

## Dépendances

### Bloqué par

- Aucune dependance stricte pour une V1

### Bloque

- `TASK-030` — Unified Inbox en lecture centralisee

---

## Notes

Le but n'est pas de faire un outil BI generique. Il faut une page **utile pour Flinty au quotidien** :

- comprendre ce qui marche,
- prioriser les campagnes,
- reperer les goulots d'etranglement,
- identifier les meilleurs templates et segments.
