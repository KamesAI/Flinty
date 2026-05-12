# Flinty v3.2 — Artemis-inspired features

> Source : analyse compétitive BrandJet AI (Artemis private beta), 2026-05-04
> Objectif : 5 features Groupe A pour démarrer campagnes avec visibilité complète

---

## Ordre d'implémentation

```
Semaine 1 :  F1 (stats enrichies)  +  F2 (AI briefing)
Semaine 2 :  F4 (pipeline stages)  +  F3 (reply categorization)
Semaine 3 :  F5 (unified inbox)
```

---

## F1 — Stats enrichies

**Durée : ~1 jour | Complexité : Faible**

Ajouter Reply Rate + Positive Reply Rate dans le header campagne.

### Data

Data déjà dans GSheet `Leads_Qualified`, colonne `email_status` :

```
Reply Rate        = count(email_status=replied) / count(email_status != new)
Positive Reply Rate = count(reply_category=interested) / count(email_status=replied)
                    → useful only after F3 (reply_category) is live
                    → afficher N/A jusqu'à F3
```

### Fichiers

| Fichier | Modification |
|---|---|
| `lib/campaigns.ts` | Ajouter calcul `reply_rate` + `positive_reply_rate` dans `getCampaignStats()` |
| `app/api/campaigns/[id]/route.ts` | Exposer les 2 nouveaux champs dans la réponse GET |
| `app/dashboard/campaigns/[campaign_id]/CampaignStatsHeader.tsx` | Afficher 2 nouvelles stats cards |

### Tests

- `app/api/campaigns/[id]/route.test.ts` : vérifier que `reply_rate` est calculé correctement
- `CampaignStatsHeader.test.tsx` : vérifier rendu des nouvelles stats

---

## F2 — AI Briefing widget

**Durée : ~1-2 jours | Complexité : Faible**

Widget sur `/dashboard` home. Claude (Sonnet 4.5 via OpenRouter) génère chaque matin un résumé opérationnel des campagnes actives.

### Flux

```
GET /api/briefing
  1. lib/campaigns.ts → getActiveCampaignsStats() [toutes campagnes status=active]
  2. lib/openrouter.ts → appel Claude Sonnet 4.5
  3. lib/cache.ts → cache 24h, clé: "briefing-YYYY-MM-DD"
  → retourne: { summary: string, next_action: string, urgency: "low" | "medium" | "high" }
```

### Prompt Claude

```
Tu es Flinty AI, assistant de prospection cold email.
Voici les stats des campagnes actives : [JSON stats].
En 2-3 phrases maximum, résume l'état des campagnes.
Identifie la prochaine action la plus impactante.
Réponds en JSON : { summary, next_action, urgency }.
```

### Fichiers nouveaux

| Fichier | Rôle |
|---|---|
| `app/api/briefing/route.ts` | GET handler, agrège stats + appelle Claude + cache |
| `app/dashboard/FlintyBriefing.tsx` | Server Component, fetch `/api/briefing`, affiche widget |

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `lib/campaigns.ts` | Ajouter `getActiveCampaignsStats()` agrégée toutes campagnes |
| `app/dashboard/page.tsx` | Intégrer `<FlintyBriefing />` en haut du dashboard |

### UI widget

```
┌─────────────────────────────────────────────────────┐
│ ✦ Flinty Briefing                        [urgency]  │
│                                                     │
│ [summary 2-3 phrases]                               │
│                                                     │
│ → Next action : [next_action]                       │
│                              Mis à jour il y a Xh   │
└─────────────────────────────────────────────────────┘
```

Couleurs urgency : `low` = gris, `medium` = bleu `hsl(var(--primary))`, `high` = orange/rouge

---

## F3 — Reply categorization (IA auto)

**Durée : ~3-4 jours | Complexité : Moyenne**

Catégoriser automatiquement les réponses des prospects via Claude.

### Problème central

Flinty voit le statut email (replied) via Resend webhooks mais **pas le contenu**. Solution : étendre n8n WF4.

### Architecture choisie : extension WF4

```
Prospect répond à l'email
  → Resend inbound webhook (ou email forward → n8n)
  → n8n WF4 : capture body + lead_id + campaign_id
  → Claude (OpenRouter) : analyse → interested / not_interested / out_of_office / neutral
  → Update GSheet Leads_Qualified :
      colonne reply_category    ← interested | not_interested | out_of_office | neutral
      colonne reply_snippet     ← 200 premiers caractères
  → (optionnel) POST /api/campaigns/{id}/reply-categorized pour invalider cache
```

### GSheet

Ajouter 2 colonnes dans `Leads_Qualified` :
- `reply_category` : `interested | not_interested | out_of_office | neutral`
- `reply_snippet` : string 200 chars max

### UI

Badge coloré sur cards kanban colonne `replied` :

```
🟢 Interested    🔴 Not interested    ⚪ Out of office    ◽ Neutral
```

### Fichiers

