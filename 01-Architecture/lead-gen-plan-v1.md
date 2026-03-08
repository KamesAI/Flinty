# Lead Generation MVP - Plan d'Implémentation

> **For Claude:** Follow this plan task-by-task. Thomas will execute each step and report results.

**Goal:** Créer un système automatisé de génération et qualification de leads B2B (agences digitales 5-30 pers) avec scoring IA, stockage Google Sheets, et dashboard Next.js déployé sur Vercel.

**Client:** Internal Kames AI (usage personnel + MVP vendable)

**Architecture:** 
- Google Maps Places API → n8n Workflow #1 → Google Sheets "Leads_Raw"
- Google Sheets "Leads_Raw" → n8n Workflow #2 (Firecrawl scraping + Claude AI scoring) → Google Sheets "Leads_Qualified"
- Next.js Dashboard (Vercel) → Google Sheets API → Affichage leads avec filtres + KPIs + Export CSV

**Tech Stack:**
- **Backend:** n8n (AWS EC2), Google Maps Places API, Firecrawl MCP, Claude API (Anthropic)
- **Database:** Google Sheets (2 sheets: Leads_Raw, Leads_Qualified)
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Deploy:** GitHub + Vercel (gratuit)
- **Outils dev:** Cursor IDE, Claude Code

**Prerequisites:**
- [ ] Compte Google avec Google Sheets (gratuit)
- [ ] Google Cloud Project avec Places API activée (gratuit tier)
- [ ] Compte Anthropic avec API key Claude (crédit gratuit $5)
- [ ] Compte Firecrawl avec API key (500 pages/mois gratuit)
- [ ] n8n auto-hébergé AWS EC2 (déjà opérationnel)
- [ ] Compte GitHub (gratuit)
- [ ] Compte Vercel (gratuit)
- [ ] Cursor IDE installé localement

---

## Task 1: Setup Google Sheets + Google Cloud API

**What we're building:** Structure de base de données dans Google Sheets + API credentials pour n8n et Next.js

### Step 1: Créer Google Sheet "Lead Qualifier Database"

**Action:**
1. Va sur https://sheets.google.com
2. Clique "Nouveau" → "Feuille de calcul vierge"
3. Renomme le fichier : "Lead Qualifier Database"
4. Crée 3 sheets (onglets en bas) :
   - Renomme "Feuille 1" → "Leads_Raw"
   - Clique "+" pour ajouter sheet → Renomme "Leads_Qualified"
   - Clique "+" pour ajouter sheet → Renomme "Config"

