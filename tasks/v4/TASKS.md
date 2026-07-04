# Implementation Tasks: Flinty v4

## Overview
- **Total Tasks**: 37
- **Estimated Total Time**: 134–164h (~16 sem post v3 prod)
- **Generated From**: PRD-v4.md, ARCHI-v4.md, mimikflow-analysis-v4.md
- **Generated On**: 2026-05-04
- **Phases** : Phase 1 (Setter email — 4–6 sem) · Phase 2 (LinkedIn — 6–8 sem) · Phase 3 (polish — 4 sem)

## Progress Tracker

**Owner Legend** : 🧑 Toi (accès Unipile/Calendly/Vercel) · 🤖 Claude (code + n8n MCP) · 🤝 Mixte

### Phase 1 — AI Setter Email + Calendly + Inbox (P0)

| # | Task | Owner | Priority | Status | Deps | Est. |
|---|------|-------|----------|--------|------|------|
| v4-000 | **Provisioning `outreach.kamesai.com` Resend** — ✅ Domain verified Resend (Hostinger DNS), DMARC parent dédupliqué + DMARC outreach ajouté, mail-tester score 10/10 le 2026-05-06. `RESEND_FROM=Thomas <thomas@outreach.kamesai.com>` set local. ✅ API key Resend rotée par Thomas le 2026-05-19 ; rotation générale prévue avant prod | 🧑 | P0 | ✅ | — | 1h |
| v4-001 | Provision Calendly PAT + event types + env vars Vercel | 🧑 | P0 | ✅ | — | 1h |
| v4-002 | Étendre schéma GSheets : tab `Conversations` + tab `Email_Health` + colonnes `Leads_Qualified` v4 + `Config` v4 | 🤖 | P0 | ✅ | v4-001 | 2h |
| v4-002b | `lib/pacing.ts` — caps email daily new/warm + cap hourly + Gauss µ=8min σ=3min + ramp-up 5→20/4 sem + human hours 9–19 jour ouvré + helper `checkEmailHealth(domain)` + tests Vitest | 🤖 | P0 | ✅ | v4-002 | 3h |
| v4-002c | WF13 NEW — Email Health Monitor : webhooks Resend `email.bounced` + `email.complained` + cron 1h → update `Email_Health` → auto-pause si bounce>5% ou complaint>0.3% + bandeau UI rouge + alerte email Thomas. ✅ WF13 actif n8n, webhook Resend réel branché, alerte reçue par Thomas, route/API/UI livrés | 🤖 | P0 | ✅ | v4-002b, v4-000 | 3h |
| v4-003 | `lib/conversations.ts` — read/append turn cross-canal | 🤖 | P0 | ✅ | v4-002 | 2h |
| v4-004 | `lib/setter.ts` — buildContext + classifyIntent (Claude Sonnet 4.6 JSON mode) | 🤖 | P0 | ✅ | v4-003 | 4h |
| v4-005 | `lib/setter.ts` — generateResponse + Voss/NoQuestions prompt + prompt caching | 🤖 | P0 | ✅ | v4-004 | 5h |
| v4-006 | `lib/calendly.ts` + route `/api/calendly/slots` (GET 3 slots) | 🤖 | P0 | ✅ | v4-001 | 2h |
| v4-007 | Setter tool call `get_calendly_slots` intégré dans generateResponse | 🤖 | P0 | ✅ | v4-005, v4-006 | 2h |
| v4-008 | Cron polling Calendly `*/5min` → tab Meetings + lead.statut=booked (pas de webhook — plan gratuit) | 🤖 | P0 | ✅ | v4-002, v4-006 | 2h |
| v4-009 | WF7 n8n — webhook Resend `email.replied` → call `/api/setter/email-reply` → écrit Conversations → IF setter_validation → WF8 | 🤖 | P0 | ✅ | v4-004, v4-005 | 4h |
| v4-009b | WF7/WF8 — appel `checkEmailHealth(domain)` avant chaque send + respect Gauss délai + cap hourly | 🤖 | P0 | ✅ | v4-002b, v4-009 | 1h |
| v4-010 | WF8 n8n — `/api/replies/.../send` → Resend send + tag validated | 🤖 | P0 | ✅ | v4-002 | 2h |
| v4-011 | Routes `/api/replies/[lead_id]` GET + `/send` + `/escalate` | 🤖 | P0 | ✅ | v4-003 | 3h |
| v4-012 | Refonte `/dashboard/inbox` — 3 tabs (à valider/répondre/bookings) | 🤖 | P0 | ✅ | v4-011 | 4h |
| v4-013 | Composant `<ConversationThread>` timeline cross-canal | 🤖 | P0 | ✅ | v4-012 | 3h |
| v4-014 | Composant `<SetterDraftCard>` + actions valider/éditer/escalader | 🤖 | P0 | ✅ | v4-013 | 3h |
| v4-015 | Page `/dashboard/campaigns/[id]/settings` — toggle setter_validation, ton, signature | 🤖 | P0 | ✅ | v4-002 | 2h |
| v4-016 | Validation mode forced sur question IA (Voss exception + EU AI Act) | 🤖 | P0 | ✅ | v4-005, v4-015 | 2h |
| v4-016b | **Auto-graduation Setter** — flip `setter_validation=false` post-warm-up si intent accuracy ≥85% sur 50 turns + cron quotidien + escalade email si <85% après 21j | 🤖 | P0 | ✅ | v4-015, v4-016, v4-018b | 3h |
| v4-017 | Tests Vitest : setter classify + generate + calendly slots formatter | 🤖 | P0 | ✅ | v4-005, v4-006 | 4h |
| v4-018 | E2E smoke Phase 1 : reply test → Setter draft → validation → send → Calendly slot → tab Meetings | 🤝 | P0 | ✅ | v4-009→016 | 3h |
| v4-018b | Mode `warmup_campaign` UI + flag campagne (bypass scoring + cap volume + tag positive replies) + soft warm-up flow 2 sem (5→20 emails/jour vers contacts amis) | 🤖 | P1 | 🚧 Partiel — 2026-05-19 (J1 réel envoyé + 5 replies positives ; attente J14/santé) | v4-015, v4-000 | 3h |

