# TASK-029 — Timeline conversations unifiee sur fiche lead

**Priorité** : 🟠 P2 — Vue contextuelle lead par lead
**Statut** : ⏳ À faire
**Nécessite** : `TASK-017` pour la timeline email + `TASK-027` si les meetings doivent remonter dans la meme chronologie
**Référence** : `clients/lead-gen/CRMupgrade.md` sections `3.C`, `4.4`, `11`, `13`

---

## Objectif

Transformer la fiche lead en vraie fiche CRM avec une **timeline unifiee** des interactions :

- emails,
- reponses,
- DMs visibles,
- meetings,
- notes internes,
- changements de statut.

Le but est de centraliser le contexte commercial sans encore envoyer de messages depuis cette timeline.

---

## Ce qu'il faut faire

### 1. Définir les sources de timeline

La timeline doit pouvoir agreger au moins :

- `Email_Events` pour la partie email,
- `Meetings` pour les rendez-vous,
- une nouvelle source `Conversations` ou `Messages` pour les messages externes visibles,
- une source optionnelle `Lead_Notes` ou equivalent pour les notes internes.

### 2. Ajouter les onglets Google Sheets manquants

Si necessaire, creer :

```txt
Conversations
conversation_id | lead_id | campaign_id | channel | last_message_at | status | source | metadata

Messages
message_id | conversation_id | lead_id | campaign_id | channel | direction | message_type | content | occurred_at | metadata
```

Valeurs utiles :

- `channel` : `email` | `linkedin` | `whatsapp` | `x` | `instagram` | `meeting` | `note`
- `direction` : `inbound` | `outbound` | `internal`

### 3. Ajouter une route d’agrégation par lead

Creer une route de type :

- `app/api/leads/[id]/timeline/route.ts`

Cette route doit :

- lire plusieurs sources,
- normaliser les evenements,
- les trier chronologiquement,
- retourner une timeline unique exploitable par l'UI.

### 4. Refondre la fiche lead

Remplacer le bloc statique actuel de la fiche lead par une timeline visuelle :

- badges de canal,
- icones d'evenement,
- date/heure,
- contenu resumee,
- statut lisible,
- separation claire entre emails, meetings et DMs visibles.

### 5. Prévoir les états utiles

La timeline doit permettre de visualiser rapidement :

- ce qui a ete envoye,
- ce qui a ete recu,
- ce qui attend une action,
- si un meeting est deja planifie.

---

## Must Have

- [ ] Route `/api/leads/[id]/timeline` ou equivalent
- [ ] Timeline chronologique unique sur la fiche lead
- [ ] Emails et meetings integres dans la meme vue
- [ ] Place prevue pour les DMs visibles
- [ ] Normalisation des evenements multi-sources

## Should Have

- [ ] Filtre rapide par canal
- [ ] Resume textuel compact pour les messages longs
- [ ] Badge `needs reply` ou equivalent si logique disponible

## Must NOT

- [ ] Ne pas permettre la reponse native a un DM depuis cette page
- [ ] Ne pas transformer la timeline en chat complet
- [ ] Ne pas dupliquer les memes evenements sur plusieurs sources
- [ ] Ne pas dependre d'une base SQL pour livrer une V1

---

## Fichiers cibles

- `app/dashboard/campaigns/[campaign_id]/leads/[lead_id]/page.tsx`
- `app/api/leads/[id]/timeline/route.ts`
- `lib/sheets.ts`

Optionnel selon implementation :

- `app/dashboard/campaigns/[campaign_id]/leads/[lead_id]/LeadTimeline.tsx`
- `app/dashboard/campaigns/[campaign_id]/leads/[lead_id]/TimelineEventItem.tsx`

---

## Critères de validation

- [ ] La fiche lead affiche une vraie timeline multi-evenements
- [ ] Les evenements sont tries du plus recent au plus ancien ou inverse, mais de facon coherente
- [ ] Les emails `sent/opened/clicked/replied/bounced` sont visibles
- [ ] Les meetings issus de `Meetings` apparaissent si presents
- [ ] Les canaux externes peuvent etre affiches en lecture seule
- [ ] La page reste lisible meme si une source de donnees est vide

---

## Dépendances

### Bloqué par

- `TASK-017` — Timeline email (onglet Email_Events)

### Bloque

- `TASK-030` — Unified Inbox en lecture centralisee

---

## Notes

Cette tache est le pont entre le dashboard actuel et un vrai CRM de conversations. Le scope gagnant n'est pas de tout connecter parfaitement, mais de creer une **chronologie unifiee credible et utile** autour du lead.
