# TASK-016 — Déploiement Vercel

**Priorité** : 🔴 Bloquant pour mise en production
**Statut** : ⏳ À faire
**Repo** : à créer sur GitHub (ou connecter le dossier existant)

---

## Objectif

Déployer le dashboard sur Vercel avec CI/CD automatique depuis GitHub.

---

## Ce qu'il faut faire

### 1. Initialiser un repo GitHub

```bash
cd clients/lead-gen/02-Implementation/interface/lead-qualifier-dashboard
git init
git add .
git commit -m "feat: initial commit — lead qualifier dashboard v1"
gh repo create kames-lead-qualifier --private --source=. --remote=origin --push
```

**Attention** : vérifier que `.gitignore` exclut bien :
- `.env.local`
- `node_modules/`
- `.next/`
- `clients/lead-gen/00-Discovery/lead-qualifier-mvp-454381f7b3cb.json` (credentials GCP)

### 2. Connecter à Vercel

1. [vercel.com](https://vercel.com) → "Add New Project"
2. Importer le repo GitHub `kames-lead-qualifier`
3. Framework : **Next.js** (auto-détecté)
4. Root Directory : `.` (la racine du projet)

### 3. Variables d'environnement Vercel

Ajouter dans Vercel → Settings → Environment Variables :

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=lead-qualifier-service@lead-qualifier-mvp.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=[contenu du champ private_key du JSON, avec les \n]
GOOGLE_SPREADSHEET_ID=14Uf6GlvmlCxzaFxENExW-FkCV0CZNQ_7zwzik9SAelY
N8N_WF1_GENERATE_WEBHOOK=https://staging-n8n.kamesai.com/webhook/kames-generate-leads
N8N_WF2_QUALIFY_WEBHOOK=https://staging-n8n.kamesai.com/webhook/kames-qualify-leads
N8N_WF3_SEND_J0_WEBHOOK=https://staging-n8n.kamesai.com/webhook/kames-send-j0
```

### 4. Vérifier `.env.local` actuel

```bash
cat .env.local
```
S'assurer que les noms de variables correspondent à ce que `lib/sheets.ts` attend.

### 5. Configurer le domaine

Dans Vercel → Settings → Domains :
- Ajouter `crm.kamesai.com` (nouveau sous-domaine)
- Chez Hostinger : ajouter un CNAME `crm` → `cname.vercel-dns.com`

### 6. Tester le déploiement

```bash
vercel --prod
```

Ou pousser sur `main` et vérifier le déploiement automatique.

---

## Critères de validation

- [ ] App accessible sur `crm.kamesai.com`
- [ ] Google Sheets connecté (données visibles)
- [ ] Variables d'env configurées sur Vercel
- [ ] Fichier credentials GCP non commité dans le repo
- [ ] CI/CD actif (push sur main = déploiement auto)
