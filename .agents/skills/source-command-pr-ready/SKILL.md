---
name: "source-command-pr-ready"
description: "Préparer une PR Flinty — tests + résumé + périmètre"
---

# source-command-pr-ready

Use this skill when the user asks to run the migrated source command `pr-ready`.

## Command Template

1. Lancer **`/run-tests`** (ou équivalent : `npm run test` dans `.workflows/02-Implementation/interface/lead-qualifier-dashboard/`). Ne pas conclure sans sortie fraîche.
2. Optionnel si le diff touche le lint : `npm run lint` dans le même dossier.
3. Produire un **résumé PR** en français :
   - objectif en une phrase ;
   - fichiers / zones clés ;
   - risques (données Sheets, callbacks n8n, env Vercel) ;
   - preuve : extrait ou statut des tests.

Petites PRs, une intention par branche (voir conventions Flinty).
