---
description: Rappel des smoke checks API campagne (sans credentials dans le chat)
---

Smoke **conceptuels** (adapter host et IDs ; ne jamais coller de clés API ou JWT dans la réponse) :

1. **Santé liste** : `GET /api/campaigns` (ou route équivalente du projet) — 200, JSON attendu.
2. **Détail** : `GET /api/campaigns/<id>` — vérifie statut campagne cohérent avec l’Index.
3. **Callbacks** : si tu testes manuellement `generation-complete` / `qualification-complete`, utiliser un body minimal documenté dans le code / `flinty-dashboard` rule.

Si l’environnement local n’a pas les env : indiquer « non exécutable ici » et lister ce qu’il faudrait lancer sur Vercel preview ou staging.
