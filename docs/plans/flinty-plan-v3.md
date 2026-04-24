# 🚀 Flinty — Plan d'évolution v3 complet

> **Version :** v3.1 — Avril 2026
> **Principe directeur :** Flinty ne trouve plus juste des leads. Il trouve, enrichit (signaux d'achat), score, génère les hooks perso, contacte, relance, et pilote — par campagne isolée.
> **Pour Claude Code CLI :** Exécute bloc par bloc. Confirme chaque résultat avant de passer au suivant. Ne saute aucune étape. Si un step échoue, stop et remonte l'erreur.

---

## ⚙️ Changement d'architecture fondamental — 1 GSheet par campagne

> **À faire AVANT toutes les features v3. C'est le socle sur lequel tout repose.**

### Pourquoi ce changement est urgent

| Problème actuel (1 GSheet global) | Solution (1 GSheet par campagne) |
|---|---|
| 10 campagnes × 200 leads = 2 000 lignes mélangées | Chaque fichier reste < 500 lignes → rapide |
| GSheets ralentit au-delà de ~5 000 lignes avec formules | Performance garantie par design |
| Un client voit les leads des autres → ❌ RGPD | Isolation totale → ✅ RGPD ready |
| Impossible de partager 1 campagne sans tout exposer | Partage du GSheet enfant uniquement |
| ICP n'a pas de "maison" propre | Onglet Config dédié par campagne |
| Supprimer une campagne = nettoyer des centaines de lignes | Supprimer 1 fichier GSheet entier |

### Nouvelle architecture cible

```
📊 Flinty — Index (GSheet maître)
└── Campagnes → campaign_id | nom | sheet_id | statut | date_création | ...
               (stats calculées toutes les heures par WF6)

📊 Plombiers Bordeaux Jan 2026 (GSheet enfant auto-créé par WF1)
├── Leads_Raw      → leads bruts Google Maps
├── Leads_Qualified → leads enrichis + scorés
├── Leads_Rejected  → leads écartés + raison (NOUVEAU v3)
└── Config + ICP   → paramètres + ICP.md de la campagne

📊 Restaurants Lyon Fev 2026 (GSheet enfant auto-créé par WF1)
├── Leads_Raw
├── Leads_Qualified
├── Leads_Rejected
└── Config + ICP
```

---

### BLOC 0 — Migration vers 1 GSheet par campagne

> **Priorité MAXIMALE — tout le reste se construit dessus.**
> **Durée estimée : 3-4h**

---

#### Tâche 0.1 — Créer le GSheet maître "Flinty Index"

**Ce qu'on fait :** Créer le fichier central qui référence toutes les campagnes + leurs GSheet enfants.

**Étape 0.1.1 — Créer le fichier**

1. Va sur [sheets.google.com](https://sheets.google.com)
2. Nouveau fichier → renomme : `Flinty — Index`
3. Onglet 1 → renomme : `Campagnes`
4. Ligne 1, colonnes A → M :

```
A1: campaign_id
B1: nom
C1: sheet_id          ← ID du GSheet enfant (auto-rempli par WF1)
D1: sheet_url         ← URL complète du GSheet enfant
E1: secteur
F1: localisation
G1: offre_kames
H1: statut            ← new | active | paused | done
I1: date_création
J1: total_leads_raw   ← mis à jour par WF6
K1: total_leads_qualified
L1: emails_envoyés
M1: taux_réponse
```

5. Mets la ligne 1 en **gras** + fige-la (Affichage → Figer → 1 ligne)
6. Note l'ID du GSheet maître → copie dans `.env.local` :
   ```
   GOOGLE_INDEX_SHEET_ID=1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

**Résultat attendu :** GSheet maître ouvert avec 13 colonnes. Vide pour l'instant — WF1 le remplira automatiquement.

---

#### Tâche 0.2 — Structure du GSheet enfant (template)

**Ce qu'on fait :** Définir la structure standard de chaque GSheet enfant créé par WF1.

Chaque GSheet enfant doit avoir **4 onglets** :

**Onglet 1 — Leads_Raw**
```
lead_id | campaign_id | nom | site | ville | téléphone | rating | reviews_count | maps_url | found_at
```

**Onglet 2 — Leads_Qualified** (colonnes mises à jour v3)
```
lead_id | campaign_id | nom | site | ville | score | score_reason | email | téléphone
prénom | poste | secteur | taille_equipe | has_ia_services
hiring_signals | growth_stage | buying_signal | personalized_hook
statut_email | web_quality_score | web_quality_signals
```

> ⚠️ Nouveaux champs v3 : `score_reason`, `hiring_signals`, `growth_stage`, `buying_signal`, `personalized_hook`, `web_quality_score`, `web_quality_signals`

**Onglet 3 — Leads_Rejected** (NOUVEAU v3)
```
lead_id | campaign_id | nom | site | score | rejection_reason | processed_at
```

**Onglet 4 — Config**
```
param_key | param_value | description
```
Avec les lignes suivantes pré-remplies au moment de la création :
```
icp_md          | [contenu ICP.md généré par Claude]  | ICP complet de la campagne
secteur         | plomberie                            | Secteur cible
villes          | Bordeaux,Mérignac,Pessac             | Villes cibles (séparées par virgule)
taille_equipe   | 1-10                                 | Taille d'équipe cible
poste_cible     | Gérant                               | Poste du décideur
offre_kames     | Répondeur IA 24/7                    | Offre à proposer
template_email  | Template #1 - Intro                  | Template email J0
score_minimum   | 60                                   | Seuil de qualification
```

---

#### Tâche 0.3 — Modifier WF1 pour créer le GSheet enfant automatiquement

**Ce qu'on fait :** WF1 ne scrape plus directement vers un GSheet global. Il crée d'abord un GSheet enfant, puis y écrit les leads.

**Architecture WF1 mise à jour :**

```
Webhook POST (déclenché par le formulaire Flinty)
  ↓
Code node — génère campaign_id + nom du fichier
  ↓
HTTP Request — Google Drive API → Crée un nouveau GSheet
  ↓
HTTP Request — Google Sheets API → Crée les 4 onglets + headers
  ↓
HTTP Request — Google Sheets API → Écrit les params ICP dans onglet Config
  ↓
HTTP Request — Google Sheets API → Écrit la ligne dans le GSheet MAÎTRE (Flinty Index)
  ↓
Loop sur les villes × secteurs
  ↓
HTTP Request — Google Maps Places API
  ↓
Filter (rating ≥ 4, website existe)
  ↓
Remove Duplicates (par website)
  ↓
Google Sheets → Écrit dans Leads_Raw du GSheet ENFANT (via sheet_id dynamique)
```

**Variables WF1 à ajouter dans n8n :**
```
GOOGLE_INDEX_SHEET_ID  → ID du GSheet maître Flinty Index
GOOGLE_DRIVE_FOLDER_ID → ID du dossier Google Drive où créer les GSheets enfants
```

**Code node — génération campaign_id :**
```javascript
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const campaignId = `camp_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${Math.random().toString(36).slice(2,7)}`;
const sheetName = `Flinty — ${$json.secteur} ${$json.localisation} ${pad(now.getMonth()+1)}/${now.getFullYear()}`;

return [{ json: { ...$json, campaign_id: campaignId, sheet_name: sheetName } }];
```

**Résultat attendu :** Lancer WF1 → un nouveau GSheet apparaît dans Google Drive + une ligne dans Flinty Index avec son sheet_id.

---

#### Tâche 0.4 — Modifier WF2 pour lire/écrire dans le GSheet enfant dynamique

**Ce qu'on fait :** WF2 ne travaille plus sur un GSheet fixe. Il reçoit le `sheet_id` en paramètre (via le webhook) et l'utilise dynamiquement.

**Modification du déclencheur de WF2 :**

WF2 est maintenant déclenché par un webhook POST qui inclut :
```json
{
  "campaign_id": "camp_20260115_a3f7k",
  "sheet_id": "1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

Dans tous les nœuds Google Sheets de WF2, remplace l'ID fixe par :
```
{{$json.sheet_id}}
```

**Résultat attendu :** WF2 peut traiter n'importe quelle campagne en passant juste son sheet_id.

---

#### Tâche 0.5 — Mettre à jour les API routes Next.js

**Ce qu'on fait :** Les routes API ne lisent plus un GSheet global. Elles lisent le GSheet maître pour trouver le sheet_id, puis interrogent le GSheet enfant correspondant.

**Nouvelle logique de `/api/campaigns/route.ts` :**
```typescript
// 1. Lit l'onglet Campagnes du GSheet MAÎTRE (Flinty Index)
const indexSheetId = process.env.GOOGLE_INDEX_SHEET_ID;
const campaigns = await sheets.spreadsheets.values.get({
  spreadsheetId: indexSheetId,
  range: 'Campagnes!A2:M1000',
});
// → retourne la liste avec sheet_id dans la colonne C
```

**Nouvelle logique de `/api/campaigns/[id]/route.ts` :**
```typescript
// 1. Trouve le sheet_id via campaign_id dans le GSheet maître
const campaign = await getCampaignById(campaignId); // campaign.sheet_id
// 2. Lit les leads dans le GSheet ENFANT
const leads = await sheets.spreadsheets.values.get({
  spreadsheetId: campaign.sheet_id,  // ← dynamique
  range: 'Leads_Qualified!A2:V1000',
});
```

**Variable d'environnement à ajouter dans `.env.local` et Vercel :**
```
GOOGLE_INDEX_SHEET_ID=1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Résultat attendu :** Le dashboard affiche les campagnes depuis le GSheet maître, et les leads depuis chaque GSheet enfant.

---

#### Tâche 0.6 — Modifier WF6 (Calcul Stats) pour la nouvelle architecture

**Ce qu'on fait :** WF6 parcourt chaque ligne du GSheet maître, lit les stats du GSheet enfant correspondant, et met à jour les colonnes J → M du maître.

```
Schedule (toutes les heures)
  ↓
Lit toutes les campagnes du GSheet maître
  ↓
Loop sur chaque campagne
  ↓
  Lit Leads_Raw du GSheet enfant (compte les lignes → total_leads_raw)
  Lit Leads_Qualified du GSheet enfant (compte → total_leads_qualified)
  Filtre statut_email = contacted/opened/etc. → emails_envoyés, taux_réponse
  ↓
  Met à jour les colonnes J-M dans le GSheet maître
```

---

## 📊 Vue d'ensemble des 5 blocs features v3

| # | Feature | Complexité | Impact | Dépendances |
|---|---|---|---|---|
| **BLOC 1** | Enrichissement IA augmenté | Moyenne | ⭐⭐⭐⭐⭐ | BLOC 0, WF2 |
| **BLOC 2** | Vue Kanban des leads | Moyenne | ⭐⭐⭐⭐⭐ | BLOC 0, GSheet enfant |
| **BLOC 3** | ICP.md généré par dialogue Claude | Haute | ⭐⭐⭐⭐⭐ | BLOC 0, nouvelle page |
| **BLOC 4** | Déduplication inter-campagnes | Basse | ⭐⭐⭐ | BLOC 0, GSheet maître |
| **BLOC 5** | Export multi-format | Basse | ⭐⭐ | BLOC 0, API export |

**4 leçons de l'article "Claude Code $2.5B ARR" intégrées :**

| Leçon | Intégrée dans |
|---|---|
| Hiring signals + growth_stage (signaux recrutement) | **BLOC 1** — nouveau prompt WF2 |
| Buying signal (1 phrase commerciale synthétique) | **BLOC 1** — nouveau prompt WF2 |
| Personalized hook (accroche email prête à coller) | **BLOC 1** — nouveau prompt WF2 + UI fiche lead |
| Rejection reason (leads refusés taggués, pas perdus) | **BLOC 1** — branche rejet WF2 + onglet Leads_Rejected |

---

## BLOC 1 — Enrichissement IA augmenté

> **Durée estimée : 3-4h**
> **Ce bloc transforme WF2 en vrai moteur d'intelligence commerciale.**
> **Intègre les 4 leçons de l'article.**

### Ce qu'on construit

WF2 produit aujourd'hui : nom, site, score, email, téléphone, taille_equipe.

Après ce bloc, WF2 produit aussi :
- `score_reason` — pourquoi ce score (1 phrase)
- `hiring_signals` — offres d'emploi détectées (signal d'intent fort)
- `growth_stage` — scaling / stable / shrinking / unknown
- `buying_signal` — 1 phrase commerciale synthétique sur ce prospect
- `personalized_hook` — accroche email ≤ 20 mots, prête à coller
- `rejection_reason` — pourquoi le lead a été écarté (si score < seuil)
- `web_quality_score` — score technique du site (0-100)

---

### Tâche 1.1 — Réécrire le prompt Claude dans WF2

**Ce qu'on fait :** Enrichir le prompt de scoring pour extraire les 7 nouveaux champs.

**Dans n8n, nœud HTTP Request — Claude API, remplace le body JSON :**

```json
{
  "model": "claude-opus-4-6",
  "max_tokens": 1500,
  "system": "Tu es un expert en qualification de leads B2B pour TPE/PME françaises. Analyse le contenu du site web et extrait les informations clés. RÉPONDS UNIQUEMENT EN JSON VALIDE, sans texte avant ou après, sans backticks Markdown.",
  "messages": [
    {
      "role": "user",
      "content": "Analyse cette entreprise pour une campagne de prospection B2B.\n\nNom: {{$json.nom}}\nSite: {{$json.site}}\nVille: {{$json.ville}}\n\nContenu du site (scraped):\n{{$json.scraped_content}}\n\n---\n\nICP de la campagne (lis attentivement pour scorer) :\n{{$json.icp_md}}\n\n---\n\nEXTRAIS ces informations en JSON strict :\n{\n  \"team_size\": <nombre estimé ou null>,\n  \"sector\": \"<secteur détecté>\",\n  \"ceo_name\": \"<nom CEO/fondateur ou null>\",\n  \"email\": \"<email de contact ou null>\",\n  \"prénom\": \"<prénom du contact principal ou null>\",\n  \"poste\": \"<poste du contact principal ou null>\",\n  \"has_ia_services\": true | false,\n  \"hiring_signals\": \"<offres d'emploi détectées sur /careers ou /recrutement, ou null si rien trouvé>\",\n  \"growth_stage\": \"scaling\" | \"stable\" | \"shrinking\" | \"unknown\",\n  \"buying_signal\": \"<1 phrase max : pourquoi ce prospect est chaud ou froid pour notre offre>\",\n  \"personalized_hook\": \"<accroche email ≤20 mots, ultra-spécifique, cite un service/client/projet/actualité réelle de cette entreprise>\",\n  \"score\": <0-100>,\n  \"score_reason\": \"<1 phrase expliquant le score en français>\",\n  \"rejection_reason\": \"<si score < seuil ICP : raison précise du rejet, sinon null>\"\n}\n\nCRITÈRES DE SCORING (base 100 points) :\n- Profil ICP aligné (secteur, taille, zone) : 40 pts\n- Signaux de croissance (recrutement actif, nouveaux clients, actualités récentes) : 20 pts\n- Absence de solution IA/automatisation déjà en place : 20 pts\n- Qualité site (moderne, contenu récent, portfolio visible) : 20 pts\n\nRÉPONDS UNIQUEMENT LE JSON."
    }
  ]
}
```

**Points clés du nouveau prompt :**
- Injecte `{{$json.icp_md}}` → le scoring est piloté par l'ICP de la campagne, pas par des critères génériques fixes
- `hiring_signals` → Claude cherche les signaux de recrutement dans le contenu scrapé (page /careers, mentions de "on recrute", etc.)
- `growth_stage` → inféré depuis le contenu (nouveaux locaux, nouveaux clients, team qui grandit)
- `buying_signal` → phrase commerciale directement utilisable par le SDR
- `personalized_hook` → accroche email prête à coller, avec référence spécifique à l'entreprise
- `rejection_reason` → les leads rejetés ont une raison documentée

**Résultat attendu :** Claude retourne un JSON avec 14 champs au lieu de 7.

---

### Tâche 1.2 — Lire l'ICP.md depuis le GSheet enfant avant de scorer

**Ce qu'on fait :** Avant le nœud Claude, ajouter un nœud qui lit l'onglet Config du GSheet enfant pour récupérer `icp_md` et `score_minimum`.

**Dans WF2, ajoute un nœud Google Sheets AVANT le nœud Claude :**

- Operation : Read
- Sheet ID : `{{$json.sheet_id}}`
- Range : `Config!A2:B20`

**Code node — extraire icp_md et score_minimum :**
```javascript
const rows = $input.all();
const config = {};
rows.forEach(item => {
  config[item.json.A] = item.json.B; // param_key → param_value
});

// Récupère le lead en cours depuis le nœud précédent
const lead = $('Loop Over Items').first().json;

return [{
  json: {
    ...lead,
    icp_md: config['icp_md'] || '',
    score_minimum: parseInt(config['score_minimum'] || '60'),
    sheet_id: $json.sheet_id, // on conserve sheet_id pour les prochains nœuds
  }
}];
```

**Résultat attendu :** L'ICP de la campagne est disponible dans `{{$json.icp_md}}` pour le prompt Claude.

---

### Tâche 1.3 — Écrire les nouveaux champs dans Leads_Qualified

**Ce qu'on fait :** Mettre à jour le nœud Google Sheets d'écriture de WF2 pour inclure les nouvelles colonnes.

**Dans n8n, nœud Google Sheets → Append to Leads_Qualified — ajoute ces colonnes :**
```
score_reason      → {{$json.score_reason}}
hiring_signals    → {{$json.hiring_signals}}
growth_stage      → {{$json.growth_stage}}
buying_signal     → {{$json.buying_signal}}
personalized_hook → {{$json.personalized_hook}}
```

**Résultat attendu :** Chaque ligne dans Leads_Qualified a les 5 nouveaux champs enrichis.

---

### Tâche 1.4 — Ajouter la branche "Leads Rejetés"

**Ce qu'on fait :** Les leads sous le seuil ne disparaissent plus dans le vide. Ils sont écrits dans l'onglet `Leads_Rejected` du GSheet enfant avec leur raison de rejet.

**Dans WF2, après le nœud de parsing Claude, ajoute une condition IF :**

```
IF {{$json.score}} >= {{$json.score_minimum}}
  → Branche OUI → Écrit dans Leads_Qualified (comme avant)
  → Branche NON → Écrit dans Leads_Rejected
```

**Nœud Google Sheets — Append to Leads_Rejected :**
```
lead_id          → {{$json.lead_id}}
campaign_id      → {{$json.campaign_id}}
nom              → {{$json.nom}}
site             → {{$json.site}}
score            → {{$json.score}}
rejection_reason → {{$json.rejection_reason}}
processed_at     → {{new Date().toISOString()}}
```

**Pourquoi c'est important :** WF1 peut vérifier cet onglet avant de re-scraper les mêmes entreprises → pas de doublon, pas de coût IA pour des leads déjà traités et rejetés.

**Résultat attendu :** 100% des leads traités par WF2 atterrissent quelque part. Taux de perte = 0.

---

### Tâche 1.5 — Web Quality Score (Firecrawl)

**Ce qu'on fait :** Analyser le site du prospect pour produire un score technique de 0 à 100 à partir du contenu déjà scrapé par Firecrawl — zéro appel API supplémentaire.

**Code node — calcul Web Quality Score (à insérer après Firecrawl, avant Claude) :**
```javascript
const url = $json.site || '';
const markdown = $json.scraped_content || '';
const html = $json.scraped_html || '';

let webScore = 0;
const signals = [];

// 1. HTTPS (25 pts)
if (url.startsWith('https://')) {
  webScore += 25;
  signals.push('HTTPS ✅');
} else {
  signals.push('HTTPS ❌');
}

// 2. Mobile-friendly (25 pts)
if (markdown.includes('viewport') || html.includes('name="viewport"')) {
  webScore += 25;
  signals.push('Mobile ✅');
} else {
  signals.push('Mobile ❓');
}

// 3. Contenu de qualité (25 pts)
if (markdown.length > 800) {
  webScore += 25;
  signals.push('Contenu ✅');
} else {
  signals.push('Contenu ❌');
}

// 4. SEO de base — présence d'un H1 et de structure (25 pts)
if (markdown.includes('# ') || markdown.includes('## ')) {
  webScore += 25;
  signals.push('SEO ✅');
} else {
  signals.push('SEO ❌');
}

return [{
  json: {
    ...$json,
    web_quality_score: webScore,
    web_quality_signals: signals.join(' | '),
  }
}];
```

**Résultat attendu :** Chaque lead a un `web_quality_score` (0, 25, 50, 75 ou 100) et `web_quality_signals` lisibles.

---

### Tâche 1.6 — Afficher les nouveaux champs dans la fiche lead (Flinty UI)

**Ce qu'on fait :** Mettre à jour `app/dashboard/campaigns/[campaign_id]/leads/[lead_id]/page.tsx`.

**Ajoute ces 3 blocs dans la fiche lead, après la carte entreprise principale :**

```tsx
{/* Buying signal + Hiring signals */}
<div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-4">
  <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
    Signal d'achat
  </h2>
  <p className="text-sm text-white">{lead.buying_signal || '—'}</p>
  {lead.hiring_signals && (
    <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
      <span>🏗️</span>
      <span>Recrutement : {lead.hiring_signals}</span>
    </p>
  )}
  {lead.growth_stage && lead.growth_stage !== 'unknown' && (
    <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${
      lead.growth_stage === 'scaling' ? 'bg-green-900/50 text-green-400' :
      lead.growth_stage === 'shrinking' ? 'bg-red-900/50 text-red-400' :
      'bg-zinc-800 text-zinc-400'
    }`}>
      {lead.growth_stage}
    </span>
  )}
</div>

{/* Hook personnalisé — le plus important */}
<div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-6 mb-4">
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
      ⚡ Hook email personnalisé
    </h2>
    <button
      onClick={() => navigator.clipboard.writeText(lead.personalized_hook || '')}
      className="text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded px-2 py-1 transition-colors"
    >
      Copier
    </button>
  </div>
  <p className="text-sm text-white italic">
    "{lead.personalized_hook || 'Hook non généré'}"
  </p>
</div>

{/* Web Quality Score */}
<div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-4">
  <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
    Qualité site web
  </h2>
  <div className="flex items-center gap-4">
    <span className={`text-3xl font-bold ${
      (parseInt(lead.web_quality_score) || 0) >= 75 ? 'text-green-400' :
      (parseInt(lead.web_quality_score) || 0) >= 50 ? 'text-yellow-400' :
      'text-red-400'
    }`}>
      {lead.web_quality_score || '—'}
      <span className="text-base text-zinc-600">/100</span>
    </span>
    <p className="text-xs text-zinc-500">{lead.web_quality_signals || ''}</p>
  </div>
</div>
```

**Résultat attendu :** La fiche lead affiche le hook perso (avec bouton "Copier"), le signal d'achat, les signaux de recrutement, et le score qualité du site.

---

## BLOC 2 — Vue Kanban des leads

> **Durée estimée : 4-5h**
> **Inspiré de Leadpin. Construit en Next.js natif dans Flinty.**

### Ce qu'on construit

Une vue Kanban à colonnes représentant le pipeline email de chaque lead :

```
[ Nouveaux ] → [ Contactés ] → [ Ouvert ] → [ Cliqué ] → [ Répondu ] → [ Bounced ]
```

Chaque colonne = cartes leads. Drag & drop pour changer le statut manuellement.

---

### Tâche 2.1 — Installer la librairie drag-and-drop

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

### Tâche 2.2 — Créer la page Kanban

**Fichier :** `app/dashboard/campaigns/[campaign_id]/kanban/page.tsx`

**Colonnes et couleurs :**
```typescript
const COLUMNS = [
  { id: 'new',       label: 'Nouveaux',   color: 'border-zinc-600',   count_color: 'text-zinc-400' },
  { id: 'contacted', label: 'Contactés',  color: 'border-blue-600',   count_color: 'text-blue-400' },
  { id: 'opened',    label: 'Ouvert',     color: 'border-yellow-600', count_color: 'text-yellow-400' },
  { id: 'clicked',   label: 'Cliqué',     color: 'border-orange-500', count_color: 'text-orange-400' },
  { id: 'replied',   label: 'Répondu',    color: 'border-green-600',  count_color: 'text-green-400' },
  { id: 'bounced',   label: 'Bounced',    color: 'border-red-600',    count_color: 'text-red-400' },
];
```

**Carte lead (design minimal, cohérent avec le reste de Flinty) :**
```tsx
<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 cursor-grab hover:border-zinc-600 transition-colors group">
  <p className="font-medium text-sm text-white truncate">{lead.nom}</p>
  <p className="text-xs text-zinc-500 mt-0.5">{lead.ville} · {lead.secteur}</p>
  <div className="flex items-center justify-between mt-2">
    <span className={`text-xs font-bold ${
      lead.score >= 70 ? 'text-green-400' :
      lead.score >= 50 ? 'text-yellow-400' : 'text-zinc-500'
    }`}>
      {lead.score}/100
    </span>
    {lead.email && <span className="text-xs text-zinc-600">✉</span>}
  </div>
  {/* Hook perso — visible au hover */}
  {lead.personalized_hook && (
    <p className="text-xs text-zinc-600 mt-2 italic truncate opacity-0 group-hover:opacity-100 transition-opacity">
      "{lead.personalized_hook}"
    </p>
  )}
</div>
```

---

### Tâche 2.3 — API route pour mettre à jour le statut (drag & drop)

**Fichier :** `app/api/leads/[id]/status/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSheets } from '@/lib/google-sheets';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { status, sheet_id } = await req.json();
  const sheets = await getSheets();

  // Trouve la ligne du lead dans Leads_Qualified du GSheet enfant
  const range = await sheets.spreadsheets.values.get({
    spreadsheetId: sheet_id,
    range: 'Leads_Qualified!A2:A1000',
  });

  const rowIndex = range.data.values?.findIndex(row => row[0] === params.id);
  if (rowIndex === undefined || rowIndex === -1) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Colonne statut_email = colonne S (index 18, 0-based) → ligne rowIndex + 2
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheet_id,
    range: `Leads_Qualified!S${rowIndex + 2}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[status]] },
  });

  return NextResponse.json({ success: true });
}
```

---

### Tâche 2.4 — Ajouter l'onglet "Kanban" dans la navigation par campagne

Dans `app/dashboard/campaigns/[campaign_id]/page.tsx`, ajoute les onglets de navigation :

```tsx
<div className="flex items-center gap-1 mb-6 border-b border-zinc-800">
  {[
    { label: 'Leads', href: `/dashboard/campaigns/${campaignId}` },
    { label: 'Kanban', href: `/dashboard/campaigns/${campaignId}/kanban` },
  ].map(({ label, href }) => (
    <Link key={label} href={href}
      className="px-4 py-2 text-sm text-zinc-400 hover:text-white border-b-2 border-transparent hover:border-zinc-600 transition-colors -mb-px">
      {label}
    </Link>
  ))}
