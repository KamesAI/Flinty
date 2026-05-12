# Task v4-022 : WF9 LI Sourcing — 4 canaux → Leads_Raw + dedupe Registry étendu
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — via MCP n8n.

## Context
WF9 source des leads LinkedIn via 4 canaux Unipile : (a) search par filtres ICP, (b) likers/commenters d'un post du compte Thomas, (c) profile visitors récents, (d) likers d'un post tiers (URL externe). Tous les leads sont appended dans Leads_Raw avec dedup via Contacts_Registry (clé étendue `linkedin_url`).

**Références** : PRD-v4 F7 · ARCHI-v4 §n8n WF9

## Objective
WF9 opérationnel en staging : déclenché via route → sourcing Unipile → Leads_Raw + dedupe Registry.

## Requirements

### Must Have
- [ ] Trigger Webhook n8n `POST /flinty-wf9-li-source` — payload : `{campaign_id, channel: 'linkedin_search'|'post_engagers'|'profile_visitors'|'external_post', params}`
- [ ] Canal `linkedin_search` : params = `{title, industry, company_size, location}` → Unipile `GET /api/v1/users/search?...`
- [ ] Canal `post_engagers` : params = `{post_url}` → Unipile `GET /api/v1/posts/{id}/engagers`
- [ ] Canal `profile_visitors` : aucun param → Unipile `GET /api/v1/users/{account_id}/visitors`
- [ ] Canal `external_post` : params = `{post_url}` — idem post_engagers mais URL externe
- [ ] Chaque lead extrait : `{name, linkedin_url, title, company}` → check Contacts_Registry (clé=linkedin_url) → si absent : append Leads_Raw avec `source_channel=linkedin_search|...`
- [ ] Cap 100 leads/run (éviter flood)

### Must NOT
- Ne pas re-sourcer un profil déjà en Contacts_Registry pour cette campagne (dedup strict)
- Ne pas inclure des profils LI sans `linkedin_url` (clé de dedup)

## Technical Approach

Nodes WF9 :
1. `Webhook` (POST /flinty-wf9-li-source)
2. `Switch` node sur `channel`
3. `HTTP Request` Unipile (adapté par canal)
4. `Code` : extract profiles → array `{name, linkedin_url, title, company}`
5. `Google Sheets` read Contacts_Registry → filter déjà présents
6. `Loop` sur nouveaux profils → append Leads_Raw + append Contacts_Registry
7. `Limit` 100 items max

## Acceptance Criteria
- [ ] WF9 déclenché avec channel=linkedin_search → ≥5 profils dans Leads_Raw en staging
- [ ] Dedup : relancer WF9 même params → 0 nouveaux doublons dans Leads_Raw
- [ ] Tab Contacts_Registry étendu avec `linkedin_url` des nouveaux leads
- [ ] Cap 100 leads/run respecté

## Dependencies
**Blocked By**: v4-020 (lib/unipile.ts), v4-021 (account_id disponible)

## Complexity & Estimates
High · 6h · Risk: Medium (4 canaux Unipile à tester)
