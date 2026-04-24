# Plan — Intégration Pappers dans Flinty

## Contexte

Pappers a lancé son MCP officiel avec une **période gratuite illimitée de 2 semaines** (annonce ~12 avril 2026 → fenêtre expire ~26 avril 2026, soit ~7 jours restants). L'objectif est de profiter de cette fenêtre pour enrichir en batch les leads existants, puis intégrer l'API Pappers dans WF2 n8n pour les nouveaux leads.

Kames vend des services IT/web. Thomas veut récupérer les **dépenses en honoraires/services extérieurs** et le **résultat net** pour qualifier la capacité d'achat des prospects.

---

## ⚠️ Limite critique sur les "honoraires IT/web"

Les comptes annuels déposés au greffe (source Pappers) contiennent le **compte de résultat par nature**, mais les charges sont agrégées ainsi :

| Poste disponible | Contenu réel |
|---|---|
| **Services extérieurs** | Honoraires + loyers + assurances + maintenance + sous-traitance — **agrégé, non ventilé** |
| **Résultat net** | ✅ Disponible directement |
| **Chiffre d'affaires** | ✅ Disponible directement |
| **Honoraires IT spécifiques** | ❌ Pas disponible en public — uniquement dans la liasse fiscale détaillée (non accessible) |

**Conclusion** : on peut récupérer le poste "services extérieurs" (proxy imparfait mais utile) et le résultat net. Ce n'est pas la ventilation exacte IT, mais c'est le meilleur signal disponible dans les données publiques.

---

## Coût estimé post-période gratuite

Tarif API Pappers : **~500 jetons = 40 € (0,08 €/jeton)**. 100 jetons gratuits à l'ouverture d'un compte email pro.

| Scénario | Appels | Jetons estimés | Coût |
|---|---|---|---|
| Batch 1000 leads (one-shot) | 3 appels/lead | ~3000 jetons | ~240 € |
| n8n en continu (50 leads/mois) | 3 appels/lead | ~150 jetons/mois | ~12 €/mois |
| **Recommandé : batch gratuit maintenant + n8n ciblé après** | 2 champs seulement en n8n | ~100 jetons/mois | ~8 €/mois |

---

## Plan d'exécution en 2 phases

### Phase 1 — Batch gratuit (à faire dans les 7 jours)

**Objectif** : enrichir tous les leads existants des Google Sheets via Claude Code + MCP Pappers, pendant que c'est gratuit et illimité.

**Étapes** :

1. **Configurer le MCP Pappers dans Claude Code**
   - Fichier : `~/.claude.json` (scope user, comme les autres MCP)
   - Commande d'installation : `npx @pappers/mcp` ou via la documentation officielle `pappers.fr/mcp-documentation`
   - Clé API : obtenir sur `moncompte.pappers.fr` (créer un compte avec email pro → 100 crédits offerts)

2. **Lire tous les leads depuis Google Sheets**
   - Utiliser `lib/sheets.ts` (déjà en place) pour lire chaque `Leads_Raw` de chaque campagne
   - Identifier les colonnes cibles : `company_name` → source pour la siretisation

3. **Script d'enrichissement batch**
   - Pour chaque lead : appeler le MCP Pappers en séquence :
     - `recherche_entreprise(company_name)` → récupère SIREN
     - `fiche_entreprise(siren)` → CA 3 ans, résultat net, effectif, code NAF
     - `dirigeants(siren)` → nom + titre du dirigeant actuel
     - `comptes_annuels(siren)` → poste "services extérieurs" (proxy honoraires)
   - Stocker les résultats dans de nouvelles colonnes du GSheet :
     - `pappers_siren`, `pappers_ca`, `pappers_resultat_net`, `pappers_services_ext`, `pappers_effectif`, `pappers_naf`, `pappers_dirigeant_nom`, `pappers_dirigeant_titre`

4. **Validation** : vérifier sur 5 leads manuellement que les données sont cohérentes

### Phase 2 — Intégration WF2 n8n (après la période gratuite)

**Objectif** : enrichir automatiquement chaque nouveau lead avec les 3 champs les plus rentables (SIREN + CA + résultat net), en minimisant les jetons consommés.

**Étapes** :

1. **Obtenir une clé API Pappers** (si pas encore fait)
   - `moncompte.pappers.fr` → générer `api_token`
   - Ajouter dans les variables d'env Vercel : `PAPPERS_API_KEY`

2. **Ajouter un nœud HTTP Request dans WF2 (qualification n8n)**
   - Après le nœud Firecrawl, avant le nœud Claude
   - URL : `https://api.pappers.fr/v2/entreprise?siren={siren}&api_token={token}&champs=finances,dirigeants`
   - Mapper les champs vers les colonnes `Leads_Qualified`

3. **Passer les données financières à Claude Opus dans le prompt**
   - Le prompt de qualification BLOC 1 reçoit déjà 14 champs
   - Ajouter : CA, résultat net, services extérieurs, dirigeant → Claude peut scorer le fit budget directement

---

## Fichiers à modifier

| Fichier | Modification |
|---|---|
| `~/.claude.json` | Ajouter le MCP Pappers (Phase 1) |
| `lib/sheets.ts` | Ajouter les colonnes `pappers_*` dans le schéma |
| `lib/campaigns.ts` | Ajouter une fonction `enrichWithPappers(leads[])` |
| `app/api/leads/[id]/route.ts` | Exposer les champs Pappers dans la réponse API |
| Workflow WF2 n8n | Ajouter nœud HTTP Request Pappers (Phase 2) |

---

## Vérification

1. Tester la config MCP : demander à Claude Code la fiche d'une entreprise test connue (ex: SIREN d'une entreprise publique)
2. Lancer le batch sur 10 leads → vérifier le GSheet que les colonnes sont bien remplies
3. Vérifier la consommation de jetons : `moncompte.pappers.fr/credits`
4. Pour WF2 : test manuel du workflow n8n sur 1 lead → vérifier que les champs Pappers arrivent dans `Leads_Qualified`
