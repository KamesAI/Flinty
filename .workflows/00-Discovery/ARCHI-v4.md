# Technical Architecture : Flinty v4

> Version 4.0 — 2026-05-04
> Basé sur `PRD-v4.md` v4 (4 mai 2026)
> Successeur direct : `ARCHI-v3.md` (archivé)

---

## Architecture Overview

**Architecture Philosophy v4**
v3 a posé l'**isolation par campagne** (1 GSheet enfant + Index) et l'**enrichissement IA** (Claude Opus 14 champs). v4 ajoute **deux dimensions** :

1. **Bidirectionnel** : v3 = outbound only. v4 = outbound + inbound. Chaque thread devient un objet conversation persistant (tab `Conversations` enfant) avec turns email/LI mélangés et state machine intent.
2. **Multi-canal** : email (Resend, conservé) + LinkedIn (Unipile, NEW). Sourcing élargi (Maps + LI search + LI signals + post engagers).

Le moteur central v4 = **AI Setter** : pipeline 5 étages (détection → classification intent → génération → tool calls Calendly → escalade conditionnelle) découplé du canal. Email Phase 1 → LI Phase 2 réutilise le même module `lib/setter.ts`.

**Tech Stack Summary v4 (deltas vs v3 en gras)**
- **Framework** : Next.js 15 App Router, TypeScript (inchangé)
- **Déploiement** : Vercel (inchangé)
- **Base de données** : Google Sheets v4 — schéma étendu (cf. §Database v4)
- **Automatisation** : n8n self-hosted Hetzner — **WF7-WF11 NEW**
- **Email** : Resend (inchangé)
- **LinkedIn** : **Unipile API (NEW — hosted auth, multi-comptes, webhooks)**
- **Calendar** : **Calendly v2 API + webhooks (NEW)**
- **IA Setter** : **Claude Sonnet 4.6** (latence + reasoning + tool calling). Fallback Opus 4.6.
- **IA scoring + ICP** : Claude Opus 4.6 (inchangé v3)
- **Pacing** : **lib/pacing.ts (NEW) — délais Gauss + caps + typing speed sim**

---

## Frontend Architecture (v4 deltas)

### Structure fichiers (deltas)

```
app/
├── dashboard/
│   ├── inbox/                                ← REFONTE v4
│   │   ├── page.tsx                          → Tabs: à valider | à répondre | bookings
│   │   ├── [thread_id]/page.tsx              → Thread détail timeline cross-canal
│   │   └── components/
│   │       ├── ConversationThread.tsx        → Timeline unifiée email + LI
│   │       ├── SetterDraftCard.tsx           → Draft + actions valider/éditer/escalader
│   │       └── CalendlyEmbed.tsx             → Affichage slots proposés
│   ├── campaigns/[campaign_id]/
│   │   └── settings/page.tsx                 ← NEW v4 : toggle setter_validation, ton, signature
│   ├── settings/
│   │   └── linkedin/
│   │       └── connect/page.tsx              ← NEW v4 : connexion Unipile
│   └── meetings/page.tsx                     ← Étend v3 : multi-canal + filtre source
├── api/
│   ├── replies/                              ← NEW v4
│   │   ├── [lead_id]/route.ts                → GET thread complet
│   │   ├── [lead_id]/send/route.ts           → POST envoie draft validé
│   │   └── [lead_id]/escalate/route.ts       → POST marque escalated
│   ├── setter/
│   │   ├── classify/route.ts                 ← NEW v4 : classify intent (interne, appelé par WF7)
│   │   └── generate/route.ts                 ← NEW v4 : génère réponse Setter
│   ├── calendly/
│   │   ├── slots/route.ts                    ← NEW v4 : GET 3 slots dispo
│   │   └── webhook/route.ts                  ← NEW v4 : invitee.created
│   ├── unipile/
│   │   ├── callback/route.ts                 ← NEW v4 : OAuth-like callback
│   │   ├── webhook/route.ts                  ← NEW v4 : message.received, invitation.accepted
│   │   └── status/route.ts                   ← NEW v4 : connection health
│   └── linkedin/
│       └── source/route.ts                   ← NEW v4 : déclenche WF9 sourcing
└── lib/
    ├── setter.ts                              ← NEW v4 : prompt builder + intent classifier + response generator
    ├── unipile.ts                             ← NEW v4 : client Unipile + retries
    ├── calendly.ts                            ← NEW v4 : client Calendly + slots formatter
    ├── pacing.ts                              ← NEW v4 : délais + typing speed sim + caps
    └── conversations.ts                       ← NEW v4 : helpers tab Conversations (read/append turn)
```

