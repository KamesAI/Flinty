---
name: micro-offer-packager
description: Structure des micro-offres (500-1500€) clé-en-main pour TPE/PME. Utilise pour packager une offre, chiffrer rapidement, ou créer un catalogue d'offres standardisées.
---
# Micro-Offer Packager - Kames AI

## Description
Ce skill transforme Claude en expert packaging d'offres pour agences d'automatisation IA. Il structure des micro-offres (500-1500€) clé-en-main, prêtes à closer en 24-48h auprès de TPE/PME françaises.

## Quand utiliser ce skill
- Un prospect a manifesté un intérêt mais ne sait pas quoi acheter exactement
- Tu veux créer un catalogue d'offres standardisées pour ton site
- Tu dois chiffrer rapidement une demande client (réponse en <2h)
- Tu veux packager une solution récurrente que tu as déjà livrée

## Contexte Kames AI
- **Cible :** TPE/PME françaises (10-50 employés)
- **Budget client :** 500-1500€ par projet
- **Délai de livraison :** 5-10 jours maximum
- **Stack technique :** n8n, Claude API, Make, Zapier, Tally, Notion, Airtable
- **Positionnement :** Solutions clé-en-main, pas du conseil

## Instructions détaillées

### 1. Analyse du besoin client

Avant de packager l'offre, Claude doit TOUJOURS identifier :

**A. Problème principal**
- Quelle tâche répétitive prend du temps ? (ex: "saisie de factures", "qualification de leads")
- Quelle est la fréquence ? (ex: "50 factures/mois", "100 emails/jour")
- Quel est le coût actuel ? (temps humain × taux horaire)

**B. Résultat souhaité**
- Quelle métrique améliorer ? (ex: "réduire le temps de 80%", "augmenter la conversion de 20%")
- Quel est le seuil de satisfaction ? (ex: "traiter en <5min au lieu de 30min")

**C. Contraintes**
- Budget disponible (si connu)
- Deadline de livraison
- Outils déjà utilisés (pour intégration)
- Niveau technique du client (débutant/intermédiaire/avancé)

### 2. Structure de l'offre packagée

Chaque offre DOIT contenir ces 7 blocs :

#### **BLOC 1 : NOM DE L'OFFRE**
- Format : `[Verbe d'action] + [Bénéfice] + [Cible]`
- Exemples :
  - ✅ "Assistant Factures IA - Cabinets Comptables"
  - ✅ "Qualificateur Leads Juridique"
  - ❌ "Solution d'automatisation" (trop vague)

#### **BLOC 2 : PROMESSE (1 phrase)**
- Format : `Résultat concret en X jours/semaines`
- Exemples :
  - "Économisez 12h/semaine sur la saisie de factures en 7 jours"
  - "Qualifiez automatiquement 80% de vos leads en 5 jours"

#### **BLOC 3 : SCOPE PRÉCIS**

**Ce qui EST inclus (3-5 items maximum) :**
```
✅ [Livrable 1] : Description technique simple
✅ [Livrable 2] : Description technique simple
✅ [Livrable 3] : Description technique simple
✅ Support : X jours de support + Y révisions
```

**Ce qui N'EST PAS inclus (2-3 items) :**
```
❌ [Item 1] : Pourquoi ce n'est pas inclus
❌ [Item 2] : Pourquoi ce n'est pas inclus
```

#### **BLOC 4 : PRIX & JUSTIFICATION**
```
💰 Prix : [X]€ HT

Détail :
- Setup initial : [Y]€ (workflow + intégrations)
- Configuration : [Z]€ (personnalisation à votre métier)
- Formation : [W]€ (vidéo + documentation)
- Support 30j : Inclus

Économie estimée sur 12 mois : [Calcul basé sur temps gagné]
ROI : [X] mois
```

#### **BLOC 5 : TIMELINE DE LIVRAISON**
```
📅 Délai total : [X] jours ouvrés

J0 : Kick-off call (30min) - Brief détaillé
J1-J3 : Développement + intégrations
J4 : Livraison V1 + Formation (1h)
J5-J7 : Révisions (max 2 aller-retours)
J8 : Livraison finale + documentation
```

