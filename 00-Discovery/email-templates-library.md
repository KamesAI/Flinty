# Bibliothèque de templates email — Flinty

> Source de vérité pour les séquences cold email validées.
> Le skill `local-sales-message-generator` utilise ces templates EN PRIORITÉ.
> Ne générer de nouveaux templates que si aucune version validée n'existe pour le segment.

---

## Segment 1 : Solopreneur / Founder — Flinty

### Version A — (généré le 2026-03-11 — non testé)

#### J0 — Premier contact
**Objet :** tu cherches des clients en ce moment

Bonjour {{prenom}},

Je vois que tu travailles en solo dans {{secteur}}.

La prospection prend du temps — messages LinkedIn, relances, appels… souvent pour peu de résultats concrets.

J'ai créé Flinty pour automatiser ça : il identifie et qualifie les prospects pendant que tu travailles. Tu parles uniquement aux personnes vraiment prêtes à acheter.

Premiers retours : plusieurs clients signés en quelques semaines, sans y passer des heures.
L'outil améliore drastiquement la qualité des leads, et le taux de closing de mes clients s'est nettement amélioré.

Est-ce que ça t'intéresse ?

Thomas, Flinty

---

#### J+3 — Relance 1
**Objet :** re : tu cherches des clients en ce moment

Bonjour {{prenom}},

Je reviens avec une précision : Flinty ne génère pas juste des contacts.

Il qualifie automatiquement qui est prêt à signer maintenant dans {{secteur}}.

Tu passes moins de temps à prospecter, plus de temps à signer.

Tu peux également suivre et piloter tes propres campagnes de cold emailing depuis l'application.

15 minutes cette semaine pour en discuter ?

Thomas

---

#### J+7 — Relance 2 (dernière)
**Objet :** dernier message — promis

Bonjour {{prenom}},

Je ne veux pas t'encombrer.

Si trouver des clients en {{secteur}} est un vrai sujet pour toi, je t'offre un accès gratuit pour tester Flinty sur ta propre cible.

Un mot suffit — je t'envoie le lien.

Thomas

---

## Ligne Google Sheets — onglet Email_Templates
| campaign_id | touch | subject | body | status |
|---|---|---|---|---|
| flinty-v1 | J0 | tu cherches des clients en ce moment | Bonjour {{prenom}},\n\nJe vois que tu travailles en solo dans {{secteur}}.\n\nLa prospection prend du temps — messages LinkedIn, relances, appels… souvent pour peu de résultats concrets.\n\nJ'ai créé Flinty pour automatiser ça : il identifie et qualifie les prospects pendant que tu travailles. Tu parles uniquement aux personnes prêtes à acheter.\n\nPremiers retours : plusieurs clients signés en quelques semaines, sans y passer des heures.\n\nTu veux voir comment ça fonctionne pour {{secteur}} ?\n\nThomas, Flinty | active |
| flinty-v1 | J+3 | re : tu cherches des clients en ce moment | Bonjour {{prenom}},\n\nJe reviens avec une précision : Flinty ne génère pas juste des contacts.\n\nIl qualifie automatiquement qui est prêt à signer maintenant dans {{secteur}}.\n\nTu passes moins de temps à prospecter, plus de temps à signer.\n\n15 minutes cette semaine pour en discuter ?\n\nThomas | active |
| flinty-v1 | J+7 | dernier message — promis | Bonjour {{prenom}},\n\nJe ne veux pas t'encombrer.\n\nSi trouver des clients en {{secteur}} est un vrai sujet pour toi, je t'offre un accès gratuit pour tester Flinty sur ta propre cible.\n\nUn mot suffit — je t'envoie le lien.\n\nThomas | active |

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

Thomas, Flinty

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

Thomas, Flinty

---

## Ligne Google Sheets — onglet Email_Templates
| campaign_id | touch | subject | body | status |
|---|---|---|---|---|
| qualioflow-v1 | J0 | votre audit Qualiopi — une question | Bonjour {{prenom}},\n\nCombien d'heures avez-vous passé à préparer votre dernière évaluation Qualiopi ?\n\nLa plupart des organismes de formation y consacrent 30 à 50 heures — souvent seuls, parfois avec un consultant qui coûte plusieurs milliers d'euros.\n\nJ'ai créé QualioFlow pour ramener ça à quelques heures : chaque critère guidé, chaque document centralisé, aucun oubli.\n\nEst-ce que vous seriez disponible 15 minutes pour voir si ça peut vous aider ?\n\nThomas, Flinty | active |
| qualioflow-v1 | J+3 | re : votre audit Qualiopi | Bonjour {{prenom}},\n\nJe reviens sur mon message.\n\nMes premiers utilisateurs ont économisé plusieurs dizaines d'heures sur la préparation de leur audit — sans consultant externe, sans stress de dernière minute.\n\nPas d'engagement, pas de carte bancaire : juste un accès gratuit pour tester sur votre propre dossier.\n\nIntéressé(e) ?\n\nThomas | active |
| qualioflow-v1 | J+7 | dernier message — QualioFlow | Bonjour {{prenom}},\n\nJe ne veux pas insister.\n\nSi la préparation de votre audit Qualiopi est encore un sujet cette année, je vous ouvre un accès test gratuit sur votre dossier réel.\n\nUn mot et je vous l'envoie.\n\nThomas, Flinty | active |

---

## Suivi des performances (à mettre à jour après chaque campagne)

| campaign_id | version | date_envoi | nb_envois | taux_ouverture | taux_reponse | notes |
|---|---|---|---|---|---|---|
| flinty-v1 | A | — | — | — | — | non testé |
| qualioflow-v1 | A | — | — | — | — | non testé |
