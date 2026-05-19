# Frank Daily Brief — Sync Mac → VPS

## But

Export automatique du pipeline Flinty chaque matin vers le VPS KamesOS, où l'assistant Frank/Hermes lit `daily-pipeline.json` pour préparer le brief commercial.

## Flux

```
Mac local (07:55)
  → npm run sync:frank-daily-brief
  → scripts/export-frank-daily-brief.mjs  (lit Google Sheets)
  → tmp/frank/daily-pipeline.json         (JSON local)
  → scan sécurité (emails, tokens, secrets)
  → rsync / scp
  → VPS : /home/kames/KamesOS/data/flinty/daily-pipeline.json
  → vérification ssh "test -s + wc -c"
  → log local : tmp/frank/frank-daily-brief-sync.log
```

## Prérequis

- SSH configuré avec clé (pas de mot de passe dans le script)
- Node.js ≥ 18 + npm installé sur le Mac
- Variables d'environnement Google Sheets présentes dans `.env.local`
- `.env.frank` créé à partir de `.env.frank.example`

## Configurer l'alias SSH

Ajouter dans `~/.ssh/config` (sans secret, sans IP hardcodée dans le repo) :

```
Host hermes-vps
  HostName TON_IP_OU_DOMAINE_VPS
  User kames
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
```

Tester la connexion :

```bash
ssh hermes-vps "echo ok"
```

## Variables d'environnement

Copier `.env.frank.example` en `.env.frank` (gitignored) et remplir :

| Variable | Défaut | Description |
|---|---|---|
| `FLINTY_FRANK_SSH_HOST` | — | **Requis.** Alias SSH défini dans `~/.ssh/config` |
| `FLINTY_FRANK_REMOTE_PATH` | `/home/kames/KamesOS/data/flinty/daily-pipeline.json` | Chemin cible VPS |
| `FLINTY_FRANK_LOCAL_OUTPUT` | `./tmp/frank/daily-pipeline.json` | JSON local intermédiaire |
| `FLINTY_FRANK_LOG_PATH` | `./tmp/frank/frank-daily-brief-sync.log` | Log local |

## Test manuel

```bash
cd /Users/callendreau/Dev/Flinty/.workflows/02-Implementation/interface/lead-qualifier-dashboard
npm run sync:frank-daily-brief
```

Vérifier côté VPS :

```bash
ssh hermes-vps "ls -lh /home/kames/KamesOS/data/flinty/daily-pipeline.json && head -c 500 /home/kames/KamesOS/data/flinty/daily-pipeline.json"
```

Vérifier le log local :

```bash
tail -n 50 /Users/callendreau/Dev/Flinty/tmp/frank/frank-daily-brief-sync.log
```

## Installer launchd (planification quotidienne 07:55)

```bash
mkdir -p ~/Library/LaunchAgents

cp /Users/callendreau/Dev/Flinty/.workflows/02-Implementation/interface/lead-qualifier-dashboard/docs/com.kames.flinty.frank-daily-brief.plist.example \
   ~/Library/LaunchAgents/com.kames.flinty.frank-daily-brief.plist

launchctl load ~/Library/LaunchAgents/com.kames.flinty.frank-daily-brief.plist
launchctl start com.kames.flinty.frank-daily-brief
```

## Vérifier launchd

```bash
launchctl list | grep com.kames.flinty.frank-daily-brief
tail -n 100 /Users/callendreau/Dev/Flinty/tmp/frank/frank-daily-brief-sync.log
# Aussi :
tail -n 50 /Users/callendreau/Dev/Flinty/tmp/frank/launchd-stdout.log
tail -n 50 /Users/callendreau/Dev/Flinty/tmp/frank/launchd-stderr.log
```

## Désinstaller launchd

```bash
launchctl unload ~/Library/LaunchAgents/com.kames.flinty.frank-daily-brief.plist
rm ~/Library/LaunchAgents/com.kames.flinty.frank-daily-brief.plist
```

## Limites

- Le Mac doit être **allumé et connecté au réseau** à 07:55.
- Si le Mac est éteint, launchd **ne rattrape pas** l'exécution manquée.
- En cas d'absence prolongée : lancer `npm run sync:frank-daily-brief` manuellement au retour.
- SSH doit fonctionner sans interaction (clé sans passphrase ou ssh-agent actif).
