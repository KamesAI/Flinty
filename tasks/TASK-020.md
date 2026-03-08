# TASK-020 — Vue "Leads chauds" sur dashboard home

**Priorité** : 🔴 P1 — ROI immédiat, 0 nouvel écran
**Statut** : ✅ Complété
**Fichier cible** : `app/dashboard/page.tsx`

---

## Objectif

Afficher en haut du dashboard principal une section "🔥 À traiter maintenant" qui agrège tous les leads en statut `replied` ou `clicked` toutes campagnes confondues, avec un lien direct vers leur fiche.

**Problème actuel** : pour trouver un lead qui a répondu, il faut ouvrir chaque campagne et scroller le tableau. C'est bloquant pour la prospection quotidienne.

---

## Ce qu'il faut faire

### 1. Dans `app/dashboard/page.tsx`

Ajouter une query pour récupérer les leads chauds :

```typescript
const leadRows = await getSheetData("Leads_Qualified!A:O");
const allLeads = parseLeads(leadRows);
const hotLeads = allLeads.filter(
  (l) => l.statut_email === "replied" || l.statut_email === "clicked"
);
```

### 2. Section "À traiter maintenant"

Afficher **avant** les KPIs globaux, uniquement si `hotLeads.length > 0` :

```tsx
{hotLeads.length > 0 && (
  <div className="mb-8">
    <p className="text-xs font-semibold tracking-widest uppercase text-orange-500 mb-3">
      🔥 À traiter maintenant — {hotLeads.length} lead{hotLeads.length > 1 ? "s" : ""}
    </p>
    <div className="space-y-2">
      {hotLeads.map((lead) => (
        <Link
          key={lead.lead_id}
          href={`/dashboard/campaigns/${lead.campaign_id}/leads/${lead.lead_id}`}
          className="flex items-center justify-between bg-zinc-950 border border-orange-500/30 rounded-xl px-5 py-3 hover:border-orange-500/60 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              lead.statut_email === "replied"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-green-400/20 text-green-300"
            }`}>
              {lead.statut_email === "replied" ? "✅ Répondu" : "🖱 Cliqué"}
            </span>
            <span className="text-white text-sm font-medium group-hover:text-orange-400 transition-colors">
              {lead.nom}
            </span>
            <span className="text-zinc-500 text-xs">{lead.ville} · {lead.poste}</span>
          </div>
          <span className="text-zinc-600 text-xs">→ Voir la fiche</span>
        </Link>
      ))}
    </div>
  </div>
)}
```

### 3. Modifier l'alert banner existant

Remplacer l'alert banner flou actuel (qui compte juste les campagnes avec réponses) par la section leads chauds ci-dessus. Supprimer l'alert banner `replied > 0`.

---

## Données requises

Les champs utilisés depuis `Lead` :
- `lead_id` — pour construire le lien
- `campaign_id` — pour construire le lien
- `nom`, `ville`, `poste` — affichage
- `statut_email` — filtre (`replied` | `clicked`)

Tous ces champs existent déjà dans `lib/sheets.ts`.

---

## Critères de validation

- [ ] Section visible uniquement si leads replied/clicked existent
- [ ] Lien direct vers la fiche lead
- [ ] Badge coloré (emerald = replied, vert = clicked)
- [ ] Section absente = pas de bruit visuel inutile
- [ ] Pas de régression sur les KPIs globaux existants
