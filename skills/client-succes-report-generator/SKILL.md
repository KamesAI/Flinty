---
name: client-success-report-generator
description: "Génère automatiquement des rapports mensuels de succès client professionnels. Affiche les gains (temps économisé, documents traités, leads qualifiés), résout les incidents, recommande optimisations, et ouvre la porte aux upsells."
---

# Skill: client-success-report-generator

## Purpose

Générer automatiquement des rapports mensuels de succès client pour Kames AI. Ces rapports créent de la valeur perçue, justifient le ROI, et ouvrent la porte à des upsells (automatisations supplémentaires).

## Context

**Agence :** Kames AI - Automatisation IA pour TPE/PME françaises  
**Fréquence :** 1 rapport par client, le 1er du mois  
**Intégration :** n8n récupère les données, Claude génère le contenu, conversion en PDF et envoi mail automatisé  
**Cible :** Clients payants ayant des workflows IA actifs depuis ≥1 mois  

## Input Format

```json
{
  "client": {
    "nom": "string",
    "secteur": "string",
    "contact_principal": "string",
    "email": "string"
  },
  "periode": {
    "mois": "string (Décembre 2024)",
    "date_debut": "YYYY-MM-DD",
    "date_fin": "YYYY-MM-DD"
  },
  "workflows_data": {
    "total_workflows_actifs": "number",
    "executions_totales": "number",
    "executions_reussies": "number",
    "executions_echouees": "number",
    "taux_succes_pct": "number (0-100)"
  },
  "impact_metrics": {
    "temps_economise_heures": "number",
    "nombre_processus_automatises": "number",
    "documents_traites": "number",
    "leads_qualifies": "number"
  },
  "costs_avoided": {
    "heures_manuelles_evitees": "number",
    "taux_horaire_client": "number (estimé)",
    "valeur_economisee_euros": "number"
  },
  "incidents": {
    "total": "number",
    "critiques": "number",
    "resolutions": [
      {
        "date": "YYYY-MM-DD",
        "description": "string",
        "temps_resolution_h": "number",
        "impact": "string (faible/moyen/critique)"
      }
    ]
  },
  "notes_client": "string (optionnel - feedback, demandes)",
  "prochaines_optimisations": [
    "string 1",
    "string 2"
  ]
}
```

## Output Structure

Le rapport doit être structuré en 5 sections principales, destinées à être converties en PDF ensuite.

### Section 1 : Executive Summary (3-5 phrases)

**Tone :** Positif, centré sur les wins, factuel.

Formule générale :
```
[Mois] a été un excellent mois pour [Nom]. Vos [N] workflows automatisés ont traité [chiffre] processus avec un taux de succès de [X]%, vous économisant [Y]h de travail manuel (≈ [€]). En parallèle, nous avons résolu [N] incidents mineurs et optimisé [action]. Le mois prochain, nous recommandons [action clé].
```

**À inclure obligatoirement :**
- Un chiffre de "wins" (executions réussies, temps économisé, documents traités)
- Le taux de succès (%)
- Une action positive complétée

### Section 2 : Métriques de Performance

**Format :** Tableau structuré + graphique descriptif (texte, pas image)

#### 2.1 Tableau Synthétique
```
┌─────────────────────────────────┬──────────┬──────────┐
│ Métrique                        │ Ce mois  │ Tendance │
├─────────────────────────────────┼──────────┼──────────┤
│ Workflows actifs                │ [N]      │ [↑/→/↓]  │
│ Exécutions totales              │ [N]      │ [↑/→/↓]  │
│ Taux de succès                  │ [X]%     │ [↑/→/↓]  │
│ Temps économisé (heures)        │ [N]h     │ [↑/→/↓]  │
│ Incidents                       │ [N]      │ [↑/→/↓]  │
│ Valeur économisée               │ [€]      │ [↑/→/↓]  │
└─────────────────────────────────┴──────────┴──────────┘
```

#### 2.2 Détail par Workflow (si >1 workflow actif)

Pour chaque workflow actif, ajouter une ligne :
```
🔄 [Nom Workflow]
   - Exécutions : [N] ✓ ([taux]% succès)
   - Temps économisé : [N]h
   - Incident : [Oui/Non] + description si oui
```

#### 2.3 Interprétation Texte

Expliquer en langage simple ce que les chiffres signifient :
- Si taux succès ≥95% → "Excellent taux de fiabilité"
- Si taux succès 80-94% → "Taux de succès bon, avec opportunités d'amélioration"
- Si taux succès <80% → "Certains incidents ont réduit la performance, voir section 3"