</div>
```

**Résultat attendu :** Vue Kanban accessible depuis la page campagne, avec drag & drop fonctionnel qui met à jour le GSheet enfant en temps réel.

---

## BLOC 3 — ICP.md généré par dialogue avec Claude

> **Durée estimée : 5-6h**
> **La feature la plus différenciante de Flinty v3.**

### Ce qu'on construit

Un flow en 3 étapes déclenché par le bouton "+ Nouvelle campagne" :

```
Étape 1 — Dialogue (interface chat)
  → Claude pose 8 questions stratégiques une par une
  → Thomas / le client répond dans l'interface Flinty

Étape 2 — Génération (Claude synthèse)
  → Claude rédige le ICP.md complet
  → Affiché en preview Markdown dans Flinty pour validation

Étape 3 — Lancement
  → Thomas valide (ou édite) le ICP.md
  → Flinty déclenche WF1 avec l'ICP.md injecté dans Config du GSheet enfant
  → La campagne démarre
```

---

### Tâche 3.1 — Page de dialogue ICP

**Fichier :** `app/dashboard/campaigns/new/page.tsx`

**Interface : chat simple (sans formulaire classique) :**

```tsx
'use client'
import { useState } from 'react';

const QUESTIONS = [
  "Quel secteur d'activité cibles-tu pour cette campagne ? (ex: plomberie, restauration, agences web)",
  "Quelle zone géographique ? (villes précises, région, ou national)",
  "Quelle taille d'entreprise ? (nombre d'employés ou CA estimé)",
  "Quel est le poste du décideur à cibler ? (ex: Gérant, DG, Directeur Marketing)",
  "Quel problème précis résous-tu pour eux ? (décris avant/après)",
  "Quelle offre Kames tu proposes sur cette campagne ? (ex: Répondeur IA, Automatisation devis)",
  "Y a-t-il des signaux qui indiquent qu'ils sont prêts à acheter ? (ex: mauvais avis Google, pas de présence en ligne, recrutement actif)",
  "Des entreprises ou profils à exclure absolument ? (concurrents directs, clients actuels, secteurs spécifiques)",
];

