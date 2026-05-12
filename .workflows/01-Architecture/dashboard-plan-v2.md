# Flinty Dashboard — Plan d'Implémentation v2

> **For Claude Code CLI:** Follow this plan task-by-task. Execute each step, report the result, then move to the next. Do NOT skip steps. Do NOT proceed if a step fails — stop and report the error.

**Goal:** Construire un dashboard Next.js complet pour gérer les campagnes de prospection cold email de Flinty, de la génération de leads jusqu'au suivi des séquences email.

**Client:** Flinty (usage interne)

**Architecture:**
- Google Sheets = base de données (4 onglets : Campagnes, Leads_Raw, Leads_Qualified, Config)
- n8n (agent.kamesai.com) = moteur d'automatisation (6 workflows)
- Resend.com = envoi emails cold outreach via outreach.kamesai.com
- Next.js (repo kames-site, App Router) = dashboard UI déployé sur Vercel

**Vision long terme (architecturée dès maintenant):** Un GSheet par campagne avec ses propres onglets Raw/Qualified/Config. Les API routes filtrent toujours par `campaign_id` pour rendre cette migration triviale.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Google Sheets API v4, n8n webhooks, Resend API

**Repo local:** Le repo `kames-site` est déjà ouvert dans Cursor

**Prerequisites:**
- [ ] Repo `kames-site` ouvert dans Cursor (terminal disponible)
- [ ] Accès Google Cloud Console (pour activer Sheets API + créer service account)
- [ ] Compte Resend.com créé
- [ ] n8n prod opérationnel sur `https://agent.kamesai.com`
- [ ] Vercel connecté au repo GitHub

---

## Structure des fichiers Next.js

```
app/
├── dashboard/
│   ├── layout.tsx                                  → Sidebar + layout global
│   ├── page.tsx                                    → Vue Campagnes (liste)
│   └── campaigns/
│       ├── new/page.tsx                            → Formulaire nouvelle campagne
│       └── [campaign_id]/
│           ├── page.tsx                            → Détail campagne + leads qualifiés
│           └── leads/
│               └── [lead_id]/page.tsx              → Fiche lead + historique emails
└── api/
    ├── campaigns/route.ts                          → GET liste / POST nouvelle campagne
    ├── campaigns/[id]/route.ts                     → GET détail + stats + leads
    ├── leads/route.ts                              → GET leads filtrés par campaign_id
    ├── leads/[id]/route.ts                         → GET fiche lead
    └── email-events/route.ts                       → GET historique emails par lead_id
```

---

## Structure Google Sheets — "Flinty"

### Onglet 1 — Campagnes
```
campaign_id | nom | secteur | localisation | date_création | offre_kames | statut
| total_leads_raw | total_leads_qualified | emails_envoyés | taux_ouverture | taux_réponse
```
> Colonnes stats mises à jour automatiquement toutes les heures par WF6.

### Onglet 2 — Leads_Raw
```
lead_id | campaign_id | nom | site | ville | téléphone | rating | reviews_count | maps_url | found_at
```
> Données brutes issues de Google Maps Places API. Non encore qualifiées.

### Onglet 3 — Leads_Qualified
```
lead_id | campaign_id | nom | site | ville | score | email | téléphone | prénom | poste
| secteur | taille_equipe | has_ia_services | statut_email
```
> Leads enrichis par Firecrawl + scorés par Claude.
> `statut_email` évolue : `new` → `contacted` → `relance_1` → `relance_2` → `opened` / `clicked` / `replied` / `bounced`

### Onglet 4 — Config
```
param_key | param_value | description
```
> Paramètres ICP par défaut : secteur, villes, taille équipe, poste ciblé, offre Flinty, template email.
> Sert à pré-remplir le formulaire de nouvelle campagne.

---

## BLOC 1 — Fondations (Google Sheets + Resend)

> Durée estimée : 2-3h | Ces étapes sont obligatoires avant tout le reste.

---

### Tâche 1.1 — Créer le Google Sheet "Flinty"

**Ce qu'on fait :** Créer la base de données Google Sheets avec les 4 onglets bien structurés.

---

#### Étape 1.1.1 — Créer le Google Sheet

