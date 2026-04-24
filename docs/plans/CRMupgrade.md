# Flinty Upgrade

> Document de cadrage produit pour faire évoluer le dashboard `lead-gen` vers un CRM commercial plus complet.
> Hypothèse prioritaire validée : **approche email-first**, avec architecture prête pour l'omnicanal ensuite.

**Date :** 2026-03-08  
**Projet :** Flinty / Lead Gen Dashboard  
**Statut :** Vision produit mise a jour avec arbitrages valides

---

## 1. Vision Produit

Transformer l'actuel dashboard "lead generation + qualification" en **cockpit commercial Flinty** capable de piloter :

- la génération de leads,
- la qualification IA,
- les campagnes de cold emailing,
- les conversations prospects,
- les relances multi-canales,
- les rendez-vous planifiés,
- les templates de prospection,
- les analytics globales sur campagnes actives et archivées.

La bonne stratégie n'est pas de tout rendre omnicanal d'un coup.

La recommandation produit est :

1. **Renforcer d'abord le noyau email**, car c'est déjà le canal le plus mature dans le projet.
2. **Ajouter une couche "conversations" et "timeline"** qui pourra ensuite accueillir LinkedIn, WhatsApp, X et Instagram.
3. **Créer un onglet Data très solide** pour devenir le centre de pilotage business.

En pratique, le CRM doit évoluer d'un dashboard de suivi vers un **système d'exploitation commercial** pour Flinty, avec une logique assez propre et modulaire pour pouvoir etre **reconditionne plus tard en produit vendable a des entreprises**.

---

## 2. Positionnement Recommandé

### Approche recommandée

**Email natif fort maintenant, omnicanal progressivement ensuite.**

Pourquoi :

- l'app a deja une base solide autour de Google Sheets, n8n, Resend et des campagnes,
- les emails sont déjà structurables avec templates, statuts, séquences et tracking,
- les DMs social et WhatsApp imposent plus de contraintes API, auth, quotas et conformité,
- unifier l'affichage des conversations avant d'unifier les envois est plus rapide et plus réaliste.

### Principe produit

Le CRM doit gérer 3 couches :

1. **Acquisition**
   Leads, campagnes, qualification, scoring, enrichissement.
2. **Activation**
   Emails, templates, messages, relances, réponses, booking.
3. **Pilotage**
   Dashboard Data, KPIs, attribution, pipeline, performances par canal.

### Cible business validee

Le produit est pense d'abord pour **l'agence Flinty en usage long terme**, mais il doit etre concu avec une logique suffisamment generique pour etre :

- reutilisable sur plusieurs campagnes et plusieurs offres,
- adaptable a plusieurs commerciaux plus tard,
- revendable ensuite a des entreprises sous forme de CRM de prospection specialise.

---

## 3. Objectifs Fonctionnels

### A. Campagnes

Le module campagnes doit permettre de piloter une campagne de bout en bout :

- création de campagne,
- choix du canal principal,
- segmentation cible,
- templates associés,
- déclenchement des workflows,
- suivi des statuts,
- archivage,
- comparaison inter-campagnes.

### B. Templates

La section Templates doit devenir un vrai studio de prospection :

- templates email texte + HTML,
- variables dynamiques,
- snippets réutilisables,
- blocs CTA,
- variantes A/B,
- prévisualisation desktop/mobile,
- bibliothèque de sections réutilisables.

### C. Conversations

Le CRM doit pouvoir agréger les réponses prospects dans un seul endroit :

- réponses email,
- réponses LinkedIn,
- réponses WhatsApp,
- réponses X,
- réponses Instagram,
- notes internes,
- changement d'état du prospect,
- historique complet par lead.

Pour cette version cible, les DMs sociaux sont **visibles dans le CRM uniquement**.
L'objectif n'est pas d'envoyer des DMs depuis l'interface pour le moment, mais de centraliser la lecture et le contexte commercial.

### D. Calendrier

Le CRM doit exposer les rendez-vous liés à la prospection :

