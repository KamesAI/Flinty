# Task v4-000 : Provisioning `outreach.kamesai.com` Resend
**Status**: ✅ Complété (2026-05-06)

## Autonomie
✅ **Déjà fait par Thomas** — aucune action supplémentaire requise sauf les 2 points restants ci-dessous.

## Context
Flinty v4 ajoute un AI Setter qui répondra aux prospects via email. Pour isoler la réputation cold email du domaine principal `kamesai.com`, un sous-domaine dédié `outreach.kamesai.com` est provisionné sur Resend.

**Réalisé le 2026-05-06** :
- Domain verified Resend (DNS Hostinger)
- DMARC parent dédupliqué + DMARC outreach ajouté
- Score mail-tester 10/10
- `RESEND_FROM=Thomas <thomas@outreach.kamesai.com>` configuré en local

**Références** : PRD-v4 F15 · ARCHI-v4 §DevOps

## Objective
Domaine outreach.kamesai.com opérationnel sur Resend avec isolation complète de la réputation email du domaine principal.

## Requirements

### Must Have
- [x] DNS MX/SPF/DKIM/DMARC configurés sur Hostinger pour `outreach.kamesai.com`
- [x] Domaine vérifié vert dans dashboard Resend
- [x] DMARC dédupliqué (1 seul DMARC pour parent, 1 pour outreach)
- [x] Score mail-tester ≥8/10 (obtenu 10/10)
- [x] `RESEND_FROM=Thomas <thomas@outreach.kamesai.com>` en `.env.local`
- [ ] **RESTE** : Variables d'env Vercel (staging + prod) à mettre à jour : `RESEND_FROM` → nouvelle valeur
- [ ] **RESTE** : Rotation API key Resend compromise (si applicable)

### Must NOT
- Ne jamais envoyer cold email depuis `kamesai.com` (domaine principal transactionnel)
- Ne pas committer `.env.local`

## Technical Approach
Resend : `Settings > Domains > Add Domain > outreach.kamesai.com`
DNS à configurer sur Hostinger panel :
- MX : `feedback-smtp.eu-west-1.amazonses.com` (priority 10)
- SPF TXT : `v=spf1 include:amazonses.com ~all`
- DKIM CNAME : clés fournies par Resend
- DMARC TXT `_dmarc.outreach` : `v=DMARC1; p=quarantine; rua=mailto:dmarc@kamesai.com`

## Acceptance Criteria
- [x] Domaine vert dans Resend dashboard
- [x] mail-tester.com score ≥8/10
- [ ] Variable `RESEND_FROM` mise à jour sur Vercel staging + prod
- [ ] Test envoi depuis `thomas@outreach.kamesai.com` → inbox Gmail Thomas → header `From` correct

## Dependencies
**Blocked By**: aucune

## Complexity & Estimates
Low · 1h · Risk: Low (déjà fait)