---

## Backend Architecture

### Database v4 — schéma Sheets étendu

#### GSheet maître "Flinty Index" (deltas v4)

```
Onglet : Campagnes  ← 17 colonnes (+4 vs v3)
─────────────────────────────────────────────────────
… (13 colonnes v3) +
setter_enabled | setter_validation | li_account_id | calendly_event_uri

Onglet : Contacts_Registry  ← clé étendue
─────────────────────────────────────────────────────
key (= domain OU linkedin_url) | last_contacted_at | campaign_id | statut | channel

Onglet : Accounts  ← NEW v4
─────────────────────────────────────────────────────
account_id | type (linkedin|email|calendly) | provider | unipile_id
status (connected|expired|banned|paused_warning|paused_captcha|paused_low_accept) | connected_at | workspace_id

Onglet : LI_Health  ← NEW v4 (anti-ban monitor — cf. F14)
─────────────────────────────────────────────────────
account_id | accept_rate_7d | invits_sent_today | invits_sent_week
captcha_count | last_warning_at | last_health_check_at | status

Onglet : Email_Health  ← NEW v4 (deliverability monitor — cf. F15)
─────────────────────────────────────────────────────
domain | sent_today | bounce_rate_7d | complaint_rate_7d
last_mail_tester_score | last_check_at | status
status: active | paused_high_bounce | paused_high_complaint

Onglet : Workspaces  ← NEW v4 (Phase 3)
─────────────────────────────────────────────────────
workspace_id | name | owner_email | created_at
```

#### GSheet enfant (deltas v4)

```
Onglet : Leads_Qualified  ← +5 colonnes vs v3 (26 cols)
─────────────────────────────────────────────────────
… (21 cols v3) +
linkedin_url | source_channel | statut_li | reply_intent | reply_at

statut_li : new | invited | accepted | dm_sent | dm_replied | converted | rejected
source_channel : maps | linkedin_search | post_engagers | profile_visitors | external_post

Onglet : Conversations  ← NEW v4 (cross-canal)
─────────────────────────────────────────────────────
turn_id | lead_id | channel (email|linkedin) | role (prospect|setter|human)
content | sent_at | intent | validated_by | edited_from_draft

Onglet : Meetings  ← NEW v4 (étend v3)
─────────────────────────────────────────────────────
meeting_id | lead_id | calendly_uri | start_at | event_type
booked_via (setter|manual) | status (booked|no_show|completed|cancelled)

Onglet : Config  ← +5 lignes
─────────────────────────────────────────────────────
… (lignes v3) +
setter_enabled | setter_validation | setter_tone (formal|casual)
setter_signature | calendly_event_uri | li_caps_daily
```

### API Routes v4 (deltas)

| Route | Méthode | Description |
|---|---|---|
| `/api/replies/[lead_id]` | GET | Thread complet cross-canal (Conversations enfant) |
| `/api/replies/[lead_id]/send` | POST | Envoie draft Setter validé (déclenche WF8) |
| `/api/replies/[lead_id]/escalate` | POST | Marque escalated, retire de queue auto |
| `/api/setter/classify` | POST | Interne : classify intent via Claude Sonnet (utilisé WF7) |
| `/api/setter/generate` | POST | Interne : génère réponse Setter (Mirroring + NoQuestions) |
| `/api/calendly/slots` | GET | 3 prochains slots dispo (event_type_uri en query) |
| `/api/calendly/webhook` | POST | Resend webhook invitee.created → tab Meetings |
| `/api/unipile/callback` | GET | Callback hosted auth Unipile |
| `/api/unipile/webhook` | POST | message.received + invitation.accepted |
| `/api/unipile/status` | GET | Health check connexion LI |
| `/api/linkedin/source` | POST | Déclenche WF9 sourcing (channel + params) |

---

## Automation n8n v4 — WF7 à WF11 (NEW)

