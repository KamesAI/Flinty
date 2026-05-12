# Distillat marketing → champs prompts Flinty (WF2, generate-icp)

Référence unique pour itérer les prompts **n8n / OpenRouter** sans parcourir tout [marketingskills](https://github.com/coreyhaines31/marketingskills).  
Hub agent : [skills/flinty-product-marketing-context/SKILL.md](../skills/flinty-product-marketing-context/SKILL.md).  
Champs produit : [00-Discovery/PRD.md](../00-Discovery/PRD.md) (Feature 2 enrichissement IA).

## Contexte système (à injecter ou résumer)

- **ICP campagne** : contenu de `Config.icp_md` + secteur / zone géographique de la campagne.  
- **Rôle du modèle** : analyste commercial B2B FR ; sortie **JSON structuré** selon le schéma attendu par WF2.  
- **Contraintes** : pas d’invention d’email ou de chiffres non présents dans les entrées (Firecrawl, ligne lead) ; si inconnu, chaîne vide ou score neutre avec `score_reason` explicite.

## Mapping champs → blocs « marketingskills »

| Champ sortie (PRD v3) | Intention | Bloc réutilisable (cadres cold-email / customer-research / psychology) |
|----------------------|-----------|------------------------------------------------------------------------|
| `personalized_hook` | Une phrase d’accroche email ≤ ~20 mots, collable **tel quel** (Instantly `Personalization`) | Angle **spécifique** au prospect : signal observable (poste, actu, wording site), pas de pitch produit ; éviter superlatifs ; vouvoiement. |
| `buying_signal` | Signal d’achat ou de projet déduit des faits | Lister **faits** (recrutement, levée, refonte site, certification) ; une courte phrase ; pas de spéculation sans base. |
| `hiring_signals` | Indices RH / équipe | Mentionner postes ouverts, croissance d’équipe si visibles dans les données. |
| `growth_stage` | Stade (startup, scale, mature…) | Qualifier à partir de taille, ancienneté, signaux web ; rester prudent si données minces. |
| `score_reason` | Pourquoi ce score | 2–4 phrases : critères ICP cochés ou non, avec **références** aux lignes ICP. |
| `rejection_reason` | Pourquoi sous le seuil | Une raison **actionnable** (hors cible, secteur, zone, qualité web, doublon logique) pour éviter re-prospection aveugle. |
| `web_quality_score` | Calculé n8n post-Firecrawl | Hors LLM ; ce document ne définit que les **signaux** utiles en amont si besoin : cohérence NAP, présence CTA, fraîcheur contenu. |

## Brief prospect (à construire dans le prompt avant scoring)

Structurer l’entrée modèle comme un mini brief (inspiré `customer-research` + `competitor-profiling`) :

1. **Entreprise** : nom, secteur, ville/région.  
2. **Signaux site / crawl** : titre, offre, preuves, signaux recrutement.  
3. **Fit ICP** : quels critères du `icp_md` matchent ou non (liste explicite).  
4. **Concurrence / alternatives** : si données disponibles, une ligne ; sinon omettre.

## Génération ICP (`generate-icp`)

- S’appuyer sur le dialogue utilisateur + éventuellement `offre_kames` / segment.  
- Produire un `icp_md` **structuré** (titres markdown) : profil idéal, anti-profils, signaux positifs / exclusion, ton acceptable.  
- Aligner le vocabulaire avec les champs que WF2 utilisera pour scorer (éviter termes vagues non vérifiables sur le web).

## Séquences cold email (hors WF2 pur)

Pour rédaction **manuelle** ou templates J0/J+3/J+7 : utiliser [skills/sales-message-generator/SKILL.md](../skills/sales-message-generator/SKILL.md) ; les frameworks `cold-email` et `email-sequence` du vendor servent de **checklist** angles et relances, pas de remplacement des tokens Kames.

## Mise à jour

Réviser ce distillat quand le PRD ajoute des champs ou quand les prompts WF2 changent de schéma JSON.
