# Dev Log — Lead Qualifier Dashboard

**Client** : Flinty (usage interne)
**Package** : PRO
**Workflow** : CRM Lead Generation + Cold Email

---

## Historique

### 2026-04-18 — TASK-022 : Cache `sheet_id` + E2E Playwright + CI

- `lib/cache.ts` : TTL 5 min, `invalidateCampaignSheetIdCache()` vide le store
- `getCampaignById` : cache clé `campaignById:{id}` ; `readIndex` une seule fois sur hits répétés ; invalidation après POST `/api/campaigns` 202
- `lib/cache.test.ts` ; `campaigns.test.ts` — scénarios cache + `mockClear` sur `readIndex`
- Playwright : `e2e/flinty-smoke.spec.ts` (tests **HTTP** `request`, pas de binaire Chromium requis pour ce smoke) ; `npm run test:e2e` ; `npm run test:all` = Vitest + E2E
- `vitest.config.ts` : `exclude` **e2e/**
- `.github/workflows/flinty-dashboard-e2e.yml` : push/PR sur le dashboard — Vitest + `playwright install chromium` + E2E
- `.gitignore` : `playwright-report/`, `test-results/` sous le dashboard
- **Prod / n8n / smoke réel** : laissé à Thomas (TASK-022)
- 129 tests Vitest + 3 E2E verts, `npm run build` OK

### 2026-04-18 — TASK-021 : Rate limiting + validation Zod

- Dépendance **`zod`** — pas Upstash : compteurs **in-memory** (`lib/rate-limit.ts` : `checkRateLimit`, `getClientIp`, `resetRateLimitStore` pour tests)
- **`lib/api-schemas.ts`** : `postCampaignBodySchema`, `generateIcpBodySchema`
- **`lib/with-validation.ts`** : `withValidation(req, schema)` → 400 JSON + `issues` flatten si invalide
- **POST `/api/campaigns`** : 10 req/h/IP, validation Zod, `nom` utilisé comme nom de campagne (Index + `createChildGSheet`) ; `icp_md` trimmé
- **POST `/api/campaigns/generate-icp`** : 5 req/min/IP, validation `answers.length === 8` ; 429 avec `Retry-After` + body `retryAfter`
- **GET `/api/campaigns`** : inchangé
- 123 tests Vitest, `npm run build` OK

### 2026-04-18 — TASK-020 : Export multi-format (API + UI)

- `lib/qualified-leads.ts` : `QualifiedLead` + `parseQualifiedLeads` (partagé avec `GET /api/campaigns/[id]`)
- `lib/campaign-export.ts` (TDD) : RFC 4180, 16 colonnes CSV PRD, BOM UTF-8, Instantly (5 colonnes, filtre sans email), JSON indenté
- `GET /api/campaigns/[id]/export?format=csv|json|instantly` + `Content-Disposition` attachment
- Page campagne : 3 liens Export CSV / JSON / Instantly vers l’API
- 110 tests Vitest verts, `npm run build` OK

### 2026-04-18 — TASK-019 : WF3 append Contacts_Registry après envoi J0

- **WF3 `[KAI] WF3 - Envoi Email J0`** : 2 nouveaux nœuds insérés entre `Update statut_email` et `Résumé`
- `Code — Prépare Registry` : normalise `new URL(lead.site).hostname.replace(/^www\./, '').toLowerCase()`, construit `{ domain, contacted_at, campaign_id, status: 'contacted' }`, URL invalide → `domain: ''` + log
- `Append Contacts_Registry` (continueOnFail) : append dans `Contacts_Registry` du GSheet Index (`GOOGLE_INDEX_SHEET_ID`) avec 4 colonnes : `domain | contacted_at | campaign_id | status`
- Le flow continue toujours vers `Résumé` → `Respond to Webhook` (continueOnFail + domain vide toléré)
- Workflow actif, 10 nœuds, structure validée via MCP

### 2026-04-18 — TASK-018 : Contacts_Registry + WF1 filtre doublons domaine

- **WF1 `[KAI] WF1 - Génération Leads`** : 2 nouveaux nœuds insérés entre `Parse Places` et `Append Leads Raw`
- `Read Registry` (GoogleSheets read) : lit `Contacts_Registry!A:A` du GSheet maître Index (`GOOGLE_INDEX_SHEET_ID`) → colonne `domain`
- `Code — Dedup` : construit un `Set` des domaines connus, normalise `new URL(site).hostname.replace(/^www\./, '').toLowerCase()`, filtre les leads déjà prospectés, log `[WF1 Dedup] X leads → Y kept (Z filtrés)`
- Si 0 leads passent le filtre : retourne 1 item SKIP `nom=ALL_FILTERED_BY_DEDUP` pour maintenir le flow icp_md
- URLs invalides → skip silencieux (try/catch)
- Workflow actif, 9 nœuds, structure validée via MCP

### 2026-04-17 — TASK-017 : Drag & drop Kanban + optimistic UI

- `kanban-columns.ts` : ajout export `COLUMN_PRIMARY_STATUT` (mapping colonne → statut_email primaire)
- `KanbanBoard.tsx` : refonte complète avec `DndContext`, `useDroppable` par colonne, `useDraggable` par carte, `DragOverlay` pendant le drag
- Optimistic UI : déplacement immédiat dans le state, PATCH `/api/leads/[id]/status`, rollback + toast erreur si échec
- `kanban/page.tsx` : passage du prop `sheetId` à `KanbanBoard`
- 7 nouveaux tests `COLUMN_PRIMARY_STATUT` → 100/100 tests verts

### 2026-04-17 — TASK-015 : `@dnd-kit` + `PATCH /api/leads/[id]/status`
- ✅ Dépendances `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` ajoutées au dashboard
- ✅ `lib/lead-email-status.ts` + tests : ensemble des statuts v3 (dont `relance_1`, `relance_2`, `disqualified`)
- ✅ `lib/sheets.ts` : `updateChildSheetValues(spreadsheetId, range, values)` pour écriture sur GSheet enfant
- ✅ `app/api/leads/[id]/status/route.ts` : body `{ sheet_id, campaign_id, statut_email }`, lecture `readChildSheet(sheetId, '{campaign_id}_Qualified!A:A')`, mise à jour colonne **S** (`statut_email`), pas de résolution `sheet_id` côté serveur
- ✅ `vitest.config.ts` (alias `@`) — suppression de `lib/analytics.test.ts` vide qui faisait échouer Vitest
- ✅ `lib/types.ts` : union `statut_email` alignée sur les 9 statuts Kanban
- 80 tests Vitest verts, `npm run build` OK

### 2026-04-17 — TASK-016 : Page Kanban + tab de navigation
- ✅ `kanban-columns.ts` (TDD) : `KANBAN_COLUMNS` (6 colonnes) + `groupLeadsByColumn` — 13 tests verts
- ✅ Mapping statuts → colonnes : `new`→Nouveaux, `contacted/relance_1/relance_2`→Contactés, `opened`→Ouvert, `clicked`→Cliqué, `replied`→Répondu, `bounced/disqualified`→Bounced
- ✅ `KanbanBoard.tsx` (Client Component) : 6 colonnes scrollables, cartes avec nom/ville/score coloré, tooltip `personalized_hook` au hover (state local `showHook`)
- ✅ `kanban/page.tsx` (RSC) : `getCampaignById` + `readChildSheet` direct (no HTTP), parse colonnes A-S depuis `{campaign_id}_Qualified`
- ✅ `CampaignTabNav.tsx` (Client Component) : onglets Leads / Kanban, `usePathname` pour détection active, border-bottom #FFA318
- ✅ `CampaignTabNav` ajouté dans `campaigns/[campaign_id]/page.tsx` (avant les filtres)
- 93/93 tests verts, 0 erreur TS sur les fichiers modifiés

### 2026-04-17 — TASK-013 + TASK-014 : Preview Markdown éditable + lancement campagne + WF1 icp_md
- ✅ `campaign-launch.ts` (TDD) : `deriveFormDefaults(answers)` extrait secteur/localisation/offre_kames/taille_equipe des réponses chat et génère un nom de campagne. 7 tests verts.
- ✅ `page.tsx` réécrit : après génération ICP, bascule vers un split-view (textarea éditable gauche + `ReactMarkdown` preview droite) avec formulaire 4 champs pré-remplis (nom, secteur, localisation, offre)
- ✅ Bouton "Lancer la campagne" → POST `/api/campaigns` avec payload complet incluant `icp_md` → 202 → `sessionStorage.setItem(TOAST_KEY)` + `router.push('/dashboard')`
- ✅ `FlashToast.tsx` : composant client monté dans `dashboard/layout.tsx`, lit et efface `flinty.flash_toast` au mount, affiche pendant 4s
- ✅ `react-markdown@10.1.0` installé
- ✅ TASK-014 via subagent n8n MCP : 2 nodes ajoutés à WF1 (`Code — Prépare icp_md` + `Append Config icp_md`), chain = 7 nodes, workflow sauvegardé actif
- ⚠️ Prérequis TASK-014 : l'onglet `Config` du GSheet enfant doit avoir les headers `key` | `value` en ligne 1 (sinon le node Sheets Append ne mappe pas les colonnes)
- 75/75 tests verts, 0 erreur TS sur les fichiers modifiés

### 2026-04-17 — TASK-012 : UI `/dashboard/campaigns/new` — chat séquentiel 8 questions
- ✅ Refonte complète de `app/dashboard/campaigns/new/page.tsx` : remplacement du form v1 par un chat conversationnel
- Nouveau module pur `chat-state.ts` (TDD) : `CAMPAIGN_QUESTIONS` (8 entrées avec keys `secteur_cible`, `pain_points`, `taille_entreprise`, `budget_cible`, `zones_geo`, `proposition_valeur`, `signaux_achat`, `signaux_exclusion`), `submitAnswer` (trim + ignore vide + écrase à `currentIndex`), `goBack` (décrément sans perte), `isComplete`, `currentQuestion`, `getDraftAnswer`
- `chat-state.test.ts` : 9 tests verts (ordre des 8 questions, trim, vide ignoré, retour préserve les données, re-submit après retour écrase, isComplete à 8/8)
- UI : bubbles assistant (gauche, zinc-900) / user (droite, orange #FFA318 sur noir), barre de progression `currentIndex / 8`, textarea avec Enter→submit + Shift+Enter→newline, bouton Retour (ArrowLeft) désactivé à l'index 0, persistance `sessionStorage` (clé `flinty.campaigns.new.chat`) pour survie au refresh
- Quand `isComplete` : CTA `Sparkles + "Générer l'ICP"` → POST `/api/campaigns/generate-icp` `{ answers }` → preview brut du markdown (édition + lancement campagne déféré à TASK-013)
- Bubble user en mode "édition" (currentIndex pointe sur une réponse existante) : style line-through zinc-500 pour indiquer qu'elle va être réécrite
- 68/68 tests passent sur l'ensemble du repo, aucune erreur TS sur les fichiers modifiés

---

### 2026-04-17 — TASK-010 : UI fiche lead enrichie (Next.js)
- ✅ Page `/dashboard/campaigns/[campaign_id]/leads/[lead_id]/page.tsx` réécrite (Server Component)
- Source de données migrée : master sheet hardcodé → `getCampaignById` + `readChildSheet(sheetId, 'Leads_Qualified!A2:W')` (GSheet enfant dynamique)
- Nouveau composant `CopyButton.tsx` (Client Component) : `navigator.clipboard`, feedback visuel 2s, icônes Lucide `Copy`/`Check`
- 4 nouvelles sections : Hook personnalisé (bloc italic + bouton copier) · Signaux d'achat (growth_stage badge coloré, buying_signal, hiring_signals) · Qualité web (score + barre de progression + tags signaux) · Analyse IA (score_reason)
- Badge `growth_stage` : seed=bleu, series_a=violet, established=vert, scale=orange (#FFA318)
- Score coloré dynamique : ≥70 vert · ≥50 jaune · <50 zinc (header + barre web quality)
- Colonne mapping 23 champs (A-W) aligné sur l'output WF2 `Append Leads_Qualified`
- `getLeadEmailEvents`/`getLeadMeetings` wrappés en `.catch(() => [])` — timeline conservée, non bloquante si données absentes
- 0 erreur TypeScript sur les fichiers modifiés

---

### 2026-04-17 — TASK-009 : WF2 — IF Qualified/Rejected + Leads_Rejected (n8n MCP)
- ✅ WF2 passe à 15 nodes : ajout `IF Qualified`, `Append Leads_Rejected`, `Merge Branches`
- Node `IF Qualified` : condition `$json.score >= $json.score_minimum` (dynamique depuis Config)
- Branche TRUE (score ≥ seuil) → `Append Leads_Qualified` (GSheet enfant dynamique via `sheet_id` webhook, 23 colonnes full v3)
- Branche FALSE (score < seuil) → `Append Leads_Rejected` (GSheet enfant dynamique, 7 colonnes : lead_id, campaign_id, nom, site, score, rejection_reason, processed_at ISO)
- `rejection_reason` : fallback `score_reason` si rejection_reason vide
- Les deux branches convergent via `Merge Branches` (mode append) → `Résumé` → `Respond to Webhook`
- `Résumé` mis à jour : retourne `leads_qualified_count`, `leads_rejected_count`, `leads_total`
- `Parse Réponse` mis à jour : `score_minimum` ajouté à l'output pour que le nœud IF puisse le lire
- `Append Leads_Qualified` migré du GSheet maître hardcodé vers le GSheet enfant dynamique

---

### 2026-04-17 — TASK-008 : WF2 — Web Quality Score post-Firecrawl (n8n MCP)
- ✅ Node `Web Quality Score` (Code node) inséré entre Firecrawl et Prépare Prompt — WF2 passe à 12 nodes
- Score déterministe 0–100 : 8 heuristiques pondérées (has_content +15, rich_content +10, https +10, meta_ok +15, has_title +10, recent_copyright +20, social_presence +10, has_email +10)
- Skip gracieux si Firecrawl échoue → score 0, signals `['firecrawl_failed']`
- Firecrawl Scrape mis à jour : formats `['markdown', 'html']` (était `['markdown']`) pour permettre la détection du copyright dans le HTML brut
- `web_quality_score` et `web_quality_signals` propagés dans Prépare Prompt et injectés dans le prompt Claude Scoring (contexte supplémentaire)
- Parse Réponse : `web_quality_score` et `web_quality_signals` (jointés en string) ajoutés à l'output pour usage futur (TASK-010 fiche lead UI)

---

### 2026-04-17 — TASK-007 : WF2 — Claude Opus 4.6 + 14 champs + Config ICP (n8n MCP)
- ✅ WF2 `01BB4q4j1buvWRC6` refondu : 11 nodes (ajout `Read Config`)
- Nouveau node `Read Config` (Code node) : lit `Config!A:B` du GSheet enfant via `httpRequestWithAuthentication`, extrait `icp_md` et `score_minimum` depuis le webhook `sheet_id`
- Modèle remplacé : `claude-haiku-4-5-20251001` → `anthropic/claude-opus-4-6`
- Prompt enrichi : ICP + contenu Firecrawl + structure JSON 14 clés imposée (score, score_reason, email, prénom, poste, taille_equipe, has_ia_services, hiring_signals, growth_stage, buying_signal, personalized_hook, rejection_reason, secteur_détecté, signaux_supplémentaires)
- Headers ajoutés : `HTTP-Referer: https://flinty.kamesai.com`, `Content-Type: application/json`
- `max_tokens` : 600 → 1024
- Parse Réponse : retry à 2 tentatives (clean fences → extract regex JSON object) + 14 champs + alias `raison_score` pour compatibilité Append (TASK-009 refactorisera)
- `statut_email` : piloté par `score_minimum` lu depuis Config (vs seuil fixe 50)
- Connexion : Webhook → Read Config → Read Leads_Raw (Read Leads_Raw maître inchangé — sera migré en TASK-009)

---

### 2026-04-17 — TASK-006 : WF6 refonte loop Index (n8n MCP)
- ✅ WF6 `oWm8alnIlzS9UCTd` refondu : 6 nodes, schedule horaire maintenu
- Ancien WF6 lisait `Leads_Raw`/`Leads_Qualified` depuis un GSheet fixe (architecture v2)
- Nouveau flux : `Read Index Campagnes` → `Filter Active Campaigns` (skip `done`/`paused`) → `SplitInBatches` (batchSize:1) → `Fetch & Calcul Stats` (Code node avec `httpRequestWithAuthentication` vers Sheets API v4 dynamique) → `Update Index Stats` → retour boucle
- Colonnes mises à jour : `total_leads_raw`, `total_leads_qualified`, `emails_envoyes`, `taux_reponse` (suppression `taux_ouverture` non spécifiée dans TASK-006)
- `sheet_id` URL-aware : extraction automatique de l'ID depuis URL complète ou ID direct

---

### 2026-03 — Setup initial
- ✅ Projet Next.js 15 + TypeScript + Tailwind initialisé
- ✅ Google Sheets API v4 connectée (Spreadsheet ID : `14Uf6GlvmlCxzaFxENExW-FkCV0CZNQ_7zwzik9SAelY`)
- ✅ Service account configuré : `lead-qualifier-service@lead-qualifier-mvp.iam.gserviceaccount.com`
- ✅ 5 écrans implémentés : dashboard, nouvelle campagne, détail campagne, fiche lead
- ✅ 6 API routes : campaigns, leads, stats, export
- ✅ 6 workflows n8n (staging-n8n.kamesai.com)

### Décisions techniques
- **Google Sheets vs DB** : Sheets choisi pour simplicité + accès direct Thomas
- **Next.js App Router** : Server Components pour performance (pas de client-side fetch)
- **Pas de Supabase** : Overkill pour MVP, migration possible plus tard

---

## En cours / À faire

- [ ] Déployer sur Vercel (Task 016)
- [ ] Implémenter timeline email complète (onglet `Email_Events` dans GSheet)
- [ ] Actions manuelles sur leads (changer statut, forcer relance)
- [ ] Mode mobile
- [ ] Mise à jour sécurité n8n v2.7.5 (URGENT)

---

---

## Session 2026-04-17 — TASK-005

**Tâche** : API `GET /api/campaigns/[id]` — résolution Index→enfant

**Changements** :
- ✅ Créé `app/api/campaigns/[id]/route.ts` — handler App Router
  - `getCampaignById(id)` → 404 si null
  - `Promise.all` de 3 `readChildSheet` : `{id}_Qualified!A2:U`, `{id}_Rejected!A2:G`, `{id}_Config!A2:C`
  - Parsers inline : `parseQualifiedLeads` (21 cols v3), `parseRejectedLeads` (7 cols), `parseConfig` (key-value Record)
  - Retourne `{ campaign, leads_qualified, leads_rejected, config }`
- ✅ Créé `app/api/campaigns/[id]/route.test.ts` — 6 tests Vitest, tous verts

**Résultat** : `npx vitest run 'route.test'` → 15/15 ✅ · E2E `curl http://localhost:3000/api/campaigns/cmp_6jo0e0jm` → campaign + config (8 champs) + leads vides ✅

---

## Session 2026-04-17 — TASK-003 validée + TASK-004

**TASK-003 E2E validée** :
- Root cause Drive quota (limit=0 sur service account) → Option A : onglets dans GOOGLE_CAMPAIGNS_SHEET_ID
- `createChildGSheet` réécrite pour créer 4 onglets `{campaign_id}_Raw/Qualified/Rejected/Config`
- WF1 mis à jour via n8n MCP : `Code — Prépare` extrait `tab_raw`, `Append Leads Raw` utilise `tab_raw` dynamiquement
- Test E2E : POST `/api/campaigns` → onglets créés + 20 leads Lyon scrapés dans `cmp_6jo0e0jm_Raw` ✅

---

## Session 2026-04-17 — TASK-004

**Tâche** : API `/api/campaigns` GET/POST — création GSheet enfant + Index + WF1

**Changements** :
- ✅ Ajouté `createChildGSheet(sheetName, config)` dans `lib/sheets.ts`
  - Crée le spreadsheet via Sheets API (Service Account)
  - Déplace dans `GOOGLE_DRIVE_FOLDER_ID` via Drive API
  - Setup 4 onglets (Leads_Raw, Leads_Qualified, Leads_Rejected, Config) + headers v3
  - Écrit les 8 lignes Config (dont score_minimum=60)
- ✅ Réécrit `app/api/campaigns/route.ts` (v1 mono-sheet → v3 multi-campagne)
  - GET : `listCampaigns()` depuis Index
  - POST : createChildGSheet → appendIndex → WF1 webhook (fire-and-forget) → 202
- ✅ Créé `app/api/campaigns/route.test.ts` — 9 tests Vitest, tous verts

**Résultat** : `npm run test -- campaigns/route` → 9/9 ✅ · Suite complète → 53/53 ✅

---

## Session 2026-04-16 — TASK-003 (suite)

**Tâche** : WF1 refonte — déploiement direct sur staging via n8n REST API

**Changements** :
- ✅ Workflow `OnpGdsIZQShrN4P1` mis à jour directement sur `staging-n8n.kamesai.com` via `PUT /api/v1/workflows/{id}`
- ✅ 11 nodes déployés : Webhook → Code (IDs) → HTTP Drive (create GSheet) → Code (Merge) → HTTP (batchUpdate tabs) → HTTP (headers) → HTTP (Config) → Append Campagnes (v3 schema 13 cols) → Google Places API → Parse Places → Append Leads Raw (dynamic child sheet)
- ✅ Webhook path : `flinty-wf1-launch` (mis à jour depuis `kai-v2-gen-leads`)
- ✅ Append Campagnes : schéma v3 avec `sheet_id`, `sheet_url` ajoutés
- ✅ Append Leads Raw : écrit dans le GSheet enfant dynamique (`$('Code — Merge données').first().json.spreadsheet_id`)
- 🔄 **En attente de validation Thomas** : test curl (4 critères d'acceptance)

**Résultat** : Workflow actif, 11 nodes confirmés via GET API

**Test** :
```bash
curl -X POST https://staging-n8n.kamesai.com/webhook/flinty-wf1-launch \
  -H "Content-Type: application/json" \
  -d '{"secteur":"Marketing","localisation":"Paris","villes":"Paris, Lyon","offre_kames":"Audit IA","taille_equipe":"10-50","poste_cible":"Directeur Marketing","template_email":"j0_default","icp_md":"# ICP Test"}'
```

**Résultat attendu** : GSheet enfant dans Drive + ligne Index + 4 onglets + Config.score_minimum=60

---

## Session 2026-04-16 — TASK-002

**Tâche** : `lib/sheets.ts` + `lib/campaigns.ts` — résolution sheet_id via Index

**Changements** :
- ✅ Créé `lib/types.ts` — types v3 : `Campaign` (avec sheet_id/sheet_url, statuts new|active|paused|done), `Lead`, `ContactRegistryEntry`
- ✅ Étendu `lib/sheets.ts` — ajout `readIndex()`, `appendIndex(row)`, `updateIndex(campaignId, patch)`, `readChildSheet(sheetId, range)` sur `GOOGLE_INDEX_SHEET_ID`
- ✅ Créé `lib/campaigns.ts` — `listCampaigns()`, `getCampaignById(id)`, `parseIndexCampaigns()` (exportée pour tests)
- ✅ Créé `lib/campaigns.test.ts` — 10 tests Vitest, tous verts

**Résultat** : `npm run test -- campaigns` → 10/10 ✅

---

## Workflows n8n

| ID | Nom | Statut |
|---|---|---|
| `OnpGdsIZQShrN4P1` | WF1 - Génération Leads | ✅ Actif staging |
| `01BB4q4j1buvWRC6` | WF2 - Qualification | ✅ Actif staging |
| `dfe1jIPlZA10dqJK` | WF3 - Email J0 | ✅ Actif staging |
| `oCViFcjPo2nNUjlR` | WF4 - Webhooks Resend | ✅ Actif staging |
| `7re2WS3ghacqHsLE` | WF5 - Relances Auto | ✅ Actif staging |
| `oWm8alnIlzS9UCTd` | WF6 - Stats | ✅ Actif staging |
