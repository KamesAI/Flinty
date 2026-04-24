---
name: sales-message-generator
description: Génère des messages de prospection ultra-personnalisés (LinkedIn, email, séquences) pour TPE/PME françaises. Utilise pour prospecter, relancer, ou créer des campagnes cold email.
---
# Sales Message Generator — Kames AI

## AVANT DE GÉNÉRER QUOI QUE CE SOIT

1. Lire `clients/lead-gen/00-Discovery/ICP.md` pour calibrer le contenu sur les segments réels.
2. Lire `clients/lead-gen/00-Discovery/email-templates-library.md` — si une version validée existe pour le segment demandé, l'utiliser EN PRIORITÉ. Ne générer de nouveaux templates que si aucune version validée n'existe.
3. Si `ICP.md` n'existe pas → lancer le brainstorming ICP (poser les 4 blocs de questions) avant de générer.

---

## Quand utiliser ce skill

- Générer une séquence cold email pour un nouveau segment
- Créer un message LinkedIn de prospection
- Relancer un prospect qui n'a pas répondu
- Produire du contenu directement collable dans Google Sheets `Email_Templates`

---

## Contexte Kames AI

- **Produit 1 :** Flinty — automatisation de la prospection pour solopreneurs
- **Produit 2 :** QualioFlow — préparation audit Qualiopi pour organismes de formation
- **Ton :** Professionnel, simple, focus résultat concret — jamais de jargon technique
- **Stack CRM :** Séquence J0 → J+3 → J+7 injectée via n8n depuis Google Sheets `Email_Templates`

---

## Tokens de personnalisation standardisés (liste STRICTE)

Utiliser UNIQUEMENT ces tokens — aucun autre format accepté :
- `{{prenom}}` — prénom du lead
- `{{entreprise}}` — nom de l'entreprise
- `{{secteur}}` — secteur d'activité
- `{{ville}}` — ville
- `{{score}}` — score de qualification Claude (si disponible)

**Interdit :** `[NOM]`, `{nom}`, `[PRENOM]`, `{{nom}}`, tout autre format.

---

## Règles de rédaction STRICTES

### Longueurs imposées
- **J0 :** 80-120 mots MAX (mobile-first, première impression)
- **J+3 :** 60-80 mots (référence au J0, nouvelle accroche)
- **J+7 :** 50-70 mots (clôture, dernière chance, ton direct)

### Règles d'or
- ✅ Parler du problème AVANT de parler de la solution
- ✅ 1 seul CTA par email (Calendly OU réponse directe — jamais les deux)
- ✅ Chiffres concrets (ex: "économiser 30h", "3 nouveaux clients en 6 semaines")
- ✅ Vouvoiement par défaut (sauf si secteur clairement jeune/startup)
- ✅ Objet : 6 mots max, minuscules, sans ponctuation inutile
- ❌ Aucun lien en J0 (filtre anti-spam)
- ❌ Phrases de plus de 20 mots
- ❌ Jargon technique (API, webhook, n8n, pipeline, SaaS...)
- ❌ Superlatifs ("révolutionnaire", "incroyable", "unique")
- ❌ Demander un rendez-vous dès J0

---

## Format de sortie OBLIGATOIRE

```
## Séquence complète — [Segment ICP] — [Produit/Offre]

### J0 — Premier contact
Objet : ...
Corps :
---
[texte de l'email — 80-120 mots]
---
Tokens utilisés : {{prenom}}, {{entreprise}}, {{secteur}}, {{ville}}

### J+3 — Relance 1
Objet : ...
Corps :
---
[texte de l'email — 60-80 mots]
---

### J+7 — Relance 2 (dernière)
Objet : ...
Corps :
---
[texte de l'email — 50-70 mots]
---

## Ligne Google Sheets — onglet Email_Templates (à coller directement)
| campaign_id | touch | subject | body | status |
|---|---|---|---|---|
| [à compléter] | J0 | [objet J0] | [corps J0 — retours à la ligne remplacés par \n] | active |
| [à compléter] | J+3 | [objet J+3] | [corps J+3] | active |
| [à compléter] | J+7 | [objet J+7] | [corps J+7] | active |
```

---

## Exemples de prompts

**Séquence complète :**
```
"Génère une séquence J0/J+3/J+7 pour le segment Solopreneur / Flinty. Utilise l'ICP.md."
```

**Relance :**
```
"J'ai envoyé le J0 à un organisme de formation il y a 5 jours, pas de réponse. Génère le J+3."
```

**LinkedIn :**
```
"Génère un message LinkedIn 300 caractères pour un formateur expert qui cherche sa certification Qualiopi."
```

---

## Métriques cibles

- Taux d'ouverture email : >30%
- Taux de réponse email : >5%
- Taux de réponse LinkedIn : >8%