- vue agenda,
- vue liste des RDV,
- lien entre un booking et la campagne d'origine,
- affichage des prospects chauds avec rendez-vous à venir,
- accès direct à la fiche lead depuis l'événement calendrier.

Le besoin valide pour maintenant est un **mode lecture seule**, idealement connecte a **Calendly** pour voir directement les rendez-vous de la semaine sans creer ni modifier d'evenements depuis le CRM.

### E. Data

L'onglet Data doit centraliser les stats globales :

- campagnes actives,
- campagnes archivées,
- performance par canal,
- performance par template,
- performance par segment,
- évolution temporelle,
- taux de booking,
- revenus potentiels générés,
- productivité commerciale.

Cet onglet doit servir en meme temps a trois usages :

- **pilotage business**,
- **analyse marketing**,
- **analyse commerciale**.

---

## 4. Modules Cibles

## 4.1 Dashboard

Faire du dashboard home un cockpit :

- KPIs globaux du jour / semaine / mois,
- leads chauds,
- réponses non traitées,
- prochains rendez-vous,
- campagnes en risque,
- alertes automatiques,
- raccourcis d'actions.

### Widgets recommandés

- `New replies`
- `Upcoming meetings`
- `Templates top performers`
- `Campaigns at risk`
- `Tasks to do today`
- `Conversion funnel`

## 4.2 Campaigns

Ajouter un vrai pilotage opérationnel :

- statut `draft`, `active`, `paused`, `completed`, `archived`,
- type de campagne `email`, `linkedin`, `multicanal`, `re-engagement`,
- owner,
- objectifs,
- audience,
- budget / temps investi,
- source d'acquisition,
- template pack associé,
- séquence active.

## 4.3 Leads / Contacts

Faire évoluer la fiche lead vers une fiche CRM :

- identité du lead,
- entreprise,
- source,
- score,
- statut pipeline,
- historique de contact,
- timeline complète,
- notes,
- dernières interactions,
- prochain suivi prévu,
- campagne source,
- opportunité / valeur estimée.

## 4.4 Inbox / Conversations

Créer une boîte de réception unifiée.

Fonctions minimales :

- vue par lead,
- vue par canal,
- vue "à traiter",
- tags,
- assignation,
- suggestion IA de réponse,
- changement de statut rapide.

### Recommandation d'implémentation

Phase 1 :

- unifier **l'affichage** des conversations dans la timeline,
- conserver les envois natifs surtout sur email,
- remonter les messages autres canaux via sync/API/webhooks quand possible.

Phase 2 :

- evaluer plus tard l'ajout d'envoi natif depuis le CRM sur certains canaux,
- garder comme hypothese de travail que les DMs restent d'abord en **lecture centralisee**.

## 4.5 Calendar

Créer un onglet `Calendar` ou `Meetings` avec :

- agenda mensuel,
- agenda hebdo,
- liste des RDV,
- lien campagne -> booking -> lead,
- statut du meeting (`scheduled`, `completed`, `no-show`, `cancelled`),
- filtre par campagne et par owner,
- CTA rapide vers la fiche lead.

### Arbitrage valide

Le module calendrier doit d'abord etre une **vue de consultation** :

- synchro des rendez-vous a venir,
- focus sur la semaine,
- priorite a Calendly,
- pas de creation ni de replanification dans l'interface pour le moment.

### Intégrations possibles

- Calendly en priorite,
- Google Calendar en second temps si utile,
- TidyCal si utilise plus tard,
- synchro n8n -> Google Sheets -> UI au début,
- puis API calendrier directe si besoin.

## 4.6 Templates

La section Templates doit devenir un avantage compétitif.

### A ajouter

- éditeur template HTML/email,
- blocs modulaires,
- variables personnalisées,
- sections "preuve sociale",
- CTA booking,
- variantes A/B,
- aperçu avant envoi,
- score qualité interne,
- historique des performances par template.

### Vidéos et éléments visuels dans les emails

Le besoin valide est que les templates d'email puissent contenir de vraies **videos demo de solutions**, sans degrader l'experience email ni la delivrabilite.

