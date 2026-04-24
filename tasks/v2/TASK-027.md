# TASK-027 — Calendar / Meetings en lecture seule via Calendly

**Priorité** : 🔴 P1 — Vision immediate des rendez-vous issus des campagnes
**Statut** : ✅ Complété
**Nécessite** : Google Sheets comme source de verite + synchro Calendly via n8n ou route d'ingestion
**Référence** : `clients/lead-gen/CRMupgrade.md` sections `3.D`, `4.5`, `11`, `13`

---

## Objectif

Ajouter un module `Calendar / Meetings` en **lecture seule** pour voir les rendez-vous a venir de la semaine, relies aux leads et campagnes du CRM.

La priorite est de connecter **Calendly** et d'afficher les meetings dans l'interface Flinty sans creer, modifier ni replanifier d'evenements.

---

## Ce qu'il faut faire

### 1. Créer une source `Meetings` dans Google Sheets

Ajouter un onglet `Meetings` avec une structure claire :

```txt
meeting_id | lead_id | campaign_id | source | title | start_at | end_at | timezone | status | booking_url | attendee_name | attendee_email | metadata
```

Valeurs attendues :

- `source` : `calendly`
- `status` : `scheduled` | `completed` | `cancelled` | `no_show`

### 2. Prévoir le flux d’ingestion Calendly

Deux approches acceptables :

1. **Webhook Calendly -> n8n -> GSheet**
2. **Sync planifiee Calendly -> n8n -> GSheet**

Le plus simple et fiable pour cette phase est acceptable, a condition que :

- les RDV de la semaine soient visibles,
- la source soit identifiable,
- le lien lead / campaign soit preservé quand possible.

### 3. Ajouter la couche Next.js de lecture

Créer une lecture propre des meetings dans l'app :

- parser `Meetings` dans `lib/sheets.ts`,
- exposer une route `app/api/meetings/route.ts`,
- permettre un filtrage simple par semaine, campagne et statut.

### 4. Créer la page `Calendar / Meetings`

Ajouter une nouvelle page dashboard, idealement :

- `/dashboard/meetings`

La page doit afficher au minimum :

- les RDV de la semaine,
- une vue liste claire,
- une vue agenda simple ou pseudo-calendrier hebdo,
- le nom du prospect,
- la campagne reliee,
- le statut du RDV,
- un lien rapide vers la fiche lead.

### 5. Ajouter des points d’entrée depuis l’interface

Mettre a jour la sidebar et, si possible, le dashboard home avec :

- un lien `Meetings`,
- un petit widget `Upcoming meetings`.

---

## Must Have

- [x] Onglet `Meetings` cree dans Google Sheets
- [x] Flux de synchro Calendly defini et documente
- [x] API `/api/meetings` ou equivalent de lecture
- [x] Page `/dashboard/meetings` fonctionnelle
- [x] Vue concentree sur les RDV a venir de la semaine
- [x] Lien lead/campagne visible quand la donnee existe

## Should Have

- [x] Filtres simples par statut et campagne
- [x] Badge source `Calendly`
- [x] Widget `Upcoming meetings` sur le dashboard

## Must NOT

- [ ] Ne pas permettre de creer un rendez-vous depuis le CRM
- [ ] Ne pas permettre de replanifier ou annuler un rendez-vous depuis le CRM
- [ ] Ne pas transformer ce module en CRM d'agenda complet
- [ ] Ne pas bloquer l'UI si Calendly est indisponible

---

## Fichiers cibles

- `app/dashboard/layout.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/meetings/page.tsx`
- `app/api/meetings/route.ts`
- `lib/sheets.ts`

Optionnel selon implementation :

- `app/dashboard/meetings/MeetingsWeekView.tsx`
- `app/dashboard/meetings/UpcomingMeetingsCard.tsx`

---

## Critères de validation

- [x] Les rendez-vous Calendly sont lisibles dans l'app via Google Sheets
- [x] La page `Meetings` affiche les RDV de la semaine sans erreur
- [x] Chaque meeting affiche au moins date, heure, prospect, statut et campagne
- [x] Un clic permet d'ouvrir la fiche lead si `lead_id` est connu
- [x] La sidebar donne acces au module
- [x] Aucun bouton de creation / edition / replanification n'est propose

---

## Dépendances

### Bloqué par

- Aucune dependance applicative stricte

### Bloque

- `TASK-028` — Onglet Data business + marketing + commercial
- `TASK-029` — Timeline conversations unifiee sur fiche lead

---

## Notes

L'objectif n'est pas de repliquer Calendly. Il faut juste donner a Flinty une **vue commerciale exploitable** des rendez-vous lies a la prospection, avec contexte campagne + lead.
