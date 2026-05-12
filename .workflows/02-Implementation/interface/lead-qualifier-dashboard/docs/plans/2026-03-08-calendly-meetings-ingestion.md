# Calendly Meetings Ingestion

**Date:** 2026-03-08
**Status:** Défini
**Scope:** TASK-027

## Objectif

Alimenter l'onglet Google Sheets `Meetings` depuis Calendly via un flux simple, fiable et lisible par le dashboard Next.js.

## Flux recommandé

`Calendly webhook -> n8n staging -> Google Sheets (Meetings) -> /api/meetings -> /dashboard/meetings`

## Structure cible du sheet `Meetings`

```txt
meeting_id | lead_id | campaign_id | source | title | start_at | end_at | timezone | status | booking_url | attendee_name | attendee_email | metadata
```

## Webhook attendu

- Source: Calendly
- Type recommandé: création / mise à jour / annulation d'event invitee
- Format stocké:
  - `meeting_id`: identifiant unique Calendly event / invitee
  - `lead_id`: résolu par matching email vers `Leads_Qualified`
  - `campaign_id`: récupéré depuis le lead si matching réussi
  - `source`: `calendly`
  - `title`: nom de l'event ou type de meeting
  - `start_at`, `end_at`, `timezone`: dates ISO
  - `status`: `scheduled`, `cancelled`, `completed`, `no_show`
  - `booking_url`: URL Calendly / event
  - `attendee_name`, `attendee_email`: données participant
  - `metadata`: JSON sérialisé brut utile au debug

## Logique n8n recommandée

1. Recevoir le webhook Calendly.
2. Extraire l'email du participant.
3. Chercher une ligne correspondante dans `Leads_Qualified`.
4. Déduire `lead_id` et `campaign_id` si le lead existe.
5. Upsert dans `Meetings` par `meeting_id`.
6. Conserver `metadata` pour faciliter le debug si le matching lead échoue.

## Règles produit

- Lecture seule uniquement dans le CRM.
- Aucun bouton de création, replanification ou annulation côté UI.
- Si le matching lead/campagne échoue, le meeting reste visible avec contexte partiel.
- Si Calendly ou n8n est indisponible, l'UI continue de fonctionner avec les dernières données du sheet.

## Vérification manuelle

1. Déclencher un booking test Calendly.
2. Vérifier qu'une ligne apparaît dans `Meetings`.
3. Vérifier la présence de `lead_id` et `campaign_id` si l'email existe déjà.
4. Ouvrir `/dashboard/meetings` et contrôler la semaine courante.
