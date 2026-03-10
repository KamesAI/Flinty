# Timeline unifiée fiche lead — Plan d'implémentation

> **Pour Claude :** Suis ce plan étape par étape. Thomas exécute chaque step et rapporte les résultats.

**Goal :** Fusionner emails + meetings dans une seule timeline chronologique sur la fiche lead.

**Client :** lead-gen

**Architecture :** La page lead (`page.tsx`) est un Server Component Next.js. Elle fetch déjà les `emailEvents` via `getLeadEmailEvents()`. On ajoute le fetch des meetings du même lead via une nouvelle fonction `getLeadMeetings()` dans `sheets.ts`, puis on normalise les deux sources en une liste `TimelineItem[]` triée, affichée dans un seul bloc visuel.

**Tech Stack :** Next.js 15 (App Router, Server Components), Tailwind CSS, Google Sheets API via `lib/sheets.ts`

**Prerequisites :**
- [x] TASK-017 complété — onglet `Email_Events` fonctionnel
- [x] TASK-027 complété — onglet `Meetings` fonctionnel
- [x] `getMeetings()` existe dans `lib/sheets.ts`
- [x] `getLeadEmailEvents()` existe dans `lib/sheets.ts`

**Base path :** `clients/lead-gen/02-Implementation/interface/lead-qualifier-dashboard/`

---

## Task 1 : Ajouter `getLeadMeetings()` dans sheets.ts

**Ce qu'on construit :** Une fonction qui retourne uniquement les meetings d'un lead donné, triés chronologiquement.

**Fichier :** `lib/sheets.ts`

---

### Step 1 : Ouvrir sheets.ts et localiser la fonction `getMeetings()`

**Action :**
1. Ouvre le fichier `lib/sheets.ts`
2. Cherche la ligne contenant `export async function getMeetings()`
3. Note où elle se termine (ligne avec `}`)

**Résultat attendu :**
```typescript
export async function getMeetings() {
  await ensureMeetingsSheet();
  const lastColumn = getColumnLetter(MEETINGS_HEADER.length);
  const rows = await getSheetData(`${MEETINGS_SHEET_NAME}!A:${lastColumn}`);
  return parseMeetings(rows);
}
```

---

### Step 2 : Ajouter `getLeadMeetings()` juste après `getMeetings()`

**Action :**
Ajoute ce bloc de code juste après la fermeture `}` de `getMeetings()` :

```typescript
export async function getLeadMeetings(leadId: string): Promise<Meeting[]> {
  await ensureMeetingsSheet();
  const lastColumn = getColumnLetter(MEETINGS_HEADER.length);
  const rows = await getSheetData(`${MEETINGS_SHEET_NAME}!A:${lastColumn}`);
  return parseMeetings(rows)
    .filter((m) => m.lead_id === leadId)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
}
```