### Section 3 : Incidents & Résolutions

**Format :** Fiche rétrospective des problèmes et solutions apportées

#### 3.1 S'il y a eu 0 incident
```
✅ Aucun incident critique ce mois. Les [N] workflows ont fonctionné en continu sans interruption. 
   Cette stabilité montre que votre infrastructure d'automatisation est solide.
```

#### 3.2 S'il y a eu ≥1 incident
Pour chaque incident, structurer ainsi :

```
🚨 [Date] - [Nom Incident]
   Impact : [Faible/Moyen/Critique]
   Description : [Ce qui s'est passé en langage client]
   Cause : [Explication technique en français simple]
   Solution : [Ce qu'on a fait]
   Temps résolution : [Xh]
   Prévention : [Comment on évite que ça se reproduise]
```

#### 3.3 Bilan Incidents
- Total incidents : [N]
- Critiques : [N]
- Temps total d'intervention : [Xh]
- Temps moyen de résolution : [Xh]

### Section 4 : Recommandations pour le Mois Prochain

**Format :** 3-5 recommandations actionables, hiérarchisées par urgence/impact

#### 4.1 Optimisations Recommandées

```
📌 [PRIORITÉ 1 - À faire ce mois] 
   [Recommandation spécifique]
   Gain attendu : [temps économisé/qualité/fiabilité]
   Effort : [1-2h / 2-4h / 4-8h]

📌 [PRIORITÉ 2 - À explorer]
   ...

📌 [PRIORITÉ 3 - Long terme]
   ...
```

#### 4.2 Règles de Recommandation

- **Si taux succès <90%** → Recommander un audit technique
- **Si valeur économisée est faible** → Recommander d'ajouter 1 workflow supplémentaire
- **Si incidents critiques** → Recommander une formation équipe ou audit sécurité
- **Si plateforme stable** → Recommander l'upsell (voir section 5)

### Section 5 : Opportunités Upsell (Subtil & Non-Invasif)

**Tone :** Consultatif, pas vendeur. Suggérer, ne pas imposer.

#### 5.1 Nouvelle Automation Suggérée

Format :
```
💡 BONUS - Opportunité découverte ce mois

[Titre automation]
[Description 1 phrase du problème identifié]

Bénéfice estimé : [temps économisé/mois ou € d'économies]
Complexité : [Faible/Moyenne/Élevée]
Prix estimé : [€]
ROI : [Rentable en X mois]

Intéressé ? On peut faire un audit détaillé gratuitement.
```

#### 5.2 Règles d'Upsell

- **Upsell SEULEMENT si :**
  - Taux succès ≥90% (client satisfait)
  - Valeur économisée ce mois ≥500€ (client voit le ROI)
  - Incident critiques = 0 (stabilité démontrée)

- **Tone :** "On a remarqué que..." plutôt que "Vous devriez acheter..."

- **Max 1 upsell par rapport.** Ne pas en faire des catalogues commerciaux.

---

## Constraints

### Tone & Language
- **JAMAIS de jargon tech** : n8n, nodes, APIs → expliquer en français simple
- **Centré client, pas centré agence** : c'est SES victoires, pas NOTRE travail
- **Professionnel mais accessible** : pas de docs techniques, un rapport lisible en 5 min
- **Orienté ROI** : chaque métrique doit avoir un "ce qui ça signifie" en euros/heures

### Chiffres & Calculs
- **Temps économisé** = heures_manuelles_evitees (fourni en input)
- **Valeur économisée** = temps_economise × taux_horaire (fourni en input ou estimé)
- **Taux succès** = (executions_reussies / executions_totales) × 100
- **Toujours afficher les hypothèses** : "Sur base d'un taux horaire estimé à €/h"

### Longueur & Format
- **Rapport total** : 2-3 pages A4 (au format PDF après)
- **Executive Summary** : 3-5 phrases max
- **Chaque section** : 1 page max sauf Metrics (peut être 1.5)
- **Aucun bloc de texte >500 mots** : utiliser tableaux et listes plutôt que prose

### Validation Rules
Avant de générer le rapport final, vérifier :
- [ ] Toutes les métriques clés sont présentes (workflows, exécutions, succès, temps)
- [ ] Les calculs sont transparents (pas de chiffres sortis de nulle part)
- [ ] Tone cohérent partout (pas mélange pro/casual)
- [ ] Pas d'upsell agressif (max 1, et seulement si conditions réunies)
- [ ] Dates cohérentes (période du rapport = input dates)
- [ ] Contact principal bien nommé et email correct

