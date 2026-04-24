---
name: pricing-calculator-micro-offres
description: Chiffre instantanément une micro-automation (500-1500€) en fonction de la complexité réelle pour les TPE/PME françaises. Génère un devis professionnel avec détail du prix, ROI estimé et suggestions d'upsells.
---

# Skill: pricing-calculator-micro-offres

## Purpose
Chiffrer instantanément une micro-automation (500-1500€) en fonction de la complexité réelle, du temps de développement estimé, et du ROI généré pour le client. Génère un chiffrage professionnel avec détail des coûts, timeline, et calcul du retour sur investissement.

## Context
Destiné aux agences d'automatisation ciblant les TPE/PME françaises/européennes. Adapté aux workflows n8n, Make, Zapier avec intégrations API classiques (Gmail, Sheets, CRM, etc.). Privilégie la transparence du pricing et la justification par la valeur économisée.

## Input Format
```yaml
demande: string                    # Description du besoin client
outils_impliques: list             # Liste des outils/API à connecter
volumetrie_mensuelle: number       # Volume de données/opérations par mois
niveau_urgence: enum               # "standard" (>7 jours) / "rapide" (<7 jours) / "urgent" (<48h)
besoin_formation: boolean          # Client souhaite être formé ?
besoin_documentation: boolean      # Documentation technique requise ?
maintenance_souhaitee: boolean     # Maintenance mensuelle souhaitée ?
```

## Pricing Matrix

### Base Prices (Développement)
- **Setup initial** : 200€ (connexions API + authentifications + tests)
- **Workflow simple** (≤3 nodes) : 300€
- **Workflow standard** (4-6 nodes) : 500€
- **Workflow complexe** (7-10 nodes) : 800€
- **Workflow très complexe** (11+ nodes) : 1200€+

### Add-ons
- **Formation client** (1h) : 150€
- **Documentation technique** : 100€
- **Maintenance mensuelle** : 15% du prix total HT
- **Template email/notification custom** : 75€/template
- **Dashboard de suivi** (Google Sheets/Airtable) : 400€
- **Révisions illimitées** (scope fixe) : +200€

### Multipliers
- **Urgence rapide** (<7 jours) : x1.3
- **Urgence critique** (<48h) : x1.5
- **Données sensibles** (RGPD strict, santé, finance) : +150€
- **Intégration API non-standard** (documentation complexe) : +200€/API

### Règles de pricing psychologique
- Toujours terminer par 0 ou 90 (ex: 790€, 1190€, 1490€)
- Jamais de chiffres ronds (éviter 800€, 1000€, 1500€)
- Proposer une fourchette basse-haute (+/- 15%)
- Toujours justifier par un calcul ROI client

## Output Structure
```markdown
# 💰 CHIFFRAGE EXPRESS - [NOM AUTOMATION]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 📊 ANALYSE COMPLEXITÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Score :** X/5 (Simple/Standard/Complexe/Très complexe)

**Explication :**
[Justification du score basée sur : nombre d'outils, volumétrie, logique conditionnelle, besoins spécifiques]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 💶 DÉTAIL PRIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Core Automation
- Setup initial (connexions API + auth) : XXX€
- Développement workflow : XXX€
- Tests & validation : XXX€

### Options Recommandées
- Formation client (1h) : 150€
- Documentation technique : 100€
[Autres options si pertinentes]

**TOTAL HT :** XXX-XXX€ (fourchette basse-haute)
**TOTAL TTC (20%)** : XXX-XXX€

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ⏱️ TIMING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- **Kick-off :** J
- **Livraison v1 :** J+X (première version fonctionnelle)
- **Révisions :** J+X à J+X (2 itérations incluses)
- **Finalisation :** J+X (mise en production)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 📈 ROI ESTIMÉ CLIENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Temps économisé :** Xh/semaine → Xh/mois → Xh/an
**Taux horaire estimé :** XX€/h
**Valeur économisée annuelle :** X XXX€

**Retour sur investissement : X mois**

💡 *En clair : L'automation sera rentabilisée en X mois, puis génèrera X XXX€ d'économie pure chaque année.*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🚀 UPSELLS SUGGÉRÉS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1-2 automatisations complémentaires logiques basées sur le workflow principal]

**Exemple :**
1. [Nom automation complémentaire] - [Prix]€ - [Bénéfice client]
2. [Nom automation complémentaire] - [Prix]€ - [Bénéfice client]

💼 **Pack 2 automations :** [Prix total - 10%] = [Prix final]€ (économie XX€)
```