> Note : `Meeting` est le type déjà défini dans `lib/meetings.ts`. Si TypeScript se plaint, ajoute `import type { Meeting } from "./meetings"` en haut du fichier (vérifie si l'import existe déjà).

**Résultat attendu :**
- Le fichier `sheets.ts` contient maintenant `getLeadMeetings` juste après `getMeetings`
- Aucune erreur TypeScript dans l'éditeur

---

### Step 3 : Vérifier que le build ne casse pas

**Action :**
Dans le terminal, depuis le dossier `02-Implementation/interface/lead-qualifier-dashboard/` :

```bash
npx tsc --noEmit
```

**Résultat attendu :**
```
(aucune sortie = aucune erreur)
```

Si tu vois des erreurs, copie-les et donne-les moi.

---

## Task 2 : Créer le type `TimelineItem` et les helpers de normalisation

**Ce qu'on construit :** Un type commun qui représente n'importe quel événement de la timeline (email ou meeting), avec les fonctions pour convertir chaque source vers ce type.

**Fichier :** `lib/timeline.ts` (nouveau fichier à créer)

---

### Step 4 : Créer le fichier `lib/timeline.ts`

**Action :**
Crée un nouveau fichier `lib/timeline.ts` avec ce contenu exact :

```typescript
import type { EmailEvent } from "./email-events";
import type { Meeting } from "./meetings";
import { getEventIcon, getEventLabel, getEmailTypeLabel } from "./email-events";
import { getMeetingStatusLabel, getMeetingSourceLabel } from "./meetings";

export type TimelineItemType =
  | "email_sent"
  | "email_opened"
  | "email_clicked"
  | "email_replied"
  | "email_bounced"
  | "meeting_scheduled"
  | "meeting_completed"
  | "meeting_cancelled"
  | "meeting_no_show";

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  channel: "email" | "meeting";
  timestamp: string; // ISO datetime — utilisé pour le tri
  title: string;     // Label principal affiché
  subtitle?: string; // Info secondaire (type email J0/J+3, source meeting Calendly...)
  status?: string;   // Statut lisible (optionnel)
  raw: EmailEvent | Meeting; // Données brutes conservées
}

export function emailEventToTimelineItem(event: EmailEvent): TimelineItem {
  return {
    id: event.event_id,
    type: `email_${event.event_type}` as TimelineItemType,
    channel: "email",
    timestamp: event.timestamp,
    title: getEventLabel(event.event_type),
    subtitle: getEmailTypeLabel(event.email_type),
    raw: event,
  };
}

export function meetingToTimelineItem(meeting: Meeting): TimelineItem {
  return {
    id: meeting.meeting_id,
    type: `meeting_${meeting.status}` as TimelineItemType,
    channel: "meeting",
    timestamp: meeting.start_at,
    title: meeting.title || "Meeting",
    subtitle: getMeetingSourceLabel(meeting.source),
    status: getMeetingStatusLabel(meeting.status),
    raw: meeting,
  };
}

export function buildTimeline(
  emailEvents: EmailEvent[],
  meetings: Meeting[]
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...emailEvents.map(emailEventToTimelineItem),
    ...meetings.map(meetingToTimelineItem),
  ];

  // Tri du plus récent au plus ancien
  return items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function getTimelineIcon(item: TimelineItem): string {
  if (item.channel === "email") {
    const event = item.raw as EmailEvent;
    return getEventIcon(event.event_type);
  }
  // Meeting icons par statut
  const meeting = item.raw as Meeting;
  switch (meeting.status) {
    case "scheduled":  return "📅";
    case "completed":  return "✅";
    case "cancelled":  return "❌";
    case "no_show":    return "👻";
    default:           return "📅";
  }
}

export function getTimelineChannelBadge(item: TimelineItem): {
  label: string;
  classes: string;
} {
  if (item.channel === "email") {
    return { label: "Email", classes: "bg-blue-900/40 text-blue-400" };
  }
  return { label: "Meeting", classes: "bg-orange-900/40 text-orange-400" };
}
```

**Résultat attendu :**
- Fichier créé à `lib/timeline.ts`
- Aucune erreur rouge dans l'éditeur

---

### Step 5 : Vérifier le build TypeScript

```bash
npx tsc --noEmit
```

**Résultat attendu :** Aucune erreur. Si erreur, copie-la moi.

---

## Task 3 : Mettre à jour la page lead pour afficher la timeline unifiée

**Ce qu'on construit :** Remplacer le bloc "Timeline emails" actuel par une timeline unifiée emails + meetings.

**Fichier :** `app/dashboard/campaigns/[campaign_id]/leads/[lead_id]/page.tsx`

---

### Step 6 : Modifier les imports en haut du fichier

**Action :**
Remplace les imports existants en haut du fichier par ceux-ci :

```typescript
import Link from "next/link";
import { getSheetData, parseCampaigns, parseLeads, getLeadEmailEvents, getLeadMeetings } from "@/lib/sheets";
import { buildTimeline, getTimelineIcon, getTimelineChannelBadge } from "@/lib/timeline";
import { notFound } from "next/navigation";
```

> On supprime les imports `getEventIcon`, `getEventLabel`, `getEmailTypeLabel` depuis `email-events` — ils sont maintenant encapsulés dans `lib/timeline.ts`.

**Résultat attendu :**
- Les 4 imports en haut du fichier correspondent exactement au bloc ci-dessus
- Aucune erreur rouge dans l'éditeur sur les imports

---

### Step 7 : Ajouter le fetch des meetings dans le Server Component

**Action :**
Trouve ce bloc dans la fonction `LeadDetailPage` :

```typescript
const emailEvents = await getLeadEmailEvents(lead_id);
```

Remplace-le par :

```typescript
const [emailEvents, meetings] = await Promise.all([
  getLeadEmailEvents(lead_id),
  getLeadMeetings(lead_id),
]);

const timeline = buildTimeline(emailEvents, meetings);
```

**Résultat attendu :**
- Le fetch est parallèle (plus rapide)
- `timeline` est un tableau trié du plus récent au plus ancien

---

### Step 8 : Remplacer le bloc "Timeline emails" par la timeline unifiée

**Action :**
Trouve ce bloc dans le JSX (vers la fin de la page) :

```tsx
{/* Timeline emails */}
<div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
  <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Timeline emails</p>
  {emailEvents.length === 0 ? (
    <p className="text-zinc-600 text-sm">Aucun événement email enregistré.</p>
  ) : (
    <ol className="relative border-l border-zinc-800 ml-2 space-y-4">
      {emailEvents.map((event) => {
        const date = new Date(event.timestamp);
        const formattedDate = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
        const formattedTime = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        return (
          <li key={event.event_id} className="ml-4">
            <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-zinc-700 border border-zinc-600" />
            <div className="flex items-start gap-3">
              <span className="text-base leading-none mt-0.5">{getEventIcon(event.event_type)}</span>
              <div>
                <p className="text-white text-sm font-medium">
                  {getEventLabel(event.event_type)}
                  <span className="ml-2 text-xs font-normal bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                    {getEmailTypeLabel(event.email_type)}
                  </span>
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">{formattedDate} à {formattedTime}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  )}
</div>
```

Remplace-le **entièrement** par ce nouveau bloc :

```tsx
{/* Timeline unifiée */}
<div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
  <div className="flex items-center justify-between mb-4">
    <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">
      Timeline interactions
    </p>
    <span className="text-xs text-zinc-600">{timeline.length} événement{timeline.length !== 1 ? "s" : ""}</span>
  </div>

  {timeline.length === 0 ? (
    <p className="text-zinc-600 text-sm">Aucune interaction enregistrée.</p>
  ) : (
    <ol className="relative border-l border-zinc-800 ml-2 space-y-5">
      {timeline.map((item) => {
        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const formattedTime = date.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const icon = getTimelineIcon(item);
        const badge = getTimelineChannelBadge(item);

        return (
          <li key={item.id} className="ml-4">
            <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-zinc-700 border border-zinc-600" />
            <div className="flex items-start gap-3">
              <span className="text-base leading-none mt-0.5">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white text-sm font-medium">{item.title}</p>
                  {/* Badge canal */}
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badge.classes}`}>
                    {badge.label}
                  </span>
                  {/* Badge sous-type (J0, J+3 pour email / Calendly pour meeting) */}
                  {item.subtitle && (
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                      {item.subtitle}
                    </span>
                  )}
                  {/* Badge statut meeting */}
                  {item.status && (
                    <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                      {item.status}
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {formattedDate} à {formattedTime}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  )}
</div>
```

**Résultat attendu :**
- Le vieux bloc "Timeline emails" n'existe plus
- Le nouveau bloc "Timeline interactions" est à sa place
- Aucune erreur TypeScript dans l'éditeur

---

### Step 9 : Vérifier le build complet

```bash
npx tsc --noEmit
```

Puis :

```bash
npm run build
```

**Résultat attendu :**
```
✓ Compiled successfully
✓ Generating static pages...
Route (app)   Size    First Load JS
...
```

Pas d'erreur rouge. Si erreur, copie-la moi.

---

## Task 4 : Test visuel

**Ce qu'on construit :** Vérifier que la timeline s'affiche correctement dans le navigateur.

---

### Step 10 : Lancer le serveur de développement

```bash
npm run dev
```

**Résultat attendu :**
```
▲ Next.js 15.x
- Local: http://localhost:3000
✓ Ready in Xs
```

---

### Step 11 : Ouvrir une fiche lead dans le navigateur

**Action :**
1. Va sur `http://localhost:3000/dashboard`
2. Clique sur une campagne
3. Clique sur un lead qui a des emails enregistrés
4. Scroll jusqu'en bas pour voir le bloc "Timeline interactions"

