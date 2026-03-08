# Dev Log — Lead Qualifier Dashboard

**Client** : Kames AI (usage interne)
**Package** : PRO
**Workflow** : CRM Lead Generation + Cold Email

---

## Historique

### 2026-03 — Setup initial
- ✅ Projet Next.js 15 + TypeScript + Tailwind initialisé
- ✅ Google Sheets API v4 connectée (Spreadsheet ID : `14Uf6GlvmlCxzaFxENExW-FkCV0CZNQ_7zwzik9SAelY`)
- ✅ Service account configuré : `lead-qualifier-service@lead-qualifier-mvp.iam.gserviceaccount.com`
- ✅ 5 écrans implémentés : dashboard, nouvelle campagne, détail campagne, fiche lead
- ✅ 6 API routes : campaigns, leads, stats, export
- ✅ 6 workflows n8n (staging-n8n.kamesai.com)

### Décisions techniques
- **Google Sheets vs DB** : Sheets choisi pour simplicité + accès direct Thomas
- **Next.js App Router** : Server Components pour performance (pas de client-side fetch)
- **Pas de Supabase** : Overkill pour MVP, migration possible plus tard

---

## En cours / À faire

- [ ] Déployer sur Vercel (Task 016)
- [ ] Implémenter timeline email complète (onglet `Email_Events` dans GSheet)
- [ ] Actions manuelles sur leads (changer statut, forcer relance)
- [ ] Mode mobile
- [ ] Mise à jour sécurité n8n v2.7.5 (URGENT)

---

## Workflows n8n

| ID | Nom | Statut |
|---|---|---|
| `OnpGdsIZQShrN4P1` | WF1 - Génération Leads | ✅ Actif staging |
| `01BB4q4j1buvWRC6` | WF2 - Qualification | ✅ Actif staging |
| `dfe1jIPlZA10dqJK` | WF3 - Email J0 | ✅ Actif staging |
| `oCViFcjPo2nNUjlR` | WF4 - Webhooks Resend | ✅ Actif staging |
| `7re2WS3ghacqHsLE` | WF5 - Relances Auto | ✅ Actif staging |
| `oWm8alnIlzS9UCTd` | WF6 - Stats | ✅ Actif staging |
