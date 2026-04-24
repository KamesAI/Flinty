# TASK-023 — Filtres statut + score sur tableau leads

**Priorité** : 🟠 P2 — Confort quotidien
**Statut** : ✅ Complété
**Fichier cible** : `app/dashboard/campaigns/[campaign_id]/page.tsx`

---

## Objectif

Ajouter des filtres sur le tableau de leads de la page détail campagne :
- **Filtre statut** : "Tous" | "new" | "contacted" | "opened" | "replied" | "clicked" | "bounced"
- **Filtre score** : "Tous" | "≥ 70" | "≥ 50" | "< 50"

**Problème actuel** : avec 20-50 leads par campagne, impossible de cibler les leads qui ont répondu ou les meilleurs scores sans scroller tout le tableau.

---

## Ce qu'il faut faire

### Approche : URL searchParams (pas de state client)

Utiliser les searchParams Next.js pour éviter un Client Component sur toute la page. Les filtres seront des liens `<a>` ou des formulaires `<form>` avec `method="get"`.

### 1. Lire les filtres depuis searchParams

```typescript
export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaign_id: string }>;
  searchParams: Promise<{ statut?: string; score?: string }>;
}) {
  const { campaign_id } = await params;
  const { statut: statutFilter = "all", score: scoreFilter = "all" } = await searchParams;

  // ... fetch data ...

  let filtered = leads;
  if (statutFilter !== "all") {
    filtered = filtered.filter((l) => l.statut_email === statutFilter);
  }
  if (scoreFilter === "70") {
    filtered = filtered.filter((l) => parseInt(l.score) >= 70);
  } else if (scoreFilter === "50") {
    filtered = filtered.filter((l) => parseInt(l.score) >= 50);
  } else if (scoreFilter === "low") {
    filtered = filtered.filter((l) => parseInt(l.score) < 50);
  }
```

### 2. Barre de filtres

```tsx
{/* Filters */}
<div className="flex items-center gap-4 mb-4 flex-wrap">
  {/* Statut filter */}
  <div className="flex items-center gap-1">
    {["all", "new", "contacted", "opened", "replied", "clicked", "bounced"].map((s) => (
      <a
        key={s}
        href={`?statut=${s}&score=${scoreFilter}`}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          statutFilter === s
            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
            : "bg-zinc-900 text-zinc-500 hover:text-white"
        }`}
      >
        {s === "all" ? "Tous" : s}
      </a>
    ))}
  </div>

  {/* Score filter */}
  <div className="flex items-center gap-1 ml-4">
    <span className="text-zinc-600 text-xs mr-1">Score :</span>
    {[
      { value: "all", label: "Tous" },
      { value: "70",  label: "≥ 70" },
      { value: "50",  label: "≥ 50" },
      { value: "low", label: "< 50" },
    ].map((opt) => (
      <a
        key={opt.value}
        href={`?statut=${statutFilter}&score=${opt.value}`}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          scoreFilter === opt.value
            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
            : "bg-zinc-900 text-zinc-500 hover:text-white"
        }`}
      >
        {opt.label}
      </a>
    ))}
  </div>

  {/* Compteur */}
  <span className="text-zinc-600 text-xs ml-auto">
    {filtered.length} lead{filtered.length > 1 ? "s" : ""}
    {filtered.length !== leads.length && ` sur ${leads.length}`}
  </span>
</div>
```

### 3. Utiliser `filtered` dans le tableau

Remplacer `leads.map(...)` par `filtered.map(...)` dans le tableau.

---

## Critères de validation

- [ ] Filtre statut fonctionnel (filtre le tableau en temps réel via URL)
- [ ] Filtre score fonctionnel
- [ ] Combinaison des deux filtres fonctionne
- [ ] Compteur "X leads sur Y" visible quand filtre actif
- [ ] Filtre actif visuellement distinguable (orange)
- [ ] Pas de régression sur les KPIs en haut de page (ils comptent toujours les leads non-filtrés)
