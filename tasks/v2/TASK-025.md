# TASK-025 — Funnel visuel par campagne

**Priorité** : 🟡 P3 — Vision santé campagne en un coup d'oeil
**Statut** : ✅ Complété
**Fichier cible** : `app/dashboard/page.tsx`

---

## Objectif

Sur la card campagne de la liste, remplacer les 5 chiffres en texte par une barre de funnel visuelle :

```
[████████░░] 40 raw → [█████░░░░░] 20 qualifiés → [███░░░░░░░] 12 contactés → [█░░░░░░░░░] 2 réponses
```

**Problème actuel** : les stats sont lisibles mais pas intuitives. Un taux de 2% de réponse sur 5 qualifiés ne se lit pas de la même façon que sur 50 qualifiés.

---

## Ce qu'il faut faire

### 1. Composant `FunnelBar`

```tsx
function FunnelBar({
  raw, qualified, contacted, replied,
}: {
  raw: number; qualified: number; contacted: number; replied: number;
}) {
  const max = Math.max(raw, 1);
  const steps = [
    { label: "Raw",       value: raw,        color: "bg-zinc-600" },
    { label: "Qualifiés", value: qualified,   color: "bg-blue-500" },
    { label: "Contactés", value: contacted,   color: "bg-orange-500" },
    { label: "Réponses",  value: replied,     color: "bg-emerald-500" },
  ];

  return (
    <div className="flex items-end gap-1.5">
      {steps.map((step) => (
        <div key={step.label} className="flex flex-col items-center gap-1">
          <span className="text-xs text-zinc-500">{step.value}</span>
          <div className="w-8 bg-zinc-800 rounded-sm overflow-hidden" style={{ height: "24px" }}>
            <div
              className={`${step.color} rounded-sm transition-all`}
              style={{ height: `${Math.max((step.value / max) * 100, step.value > 0 ? 10 : 0)}%` }}
            />
          </div>
          <span className="text-xs text-zinc-600">{step.label}</span>
        </div>
      ))}
    </div>
  );
}
```

### 2. Intégrer dans la card campagne

Dans `app/dashboard/page.tsx`, dans le `.map((c) => ...)` des campagnes :

Remplacer les stats texte :
```tsx
{/* Ancien : 5 stats en texte */}
{[
  { label: "Leads raw",  value: c.total_leads_raw },
  ...
].map(...)}
```

Par le composant funnel :
```tsx
<FunnelBar
  raw={parseInt(c.total_leads_raw) || 0}
  qualified={parseInt(c.total_leads_qualified) || 0}
  contacted={parseInt(c.emails_envoyés) || 0}
  replied={Math.round(parseFloat(c.taux_réponse) * parseInt(c.emails_envoyés) / 100) || 0}
/>
```

---

## Note

Le nombre de "réponses" n'est pas stocké directement — on le calcule depuis `taux_réponse` × `emails_envoyés`. Si WF6 stocke un champ `emails_répondus` directement, utiliser celui-là.

---

## Critères de validation

- [ ] Barre de funnel visible sur chaque card campagne
- [ ] Hauteur proportionnelle aux valeurs (relatif au max = raw)
- [ ] Labels sous chaque barre
- [ ] Valeurs numériques au-dessus de chaque barre
- [ ] Barre vide (0) affichée avec hauteur minimale visible
- [ ] Status badge toujours présent à droite