---

## Examples

### Exemple 1 : Petit client, 1 workflow, pas incident

**Input :**
```json
{
  "client": {
    "nom": "Cabinet Dubois",
    "secteur": "Comptabilité",
    "contact_principal": "Marie Dubois",
    "email": "marie@cabinetdubois.fr"
  },
  "periode": {
    "mois": "Décembre 2024",
    "date_debut": "2024-12-01",
    "date_fin": "2024-12-31"
  },
  "workflows_data": {
    "total_workflows_actifs": 1,
    "executions_totales": 156,
    "executions_reussies": 148,
    "executions_echouees": 8,
    "taux_succes_pct": 94.9
  },
  "impact_metrics": {
    "temps_economise_heures": 18,
    "nombre_processus_automatises": 1,
    "documents_traites": 156,
    "leads_qualifies": 0
  },
  "costs_avoided": {
    "heures_manuelles_evitees": 18,
    "taux_horaire_client": 75,
    "valeur_economisee_euros": 1350
  },
  "incidents": {
    "total": 0,
    "critiques": 0,
    "resolutions": []
  },
  "notes_client": "Très satisfait. Workflow stable.",
  "prochaines_optimisations": [
    "Ajouter un 2ème workflow pour les relances clients"
  ]
}
```

**Output attendu :** Rapport de 2-2.5 pages avec sections bien remplies, upsell suggestif sur le workflow relances clients.

### Exemple 2 : Client moyen, 3 workflows, 1 incident mineur

**Input :**
```json
{
  "client": {
    "nom": "Agence Immo Provence",
    "secteur": "Immobilier",
    "contact_principal": "Jean Moreau",
    "email": "jean@immo-provence.fr"
  },
  "periode": {
    "mois": "Décembre 2024",
    "date_debut": "2024-12-01",
    "date_fin": "2024-12-31"
  },
  "workflows_data": {
    "total_workflows_actifs": 3,
    "executions_totales": 542,
    "executions_reussies": 512,
    "executions_echouees": 30,
    "taux_succes_pct": 94.5
  },
  "impact_metrics": {
    "temps_economise_heures": 42,
    "nombre_processus_automatises": 3,
    "documents_traites": 487,
    "leads_qualifies": 156
  },
  "costs_avoided": {
    "heures_manuelles_evitees": 42,
    "taux_horaire_client": 85,
    "valeur_economisee_euros": 3570
  },
  "incidents": {
    "total": 1,
    "critiques": 0,
    "resolutions": [
      {
        "date": "2024-12-15",
        "description": "Erreur de mapping données CRM - emails mal liés",
        "temps_resolution_h": 2,
        "impact": "moyen"
      }
    ]
  },
  "notes_client": "Impressionné par les gains. Veut explorer lead scoring IA.",
  "prochaines_optimisations": [
    "Implémenter lead scoring avec IA",
    "Optimiser le workflow #2 (taux succès 88%)",
    "Ajouter notification Slack pour alertes"
  ]
}
```

**Output attendu :** Rapport de 3 pages, highlighting triple value (42h + 3570€ + 156 leads qualifiés), détail incident moyen, 2-3 recommandations avec lead scoring comme upsell principal.

---

## Integration Notes

### Workflow n8n attendu

```
[Database/API Kames] 
  ↓ Récupère données client du mois (exécutions, incidents, time tracking)
  ↓
[Node HTTP Request]
  ↓ Envoie JSON à Claude avec ce skill activé
  ↓
[Claude génère Markdown rapport]
  ↓
[Node Skill "HTML to PDF"]
  ↓ Convertit Markdown → PDF professionnel
  ↓
[Node Send Email]
  ↓ Envoie par mail au client avec attachement PDF
  ↓
[Database Kames]
  ↓ Log du rapport généré + date envoi
```

### Fréquence
- **Automatisé** : 1er jour du mois à 8h (avant que le client se connecte)
- **Manuel** : Générable à la demande dans Claude (test, réévaluation)

---

## Success Criteria

Le rapport est bon si :
- ✅ Client comprend la valeur apportée en <5 minutes
- ✅ Tous les chiffres sont expliqués et justifiés
- ✅ Tone professionnel mais human (pas roboto)
- ✅ Upsell (s'il y a) est pertinent et subtil
- ✅ Pas d'erreurs chiffres (calculs vérifiés)
- ✅ PDF généré est lisible et bien formaté

---

## Version History

**v1.0** - 24/12/2024 - Version initiale créée pour Kames AI