export default function NewCampaignPage() {
  const [step, setStep] = useState<'chat' | 'preview' | 'launching'>('chat');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{question: string, answer: string}[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [icpMd, setIcpMd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnswer = async () => {
    const newAnswers = [...answers, {
      question: QUESTIONS[currentQuestion],
      answer: currentAnswer
    }];
    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Toutes les questions répondues → génère le ICP
      setLoading(true);
      const res = await fetch('/api/campaigns/generate-icp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: newAnswers }),
      });
      const data = await res.json();
      setIcpMd(data.icp_md);
      setStep('preview');
      setLoading(false);
    }
  };

  // ... render (chat UI + preview markdown + bouton "Lancer")
}
```

---

### Tâche 3.2 — API route de génération ICP

**Fichier :** `app/api/campaigns/generate-icp/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  const { answers } = await req.json();
  const client = new Anthropic();

  const qaText = answers
    .map(({ question, answer }: { question: string, answer: string }) =>
      `Q: ${question}\nR: ${answer}`
    ).join('\n\n');

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    system: `Tu es un expert en stratégie de prospection B2B pour TPE/PME françaises.
Tu travailles pour Kames AI, une agence d'automatisation IA basée en France.
À partir des réponses d'un fondateur, tu rédiges un ICP.md (Ideal Customer Profile)
structuré et actionnable, qui servira à piloter les workflows de génération et scoring de leads.
Le document doit être précis, utilisable directement par une IA de scoring,
et inclure des signaux concrets d'intention d'achat.`,
    messages: [{
      role: 'user',
      content: `Voici les réponses pour définir la campagne :\n\n${qaText}\n\n---\n\nGénère un ICP.md complet avec cette structure EXACTE en Markdown :\n\n# ICP — [Secteur] [Localisation]\n\n## Profil cible\n- **Secteur :** ...\n- **Zone géographique :** ...\n- **Taille d'entreprise :** ... employés\n- **Poste décideur :** ...\n- **CA estimé :** ...\n\n## Problème résolu\n[1 paragraphe décrivant le problème concret avant Kames AI]\n\n## Offre proposée\n[L'offre Kames + ce que ça change concrètement]\n\n## Signaux d'achat à scorer (+)\n- [Signal 1]\n- [Signal 2]\n- [Signal 3]\n\n## Signaux négatifs à scorer (-)\n- [Ce qui indique qu'ils ne sont PAS bons leads]\n\n## Exclusions\n- [Entreprises/profils à ne pas contacter]\n\n## Critères de scoring IA (pour WF2)\n| Critère | Poids | Description |\n|---|---|---|\n| Profil ICP aligné | 40 pts | Secteur + taille + zone corrects |\n| Signaux d'achat | 20 pts | Au moins 1 signal détecté |\n| Pas de solution IA en place | 20 pts | Pas de concurrence directe |\n| Qualité présence web | 20 pts | Site à jour, contenu récent |\n\n## Hook email type\n[Exemple d'accroche ultra-personnalisée pour ce secteur — ≤ 20 mots]`
    }]
  });

  const icpMd = response.content[0].type === 'text' ? response.content[0].text : '';
  return NextResponse.json({ success: true, icp_md: icpMd });
}
```

---

### Tâche 3.3 — API route de lancement campagne (mise à jour)

**Dans `/api/campaigns/route.ts`, méthode POST — envoie l'ICP.md à WF1 :**

```typescript
const wf1Response = await fetch(`${process.env.N8N_BASE_URL}/webhook/flinty-wf1-launch`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nom: campaignName,
    secteur,
    localisation,
    offre_kames,
    icp_md,            // ← WF1 l'écrit dans l'onglet Config du GSheet enfant
    score_minimum: 60,
  })
});
```

**Résultat attendu :** Le bouton "+ Nouvelle campagne" ouvre un chat, génère un ICP.md validé, et lance automatiquement WF1 en 1 clic.

---

## BLOC 4 — Déduplication inter-campagnes

> **Durée estimée : 1-2h**
> **Utile dès que tu as 3+ campagnes actives en parallèle.**

### Ce qu'on construit

Éviter de prospecter le même contact dans plusieurs campagnes simultanément. Un "registre global des domaines touchés" dans le GSheet maître.

---

### Tâche 4.1 — Ajouter un onglet "Contacts_Registry" au GSheet maître

**Dans Flinty Index (GSheet maître), ajoute un onglet :**

```
Contacts_Registry
domain | last_contacted_at | campaign_id | statut
```

Le `domain` est le domaine du site web (ex: `plombier-martin.fr`), utilisé comme clé de déduplication.

---

### Tâche 4.2 — Modifier WF1 pour vérifier le registre avant d'ajouter un lead

**Dans WF1, après le filtre Google Maps et avant l'écriture dans Leads_Raw :**

```
HTTP Request → Google Sheets API
  → Lit Contacts_Registry du GSheet maître
  → Extrait la liste des domains déjà contactés