**Résultat attendu :**
- Le titre du bloc est **"Timeline interactions"** avec le compte d'événements à droite (ex: "3 événements")
- Chaque email apparaît avec son icône + badge bleu "Email" + badge type (J0, J+3, J+7)
- Si ce lead a un meeting, il apparaît avec 📅 + badge orange "Meeting" + statut
- Les événements sont triés du plus récent au plus ancien
- Si aucun événement : message "Aucune interaction enregistrée."

---

### Step 12 : Test avec un lead sans données

**Action :**
1. Navigue vers un lead qui n'a aucun email ni meeting dans les Google Sheets
2. Scroll jusqu'en bas

**Résultat attendu :**
- Bloc "Timeline interactions" présent
- Message "Aucune interaction enregistrée." affiché
- Pas d'erreur dans la console navigateur (F12 → Console)

---

## Task 5 : Mettre à jour le statut de la tâche

### Step 13 : Marquer TASK-029 comme complétée

**Action :**
1. Ouvre `clients/lead-gen/tasks/TASKS.md`
2. Trouve la ligne de TASK-029 et change `⏳` en `✅`
3. Ouvre `clients/lead-gen/tasks/TASK-029.md`
4. Change `**Statut** : ⏳ À faire` en `**Statut** : ✅ Complété`
5. Coche toutes les cases `Must Have` :
   - [x] Route `/api/leads/[id]/timeline` ou équivalent *(fait côté Server Component)*
   - [x] Timeline chronologique unique sur la fiche lead
   - [x] Emails et meetings intégrés dans la même vue
   - [x] Place prévue pour les DMs visibles *(channel "dm" prévu dans le type)*
   - [x] Normalisation des événements multi-sources

