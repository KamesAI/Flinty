# Bibliothèque de templates email — Kames AI

> Source de vérité pour les séquences cold email validées.
> Le skill `local-sales-message-generator` utilise ces templates EN PRIORITÉ.
> Ne générer de nouveaux templates que si aucune version validée n'existe pour le segment.

---

## Segment 1 : Solopreneur / Founder — Kames CRM

### Version A — (généré le 2026-03-11 — non testé)

#### J0 — Premier contact
**Objet :** tu cherches des clients en ce moment

Bonjour {{prenom}},

Je vois que tu travailles en solo dans {{secteur}}.

La prospection prend du temps — messages LinkedIn, relances, appels… souvent pour peu de résultats concrets.

J'ai créé Kames CRM pour automatiser ça : il identifie et qualifie les prospects pendant que tu travailles. Tu parles uniquement aux personnes prêtes à acheter.

Premiers retours : plusieurs clients signés en quelques semaines, sans y passer des heures.

Tu veux voir comment ça fonctionne pour {{secteur}} ?

Thomas, Kames AI

---

#### J+3 — Relance 1
**Objet :** re : tu cherches des clients en ce moment

Bonjour {{prenom}},

Je reviens avec une précision : Kames CRM ne génère pas juste des contacts.

Il qualifie automatiquement qui est prêt à signer maintenant dans {{secteur}}.

Tu passes moins de temps à prospecter, plus de temps à signer.

15 minutes cette semaine pour en discuter ?

Thomas

---

#### J+7 — Relance 2 (dernière)
**Objet :** dernier message — promis

Bonjour {{prenom}},

Je ne veux pas t'encombrer.

Si trouver des clients en {{secteur}} est un vrai sujet pour toi, je t'offre un accès gratuit pour tester Kames CRM sur ta propre cible.

Un mot suffit — je t'envoie le lien.

Thomas

---

## Ligne Google Sheets — onglet Email_Templates
| campaign_id | touch | subject | body | status |
|---|---|---|---|---|
| kames-crm-v1 | J0 | tu cherches des clients en ce moment | Bonjour {{prenom}},\n\nJe vois que tu travailles en solo dans {{secteur}}.\n\nLa prospection prend du temps — messages LinkedIn, relances, appels… souvent pour peu de résultats concrets.\n\nJ'ai créé Kames CRM pour automatiser ça : il identifie et qualifie les prospects pendant que tu travailles. Tu parles uniquement aux personnes prêtes à acheter.\n\nPremiers retours : plusieurs clients signés en quelques semaines, sans y passer des heures.\n\nTu veux voir comment ça fonctionne pour {{secteur}} ?\n\nThomas, Kames AI | active |
| kames-crm-v1 | J+3 | re : tu cherches des clients en ce moment | Bonjour {{prenom}},\n\nJe reviens avec une précision : Kames CRM ne génère pas juste des contacts.\n\nIl qualifie automatiquement qui est prêt à signer maintenant dans {{secteur}}.\n\nTu passes moins de temps à prospecter, plus de temps à signer.\n\n15 minutes cette semaine pour en discuter ?\n\nThomas | active |
| kames-crm-v1 | J+7 | dernier message — promis | Bonjour {{prenom}},\n\nJe ne veux pas t'encombrer.\n\nSi trouver des clients en {{secteur}} est un vrai sujet pour toi, je t'offre un accès gratuit pour tester Kames CRM sur ta propre cible.\n\nUn mot suffit — je t'envoie le lien.\n\nThomas | active |

---

---

## Segment 2 : Organisme de formation — QualioFlow

### Version A — (généré le 2026-03-11 — non testé)

#### J0 — Premier contact
**Objet :** votre audit Qualiopi — une question

Bonjour {{prenom}},

Combien d'heures avez-vous passé à préparer votre dernière évaluation Qualiopi ?

La plupart des organismes de formation y consacrent 30 à 50 heures — souvent seuls, parfois avec un consultant qui coûte plusieurs milliers d'euros.

J'ai créé QualioFlow pour ramener ça à quelques heures : chaque critère guidé, chaque document centralisé, aucun oubli.

Est-ce que vous seriez disponible 15 minutes pour voir si ça peut vous aider ?

Thomas, Kames AI

---

#### J+3 — Relance 1
**Objet :** re : votre audit Qualiopi

Bonjour {{prenom}},

Je reviens sur mon message.

Mes premiers utilisateurs ont économisé plusieurs dizaines d'heures sur la préparation de leur audit — sans consultant externe, sans stress de dernière minute.

Pas d'engagement, pas de carte bancaire : juste un accès gratuit pour tester sur votre propre dossier.

Intéressé(e) ?

Thomas

---

#### J+7 — Relance 2 (dernière)
**Objet :** dernier message — QualioFlow

Bonjour {{prenom}},

Je ne veux pas insister.

Si la préparation de votre audit Qualiopi est encore un sujet cette année, je vous ouvre un accès test gratuit sur votre dossier réel.

Un mot et je vous l'envoie.

Thomas, Kames AI

---

## Ligne Google Sheets — onglet Email_Templates
| campaign_id | touch | subject | body | status |
|---|---|---|---|---|
| qualioflow-v1 | J0 | votre audit Qualiopi — une question | Bonjour {{prenom}},\n\nCombien d'heures avez-vous passé à préparer votre dernière évaluation Qualiopi ?\n\nLa plupart des organismes de formation y consacrent 30 à 50 heures — souvent seuls, parfois avec un consultant qui coûte plusieurs milliers d'euros.\n\nJ'ai créé QualioFlow pour ramener ça à quelques heures : chaque critère guidé, chaque document centralisé, aucun oubli.\n\nEst-ce que vous seriez disponible 15 minutes pour voir si ça peut vous aider ?\n\nThomas, Kames AI | active |
| qualioflow-v1 | J+3 | re : votre audit Qualiopi | Bonjour {{prenom}},\n\nJe reviens sur mon message.\n\nMes premiers utilisateurs ont économisé plusieurs dizaines d'heures sur la préparation de leur audit — sans consultant externe, sans stress de dernière minute.\n\nPas d'engagement, pas de carte bancaire : juste un accès gratuit pour tester sur votre propre dossier.\n\nIntéressé(e) ?\n\nThomas | active |
| qualioflow-v1 | J+7 | dernier message — QualioFlow | Bonjour {{prenom}},\n\nJe ne veux pas insister.\n\nSi la préparation de votre audit Qualiopi est encore un sujet cette année, je vous ouvre un accès test gratuit sur votre dossier réel.\n\nUn mot et je vous l'envoie.\n\nThomas, Kames AI | active |

---

## Suivi des performances (à mettre à jour après chaque campagne)

| campaign_id | version | date_envoi | nb_envois | taux_ouverture | taux_reponse | notes |
|---|---|---|---|---|---|---|
| kames-crm-v1 | A | — | — | — | — | non testé |
| qualioflow-v1 | A | — | — | — | — | non testé |