**Total Phase 1** : ~64h (6 tasks ajoutées : v4-000, v4-002b, v4-002c, v4-009b, v4-016b, v4-018b)

### Phase 2 — Canal LinkedIn (P0)

| # | Task | Owner | Priority | Status | Deps | Est. |
|---|------|-------|----------|--------|------|------|
| v4-019 | Souscription Unipile + API key + DSN + webhooks secret | 🧑 | P0 | ⬜ | — | 1h |
| v4-020 | `lib/unipile.ts` client + retries + signature verify | 🤖 | P0 | 🚧 Partiel — 2026-05-20 (client + tests mock livrés ; test live `/users/me` en attente credentials) | v4-019 | 3h |
| v4-021 | Hosted auth flow : `/dashboard/settings/linkedin/connect` + callback `/api/unipile/callback` + tab `Accounts` Index | 🤖 | P0 | 🚧 Partiel — 2026-05-18 | v4-020 | 3h |
| v4-022 | WF9 LI Sourcing — search/post_engagers/profile_visitors/external_post → Leads_Raw + dedup Registry étendu | 🤖 | P0 | ⬜ | v4-020 | 6h |
| v4-023 | UI sourcing LI sur page campagne — sélecteur canal + params | 🤖 | P0 | 🚧 Partiel — 2026-05-18 | v4-022 | 3h |
| v4-024 | `lib/pacing.ts` — Gauss délais + caps daily warm/new + **cap weekly 100** + **ramp-up 4 sem** + human hours 9h–19h + note 60/40 + removal cap 50/j + typing speed | 🤖 | P0 | ✅ | v4-020 | 5h |
| v4-024b | WF12 NEW — Health monitor LI : polling Unipile + parsing inbox compte → détecte captcha/warning email/acceptance<20%/bouton Suivre → auto-pause + alerte UI + email Thomas. Tab `LI_Health` Index | 🤖 | P0 | 🚧 Partiel — 2026-05-20 (helpers circuit breaker + tests + smoke payload prêts ; WF12 live en attente Unipile) | v4-024 | 4h |
| v4-024c | Bandeau dashboard `<LIHealthBanner>` rouge si status != active + raison + ETA reprise | 🤖 | P0 | 🚧 Partiel — 2026-05-18 | v4-024b | 2h |
| v4-025 | WF10 LI Outreach — invitation perso IA + cold DM post-acceptance + pacing + appel `checkHealth()` avant chaque action | 🤖 | P0 | ⬜ | v4-024, v4-024b, v4-022 | 5h |
| v4-025b | WF10 mix d'actions organiques — 1 like + 1 profile view toutes les N invits (pattern humain) | 🤖 | P0 | ⬜ | v4-025 | 2h |
| v4-026 | WF11 Setter LI — webhook `message.received` → réutilise pipeline Setter (channel=linkedin) | 🤖 | P0 | ⬜ | v4-005, v4-020 | 4h |
| v4-027 | Inbox unifié email + LI dans `<ConversationThread>` (channel badge) | 🤖 | P0 | ✅ | v4-013, v4-026 | 2h |
| v4-028 | Tests + E2E Phase 2 : sourcing → invitation → DM → reply → Setter LI → Calendly + smoke captcha simulé → pause auto | 🤝 | P0 | 🚧 Partiel — 2026-05-20 (script + checklist + tests mock prêts ; smoke staging réel à exécuter) | v4-022→027 | 4h |