| ID | Nom | Trigger | Rôle |
|---|---|---|---|
| WF7 | Setter Email Inbound | Webhook `email.replied` Resend | Classify intent → génère draft → écrit Conversations |
| WF8 | Setter Send | Webhook `/api/replies/.../send` | Envoie réponse validée via Resend ; tag Conversations `validated_by=human` |
| WF9 | LI Sourcing | Webhook `/api/linkedin/source` | Unipile search/post_engagers/visitors → Leads_Raw enfant + dedupe Registry |
| WF10 | LI Outreach | Schedule horaire | Boucle Leads_Qualified où statut_li=new → invitation Unipile (perso IA) ; webhook accepted → cold DM |
| WF11 | Setter LI Inbound | Webhook Unipile `message.received` | Pipeline Setter identique WF7 mais channel=linkedin |
| WF13 | Email Health Monitor | Webhook Resend `email.bounced` + `email.complained` + cron 1h | Update tab `Email_Health` ; auto-pause domaine si seuils dépassés ; alerte UI + email Thomas |

### WF6 stats étendu
- + colonnes Index : `meetings_booked`, `setter_response_rate`, `li_accept_rate`, `cost_per_meeting`
- Loop Conversations enfant pour calculer ratios

### WF1–WF6 inchangés (hors WF6 stats)

---

## AI Setter — Module détaillé

### Pipeline (lib/setter.ts)

```
input: { thread: Turn[], lead: Lead, campaign: Campaign, channel: 'email'|'linkedin' }

step 1 — buildContext(lead, campaign)
  → ICP md + offre + ton + signature + lead enrichi 14 champs + thread historique
  → cache prompt (Anthropic prompt caching) sur ICP+offre par campaign_id

step 2 — classifyIntent(thread)
  → Claude Sonnet 4.6, JSON mode
  → returns { intent: enum, confidence: number, reasoning: string }
  → enum: interested | objection_price | objection_timing | objection_need | objection_trust
          | meeting_ready | off_topic | unsubscribe | hostile

step 3 — routeAction(intent)
  → IF unsubscribe → tag, opt-out registry, stop
  → IF hostile|off_topic → escalate human queue
  → ELSE → generateResponse

step 4 — generateResponse(intent, context)
  → Claude Sonnet 4.6 + system prompt :
      "Tu es [signature]. Applique Voss mirroring (reformule 1-3 mots clés du prospect).
       Une seule No-Oriented Question si objection. Ton miroir prospect.
       ≤120 mots. Pas de templates. Pas de jargon. Si intent=meeting_ready, propose 3 slots."
  → IF intent=meeting_ready → tool call get_calendly_slots(event_uri)
                              → insère slots format naturel
  → IF intent=objection_trust → fallback Claude Opus 4.6 (raisonnement long)
  → returns { content: string, tool_calls: any[] }

step 5 — persistTurn(content, validated)
  → append tab Conversations { turn, role: 'setter', content, validated_by: null }
  → IF setter_validation_required → status='draft' (UI queue)
  → ELSE → WF8 send + status='sent_auto'
```

### Prompt caching strategy
- **Cached** : ICP md + offre + signature + ton (par campagne, TTL Anthropic 5 min)
- **Cached** : techniques Voss + format response (system, global)
- **Not cached** : thread historique + lead spécifique (varie chaque appel)
- **Économie estimée** : ~70% tokens en lecture sur calls successifs même campagne

### Escalation rules
- 2x échecs Setter (Claude refuse / JSON invalide) → escalade auto
- Prospect demande explicite « êtes-vous une IA ? » → forced validation + disclaimer
- Intent confidence <0.7 → forced validation
- Off-topic > 3 messages → escalade

---

## Intégrations tierces v4

### Unipile (NEW v4)
- **Usage** : LinkedIn DM + invitations + sourcing (search, post engagers, profile visitors)
- **Auth** : Hosted auth flow (redirect → callback → store account_id)
- **Coût** : ~$59/mois/compte (Cloud) — couvert par tier Premium $147 mimikflow équivalent
- **Webhooks** : `message.received`, `invitation.accepted`, `connection.removed`
- **Env** : `UNIPILE_API_KEY`, `UNIPILE_DSN`, `UNIPILE_WEBHOOK_SECRET`
- **Risque** : ban LI résiduel — mitigé par pacing (cf. lib/pacing.ts) + résidentiel

