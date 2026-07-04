# API publique Flinty (v4-034)

API REST légère pour les clients agence : lecture campagnes/meetings et injection de leads, plus webhooks CRM outbound (HubSpot/Pipedrive-compatibles).

## Authentification

Chaque requête porte le header `x-api-key`. Les clés vivent dans l'onglet **`ApiKeys`** du GSheet Index :

| api_key | workspace_id | label | created_at |
|---|---|---|---|
| `fk_live_…` | `kames-default` | Clé HubSpot client X | 2026-07-04 |

- Clé absente ou inconnue → **401**.
- Une clé ne voit **que** les campagnes/meetings de son `workspace_id` (isolation stricte, testée).
- Créer une clé = ajouter une ligne dans l'onglet (générer une chaîne aléatoire longue, préfixe conseillé `fk_live_`).

## Endpoints

### `GET /api/public/campaigns`

Liste les campagnes du workspace. Ne retourne jamais `sheet_id`/`sheet_url`.

```bash
curl -H "x-api-key: $FLINTY_API_KEY" https://flinty.vercel.app/api/public/campaigns
```

```json
{
  "workspace_id": "kames-default",
  "campaigns": [
    { "campaign_id": "cmp_a", "nom": "Agences B2B", "statut": "active",
      "total_leads_qualified": "12", "emails_envoyés": "34", "taux_réponse": "8%" }
  ]
}
```

### `GET /api/public/meetings`

Liste les meetings (tab `Meetings` Index) des campagnes du workspace.

```bash
curl -H "x-api-key: $FLINTY_API_KEY" https://flinty.vercel.app/api/public/meetings
```

### `POST /api/public/leads`

Ajoute un lead dans `Leads_Raw` du GSheet enfant d'une campagne du workspace. Le lead entre ensuite dans le pipeline normal (qualification WF2, enrichissement).

```bash
curl -X POST -H "x-api-key: $FLINTY_API_KEY" -H "Content-Type: application/json" \
  -d '{"campaign_id":"cmp_a","lead":{"nom":"Acme Corp","site":"https://acme.fr","ville":"Paris","téléphone":"0102030405"}}' \
  https://flinty.vercel.app/api/public/leads
```

- `campaign_id` + `lead.nom` requis → sinon **400**.
- Campagne d'un autre workspace → **404** (pas de fuite d'existence).
- Succès → **201** `{ "success": true, "lead_id": "api_…" }`.
- Limitation : `Leads_Raw` ne porte pas d'email — l'email est produit par l'enrichissement WF2.

## Webhooks CRM outbound

Configuration par campagne dans la **Config enfant** :

| param_key | param_value |
|---|---|
| `crm_webhook_url` | `https://hooks.example.com/…` |
| `crm_events` | `lead_qualified,meeting_booked` |

Événements envoyés (POST JSON, payload HubSpot-compatible) :

- `lead_qualified` — au callback `qualification-complete` de WF2, un event **par lead qualifié** du tab `Leads_Qualified` (pas de déduplication entre callbacks : côté CRM, upserter sur `lead.email`).
- `meeting_booked` — quand le polling Calendly crée un meeting.

```json
{
  "event": "lead_qualified",
  "timestamp": "2026-09-15T14:32:00Z",
  "workspace_id": "kames-default",
  "campaign_id": "cmp_a",
  "lead": {
    "email": "prospect@company.com",
    "name": "Jean Dupont",
    "score": 87,
    "company": "acme.fr",
    "linkedin_url": ""
  }
}
```

Les envois sont fire-and-forget : un CRM en panne ne casse jamais le pipeline Flinty.

## Code

- `lib/public-api.ts` — parsing clés, isolation workspace, payloads CRM (pur, testé).
- `lib/public-api-server.ts` — résolution `x-api-key` → workspace (Sheets).
- `lib/crm-notify.ts` — déclencheurs `lead_qualified` / `meeting_booked`.
- `app/api/public/{campaigns,meetings,leads}/route.ts` — endpoints.
- Tests : `lib/public-api.test.ts`, `lib/crm-notify.test.ts`, `app/api/public/public-routes.test.ts`.
