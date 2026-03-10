# TASK-019 — Mode mobile responsive

**Priorité** : 🟡 Backlog
**Statut** : ✅ Complété

---

## Objectif

Rendre le dashboard utilisable sur mobile (iPhone/Android) pour consulter les leads chauds en déplacement.

---

## Ce qu'il faut faire

### 1. Sidebar mobile (hamburger menu)

Sur mobile, la sidebar fixe de 56px devient un drawer :
- Bouton hamburger dans le header mobile
- Overlay sombre quand la sidebar est ouverte
- Fermeture au clic sur un lien

Composant client `MobileSidebar` wrappant le contenu sidebar existant.

### 2. Tableau leads → cards sur mobile

Sur mobile (`sm:hidden`), remplacer le tableau par des cards empilées :

```tsx
{/* Mobile view */}
<div className="sm:hidden space-y-2">
  {leads.map((lead) => (
    <Link href={...} className="block bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-white">{lead.nom}</span>
        <span className={`text-xs font-bold ${scoreColor}`}>{lead.score}/100</span>
      </div>
      <p className="text-zinc-500 text-xs">{lead.ville} · {lead.poste}</p>
      <div className="mt-2">
        <span className={badge.className + " text-xs px-2 py-0.5 rounded"}>{badge.label}</span>
      </div>
    </Link>
  ))}
</div>

{/* Desktop view */}
<div className="hidden sm:block">
  {/* tableau existant */}
</div>
```

### 3. KPIs grid responsive

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
```

### 4. KPIs campagne (6 colonnes → 3×2 sur mobile)

```tsx
<div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
```

---

## Critères de validation

- [ ] Dashboard utilisable sur iPhone 14 (390px wide)
- [ ] Sidebar accessible via hamburger sur mobile
- [ ] Tableau leads remplacé par cards sur mobile
- [ ] KPIs lisibles sur mobile (2 colonnes)
- [ ] Pas de régression sur desktop
