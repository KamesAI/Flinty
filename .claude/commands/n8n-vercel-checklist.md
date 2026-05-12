---
description: Checklist callbacks WF1/WF2 et variables Vercel avant staging ou prod
---

Réviser **sans modifier les secrets** (pas de commit `.env.local`) :

### Vercel / env

- `N8N_WF1_WEBHOOK` … `N8N_WF4_WEBHOOK` présents sur l’environnement cible.
- `GOOGLE_*`, `OPENROUTER_API_KEY`, `RESEND_*` cohérents avec l’environnement (staging vs prod).
- `VERCEL_URL` / origine publique pour `getPublicOrigin` si les callbacks sont construits côté serveur.

### n8n

- WF1 : nœud final HTTP `POST` vers `generation_callback_url` avec body attendu par `generation-complete`.
- WF2 : fin de flux → `POST` `qualification_callback_url` / `qualification-complete` avec statut + counts si applicable.
- Exécutions récentes : pas d’erreur silencieuse sur les nœuds Google Sheets / HTTP Request.

### Dashboard

- Routes `generation-complete`, `qualification-complete` alignées avec ce que n8n envoie (schéma Zod / handlers).

Produire une liste **OK / à corriger** ; si un point nécessite une action humaine (Vercel, n8n UI), l’indiquer clairement.