Recommandation pragmatique :

1. **Supporter un bloc "video thumbnail" cliquable**
   une image avec bouton play qui renvoie vers une page de demo hebergee ou un lien video.
2. **Supporter GIF / image animée légère**
   utile pour la démonstration visuelle sans casser la délivrabilité.
3. **Prévoir fallback automatique**
   si le client mail bloque certains rendus.
4. **Mesurer le clic sur média**
   pour savoir si le bloc visuel améliore le taux de réponse ou de booking.

### Standard recommande pour Flinty

Le plus robuste pour les campagnes Flinty est :

- une miniature video personnalisee,
- un CTA vers une page de demo ou une video Loom,
- un tracking de clic par template et par campagne,
- une variante sans media pour comparer l'impact reel.

### Important

Éviter au début les emails trop lourds ou trop complexes visuellement.

Le bon compromis :

- email sobre,
- un visuel fort,
- un CTA clair,
- tracking propre.

---

## 5. Nouvel Onglet Data

Créer un onglet `Data` avec un niveau d'exhaustivité supérieur au dashboard actuel.

### Objectif

Obtenir une vue analytique globale de tout le système commercial, pas seulement des campagnes en cours.

L'onglet Data doit etre pense comme une **tour de controle hybride** qui sert a la fois :

- la direction business,
- l'optimisation marketing,
- le pilotage commercial quotidien.

### Sections recommandées

#### A. Vue Exécutive

- nombre total de campagnes,
- campagnes actives vs archivées,
- leads générés,
- leads qualifiés,
- emails envoyés,
- taux d'ouverture,
- taux de clic,
- taux de réponse,
- taux de booking,
- valeur pipeline estimée.

#### B. Performance par campagne

- ranking des campagnes,
- évolution dans le temps,
- comparaison actives / archivées,
- coût ou temps par campagne,
- rendement par campagne.

#### C. Analyse marketing

- performance par offre,
- performance par angle de message,
- performance par CTA,
- performance par visuel ou video,
- comparaison des variantes A/B,
- sources d'acquisition les plus rentables.

#### D. Performance par template

- ouvertures par template,
- clics par template,
- réponses par template,
- bookings par template,
- win rate par variante.

#### E. Performance par segment

- secteur,
- ville,
- taille d'équipe,
- canal,
- source lead,
- score lead.

#### F. Performance commerciale

- temps moyen avant première réponse,
- temps moyen avant booking,
- volume de réponses en attente,
- taux de relance utile,
- volume de prospects à réactiver.

#### G. Archivage intelligent

- archive visible dans les stats,
- comparaison historique,
- filtres par période,
- export CSV / JSON.

### Composants shadcn recommandés

L'onglet Data doit s'appuyer sur une vraie base `shadcn/ui` pour standardiser l'UI.

Composants recommandés :

- `Tabs`
- `Card`
- `Table`
- `Badge`
- `Select`
- `Popover`
- `Calendar`
- `Tooltip`
- `Sheet`
- `Dialog`
- `Accordion`
- `Progress`
- `Separator`
- `Breadcrumb`
- `Data Table` custom avec tri / filtres

### Visualisations recommandées

- cards KPI,
- tableaux filtrables,
- barres de comparaison,
- heatmaps simples,
- mini-funnels,
- séries temporelles,
- segments par badge / filtre.

---

## 6. Architecture Fonctionnelle Recommandée

### Noyau de données

L'actuel modèle Google Sheets peut encore tenir pour la prochaine étape, mais il faut le structurer pour éviter la dette.

### Entités à prévoir

- `Campaign`
- `Lead`
- `Company`
- `Conversation`
- `Message`
- `Template`
- `Meeting`
- `Task`
- `ChannelAccount`
- `AnalyticsSnapshot`

### Recommandation court terme

Conserver Google Sheets comme source principale est **la decision retenue pour cette version**. Il faut donc structurer le systeme pour aller vite sans changer de base maintenant, en ajoutant des onglets ou collections logiques dediees :

