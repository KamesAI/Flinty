# TASK-018 — Actions manuelles sur leads

**Priorité** : 🟠
**Statut** : ⏳ À faire
**Fichiers cibles** :
- `app/dashboard/campaigns/[campaign_id]/leads/[lead_id]/page.tsx`
- `app/api/leads/[id]/status/route.ts` (à créer)

---

## Objectif

Permettre de changer manuellement le statut d'un lead et de forcer une relance depuis la fiche lead.

**Actions à implémenter :**
1. Changer le statut email d'un lead (dropdown ou boutons)
2. Forcer une relance immédiate (déclenche WF3 ou WF5 pour ce lead uniquement)
3. Marquer comme "disqualifié"

---

## Ce qu'il faut faire

### 1. API Route PATCH /api/leads/[id]/status

```typescript
// app/api/leads/[id]/status/route.ts
import { NextResponse } from "next/server";
import { getSheetData, updateRow } from "@/lib/sheets";
import { parseLeads } from "@/lib/sheets";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: lead_id } = await params;
  const { statut_email } = await req.json();

  const rows = await getSheetData("Leads_Qualified!A:O");
  const rowIndex = rows.findIndex((r) => r[0] === lead_id);
  if (rowIndex === -1) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Colonne N = index 13 = statut_email (0-indexed)
  await updateRow(`Leads_Qualified!N${rowIndex + 1}`, [[statut_email]]);

  return NextResponse.json({ success: true, statut_email });
}
```

### 2. Composant client `LeadActions`

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUTS = ["new", "contacted", "opened", "clicked", "replied", "bounced", "disqualified"];

export function LeadActions({ leadId, currentStatut }: { leadId: string; currentStatut: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function changeStatut(newStatut: string) {
    setLoading(true);
    await fetch(`/api/leads/${leadId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut_email: newStatut }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 mt-4">
      <span className="text-xs text-zinc-500">Changer statut :</span>
      <select
        value={currentStatut}
        onChange={(e) => changeStatut(e.target.value)}
        disabled={loading}
        className="bg-zinc-900 border border-zinc-700 text-white text-xs rounded-md px-2 py-1"
      >
        {STATUTS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {loading && <span className="text-zinc-500 text-xs">Mise à jour...</span>}
    </div>
  );
}
```

### 3. Vérifier que `updateRow` existe dans `lib/sheets.ts`

La fonction `updateRow` doit accepter une plage de type `"Leads_Qualified!N5"` et une valeur 2D `[[value]]`.

---

## Critères de validation

- [ ] Dropdown statut visible sur la fiche lead
- [ ] Changement de statut écrit dans le GSheet
- [ ] Page se rafraîchit après mise à jour
- [ ] Tous les statuts valides proposés