**Action :**
1. Va sur [sheets.google.com](https://sheets.google.com) → clique **"+ Nouveau"**
2. Clique sur le nom en haut → renomme en : `Flinty`
3. Note l'URL : `https://docs.google.com/spreadsheets/d/XXXXXXXX.../edit`
4. **Copie l'ID** (la partie entre `/d/` et `/edit`) → colle dans Notion, tu en auras besoin partout.
   Exemple : `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`

**Résultat attendu :** Google Sheet ouvert avec un onglet "Feuille 1"

---

#### Étape 1.1.2 — Onglet "Campagnes"

**Action :**
1. Double-clique sur "Feuille 1" → renomme en : `Campagnes`
2. Ligne 1, colonnes A → L :

```
A1: campaign_id
B1: nom
C1: secteur
D1: localisation
E1: date_création
F1: offre_kames
G1: statut
H1: total_leads_raw
I1: total_leads_qualified
J1: emails_envoyés
K1: taux_ouverture
L1: taux_réponse
```

**Résultat attendu :** 12 colonnes d'en-têtes en ligne 1

---

#### Étape 1.1.3 — Onglet "Leads_Raw"

**Action :**
1. Clique **"+"** en bas → renomme en : `Leads_Raw`
2. Ligne 1, colonnes A → J :

```
A1: lead_id
B1: campaign_id
C1: nom
D1: site
E1: ville
F1: téléphone
G1: rating
H1: reviews_count
I1: maps_url
J1: found_at
```

**Résultat attendu :** 10 colonnes d'en-têtes

---

#### Étape 1.1.4 — Onglet "Leads_Qualified"

**Action :**
1. **"+"** → renomme en : `Leads_Qualified`
2. Ligne 1, colonnes A → N :

```
A1: lead_id
B1: campaign_id
C1: nom
D1: site
E1: ville
F1: score
G1: email
H1: téléphone
I1: prénom
J1: poste
K1: secteur
L1: taille_equipe
M1: has_ia_services
N1: statut_email
```

**Résultat attendu :** 14 colonnes d'en-têtes

---

#### Étape 1.1.5 — Onglet "Config"

**Action :**
1. **"+"** → renomme en : `Config`
2. Ligne 1 :

```
A1: param_key    B1: param_value    C1: description
```

3. Remplis les lignes 2 → 7 avec tes valeurs ICP par défaut :

```
A2: secteur_defaut        B2: plomberie              C2: Secteur cible principal
A3: ville_defaut          B3: Bordeaux               C3: Ville cible principale
A4: taille_equipe_defaut  B4: 1-10                   C4: Taille d'équipe cible
A5: poste_cible_defaut    B5: Gérant                 C5: Poste du décideur
A6: offre_defaut          B6: Répondeur IA 24/7      C6: Offre Flinty à proposer
A7: template_defaut       B7: Template #1 - Intro    C7: Template email de départ
```

**Résultat attendu :** 4 onglets en bas — Campagnes | Leads_Raw | Leads_Qualified | Config

---

### Tâche 1.2 — Configurer l'accès API Google Sheets dans n8n

**Ce qu'on fait :** Créer un Service Account Google qui permet à n8n de lire/écrire dans le GSheet.

---

#### Étape 1.2.1 — Créer un projet Google Cloud

**Action :**
1. Va sur [console.cloud.google.com](https://console.cloud.google.com)
2. Sélecteur de projet (haut gauche) → **"Nouveau projet"**
3. Nom : `kames-crm-api` → **"Créer"** → attends 30 secondes
4. Vérifie que `kames-crm-api` est sélectionné

**Résultat attendu :** Projet créé et sélectionné

---

#### Étape 1.2.2 — Activer l'API Google Sheets

**Action :**
1. Barre de recherche → `Google Sheets API` → clique dessus → **"Activer"**

**Résultat attendu :** "API activée" affiché

---

#### Étape 1.2.3 — Créer un Service Account

**Action :**
1. Menu gauche → **"Identifiants"** → **"+ Créer des identifiants"** → **"Compte de service"**
2. Nom : `kames-n8n-sheets` | Description : `Accès n8n vers GSheet Flinty`
3. **"Créer et continuer"** → **"Continuer"** → **"OK"**

**Résultat attendu :** Email créé : `kames-n8n-sheets@kames-crm-api.iam.gserviceaccount.com`

---

#### Étape 1.2.4 — Télécharger la clé JSON

**Action :**
1. "Identifiants" → section "Comptes de service" → clique sur l'email
2. Onglet **"Clés"** → **"Ajouter une clé"** → **"Créer une clé"** → **JSON** → **"Créer"**
3. Renomme le fichier téléchargé en `google-service-account.json`
4. Ouvre-le → copie la valeur de `"client_email"` → colle dans Notion

**Résultat attendu :** Fichier JSON contenant `"type": "service_account"`

---

#### Étape 1.2.5 — Partager le GSheet avec le Service Account

**Action :**
1. Retourne sur "Flinty" → **"Partager"** (bouton bleu haut droite)
2. Colle l'adresse `client_email` du fichier JSON
3. Rôle : **"Éditeur"** | Décoche "Envoyer une notification" → **"Partager"**

**Résultat attendu :** Service Account dans la liste des accès avec rôle "Éditeur"

---

#### Étape 1.2.6 — Créer la credential dans n8n

**Action :**
1. [agent.kamesai.com](https://agent.kamesai.com) → **"Credentials"** → **"+ Add credential"** → **"Google Sheets"**
2. Dans **"Service Account Key JSON"** : colle le contenu ENTIER du fichier JSON
3. **"Test"** → attends "Connection tested successfully"
4. Nom : `Google Sheets - Flinty` → **"Save"**

**Résultat attendu :** Credential sauvegardée avec carré vert ✅

---

### Tâche 1.3 — Configurer Resend + domaine outreach.kamesai.com

---

#### Étape 1.3.1 — Compte Resend

**Action :**
1. [resend.com](https://resend.com) → **"Get started"** → crée compte avec `contact.kamesai@gmail.com`
2. Vérifie l'email → connecte-toi

**Résultat attendu :** Dashboard Resend, plan "Free" (3 000 emails/mois)

---

#### Étape 1.3.2 — Ajouter le domaine

**Action :**
1. **"Domains"** → **"Add Domain"**
2. Domaine : `outreach.kamesai.com` | Région : **"EU (Ireland)"** → **"Add"**
3. Resend affiche les enregistrements DNS à créer — **NE FERME PAS CETTE PAGE**

---

#### Étape 1.3.3 — Configurer les DNS chez Hostinger

**Action :**
1. [hpanel.hostinger.com](https://hpanel.hostinger.com) → Domaines → `kamesai.com` → DNS / Zone DNS
2. Pour chaque enregistrement de la page Resend → **"Ajouter un enregistrement"** :

   **SPF (TXT) :**
   - Type : `TXT` | Host : `outreach` | Valeur : copie depuis Resend | TTL : `3600`

   **DKIM (CNAME x2) :**
   - Type : `CNAME` | Host : copie depuis Resend | Valeur : copie depuis Resend | TTL : `3600`

3. **"Enregistrer"** après chaque ajout

---

#### Étape 1.3.4 — Vérifier le domaine

**Action :**
1. Page domaine Resend → **"Verify Domain"**
2. Si pas encore vérifié : les DNS prennent jusqu'à 24h — continue et reviens vérifier

**Résultat attendu :** Domaine `outreach.kamesai.com` marqué **"Verified"** ✅

---

### Tâche 1.4 — Créer la credential Resend dans n8n

---

#### Étape 1.4.1 — Récupérer la clé API

**Action :**
1. Dashboard Resend → **"API Keys"** → **"Create API Key"**
2. Nom : `kames-n8n-prod` | Permission : **"Full access"** → **"Add"**
3. **COPIE LA CLÉ IMMÉDIATEMENT** (format `re_XXXX`) → colle dans Notion

---

#### Étape 1.4.2 — Créer la credential dans n8n

**Action :**
1. n8n → **"Credentials"** → **"+ Add credential"** → **"Header Auth"**
2. Nom : `Resend API` | Name : `Authorization` | Value : `Bearer re_XXXX`
3. **"Save"**

---

## BLOC 2 — Workflows n8n (le moteur)

> Durée estimée : 6-8h

---

### Tâche 2.1 — Workflow #1 : Génération leads depuis formulaire

**Ce qu'on fait :** Recevoir les paramètres de campagne, appeler Google Maps Places API, stocker dans Leads_Raw, initialiser la ligne dans Campagnes.

**Nodes :** Webhook → Code → HTTP Request (Places API) → Code (parse) → Google Sheets (Campagnes) → Google Sheets (Leads_Raw) → Respond to Webhook

---

#### Étape 2.1.1 — Créer le workflow

1. n8n → **"+ New workflow"** → nommer : `[KAI] WF1 - Génération Leads` → **Save**

---

#### Étape 2.1.2 — Webhook trigger

1. **"+"** → **"Webhook"**
   - Method : `POST` | Path : `kames-generate-leads` | Respond : `Using 'Respond to Webhook' Node`
2. **"Test step"** → **"Listen for test event"** → copie l'URL test

---

#### Étape 2.1.3 — Tester la réception

Dans le terminal Cursor (PowerShell) :

```powershell
Invoke-RestMethod -Method POST `
  -Uri "https://agent.kamesai.com/webhook-test/kames-generate-leads" `
  -ContentType "application/json" `
  -Body '{"nom":"Test Plombiers Bdx","secteur":"plomberie","localisation":"Bordeaux","offre_kames":"Repondeur IA 24/7","taille_equipe":"1-10","date_lancement":"now"}'
```

**Résultat attendu :** n8n affiche les données reçues dans le webhook node

---

#### Étape 2.1.4 — Code node : prépare les paramètres

```javascript
const input = $input.item.json;
const campaign_id = 'CAM_' + Date.now();

return [{
  json: {
    campaign_id,
    nom: input.nom,
    secteur: input.secteur,
    localisation: input.localisation,
    offre_kames: input.offre_kames,
    taille_equipe: input.taille_equipe || '1-10',
    date_création: new Date().toISOString(),
    statut: 'generating',
    search_query: input.secteur + ' ' + input.localisation
  }
}];
```

**Résultat attendu :** `campaign_id` généré (ex: `CAM_1708123456789`)

---

#### Étape 2.1.5 — Google Sheets : écriture dans Campagnes

- Operation : `Append or Update Row` | Sheet : `Campagnes` | Mapping : manual
- Mappe toutes les colonnes A→L depuis `$json` (les stats à 0 au démarrage)

**Résultat attendu :** 1 ligne ajoutée dans l'onglet Campagnes du GSheet

---

#### Étape 2.1.6 — HTTP Request : Google Maps Places API

- Method : `GET` | URL : `https://maps.googleapis.com/maps/api/place/textsearch/json`
- Query params :
  - `query` → `{{ $('Code').item.json.search_query }}`
  - `key` → `[TA CLÉ GOOGLE MAPS API]` (Google Cloud Console → Identifiants → Clé API)
  - `language` → `fr` | `region` → `fr`

**Résultat attendu :** JSON avec `"status": "OK"` et une liste de `results`

---

#### Étape 2.1.7 — Code node : parse Places API

```javascript
const placesData = $input.item.json;
const campaignData = $('Code').item.json;

if (!placesData.results || placesData.results.length === 0) {
  return [{ json: { error: 'Aucun résultat', campaign_id: campaignData.campaign_id } }];
}

return placesData.results.map((place, index) => ({
  json: {
    lead_id: 'RAW_' + Date.now() + '_' + index,
    campaign_id: campaignData.campaign_id,
    nom: place.name || '',
    site: place.website || '',
    ville: campaignData.localisation,
    téléphone: place.formatted_phone_number || '',
    rating: place.rating || 0,
    reviews_count: place.user_ratings_total || 0,
    maps_url: 'https://www.google.com/maps/place/?q=place_id:' + (place.place_id || ''),
    found_at: new Date().toISOString()
  }
}));
```

**Résultat attendu :** Un item par entreprise trouvée

---

#### Étape 2.1.8 — Google Sheets : écriture dans Leads_Raw

- Operation : `Append Row` | Sheet : `Leads_Raw`
- Mappe toutes les colonnes A→J depuis `$json`

---

#### Étape 2.1.9 — Respond to Webhook

```json
{
  "success": true,
  "campaign_id": "={{ $('Code').item.json.campaign_id }}",
  "leads_raw_count": "={{ $items().length }}"
}
```

**Save** → **Active le workflow** (toggle haut droite → vert)

---

### Tâche 2.2 — Workflow #2 : Qualification leads (Firecrawl + Claude)

**Ce qu'on fait :** Pour chaque lead dans Leads_Raw, scraper le site avec Firecrawl, scorer avec Claude, écrire dans Leads_Qualified.

---

#### Étape 2.2.1 — Créer le workflow

`[KAI] WF2 - Qualification Leads` | Webhook : `POST` | Path : `kames-qualify-leads`

---

#### Étape 2.2.2 — Lire Leads_Raw de la campagne

Google Sheets : `Get Many Rows` | Sheet : `Leads_Raw` | Filter : `campaign_id` = `{{ $json.campaign_id }}`

---

#### Étape 2.2.3 — Firecrawl : scraping du site

- Method : `POST` | URL : `https://api.firecrawl.dev/v0/scrape`
- Header : `Authorization: Bearer [TA CLÉ FIRECRAWL]`
- Body :
```json
{ "url": "={{ $json.site }}", "pageOptions": { "onlyMainContent": true } }
```
- Active **"Continue On Fail"** (certains sites bloquent)

---

#### Étape 2.2.4 — Claude API : score + extraction contact

- Method : `POST` | URL : `https://api.anthropic.com/v1/messages`
- Headers : `x-api-key: [CLÉ ANTHROPIC]` | `anthropic-version: 2023-06-01` | `content-type: application/json`
- Body :
```json
{
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 600,
  "messages": [{
    "role": "user",
    "content": "Tu es expert en qualification B2B pour le produit SaaS Flinty. Analyse cette entreprise et retourne UNIQUEMENT un JSON valide, rien d'autre.\n\nEntreprise: {{ $('Google Sheets').item.json.nom }}\nVille: {{ $('Google Sheets').item.json.ville }}\nRating Google: {{ $('Google Sheets').item.json.rating }}/5 ({{ $('Google Sheets').item.json.reviews_count }} avis)\nContenu site web: {{ $json.data.content.substring(0, 2000) }}\n\nJSON attendu :\n{\"score\": 75, \"prénom\": \"Jean\", \"poste\": \"Gérant\", \"email\": \"contact@example.com\", \"taille_equipe\": \"5-10\", \"has_ia_services\": false, \"raison_score\": \"PME active avec process répétitifs\"}"
  }]
}
```

---

#### Étape 2.2.5 — Code node : parse réponse Claude

```javascript
const anthropicResponse = $input.item.json;
const rawLead = $('Google Sheets').item.json;
const content = anthropicResponse.content[0].text;

let parsed = { score: 50, prénom: '', poste: '', email: '', taille_equipe: '', has_ia_services: false, raison_score: '' };

try {
  const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
  parsed = { ...parsed, ...JSON.parse(cleaned) };
} catch(e) {
  const m = content.match(/"score":\s*(\d+)/);
  if (m) parsed.score = parseInt(m[1]);
}

return [{
  json: {
    lead_id: rawLead.lead_id,
    campaign_id: rawLead.campaign_id,
    nom: rawLead.nom,
    site: rawLead.site,
    ville: rawLead.ville,
    score: parsed.score,
    email: parsed.email || '',
    téléphone: rawLead.téléphone || '',
    prénom: parsed.prénom || '',
    poste: parsed.poste || '',
    secteur: rawLead.secteur || '',
    taille_equipe: parsed.taille_equipe || '',
    has_ia_services: parsed.has_ia_services ? 'true' : 'false',
    statut_email: parsed.score >= 50 ? 'new' : 'disqualified'
  }
}];
```

---

#### Étape 2.2.6 — Google Sheets : écriture dans Leads_Qualified

- Operation : `Append Row` | Sheet : `Leads_Qualified` | Mappe toutes les colonnes A→N
- Ajoute **Respond to Webhook** → `{"success": true}`
- **Save** → **Active**

---

### Tâche 2.3 — Workflow #3 : Envoi email J0

**Ce qu'on fait :** Pour les leads qualifiés (score ≥ 50, statut_email = 'new'), envoyer le premier cold email.

---

#### Étape 2.3.1 — Créer le workflow

`[KAI] WF3 - Envoi Email J0` | Webhook : `POST` | Path : `kames-send-email-j0`

---

#### Étape 2.3.2 — Lire les leads qualifiés

Google Sheets : `Get Many Rows` | Sheet : `Leads_Qualified`
- Filter 1 : `campaign_id` = `{{ $json.campaign_id }}`
- Filter 2 : `statut_email` = `new`

Ajoute un **IF** node : `{{ $json.email }}` is not empty (évite les leads sans email)

---

#### Étape 2.3.3 — Envoi via Resend API

- Method : `POST` | URL : `https://api.resend.com/emails`
- Credential : `Resend API` (Header Auth)
- Body :
```json
{
  "from": "Thomas de Flinty <thomas@outreach.kamesai.com>",
  "to": ["={{ $json.email }}"],
  "subject": "={{ $json.nom }} — une question rapide",
  "html": "<p>Bonjour {{ $json.prénom }},</p><p>J'ai trouvé <strong>{{ $json.nom }}</strong> en cherchant des {{ $json.secteur }} à {{ $json.ville }}.</p><p>Chez Flinty, on aide les TPE/PME à automatiser leurs tâches répétitives (relances, qualification leads, reporting) grâce à l'IA. On a aidé une entreprise similaire à économiser 8h/semaine.</p><p>Seriez-vous disponible 15 minutes ?</p><p>Thomas Callendreau — Flinty</p>"
}
```
- Active **"Continue On Fail"**

---

#### Étape 2.3.4 — Mettre à jour statut_email

Google Sheets : `Update Row` | Sheet : `Leads_Qualified`
- Match : `lead_id` = `{{ $('Google Sheets').item.json.lead_id }}`
- Update : `statut_email` = `contacted`

**Respond to Webhook** → `{"success": true}` | **Save** → **Active**

---

### Tâche 2.4 — Workflow #4 : Réception webhooks Resend

---

#### Étape 2.4.1 — Créer et activer le workflow en premier

`[KAI] WF4 - Webhooks Resend` | Webhook : `POST` | Path : `kames-resend-events` | Respond : `Immediately`

⚠️ **Active le workflow MAINTENANT** avant de configurer Resend.
URL de prod : `https://agent.kamesai.com/webhook/kames-resend-events`

---

#### Étape 2.4.2 — Configurer dans Resend

1. Dashboard Resend → **"Webhooks"** → **"Add Webhook"**
2. URL : `https://agent.kamesai.com/webhook/kames-resend-events`
3. Events : `email.opened` | `email.clicked` | `email.bounced` | `email.delivery_delayed`

**Résultat attendu :** Webhook "Active" dans Resend

---

#### Étape 2.4.3 — Logique de mise à jour

Code node :
```javascript
const event = $input.item.json;
const statusMap = {
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
};
return [{
  json: {
    new_status: statusMap[event.type] || event.type,
    resend_email_id: event.data?.email_id || '',
    timestamp: new Date().toISOString()
  }
}];
```

> ⚠️ Ajoute la colonne `resend_email_id` (O) dans Leads_Qualified et mets-la à jour dans WF3 depuis la réponse Resend (`{{ $json.id }}`).

Google Sheets : `Update Row` | Sheet : `Leads_Qualified` | Match : `resend_email_id` | Update : `statut_email`

---

### Tâche 2.5 — Workflow #5 : Relances automatiques J+3 et J+7

---

#### Étape 2.5.1 — Créer le workflow

`[KAI] WF5 - Relances Auto J+3 J+7` | **Schedule Trigger** : toutes les 1 heure

---

#### Étape 2.5.2 — Lire les leads à relancer

Google Sheets : `Get Many Rows` | Sheet : `Leads_Qualified` | Filter : `statut_email` = `contacted`

> ⚠️ Ajoute la colonne `last_email_sent_at` (P) dans Leads_Qualified. WF3 doit la remplir à l'envoi.

---

#### Étape 2.5.3 — Filtrer J+3 et J+7

```javascript
const leads = $input.all();
const now = new Date();

const toContact = leads.filter(item => {
  const lead = item.json;
  if (!lead.last_email_sent_at) return false;
  const days = (now - new Date(lead.last_email_sent_at)) / (1000 * 60 * 60 * 24);
  if (days >= 3 && days < 4 && lead.statut_email === 'contacted') return true;
  if (days >= 7 && days < 8 && lead.statut_email === 'relance_1') return true;
  return false;
}).map(item => ({
  json: {
    ...item.json,
    email_step: item.json.statut_email === 'contacted' ? 'J+3' : 'J+7',
    next_status: item.json.statut_email === 'contacted' ? 'relance_1' : 'relance_2'
  }
}));

return toContact.length > 0 ? toContact : [{ json: { skip: true } }];
```

---

#### Étape 2.5.4 — IF node + envoi relance

IF node : `{{ $json.skip }}` = `true` → fin | sinon → envoi

HTTP Request Resend :
```json
{
  "from": "Thomas de Flinty <thomas@outreach.kamesai.com>",
  "to": ["={{ $json.email }}"],
  "subject": "Re: {{ $json.nom }} — ma proposition",
  "html": "<p>Bonjour {{ $json.prénom }},</p><p>Je me permets de revenir suite à mon message précédent.</p><p>15 minutes d'échange cette semaine ?</p><p>Thomas — Flinty</p>"
}
```

Google Sheets : Update `statut_email` → `{{ $json.next_status }}` + `last_email_sent_at` → now

**Save** → **Active**

---

### Tâche 2.6 — Workflow #6 : Calcul stats toutes les heures

---

#### Étape 2.6.1 — Créer le workflow

`[KAI] WF6 - Calcul Stats Campagnes` | **Schedule Trigger** : toutes les 1 heure

---

#### Étape 2.6.2 — Lire les 3 onglets

3 nodes Google Sheets en parallèle :
- `Get Many Rows` sur `Campagnes`
- `Get Many Rows` sur `Leads_Raw`
- `Get Many Rows` sur `Leads_Qualified`

---

#### Étape 2.6.3 — Code : calcul par campagne

```javascript
const campaigns = $('Google Sheets').all().map(i => i.json);
const rawLeads = $('Google Sheets1').all().map(i => i.json);
const qualLeads = $('Google Sheets2').all().map(i => i.json);

return campaigns.map(campaign => {
  const cid = campaign.campaign_id;
  const raw = rawLeads.filter(l => l.campaign_id === cid);
  const qual = qualLeads.filter(l => l.campaign_id === cid);
  const sent = qual.filter(l => ['contacted','relance_1','relance_2','opened','clicked','replied'].includes(l.statut_email)).length;
  const opened = qual.filter(l => ['opened','clicked','replied'].includes(l.statut_email)).length;
  const replied = qual.filter(l => l.statut_email === 'replied').length;
  
  return {
    json: {
      campaign_id: cid,
      total_leads_raw: raw.length,
      total_leads_qualified: qual.length,
      emails_envoyés: sent,
      taux_ouverture: sent > 0 ? Math.round((opened / sent) * 100) : 0,
      taux_réponse: sent > 0 ? Math.round((replied / sent) * 100) : 0
    }
  };
});
```

---

#### Étape 2.6.4 — Mettre à jour l'onglet Campagnes

Google Sheets : `Update Row` | Sheet : `Campagnes` | Match : `campaign_id` | Update les 5 colonnes stats

**Save** → **Active**

---

## BLOC 3 — API Routes Next.js

> Durée estimée : 3-4h

---

### Tâche 3.1 — Setup : variables d'env + utilitaire GSheets

---

#### Étape 3.1.1 — Créer .env.local

Dans le terminal Cursor (à la racine de kames-site) :

```powershell
New-Item -Name ".env.local" -ItemType File
```

Ouvre le fichier et colle :

```env
# Google Sheets
GOOGLE_SHEETS_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
GOOGLE_SERVICE_ACCOUNT_EMAIL=kames-n8n-sheets@kames-crm-api.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[TA CLÉ PRIVÉE ICI]\n-----END PRIVATE KEY-----\n"

# n8n
N8N_BASE_URL=https://agent.kamesai.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

**Remplacements :**
- `GOOGLE_SHEETS_ID` = l'ID noté à l'étape 1.1.1
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` = l'email de ton Service Account
- `GOOGLE_PRIVATE_KEY` = le champ `"private_key"` du fichier JSON (tout depuis `-----BEGIN` jusqu'à `-----END PRIVATE KEY-----\n`)

---

#### Étape 3.1.2 — Installer googleapis

```powershell
npm install googleapis
```

**Résultat attendu :** `added X packages` sans erreur rouge

---

#### Étape 3.1.3 — Créer src/lib/googleSheets.ts

```typescript
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!;

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export async function getRows(sheetName: string): Promise<Record<string, string>[]> {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
  });
  const rows = res.data.values || [];
  if (rows.length < 2) return [];
  const headers = rows[0] as string[];
  return rows.slice(1).map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (row[i] as string) || ''; });
    return obj;
  });
}

export function filterRows<T extends Record<string, string>>(
  rows: T[], key: keyof T, value: string
): T[] {
  return rows.filter(r => r[key] === value);
}
```

**Résultat attendu :** Fichier créé sans erreur TypeScript dans Cursor

---

### Tâche 3.2 — src/app/api/campaigns/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getRows } from '@/lib/googleSheets';

export async function GET() {
  try {
    const campaigns = await getRows('Campagnes');
    return NextResponse.json({ success: true, data: campaigns });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erreur lecture campagnes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const n8nRes = await fetch(`${process.env.N8N_BASE_URL}/webhook/kames-generate-leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const n8nData = await n8nRes.json();
    return NextResponse.json({
      success: true,
      campaign_id: n8nData.campaign_id,
      leads_raw_count: n8nData.leads_raw_count,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erreur création campagne' }, { status: 500 });
  }
}
```

---

### Tâche 3.3 — src/app/api/campaigns/[id]/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getRows, filterRows } from '@/lib/googleSheets';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [campaigns, leadsQual] = await Promise.all([
      getRows('Campagnes'),
      getRows('Leads_Qualified'),
    ]);
    const campaign = campaigns.find(c => c.campaign_id === params.id);
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campagne introuvable' }, { status: 404 });
    }
    const leads = filterRows(leadsQual, 'campaign_id', params.id);
    return NextResponse.json({ success: true, data: { ...campaign, leads } });
  } catch {
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}
```

---

### Tâche 3.4 — src/app/api/leads/route.ts et leads/[id]/route.ts

**leads/route.ts :**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getRows, filterRows } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');
    const leads = await getRows('Leads_Qualified');
    const filtered = campaignId ? filterRows(leads, 'campaign_id', campaignId) : leads;
    return NextResponse.json({ success: true, data: filtered });
  } catch {
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}
```

**leads/[id]/route.ts :**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getRows } from '@/lib/googleSheets';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leads = await getRows('Leads_Qualified');
    const lead = leads.find(l => l.lead_id === params.id);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead introuvable' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: lead });
  } catch {
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}
```

---

### Tâche 3.5 — Test des API routes en local

```powershell
# Terminal 1 : lance le serveur
npm run dev

# Terminal 2 : teste les routes
Invoke-RestMethod -Uri "http://localhost:9002/api/campaigns"

Invoke-RestMethod -Method POST `
  -Uri "http://localhost:9002/api/campaigns" `
  -ContentType "application/json" `
  -Body '{"nom":"Test Plombiers Bdx","secteur":"plomberie","localisation":"Bordeaux","offre_kames":"Repondeur IA 24/7","taille_equipe":"1-10"}'
```

**Résultat attendu :**
- GET : `{"success": true, "data": [...]}`
- POST : `{"success": true, "campaign_id": "CAM_XXXX", "leads_raw_count": 15}`
- GSheet onglet Leads_Raw : lignes ajoutées

---

## BLOC 4 — Pages & Composants UI

> Durée estimée : 4-6h

---

### Tâche 4.1 — Créer les dossiers

```powershell
mkdir src\app\dashboard
mkdir src\app\dashboard\campaigns
mkdir src\app\dashboard\campaigns\new
```

---

### Tâche 4.2 — src/app/dashboard/layout.tsx

```tsx
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col p-6 flex-shrink-0">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center font-bold text-sm text-black">K</div>
            <div>
              <p className="font-bold text-sm">Flinty</p>
              <p className="text-xs text-zinc-500">CRM Dashboard</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm">
            📊 Campagnes
          </Link>
          <Link href="/dashboard/campaigns/new" className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm">
            ➕ Nouvelle campagne
          </Link>
        </nav>
        <div className="mt-auto pt-6 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-zinc-500">Live — Google Sheets</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
```

---

### Tâche 4.3 — src/app/dashboard/page.tsx — Liste des campagnes

```tsx
import Link from 'next/link';

type Campaign = {
  campaign_id: string; nom: string; secteur: string; localisation: string;
  offre_kames: string; statut: string; date_création: string;
  total_leads_raw: string; total_leads_qualified: string;
  emails_envoyés: string; taux_ouverture: string; taux_réponse: string;
};

async function getCampaigns(): Promise<Campaign[]> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const res = await fetch(`${base}/api/campaigns`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch { return []; }
}

const statusDot: Record<string, string> = {
  active: 'bg-green-500', generating: 'bg-blue-500',
  scheduled: 'bg-yellow-500', paused: 'bg-zinc-500', completed: 'bg-zinc-600',
};
const statusLabel: Record<string, string> = {
  active: 'Active', generating: 'Génération...', scheduled: 'Planifiée',
  paused: 'Pausée', completed: 'Terminée',
};

export default async function DashboardPage() {
  const campaigns = await getCampaigns();
  const totalRaw = campaigns.reduce((s, c) => s + parseInt(c.total_leads_raw || '0'), 0);
  const totalQual = campaigns.reduce((s, c) => s + parseInt(c.total_leads_qualified || '0'), 0);
  const totalEmails = campaigns.reduce((s, c) => s + parseInt(c.emails_envoyés || '0'), 0);
  const avgOpen = campaigns.length > 0
    ? Math.round(campaigns.reduce((s, c) => s + parseInt(c.taux_ouverture || '0'), 0) / campaigns.length) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold tracking-widest text-orange-400 uppercase mb-1">Dashboard</p>
          <h1 className="text-4xl font-bold">
            Campagnes <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">Cold Email</span>
          </h1>
          <p className="text-zinc-400 mt-1">Pipeline de prospection automatisé Flinty</p>
        </div>
        <Link href="/dashboard/campaigns/new"
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium text-sm hover:opacity-90 transition-opacity">
          + Nouvelle campagne
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'CAMPAGNES', value: campaigns.length, sub: 'au total' },
          { label: 'LEADS QUALIFIÉS', value: totalQual, sub: `sur ${totalRaw} raw` },
          { label: 'EMAILS ENVOYÉS', value: totalEmails, sub: 'séquences actives' },
          { label: 'TAUX OUVERTURE', value: `${avgOpen}%`, sub: 'moyenne globale' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-2">{kpi.label}</p>
            <p className="text-3xl font-bold text-orange-400">{kpi.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-xl mb-2">Aucune campagne pour l'instant</p>
          <Link href="/dashboard/campaigns/new" className="mt-4 inline-block px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">
            Créer une campagne
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map(c => (
            <Link key={c.campaign_id} href={`/dashboard/campaigns/${c.campaign_id}`}>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${statusDot[c.statut] || 'bg-zinc-500'} flex-shrink-0`}></div>
                    <div>
                      <p className="font-semibold text-white">{c.nom}</p>
                      <p className="text-sm text-zinc-500 mt-0.5">{c.offre_kames} · {c.secteur} · {c.localisation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-right">
                    {[
                      { label: 'Leads raw', value: c.total_leads_raw || '0' },
                      { label: 'Qualifiés', value: c.total_leads_qualified || '0', accent: true },
                      { label: 'Emails', value: c.emails_envoyés || '0' },
                      { label: 'Ouverture', value: `${c.taux_ouverture || '0'}%` },
                      { label: 'Réponse', value: `${c.taux_réponse || '0'}%` },
                    ].map(stat => (
                      <div key={stat.label}>
                        <p className="text-xs text-zinc-500 mb-0.5">{stat.label}</p>
                        <p className={`font-bold ${stat.accent ? 'text-orange-400' : 'text-white'}`}>{stat.value}</p>
                      </div>
                    ))}
                    <span className="text-xs text-zinc-400">{statusLabel[c.statut] || c.statut}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Tâche 4.4 — src/app/dashboard/campaigns/new/page.tsx — Formulaire

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const OFFRES = ['Répondeur IA 24/7', 'Lead Scoring', 'Résumé appels CRM', 'Relances Email/SMS'];
const TEMPLATES = ['Template #1 - Intro', 'Template #2 - Question', 'Template #3 - Valeur'];
const TAILLES = ['1-5', '1-10', '10-50', '50-200', '200+'];

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nom: '', secteur: '', localisation: '',
    taille_equipe: '1-10', poste_cible: 'Gérant',
    offre_kames: 'Répondeur IA 24/7', template_email: 'Template #1 - Intro',
    date_lancement: 'now',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nom || !form.secteur || !form.localisation) {
      alert('Remplis au moins le nom, le secteur et la ville'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Campagne créée ! ${data.leads_raw_count || 0} leads raw trouvés.`);
        router.push('/dashboard');
      } else {
        alert('Erreur : ' + (data.error || 'Erreur inconnue'));
      }
    } catch { alert('Erreur réseau.'); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-colors";

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest text-orange-400 uppercase mb-1">Nouveau</p>
        <h1 className="text-3xl font-bold">Créer une campagne</h1>
        <p className="text-zinc-400 mt-1">Configure les paramètres de ta prospection</p>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Nom de la campagne *</label>
          <input className={inputCls} value={form.nom} onChange={e => set('nom', e.target.value)}
            placeholder="ex: Plombiers Bordeaux - Jan 2026" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Secteur cible *</label>
            <input className={inputCls} value={form.secteur} onChange={e => set('secteur', e.target.value)}
              placeholder="ex: plombier, restaurateur" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Ville / Zone *</label>
            <input className={inputCls} value={form.localisation} onChange={e => set('localisation', e.target.value)}
              placeholder="ex: Bordeaux" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Taille d'équipe cible</label>
            <select className={inputCls} value={form.taille_equipe} onChange={e => set('taille_equipe', e.target.value)}>
              {TAILLES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Poste ciblé</label>
            <input className={inputCls} value={form.poste_cible} onChange={e => set('poste_cible', e.target.value)}
              placeholder="Gérant, Directeur..." />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Offre Flinty</label>
            <select className={inputCls} value={form.offre_kames} onChange={e => set('offre_kames', e.target.value)}>
              {OFFRES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Template email</label>
            <select className={inputCls} value={form.template_email} onChange={e => set('template_email', e.target.value)}>
              {TEMPLATES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <button onClick={() => router.back()}
            className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500 transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? '⏳ Génération en cours...' : '🚀 Lancer la campagne'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Tâche 4.5 — src/app/dashboard/campaigns/[campaign_id]/page.tsx — Détail campagne

```tsx
import Link from 'next/link';

async function getCampaign(id: string) {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const res = await fetch(`${base}/api/campaigns/${id}`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
}

type Lead = {
  lead_id: string; nom: string; ville: string; score: string;
  email: string; poste: string; taille_equipe: string; statut_email: string;
};

const emailStatus: Record<string, { label: string; color: string }> = {
  new:          { label: 'Qualifié',      color: 'bg-blue-900 text-blue-400' },
  contacted:    { label: '📨 J0 envoyé', color: 'bg-zinc-800 text-zinc-400' },
  relance_1:    { label: '📨 J+3 envoyé',color: 'bg-yellow-900 text-yellow-400' },
  relance_2:    { label: '📨 J+7 envoyé',color: 'bg-orange-900 text-orange-400' },
  opened:       { label: '👁 Ouvert',     color: 'bg-green-900 text-green-400' },
  clicked:      { label: '🖱 Cliqué',     color: 'bg-green-900 text-green-300' },
  replied:      { label: '✅ Répondu',    color: 'bg-emerald-900 text-emerald-400' },
  bounced:      { label: '❌ Rebond',     color: 'bg-red-900 text-red-400' },
  disqualified: { label: 'Disqualifié',  color: 'bg-zinc-900 text-zinc-600' },
};

export default async function CampaignDetailPage({ params }: { params: { campaign_id: string } }) {
  const campaign = await getCampaign(params.campaign_id);
  if (!campaign) return (
    <div className="text-center py-20 text-zinc-500">
      <p>Campagne introuvable</p>
      <Link href="/dashboard" className="text-orange-400 hover:underline">← Retour</Link>
    </div>
  );

  const leads: Lead[] = campaign.leads || [];

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/dashboard" className="hover:text-white">Campagnes</Link>
        <span>/</span><span className="text-white">{campaign.nom}</span>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{campaign.nom}</h1>
          <p className="text-zinc-400 mt-1">{campaign.offre_kames} · {campaign.secteur} · {campaign.localisation}</p>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3 mb-8">
        {[
          { label: 'LEADS RAW',      value: campaign.total_leads_raw || '0' },
          { label: 'QUALIFIÉS',       value: campaign.total_leads_qualified || '0', accent: true },
          { label: 'EMAILS',         value: campaign.emails_envoyés || '0' },
          { label: 'OUVERTURE',      value: `${campaign.taux_ouverture || '0'}%` },
          { label: 'RÉPONSE',        value: `${campaign.taux_réponse || '0'}%` },
          { label: 'REBONDS',        value: leads.filter(l => l.statut_email === 'bounced').length },
        ].map(kpi => (
          <div key={kpi.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.accent ? 'text-orange-400' : 'text-white'}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="font-semibold">Leads Qualifiés ({leads.length})</h2>
        </div>
        {leads.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            Aucun lead qualifié — WF2 est peut-être encore en cours.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {['NOM', 'VILLE', 'POSTE', 'TAILLE', 'EMAIL', 'SCORE', 'STATUT'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => {
                const s = emailStatus[lead.statut_email] || { label: lead.statut_email, color: 'bg-zinc-800 text-zinc-400' };
                const score = parseInt(lead.score || '0');
                return (
                  <tr key={lead.lead_id} className="border-b border-zinc-900 hover:bg-zinc-900 transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/campaigns/${params.campaign_id}/leads/${lead.lead_id}`}
                        className="hover:text-orange-400 transition-colors font-medium">{lead.nom}</Link>
                    </td>
                    <td className="px-5 py-4 text-zinc-400 text-sm">{lead.ville}</td>
                    <td className="px-5 py-4 text-zinc-400 text-sm">{lead.poste || '—'}</td>
                    <td className="px-5 py-4 text-zinc-400 text-sm">{lead.taille_equipe || '—'}</td>
                    <td className="px-5 py-4 text-zinc-400 text-sm">{lead.email || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`font-bold ${score >= 70 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-zinc-500'}`}>
                        {lead.score || '0'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${s.color}`}>{s.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

---

### Tâche 4.6 — src/app/dashboard/campaigns/[campaign_id]/leads/[lead_id]/page.tsx — Fiche lead

```tsx
import Link from 'next/link';

async function getLead(leadId: string) {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const res = await fetch(`${base}/api/leads/${leadId}`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
}

export default async function LeadDetailPage({
  params
}: { params: { campaign_id: string; lead_id: string } }) {
  const lead = await getLead(params.lead_id);
  if (!lead) return (
    <div className="text-center py-20 text-zinc-500">
      <p>Lead introuvable</p>
      <Link href={`/dashboard/campaigns/${params.campaign_id}`} className="text-orange-400 hover:underline">← Retour</Link>
    </div>
  );

  const score = parseInt(lead.score || '0');

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/dashboard" className="hover:text-white">Campagnes</Link>
        <span>/</span>
        <Link href={`/dashboard/campaigns/${params.campaign_id}`} className="hover:text-white">Campagne</Link>
        <span>/</span>
        <span className="text-white">{lead.nom}</span>
      </div>

      {/* Carte entreprise */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{lead.nom}</h1>
            <p className="text-zinc-400 mt-1">{lead.secteur} · {lead.ville}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase mb-1">Score IA</p>
            <p className={`text-4xl font-bold ${score >= 70 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-zinc-500'}`}>
              {lead.score}<span className="text-xl text-zinc-600">/100</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4">
          {[
            { label: 'Contact', value: lead.prénom || '—' },
            { label: 'Poste', value: lead.poste || '—' },
            { label: 'Email', value: lead.email || '—' },
            { label: 'Téléphone', value: lead.téléphone || '—' },
            { label: 'Taille équipe', value: lead.taille_equipe || '—' },
            { label: 'Services IA', value: lead.has_ia_services === 'true' ? 'Oui ⚠️' : 'Non ✅' },
            { label: 'Statut email', value: lead.statut_email || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
              <p className="text-sm text-white">{value}</p>
            </div>
          ))}
        </div>

        {lead.site && (
          <div className="mt-3">
            <p className="text-xs text-zinc-500 mb-0.5">Site web</p>
            <a href={lead.site} target="_blank" rel="noopener noreferrer"
              className="text-sm text-orange-400 hover:underline">{lead.site}</a>
          </div>
        )}
      </div>

      {/* Historique emails (statut simplifié) */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Historique emails</h2>
        <div className="text-zinc-400 text-sm">
          <p>Statut actuel : <span className="text-white font-medium">{lead.statut_email}</span></p>
          <p className="mt-3 text-xs text-zinc-600 italic">
            💡 Pour afficher la timeline complète (J0, J+3, J+7 avec dates et événements),
            ajoute un onglet Email_Events dans le GSheet et fais-le alimenter par WF3, WF4 et WF5.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## BLOC 5 — Tests & Déploiement

> Durée estimée : 2-3h

---

### Tâche 5.1 — Test end-to-end en local

```powershell
# Terminal 1
npm run dev

# Terminal 2 — teste chaque route
Invoke-RestMethod -Uri "http://localhost:9002/api/campaigns"
```

1. `http://localhost:9002/dashboard` → sidebar + 0 campagnes
2. `/dashboard/campaigns/new` → remplis et soumet
3. Vérifie GSheet onglet Campagnes + Leads_Raw
4. `/dashboard` → campagne apparaît
5. Déclenche WF2 manuellement → leads apparaissent dans `/dashboard/campaigns/[id]`

---

### Tâche 5.2 — Variables d'environnement sur Vercel

[vercel.com](https://vercel.com) → projet → **Settings** → **Environment Variables**

| Variable | Environnements |
|----------|----------------|
| `GOOGLE_SHEETS_ID` | Production + Preview |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Production + Preview |
| `GOOGLE_PRIVATE_KEY` | Production + Preview |
| `N8N_BASE_URL` | Production + Preview |
| `NEXT_PUBLIC_APP_URL` | `https://kamesai.com` (Production only) |

---

### Tâche 5.3 — Déploiement

```powershell
# Staging d'abord
git add .
git commit -m "feat: add CRM dashboard - campaigns, leads, API routes"
git push origin staging

# Vérifier staging sur Vercel → puis prod
git checkout main && git merge staging && git push origin main
```

---

## ✅ Checklist finale

**Google Sheets "Flinty" :**
- [ ] Onglet `Campagnes` — 12 colonnes (campaign_id → taux_réponse)
- [ ] Onglet `Leads_Raw` — 10 colonnes (lead_id → found_at)
- [ ] Onglet `Leads_Qualified` — 14 colonnes (lead_id → statut_email)
- [ ] Onglet `Config` — paramètres ICP remplis

**n8n — 6 workflows actifs :**
- [ ] `[KAI] WF1 - Génération Leads`
- [ ] `[KAI] WF2 - Qualification Leads`
- [ ] `[KAI] WF3 - Envoi Email J0`
- [ ] `[KAI] WF4 - Webhooks Resend`
- [ ] `[KAI] WF5 - Relances Auto J+3 J+7`
- [ ] `[KAI] WF6 - Calcul Stats Campagnes`

**Resend :**
- [ ] Domaine `outreach.kamesai.com` vérifié ✅
- [ ] Webhook configuré → `https://agent.kamesai.com/webhook/kames-resend-events`

**Dashboard Next.js :**
- [ ] `http://localhost:9002/dashboard` fonctionne
- [ ] Formulaire → déclenche WF1 → données dans GSheet
- [ ] Liste campagnes affiche les données réelles
- [ ] Détail campagne affiche les leads qualifiés
- [ ] Déployé sur Vercel prod

---

## 🚨 Tableau de dépannage

| Symptôme | Cause | Solution |
|----------|-------|----------|
| API retourne `[]` vide | GSheet vide ou ID incorrect | Vérifie `GOOGLE_SHEETS_ID` dans `.env.local` |
| `403 Forbidden` Google | Service Account pas partagé | Refaire étape 1.2.5 |
| n8n webhook `404` | Workflow inactif | Active le workflow dans n8n |
| `Cannot find module 'googleapis'` | npm install oublié | `npm install googleapis` |
| Build Vercel échoue | Erreur TypeScript | Vercel → Deployments → Details |
| Resend `401` | Clé API invalide | Régénère dans Resend dashboard |
| Leads_Raw vide | Clé Google Maps manquante | Vérifie la clé dans WF1 étape 2.1.6 |

---

## 📌 Note d'évolution — Vision long terme

Architecture actuelle : 1 GSheet global pour toutes les campagnes.

Migration vers **1 GSheet par campagne** :
```
Flinty - Plombiers Bordeaux Jan 2026
├── Leads_Raw
├── Leads_Qualified
└── Config (ICP spécifique à cette campagne)
```

Pour migrer :
1. WF1 crée un nouveau GSheet à chaque campagne et stocke son ID dans l'onglet Campagnes global
2. Les API routes utilisent l'ID dynamique du GSheet par campagne
3. Les API routes filtrent déjà toutes par `campaign_id` → changement minimal

---

*Plan généré le 2026-02-23 | Flinty - Dashboard CRM v2*
*Source : https://claude.ai/chat/a6a3d5a1-9733-4978-a7b7-8b346d0fd5dd*
*Pour Claude Code CLI : exécuter bloc par bloc, confirmer chaque résultat avant de continuer*