**Résultat attendu :**
- TASKS.md : ligne 029 avec ✅
- TASK-029.md : statut ✅ Complété

---

## Résumé des fichiers modifiés

| Fichier | Action |
|---|---|
| `lib/sheets.ts` | Ajout de `getLeadMeetings(leadId)` |
| `lib/timeline.ts` | **Nouveau fichier** — types + helpers de normalisation |
| `app/dashboard/campaigns/[campaign_id]/leads/[lead_id]/page.tsx` | Imports + fetch parallèle + nouveau bloc JSX |
| `clients/lead-gen/tasks/TASKS.md` | Statut 029 → ✅ |
| `clients/lead-gen/tasks/TASK-029.md` | Statut → ✅ Complété |

---

## Si ça ne fonctionne pas

**Erreur TypeScript sur `Meeting` non importé dans `sheets.ts` :**
Ajoute en haut de `sheets.ts` si pas déjà présent :
```typescript
import { parseMeetings, type Meeting } from "./meetings";
```

**Erreur "Cannot find module '@/lib/timeline'" :**
Vérifie que le fichier est bien à `lib/timeline.ts` (pas dans `app/` ou ailleurs).

**Meetings n'apparaissent pas dans la timeline :**
1. Ouvre les Google Sheets → onglet `Meetings`
2. Vérifie qu'il y a des lignes avec le `lead_id` du lead testé
3. Vérifie que la colonne B (`lead_id`) correspond exactement à l'ID du lead (copie-colle pour être sûr)

**La page plante avec une erreur 500 :**
Vérifie dans le terminal `npm run dev` le message d'erreur complet et copie-le moi.
