---
name: "source-command-task-done"
description: "Après une tâche v3 — mettre à jour TASKS.md, TASK-XXX.md et Dev-Log.md"
---

# source-command-task-done

Use this skill when the user asks to run the migrated source command `task-done`.

## Command Template

L’utilisateur vient de terminer (ou valide) une tâche v3. Applique **obligatoirement** :

1. **`tasks/v3/TASKS.md`** — passer la tâche de ⏳ à ✅ (ou équivalent).
2. **`tasks/v3/TASK-XXX.md`** — `**Statut** : ⏳ À faire` → `**Statut** : ✅ Complété` (bon numéro XXX).
3. **`02-Implementation/Dev-Log.md`** — nouvelle entrée : date (AAAA-MM-JJ), identifiant tâche, résumé des changements (fichiers / zones).

Si le numéro de TASK ou le libellé exact manque dans le message utilisateur, demande **une seule** clarification avant d’éditer.