| Fichier | Modification |
|---|---|
| `lib/qualified-leads.ts` | Ajouter champs `reply_category` + `reply_snippet` dans type `QualifiedLead` |
| `app/dashboard/campaigns/[campaign_id]/KanbanBoard.tsx` | Afficher badge catégorie sur cards colonne replied |
| `app/api/campaigns/[id]/reply-categorized/route.ts` | POST handler pour invalider cache depuis n8n |
| n8n WF4 | Étendre pour capturer content + appel Claude catégorisation |

### Prérequis config email inbound

Option A — Resend Inbound (si disponible sur le plan) : routing email → webhook n8n
Option B — Email forwarding : adresse de forwarding → n8n webhook (plus simple)

---

## F4 — Pipeline stages custom

**Durée : ~2 jours | Complexité : Moyenne**

Statut commercial par lead, **orthogonal** au kanban outreach.

Kanban = statut outreach (new → replied → bounced)
Pipeline = statut commercial (New Lead → Won/Lost)

### Valeurs

```
new_lead | in_discussion | meeting_booked | won | lost | paused
```

### GSheet

Ajouter colonne `pipeline_stage` dans `Leads_Qualified` (défaut : `new_lead`)

### API

```
PATCH /api/campaigns/[id]/leads/[lead_id]
  body: { pipeline_stage: "meeting_booked" }
  → update GSheet Leads_Qualified ligne correspondante
  → invalider cache lead
```

### UI

- **Fiche lead** (`/dashboard/campaigns/[id]/leads/[lead_id]/page.tsx`) : dropdown pipeline stage
- **Card kanban** : badge pipeline stage (petit, discret, couleur par statut)

### Fichiers

| Fichier | Modification |
|---|---|
| `lib/qualified-leads.ts` | Ajouter champ `pipeline_stage` dans type `QualifiedLead` |
| `app/api/campaigns/[id]/leads/[lead_id]/route.ts` | Ajouter handler PATCH |
| `app/dashboard/campaigns/[campaign_id]/leads/[lead_id]/page.tsx` | Dropdown pipeline stage |
| `app/dashboard/campaigns/[campaign_id]/KanbanBoard.tsx` | Badge pipeline sur cards |

---

## F5 — Unified Inbox

**Durée : ~1 semaine | Complexité : Haute**

Voir les vraies réponses email dans Flinty, par campagne.

### Architecture : n8n WF4 → GSheet tab `Leads_Inbox`

```
Prospect répond
  → n8n WF4 (étendu depuis F3)
  → écrit dans GSheet enfant, nouvel onglet "Leads_Inbox"
      lead_id | lead_name | from_email | subject | body_snippet | received_at | category | read

Flinty :
  GET /api/campaigns/[id]/inbox
    → lit GSheet onglet Leads_Inbox
    → retourne messages triés par received_at DESC

UI : /dashboard/campaigns/[id]/inbox
  → liste messages : avatar + nom + snippet + date + badge catégorie
  → clic → fiche lead complète
```

### GSheet `Leads_Inbox` tab (par feuille enfant)

```
lead_id | lead_name | from_email | subject | body_snippet | received_at | category | read
```

### Note migration

Nouveau tab à créer dans les GSheets existants → script migration ou création lazy au premier message reçu.

### Fichiers nouveaux

| Fichier | Rôle |
|---|---|
| `lib/inbox.ts` | `getInboxMessages(campaignId)`, `markAsRead(messageId)` |
| `app/api/campaigns/[id]/inbox/route.ts` | GET (liste) + PATCH (mark as read) |
| `app/dashboard/campaigns/[campaign_id]/inbox/page.tsx` | Page inbox par campagne |

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `app/dashboard/campaigns/[campaign_id]/CampaignsSubNav.tsx` | Ajouter lien "Inbox" avec badge count non-lus |
| n8n WF4 | Écriture dans `Leads_Inbox` (réutilise logique F3) |

### Dépendance

F5 réutilise le pipeline email inbound configuré en F3. Implémenter F3 AVANT F5.

---

## Récap fichiers touchés

```
lib/
  campaigns.ts              ← F1 + F2
  qualified-leads.ts        ← F3 + F4
  inbox.ts                  ← F5 (nouveau)
  openrouter.ts             ← F2 (prompt briefing)
  cache.ts                  ← F2 (cache 24h)

app/api/
  briefing/route.ts         ← F2 (nouveau)
  campaigns/[id]/route.ts   ← F1
  campaigns/[id]/leads/[lead_id]/route.ts  ← F4 (PATCH)
  campaigns/[id]/reply-categorized/route.ts ← F3 (nouveau)
  campaigns/[id]/inbox/route.ts  ← F5 (nouveau)

app/dashboard/
  page.tsx                  ← F2 (intégration widget)
  FlintyBriefing.tsx        ← F2 (nouveau)
  campaigns/[campaign_id]/
    CampaignStatsHeader.tsx ← F1
    KanbanBoard.tsx         ← F3 + F4 (badges)
    CampaignsSubNav.tsx     ← F5 (lien inbox)
    leads/[lead_id]/page.tsx ← F4 (dropdown pipeline)
    inbox/page.tsx          ← F5 (nouveau)

n8n WF4                     ← F3 + F5
```
