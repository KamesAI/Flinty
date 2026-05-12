# Product Requirements Document : Flinty v4

> Version 4.0 — 2026-05-04
> Statut : v3 (22 TASK ✅) en staging — v4 en spécification
> Sources : `.workflows/01-Architecture/mimikflow-analysis-v4.md`, PRD-v3.md
> Successeur direct : PRD-v3.md (archivé)

---

## 1. Overview

### Problem Statement
La v3 fait du **outbound email** propre : sourcing Maps + scoring Claude 14-champs + envoi Resend + relances J+3/J+7. Mais Flinty s'arrête au reply : c'est Thomas qui doit lire chaque réponse, juger l'intent, gérer les objections, et booker manuellement. Sur 30 leads qualifiés/campagne, 5–8 replies → 1h/jour à trier. À l'inverse, des concurrents type **mimikflow.com** promettent **15 RDV/mois mains libres** via un AI Setter qui tient la conversation et propose Calendly tout seul — mais sont enfermés dans LinkedIn (pas d'email, pas de CRM, banissement risqué).

La v4 ferme la boucle : **AI Setter inbound** (email d'abord, LinkedIn ensuite) qui répond aux replies, gère les objections (Voss mirroring, No-Oriented Questions), et propose un slot Calendly quand le prospect est meeting-ready. Tout en gardant le multi-canal email + LinkedIn comme positionnement supérieur.

### Product Vision
**« Flinty — La plateforme de prospection autonome multi-canal qui sélectionne, contacte, qualifie et book vos rendez-vous, sans que vous touchiez un message. »**

Concrètement v4 ajoute à v3 :
1. **AI Setter inbound** : webhook reply → analyse intent → réponse contextuelle ou escalade humaine.
2. **Calendly natif** : proposition de slots dynamiques dans la conversation Setter.
3. **Canal LinkedIn** (Phase 2) via Unipile : sourcing (search + post engagers + visitors) + invitation + cold DM + Setter LI.
4. **Inbox unifié** email + LI : threads, validation queue, timeline cross-canal.
5. **Validation mode** par campagne / par agent / par lead.
6. **Pacing engine** anti-détection (LI critique, email best-practice).

### Target Launch Date
- **Phase 1 (Setter email)** : 4–6 semaines post v3 prod → cible **juin–juillet 2026**.
- **Phase 2 (LinkedIn)** : 6–8 semaines → cible **septembre–octobre 2026**.
- **Phase 3 (polish & scale)** : 4 semaines → cible **novembre 2026**.

---

## 2. Target Users

### Primary Persona : Thomas (Fondateur Flinty / Kames AI)
Inchangé v3 + nouveaux pains :
- **Pain v4** : « 5–8 replies/jour à trier manuellement, je perds 1h à juger l'intent et à booker → goulot d'étranglement à >5 campagnes ».
- **Goal v4** : « Lancer 10 campagnes en parallèle, recevoir uniquement les RDV bookés et les escalades — pas le bruit. »

### Secondary Persona : Client agence Kames (read + bientôt write)
- v3 : reçoit URL GSheet enfant en lecture seule.
- v4 : option d'autoriser le Setter à parler **en son nom** (signature client, Calendly client). Validation mode forcée par défaut.

### Tertiary Persona (v4 NEW) : Prospect répondant
- **Contexte** : reçoit un email Flinty, répond avec une question/objection.
- **Expérience attendue** : réponse en <5 min, ton naturel, pas perçu comme bot, dispo Calendly proposée si intéressé.
- **Article 50 EU AI Act** : si demande explicitement « êtes-vous une IA ? » → réponse honnête.

---

## 3. Core Features (v4 Scope)

### Phase 1 — AI Setter Email (P0)

#### F1 — Webhook reply Resend → analyse intent
**Description** : WF7 (n8n) reçoit les webhooks `email.replied` de Resend, charge le thread complet (email d'origine + reply), résout le `sheet_id` via Index, extrait l'historique conversation, et envoie à Claude pour classification d'intent.

**Acceptance** :
- [ ] WF7 trigger webhook Resend `email.replied`
- [ ] Résout `sheet_id` via tag `campaign_id` dans message_id
- [ ] Charge contexte : ICP campagne, offre, lead enrichi (14 champs), historique thread
- [ ] Claude Sonnet 4.6 classifie intent : `interested | objection_price | objection_timing | objection_need | objection_trust | meeting_ready | off_topic | unsubscribe | hostile`
- [ ] Écrit `reply_intent`, `reply_at`, `reply_raw` dans `Leads_Qualified` (enfant)
- [ ] Latence cible : <30 sec entre reply reçu et intent classifié

#### F2 — Setter génère réponse contextuelle
**Description** : Sur intent ≠ `unsubscribe|hostile|off_topic`, Setter génère une réponse appliquant Mirroring + No-Oriented Questions adaptés à l'objection. Réponse stockée comme draft (validation mode ON par défaut) ou envoyée auto (validation OFF).

**Acceptance** :
- [ ] Prompt Setter (SDK `@anthropic-ai/sdk`) avec système : techniques Voss, ton ICP, signature Thomas/client
- [ ] Réponse ≤120 mots, ton miroir prospect, pas de templates détectables
- [ ] Si `objection_*` → réponse handling adapté + relance question
- [ ] Si `meeting_ready` → propose 3 créneaux Calendly (voir F3)
- [ ] Stockage : tab `Conversations` (enfant) — `lead_id | turn | role | content | sent_at | validated_by | edited`
- [ ] Si validation ON → draft visible inbox, bouton « Envoyer / Éditer / Escalader »

#### F3 — Calendly intégré (proposition dynamique)
**Description** : Quand Setter détecte `meeting_ready`, il interroge l'API Calendly (event type Thomas/client) pour récupérer 3 prochains slots dispo, les insère naturellement dans la réponse, et tag le lead `meeting_proposed`. Si prospect confirme un slot, écrit dans `Meetings` tab.

**Acceptance** :
- [ ] Route `/api/calendly/slots?event_type_uri=...&count=3` retourne 3 slots ISO
- [ ] OAuth Calendly v2 (Personal Access Token MVP, OAuth full Phase 3)
- [ ] Setter insère slots format naturel : « Mardi 14h, mercredi 10h, ou jeudi 16h ? »
- [ ] Webhook Calendly `invitee.created` → écrit `Meetings` tab (date, lead_id, type)
- [ ] Lead passe statut `booked` dans Kanban

#### F4 — Inbox unifié + validation queue
**Description** : Refonte `/dashboard/inbox` v3 → 3 onglets : **À valider** (drafts Setter), **À répondre** (intent escaladé humain), **Bookings** (slots confirmés). Chaque thread : timeline complète email + actions Setter + bouton inline « Envoyer / Éditer / Escalader ».

**Acceptance** :
- [ ] Page `/dashboard/inbox` 3 tabs filtrés par état
- [ ] Composant `<ConversationThread>` avec timeline (email out → reply → Setter draft → human action)
- [ ] Validation 1-clic : POST `/api/replies/[lead_id]/send` → WF8 (envoi Resend)
- [ ] Édition inline : modale avec textarea + diff vs draft Setter
- [ ] Escalade : marque `setter_action=escalated`, retire de la queue auto

#### F5 — Validation mode (toggle par campagne et global)
**Description** : Toggle UI dans `/dashboard/campaigns/[id]/settings` → bool `setter_validation_required`. Si true, toutes les réponses Setter passent en draft. Si false, envoi auto. Override par lead si demande explicite IA.

**Acceptance** :
- [ ] Champ `setter_validation` dans onglet `Config` (enfant) — défaut `true`
- [ ] UI Settings campagne avec toggle + explainer
- [ ] WF7 lit ce flag avant d'envoyer auto
- [ ] Si prospect demande « êtes-vous une IA ? » → forced validation pour ce thread

### Phase 2 — Canal LinkedIn (P0 après Phase 1 stable)

#### F6 — Intégration Unipile (auth + multi-comptes)
**Description** : Connexion compte LI via Unipile (hosted-auth flow). Stockage credential par `account_id` dans `Config` (enfant) ou table `Accounts` (Index). Multi-comptes pour cas agence (Thomas + clients).

**Acceptance** :
- [ ] Route `/dashboard/settings/linkedin/connect` → redirect Unipile hosted auth
- [ ] Webhook callback `/api/unipile/callback` stocke `unipile_account_id`
- [ ] Variable env `UNIPILE_API_KEY`, `UNIPILE_DSN`
- [ ] Statut `connected | expired | banned` visible UI

#### F7 — Sourcing LinkedIn (4 canaux)
**Description** : WF9 sources leads LI via Unipile : (a) search par filtres ICP, (b) likers/commenters d'un post du user, (c) profile visitors récents, (d) likers d'un post tiers (URL externe). Append à `Leads_Raw` enfant avec `source_channel=linkedin_search|post_engagers|profile_visitors|external_post`.

**Acceptance** :
- [ ] WF9 endpoint webhook `flinty-wf9-sourcing` accepte `{campaign_id, channel, params}`
- [ ] Mapping ICP → Unipile search filters (titre, secteur, taille, géo)
- [ ] Dedupe via `Contacts_Registry` (clé étendue : `linkedin_url` ou `domain`)
- [ ] UI campagne : sélecteur canal + paramètres (URL post, etc.)
- [ ] Cap 100 leads/jour/canal (Pro tier mimikflow standard)

#### F8 — Outreach LinkedIn (invitation + cold DM)
**Description** : WF10 envoie invitation LI personnalisée puis, après acceptation, cold DM généré IA (réutilise `personalized_hook` v3). Pacing engine humain (cf. F12).

**Acceptance** :
- [ ] WF10 boucle `Leads_Qualified` LI où `statut_li = new`
- [ ] Envoi invitation via Unipile (note ≤300 chars, perso IA)
- [ ] Webhook `invitation.accepted` → trigger envoi cold DM (J+0 ou J+1)
- [ ] Statuts LI : `new | invited | accepted | dm_sent | dm_replied | converted | rejected`
- [ ] Templates LI éditables côté UI (Templates page enrichi avec onglet LI)

#### F9 — Setter LinkedIn (réutilise Phase 1)
**Description** : WF11 reçoit webhook Unipile `message.received`, applique pipeline Setter Phase 1 (intent → réponse → Calendly). Conversation dans tab `Conversations` enfant unifié email + LI (champ `channel`).

**Acceptance** :
- [ ] WF11 webhook Unipile message
- [ ] Pipeline Setter identique (intent classify → réponse → tab Conversations)
- [ ] Inbox unifié affiche threads cross-canal
- [ ] Calendly proposé en lien direct (LI ne supporte pas embed)

### Phase 3 — Polish & scale (P1)

#### F10 — Vidéo perso (Loom embed) [optionnel]
**Description** : Auto-trigger d'une vidéo Loom enregistrée 1x quand follow-up #4 ou demande explicite (« peux-tu m'en dire plus ? »).
**Acceptance** : embed Loom dans email HTML, lien dans LI DM.

#### F11 — Multi-comptes / agence
**Description** : Workspaces Flinty pour gérer plusieurs comptes Unipile + clients agence. Override BLOC 4 Contacts_Registry → scoped par workspace.
**Acceptance** : table `Workspaces` dans Index, scope tous les API routes.

#### F12 — Pacing engine anti-détection
**Description** : Module `lib/pacing.ts` génère délais aléatoires (Gauss centré sur 4 min entre actions LI), simule typing speed (~40 wpm avec variance), respecte caps LI : daily warm 20 invits/50 DMs/200 views, daily new 5/20/50, **weekly hard cap 100 invits (LinkedIn)**, ramp-up compte neuf 5→10→15→20 invits/jour sur 4 sem, human hours 9h–19h jours ouvrés, note alternée 60/40, removal cap 50/jour. Mix d'actions organiques (1 like + 1 view per N invits) pour casser pattern bot.
**Acceptance** : tests unitaires sur distribution Gauss + caps daily/weekly + ramp-up + human hours ; logs `pacing_decision` par action LI ; refus action si cap atteint.

#### F13 — Analytics avancé multi-canal
**Description** : Dashboard funnel par canal (email vs LI), cohorts par template, attribution RDV. Étend WF6 stats.
**Acceptance** : nouveaux KPIs dans `/dashboard/data` : `connection_rate_li`, `setter_response_rate`, `meeting_rate`, `cost_per_meeting`.

#### F14 — Health monitor LI + circuit breaker (P0 Phase 2)
**Description** : WF12 polling Unipile status + parsing inbox compte LI toutes les 10 min. Détecte signaux pré-ban → auto-pause + alerte UI + email Thomas.
- Captcha au login détecté → pause 24h, statut `paused_captcha`
- Email LinkedIn « activité inhabituelle » détecté → pause 14j, statut `paused_warning`
- Acceptance rate <20% sur 7j glissants → pause + force review ICP, statut `paused_low_accept`
- Bouton « Se connecter » remplacé par « Suivre » sur ≥3 profils → pause 7j
- Tab `LI_Health` dans Index : `account_id, accept_rate_7d, invits_sent_today, invits_sent_week, captcha_count, last_warning_at, last_health_check_at, status`
- Bandeau dashboard rouge si `status != active` avec raison + ETA reprise
**Acceptance** : tests Vitest health checks ; smoke en staging avec captcha simulé → pause + alerte ; reprise auto à expiration TTL.

#### F15 — Domaine outreach + soft warm-up + email health monitor (P0 Phase 1)
**Description** : Provisionner domaine dédié `outreach.kamesai.com` sur Resend (DNS MX/SPF/DKIM/DMARC) pour isoler la réputation cold email du domaine principal. Soft warm-up organique 2 sem avant 1ère campagne réelle (5→20 emails/jour vers contacts amis/anciens collègues, tag replies positives). Mode campagne `warmup_campaign` (bypass scoring + cap volume + tag inbox-positive). WF13 n8n monitore les webhooks Resend `email.bounced` et `email.complained` → tab `Email_Health` Index → auto-pause si `bounce_rate_7d >5%` ou `complaint_rate_7d >0.3%`. Bandeau dashboard rouge si pause active.
- Tab `Email_Health` Index : `domain | sent_today | bounce_rate_7d | complaint_rate_7d | last_mail_tester_score | last_check_at | status (active|paused_high_bounce|paused_high_complaint)`
- Pacing email codé dans `lib/pacing.ts` (cf. F12 étendu) : Gauss µ=8min σ=3min, cap 50/h, human hours 9–19 jour ouvré
**Acceptance** : domaine vérifié vert sur Resend, score mail-tester ≥8/10, soft warm-up 2 sem complété sans bounce, auto-pause testée en staging avec faux bounce.

---

## 4. Out of Scope (v4)

| Feature | Raison |
|---|---|
| Migration Postgres | Garder v3 décision : déclencher >1000 leads/mois soutenu |
| Auth multi-user (Better Auth) | Repoussé Phase 3.5 si demande agence |
| Intégrations CRM (HubSpot, Pipedrive) | Export Instantly + webhooks suffisent v4 ; API publique en Phase 3 |
| App mobile | Desktop-first |
| WhatsApp / Email-Telegram autres canaux | Unipile supporte mais pas prioritaire avant traction |
| Sales Navigator integration | Volontaire — différenciateur mimikflow |
| Auto-warmup email tiers (Instantly/Smartlead/Mailreach) | Hors scope tant que volume <500/mois. Resend natif + soft warm-up organique 2 sem (cf. F15) suffit. Réévaluation si bounce >3% sur 7j ou Phase 3 multi-tenant agence (N domaines clients). |

---

## 5. Success Metrics

| Métrique | Cible v4 | Délai | Mesure |
|---|---|---|---|
| Setter response time (reply → draft) | <30 sec | Phase 1 | log WF7 |
| Setter intent accuracy (validé humain) | >85% | Phase 1 mois 1 | tag `intent_correct` UI inbox |
| Reply→Meeting rate (Setter activé) | >15% | Phase 1 mois 2 | analytics |
| Time saved/jour (Thomas) | >45 min | Phase 1 mois 1 | mesure manuelle |
| LI connection accept rate | >35% | Phase 2 mois 1 | analytics LI |
| LI reply rate | >20% | Phase 2 mois 1 | analytics LI |
| Meetings booked/mois (multi-canal) | >12 | Phase 2 mois 2 | tab Meetings |
| Cost per meeting (LLM + APIs) | <$15 | Phase 2 | analytics + facturation |

---

## 6. Technical Constraints

- **LinkedIn API** : Unipile (pas API officielle LI ; risque ban résiduel mitigé par pacing + résidentiel).
- **LLM Setter** : Claude Sonnet 4.6 (latence <2s prompts cachés). Fallback Opus pour objections complexes (`objection_trust`).
- **Calendly** : v2 API + webhooks. Personal Access Token MVP, OAuth full Phase 3.
- **Pacing LI** : hard cap LinkedIn = **100 invitations / SEMAINE** tous comptes confondus (au-delà → bouton « Se connecter » désactivé puis ban). Daily warm 20 invits / 50 DMs / 200 views ; daily compte neuf <3 mois 5/20/50. Ramp-up obligatoire 4 sem (5→10→15→20 invits/jour). Délais Gauss µ=240s σ=90s. Human hours 9h–19h jour ouvré uniquement. Note d'invitation alternée 60% avec / 40% sans. IP résidentielle Unipile obligatoire. Circuit breaker F14 sur signaux pré-ban.
- **Pacing email** : Gauss µ=8min σ=3min entre sends d'une même campagne, cap 50 emails/heure, human hours 9–19 jour ouvré, ramp-up 5→10→15→20 emails/jour sur 2 sem soft warm-up nouveau domaine. Auto-pause sur bounce >5% ou complaint >0.3% (cf. F15).
- **Domaine outreach** : sous-domaine dédié `outreach.kamesai.com` (DNS MX/SPF/DKIM/DMARC) pour isoler réputation cold email du domaine principal `kamesai.com`.
- **Compliance** : disclaimer signature « assistant IA » (mode validation forcée si prospect demande). Conserver opt-out 1-clic Resend.
- **Nouvelles env vars** :
  - `UNIPILE_API_KEY`, `UNIPILE_DSN`
  - `CALENDLY_TOKEN` (MVP) → `CALENDLY_OAUTH_*` (Phase 3)
  - `SETTER_MODEL=claude-sonnet-4-6`
  - `SETTER_VALIDATION_DEFAULT=true`
  - `N8N_WF7_WEBHOOK` … `N8N_WF11_WEBHOOK`

---

## 7. Open Questions

- [ ] Calendly : 1 event type Thomas + N event types clients (multi-tenant) ? Workspace-level ?
- [ ] Setter ton : 1 prompt master + variables ICP, ou prompt par campagne stocké dans Config ?
- [ ] Fallback si Setter échoue 2x sur même thread → escalade auto humaine ?
- [ ] Caps LI configurables par compte (Thomas vs client) ?
- [ ] Coût : monitoring temps réel des tokens Anthropic / requêtes Unipile / Calendly (alertes seuil) ?

---

## 8. User Flow v4 — Reply → Meeting (Phase 1)

```
[Email outbound v3] Lead reçoit email J0/J3/J7
  → Lead reply → Resend webhook email.replied
    → WF7 (n8n)
        → résout sheet_id via Index
        → charge contexte (ICP, lead enrichi, thread complet)
        → Claude Sonnet 4.6 classifie intent
        → écrit reply_intent + reply_raw (enfant)
    → IF intent in [unsubscribe, hostile, off_topic]
        → tag lead, escalade humaine (UI inbox tab "À répondre")
    → ELSE
        → Setter génère réponse (Mirroring + NoQuestions adaptés)
        → IF intent == meeting_ready
            → /api/calendly/slots → 3 slots
            → insère slots dans réponse
        → IF setter_validation_required (Config)
            → écrit draft tab Conversations
            → UI inbox tab "À valider" → Thomas valide/édite/envoie
        → ELSE
            → WF8 envoie via Resend automatiquement
            → tag turn_n in Conversations
[Lead clique slot Calendly]
  → Webhook Calendly invitee.created
    → écrit tab Meetings (enfant)
    → lead.statut = booked
    → notif UI inbox tab "Bookings"
```

---

## 9. Références

- Analyse mimikflow : `.workflows/01-Architecture/mimikflow-analysis-v4.md`
- ARCHI v4 : `.workflows/00-Discovery/ARCHI-v4.md`
- Tasks v4 : `tasks/v4/TASKS.md`
- Archives : `PRD-v3.md`, `ARCHI-v3.md`
