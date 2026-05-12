# Task v4-034 : API publique + webhooks CRM (HubSpot/Pipedrive)
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — routes API Next.js + documentation.

## Context
Pour les clients agence Kames qui utilisent un CRM, Flinty doit pouvoir envoyer des événements (lead qualifié, meeting booké) vers HubSpot ou Pipedrive. API publique légère avec webhooks outbound configurables par workspace.

**Références** : PRD-v4 F13 (API publique) · ARCHI-v4 §Phase 3

## Objective
API publique REST + webhooks CRM outbound configurables par workspace.

## Requirements

### Must Have
- [ ] Route `POST /api/public/leads` — créer/mettre à jour un lead via API key workspace
- [ ] Route `GET /api/public/campaigns` — lister campagnes du workspace
- [ ] Route `GET /api/public/meetings` — lister meetings bookés
- [ ] Auth : API key par workspace (table `ApiKeys` dans Index ou champ dans Workspaces)
- [ ] Webhooks outbound : champ `crm_webhook_url` dans Config enfant + `crm_events: ['lead_qualified', 'meeting_booked']`
- [ ] Sur `lead.statut=qualified` → POST vers `crm_webhook_url` avec payload standardisé HubSpot-compatible
- [ ] Sur `meeting.status=booked` → POST vers `crm_webhook_url`
- [ ] Documentation API (fichier `docs/api-public.md`)

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
- [ ] `GET /api/public/meetings` avec API key valide → liste meetings workspace
- [ ] `GET /api/public/meetings` avec API key invalide → 401
- [ ] Webhook CRM déclenché sur meeting_booked → reçu côté requestbin/webhook.site test
- [ ] Données workspace A non accessibles avec API key workspace B

## Dependencies
**Blocked By**: v4-030 (Workspaces), v4-028 (Phase 2 stable)

## Complexity & Estimates
Medium · 5h · Risk: Low (API simple, pas d'OAuth complexe)