## Best Practices

### Règles d'estimation
1. **Toujours demander la volumétrie exacte** : 10 factures/mois ≠ 500 factures/mois (impact sur architecture)
2. **Identifier les edge cases** : Que se passe-t-il si l'API est down ? Si le format de données change ?
3. **Prévoir les révisions** : 2 itérations incluses dans le prix de base
4. **Limiter le scope** : Si >15 nodes, suggérer de découper en 2 automations

### Calcul ROI Client
```
Temps économisé/mois = [Heures actuelles] - [Heures après automation]
Valeur économisée/an = Temps économisé/mois × 12 × Taux horaire

ROI (en mois) = Prix automation TTC / (Valeur économisée/an ÷ 12)
```

**Exemple :**
- Temps actuel : 10h/mois
- Temps après automation : 1h/mois
- Gain : 9h/mois
- Taux horaire : 30€/h
- Valeur économisée/an : 9h × 12 × 30€ = 3240€
- Prix automation : 990€ TTC
- ROI : 990 ÷ (3240 ÷ 12) = **3,7 mois**

### Communication du prix au client
1. **Toujours commencer par le ROI** (valeur économisée), jamais par le prix
2. **Utiliser la fourchette** : "Entre 890€ et 1090€ selon options"
3. **Justifier chaque ligne** : Transparence totale sur le détail
4. **Proposer un upsell subtil** : Pack 2 automations avec remise

### Red Flags (Refuser/Renégocier)
- Client demande "juste un devis rapide" sans call découverte → Risque de scope flou
- Budget annoncé <500€ pour workflow complexe → Recadrer ou refuser
- "On verra pour la formation plus tard" → Inclure obligatoirement (évite le support infini)
- Deadline irréaliste (<48h sauf urgence justifiée) → Multiplier par 1.5 minimum

## Examples

### Example 1 : Extraction factures comptable
**Input :**
```yaml
demande: "Automatiser extraction factures depuis emails vers Ciel Compta"
outils_impliques: ["Gmail", "Google Sheets", "OCR (gratuit)"]
volumetrie_mensuelle: 150
niveau_urgence: "standard"
besoin_formation: true
besoin_documentation: true
maintenance_souhaitee: false
```

**Output :**
```markdown
# 💰 CHIFFRAGE EXPRESS - EXTRACTEUR FACTURES IA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 📊 ANALYSE COMPLEXITÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Score :** 3/5 (Standard)

**Explication :**
Workflow de 6 nodes incluant détection email, extraction données PDF via OCR, parsing structuré, et export Google Sheets. Volumétrie moyenne (150/mois = ~7/jour). Pas d'API complexe mais nécessite gestion des formats PDF variables.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 💶 DÉTAIL PRIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Core Automation
- Setup initial (Gmail API + Sheets) : 200€
- Développement workflow (6 nodes) : 500€
- Configuration OCR + parsing : 150€
- Tests & validation : 140€

### Options Recommandées
- Formation client (1h) : 150€
- Documentation technique : 100€

**TOTAL HT :** 1090-1190€
**TOTAL TTC (20%)** : 1308-1428€

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ⏱️ TIMING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- **Kick-off :** J
- **Livraison v1 :** J+5 (première version fonctionnelle)
- **Révisions :** J+6 à J+8 (2 itérations incluses)
- **Finalisation :** J+10 (mise en production)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 📈 ROI ESTIMÉ CLIENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Temps économisé :** 10h/semaine → 40h/mois → 480h/an
**Taux horaire estimé :** 30€/h
**Valeur économisée annuelle :** 14 400€

**Retour sur investissement : 1 mois**

💡 *En clair : L'automation sera rentabilisée en 1 mois, puis génèrera 14 400€ d'économie pure chaque année.*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🚀 UPSELLS SUGGÉRÉS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **Relances factures impayées automatiques** - 490€ - Envoi email J+30 si facture non réglée
2. **Dashboard comptable temps réel** - 590€ - Visualisation KPI (CA, impayés, top clients)

💼 **Pack 2 automations :** 1680€ - 10% = **1490€** (économie 190€)
```

