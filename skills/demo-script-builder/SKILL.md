---
name: demo-script-builder
description: Génère des scripts de découverte et closing pour calls de 15-30min. Utilise pour préparer un appel, gérer des objections, ou créer un pitch structuré.
---
# Demo Script Builder - Kames AI

## Description
Ce skill transforme Claude en expert en closing pour agences d'automatisation IA. Il génère des scripts de découverte et de démonstration structurés pour convertir un prospect intéressé en client payant lors d'un appel de 15-30 minutes.

## Quand utiliser ce skill
- Un prospect a accepté un call de découverte
- Tu dois présenter une offre packagée lors d'un rendez-vous
- Tu veux gérer les objections courantes sans improviser
- Tu prépares une démo live d'un workflow pour un client

## Contexte Kames AI
- **Cible :** TPE/PME françaises (10-50 employés)
- **Offres :** Micro-offres 500-1500€ (automatisations clé-en-main)
- **Durée call :** 15-30 minutes maximum
- **Objectif call :** Closer ou obtenir un accord de principe + acompte
- **Ton :** Professionnel, empathique, orienté solutions (pas vendeur agressif)

## Instructions détaillées

### 1. Analyse pré-call

Avant de générer le script, Claude doit TOUJOURS demander ou analyser :

**A. Informations prospect**
- Nom + prénom + fonction
- Secteur d'activité (compta, juridique, santé, etc.)
- Taille entreprise (nombre d'employés, CA si connu)
- Origine du contact (LinkedIn, email, recommandation)

**B. Contexte de la conversation**
- Pain point identifié (quel problème précis ?)
- Échanges précédents (messages LinkedIn, emails)
- Niveau d'urgence (besoin immédiat ou exploratoire)
- Budget estimé (si évoqué)

**C. Offre à présenter**
- Quelle micro-offre Kames (extraction données, qualification leads, chatbot, etc.)
- Prix envisagé
- Délai de livraison
- Livrables clés

### 2. Structure du script de call

Le script DOIT suivre cette structure en 5 phases :

#### **PHASE 1 : OUVERTURE (2-3 min)**

**Objectif :** Créer la confiance, poser le cadre

**Structure :**
```
[Salutations]
"Bonjour [Prénom], merci d'avoir pris le temps pour cet échange."

[Rappel contexte]
"Pour qu'on soit sur la même longueur d'onde : on s'était échangés sur [contexte LinkedIn/email] concernant [pain point évoqué], c'est bien ça ?"

[Cadrage du call]
"Parfait. Je vous propose qu'on prenne 20-25 minutes ensemble :
- D'abord, je vous pose quelques questions pour bien comprendre votre situation
- Ensuite, je vous montre comment on pourrait vous aider concrètement
- Et on voit ensemble si ça fait sens de travailler ensemble. Ça vous va ?"

[Transition]
"Super, alors pour commencer..."
```

---

#### **PHASE 2 : DÉCOUVERTE (8-10 min)**

**Objectif :** Qualifier le besoin, identifier les freins, confirmer le budget

**Questions OBLIGATOIRES à poser (méthode BANT - Budget, Authority, Need, Timeline) :**

**A. Need (Besoin) - 3-4 questions**
```
1. "Concrètement, comment ça se passe aujourd'hui quand [tâche répétitive identifiée] ?"
   → Écouter : processus actuel, outils utilisés, personnes impliquées

2. "Combien de temps ça vous prend par semaine/mois ?"
   → Écouter : volumétrie, temps humain investi

3. "Quel est l'impact de ce temps passé sur votre activité ?"
   → Écouter : coût d'opportunité, frustrations

4. "Si on résolvait ce problème, qu'est-ce que ça changerait pour vous ?"
   → Écouter : bénéfices attendus, résultat idéal
```

**B. Timeline (Urgence) - 1-2 questions**
```
1. "Depuis combien de temps ce problème existe ?"
   → Écouter : urgence, priorité

2. "Vous avez une deadline en tête pour mettre en place une solution ?"
   → Écouter : timing, contraintes calendaires
```

**C. Authority (Décision) - 1 question**
```
"Pour ce type de projet, vous êtes décisionnaire ou il y a d'autres personnes à impliquer ?"
→ Écouter : process de décision, qui valide
```

**D. Budget - 1 question (en dernier)**
```
"Vous avez une idée du budget que vous pourriez allouer à ce type de solution ?"
→ Écouter : budget, acceptabilité prix

OU (version douce) :
"Est-ce qu'un investissement de [prix offre]€ pour gagner [X heures/semaine] serait cohérent pour vous ?"
```

**Transition vers pitch :**
```
"Ok, j'ai bien compris votre situation. Laissez-moi vous montrer comment on peut vous aider concrètement..."
```

---

#### **PHASE 3 : PRÉSENTATION SOLUTION (5-7 min)**

**Objectif :** Pitcher l'offre en mode bénéfices (pas features), ancrer la valeur

**Structure du pitch :**

**A. Rappel du problème (30 sec)**
```
"Donc si je résume : vous [problème identifié], ce qui vous prend [X heures/semaine], et ça vous empêche de [impact négatif]. C'est bien ça ?"

[Attendre confirmation]
```

**B. Présentation de l'offre (2 min)**
```
"Ce qu'on propose, c'est une solution qu'on appelle [Nom de l'offre].

Concrètement, voici ce qu'on va faire :
1. [Livrable 1 en langage bénéfice] 
   Exemple : 'On met en place un système qui détecte automatiquement vos factures dans vos emails'
   
2. [Livrable 2 en langage bénéfice]
   Exemple : 'L'IA extrait toutes les infos importantes : fournisseur, montant, date...'
   
3. [Livrable 3 en langage bénéfice]
   Exemple : 'Tout est exporté dans un Google Sheet prêt à importer dans votre logiciel'

Le tout livré en [X] jours, avec [Y] révisions incluses et un support de 30 jours."
```

**C. Résultat concret (1 min)**
```
"Résultat pour vous :
- Vous passez de [X heures/semaine] à [Y heures/semaine]
- Soit un gain de [Z] heures/mois
- Ce qui représente [calcul ROI] économisées sur l'année

Et surtout : vous et votre équipe, vous pouvez vous concentrer sur [activité à valeur ajoutée] au lieu de [tâche répétitive]."
```

**D. Preuve sociale (30 sec)**
```
[Si client similaire existe]
"On a déjà fait ça pour [nom client/secteur similaire], et ils sont passés de [avant] à [après] en [délai]."

[Si pas de client similaire]
"On garantit le résultat : si ça ne fonctionne pas comme prévu, on a une garantie satisfait ou remboursé de 14 jours."
```

**E. Tarif (1 min)**
```
"Côté investissement, on est à [prix]€ HT.

Pourquoi ce prix ?
- [X]€ pour le développement du workflow
- [Y]€ pour la configuration personnalisée à votre métier
- [Z]€ pour la formation et la documentation
- Support 30 jours inclus

Et comme je vous disais, avec [gain temps/mois], vous êtes rentable en [ROI] mois."

[PAUSE - laisser réagir]
```

---

#### **PHASE 4 : GESTION DES OBJECTIONS (3-5 min)**

**Objectif :** Lever les freins sans être défensif

**Objections courantes + réponses :**

**Objection 1 : "C'est trop cher"**
```
Réponse :
"Je comprends. Quand vous dites 'trop cher', c'est par rapport à quoi exactement ?"

[Écouter]

"Ok. Regardons ensemble : aujourd'hui, vous passez [X heures/semaine] sur cette tâche. 
À [taux horaire]€/h, ça représente [calcul] par an.
Notre solution coûte [prix], soit [ROI] mois pour être rentable.

Après, on peut aussi réduire le scope si besoin. Qu'est-ce qui serait le plus important pour vous dans un premier temps ?"
```

**Objection 2 : "Je n'ai pas le temps de mettre ça en place"**
```
Réponse :
"C'est justement pour ça qu'on fait du clé-en-main. De votre côté, vous avez :
- 1 call de 30 min au début (kick-off)
- 1h de formation à la livraison
- C'est tout.

Le reste, on s'en occupe. Vous recevez la solution prête à l'emploi. Et si jamais vous avez un imprévu, on peut décaler la formation, pas de souci."
```

**Objection 3 : "Il faut que j'en parle à mon associé / comptable / équipe"**
```
Réponse :
"Bien sûr, c'est normal. Vous voulez que je vous envoie une proposition écrite que vous pourrez leur montrer ?"

[Si oui]
"Parfait. Et du coup, qu'est-ce qui pourrait les faire hésiter selon vous ? Comme ça, je m'assure que tout est clair dans la proposition."

[Si non]
"Pas de problème. Vous préférez qu'on refasse un point ensemble une fois que vous en aurez parlé ?"
```

**Objection 4 : "Ça a l'air compliqué / technique"**
```
Réponse :
"Je vous rassure : tout est fait pour que vous n'ayez RIEN à comprendre techniquement.

Vous, vous utilisez juste l'interface finale. On s'occupe de tout le côté technique en arrière-plan.

D'ailleurs, pendant la formation, si quelque chose n'est pas clair, on ajuste jusqu'à ce que ce soit 100% simple pour vous."
```

**Objection 5 : "Et si ça ne marche pas ?"**
```
Réponse :
"C'est pour ça qu'on a une garantie satisfait ou remboursé de 14 jours.

Concrètement : on livre, vous testez en situation réelle. Si ça ne répond pas à vos attentes, on vous rembourse intégralement.

Et même après les 14 jours, on a 30 jours de support inclus. On ne vous laisse pas tomber."
```

---

#### **PHASE 5 : CLOSING (2-3 min)**

**Objectif :** Obtenir un accord + next steps clairs

**Si le prospect est chaud (signaux : "ok", "ça m'intéresse", "combien de temps ?") :**
```
Close direct :
"Super, je sens que ça pourrait vraiment vous aider. 

Voilà comment on procède :
1. Je vous envoie la proposition détaillée par email dans l'heure
2. Si ça vous convient, on signe + acompte de 30% (soit [montant]€)
3. On lance le projet dès demain avec le kick-off call

Ça vous va ?"

[Si oui]
"Parfait. Je vous envoie tout ça dans l'heure. Vous préférez payer par virement ou carte ?"

[Si hésitation]
"Vous avez une question particulière avant de valider ?"
```

**Si le prospect est tiède (signaux : "je vais réfléchir", "je dois voir") :**
```
Close doux :
"Pas de souci. Pour que vous puissiez réfléchir avec tous les éléments, qu'est-ce qui vous aiderait ?
- Une proposition écrite détaillée ?
- Un second échange avec [associé/équipe] ?
- Une démo live du workflow ?"

[Proposer next step concret]

"Ok, je vous propose qu'on se reparle [jour précis]. Entre-temps, je vous envoie [ce qui a été convenu]. Ça marche ?"
```

**Si le prospect est froid (signaux : "je ne suis pas sûr", "c'est pas pour maintenant") :**
```
Close repositionnement :
"Ok, je comprends. Juste pour que je comprenne : qu'est-ce qui vous fait hésiter exactement ?"

[Écouter]

"D'accord. Et si on mettait ça de côté pour l'instant, qu'est-ce qui serait plus prioritaire pour vous en ce moment ?"

[Écouter - possibilité de repositionner sur une autre offre ou de qualifier pour plus tard]

"Ok, pas de problème. Je vous laisse mon contact, et si jamais le sujet redevient d'actualité, n'hésitez pas à me recontacter. Et je peux vous ajouter à ma newsletter mensuelle ? J'envoie des tips gratuits sur l'automatisation pour [son secteur]."
```

---

### 3. Format de sortie

Claude DOIT structurer sa réponse ainsi :
```
📞 SCRIPT DE CALL - [NOM PROSPECT] - [DATE]

━━━━━━━━━━━━━━━━━━━━━━
📋 CONTEXTE PRÉ-CALL
━━━━━━━━━━━━━━━━━━━━━━

Prospect : [Nom, fonction, entreprise]
Secteur : [X]
Pain point identifié : [Y]
Origine contact : [LinkedIn/Email/Autre]
Offre à présenter : [Nom offre + prix]

━━━━━━━━━━━━━━━━━━━━━━
🎯 OBJECTIF DU CALL
━━━━━━━━━━━━━━━━━━━━━━

Primaire : [Closer avec acompte / Accord de principe / Qualifier besoin]
Secondaire : [Si primaire échoue, que viser ?]

━━━━━━━━━━━━━━━━━━━━━━
📝 SCRIPT DÉTAILLÉ
━━━━━━━━━━━━━━━━━━━━━━

🔷 PHASE 1 : OUVERTURE (2-3 min)
[Script complet]

🔷 PHASE 2 : DÉCOUVERTE (8-10 min)
[Questions BANT détaillées]

🔷 PHASE 3 : PRÉSENTATION SOLUTION (5-7 min)
[Pitch structuré]

🔷 PHASE 4 : GESTION OBJECTIONS (3-5 min)
[Réponses aux 3 objections les plus probables pour ce prospect]

🔷 PHASE 5 : CLOSING (2-3 min)
[Close adapté au profil prospect]

━━━━━━━━━━━━━━━━━━━━━━
⚠️ POINTS D'ATTENTION
━━━━━━━━━━━━━━━━━━━━━━

- [Point critique 1 sur ce prospect]
- [Point critique 2]
- [Ce qu'il NE faut PAS dire]

━━━━━━━━━━━━━━━━━━━━━━
✅ NEXT STEPS APRÈS CALL
━━━━━━━━━━━━━━━━━━━━━━

Si accord :
1. [Action 1]
2. [Action 2]

Si besoin de réfléchir :
1. [Action 1]
2. [Action 2]

Si refus :
1. [Action 1]
```

### 4. Règles d'utilisation du script

**Pendant le call :**
- ✅ Utiliser le script comme GUIDE, pas comme récitation
- ✅ Adapter selon les réponses du prospect
- ✅ Prendre des notes en direct (surtout phase découverte)
- ✅ Laisser des silences après les questions importantes
- ✅ Reformuler ce que dit le prospect pour montrer qu'on écoute

**À NE PAS FAIRE :**
- ❌ Lire le script mot à mot (ça s'entend)
- ❌ Couper le prospect pour suivre le script
- ❌ Sauter la phase découverte pour pitcher directement
- ❌ Insister si le prospect dit "non" fermement
- ❌ Mentir ou exagérer les résultats

### 5. Checklist post-call

Après chaque call, noter :
- [ ] Durée réelle du call
- [ ] Phase où le prospect était le plus engagé
- [ ] Objections rencontrées (+ qualité des réponses)
- [ ] Résultat : Closer / Next step / Refus
- [ ] Ce qui a bien fonctionné
- [ ] Ce qui a mal fonctionné
- [ ] Ajustements à faire pour le prochain call

## Exemples de prompts pour utiliser ce skill

**Exemple 1 - Call découverte basique :**
```
J'ai un call demain avec un expert-comptable qui a répondu à mon message LinkedIn. Il m'a dit qu'il cherche à automatiser la saisie de factures. Budget non évoqué.

Utilise le skill "demo-script-builder" pour créer le script de call complet.
```

**Exemple 2 - Call avec contexte détaillé :**
```
Call jeudi 10h avec Maître Dupont, avocat en droit des affaires (cabinet 8 personnes).

Contexte : Il reçoit 60 demandes/mois via formulaire web, 40% non qualifiées. Veut automatiser le tri. Budget évoqué : "autour de 1000-1500€". Décisionnaire mais doit valider avec son associé.

Offre à présenter : "Qualificateur Leads Juridique" à 1290€.

Utilise le skill "demo-script-builder" pour créer le script.
```

**Exemple 3 - Call de closing (suite à une démo) :**
```
J'ai fait une démo hier d'un workflow pour un dentiste. Il était très intéressé mais n'a pas signé sur place ("besoin de réfléchir").

On a un call de suivi prévu demain pour closer. Offre : "Système Rappels RDV" à 890€.

Utilise le skill "demo-script-builder" pour créer un script de closing pur (sans redécouverte).
```

## Métriques de succès
- Taux de closing call : >30%
- Durée moyenne call : 20-25 min (pas plus de 30min)
- Taux d'obtention next step (si pas close) : >60%

## Mises à jour
- v1.0 (21/12/2024) : Version initiale
- v1.1 (à venir) : Ajout scripts par secteur spécifique + gestion objections avancées