- `Campaigns`
- `Leads`
- `Templates`
- `Conversations`
- `Messages`
- `Meetings`
- `Tasks`
- `Analytics_Daily`

### Recommandation moyen terme

Ne pas migrer maintenant, mais garder une architecture compatible avec une migration future vers une base plus robuste si le CRM devient central ou multi-client :

- Supabase ou Postgres pour les conversations, templates, analytics et permissions,
- Google Sheets conservé pour certaines vues opérationnelles ou imports/export,
- n8n comme orchestrateur,
- Next.js comme cockpit.

### Architecture cible recommandée

1. **Next.js**
   UI, routes, vue opérateur, analytics.
2. **n8n**
   orchestration, sync, webhooks, automatisations, jobs.
3. **Resend / canaux externes**
   exécution des messages.
4. **Base structurée**
   source fiable pour messages, rendez-vous, templates et stats.

### Contrainte produit a respecter

Comme le produit pourra etre revendu plus tard, il faut concevoir des objets et des ecrans avec une logique :

- multi-campagnes native,
- multi-users possible a terme,
- multi-entreprises envisageable plus tard,
- sans obliger une refonte immediate de la stack actuelle.

---

## 7. Roadmap Produit Recommandée

## Phase 1 - Consolider le CRM email-first

### Priorité haute

- finaliser `Timeline email`,
- créer `Templates` enrichis avec blocs video,
- ajouter `Calendar` en lecture seule connecte a Calendly,
- créer `Data` orienté business + marketing + commercial,
- améliorer la fiche lead avec timeline complète,
- ajouter tâches commerciales et rappels.

### Livrables

- inbox email plus claire,
- templates pilotables,
- vue RDV,
- analytics globales,
- meilleur suivi commercial.

## Phase 2 - Préparer la couche conversations unifiée

- créer un modèle `Conversation` + `Message`,
- unifier l'affichage par lead,
- connecter les réponses externes quand possible,
- ajouter statut `to reply`, `waiting`, `won`, `lost`,
- ajouter notes internes et assignation.

## Phase 3 - Ouvrir le multicanal

- LinkedIn sync,
- WhatsApp Business si usage validé,
- X / Instagram si vrai besoin business,
- campagnes multi-touch,
- attribution par canal.

### Point de vigilance

Chaque canal doit être évalué selon :

- facilité d'intégration,
- stabilité API,
- coût,
- conformité,
- vrai usage commercial chez Flinty.

## Phase 4 - Intelligence commerciale

- scoring dynamique,
- suggestions IA de relance,
- résumés automatiques de conversations,
- next best action,
- alertes "prospect chaud",
- recommandations de template selon segment.

---

## 8. Suggestions d'Améliorations Additionnelles

Voici des features pertinentes non mentionnées explicitement, mais à forte valeur.

### 1. Unified Inbox

Un seul endroit pour voir les réponses en attente.

### 2. Tâches et follow-ups

Créer des tâches manuelles :

- relancer demain,
- appeler,
- envoyer DM,
- préparer proposition,
- vérifier booking.

### 3. Pipeline commercial

Ajouter une vue pipeline :

- `new`
- `qualified`
- `contacted`
- `engaged`
- `meeting_booked`
- `proposal`
- `won`
- `lost`

### 4. AI Copilot commercial

Fonctions possibles :

- résumer un lead,
- proposer une réponse,
- rédiger une relance,
- analyser pourquoi un template sous-performe,
- recommander le meilleur canal suivant.

### 5. Dédoublonnage et identité prospect

Très utile si un même prospect revient via plusieurs canaux.

Il faut prévoir :

- matching email,
- matching domaine,
- matching téléphone,
- fusion de profils.

### 6. Attribution et ROI

Pouvoir répondre à :

- quelle campagne génère le plus de réponses,
- quel template génère le plus de RDV,
- quel canal convertit le mieux,
- quelle séquence a le meilleur ROI.

### 7. Centre de commandes quotidien

Une vue `Today` avec :

- réponses à traiter,
- leads chauds,
- RDV du jour,
- tâches en retard,
- campagnes en anomalie.

