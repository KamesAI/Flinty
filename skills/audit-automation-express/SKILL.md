---
name: audit-automatisation-express
description: Génère des audits d'automatisation professionnels avec calcul précis du ROI, KPIs détaillés, et pricing recommandé (15-25% de la valeur économisée)
---

# Skill: audit-automatisation-express

## Purpose
Qualifier rapidement un prospect TPE/PME et identifier 3 Quick Wins automatisables à <1500€ avec calcul précis du ROI, des économies réalisées et du prix de vente recommandé (15-25% de la valeur économisée).

## Context
Agence Kames AI - Automatisation IA pour entreprises françaises 1-50 personnes.
Objectif : Transformer un premier appel en proposition chiffrée professionnelle en <24h.
Stack technique : n8n, Google Workspace, Notion, Slack, Firebase.

## Input Format
```yaml
entreprise:
  nom: string
  secteur: enum[comptabilité, juridique, immobilier, santé, e-commerce, photographie, consulting, artisanat, autre]
  effectif: number
  budget_auto_mensuel: number (€)
  
processus_manuels:
  - nom: string
    temps_hebdo: number (heures)
    frequence: enum[quotidien, hebdomadaire, mensuel]
    outils_utilises: list
    niveau_douleur: enum[faible, moyen, élevé, critique]
    volumetrie: string (ex: "50 factures/mois", "200 emails/semaine")
```

## Analysis Framework

### 1. Score d'Automatisabilité (/100)

**Calculer selon :**
- **Répétitivité** (0-30 pts)
  - Quotidien : 30 pts
  - Hebdomadaire : 20 pts
  - Mensuel : 10 pts
  
- **Volumétrie** (0-20 pts)
  - >100 actions/mois : 20 pts
  - 50-100 actions/mois : 15 pts
  - 20-50 actions/mois : 10 pts
  - <20 actions/mois : 5 pts
  
- **Outils connectables** (0-25 pts)
  - Tous les outils ont API/intégration n8n : 25 pts
  - 75% des outils connectables : 18 pts
  - 50% des outils connectables : 10 pts
  - <50% connectables : 5 pts
  
- **Budget vs ROI** (0-25 pts)
  - Budget > valeur économisée/an : 25 pts
  - Budget = 50-100% valeur économisée/an : 18 pts
  - Budget = 25-50% valeur économisée/an : 10 pts
  - Budget < 25% valeur économisée/an : 5 pts

**Interprétation :**
- 80-100 : 🟢 POTENTIEL EXCEPTIONNEL
- 60-79 : 🟡 BON POTENTIEL
- 40-59 : 🟠 POTENTIEL MOYEN
- <40 : 🔴 POTENTIEL FAIBLE

### 2. Identification Quick Wins

**Critères de sélection :**
- Prix total < 1500€
- Delivery < 10 jours ouvrés
- ROI < 4 mois
- Pas de dépendances externes bloquantes (API payantes, logiciels propriétaires fermés)
- Workflow ≤ 10 nodes n8n

**Priorisation :**
1. Impact immédiat (économie temps la plus forte)
2. Facilité technique (outils déjà maîtrisés par Kames)
3. "Effet wow" pour le client (visible, tangible)

### 3. Calcul ROI & Pricing (CRITIQUE)

**Étape A : Calculer la Valeur Économisée**

```
Temps économisé hebdo (h) × Nombre de semaines/an (52) = Temps total économisé/an
Temps total économisé/an × Taux horaire client = Valeur économisée/an
```

**Taux horaire par secteur (estimation conservative) :**
- Comptabilité : 40€/h
- Juridique : 60€/h
- Santé (médecins, dentistes) : 80€/h
- Immobilier : 35€/h
- E-commerce : 30€/h
- Photographie : 25€/h
- Consulting : 50€/h
- Artisanat : 25€/h
- Autre : 30€/h par défaut

**Étape B : Calculer le Coût de la Solution Kames**

**Grille de prix baseline :**
- **Setup initial** (connexions API + OAuth) : 200-300€
- **Workflow simple** (2-3 nodes) : 300€
- **Workflow standard** (4-6 nodes) : 500€
- **Workflow complexe** (7-10 nodes) : 800€
- **Workflow très complexe** (11-15 nodes) : 1200€

**Add-ons :**
- **Formation client** (1h) : 150€
- **Documentation complète** : 100€
- **Template email/notification custom** : 75€/template
- **Dashboard de suivi** (simple) : 400€
- **Migration données** (si nécessaire) : 200-500€

**Multipliers :**
- **Urgence** (livraison <7 jours) : ×1.3
- **Données sensibles** (santé, juridique, RGPD strict) : +200€
- **Intégration logiciel propriétaire** (API complexe) : +300€

**Étape C : Calculer le Prix de Vente Recommandé**

**Formule Kames :**
```
Prix de vente = MAX(
  Coût solution Kames,
  Valeur économisée annuelle × 15-25%
)
```

**Règle de décision :**
- Si Valeur économisée/an > 5000€ → Utiliser 15% (pour rester attractif)
- Si Valeur économisée/an = 2000-5000€ → Utiliser 20%
- Si Valeur économisée/an < 2000€ → Utiliser 25% ou coût Kames (le plus élevé)

**Étape D : Calculer le ROI Client**

```
ROI (en mois) = Prix de vente / (Valeur économisée annuelle / 12)
```

**Target ROI :** < 4 mois pour un Quick Win

### 4. Structuration de l'Output

**Pour chaque Quick Win, TOUJOURS inclure :**

