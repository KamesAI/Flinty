# TASK-017 — Timeline email (onglet Email_Events)

**Priorité** : 🟠 Impact fort long terme
**Statut** : ✅ Complété
**Nécessite** : Ajout onglet `Email_Events` dans le GSheet + MAJ WF3/WF4/WF5

---

## Objectif

Afficher une vraie timeline email sur la fiche lead :
```
[J0]  📧 Email envoyé le 2026-03-01 à 09h12
[J0]  👁  Ouvert le 2026-03-01 à 14h35
[J+3] 📧 Relance envoyée le 2026-03-04 à 09h00
[J+3] 🖱  Lien cliqué le 2026-03-04 à 16h22
```

---

## Ce qu'il faut faire

### 1. Créer l'onglet `Email_Events` dans le GSheet

Headers (colonnes A→G) :
```
event_id | lead_id | campaign_id | event_type | email_type | timestamp | metadata
```

- `event_type` : `sent` | `opened` | `clicked` | `replied` | `bounced`
- `email_type` : `j0` | `j3` | `j7`
- `metadata` : JSON string optionnel (ex: `{"subject": "..."}`)

### 2. Mettre à jour WF3 (Email J0)

Après envoi de l'email via Resend, ajouter un nœud Google Sheets qui écrit dans `Email_Events` :
```json
{
  "event_id": "EVT_{{timestamp}}_{{lead_id}}",
  "lead_id": "{{lead_id}}",
  "campaign_id": "{{campaign_id}}",
  "event_type": "sent",
  "email_type": "j0",
  "timestamp": "{{now}}",
  "metadata": ""
}
```

### 3. Mettre à jour WF4 (Webhooks Resend)

WF4 reçoit les events Resend (opened, clicked, replied, bounced). Ajouter une écriture dans `Email_Events` pour chaque event.

### 4. Ajouter l'API route

Créer `app/api/leads/[id]/events/route.ts` :

```typescript
import { NextResponse } from "next/server";
import { getSheetData } from "@/lib/sheets";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: lead_id } = await params;
  const rows = await getSheetData("Email_Events!A:G");
  const events = rows.slice(1)
    .filter((r) => r[1] === lead_id)
    .map((r) => ({
      event_id: r[0],
      lead_id: r[1],
      campaign_id: r[2],
      event_type: r[3],
      email_type: r[4],
      timestamp: r[5],
      metadata: r[6],
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return NextResponse.json({ events });
}
```

### 5. Afficher la timeline sur la fiche lead

Remplacer le placeholder actuel dans `lead/[lead_id]/page.tsx` par un vrai composant timeline.

---

## Critères de validation

- [ ] Onglet `Email_Events` créé dans le GSheet
- [ ] WF3 écrit dans Email_Events après envoi J0
- [ ] WF4 écrit dans Email_Events pour chaque event Resend
- [ ] API route `/api/leads/[id]/events` fonctionnelle
- [ ] Timeline affichée sur la fiche lead (ordre chronologique)
