---
name: "source-command-run-tests"
description: "Lancer la suite Vitest du dashboard Flinty (preuve avant « terminé »)"
---

# source-command-run-tests

Use this skill when the user asks to run the migrated source command `run-tests`.

## Command Template

Exécute la suite de tests du dashboard depuis la racine du repo :

```bash
cd /Users/callendreau/Dev/Flinty/.workflows/02-Implementation/interface/lead-qualifier-dashboard && npm run test
```

(Adapte le chemin si le clone n’est pas sous `~/Dev/Flinty`.)

- En cas d’échec : affiche les fichiers / tests concernés et corrige sans élargir le périmètre.
- En cas de succès : cite brièvement le résumé Vitest (nombre de fichiers / tests).