Code node — filtre les leads déjà dans le registre
```

**Code node :**
```javascript
const knownDomains = new Set(
  $('Read Registry').all().map(item => {
    const domain = item.json.domain;
    return domain ? domain.toLowerCase() : null;
  }).filter(Boolean)
);

const filteredLeads = $input.all().filter(item => {
  try {
    const domain = new URL(item.json.site).hostname.replace('www.', '').toLowerCase();
    return !knownDomains.has(domain);
  } catch {
    return true; // URL invalide → on garde le lead, on verra
  }
});

return filteredLeads;
```

---

### Tâche 4.3 — WF3 met à jour le registre au moment de l'envoi J0

**Dans WF3 (Envoi Email J0), après l'envoi Resend :**

```
Google Sheets → Append to Contacts_Registry (GSheet maître)
  domain             → extraire depuis site du lead (new URL(site).hostname)
  last_contacted_at  → new Date().toISOString()
  campaign_id        → {{$json.campaign_id}}
  statut             → contacted
```

**Résultat attendu :** Un lead dont le domaine est `plombier-martin.fr` ne sera jamais prospecté deux fois, même dans une campagne différente.

---

## BLOC 5 — Export multi-format

> **Durée estimée : 1-2h**

### Ce qu'on construit

Depuis la page campagne, exporter les leads qualifiés en 3 formats :
- **CSV standard** — tableur, import CRM générique
- **JSON** — développeurs, intégrations API
- **Instantly-ready CSV** — format exact pour import direct dans Instantly.ai avec le hook perso pré-rempli

---

### Tâche 5.1 — Mettre à jour l'API route export

**Fichier :** `app/api/campaigns/[id]/export/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getLeadsForCampaign } from '@/lib/campaigns';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const format = req.nextUrl.searchParams.get('format') || 'csv';
  const leads = await getLeadsForCampaign(params.id);

  if (format === 'json') {
    return NextResponse.json({ leads }, {
      headers: { 'Content-Disposition': `attachment; filename="flinty-${params.id}.json"` }
    });
  }

  if (format === 'instantly') {
    // Format Instantly.ai : Email, First Name, Last Name, Company Name, Personalization
    const header = 'Email,First Name,Last Name,Company Name,Personalization\n';
    const rows = leads
      .filter(l => l.email) // Instantly n'accepte que les leads avec email
      .map(l => {
        const hook = (l.personalized_hook || '').replace(/"/g, '""');
        return `"${l.email}","${l.prénom || ''}","","${l.nom || ''}","${hook}"`;
      }).join('\n');

    return new NextResponse(header + rows, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="instantly-${params.id}.csv"`,
      }
    });
  }

  // CSV standard (avec tous les nouveaux champs v3)
  const header = 'nom,site,ville,score,score_reason,email,téléphone,prénom,poste,taille_equipe,buying_signal,personalized_hook,hiring_signals,growth_stage,web_quality_score,statut_email\n';
  const rows = leads.map(l => {
    const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
    return [
      escape(l.nom), escape(l.site), escape(l.ville), l.score,
      escape(l.score_reason), escape(l.email), escape(l.téléphone),
      escape(l.prénom), escape(l.poste), escape(l.taille_equipe),
      escape(l.buying_signal), escape(l.personalized_hook),
      escape(l.hiring_signals), escape(l.growth_stage),
      l.web_quality_score, escape(l.statut_email)
    ].join(',');
  }).join('\n');

  return new NextResponse(header + rows, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="flinty-export-${params.id}.csv"`,
    }
  });
}
```

---

### Tâche 5.2 — Boutons d'export dans l'UI campagne

**Dans la page campagne, remplace le bouton export unique par :**

```tsx
<div className="flex items-center gap-2">
  <span className="text-xs text-zinc-500 mr-1">Export :</span>
  {[
    { label: 'CSV', format: 'csv', title: 'Export standard' },
    { label: 'JSON', format: 'json', title: 'Export développeur' },
    { label: 'Instantly ⚡', format: 'instantly', title: 'Import direct Instantly.ai' },
  ].map(({ label, format, title }) => (
    <a
      key={format}
      href={`/api/campaigns/${campaignId}/export?format=${format}`}
      download
      title={title}
      className="text-xs px-3 py-1.5 border border-zinc-700 rounded hover:border-zinc-500 hover:text-white text-zinc-400 transition-colors"
    >
      {label}
    </a>
  ))}
