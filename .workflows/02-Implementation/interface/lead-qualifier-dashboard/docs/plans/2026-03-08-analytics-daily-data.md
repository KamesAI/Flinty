# Analytics Daily Data

**Date:** 2026-03-08
**Status:** Défini
**Scope:** TASK-028

## Objectif

Créer une base analytique légère dans Google Sheets pour alimenter l'onglet `Data` du CRM sans attendre une base SQL.

## Onglet cible

`Analytics_Daily`

## Structure minimale

```txt
snapshot_date | campaign_id | campaign_status | leads_raw | leads_qualified | emails_sent | opens | clicks | replies | meetings | reply_rate | booking_rate | top_template | metadata
```

## Règles de remplissage

- `snapshot_date`: date du snapshot journalier au format ISO simple `YYYY-MM-DD`
- `campaign_id`: identifiant campagne CRM
- `campaign_status`: statut campagne au moment du snapshot
- `leads_raw`, `leads_qualified`, `emails_sent`, `opens`, `clicks`, `replies`, `meetings`: entiers
- `reply_rate`, `booking_rate`: pourcentages calculés ou `0` si donnée absente
- `top_template`: meilleur template connu du jour si la donnée existe, sinon vide
- `metadata`: JSON sérialisé pour conserver du contexte libre sans casser le schéma

## Usage dans l'app

- `app/dashboard/data/page.tsx` lit cette source en complément des données live
- `app/api/stats/route.ts` peut l'exploiter pour enrichir les KPIs filtrés
- si le sheet est vide, l'UI continue de fonctionner avec les données campagnes/leads/meetings existantes

## Stratégie recommandée

1. Générer un snapshot quotidien via n8n.
2. Upsert par `snapshot_date + campaign_id`.
3. Garder `top_template` et `metadata` facultatifs.
4. Ne jamais bloquer la page `Data` si le snapshot manque.