1. **Problème actuel** (2-3 phrases, empathie)
2. **Solution Kames** (workflow détaillé en 4-6 étapes numérotées)
3. **Outils utilisés** (liste précise)
4. **Gains estimés** avec tableau de calcul détaillé :

```
Temps économisé par action : Xh → Ymin
Nombre d'actions par mois : Z
Temps total économisé/mois : A heures
Temps total économisé/an : B heures
Taux horaire client : C€/h
VALEUR ÉCONOMISÉE/AN : B × C = D€
```

5. **Coût Solution Kames** (détail ligne par ligne)
6. **Prix de Vente Recommandé** avec justification
7. **ROI Client** (en mois)
8. **Délai de livraison** (jours ouvrés)

## Output Structure

```markdown
# 🎯 AUDIT AUTOMATISATION - [Nom Entreprise]

## Score Global : XX/100
[Emoji + Texte selon interprétation]

### Détail du Score
- Répétitivité : X/30 ([justification])
- Volumétrie : X/20 ([justification])
- Outils connectables : X/25 ([justification])
- Budget vs ROI : X/25 ([justification])

---

## 💡 Top 3 Quick Wins

### 🥇 Quick Win #1 : [Nom Explicite]

**Problème actuel :**  
[Description empathique de la douleur, 2-3 phrases]

**Solution Kames :**  
Workflow n8n qui automatise X% du processus :
1. [Étape 1 détaillée]
2. [Étape 2 détaillée]
3. [Étape 3 détaillée]
4. [Étape 4 détaillée]
[...]

**Outils utilisés :**  
- [Outil 1] ([rôle précis])
- [Outil 2] ([rôle précis])
- [...]

**Gains estimés :**  

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Temps par action | Xh | Ymin | -Z% |
| Actions par mois | A | A | - |
| Temps total/mois | Bh | Ch | Dh économisées |
| Temps total/an | Eh | Fh | Gh économisées |
| Taux horaire | I€/h | - | - |
| **VALEUR ÉCONOMISÉE/AN** | - | - | **J€** |

**Coût Solution Kames :**  
```
Setup initial : 250€
Développement workflow (X nodes) : 500€
Templates personnalisés : 100€
Formation client (1h) : 150€
Documentation : 100€
─────────────────────────
COÛT TOTAL KAMES : 1100€
```

**Prix de Vente Recommandé :** K€  
*(Valeur économisée annuelle J€ × 20% = L€, on recommande K€ car [justification])*

**ROI Client :** M mois  
*(Prix K€ / (Valeur économisée J€ / 12) = M mois)*

**Délai :** N jours ouvrés  

---

### 🥈 Quick Win #2 : [Nom]
[Structure identique]

---

### 🥉 Quick Win #3 : [Nom]
[Structure identique]

---

## 📊 Récapitulatif Financier

| Quick Win | Prix Kames | Temps économisé/an | Valeur annuelle | ROI |
|-----------|------------|---------------------|-----------------|-----|
| #1 [Nom court] | X€ | Yh | Z€ | W mois |
| #2 [Nom court] | X€ | Yh | Z€ | W mois |
| #3 [Nom court] | X€ | Yh | Z€ | W mois |
| **PACK COMPLET** | **Total€** | **Total h** | **Total €** | **Moyenne mois** |

💰 **Offre Kames recommandée :**  
Pack "[Nom Secteur] Optimisé" : **Prix pack€** au lieu de Prix total€ (économie de X€)  
Inclus : Les 3 automations + 2h de formation + maintenance 3 mois offerte

---

## 📅 Prochaine Étape Recommandée

**Demo Live de 20 minutes** - Quick Win #1 ([Nom])  
Je te montre en direct comment ça fonctionne avec [cas concret].

Disponibilités [Prénom client] ?  
→ [3 créneaux proposés]

---

## 🚀 Opportunités Long Terme (Phase 2)

Si Quick Wins validés, on pourrait ensuite automatiser :

**[Opportunité 1]** (Prix estimé)  
[Description 1 phrase + bénéfice clé]

**[Opportunité 2]** (Prix estimé)  
[Description 1 phrase + bénéfice clé]

---

**Audit réalisé le [Date] par Thomas - Kames AI**  
Questions ? thomas@kames.ai
```

## Constraints

- Durée création audit : max 30 minutes
- Langage : **0 jargon technique** dans la partie client (n8n, nodes, API → expliquer en français simple)
- Chiffrage : **TOUJOURS donner une fourchette** basse-haute de ±10%
- Calcul ROI : **Utiliser des estimations conservatives** (ne pas survendre)
- Honnêteté : Si un processus n'est PAS automatisable ou ROI >6 mois, le dire clairement
- Priorisation : Toujours mettre le Quick Win avec le meilleur ratio (Impact/Complexité) en #1

## Validation Rules

Avant de générer l'audit final, vérifier :
- [ ] Les 3 Quick Wins ont un ROI < 4 mois
- [ ] Les prix respectent la grille Kames (pas de sous-facturation)
- [ ] Le calcul de valeur économisée est détaillé et transparent
- [ ] Aucune promesse irréaliste (ex: "90% de temps économisé" si impossible)
- [ ] La prochaine étape est claire et actionnables (date, heure, format)

## Tone & Style

- **Empathique** : Comprendre la douleur du client
- **Pédagogue** : Expliquer simplement les solutions techniques
- **Factuel** : Tous les chiffres doivent être justifiés
- **Orienté ROI** : Le client doit comprendre "Combien je gagne vs combien je paie"
- **Confiant mais humble** : Pas de survente, rester réaliste
