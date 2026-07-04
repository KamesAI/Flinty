# Task v4-034 : API publique + webhooks CRM (HubSpot/Pipedrive)
**Status**: 🚧 Partiel — 2026-07-04 (code + tests + doc livrés ; smoke webhook réel + clé ApiKeys réelle restent)

## Autonomie
🤖 **Claude 100%** — routes API Next.js + documentation.

## Context
Pour les clients agence Kames qui utilisent un CRM, Flinty doit pouvoir envoyer des événements (lead qualifié, meeting booké) vers HubSpot ou Pipedrive. API publique légère avec webhooks outbound configurables par workspace.

**Références** : PRD-v4 F13 (API publique) · ARCHI-v4 §Phase 3

## Objective
API publique REST + webhooks CRM outbound configurables par workspace.

## Requirements

### Must Have
- [x] Route `POST /api/public/leads` — créer un lead (append `Leads_Raw` enfant) via API key workspace
- [x] Route `GET /api/public/campaigns` — lister campagnes du workspace
- [x] Route `GET /api/public/meetings` — lister meetings bookés
- [x] Auth : API key par workspace — onglet `ApiKeys` de l'Index (`api_key, workspace_id, label, created_at`), création on-demand
- [x] Webhooks outbound : `crm_webhook_url` + `crm_events` (CSV) dans Config enfant
- [x] Sur qualification (callback WF2 `qualification-complete`) → POST par lead qualifié, payload HubSpot-compatible
- [x] Sur meeting booké (polling Calendly `processCalendlyEvent`) → POST `meeting_booked`
- [x] Documentation API (`docs/api-public.md`)

### Must NOT
- Ne pas exposer les données d'autres workspaces via l'API publique
- Pas d'intégration native HubSpot/Pipedrive SDK — webhooks generics suffisent

## Technical Approach

```typescript
// Payload webhook standardisé (HubSpot-compatible) :
{
  "event": "lead_qualified",
  "timestamp": "2026-09-15T14:32:00Z",
  "workspace_id": "kames-default",
  "campaign_id": "camp-001",
  "lead": {
    "email": "prospect@company.com",
    "name": "Jean Dupont",
    "score": 87,
    "company": "Acme Corp",
    "linkedin_url": "https://linkedin.com/in/jeandupont"
  }
}
```

```typescript
// Auth middleware API publique :
export function withApiKey(handler: RouteHandler) {
  return async (req: Request) => {
    const apiKey = req.headers.get('x-api-key')
    const workspace = await resolveWorkspaceByApiKey(apiKey)
    if (!workspace) return new Response('Unauthorized', { status: 401 })
    return handler(req, workspace)
  }
}
```

## Acceptance Criteria
- [x] `GET /api/public/meetings` avec API key valide → liste meetings workspace (test Vitest)
- [x] `GET /api/public/meetings` avec API key invalide → 401 (test Vitest)
- [ ] Webhook CRM déclenché sur meeting_booked → reçu côté requestbin/webhook.site test (**smoke réel restant** — nécessite clé ApiKeys réelle + Config crm_webhook_url en staging)
- [x] Données workspace A non accessibles avec API key workspace B (tests d'isolation A/B, campagnes + meetings + leads)

## Avancement 2026-07-04 — code + tests + doc livrés (TDD)

- `lib/public-api.ts` : constantes onglet `ApiKeys`, `parseApiKeyRows`, `resolveWorkspaceIdFromRows`, `filterCampaignsByWorkspace`, `toPublicCampaign` (jamais de `sheet_id` exposé), `filterMeetingsByWorkspace`, `parseCrmConfig`, `buildCrmPayload`, `dispatchCrmEvent` (fire-and-forget, ne throw jamais).
- `lib/sheets.ts` : `getApiKeyRows()` (ensure onglet `ApiKeys` Index + lecture).
- `lib/public-api-server.ts` : résolution `x-api-key` → workspace + réponse 401.
- `lib/crm-notify.ts` : `notifyLeadsQualifiedSafe` (branché dans `qualification-complete`) + `notifyMeetingBookedSafe` (branché dans `processCalendlyEvent`).
- Routes `app/api/public/{campaigns,meetings,leads}/route.ts`.
- Doc `docs/api-public.md` (auth, endpoints, exemples curl, config CRM, limites).
- Preuves : tests écrits avant le code (rouge confirmé) ; `npm run test` → 95 fichiers / 569 tests verts (dont 28 nouveaux) ; `npm run build` vert.
- Reste avant ✅ : créer une vraie clé dans l'onglet `ApiKeys`, smoke webhook.site réel (meeting_booked + lead_qualified), et « Phase 2 stable » (dep v4-028).

## Dependencies
**Blocked By**: v4-030 (Workspaces), v4-028 (Phase 2 stable)

## Complexity & Estimates
Medium · 5h · Risk: Low (API simple, pas d'OAuth complexe)
