# TASK-024 — Sidebar enrichie

**Priorité** : 🟡 P3 — Utile quand 5+ campagnes actives
**Statut** : ✅ Complété
**Fichier cible** : `app/dashboard/layout.tsx`

---

## Objectif

Améliorer la sidebar pour qu'elle soit un vrai hub de navigation :
1. **Séparer "Campagnes actives" des autres** dans la liste de la sidebar
2. **Badge rouge** visible en permanence avec le nombre de leads chauds (replied + clicked)

**Problème actuel** : la sidebar affiche toutes les campagnes sans distinction de statut, et aucun indicateur de leads en attente.

---

## Ce qu'il faut faire

### 1. Récupérer les leads chauds dans le layout

Le layout est un Server Component — ajouter une query pour les leads :

```typescript
let hotLeadsCount = 0;
try {
  const leadRows = await getSheetData("Leads_Qualified!A:N");
  const allLeads = parseLeads(leadRows);
  hotLeadsCount = allLeads.filter(
    (l) => l.statut_email === "replied" || l.statut_email === "clicked"
  ).length;
} catch {
  // silently fail
}
```

### 2. Séparer les campagnes actives dans la sidebar

```typescript
const activeCampaigns = campaigns.filter((c) => c.statut === "active" || c.statut === "generating");
const otherCampaigns = campaigns.filter((c) => c.statut !== "active" && c.statut !== "generating");
```

### 3. Mettre à jour le lien "Toutes les campagnes" avec le badge

```tsx
<Link
  href="/dashboard"
  className="flex items-center justify-between px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 text-sm transition-colors"
>
  <span>Toutes les campagnes</span>
  {hotLeadsCount > 0 && (
    <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[18px] text-center">
      {hotLeadsCount}
    </span>
  )}
</Link>
```

### 4. Liste sidebar avec sections séparées

```tsx
{activeCampaigns.length > 0 && (
  <div className="flex-1 overflow-y-auto p-3">
    <p className="text-xs font-semibold tracking-widest uppercase text-zinc-600 px-2 mb-2">
      Actives
    </p>
    <div className="space-y-0.5">
      {activeCampaigns.map((c) => (
        <SidebarCampaignLink key={c.campaign_id} campaign={c} />
      ))}
    </div>

    {otherCampaigns.length > 0 && (
      <>
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-600 px-2 mb-2 mt-4">
          Autres
        </p>
        <div className="space-y-0.5">
          {otherCampaigns.map((c) => (
            <SidebarCampaignLink key={c.campaign_id} campaign={c} />
          ))}
        </div>
      </>
    )}
  </div>
)}
```

---

## Critères de validation

- [ ] Badge rouge visible sur "Toutes les campagnes" si leads chauds existent
- [ ] Badge absent si aucun lead chaud (pas de "0")
- [ ] Campagnes actives séparées visuellement dans la sidebar
- [ ] Pas de régression sur la navigation existante
- [ ] Performance acceptable (1 query supplémentaire dans le layout)