### Calendly (NEW v4)
- **Usage** : Setter propose slots + tab Meetings via webhook
- **Auth** : Personal Access Token (MVP Phase 1) → OAuth 2.0 (Phase 3 multi-tenant)
- **Endpoints utilisés** :
  - `GET /event_type_available_times?event_type=...&start_time=...`
  - Webhook `invitee.created`
- **Env** : `CALENDLY_TOKEN`, `CALENDLY_WEBHOOK_SECRET`

### Anthropic Claude (étendu v4)
- **Sonnet 4.6** : Setter classify + generate (latence prio)
- **Opus 4.6** : v3 scoring + ICP + fallback Setter (`objection_trust`)
- **Prompt caching** : activé sur prompts système Setter
- **Env** : `ANTHROPIC_API_KEY` (inchangé), `SETTER_MODEL`, `SETTER_FALLBACK_MODEL`

### Resend (inchangé v3, étendu)
- + webhook `email.replied` → WF7
- + endpoint `POST /emails` réutilisé par WF8 (envoi draft validé)

---

## Pacing engine (lib/pacing.ts)

```ts
// Distribution Gauss délais entre actions LI
nextDelayMs(action: 'invitation' | 'dm' | 'reply') {
  const baseSec = action === 'invitation' ? 360 : action === 'dm' ? 240 : 60
  const sigma = baseSec * 0.4
  const delay = gaussRandom(baseSec, sigma)
  return Math.max(60, delay) * 1000
}

// Caps LI (sources : LinkedIn ToS 2024-2026 + Unipile recommandations)
// HARD CAP LinkedIn : 100 invitations / SEMAINE tous comptes confondus
const CAPS_DAILY_WARM = { invitations: 20, dms: 50, profile_views: 200, removals: 50 }
const CAPS_DAILY_NEW  = { invitations: 5,  dms: 20, profile_views: 50,  removals: 10 }
const CAPS_WEEKLY     = { invitations: 100 } // hard cap LinkedIn — bloque au-delà
const RAMP_UP_INVITS  = { week_1: 5, week_2: 10, week_3: 15, week_4: 20 } // /jour compte neuf <3 mois
const HUMAN_HOURS     = { start: 9, end: 19, weekdays_only: true } // pas d'action 3h du matin
const NOTE_RATIO      = { with_note: 0.6, without_note: 0.4 } // alterner pour casser pattern bot

// Caps email — délivrabilité Resend (cf. F15)
const CAPS_DAILY_EMAIL_NEW  = { sends: 20 }   // domaine <2 sem soft warm-up
const CAPS_DAILY_EMAIL_WARM = { sends: 200 }  // domaine >2 sem
const CAPS_HOURLY_EMAIL     = { sends: 50 }
const RAMP_UP_EMAIL         = { week_1: 5, week_2: 10, week_3: 15, week_4: 20 } // /jour
const EMAIL_DELAY_GAUSS     = { mu_sec: 480, sigma_sec: 180 } // 8min ± 3min entre sends même campagne
const EMAIL_HEALTH_THRESHOLDS = { bounce_max_7d: 0.05, complaint_max_7d: 0.003 }

// Typing speed simulation (pour transparence devant utilisateur, pas envoyé à LI)
typingDurationMs(text: string) {
  const wpm = 35 + gaussRandom(0, 10) // 25–45 wpm
  const words = text.split(/\s+/).length
  return Math.max(2000, (words / wpm) * 60 * 1000)
}

// Circuit breaker : checkHealth() consulte tab LI_Health avant chaque action
// → return { allowed: false, reason: 'paused_captcha' | 'paused_warning' | 'paused_low_accept' | 'cap_reached' }
```

---

## DevOps & Déploiement v4

### Variables env v4 (deltas)

```bash
# v4 NEW
UNIPILE_API_KEY=...
UNIPILE_DSN=https://api.unipile.com:13447
UNIPILE_WEBHOOK_SECRET=...
CALENDLY_TOKEN=eyJ...
CALENDLY_WEBHOOK_SECRET=...
SETTER_MODEL=claude-sonnet-4-6
SETTER_FALLBACK_MODEL=claude-opus-4-6
SETTER_VALIDATION_DEFAULT=true

# n8n webhooks v4
N8N_WF7_WEBHOOK=https://[env]-n8n.kamesai.com/webhook/flinty-wf7-setter-email
N8N_WF8_WEBHOOK=https://[env]-n8n.kamesai.com/webhook/flinty-wf8-setter-send
N8N_WF9_WEBHOOK=https://[env]-n8n.kamesai.com/webhook/flinty-wf9-li-source
N8N_WF10_WEBHOOK=https://[env]-n8n.kamesai.com/webhook/flinty-wf10-li-outreach
N8N_WF11_WEBHOOK=https://[env]-n8n.kamesai.com/webhook/flinty-wf11-setter-li
```