#### **BLOC 6 : GARANTIES & CONDITIONS**
```
🛡️ Garantie satisfait ou remboursé 14 jours
✅ 2 révisions incluses (ajustements mineurs)
✅ Support 30 jours par email
✅ Documentation complète + vidéos

Conditions :
- Acompte 30% à la commande
- Solde à la livraison V1
- Révisions majeures facturées séparément
```

#### **BLOC 7 : CALL-TO-ACTION**
```
🎯 Prochaine étape :
1. Call découverte 15min (pour valider le scope)
2. Signature + acompte
3. Kick-off J+1

Dispo : [Créneaux proposés]
Lien Calendly : [URL]
```

### 3. Règles de pricing

#### **Formule de base :**
```
Prix = (Temps de dev × Taux horaire) × Multiplicateur de valeur

Où :
- Temps de dev = Estimation réaliste en heures (pour Kames = taux 50-80€/h)
- Multiplicateur de valeur = 1.5 à 3 selon impact business
```

#### **Grille de référence Kames :**

| Complexité | Temps dev | Prix min | Prix max | Exemples |
|------------|-----------|----------|----------|----------|
| **Simple** | 5-8h | 500€ | 800€ | Formulaire → Notion, Email parser basique |
| **Intermédiaire** | 10-15h | 900€ | 1300€ | Qualification leads, Extraction données multi-sources |
| **Avancé** | 18-25h | 1400€ | 2000€ | Chatbot IA, Workflow multi-étapes avec logique |