**Total Phase 2** : ~42h

### Phase 3 — Polish & scale (P1)

| # | Task | Owner | Priority | Status | Deps | Est. |
|---|------|-------|----------|--------|------|------|
| v4-029 | Vidéo perso Loom embed (auto-trigger follow-up #4 ou demande) | 🤖 | P1 | ✅ | v4-005 | 3h |
| v4-030 | Workspaces tab Index + scope routes (multi-tenant agence) | 🤖 | P1 | ✅ | v4-021 | 6h |
| v4-031 | OAuth Calendly v2 (remplace PAT) — multi-event types par workspace | 🤖 | P1 | ✅ | v4-008, v4-030 | 4h |
| v4-032 | Pacing fin avancé : tuning ramp-up (déjà livré v4-024) + alertes santé granulaires + dashboards LI_Health historiques | 🤖 | P1 | 🚧 Partiel — 2026-05-20 (page + warning orange + lecture historique prêts ; données WF12 live en attente) | v4-024, v4-024b | 2h |
| v4-033 | Analytics avancé : funnel par canal, cohorts, attribution RDV, cost/meeting | 🤖 | P1 | 🚧 2026-05-19 | v4-002 | 5h |
| v4-034 | API publique + webhooks CRM (HubSpot/Pipedrive) | 🤖 | P2 | ⬜ | v4-030 | 5h |
| v4-035 | Monitoring tokens Anthropic/Unipile/Calendly + alertes seuils | 🤖 | P1 | 🚧 Partiel — 2026-05-20 (code TS/API/UI livré ; WF14 + smoke Sheets/email réels à faire) | v4-005, v4-020 | 2h |
| v4-036 | MVP “Flinty daily brief export” pour Frank/Hermes — JSON read-only `daily-pipeline.json`, fonction `generateDailyPipelineBriefData()`, script `npm run export:frank-daily-brief`, endpoint `GET /api/frank/daily-brief-data`, doc sécurité | 🤖 | P1 | ✅ | v4-003, v4-011 | 2h |
| v4-037 | Landing page publique FR sur `/` (hero + quinconce 6 features + pricing + FAQ) + pages `/login` `/signup` UI seule (zod + toast, Supabase Auth ultérieur) | 🤖 | P1 | 🚧 Partiel — 2026-07-04 (livré + vérifié desktop ; reste vérif mobile visuelle, tarifs définitifs, pages légales, Supabase Auth) | — | 6h |
| v4-038 | Refonte thème site entier (Poppins + dégradé émeraude #059669/#34d399/#064e3b) + sections landing façon Mimikflow (stats+funnel objectifs, comparatif Lemlist/Waalaxy/LGM, book demo placeholder) | 🤖 | P1 | 🚧 Partiel — 2026-07-04 (livré + vérifié desktop ; reste validation comparatif par Thomas, logo PNG à recolorer, lien démo réel, vérif mobile) | v4-037 | 4h |

**Total Phase 3** : ~32h

---

## Dependency Graph (high level)

```
Phase 1
  v4-001 → v4-002 → v4-003 → v4-004 → v4-005 ─┬─► v4-007 ─► v4-009 ─► v4-018
                                              ├─► v4-016
                                              └─► v4-017
  v4-001 → v4-006 → v4-007
  v4-002 → v4-008 (Calendly webhook)
  v4-003 → v4-011 → v4-012 → v4-013 → v4-014
  v4-002 → v4-010 (WF8 send)
  v4-002 → v4-015 → v4-016

Phase 2 (deps: Phase 1 stable)
  v4-019 → v4-020 ─┬─► v4-021
                  ├─► v4-022 → v4-023
                  ├─► v4-024 → v4-025
                  └─► v4-026 → v4-027 → v4-028

Phase 3 (deps: Phase 2)
  v4-021 → v4-030 → v4-031, v4-034
  v4-024 → v4-032
  v4-002 → v4-033
  v4-005, v4-020 → v4-035
```

---

## Milestones

### M1 (Phase 1, fin sem 6) — Setter Email opérationnel
- [x] Domaine `outreach.kamesai.com` Resend vérifié vert + mail-tester ≥8/10
- [ ] Soft warm-up 2 sem complété (bounce 0%, ≥3 replies positives)
- [x] WF13 Email Health Monitor opérationnel (auto-pause testée)
- [x] WF7 classifie 100% des replies en <30s
- [x] Setter génère drafts validables (Voss + NoQuestions)
- [x] Calendly slots proposés dynamiquement
- [x] Inbox refonte 3 tabs livrée
- [x] Validation mode toggle fonctionnel + EU AI Act compliance
- [x] Auto-graduation Setter : `setter_validation=false` flip auto après warm-up si accuracy ≥85% sur 50 threads (v4-016b)
- [x] Smoke test E2E réussi en staging
- **KPI** : Setter intent accuracy >85% (50 threads test)

### M2 (Phase 2, fin sem 14) — LinkedIn live
- [ ] Compte LI Thomas connecté via Unipile
- [ ] Sourcing 4 canaux opérationnels
- [ ] Pacing strict respecté (caps daily + **weekly 100** + ramp-up + human hours + Gauss délais)
- [ ] Circuit breaker F14 (WF12) opérationnel : auto-pause sur captcha/warning/accept<20%
- [ ] Bandeau LI_Health affiché si pause active
- [ ] WF10 invite + DM avec perso IA + mix actions organiques
- [ ] WF11 Setter LI réutilise pipeline Phase 1
- [ ] Inbox unifié email + LI
- **KPI cibles** : LI accept >35%, LI reply >20%, RDV/mois >12

### M3 (Phase 3, fin sem 18) — Scale & polish
- [ ] Workspaces multi-tenant
- [ ] OAuth Calendly full
- [ ] Vidéo perso Loom
- [ ] Analytics multi-canal complet
- [ ] Monitoring coûts + alertes
- **KPI** : Cost/meeting <$15, marge tier Premium >70%

---

## Risk Log

| Risque | Phase | Mitigation |
|---|---|---|
| Latence Setter >5s p95 | 1 | Prompt caching + Sonnet 4.6 streaming dans inbox |
| Setter intent <85% accuracy | 1 | Forced validation initial 2 sem ; fine-tune prompt avec Thomas |
| Hallucination Calendly slot | 1 | Tool call strict ; vérif post-génération |
| Ban LI compte Thomas | 2 | Pacing strict J1 (cap weekly 100 LI hard, ramp-up 4 sem, human hours, note 60/40, removal cap 50/j, IP résidentielle) + Validation forcée 2 sem + circuit breaker F14 (WF12) auto-pause sur captcha/warning/accept<20% + backup compte test |
| Coût LLM explose volume | 2-3 | Batch API non-urgent + cache aggressive ICP |
| Domaine `outreach.kamesai.com` blacklisté (réputation grillée) | 1 | Soft warm-up 2 sem obligatoire + pacing email Gauss + auto-pause F15 sur bounce>5%/complaint>0.3% + isolation du domaine principal `kamesai.com` |
| Webhook Unipile flaky | 2 | Polling fallback + retry queue n8n |
| Multi-tenant Workspaces leak | 3 | Test E2E isolation + scope strict toutes routes |

---

## Files critiques v4

| Path | Action |
|---|---|
| `lib/setter.ts` | 🆕 — module central Phase 1 |
| `lib/conversations.ts` | 🆕 |
| `lib/calendly.ts` | 🆕 |
| `lib/unipile.ts` | 🆕 Phase 2 |
| `lib/pacing.ts` | 🆕 Phase 2 |
| `app/api/replies/**` | 🆕 |
| `app/api/setter/**` | 🆕 |
| `app/api/calendly/**` | 🆕 |
| `app/api/unipile/**` | 🆕 Phase 2 |
| `app/dashboard/inbox/**` | 🔄 refonte v4 |
| `app/dashboard/campaigns/[id]/settings/page.tsx` | 🆕 |
| `app/dashboard/settings/linkedin/connect/page.tsx` | 🆕 Phase 2 |
| n8n WF7-WF11 | 🆕 |

---

## Lessons reportées de v3

À lire avant chaque sprint : `tasks/v3/lessons.md`. Highlights :
- **Vitest TDD obligatoire** sur `lib/*.ts` et routes API
- **Anthropic SDK** : forcer `response_format` JSON ou demander `"RÉPONDS UNIQUEMENT LE JSON"` en fin de prompt + retry parser
- **n8n MCP** : tester chaque WF à vide avant ajouter logique externe
- **Smoke prod** : 1 campagne réelle de bout en bout avant déclarer milestone done
- **Couleur UI** : `hsl(var(--primary))` (#006596 TrueHorizon blue), pas l'orange v1