**Expected result:**
- Google Sheet créé avec URL : `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
- 3 onglets visibles : Leads_Raw, Leads_Qualified, Config

---

### Step 2: Configurer headers "Leads_Raw"

**Action:**
1. Clique sur l'onglet "Leads_Raw"
2. Dans la ligne 1, ajoute ces headers (colonne A à I) :

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| name | website | phone | address | city | rating | reviews_count | maps_url | found_at |

3. Sélectionne la ligne 1 entière → Format → Gras
4. Sélectionne ligne 1 → Affichage → Figer → 1 ligne

**Expected result:**
- Ligne 1 avec 9 colonnes en gras
- Header figé (reste visible quand tu scrolles)

---

### Step 3: Configurer headers "Leads_Qualified"

**Action:**
1. Clique sur l'onglet "Leads_Qualified"
2. Dans la ligne 1, ajoute ces headers (colonne A à N) :

| A | B | C | D | E | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| name | website | phone | city | team_size | sector | ceo_name | email | has_ia_services | job_postings | score | score_reason | status | scraped_at |

3. Ligne 1 en gras + figer

**Expected result:**
- Ligne 1 avec 14 colonnes en gras et figée

---

### Step 4: Configurer sheet "Config" (paramètres ICP)

**Action:**
1. Clique sur l'onglet "Config"
2. Ajoute ces données :

| A (Parameter) | B (Value) |
|---------------|-----------|
| target_sector | agence développement web |
| target_cities | Paris,Lyon,Nantes,Bordeaux,Toulouse |
| min_team_size | 5 |
| max_team_size | 30 |
| min_rating | 4.0 |

3. Ligne 1 en gras : "Parameter" et "Value"

**Expected result:**
- Config sheet avec 5 paramètres ICP configurables

---

### Step 5: Créer Google Cloud Project + Service Account

**Action:**
1. Va sur https://console.cloud.google.com/
2. Clique "Select a project" (en haut) → "New Project"
3. Nom : "Lead Qualifier MVP" → Create
4. Une fois créé, sélectionne le projet
5. Menu hamburger (☰) → "APIs & Services" → "Library"
6. Cherche "Google Sheets API" → Clique → "Enable"
7. Cherche "Google Places API (New)" → Clique → "Enable"
8. Retourne "APIs & Services" → "Credentials"
9. "Create Credentials" → "Service Account"
10. Service account name : "lead-qualifier-service" → Create
11. Grant access : "Editor" → Continue → Done
12. Clique sur le service account créé
13. Onglet "Keys" → "Add Key" → "Create new key" → JSON → Create
14. Télécharge le fichier JSON (sauvegarde-le précieusement)

**Expected result:**
- Fichier JSON téléchargé (ex: `lead-qualifier-mvp-abc123.json`)
- Contient : `client_email`, `private_key`, etc.

---

### Step 6: Partager Google Sheet avec Service Account

**Action:**
1. Ouvre le fichier JSON téléchargé
2. Copie la valeur de `client_email` (ex: `lead-qualifier-service@lead-qualifier-mvp.iam.gserviceaccount.com`)
3. Retourne dans ton Google Sheet "Lead Qualifier Database"
4. Clique "Partager" (en haut à droite)
5. Colle l'email du service account
6. Rôle : "Éditeur"
7. Déselectionne "Notifier les personnes" (pas besoin)
8. Envoyer

**Expected result:**
- Service account ajouté comme "Éditeur"
- Sheet accessible via API maintenant

---

### Step 7: Créer Google Places API Key

**Action:**
1. Retourne Google Cloud Console → "APIs & Services" → "Credentials"
2. "Create Credentials" → "API Key"
3. Copie la clé créée (ex: `AIzaSyC...xyz`)
4. Clique "Edit API key" (icône crayon)
5. API restrictions → "Restrict key"
6. Sélectionne "Places API (New)" uniquement
7. Save
8. **IMPORTANT:** Sauvegarde cette clé dans un fichier texte sécurisé

**Expected result:**
- API Key créée et restreinte à Places API
- Clé copiée et sauvegardée

---

### Step 8: Noter toutes les credentials (pour n8n + Next.js)

**Action:**
Crée un fichier texte local `lead-gen-credentials.txt` avec ces infos :

```
=== GOOGLE SHEETS ===
SPREADSHEET_ID: [copie depuis l'URL du sheet]
SERVICE_ACCOUNT_EMAIL: [copie depuis JSON client_email]
PRIVATE_KEY: [copie depuis JSON private_key - garde les \n]

=== GOOGLE PLACES API ===
PLACES_API_KEY: AIzaSyC...xyz

=== FIRECRAWL (à créer plus tard) ===
FIRECRAWL_API_KEY: fc-...

=== ANTHROPIC CLAUDE (à créer plus tard) ===
ANTHROPIC_API_KEY: sk-ant-...
```

**Expected result:**
- Fichier `lead-gen-credentials.txt` avec toutes les infos centralisées
- **Ne commit JAMAIS ce fichier sur GitHub**

---

## Task 2: Workflow n8n #1 - Google Maps Lead Finder

**What we're building:** Workflow n8n qui cherche des agences via Google Maps Places API et les stocke dans "Leads_Raw"

### Step 1: Créer nouveau workflow n8n

**Action:**
1. Connecte-toi à ton n8n : `https://ton-n8n.com`
2. Workflows → "+ Add workflow"
3. Nom du workflow : "Lead-Finder-GoogleMaps"
4. Description : "Trouve agences via Google Places API → Leads_Raw"
5. Save

**Expected result:**
- Nouveau workflow vide créé
- Canvas blanc prêt à recevoir des nodes

---

### Step 2: Ajouter Manual Trigger node

**Action:**
1. Clique "+ Add first step"
2. Cherche "Manual Trigger"
3. Sélectionne "On clicking 'Test workflow'"
4. Leave default settings

**Expected result:**
- Node "Manual Trigger" ajouté
- Quand tu cliques "Test workflow", le workflow démarre

---

### Step 3: Ajouter Google Sheets - Read Config

**Action:**
1. Clique "+" après Manual Trigger
2. Cherche "Google Sheets"
3. Sélectionne "Google Sheets"
4. Credential : "Create New Credential"
5. Authentication : "Service Account"
6. Service Account Email : [colle depuis credentials.txt]
7. Private Key : [colle depuis JSON - garde les `\n`]
8. Test connection → Save
9. Nom credential : "Google-Sheets-Lead-Qualifier"
10. Operation : "Read"
11. Document : "By URL" → Colle URL de ton Google Sheet
12. Sheet : "Config"
13. Range : "A2:B10"
14. Options → Add "RAW Data" = OFF (données formatées)

**Expected result:**
- Node connecté à Google Sheets
- Quand tu cliques "Test node" → Affiche 5 lignes de config

---

### Step 4: Ajouter Code node - Split Cities

**Action:**
1. Clique "+" après Google Sheets
2. Cherche "Code"
3. Sélectionne "Code"
4. Language : JavaScript
5. Copie-colle ce code :

```javascript
// Récupère la config depuis Google Sheets
const config = {};
for (const item of $input.all()) {
  const param = item.json[0]; // Colonne A
  const value = item.json[1]; // Colonne B
  config[param] = value;
}

// Split les villes en array
const cities = config.target_cities.split(',').map(c => c.trim());

// Retourne un item par ville avec toute la config
return cities.map(city => ({
  json: {
    city: city,
    target_sector: config.target_sector,
    min_rating: parseFloat(config.min_rating),
    min_team_size: parseInt(config.min_team_size),
    max_team_size: parseInt(config.max_team_size)
  }
}));
```

**Expected result:**
- Quand tu testes : 5 items (1 par ville) avec config complète
- Example output : `{city: "Paris", target_sector: "agence développement web", ...}`

---

### Step 5: Ajouter HTTP Request - Google Places Text Search

**Action:**
1. Clique "+" après Code node
2. Cherche "HTTP Request"
3. Sélectionne "HTTP Request"
4. Method : POST
5. URL : `https://places.googleapis.com/v1/places:searchText`
6. Authentication : None
7. Headers → Add :
   - Name : `X-Goog-Api-Key`
   - Value : `={{$env.GOOGLE_PLACES_API_KEY}}` (on va set env var après)
   - Name : `X-Goog-FieldMask`
   - Value : `places.displayName,places.websiteUri,places.internationalPhoneNumber,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri`
8. Body → JSON :

```json
{
  "textQuery": "{{$json.target_sector}} {{$json.city}}",
  "languageCode": "fr",
  "maxResultCount": 20
}
```

9. Options → Response Format : JSON

**Expected result:**
- Node HTTP configuré (mais va fail car pas encore d'API key en env)

---

### Step 6: Ajouter Environment Variable pour Places API Key

**Action:**
1. En haut du workflow → Settings (icône ⚙️)
2. Environment Variables → Add
3. Name : `GOOGLE_PLACES_API_KEY`
4. Value : [colle ta Places API key depuis credentials.txt]
5. Save

**Expected result:**
- Env var créée
- Accessible via `$env.GOOGLE_PLACES_API_KEY`

---

### Step 7: Test HTTP Request node

**Action:**
1. Retourne au HTTP Request node
2. Clique "Test step"
3. Attends 2-5 secondes

**Expected result:**
- Response JSON avec field `places` (array de ~20 agences)
- Chaque place a : `displayName`, `websiteUri`, `rating`, etc.
- Si error 400 : vérifie FieldMask (pas d'espace après virgules)

---

### Step 8: Ajouter Code node - Extract Places Data

**Action:**
1. Clique "+" après HTTP Request
2. Code node → JavaScript
3. Copie ce code :

```javascript
const places = $json.places || [];

return places.map(place => ({
  json: {
    name: place.displayName?.text || '',
    website: place.websiteUri || '',
    phone: place.internationalPhoneNumber || '',
    address: place.formattedAddress || '',
    city: $('Code').item.json.city, // Récupère city du node Code précédent
    rating: place.rating || 0,
    reviews_count: place.userRatingCount || 0,
    maps_url: place.googleMapsUri || '',
    found_at: new Date().toISOString()
  }
}));
```

**Expected result:**
- ~20 items formatés (1 par agence)
- Chaque item a les 9 fields du schema Leads_Raw

---

### Step 9: Ajouter Filter node - Valid Results

**Action:**
1. Clique "+" après Extract Code node
2. Cherche "Filter"
3. Sélectionne "Filter"
4. Conditions → Add :
   - Field : `website`
   - Operation : "is not empty"
5. Add condition (AND) :
   - Field : `rating`
   - Operation : "larger than or equal"
   - Value : `4`
6. Add condition (AND) :
   - Field : `website`
   - Operation : "does not contain"
   - Value : `job`

**Expected result:**
- Filtre les agences qui ont :
  - Un site web rempli
  - Rating ≥ 4.0
  - Pas "job" dans URL (exclut job boards)

---

### Step 10: Ajouter Remove Duplicates node

**Action:**
1. Clique "+" après Filter
2. Cherche "Remove Duplicates"
3. Sélectionne "Remove Duplicates"
4. Compare : "Selected Fields"
5. Fields to Compare : `website`

**Expected result:**
- Si 2 agences ont même site web → garde que la première

---

### Step 11: Ajouter Google Sheets - Append to Leads_Raw

**Action:**
1. Clique "+" après Remove Duplicates
2. Google Sheets node
3. Credential : "Google-Sheets-Lead-Qualifier" (déjà créée)
4. Operation : "Append or Update"
5. Document : By URL → [même URL]
6. Sheet : "Leads_Raw"
7. Data Mode : "Map Each Column Manually"
8. Columns :
   - A (name) : `={{$json.name}}`
   - B (website) : `={{$json.website}}`
   - C (phone) : `={{$json.phone}}`
   - D (address) : `={{$json.address}}`
   - E (city) : `={{$json.city}}`
   - F (rating) : `={{$json.rating}}`
   - G (reviews_count) : `={{$json.reviews_count}}`
   - H (maps_url) : `={{$json.maps_url}}`
   - I (found_at) : `={{$json.found_at}}`

**Expected result:**
- Node configuré pour append data à Google Sheet

---

### Step 12: Test workflow complet

**Action:**
1. Clique "Test workflow" (bouton en haut)
2. Attends 10-30 secondes (API Google peut être lente)
3. Vérifie chaque node est vert (success)
4. Ouvre ton Google Sheet "Lead Qualifier Database" → Onglet "Leads_Raw"
5. Vérifie que des lignes sont apparues

**Expected result:**
- Workflow tout vert
- ~40-100 lignes dans "Leads_Raw" (20 max par ville, 5 villes = ~100)
- Chaque ligne a name, website, phone, city, rating, etc.

---

### Step 13: Activer workflow (optionnel pour maintenant)

**Action:**
1. Toggle "Active" (en haut à droite)
2. Ou laisse "Inactive" si tu veux juste lancer manuellement

**Expected result:**
- Workflow prêt à être déclenché manuellement quand besoin

---

## Task 3: Workflow n8n #2 - Lead Enricher (Firecrawl + Claude)

**What we're building:** Workflow qui lit Leads_Raw, scrape les sites web avec Firecrawl, score avec Claude AI, et push vers Leads_Qualified

### Step 1: Créer compte Firecrawl + API Key

**Action:**
1. Va sur https://firecrawl.dev/
2. Sign up (gratuit)
3. Confirme email
4. Dashboard → API Keys → Create API Key
5. Copie la clé (ex: `fc-abc123...`)
6. Ajoute dans `lead-gen-credentials.txt` :
   ```
   FIRECRAWL_API_KEY: fc-abc123...
   ```

**Expected result:**
- Compte Firecrawl créé
- API key copiée (500 pages/mois gratuit)

---

### Step 2: Créer compte Anthropic + API Key Claude

**Action:**
1. Va sur https://console.anthropic.com/
2. Sign up avec email
3. Confirme email
4. Dashboard → API Keys → Create Key
5. Nom : "Lead Qualifier MVP"
6. Copie la clé (ex: `sk-ant-api03-...`)
7. Ajoute dans credentials.txt :
   ```
   ANTHROPIC_API_KEY: sk-ant-api03-...
   ```

**Expected result:**
- Compte Anthropic créé ($5 crédit gratuit)
- API key copiée

---

### Step 3: Créer nouveau workflow "Lead-Enricher"

**Action:**
1. n8n → Workflows → "+ Add workflow"
2. Nom : "Lead-Enricher-Firecrawl-Claude"
3. Description : "Scrape sites + Score IA → Leads_Qualified"
4. Save

**Expected result:**
- Workflow vide créé

---

### Step 4: Ajouter Manual Trigger

**Action:**
1. Add first step → "Manual Trigger"
2. Default settings OK

**Expected result:**
- Trigger ajouté

---

### Step 5: Ajouter Google Sheets - Read Leads_Raw

**Action:**
1. "+" → Google Sheets
2. Credential : "Google-Sheets-Lead-Qualifier"
3. Operation : "Read"
4. Document : By URL → [même URL]
5. Sheet : "Leads_Raw"
6. Range : "A2:I1000" (skip header, max 1000 lignes)
7. Options → RAW Data = OFF

**Expected result:**
- Test node → Affiche toutes les lignes de Leads_Raw

---

### Step 6: Ajouter Limit node (process 10 leads max par run)

**Action:**
1. "+" → Cherche "Limit"
2. Sélectionne "Limit"
3. Max Items : `10`

**Expected result:**
- Prend que les 10 premiers leads (évite timeout + coûts API)

---

### Step 7: Ajouter Filter - Only unprocessed leads (optionnel pour MVP)

**Action:**
Pour l'instant, skip cette étape. On va process tous les leads.

**Note:** Plus tard, tu peux ajouter une colonne "processed" dans Leads_Raw et filtrer ici.

---

### Step 8: Ajouter HTTP Request - Firecrawl Scrape

**Action:**
1. "+" → HTTP Request
2. Method : POST
3. URL : `https://api.firecrawl.dev/v1/scrape`
4. Authentication : "Header Auth"
   - Name : `Authorization`
   - Value : `Bearer {{$env.FIRECRAWL_API_KEY}}`
5. Headers → Add :
   - Name : `Content-Type`
   - Value : `application/json`
6. Body → JSON :

```json
{
  "url": "{{$json.website}}",
  "formats": ["markdown"],
  "onlyMainContent": true,
  "timeout": 30000
}
```

7. Options → Response Format : JSON

**Expected result:**
- Node configuré (va fail sans env var)

---

### Step 9: Ajouter Environment Variable Firecrawl

**Action:**
1. Workflow Settings → Environment Variables → Add
2. Name : `FIRECRAWL_API_KEY`
3. Value : [colle depuis credentials.txt]
4. Save

**Expected result:**
- Env var créée

---

### Step 10: Test Firecrawl node

**Action:**
1. Retourne HTTP Request Firecrawl
2. Test step
3. Attends 5-10 secondes (scraping prend du temps)

**Expected result:**
- Response JSON avec field `data.markdown` (contenu site en markdown)
- Si error 402 : quota dépassé (500 pages/mois gratuit)
- Si error 400 : vérifie URL est valide

---

### Step 11: Ajouter Code node - Truncate Content

**Action:**
1. "+" → Code → JavaScript
2. Copie ce code :

```javascript
const scrapedData = $json.data || {};
const markdown = scrapedData.markdown || '';

// Limite à 4000 chars pour économiser tokens Claude
const truncated = markdown.substring(0, 4000);

return [{
  json: {
    ...items[0].json, // Garde les données originales (name, website, etc.)
    scraped_content: truncated
  }
}];
```

**Expected result:**
- Output contient website + scraped_content (max 4000 chars)

---

### Step 12: Ajouter HTTP Request - Claude AI Scoring

**Action:**
1. "+" → HTTP Request
2. Method : POST
3. URL : `https://api.anthropic.com/v1/messages`
4. Authentication : "Header Auth"
   - Name : `x-api-key`
   - Value : `{{$env.ANTHROPIC_API_KEY}}`
5. Headers → Add :
   - Name : `anthropic-version`
   - Value : `2023-06-01`
   - Name : `Content-Type`
   - Value : `application/json`
6. Body → JSON :

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1000,
  "system": "Tu es un expert en qualification de leads B2B pour agences digitales françaises. Analyse le contenu du site web et extrait les informations clés. RÉPONDS UNIQUEMENT EN JSON VALIDE, PAS DE TEXTE AVANT OU APRÈS.",
  "messages": [
    {
      "role": "user",
      "content": "Analyse cette agence :\n\nNom: {{$json.name}}\nSite: {{$json.website}}\nVille: {{$json.city}}\n\nContenu site web:\n{{$json.scraped_content}}\n\n---\n\nEXTRAIT ces informations (JSON strict):\n{\n  \"team_size\": <nombre employés estimé ou null>,\n  \"sector\": \"Growth\" | \"Digital\" | \"Tech-IA\" | \"Unknown\",\n  \"ceo_name\": \"<nom CEO/fondateur ou null>\",\n  \"email\": \"<email contact ou null>\",\n  \"has_ia_services\": true | false,\n  \"job_postings\": true | false,\n  \"score\": <0-100>,\n  \"score_reason\": \"<explication score en français>\"\n}\n\nCRITÈRES SCORING:\n- Taille équipe 5-30 pers : +40 pts\n- Services alignés (dev web, digital, IA) : +20 pts\n- Signaux croissance (jobs, awards, clients prestigieux) : +20 pts\n- Qualité site (moderne, portfolio visible) : +20 pts\n\nRÉPONDS UNIQUEMENT LE JSON."
    }
  ]
}
```

**Expected result:**
- Node configuré (va fail sans env var)

---

### Step 13: Ajouter Environment Variable Anthropic

**Action:**
1. Workflow Settings → Environment Variables → Add
2. Name : `ANTHROPIC_API_KEY`
3. Value : [colle depuis credentials.txt]
4. Save

**Expected result:**
- Env var créée

---

### Step 14: Test Claude node

**Action:**
1. Retourne HTTP Request Claude
2. Test step
3. Attends 3-8 secondes (Claude génère JSON)

**Expected result:**
- Response JSON avec field `content[0].text` contenant JSON structuré
- Contient : team_size, sector, score, etc.

---

### Step 15: Ajouter Code node - Parse Claude Response

**Action:**
1. "+" → Code → JavaScript
2. Copie ce code :

```javascript
const claudeResponse = $json.content[0].text;

// Parse le JSON retourné par Claude
let parsed;
try {
  // Claude peut wrap le JSON dans ```json ... ```
  const cleaned = claudeResponse.replace(/```json|```/g, '').trim();
  parsed = JSON.parse(cleaned);
} catch (error) {
  // Si parsing fail, retourne données par défaut
  parsed = {
    team_size: null,
    sector: "Unknown",
    ceo_name: null,
    email: null,
    has_ia_services: false,
    job_postings: false,
    score: 0,
    score_reason: "Erreur parsing JSON"
  };
}

// Merge avec les données originales
const originalData = $('Code').first().item.json; // Récupère données du premier Code node

return [{
  json: {
    name: originalData.name,
    website: originalData.website,
    phone: originalData.phone,
    city: originalData.city,
    team_size: parsed.team_size,
    sector: parsed.sector,
    ceo_name: parsed.ceo_name,
    email: parsed.email || originalData.email || '',
    has_ia_services: parsed.has_ia_services,
    job_postings: parsed.job_postings,
    score: parsed.score,
    score_reason: parsed.score_reason,
    status: "To Contact",
    scraped_at: new Date().toISOString()
  }
}];
```

**Expected result:**
- Output avec toutes les fields du schema Leads_Qualified (14 colonnes)

---

### Step 16: Ajouter IF node - Filter High Score

**Action:**
1. "+" → Cherche "IF"
2. Sélectionne "IF"
3. Condition :
   - Value 1 : `={{$json.score}}`
   - Operation : "larger than or equal"
   - Value 2 : `60`

**Expected result:**
- TRUE branch = score ≥ 60 (leads qualifiés)
- FALSE branch = score < 60 (on ignore)

---

### Step 17: Ajouter Google Sheets - Append to Leads_Qualified (TRUE branch)

**Action:**
1. Sur la sortie TRUE du IF node → "+" → Google Sheets
2. Credential : "Google-Sheets-Lead-Qualifier"
3. Operation : "Append or Update"
4. Document : By URL → [même URL]
5. Sheet : "Leads_Qualified"
6. Data Mode : "Map Each Column Manually"
7. Columns (A à N) :
   - A : `={{$json.name}}`
   - B : `={{$json.website}}`
   - C : `={{$json.phone}}`
   - D : `={{$json.city}}`
   - E : `={{$json.team_size}}`
   - F : `={{$json.sector}}`
   - G : `={{$json.ceo_name}}`
   - H : `={{$json.email}}`
   - I : `={{$json.has_ia_services}}`
   - J : `={{$json.job_postings}}`
   - K : `={{$json.score}}`
   - L : `={{$json.score_reason}}`
   - M : `={{$json.status}}`
   - N : `={{$json.scraped_at}}`

**Expected result:**
- Node configuré pour append leads score ≥ 60

---

### Step 18: Test workflow complet

**Action:**
1. Retourne au début du workflow
2. Clique "Test workflow"
3. **ATTENTION:** Va prendre 1-2 min (scraping + IA = lent)
4. Vérifie chaque node
5. Ouvre Google Sheet → "Leads_Qualified"

**Expected result:**
- Workflow tout vert
- 3-8 lignes dans "Leads_Qualified" (sur 10 processés, ~30-80% score ≥ 60)
- Chaque ligne a score, sector, ceo_name, etc.

**Coût estimé ce test :**
- Firecrawl : 10 pages (sur 500/mois gratuit)
- Claude : ~$0.03 (10 leads × $0.003)

---

### Step 19: Vérifier qualité scoring

**Action:**
1. Ouvre Google Sheet "Leads_Qualified"
2. Lis colonne L (score_reason) pour 2-3 leads
3. Vérifie si le scoring fait sens

**Expected result:**
- score_reason explique pourquoi le score
- Si scores tous bas (<40) ou tous hauts (>90) : prompt Claude à ajuster

---

## Task 4: Dashboard Next.js - Setup & Development

**What we're building:** Application Next.js qui lit Google Sheets et affiche dashboard avec table + filtres + KPIs + export CSV

### Step 1: Créer projet Next.js avec Cursor

**Action:**
1. Ouvre Cursor IDE
2. File → Open Folder → Crée nouveau dossier "lead-qualifier-dashboard"
3. Terminal Cursor (Ctrl+`) :

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
```

4. Prompts :
   - Use TypeScript? Yes
   - Use ESLint? Yes
   - Use Tailwind CSS? Yes
   - Use App Router? Yes
   - Customize import alias? No

5. Attends installation (2-3 min)

**Expected result:**
- Projet Next.js créé
- Structure : `app/`, `public/`, `package.json`, etc.

---

### Step 2: Installer dépendances Google Sheets

**Action:**
Terminal Cursor :

```bash
npm install googleapis
```

**Expected result:**
- Package `googleapis` installé dans `node_modules`

---

### Step 3: Créer fichier .env.local avec credentials

**Action:**
1. Cursor → Créer fichier `.env.local` à la racine
2. Ajoute :

```env
# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=1abc...xyz
GOOGLE_SERVICE_ACCOUNT_EMAIL=lead-qualifier-service@...iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n"

# App config
NEXT_PUBLIC_APP_NAME="Lead Qualifier MVP"
```

3. Remplace SPREADSHEET_ID par ton ID (depuis URL Google Sheet)
4. Remplace SERVICE_ACCOUNT_EMAIL (depuis JSON)
5. Remplace PRIVATE_KEY (depuis JSON - **garde les `\n`**)

**Expected result:**
- Fichier `.env.local` créé avec credentials
- **IMPORTANT:** Ajoute `.env.local` dans `.gitignore` (Next.js le fait auto)

---

### Step 4: Créer structure de dossiers

**Action:**
Terminal Cursor :

```bash
mkdir -p lib components app/api/leads app/api/stats app/api/export
```

**Expected result:**
- Dossiers créés : `lib/`, `components/`, `app/api/leads/`, etc.

---

### Step 5: Créer lib/googleSheets.ts avec Claude Code

**Action:**
1. Dans Cursor, ouvre le chat AI (Cmd/Ctrl+L)
2. Copie-colle ce prompt :

```
Crée le fichier lib/googleSheets.ts qui :
- Utilise googleapis pour se connecter à Google Sheets
- Fonction getLeadsFromSheet() qui lit "Leads_Qualified" range A2:N1000
- Parse chaque row en objet Lead (14 fields)
- Fonction getStatsFromSheet() qui calcule totalLeads, avgScore, sectorDistribution, highScoreLeads
- Use credentials from env vars GOOGLE_SERVICE_ACCOUNT_EMAIL et GOOGLE_PRIVATE_KEY
- TypeScript strict
```

3. Attends que Claude génère le code
4. Vérifie le code généré
5. Accepte les modifications

**Expected result:**
- Fichier `lib/googleSheets.ts` créé avec les 2 fonctions

---

### Step 6: Créer lib/types.ts

**Action:**
Cursor AI chat :

```
Crée lib/types.ts avec :
- Interface Lead (14 fields : name, website, phone, city, team_size, sector, ceo_name, email, has_ia_services, job_postings, score, score_reason, status, scraped_at)
- Interface Stats (totalLeads, avgScore, sectorDistribution, highScoreLeads)
- sector type = 'Growth' | 'Digital' | 'Tech-IA' | 'Unknown'
- status type = 'To Contact' | 'Contacted' | 'Replied' | 'Qualified' | 'Client'
```

**Expected result:**
- Fichier `lib/types.ts` créé

---

### Step 7: Créer API route /api/leads

**Action:**
Cursor AI :

```
Crée app/api/leads/route.ts qui :
- Export async function GET()
- Appelle getLeadsFromSheet() depuis lib/googleSheets
- Return NextResponse.json({ leads })
- Gère les errors avec try/catch
```

**Expected result:**
- Fichier `app/api/leads/route.ts` créé

---

### Step 8: Créer API route /api/stats

**Action:**
Cursor AI :

```
Crée app/api/stats/route.ts qui :
- Export async function GET()
- Appelle getStatsFromSheet()
- Return NextResponse.json({ stats })
- Try/catch error handling
```

**Expected result:**
- Fichier `app/api/stats/route.ts` créé

---

### Step 9: Créer API route /api/export (CSV download)

**Action:**
Cursor AI :

```
Crée app/api/export/route.ts qui :
- GET all leads
- Génère CSV string avec headers : Name,Website,Email,Phone,City,Sector,Score,Status
- Return NextResponse avec headers Content-Type: text/csv et Content-Disposition: attachment
- Filename: leads-YYYY-MM-DD.csv
```

**Expected result:**
- Fichier `app/api/export/route.ts` créé

---

### Step 10: Test API routes en local

**Action:**
Terminal Cursor :

```bash
npm run dev
```

1. Ouvre navigateur : http://localhost:3000/api/leads
2. Tu devrais voir JSON avec array de leads
3. Test : http://localhost:3000/api/stats
4. Test : http://localhost:3000/api/export (download CSV)

**Expected result:**
- `/api/leads` → JSON leads
- `/api/stats` → JSON stats
- `/api/export` → Download CSV file

**Si error 500 :**
- Vérifie `.env.local` credentials
- Vérifie PRIVATE_KEY a bien les `\n`
- Check console Cursor pour error details

---

### Step 11: Créer composant components/KPICards.tsx

**Action:**
Cursor AI :

```
Crée components/KPICards.tsx qui :
- Prend props { stats: Stats }
- Affiche 4 cards en grid (Tailwind grid-cols-4)
- Card 1 : Total Leads
- Card 2 : Score Moyen /100
- Card 3 : High Score (≥80)
- Card 4 : Top Secteur (le plus fréquent)
- Style : bg-white, p-6, rounded-lg, shadow
- Text : text-3xl font-bold pour les chiffres
```

**Expected result:**
- Composant `KPICards.tsx` créé

---

### Step 12: Créer components/LeadsTable.tsx

**Action:**
Cursor AI :

```
Crée components/LeadsTable.tsx qui :
- Props { leads: Lead[] }
- Table HTML avec Tailwind styling
- Colonnes : Agence (name + website link), Ville, Secteur (badge coloré), Équipe (team_size), Score (coloré selon valeur), Contact (email + phone)
- Hover effect sur rows
- Secteur badges : Growth=green, Digital=blue, Tech-IA=purple, Unknown=gray
- Score colors : ≥80=green, ≥60=yellow, <60=gray
- Website link ouvre new tab
```

**Expected result:**
- Composant `LeadsTable.tsx` créé

---

### Step 13: Créer components/FilterBar.tsx

**Action:**
Cursor AI :

```
Crée components/FilterBar.tsx qui :
- Props : sectorFilter, setSectorFilter, cityFilter, setCityFilter, minScore, setMinScore, searchQuery, setSearchQuery, cities (array unique villes)
- 4 controls en flex row gap-4 :
  1. Select secteur (all, Growth, Digital, Tech-IA)
  2. Select ville (all, + dynamic villes depuis props)
  3. Input range score minimum (0-100)
  4. Input search par nom agence
- Tailwind styling clean
```

**Expected result:**
- Composant `FilterBar.tsx` créé

---

### Step 14: Créer components/ExportButton.tsx

**Action:**
Cursor AI :

```
Crée components/ExportButton.tsx qui :
- Button "Export CSV"
- onClick fetch /api/export
- Download file automatiquement
- Tailwind : bg-blue-600, text-white, px-4, py-2, rounded, hover:bg-blue-700
```

**Expected result:**
- Composant `ExportButton.tsx` créé

---

### Step 15: Créer page principale app/page.tsx

**Action:**
Cursor AI :

```
Crée app/page.tsx qui :
- 'use client'
- useState pour leads, filteredLeads, stats, loading
- useState pour filters : sectorFilter, cityFilter, minScore, searchQuery
- useEffect fetch /api/leads et /api/stats au mount
- useEffect apply filters à leads → setFilteredLeads
- Render :
  - Header avec titre "Lead Qualifier Dashboard" + ExportButton
  - KPICards avec stats
  - FilterBar avec tous les filters
  - LeadsTable avec filteredLeads
  - Footer compteur "X leads affichés sur Y total"
- Loading state "Chargement..."
- Container Tailwind mx-auto p-6
```

**Expected result:**
- Page principale créée avec tous les composants

---

### Step 16: Test dashboard complet en local

**Action:**
1. Terminal Cursor : `npm run dev` (si pas déjà running)
2. Navigateur : http://localhost:3000
3. Vérifie :
   - KPIs s'affichent
   - Table affiche les leads
   - Filtres fonctionnent (secteur, ville, score, search)
   - Export CSV download fichier

**Expected result:**
- Dashboard fonctionnel
- Toutes les features marchent
- Design clean avec Tailwind

**Si problèmes :**
- Check console navigateur (F12)
- Check terminal Cursor pour errors
- Vérifie API routes /api/leads et /api/stats retournent data

---

## Task 5: Deploy sur GitHub + Vercel

**What we're building:** Déployer le dashboard en production sur Vercel (gratuit)

### Step 1: Initialiser Git repo

**Action:**
Terminal Cursor :

```bash
git init
git add .
git commit -m "Initial commit - Lead Qualifier MVP"
```

**Expected result:**
- Git repo initialisé
- Premier commit créé

---

### Step 2: Créer repo GitHub

**Action:**
1. Va sur https://github.com/new
2. Repository name : "lead-qualifier-mvp"
3. Description : "MVP Lead Generation & Qualification - n8n + Next.js + Google Sheets"
4. Public ou Private : **Private** (credentials sensibles)
5. NE PAS ajouter README, gitignore, license (déjà dans projet)
6. Create repository

**Expected result:**
- Repo GitHub créé vide
- URL : `https://github.com/ton-username/lead-qualifier-mvp`

---

### Step 3: Push code vers GitHub

**Action:**
Terminal Cursor (copie les commandes affichées par GitHub) :

```bash
git remote add origin https://github.com/ton-username/lead-qualifier-mvp.git
git branch -M main
git push -u origin main
```

**Expected result:**
- Code pushé sur GitHub
- Visible sur https://github.com/ton-username/lead-qualifier-mvp

---

### Step 4: Créer compte Vercel + Connecter GitHub

**Action:**
1. Va sur https://vercel.com/signup
2. "Continue with GitHub"
3. Autorise Vercel à accéder ton GitHub

**Expected result:**
- Compte Vercel créé et connecté à GitHub

---

### Step 5: Import project sur Vercel

**Action:**
1. Vercel Dashboard → "Add New..." → "Project"
2. Import Git Repository → Sélectionne "lead-qualifier-mvp"
3. Framework Preset : Next.js (détecté auto)
4. Root Directory : `./` (default)
5. **IMPORTANT:** Environment Variables → Add :
   - `GOOGLE_SHEETS_SPREADSHEET_ID` : [copie depuis .env.local]
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` : [copie depuis .env.local]
   - `GOOGLE_PRIVATE_KEY` : [copie depuis .env.local - **garde les \n**]
   - `NEXT_PUBLIC_APP_NAME` : "Lead Qualifier MVP"
6. Deploy

**Expected result:**
- Vercel build + deploy (2-3 min)
- URL production : `https://lead-qualifier-mvp-abc123.vercel.app`

---

### Step 6: Vérifier déploiement

**Action:**
1. Clique sur l'URL Vercel
2. Vérifie dashboard s'affiche
3. Test filtres
4. Test export CSV

**Expected result:**
- Dashboard live en production
- Toutes les features marchent

**Si error 500 :**
- Vercel Dashboard → Project → Settings → Environment Variables
- Vérifie PRIVATE_KEY a bien les `\n` (pas juste des espaces)
- Redeploy : Deployments → ... (menu) → Redeploy

---

### Step 7: (Optionnel) Custom domain

**Action:**
Si tu as un domaine (ex: `leads.kamesai.com`) :
1. Vercel → Settings → Domains → Add
2. Entre ton domaine
3. Configure DNS selon instructions Vercel

**Expected result:**
- Dashboard accessible via ton domaine custom

---

## Task 6: Test End-to-End & Documentation

**What we're building:** Vérification complète du système + Documentation pour usage

### Step 1: Test workflow complet (Google Maps → Dashboard)

**Action:**
1. n8n → Workflow "Lead-Finder-GoogleMaps"
2. Vide Google Sheet "Leads_Raw" (supprime lignes 2+)
3. Run workflow → Attends 30 sec
4. Vérifie "Leads_Raw" rempli (~40-100 lignes)
5. n8n → Workflow "Lead-Enricher"
6. Run workflow → Attends 2-3 min (lent)
7. Vérifie "Leads_Qualified" rempli (3-8 lignes score ≥60)
8. Ouvre dashboard : https://ton-url.vercel.app
9. Vérifie les nouveaux leads apparaissent

**Expected result:**
- Pipeline complet fonctionne : Google Maps → n8n → Sheets → Dashboard
- Leads visibles en temps réel

---

### Step 2: Test filtres dashboard

**Action:**
Sur le dashboard :
1. Filtre Secteur : Sélectionne "Growth" → Table filtrée
2. Filtre Ville : Sélectionne "Paris" → Table filtrée
3. Score minimum : Slide à 80 → Que high-score leads
4. Search : Tape "digital" → Filtre par nom

**Expected result:**
- Tous les filtres fonctionnent
- Compteur s'update ("X leads sur Y")

---

### Step 3: Test Export CSV

**Action:**
1. Dashboard → Clique "Export CSV"
2. Fichier `leads-2026-02-XX.csv` téléchargé
3. Ouvre avec Excel / Google Sheets
4. Vérifie colonnes : Name, Website, Email, etc.

**Expected result:**
- CSV téléchargé et lisible
- Données correctes

---

### Step 4: Mesurer coûts réels (pour 150 leads)

**Action:**
Calcule :
- Workflow #1 (Google Maps) : Gratuit (< 2500 requêtes/mois)
- Workflow #2 (Firecrawl + Claude) sur 150 leads :
  - Firecrawl : 150 pages (sur 500 gratuit) = **Gratuit**
  - Claude : 150 × $0.003 = **$0.45**
- Total : **< $0.50** pour 150 leads qualifiés

**Expected result:**
- Confirmation : MVP coûte < 1€ pour 150 leads

---

### Step 5: Créer README.md pour le projet

**Action:**
Cursor → Créer fichier `README.md` à la racine :

```markdown
# Lead Qualifier MVP

**Système automatisé de génération et qualification de leads B2B pour agences digitales françaises.**

## 🎯 Fonctionnalités

- 🔍 Recherche automatique via Google Maps Places API
- 🤖 Scraping sites web avec Firecrawl
- 🧠 Scoring IA avec Claude (Anthropic)
- 📊 Dashboard Next.js avec filtres avancés
- 📥 Export CSV one-click
- 💰 Coût : < 1€ pour 150 leads qualifiés

## 🏗️ Architecture

- **Backend:** n8n workflows (auto-hébergé)
- **Database:** Google Sheets
- **Frontend:** Next.js 14 + TypeScript + Tailwind
- **Deploy:** Vercel (production)
- **APIs:** Google Places, Firecrawl, Claude (Anthropic)

## 🚀 Workflows n8n

### Workflow #1: Lead-Finder-GoogleMaps
- Lit config ICP depuis Google Sheets
- Cherche agences via Google Maps Places API
- Filtre (rating ≥4, website existe)
- Stocke dans "Leads_Raw"

### Workflow #2: Lead-Enricher-Firecrawl-Claude
- Lit leads non-traités depuis "Leads_Raw"
- Scrape site web (Firecrawl)
- Score avec IA (Claude) sur 100 points
- Filtre score ≥ 60
- Stocke dans "Leads_Qualified"

## 📊 Dashboard Features

- **KPIs:** Total leads, Score moyen, High-score count, Top secteur
- **Filtres:** Secteur, Ville, Score minimum, Search nom
- **Export:** CSV téléchargeable
- **Real-time:** Sync automatique avec Google Sheets

## 💻 Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## 🔐 Environment Variables

Voir `.env.local.example` pour la liste complète.

## 📝 Coûts

- Google Places API: Gratuit (2500 requêtes/mois)
- Firecrawl: Gratuit (500 pages/mois)
- Claude API: ~$0.003 par lead
- Vercel: Gratuit
- **Total:** < 1€ pour 150 leads

## 🎯 Pricing Produit (si vendu)

- Setup : 1500-2000€ (one-time)
- Maintenance : 250-500€/mois
- ROI client : 3h/semaine économisées = 600€/mois de valeur

---

**Built with ❤️ by Kames AI**
```

**Expected result:**
- README.md complet et pro
- Facile à présenter à prospects

---

### Step 6: Créer USAGE.md (guide utilisation)

**Action:**
Cursor → Créer `USAGE.md` :

```markdown
# Guide d'Utilisation - Lead Qualifier MVP

## 🎯 Lancer une recherche de leads

### Option 1: Via n8n (recommandé)

1. Connecte-toi à n8n : https://ton-n8n.com
2. Workflow "Lead-Finder-GoogleMaps" → Click "Execute Workflow"
3. Attends 30-60 secondes
4. Vérifie Google Sheet "Leads_Raw" rempli

### Option 2: Modifier l'ICP

1. Ouvre Google Sheet "Lead Qualifier Database"
2. Onglet "Config"
3. Modifie `target_cities`, `target_sector`, etc.
4. Run workflow Lead-Finder

## 🤖 Qualifier les leads (scoring IA)

1. n8n → Workflow "Lead-Enricher-Firecrawl-Claude"
2. Execute Workflow
3. **ATTENTION:** Process 10 leads par run (configuré dans Limit node)
4. Attends 2-4 minutes (scraping + IA = lent)
5. Vérifie "Leads_Qualified" rempli

## 📊 Consulter le dashboard

1. Va sur https://ton-url.vercel.app
2. Dashboard affiche leads automatiquement
3. Utilise filtres pour segmenter
4. Export CSV pour cold email

## 🔄 Workflow quotidien recommandé

**Matin (5 min) :**
- Run Lead-Finder → 40-100 nouveaux leads bruts

**Soir (10 min) :**
- Run Lead-Enricher 3-4 fois → 30-40 leads qualifiés
- Export CSV → Prêt pour prospection lendemain

## 💰 Monitoring coûts

- Dashboard Firecrawl : https://firecrawl.dev/dashboard
  - Limite : 500 pages/mois gratuit
  
- Dashboard Anthropic : https://console.anthropic.com/
  - Limite : $5 crédit gratuit
  - 1 lead ≈ $0.003
  - 150 leads ≈ $0.45

## 🐛 Troubleshooting

**Workflow fail "API quota exceeded" :**
- Firecrawl : Attends mois suivant ou upgrade plan
- Claude : Ajoute carte bancaire Anthropic console

**Dashboard affiche "Error fetching leads" :**
- Vérifie Google Sheets credentials dans Vercel env vars
- Redeploy Vercel

**Google Maps retourne 0 résultats :**
- Vérifie Places API activée dans Google Cloud
- Vérifie API key valide
- Test manuellement l'API avec Postman

## 📞 Support

Questions ? thomas@kamesai.com
```

**Expected result:**
- Guide usage clair
- Utilisable par quelqu'un d'autre (ex: Clément)

---

### Step 7: (Optionnel) Vidéo démo Loom

**Action:**
1. Va sur https://loom.com
2. Record écran :
   - Montre Google Sheet vide
   - Run workflow Lead-Finder n8n
   - Montre Leads_Raw rempli
   - Run workflow Lead-Enricher
   - Montre Leads_Qualified rempli
   - Ouvre dashboard Vercel
   - Démo filtres + export
3. Durée : 2-3 min max
4. Titre : "Lead Qualifier MVP - Demo"

**Expected result:**
- Vidéo Loom prête à envoyer aux prospects
- Lien : https://loom.com/share/abc123

---

## Task 7: Prochaines Étapes (Scale + Vente)

**What's next:** Préparer le MVP pour scale (500+ leads/mois) et vente aux clients

### Step 1: Scale Workflow #2 (batch processing)

**Action future:**
Pour process 100+ leads/jour :
1. Workflow Lead-Enricher → Augmente Limit de 10 à 50
2. Ajoute Schedule Trigger : Tous les jours à 20h
3. Ajoute tracking "processed" dans Leads_Raw (colonne J)
4. Filter node : "Only unprocessed leads"

**Bénéfice:** Automation complète, 0 intervention manuelle

---

### Step 2: Ajouter Google Custom Search (source #2)

**Action future:**
Pour augmenter couverture leads (90% au lieu de 60%) :
1. Google Cloud → Activer Custom Search JSON API
2. n8n → Nouveau workflow "Lead-Finder-CustomSearch"
3. Scrape résultats Google organic
4. Même logique que Google Maps workflow

**Bénéfice:** Trouve agences remote/distributed (pas sur Maps)

---

### Step 3: Enrichissement emails personnels (Hunter.io)

**Action future:**
Pour améliorer taux réponse cold email :
1. Créer compte Hunter.io (50 emails/mois gratuit)
2. n8n → Ajouter node HTTP Request Hunter.io
3. Workflow : Leads_Qualified → Find CEO email → Update sheet

**Bénéfice:** Emails personnels (vs contact@) = +30% taux réponse

---

### Step 4: Multi-tenant version (pour vendre)

**Action future:**
Pour vendre aux clients :
1. Créer 1 Google Sheet par client
2. Dashboard : Ajoute authentification (NextAuth)
3. Dashboard : Multi-workspace (switch entre clients)
4. n8n : Paramétrer SPREADSHEET_ID dynamique

**Pricing recommandé:**
- Setup : 1500-2000€ (one-time)
- Mensuel : 250-500€/mois (maintenance + API costs)

---

### Step 5: Créer landing page produit

**Action future:**
Vendre le MVP comme produit :
1. Page Notion ou Carrd.co
2. Sections :
   - Hero : "Génération de leads B2B automatisée"
   - Problème : "15h/semaine perdues à prospecter"
   - Solution : "Système n8n + IA = 20 RDV qualifiés/mois"
   - Démo : Embed vidéo Loom
   - Pricing : Setup 2k€ + 500€/mois
   - CTA : "Démo 15 min" (Calendly)

**Expected result:**
- Landing page pro
- Prête à partager aux prospects

---

## 📋 CHECKLIST FINALE MVP

Avant de considérer le MVP "terminé" :

**Setup & Config:**
- [x] Google Sheets créé avec 3 sheets
- [x] Google Cloud Project + APIs activées
- [x] Service Account créé + Sheet partagé
- [x] Toutes credentials sauvegardées

**n8n Workflows:**
- [x] Workflow #1 Lead-Finder fonctionnel
- [x] Workflow #2 Lead-Enricher fonctionnel
- [x] Test avec 10 leads → Leads_Qualified rempli
- [x] Coût confirmé < 1€ pour 150 leads

**Dashboard:**
- [x] Next.js build sans errors
- [x] API routes /leads, /stats, /export fonctionnels
- [x] Filtres marchent (secteur, ville, score, search)
- [x] Export CSV télécharge fichier
- [x] Deploy Vercel production
- [x] Dashboard accessible publiquement (ou avec auth)

**Documentation:**
- [x] README.md complet
- [x] USAGE.md guide utilisateur
- [x] Credentials sauvegardées secure (pas sur GitHub)
- [x] .env.local dans .gitignore

**Validation Business:**
- [x] 150 leads générés manuellement pendant workflows dev
- [x] Vidéo démo Loom (optionnel mais recommandé)
- [x] Pricing défini (setup + mensuel)

---

## 🎯 TEMPS TOTAL ESTIMÉ

| Task | Durée estimée |
|------|---------------|
| Task 1: Google Sheets + API Setup | 1-2h |
| Task 2: Workflow n8n #1 (Google Maps) | 2-3h |
| Task 3: Workflow n8n #2 (Firecrawl + Claude) | 4-6h |
| Task 4: Dashboard Next.js | 6-8h |
| Task 5: Deploy GitHub + Vercel | 1h |
| Task 6: Tests + Documentation | 1-2h |
| **TOTAL** | **15-22h** |

**Planning réaliste:**
- Soirée 1-3 (3h/soir) : Tasks 1-2 (Setup + Workflow #1)
- Soirée 4-6 (3h/soir) : Task 3 (Workflow #2)
- Soirée 7-9 (3h/soir) : Task 4 (Dashboard)
- Soirée 10 (2h) : Tasks 5-6 (Deploy + Doc)

**Total : 10 soirées de 2-3h = MVP complet en 2-3 semaines**

---

## 🚀 NEXT STEPS IMMÉDIAT

**Pour commencer MAINTENANT :**

1. **Ce soir (2h) :** Task 1 complet (Google Sheets + API setup)
2. **Demain soir (3h) :** Task 2 Steps 1-7 (Workflow #1 jusqu'à Google Places)
3. **Après-demain (3h) :** Task 2 Steps 8-13 (Finir Workflow #1)

**Parallèle prospection manuelle :**
- Midi (15 min) : 10 DMs Instagram
- Soir avant dev (20 min) : 20 emails cold
- **Ne touche PAS au dev tant que prospection pas faite** (rappel de ton plan)

---

**Prêt à démarrer ? Commence par Task 1 Step 1 et reporte tes résultats après chaque step. 🎯**