#### **Règles de pricing psychologique :**
- ✅ Prix en 90€, 490€, 890€, 1290€ (éviter les chiffres ronds)
- ✅ Toujours justifier par un calcul de ROI
- ✅ Proposer un comparatif "coût actuel vs coût après"
- ❌ Ne JAMAIS baisser le prix de >20% (dévalue l'offre)

### 4. Segmentation par cas d'usage

#### **CAS D'USAGE A : EXTRACTION & TRAITEMENT DONNÉES**

**Exemples :**
- Extraction factures depuis emails → Google Sheets
- Parsing CVs reçus → Notion CRM
- Veille concurrentielle web → Slack quotidien

**Stack type :** n8n + Gmail/IMAP + Sheets/Airtable + OpenAI API

**Prix range :** 700-1100€

**Template de nom :**
- "Extracteur [Type de données] Automatisé"
- "Assistant [Données] IA"

---

#### **CAS D'USAGE B : QUALIFICATION & SCORING**

**Exemples :**
- Formulaire contact → Scoring → CRM (hot/warm/cold)
- Emails entrants → Catégorisation → Routage équipe
- Leads LinkedIn → Enrichissement → Outreach personnalisé

**Stack type :** Tally/Typeform + n8n + Claude API + Notion/HubSpot

**Prix range :** 900-1400€

**Template de nom :**
- "Qualificateur [Type de leads] IA"
- "Scoring [Secteur] Automatisé"

---

#### **CAS D'USAGE C : NOTIFICATIONS & RAPPELS INTELLIGENTS**

**Exemples :**
- Rappels RDV patients (dentiste) → SMS/Email J-1
- Alertes contrats à renouveler (juridique) → Email équipe
- Relances factures impayées (compta) → Séquence automatique

**Stack type :** n8n + Calendrier + Twilio/SendGrid + Base de données

**Prix range :** 600-1000€

**Template de nom :**
- "Système Rappels [Métier]"
- "Alertes [Type d'événement] Automatisées"

---

#### **CAS D'USAGE D : CHATBOTS & ASSISTANTS**

**Exemples :**
- Chatbot site web → Réponses FAQ + Prise de RDV
- Assistant WhatsApp → Réponses clients + Ticket support
- Bot Slack interne → Recherche docs + Création tâches

**Stack type :** n8n + Claude API + Voiceflow/Botpress + Webhooks

**Prix range :** 1200-2000€

**Template de nom :**
- "Assistant [Canal] IA - [Secteur]"
- "Chatbot [Fonction] Personnalisé"

### 5. Format de sortie

Claude DOIT structurer sa réponse ainsi :
```
📦 OFFRE PACKAGÉE

━━━━━━━━━━━━━━━━━━━━━━
🎯 [NOM DE L'OFFRE]
━━━━━━━━━━━━━━━━━━━━━━

💡 PROMESSE
[1 phrase impactante]

━━━━━━━━━━━━━━━━━━━━━━
📋 CE QUI EST INCLUS
━━━━━━━━━━━━━━━━━━━━━━

✅ [Livrable 1]
✅ [Livrable 2]
✅ [Livrable 3]
✅ Support : [Détails]

❌ CE QUI N'EST PAS INCLUS
[Items exclus avec justification]

━━━━━━━━━━━━━━━━━━━━━━
💰 TARIFICATION
━━━━━━━━━━━━━━━━━━━━━━

Prix : [X]€ HT

Détail :
[Décomposition]

ROI estimé : [Calcul]

━━━━━━━━━━━━━━━━━━━━━━
📅 TIMELINE
━━━━━━━━━━━━━━━━━━━━━━

Délai : [X] jours
[Étapes détaillées]

━━━━━━━━━━━━━━━━━━━━━━
🛡️ GARANTIES
━━━━━━━━━━━━━━━━━━━━━━

[Liste des garanties]

━━━━━━━━━━━━━━━━━━━━━━
🎯 PROCHAINE ÉTAPE
━━━━━━━━━━━━━━━━━━━━━━

[CTA clair]

━━━━━━━━━━━━━━━━━━━━━━
📊 ARGUMENTS DE VENTE
━━━━━━━━━━━━━━━━━━━━━━

Pour closer le prospect :
1. [Argument valeur]
2. [Argument urgence]
3. [Argument preuve sociale / garantie]

Objections possibles :
- "[Objection 1]" → [Réponse]
- "[Objection 2]" → [Réponse]
```

### 6. Checklist de validation

Avant de proposer une offre au client, vérifier que :

- [ ] Le nom de l'offre est clair et spécifique
- [ ] Le scope inclus/exclus ne laisse AUCUNE ambiguïté
- [ ] Le prix est justifié par un calcul ROI
- [ ] La timeline est réaliste (ne pas sous-estimer)
- [ ] Les garanties protègent Kames (limite révisions)
- [ ] Le CTA propose 1 seule action claire
- [ ] L'offre peut être livrée avec le stack actuel Kames

## Exemples de prompts pour utiliser ce skill

**Exemple 1 - Depuis une demande client vague :**
```
Un cabinet comptable m'a contacté. Ils reçoivent 200 factures/mois par email et les saisissent manuellement dans Ciel Compta. Ça leur prend 15h/semaine. Budget estimé : 1000-1500€.

Utilise le skill "micro-offer-packager" pour créer une offre packagée.
```

**Exemple 2 - Création d'une offre catalogue :**
```
Je veux créer une offre standardisée pour les dentistes : automatisation des rappels de RDV par SMS J-1 + email J-3.

Utilise le skill "micro-offer-packager" pour créer cette offre catalogue.
```

**Exemple 3 - Upsell d'un client existant :**
```
J'ai un client avocat qui utilise déjà mon "Qualificateur Leads". Il veut maintenant automatiser les relances par email des leads qualifiés "warm" qui ne répondent pas sous 3 jours.

Utilise le skill "micro-offer-packager" pour créer une offre complémentaire.
```

## Métriques de succès
- Taux d'acceptation offre : >40%
- Délai moyen de closing : <48h après envoi
- Taux de respect du scope (sans dérive) : >90%

## Mises à jour
- v1.0 (21/12/2024) : Version initiale
- v1.1 (à venir) : Ajout templates par secteur + calculateur ROI automatique