### Example 2 : Rappels RDV dentiste
**Input :**
```yaml
demande: "Rappels RDV automatiques par SMS et email pour réduire no-shows"
outils_impliques: ["Google Calendar", "Twilio SMS", "Gmail"]
volumetrie_mensuelle: 200
niveau_urgence: "rapide"
besoin_formation: false
besoin_documentation: false
maintenance_souhaitee: true
```

**Output :**
```markdown
# 💰 CHIFFRAGE EXPRESS - SYSTÈME RAPPELS RDV PRO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 📊 ANALYSE COMPLEXITÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Score :** 2/5 (Simple-Standard)

**Explication :**
Workflow de 5 nodes avec détection RDV dans Google Calendar, envoi email J-3 et SMS J-1. Logique conditionnelle simple (vérifier présence numéro mobile). Volumétrie moyenne (200 RDV/mois = ~10/jour). Urgence rapide appliquée (livraison <7 jours).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 💶 DÉTAIL PRIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Core Automation
- Setup initial (Calendar + Twilio + Gmail) : 200€
- Développement workflow (5 nodes) : 400€
- Templates email + SMS personnalisés : 150€
- Tests & validation : 140€

**Sous-total :** 890€
**Multiplicateur urgence rapide :** x1.3 = **1157€**

### Options Recommandées
- Maintenance mensuelle (15% du HT) : 174€/mois

**TOTAL HT :** 1090-1190€ (selon templates)
**TOTAL TTC (20%)** : 1308-1428€

**Maintenance :** 174€ HT/mois (209€ TTC)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ⏱️ TIMING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- **Kick-off :** J
- **Livraison v1 :** J+4 (urgence appliquée)
- **Révisions :** J+5 à J+6 (1 itération incluse)
- **Finalisation :** J+7 (mise en production)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 📈 ROI ESTIMÉ CLIENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Taux no-show actuel :** 30% (60 RDV/mois perdus)
**Taux no-show après automation :** 10% (20 RDV/mois perdus)
**Gain :** 40 RDV/mois récupérés

**Valeur RDV moyen :** 80€
**Gain mensuel :** 40 × 80€ = 3200€
**Gain annuel :** 38 400€

**Retour sur investissement : 0,4 mois (~12 jours)**

💡 *En clair : L'automation sera rentabilisée en moins de 2 semaines, puis génèrera 38 400€ de CA supplémentaire chaque année.*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🚀 UPSELLS SUGGÉRÉS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **Feedback post-RDV automatique** - 390€ - Email J+1 avec questionnaire satisfaction (5★)
2. **Suivi patients inactifs** - 590€ - Relance automatique si >6 mois sans RDV

💼 **Pack 3 automations :** 2070€ - 15% = **1760€** (économie 310€)
```

## Constraints
- Prix minimum : 500€ HT (seuil de rentabilité agence)
- Prix maximum micro-offre : 2000€ HT (au-delà = projet sur-mesure)
- Délai minimum : 3 jours ouvrés (qualité > vitesse)
- Maximum 2 révisions incluses (scope creep)
- Jamais de pricing au forfait si scope flou (demander call découverte obligatoire)

## Métriques de Succès
- Taux d'acceptation devis : >40%
- Délai moyen closing : <48h après envoi chiffrage
- Taux de respect du scope : >85% (sans dérive budget/temps)
- Taux de satisfaction client (formation incluse) : >90%
- Taux d'upsell (vente automation complémentaire) : >25%

## Notes d'Utilisation
1. **Toujours faire un call découverte de 15-20min** avant de chiffrer (valider scope, volumétrie, budget)
2. **Envoyer le chiffrage dans les 2h après le call** (pendant que c'est chaud)
3. **Relancer à J+2 si pas de réponse** (Email : "Avez-vous eu le temps de consulter le chiffrage ?")
4. **Proposer un call de 15min pour clarifier** si questions sur le prix
5. **Ne jamais baisser le prix de >15%** (dévalue l'expertise, crée un précédent)

## Mises à Jour
- **v1.0** (24/12/2024) : Version initiale avec pricing matrix + 2 exemples détaillés
- **v1.1** (à venir) : Ajout templates par secteur (compta, juridique, santé, e-commerce)
- **v1.2** (à venir) : Calculateur ROI automatique intégré + dashboard Google Sheets