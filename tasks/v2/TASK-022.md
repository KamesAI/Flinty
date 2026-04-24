# TASK-022 — Afficher raison_score sur fiche lead

**Priorité** : 🟠 P2 — 5-10 lignes de code, impact fort
**Statut** : ✅ Complété
**Fichiers cibles** :
- `lib/sheets.ts` — ajouter `raison_score` au type `Lead` et au parser
- `app/dashboard/campaigns/[campaign_id]/leads/[lead_id]/page.tsx`

---

## Objectif

Afficher la raison du score Claude (champ `raison_score`) sur la fiche lead.

**Problème actuel** : Le champ existe dans le Google Sheet (colonne O ou P) mais il n'est pas parsé ni affiché. C'est exactement ce dont tu as besoin pour personnaliser l'approche commerciale.

**Exemple de valeur** : `"TPE de 3 personnes, site web outdated, pas de présence digitale — profil idéal pour répondeur IA"`

---

## Ce qu'il faut faire

### 1. Vérifier la colonne dans le GSheet

Dans l'onglet `Leads_Qualified`, vérifier quelle colonne contient `raison_score`.
Le plan v2 mentionne 14 colonnes (A→N), mais le code lit `A:O` (15 colonnes).
La colonne O est probablement `raison_score` ou `last_email_sent_at`.

**Action** : ouvrir le GSheet et vérifier les headers en ligne 1.

### 2. Mettre à jour `lib/sheets.ts`

Ajouter `raison_score` à l'interface `Lead` :

```typescript
export interface Lead {
  lead_id: string;
  campaign_id: string;
  nom: string;
  site: string;
  ville: string;
  score: string;
  email: string;
  téléphone: string;
  prénom: string;
  poste: string;
  secteur: string;
  taille_equipe: string;
  has_ia_services: string;
  statut_email: string;
  raison_score: string;      // ← AJOUTER
  last_email_sent_at?: string;
}
```

Dans `parseLeads()`, mapper la bonne colonne :

```typescript
export function parseLeads(rows: string[][]): Lead[] {
  return rows.slice(1).map((r) => ({
    // ... colonnes existantes ...
    raison_score: r[14] ?? "",         // colonne O (index 14)
    last_email_sent_at: r[15] ?? "",   // colonne P (index 15) si existe
  }));
}
```

### 3. Afficher sur la fiche lead

Dans `app/dashboard/campaigns/[campaign_id]/leads/[lead_id]/page.tsx`, ajouter une card dédiée :

```tsx
{lead.raison_score && (
  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-6">
    <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">
      Analyse Claude
    </p>
    <p className="text-white text-sm leading-relaxed">{lead.raison_score}</p>
    <p className="text-zinc-600 text-xs mt-3">Score : <span className={scoreColor + " font-bold"}>{lead.score}/100</span></p>
  </div>
)}
```

Positionner **entre** la card lead principale et la card historique emails.

---

## Critères de validation

- [ ] `raison_score` parsé depuis la bonne colonne du GSheet
- [ ] Card "Analyse Claude" visible sur la fiche lead
- [ ] Card absente si champ vide (pas de bruit visuel)
- [ ] Score rappelé dans la card pour contexte
