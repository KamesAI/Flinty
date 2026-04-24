# TASK-021 — Boutons actions + indicateur pipeline campagne

**Priorité** : 🔴 P1 — Rend le dashboard actionnable
**Statut** : ✅ Complété
**Fichiers cibles** :
- `app/dashboard/campaigns/[campaign_id]/page.tsx`
- `app/api/campaigns/[id]/qualify/route.ts` (à créer)
- `app/api/campaigns/[id]/send-j0/route.ts` (à créer)

---

## Objectif

Ajouter sur la page détail campagne :
1. **Bouton "▶ Qualifier les leads"** → appelle WF2 n8n
2. **Bouton "📧 Envoyer emails J0"** → appelle WF3 n8n
3. **Indicateur d'étape du pipeline** : visualiser où en est la campagne

**Problème actuel** : impossible d'agir depuis l'UI. Il faut appeler les webhooks n8n manuellement. 10 clics à chaque campagne.

---

## Ce qu'il faut faire

### 1. Indicateur d'étape pipeline

Sous le header de la campagne, afficher une barre d'étapes :

```
[✅ Leads générés] → [✅ Qualifiés] → [⏳ J0 envoyés] → [⏳ Relances] → [🏁 Terminé]
```

Logique de détermination des étapes :
- **Leads générés** : `campaign.total_leads_raw > 0`
- **Qualifiés** : `campaign.total_leads_qualified > 0`
- **J0 envoyés** : `campaign.emails_envoyés > 0`
- **Relances** : au moins 1 lead en `relance_1` ou `relance_2`
- **Terminé** : statut campagne = `paused` ou `completed`

```tsx
const steps = [
  { label: "Leads générés", done: parseInt(campaign.total_leads_raw) > 0 },
  { label: "Qualifiés",     done: parseInt(campaign.total_leads_qualified) > 0 },
  { label: "J0 envoyés",   done: parseInt(campaign.emails_envoyés) > 0 },
  { label: "Relances",     done: leads.some(l => l.statut_email === "relance_1" || l.statut_email === "relance_2") },
];
```

Rendu HTML :
```tsx
<div className="flex items-center gap-2 mb-8 overflow-x-auto">
  {steps.map((step, i) => (
    <React.Fragment key={step.label}>
      <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${
        step.done ? "bg-green-500/20 text-green-400" : "bg-zinc-800 text-zinc-500"
      }`}>
        <span>{step.done ? "✅" : "⏳"}</span>
        <span>{step.label}</span>
      </div>
      {i < steps.length - 1 && <span className="text-zinc-700">→</span>}
    </React.Fragment>
  ))}
</div>
```

### 2. Boutons d'action (Client Component)

Créer un composant client `app/dashboard/campaigns/[campaign_id]/ActionButtons.tsx` :

```tsx
"use client";
import { useState } from "react";

export function ActionButtons({ campaignId }: { campaignId: string }) {
  const [qualifying, setQualifying] = useState(false);
  const [sendingJ0, setSendingJ0] = useState(false);

  async function handleQualify() {
    setQualifying(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/qualify`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Qualification lancée — ${data.leads_count} leads envoyés à n8n`);
      }
    } finally {
      setQualifying(false);
    }
  }

  async function handleSendJ0() {
    setSendingJ0(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/send-j0`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Emails J0 lancés — ${data.leads_count} emails envoyés`);
      }
    } finally {
      setSendingJ0(false);
    }
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleQualify}
        disabled={qualifying}
        className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-medium text-sm hover:border-orange-500/50 transition-colors disabled:opacity-50"
      >
        {qualifying ? "Qualification..." : "▶ Qualifier les leads"}
      </button>
      <button
        onClick={handleSendJ0}
        disabled={sendingJ0}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {sendingJ0 ? "Envoi..." : "📧 Envoyer emails J0"}
      </button>
    </div>
  );
}
```

### 3. API Route — Qualifier leads

Créer `app/api/campaigns/[id]/qualify/route.ts` :

```typescript
import { NextResponse } from "next/server";
import { getSheetData, parseLeads } from "@/lib/sheets";

const WF2_WEBHOOK = process.env.N8N_WF2_WEBHOOK!;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaign_id } = await params;
  const rows = await getSheetData("Leads_Raw!A:J");
  // Appel simplifié — envoie le campaign_id à WF2 qui s'occupe de tout
  const res = await fetch(WF2_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaign_id }),
  });
  if (!res.ok) return NextResponse.json({ success: false }, { status: 502 });
  return NextResponse.json({ success: true, leads_count: rows.length - 1 });
}
```

### 4. API Route — Envoyer J0

Créer `app/api/campaigns/[id]/send-j0/route.ts` :

```typescript
import { NextResponse } from "next/server";
import { getSheetData, parseLeads } from "@/lib/sheets";

const WF3_WEBHOOK = process.env.N8N_WF3_WEBHOOK!;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaign_id } = await params;
  const rows = await getSheetData("Leads_Qualified!A:O");
  const leads = parseLeads(rows).filter(
    (l) => l.campaign_id === campaign_id && l.statut_email === "new"
  );
  if (leads.length === 0) {
    return NextResponse.json({ success: false, message: "Aucun lead new à contacter" });
  }
  const res = await fetch(WF3_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaign_id, leads_count: leads.length }),
  });
  if (!res.ok) return NextResponse.json({ success: false }, { status: 502 });
  return NextResponse.json({ success: true, leads_count: leads.length });
}
```

### 5. Variables d'environnement à ajouter dans `.env.local`

```
N8N_WF2_WEBHOOK=https://staging-n8n.kamesai.com/webhook/kames-qualify-leads
N8N_WF3_WEBHOOK=https://staging-n8n.kamesai.com/webhook/kames-send-email-j0
```

---

## Critères de validation

- [ ] Indicateur pipeline visible sur la page détail campagne
- [ ] Bouton "Qualifier" appelle WF2 et affiche confirmation
- [ ] Bouton "Envoyer J0" appelle WF3 et affiche confirmation
- [ ] Boutons disabled pendant l'appel (pas de double-clic)
- [ ] Variables d'env documentées dans `.env.local.example`
