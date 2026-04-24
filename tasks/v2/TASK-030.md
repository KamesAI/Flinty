# TASK-030 — Unified Inbox en lecture centralisee

**Priorité** : 🟡 P3 — Centraliser les reponses et priorites d'action
**Statut** : ✅ Complété
**Nécessite** : `TASK-029` pour la timeline unifiee + donnees de conversations/messages exploitables
**Référence** : `clients/lead-gen/CRMupgrade.md` sections `4.4`, `8.1`, `11`, `13`

---

## Objectif

Créer une `Unified Inbox` qui centralise en un seul endroit les conversations et reponses a traiter :

- emails,
- DMs visibles,
- leads engages,
- conversations en attente.

Cette inbox doit etre **en lecture centralisee**, avec tri et priorisation, sans envoi natif multicanal pour cette phase.

---

## Ce qu'il faut faire

### 1. Créer une page dédiée

Ajouter une page :

- `/dashboard/inbox`

avec une structure claire :

- liste des conversations,
- panneau detail ou lien vers fiche lead,
- filtres principaux,
- etats de priorite.

### 2. Définir la source d’agrégation

L'inbox peut s'appuyer sur :

- `Conversations`,
- `Messages`,
- `Email_Events`,
- `Meetings` pour enrichir le contexte,
- ou une vue agrégée calculee dans Next.js.

Le plus important est de sortir une liste exploitable de type :

- `needs_reply`
- `waiting`
- `booked`
- `closed`

### 3. Ajouter les filtres minimum

Il faut pouvoir filtrer par :

- canal,
- statut,
- campagne,
- presence d'une reponse entrante,
- conversations les plus recentes.

### 4. Afficher le bon niveau de résumé

Chaque ligne d'inbox doit montrer :

- prospect,
- entreprise si connue,
- canal principal,
- dernier message ou evenement,
- date de derniere activite,
- campagne,
- statut / priorite.

### 5. Ajouter les liens de navigation utiles

Depuis une ligne inbox, il doit etre possible :

- d'ouvrir la fiche lead,
- de revenir a la campagne,
- de comprendre rapidement si un meeting est deja prevu.

---

## Must Have

- [ ] Page `/dashboard/inbox`
- [ ] Liste unifiee de conversations ou leads a traiter
- [ ] Filtres par canal, statut et campagne
- [ ] Affichage du dernier evenement utile
- [ ] Navigation rapide vers la fiche lead

## Should Have

- [ ] Compteurs par statut
- [ ] Mise en avant des `needs reply`
- [ ] Separation visuelle `email` vs `DM`
- [ ] Widget resume sur le dashboard home

## Must NOT

- [ ] Ne pas ajouter d'envoi natif de DM
- [ ] Ne pas transformer cette page en messagerie temps reel
- [ ] Ne pas exiger toutes les integrations sociales pour livrer une V1
- [ ] Ne pas masquer les conversations si certaines metadonnees sont manquantes

---

## Fichiers cibles

- `app/dashboard/layout.tsx`
- `app/dashboard/inbox/page.tsx`
- `lib/sheets.ts`

Optionnel selon implementation :

- `app/dashboard/inbox/InboxList.tsx`
- `app/dashboard/inbox/InboxFilters.tsx`
- `app/dashboard/inbox/InboxStatusTabs.tsx`

---

## Critères de validation

- [ ] La sidebar donne acces a `Inbox`
- [ ] La page affiche une liste unifiee coherent
- [ ] Les conversations avec reponse recente remontent correctement
- [ ] Les filtres modifient bien la liste
- [ ] Un clic ouvre la fiche lead ou le detail associe
- [ ] Aucun canal externe n'est editable depuis cette page

---

## Dépendances

### Bloqué par

- `TASK-029` — Timeline conversations unifiee sur fiche lead

### Bloque

- Aucun blocage aval strict

---

## Notes

Le vrai gain ici est le **pilotage quotidien** : ne plus chercher dans plusieurs vues qui a repondu, qui attend une action et quelle campagne est en train de chauffer.
