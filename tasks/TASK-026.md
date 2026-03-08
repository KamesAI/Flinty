# TASK-026 — Templates v2 avec support video + preview enrichie

**Priorité** : 🔴 P1 — Levier direct sur les performances de prospection
**Statut** : ⏳ À faire
**Nécessite** : Base templates V1 deja existante (`/dashboard/templates`, `Email_Templates`, `api/templates`)
**Référence** : `clients/lead-gen/CRMupgrade.md` sections `3.B`, `4.6`, `11`, `13`

---

## Objectif

Faire evoluer la section Templates vers une V2 exploitable commercialement :

- edition plus structurée,
- preview plus fidele,
- support de blocs visuels,
- support de videos demo via miniature cliquable,
- stockage des metadonnees dans Google Sheets sans casser la V1.

---

## Ce qu'il faut faire

### 1. Faire évoluer le modèle de données templates

La structure actuelle `Email_Templates` stocke seulement :

```txt
campaign_id | sequence_key | variant_key | label | subject | body | updated_at
```

Il faut ajouter une V2 compatible avec :

- `preview_text`,
- `cta_label`,
- `cta_url`,
- `media_type`,
- `media_thumbnail_url`,
- `media_target_url`,
- `is_rich_template`,
- `notes`.

Deux options acceptables :

1. enrichir `Email_Templates` avec de nouvelles colonnes,
2. ou créer un onglet complementaire `Email_Template_Assets` lie par `campaign_id + sequence_key + variant_key`.

Le plus important est de garder une lecture simple depuis Next.js et Google Sheets.

### 2. Mettre à jour `lib/email-templates.ts`

Faire evoluer les types pour supporter :

- template texte simple,
- template enrichi,
- bloc video,
- CTA,
- variantes A/B.

Conserver une fonction de fallback pour les campagnes qui n'ont pas encore de donnees V2.

### 3. Mettre à jour `lib/sheets.ts` et `app/api/templates/route.ts`

L'API templates doit :

- lire les nouveaux champs,
- valider les payloads enrichis,
- sauvegarder sans dupliquer les lignes,
- rester retro-compatible avec la V1.

### 4. Refondre l'éditeur `TemplatesEditor`

Ajouter dans `app/dashboard/templates/TemplatesEditor.tsx` :

- un mode edition plus propre,
- un bloc `Preview`,
- un champ `Preview text`,
- un bloc `CTA`,
- un bloc `Media`,
- un select `type de media`,
- une gestion simple du bloc video thumbnail.

### 5. Ajouter le rendu video email-safe

Le support video ne doit **pas** tenter d'embarquer un player direct dans l'email.

Le rendu attendu :

- image miniature,
- bouton play visuel,
- lien cliquable vers page de demo / Loom / page Kames,
- fallback propre si aucun media n'est renseigne.

### 6. Préparer la mesure future des performances

Sans implementer toute l'analytics ici, il faut prevoir les champs qui permettront plus tard de relier :

- template,
- variante,
- clic CTA,
- clic media,
- campagne.

---

## Must Have

- [ ] Stockage Google Sheets compatible V2 pour les templates enrichis
- [ ] Support `preview_text`, `CTA` et `media`
- [ ] Bloc video base sur miniature cliquable
- [ ] Preview visuelle dans `/dashboard/templates`
- [ ] Compatibilite avec les templates V1 deja saisis

## Should Have

- [ ] Indicateur visuel `template simple` vs `template enrichi`
- [ ] Aide inline pour expliquer la bonne pratique email-safe video
- [ ] Notes internes par template

## Must NOT

- [ ] Ne pas construire un vrai drag-and-drop builder
- [ ] Ne pas essayer d'embarquer une video native dans l'email
- [ ] Ne pas casser le schema V1 deja utilise par campagne
- [ ] Ne pas ajouter encore le tracking complet des performances

---

## Fichiers cibles

- `app/dashboard/templates/page.tsx`
- `app/dashboard/templates/TemplatesEditor.tsx`
- `app/api/templates/route.ts`
- `lib/email-templates.ts`
- `lib/sheets.ts`

Optionnel selon approche retenue :

- `app/dashboard/templates/TemplatePreview.tsx`
- `app/dashboard/templates/TemplateMediaCard.tsx`

---

## Critères de validation

- [ ] Une campagne peut enregistrer un template enrichi sans erreur
- [ ] La page `Templates` affiche un preview texte + visuel plus fidele
- [ ] Un bloc video peut etre configure avec miniature + URL cible
- [ ] Les templates V1 existants restent visibles et modifiables
- [ ] L'API `/api/templates` refuse les payloads incomplets ou invalides
- [ ] Aucun email template n'essaie de lire un player video embarque

---

## Dépendances

### Bloqué par

- Aucune dependance bloquante stricte

### Bloque

- `TASK-028` — Onglet Data business + marketing + commercial
- `TASK-030` — Unified Inbox en lecture centralisee

---

## Notes

Le bon niveau de finition ici est un **studio de templates robuste**, pas un builder marketing complexe. Le scope gagnant est :

- edition claire,
- preview utile,
- support video propre,
- structure exploitable pour les stats plus tard.
