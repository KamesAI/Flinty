# Flinty daily brief export

## Lancer l'export

Depuis `02-Implementation/interface/lead-qualifier-dashboard` ou `.workflows/02-Implementation/interface/lead-qualifier-dashboard` selon le workspace actif :

```bash
npm run export:frank-daily-brief
```

Le script lit les campagnes Flinty et écrit un JSON read-only. Il n'envoie aucun email, aucun message LinkedIn et ne modifie aucune donnée commerciale.

## Fichier produit

Chemin par défaut :

```text
/home/kames/KamesOS/data/flinty/daily-pipeline.json
```

Pour un test local, le chemin peut être surchargé avec `FRANK_DAILY_BRIEF_OUTPUT_PATH`.

## Données incluses

Le JSON contient :

- `date`
- `summary`
- `priorities`
- `followups_due`
- `new_replies`
- `blocked_or_stale`
- `market_signals`
- `optional_drafts_to_prepare`

Chaque lead expose seulement : identifiant, entreprise, nom du contact si disponible, étape, température, raison, dernière interaction, prochaine action due, action recommandée, canal et résumé utile du message.

## Données exclues volontairement

Pour sécurité, l'export exclut les emails, téléphones, URLs de Sheets, cookies, tokens, mots de passe, credentials, clés API et contenu complet de la base Flinty. Les logs du script ne contiennent que le chemin de sortie, la date et des compteurs agrégés.