---

## Security Considerations v4

- [x] Hérité v3 (credentials serveur, isolation campagne)
- [ ] **Webhook signatures** : vérifier HMAC sur Resend, Calendly, Unipile (hijack risk)
- [ ] **Rate limit** Setter API routes (`/api/setter/*`) — 100 req/min max (burn tokens)
- [ ] **PII** : Conversations contient texte prospect → respect droit à l'oubli (route DELETE /lead avec purge thread)
- [ ] **Compliance EU AI Act art. 50** : disclaimer signature + forced validation si question IA détectée
- [ ] **LinkedIn ToS** : pacing strict + opt-out automatique sur intent=hostile|unsubscribe
- [ ] **Anti-ban LI** : cap hebdo 100 invits (hard LI), ramp-up compte neuf, human hours 9h–19h jour ouvré, note alternée 60/40, IP résidentielle Unipile obligatoire
- [ ] **Détection session simultanée** : compare géoloc Unipile vs login mobile Thomas → alerte/auto-pause
- [ ] **Connection-removal cap** <50/jour codé en dur (au-delà = flag LI)
- [ ] **Auto-pause sur signaux pré-ban** (cf. F14) : captcha, email LI « activité inhabituelle », acceptance <20%, bouton « Suivre » remplaçant « Se connecter »
- [ ] **Domaine outreach dédié** : `outreach.kamesai.com` isolé du principal `kamesai.com` (DNS MX/SPF/DKIM/DMARC). Soft warm-up obligatoire 2 sem avant 1ère campagne réelle (5→20 emails/jour vers contacts amis).
- [ ] **Auto-pause email** (cf. F15) : bounce_rate_7d >5% ou complaint_rate_7d >0.3% → pause campagnes domaine + alerte
- [ ] **Calendly token** : Personal Access Token MVP en env serveur uniquement ; pas exposé client

---

## Performance Optimization v4

- [ ] Prompt caching Anthropic activé (cf. setter caching strategy)
- [ ] Conversations tab paginée (≥50 turns → archivage onglet `Conversations_Archive`)
- [ ] Background job : pré-warm cache ICP par campagne au launch
- [ ] WF7 idempotent (dedup sur `message_id` Resend) — éviter double-Setter si retry n8n

---

## Open Technical Questions v4

- [ ] Stockage des drafts non validés : Conversations tab vs nouvelle tab `Drafts` séparée ?
- [ ] Multi-tenant Calendly : 1 PAT global ou 1 PAT par client agence ?
- [ ] Fallback si Unipile down : queue n8n + retry exp backoff vs alerte humaine immédiate ?
- [ ] Cap LI dynamique (ramp-up sur compte neuf : 20 → 50 → 100 sur 2 sem) ?
- [ ] Modèle latence Setter : appel direct Anthropic depuis n8n (HTTP) ou via route Next.js (cache ICP) ? Trade-off latence vs reuse cache.

---

## Migration Path v4 → v5 (futur)

| Déclencheur | Migration |
|---|---|
| >500 conversations actives simultanées | Postgres + Prisma (Conversations en table dédiée) |
| Demande agence multi-clients | Workspaces (table Index) + RBAC Better Auth |
| Volume LI >5 comptes | Plan Unipile Enterprise + dashboard santé compte |
| Latence Setter >5 sec p95 | Streaming SSE des drafts dans inbox |
| Coût LLM >$500/mois | Batch Anthropic API pour intent classify non-urgent |

---

## Next Steps (cf. tasks/v4/TASKS.md)

1. **Phase 1 (4–6 sem)** — F1-F5 Setter Email + Calendly + Inbox refonte + Validation mode
2. **Phase 2 (6–8 sem)** — F6-F9 Unipile + sourcing LI + outreach LI + Setter LI
3. **Phase 3 (4 sem)** — F10-F13 Vidéo + Workspaces + Pacing fin + Analytics avancé
