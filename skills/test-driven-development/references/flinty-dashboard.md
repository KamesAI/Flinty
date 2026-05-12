# Références Flinty — dashboard (pour les skills)

Chemin absolu du package Next.js :

`02-Implementation/interface/lead-qualifier-dashboard/`

| Commande | Rôle |
|----------|------|
| `npm run test` | Vitest (obligatoire avant « terminé » si TS modifié) |
| `npm run lint` | ESLint Next |
| `npm run build` | Build prod |

**TDD** : pour `lib/*.ts` et `app/**/*.ts`, écrire le test Vitest **avant** l’implémentation.

**Callbacks n8n** : voir `.claude/rules/flinty-dashboard.md` ou le hub `CLAUDE.md` (WF1 / WF2, `generation-complete`, `qualification-complete`).

**Isolation** : ne jamais mélanger les données de campagnes hors `Contacts_Registry`.