</div>
```

**Résultat attendu :** 3 boutons d'export. Le format "Instantly ⚡" permet d'importer directement dans Instantly.ai avec le hook personnalisé dans la colonne Personalization — aucune saisie manuelle.

---

## ✅ Checklist v3 complète

### BLOC 0 — Architecture GSheet (PRIORITÉ 1)
- [ ] GSheet maître "Flinty Index" créé (13 colonnes + onglet Contacts_Registry)
- [ ] Structure GSheet enfant définie (4 onglets : Raw, Qualified, Rejected, Config)
- [ ] WF1 modifié → crée GSheet enfant automatiquement via Google Drive API
- [ ] WF1 écrit la ligne dans le GSheet maître (sheet_id inclus)
- [ ] WF2 reçoit `sheet_id` dynamiquement et l'utilise dans tous les nœuds Sheets
- [ ] API routes lisent le maître pour trouver le sheet_id → lisent l'enfant pour les leads
- [ ] Variable `GOOGLE_INDEX_SHEET_ID` ajoutée dans `.env.local` et Vercel
- [ ] WF6 parcourt le maître et met à jour les stats campagne par campagne

### BLOC 1 — Enrichissement IA augmenté (PRIORITÉ 2)
- [ ] Prompt Claude mis à jour (14 champs de sortie)
- [ ] Nœud "Lecture Config" ajouté dans WF2 avant Claude (icp_md + score_minimum)
- [ ] Nouveaux champs écrits dans Leads_Qualified (score_reason, hiring_signals, growth_stage, buying_signal, personalized_hook)
- [ ] Branche rejet → onglet Leads_Rejected avec rejection_reason + processed_at
- [ ] Web Quality Score calculé (Code node après Firecrawl)
- [ ] Fiche lead UI : hook perso (+ bouton Copier) + buying_signal + hiring_signals + growth_stage badge + web_quality_score

### BLOC 2 — Kanban
- [ ] `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [ ] Page `app/dashboard/campaigns/[campaign_id]/kanban/page.tsx` créée
- [ ] API PATCH `/api/leads/[id]/status` opérationnelle (écrit dans GSheet enfant dynamique)
- [ ] Onglets de navigation Leads / Kanban dans la page campagne

