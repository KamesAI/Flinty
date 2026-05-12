# Références Flinty — débogage

- **Logs** : sorties terminal, Vercel (déploiement), exécutions n8n (staging puis prod).
- **Index Sheets** : statut campagne (`generating`, `active`, `paused`) = source de vérité opérationnelle.
- **WF1 bloqué** : `N8N_WF1_WEBHOOK`, nœud HTTP final, secours manuel `POST .../generation-complete`.
- **WF2** : callback `qualification-complete` ; statut `failed` → Index `paused`.

Ne pas supposer la root cause : tracer le flux données (dashboard → API → Sheets → n8n) avant fix.
