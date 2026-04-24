---
name: video-script-generator
description: >
  Génère des scripts vidéo professionnels avec storyboard et prompts visuels IA.
  Utiliser quand l'utilisateur demande de créer un script pour une vidéo (short, pub, témoignage, explicatif),
  un storyboard, ou des prompts pour générer des images IA pour une vidéo.
  Produit 3 fichiers Markdown séparés avec script complet, storyboard scène par scène,
  et prompts visuels prêts à copier pour Midjourney ou Leonardo ou DALL-E.
---

# Video Script Generator

Génère des scripts vidéo professionnels pour shorts, pubs marketing, témoignages et vidéos explicatives (30 sec - 90 sec).

## Workflow

1. **Analyser la demande** → Type, durée, contexte
2. **Choisir la structure** → AIDA, PAS, BAB, Tutorial (voir `references/video-structures.md`)
3. **Sélectionner le hook** → Depuis `references/hooks-library.md`
4. **Calculer le timing** → Selon `references/timing-guide.md`
5. **Générer les 3 fichiers** → Utiliser les templates dans `assets/`

## Fichiers de sortie

Toujours produire **3 fichiers Markdown séparés** :

| Fichier | Contenu |
|---------|---------|
| `[nom]-script.md` | Script complet avec voix-off exhaustive, timecodes, directions |
| `[nom]-storyboard.md` | Tableau scène par scène avec visuels et transitions |
| `[nom]-prompts-visuels.md` | Prompts IA prêts à copier pour chaque scène |

## Analyse de la demande

Avant de générer, identifier :

| Élément | Question | Impact |
|---------|----------|--------|
| **Type** | Pub, témoignage, explicatif, short ? | Structure narrative |
| **Durée** | Combien de secondes ? | Nombre de mots, scènes |
| **Cible** | À qui s'adresse la vidéo ? | Ton, vocabulaire |
| **Objectif** | Quelle action du viewer ? | CTA à formuler |
| **Contexte** | Fichier joint ? Infos produit ? | Personnalisation |

Si des informations manquent, demander clarification avant de générer.

## Règles de génération

### Script (`-script.md`)

Le script doit être **exhaustif et complet** :

- Hook dans les 3 premières secondes (obligatoire)
- Voix-off mot pour mot, prête à enregistrer ou copier dans ElevenLabs
- Timecodes précis pour chaque segment
- Indications de ton et débit
- CTA clair et actionnable
- Bloc final avec tout le texte en continu (copier/coller ready)

**Calcul des mots :**
- 30 sec = 75-90 mots (rythme rapide)
- 45 sec = 110-135 mots
- 60 sec = 150-180 mots
- 90 sec = 225-270 mots

### Storyboard (`-storyboard.md`)

- Une ligne par changement visuel (cut)
- Cuts toutes les 2-4 secondes pour vidéos dynamiques
- Description visuelle précise et actionnable
- Type de transition spécifié

### Prompts visuels (`-prompts-visuels.md`)

- Un prompt par scène minimum
- Format optimisé pour Midjourney/Leonardo
- Ratio correct (9:16 pour shorts, 16:9 pour YouTube)
- Style cohérent sur toutes les scènes
- Prêt à copier/coller directement

Consulter `references/visual-prompts-guide.md` pour les bonnes pratiques.

## Sélection de structure

| Si l'objectif est... | Utiliser structure |
|---------------------|-------------------|
| Vendre un produit/service | AIDA |
| Résoudre un problème client | PAS |
| Montrer un témoignage/résultat | BAB (Before-After-Bridge) |
| Enseigner quelque chose | Tutorial |
| Raconter une histoire | Story |

Détails dans `references/video-structures.md`.

## Exemple de génération

**Demande utilisateur :**
> "Génère un script de 45 secondes pour une pub de mon SaaS de facturation automatique"

**Réponse attendue :**

1. Créer `facturation-saas-script.md` avec :
   - Hook : "Tu perds 5 heures par semaine à faire tes factures."
   - Structure AIDA complète
   - Voix-off de ~120 mots
   - Bloc texte complet à la fin

2. Créer `facturation-saas-storyboard.md` avec :
   - 12-15 scènes (cuts toutes les 3 sec)
   - Tableau avec timecode, visuel, audio, transition

3. Créer `facturation-saas-prompts-visuels.md` avec :
   - Prompts pour chaque scène clé
   - Ratio 9:16
   - Style cohérent

## Ressources disponibles

| Fichier | Usage |
|---------|-------|
| `references/hooks-library.md` | Bibliothèque de hooks par catégorie |
| `references/video-structures.md` | Structures narratives (AIDA, PAS, etc.) |
| `references/timing-guide.md` | Calcul mots/durée, rythme des cuts |
| `references/visual-prompts-guide.md` | Rédaction de prompts visuels IA |
| `assets/template-script.md` | Template du script complet |
| `assets/template-storyboard.md` | Template du storyboard |
| `assets/template-prompts.md` | Template des prompts visuels |

## Qualité attendue

Chaque génération doit :

- [ ] Avoir un hook percutant dans les 3 premières secondes
- [ ] Respecter la durée demandée (±5 secondes)
- [ ] Contenir une voix-off complète mot pour mot
- [ ] Avoir des prompts visuels exploitables immédiatement
- [ ] Inclure un CTA clair
- [ ] Être cohérent visuellement (même style sur toutes les scènes)