### BLOC 3 — ICP.md généré par Claude
- [ ] Page `/campaigns/new` → interface dialogue (questions une par une)
- [ ] API `/api/campaigns/generate-icp` créée (prompt ICP.md structuré)
- [ ] Preview ICP.md en Markdown avant lancement (avec bouton d'édition)
- [ ] WF1 reçoit l'ICP.md dans le payload → l'écrit dans Config du GSheet enfant

### BLOC 4 — Déduplication
- [ ] Onglet `Contacts_Registry` dans GSheet maître
- [ ] WF1 vérifie le registre avant d'ajouter un lead (Code node de filtre)
- [ ] WF3 écrit dans le registre après envoi J0 (domain + campaign_id)

### BLOC 5 — Export multi-format
- [ ] Export CSV standard (avec tous les nouveaux champs v3)
- [ ] Export JSON
- [ ] Export Instantly-ready (Email + prénom + Company + personalized_hook)
- [ ] 3 boutons dans l'UI campagne

---

## 🗓️ Ordre d'implémentation recommandé

| Semaine | Blocs | Pourquoi cet ordre |
|---|---|---|
| **S1** | BLOC 0 complet | Fondation — tout le reste en dépend. Sans ça, rien ne tient. |
| **S2** | BLOC 1 (1.1 → 1.4) | Enrichissement IA — high impact, tourne dès que BLOC 0 est en place |
| **S2** | BLOC 5 | 2h de dev, immédiatement utile pour l'outreach Instantly |
| **S3** | BLOC 3 | Feature différenciante — nécessite BLOC 1 pour que l'ICP pilote bien le scoring |
| **S3** | BLOC 1 (1.5 + 1.6) | Web score + affichage UI fiche lead |
| **S4** | BLOC 2 | Kanban — feature visuelle, build dessus une fois que les données sont riches |
| **S4** | BLOC 4 | Déduplication — utile à partir de 5+ campagnes actives en parallèle |

---

## 🔧 Variables d'environnement à ajouter

| Variable | Valeur | Où |
|---|---|---|
| `GOOGLE_INDEX_SHEET_ID` | ID du GSheet maître "Flinty Index" | `.env.local` + Vercel |
| `GOOGLE_DRIVE_FOLDER_ID` | ID du dossier Drive où WF1 crée les GSheets enfants | n8n env vars |
| `ANTHROPIC_API_KEY` | Clé API Anthropic (pour la génération ICP dans Next.js) | `.env.local` + Vercel |

---

## 📌 Tableau de dépannage v3

| Symptôme | Cause probable | Solution |
|---|---|---|
| WF1 ne crée pas de GSheet | Google Drive API non activée | Console Cloud → Activer "Google Drive API" |
| `sheet_id` null dans le maître | WF1 n'a pas récupéré l'ID après création | Vérifier le nœud HTTP Request Drive → extraire `id` dans la réponse |
| WF2 ne trouve pas l'ICP | Onglet Config vide ou mal nommé | Vérifier que WF1 a bien écrit `icp_md` dans Config |
| Claude retourne du texte au lieu de JSON | Prompt mal formaté | Ajouter `"RÉPONDS UNIQUEMENT LE JSON"` en fin de message |
| API `/api/campaigns` retourne `[]` | `GOOGLE_INDEX_SHEET_ID` incorrect | Vérifier la variable dans Vercel |
| Export Instantly sans hooks | `personalized_hook` non écrit dans GSheet | Vérifier colonne dans Leads_Qualified + mapping WF2 |
| Kanban drag & drop ne sauvegarde pas | `sheet_id` non transmis au PATCH | Vérifier que `sheet_id` est passé dans le body du PATCH |

---

*Plan v3 généré le 15 avril 2026 | Kames AI — Flinty*
*Basé sur : Plan v2 (dashboard-planv2.md) + 5 features Leadpin+ + 4 leçons article "Claude Code $2.5B ARR" + migration architecture 1 GSheet par campagne*
