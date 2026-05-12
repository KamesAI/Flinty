# Task v4-002 : Étendre schéma GSheets — tabs Conversations, Email_Health, Meetings + colonnes Leads_Qualified v4 + Config v4
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — migration schema GSheets via googleapis SDK + script à exécuter.

## Context
v4 ajoute la bidirectionnalité (inbound replies) et le multi-canal. Le schéma GSheets existant doit être étendu sans casser les données v3. Les nouveaux onglets `Conversations`, `Meetings`, `Email_Health` sont nécessaires avant de pouvoir coder le Setter.

**Références** : ARCHI-v4 §Database v4

## Objective
GSheet maître Index et GSheets enfants étendus avec les nouveaux onglets et colonnes v4. Script de migration idempotent (ne casse pas les feuilles existantes).

## Requirements

### Must Have
**Index (maître)** :
- [ ] Tab `Campagnes` : ajouter 4 colonnes → `setter_enabled`, `setter_validation`, `li_account_id`, `calendly_event_uri`
- [ ] Tab `Email_Health` NEW : créer avec colonnes `domain | sent_today | bounce_rate_7d | complaint_rate_7d | last_mail_tester_score | last_check_at | status`
- [ ] Tab `Accounts` NEW : créer avec colonnes `account_id | type | provider | unipile_id | status | connected_at | workspace_id`

**Enfant (1 par campagne existante)** :
- [ ] Tab `Leads_Qualified` : ajouter 5 colonnes → `linkedin_url | source_channel | statut_li | reply_intent | reply_at`
- [ ] Tab `Conversations` NEW : créer avec colonnes `turn_id | lead_id | channel | role | content | sent_at | intent | validated_by | edited_from_draft`
- [ ] Tab `Meetings` NEW : créer avec colonnes `meeting_id | lead_id | calendly_uri | start_at | event_type | booked_via | status`
- [ ] Tab `Config` : ajouter lignes → `setter_enabled | setter_validation | setter_tone | setter_signature | calendly_event_uri | li_caps_daily`

### Must NOT
- Ne pas supprimer de colonnes ou tabs existants
- Ne pas modifier l'ordre des colonnes v3 existantes (append uniquement)
- Script idempotent : relancer = no-op si déjà fait

## Technical Approach

Script `scripts/migrate-sheets-v4.ts` :
```typescript
// Pour l'Index :
// 1. Lire headers tab Campagnes → append colonnes manquantes uniquement
// 2. Créer tab Email_Health si n'existe pas → insérer row header
// 3. Créer tab Accounts si n'existe pas → insérer row header

// Pour chaque enfant (lire liste depuis Index tab Campagnes, colonne sheet_id) :
// 1. Lire headers Leads_Qualified → append colonnes manquantes
// 2. Créer tab Conversations si n'existe pas → insérer row header
// 3. Créer tab Meetings si n'existe pas → insérer row header
// 4. Lire Config tab → append lignes manquantes avec valeurs par défaut
//    setter_enabled=FALSE, setter_validation=TRUE, setter_tone=formal, setter_signature=Thomas, calendly_event_uri='', li_caps_daily=20
```

Exécuter : `npx ts-node scripts/migrate-sheets-v4.ts`

## Acceptance Criteria
- [ ] Index : tab `Email_Health` existe avec headers corrects
- [ ] Index : tab `Accounts` existe avec headers corrects
- [ ] Index : tab `Campagnes` contient les 4 nouvelles colonnes
- [ ] Pour 1 enfant test : tabs `Conversations` et `Meetings` créés
- [ ] Pour 1 enfant test : `Leads_Qualified` contient 5 nouvelles colonnes
- [ ] Pour 1 enfant test : `Config` contient les nouvelles clés avec valeurs par défaut
- [ ] Script relancé 2x = aucun doublon, aucune erreur

## Dependencies
**Blocked By**: v4-001 (pour `CALENDLY_EVENT_TYPE_URI` valeur par défaut dans Config)

## Complexity & Estimates
Medium · 2h · Risk: Medium (opération sur données prod — tester sur copie d'abord)