### 8. Bibliothèque d'assets

Pour les templates visuels :

- thumbnails vidéo,
- logos,
- captures écran,
- GIF,
- blocs de preuve sociale.

### 9. Readiness multi-tenant

Si Flinty revend ce CRM plus tard, il faudra deja avoir prevu :

- separation propre des donnees,
- parametrage des marques/offres,
- templates reutilisables par compte,
- nomenclature de campagnes standardisee.

---

## 9. Risques et Points d'Attention

### 1. Omnicanal trop tôt

Risque de complexifier le produit avant d'avoir un noyau CRM très fiable.

### 2. Dépendance Google Sheets

Acceptable pour maintenant, mais potentiellement limitant pour :

- conversations volumineuses,
- recherche,
- permissions,
- analytics avancées,
- historique fin.

### 3. Deliverability email

Les blocs visuels et vidéos doivent rester compatibles avec la délivrabilité.

### 4. APIs social

LinkedIn, WhatsApp, Instagram et X ont des contraintes fortes.
Il faudra distinguer :

- affichage des messages,
- collecte des réponses,
- envoi depuis le CRM,
- automatisation autorisée.

---

## 10. Backlog Concret Recommandé

Ordre conseillé de réalisation.

1. `Timeline email complète`
2. `Templates v2 avec preview + variables + blocs visuels`
3. `Onglet Calendar / Meetings`
4. `Onglet Data avec composants shadcn`
5. `Conversation timeline unifiée sur la fiche lead`
6. `Tasks / reminders`
7. `Pipeline commercial`
8. `Unified Inbox`
9. `Connexions omnicanales progressives`
10. `AI copilot`

---

## 11. Arbitrages Valides

Ces decisions sont maintenant validees et doivent servir de base pour la suite.

### Produit

- le CRM est concu d'abord pour **Flinty en usage long terme**,
- il doit rester assez propre pour etre **reutilise ou vendu plus tard a des entreprises**,
- la logique produit doit donc etre pensee des maintenant pour evoluer vers plusieurs users et plusieurs comptes plus tard.

### Calendrier

- la vue `Calendar` doit etre en **lecture seule**,
- l'objectif prioritaire est de voir **tous les rendez-vous de la semaine**,
- **Calendly** est la connexion prioritaire,
- la creation ou replanification de rendez-vous n'est pas necessaire pour le moment.

### Conversations

- les DMs doivent etre **visibles uniquement** dans le CRM,
- l'envoi natif de DMs depuis l'interface n'est pas dans le scope court terme.

### Templates

- les templates email doivent pouvoir contenir des **videos demo** des solutions Flinty,
- l'implementation recommandee reste un bloc visuel cliquable robuste pour l'email,
- la performance du media doit etre mesurable dans les stats.

### Data

- l'onglet `Data` doit couvrir simultanement :
- `pilotage business`,
- `analyse marketing`,
- `analyse commerciale`.

### Technique

- **Google Sheets reste la base actuelle**,
- aucune migration de base n'est prevue tout de suite,
- en revanche la structure doit etre preparee pour une evolution future si le produit grossit.

---

## 12. Recommandation Finale

La meilleure évolution pour Flinty aujourd'hui est :

**construire un CRM commercial email-first tres fort, avec un socle data + conversations + calendrier en lecture seule, puis ouvrir l'omnicanal en affichage centralise sans casser le noyau existant.**

Autrement dit :

- ne pas repartir de zero,
- capitaliser sur le dashboard actuel,
- ajouter les briques les plus utiles pour vendre mieux,
- preparer une architecture qui peut accueillir les autres canaux ensuite,
- garder une logique produit revendable a plus long terme.

---

## 13. Prochaine Etape Recommandée

Creer ensuite un vrai plan d'implementation en lots :

1. `Templates v2 avec support video`
2. `Calendar / Meetings en lecture seule via Calendly`
3. `Data business + marketing + commercial`
4. `Conversation timeline`
5. `Unified Inbox`

Cela permettra de transformer ce document de vision en roadmap exécutable.
