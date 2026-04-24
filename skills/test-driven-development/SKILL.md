---
name: test-driven-development
description: Utiliser AVANT d'écrire du code d'implémentation pour toute feature ou correction de bug
---

# Test-Driven Development (TDD) - Adapté Kames AI

## Vue d'ensemble

**Principe fondamental :** Écris le test d'abord. Regarde-le échouer. Écris le code minimal pour le faire passer.

Si tu n'as pas vu le test échouer, tu ne sais pas s'il teste vraiment ce qu'il doit tester.

## Quand utiliser TDD

### ✅ Toujours pour :
- Nouvelles fonctionnalités sur le site kamesai.com (Next.js)
- Corrections de bugs
- Composants React réutilisables
- Fonctions utilitaires (validation, formatage, calculs)
- API routes Next.js
- Intégrations critiques (Stripe, emails, webhooks)

### ⚠️ TDD allégé pour :
- Scripts de déploiement
- Configurations
- Migrations de base de données

### ❌ TDD ne s'applique PAS à :
- **Workflows n8n** → Tester manuellement avec des données de test, puis en production avec monitoring
- **Prototypes jetables** → Code exploratoire qu'on supprime après
- **Configurations Nginx/Docker** → Tester en staging
- **Prompts IA** → Itérer avec des exemples réels

> 💡 **Pour Kames :** La majorité de ton travail (automatisations n8n) ne suit pas TDD classique. Par contre, tout code Next.js/TypeScript sur ton site DOIT suivre TDD.

## La règle d'or

```
PAS DE CODE DE PRODUCTION SANS UN TEST QUI ÉCHOUE D'ABORD
```

Tu as écrit du code avant le test ? **Supprime-le. Recommence.**

Pas d'exceptions :
- Ne le garde pas "comme référence"
- Ne l'"adapte" pas en écrivant les tests
- Ne le regarde même pas
- Supprimer = supprimer

## Le cycle Rouge-Vert-Refactor

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   🔴 ROUGE          🟢 VERT           🔵 REFACTOR          │
│   Écris un test  →  Code minimal   →  Nettoie le code      │
│   qui échoue        pour passer       (tests toujours      │
│                                        verts)               │
│         ↑                                    │              │
│         └────────────────────────────────────┘              │
│                    Répète                                   │
└─────────────────────────────────────────────────────────────┘
```

### 🔴 ROUGE - Écrire un test qui échoue

Écris UN test minimal qui montre ce que le code DEVRAIT faire.

**✅ Bon exemple (formulaire de contact Kames) :**
```typescript
// tests/validateContactForm.test.ts
import { validateContactForm } from '@/lib/validation';

test('rejette un email vide', () => {
  const result = validateContactForm({
    email: '',
    name: 'Thomas',
    message: 'Je veux automatiser ma boîte'
  });
  
  expect(result.valid).toBe(false);
  expect(result.errors.email).toBe('Email requis');
});
```
→ Nom clair, teste UN comportement, utilise du vrai code

**❌ Mauvais exemple :**
```typescript
test('validation fonctionne', () => {
  const mock = jest.fn().mockReturnValue(true);
  expect(mock()).toBe(true);
});
```
→ Nom vague, teste le mock pas le code réel

**Règles :**
- UN seul comportement par test
- Nom descriptif (on doit comprendre ce qui est testé)
- Code réel (pas de mocks sauf si absolument nécessaire)

### 🔍 Vérifier ROUGE - Regarde-le échouer

**OBLIGATOIRE. Ne jamais sauter cette étape.**

```bash
npm test tests/validateContactForm.test.ts
```

Vérifie que :
- Le test **échoue** (pas une erreur de syntaxe)
- Le message d'échec est celui attendu
- Il échoue parce que la feature n'existe pas encore

**Le test passe immédiatement ?** Tu testes du code qui existe déjà. Corrige le test.

**Le test a une erreur ?** Corrige l'erreur, relance jusqu'à ce qu'il échoue correctement.

### 🟢 VERT - Code minimal

Écris le code **le plus simple** pour faire passer le test.

**✅ Bon exemple :**
```typescript
// lib/validation.ts
export function validateContactForm(data: ContactFormData) {
  const errors: Record<string, string> = {};
  
  if (!data.email?.trim()) {
    errors.email = 'Email requis';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
```
→ Juste assez pour passer le test

**❌ Mauvais exemple :**
```typescript
export function validateContactForm(data: ContactFormData, options?: {
  validateDomain?: boolean;
  checkMX?: boolean;
  customRules?: ValidationRule[];
  onError?: (field: string) => void;
}) {
  // 200 lignes de code pour des features pas encore testées
}
```
→ Sur-ingénierie, YAGNI (You Aren't Gonna Need It)

**Ne fais PAS :**
- Ajouter des features non testées
- Refactorer d'autre code
- "Améliorer" au-delà de ce que le test demande

### ✅ Vérifier VERT - Regarde-le passer

**OBLIGATOIRE.**

```bash
npm test
```

Vérifie que :
- Le test passe
- Les AUTRES tests passent toujours
- Pas d'erreurs ni warnings dans la console

**Le test échoue ?** Corrige le code, pas le test.

**D'autres tests échouent ?** Corrige-les maintenant.

### 🔵 REFACTOR - Nettoyer

Seulement APRÈS le vert :
- Supprime la duplication
- Améliore les noms de variables/fonctions
- Extrait des helpers si nécessaire

**Les tests doivent rester verts.** N'ajoute pas de comportement.

### 🔄 Répète

Prochain test qui échoue pour la prochaine feature.

## Exemples concrets pour Kames

### Exemple 1 : Validation d'email professionnel

**Contexte :** Tu veux que le formulaire de contact rejette les emails personnels (gmail, yahoo...) pour cibler les pros.

**🔴 ROUGE**
```typescript
test('rejette les emails gmail', () => {
  const result = validateContactForm({
    email: 'thomas@gmail.com',
    name: 'Thomas',
    message: 'Test'
  });
  
  expect(result.valid).toBe(false);
  expect(result.errors.email).toBe('Merci d\'utiliser votre email professionnel');
});
```

**Vérifie qu'il échoue :**
```bash
npm test
# FAIL: expected false, got true
```

**🟢 VERT**
```typescript
const PERSONAL_DOMAINS = ['gmail.com', 'yahoo.fr', 'hotmail.com', 'outlook.com'];

export function validateContactForm(data: ContactFormData) {
  const errors: Record<string, string> = {};
  
  if (!data.email?.trim()) {
    errors.email = 'Email requis';
  } else {
    const domain = data.email.split('@')[1]?.toLowerCase();
    if (PERSONAL_DOMAINS.includes(domain)) {
      errors.email = 'Merci d\'utiliser votre email professionnel';
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
```

**Vérifie qu'il passe :**
```bash
npm test
# PASS
```

### Exemple 2 : Calcul de prix d'une micro-offre

**🔴 ROUGE**
```typescript
// tests/pricing.test.ts
import { calculatePrice } from '@/lib/pricing';

test('calcule le prix setup + abonnement pour une offre standard', () => {
  const result = calculatePrice({
    tier: 'standard',
    months: 12
  });
  
  expect(result.setup).toBe(1500);
  expect(result.monthly).toBe(300);
  expect(result.total).toBe(1500 + (300 * 12)); // 5100€
});
```

**🟢 VERT**
```typescript
// lib/pricing.ts
const PRICING = {
  starter: { setup: 800, monthly: 200 },
  standard: { setup: 1500, monthly: 300 },
  premium: { setup: 3000, monthly: 400 }
};

export function calculatePrice({ tier, months }: PricingInput) {
  const { setup, monthly } = PRICING[tier];
  return {
    setup,
    monthly,
    total: setup + (monthly * months)
  };
}
```

### Exemple 3 : API route webhook

**🔴 ROUGE**
```typescript
// tests/api/webhook.test.ts
import { POST } from '@/app/api/webhook/route';

test('retourne 401 si signature invalide', async () => {
  const request = new Request('http://localhost/api/webhook', {
    method: 'POST',
    headers: { 'x-webhook-signature': 'invalid' },
    body: JSON.stringify({ event: 'test' })
  });
  
  const response = await POST(request);
  
  expect(response.status).toBe(401);
});
```

## Qualités d'un bon test

| Qualité | ✅ Bon | ❌ Mauvais |
|---------|--------|-----------|
| **Minimal** | Teste UNE chose. "et" dans le nom ? Sépare-le. | `test('valide email et téléphone et nom')` |
| **Clair** | Le nom décrit le comportement | `test('test1')` |
| **Indépendant** | Ne dépend pas de l'ordre d'exécution | Dépend d'un autre test |
| **Rapide** | Exécution en millisecondes | Appels réseau réels, timeouts |

## Pourquoi l'ordre compte

### "Je vais écrire les tests après pour vérifier"

Les tests écrits après le code passent immédiatement. Un test qui passe immédiatement ne prouve rien :
- Il teste peut-être la mauvaise chose
- Il teste l'implémentation, pas le comportement
- Il rate les edge cases que tu as oubliés
- Tu ne l'as jamais vu attraper le bug

**Test-first** te force à voir le test échouer → preuve qu'il teste vraiment quelque chose.

### "J'ai déjà testé manuellement"

Le test manuel est ad-hoc :
- Pas de trace de ce que tu as testé
- Impossible à relancer quand le code change
- Facile d'oublier des cas sous pression
- "Ça marchait quand j'ai essayé" ≠ tests complets

**Les tests automatisés sont systématiques.** Ils s'exécutent de la même façon à chaque fois.

### "Supprimer X heures de travail c'est du gaspillage"

Erreur du coût irrécupérable (sunk cost fallacy). Le temps est déjà parti. Ton choix maintenant :
- Supprimer et réécrire avec TDD (X heures de plus, haute confiance)
- Garder et ajouter des tests après (30 min, faible confiance, bugs probables)

Le vrai "gaspillage" c'est garder du code auquel tu ne peux pas faire confiance.

## Excuses courantes

| Excuse | Réalité |
|--------|---------|
| "Trop simple pour tester" | Le code simple casse aussi. Le test prend 30 secondes. |
| "Je testerai après" | Un test qui passe immédiatement ne prouve rien. |
| "J'ai déjà testé manuellement" | Ad-hoc ≠ systématique. Pas de trace, pas rejouable. |
| "TDD va me ralentir" | TDD est plus rapide que débugger. |
| "C'est différent parce que..." | Non. |

## Signaux d'alarme - STOP et recommence

- Code avant test
- Test après implémentation  
- Test qui passe immédiatement
- Tu ne peux pas expliquer pourquoi le test a échoué
- Tests ajoutés "plus tard"
- Tu te dis "juste cette fois"
- "J'ai déjà testé manuellement"
- "Garder comme référence"

**Tous ces signaux = Supprime le code. Recommence avec TDD.**

## Checklist de vérification

Avant de considérer ton travail terminé :

- [ ] Chaque nouvelle fonction a un test
- [ ] J'ai vu chaque test échouer avant d'implémenter
- [ ] Chaque test a échoué pour la bonne raison (feature manquante, pas typo)
- [ ] J'ai écrit le code minimal pour faire passer chaque test
- [ ] Tous les tests passent
- [ ] Console propre (pas d'erreurs ni warnings)
- [ ] Les tests utilisent du vrai code (mocks seulement si inévitable)
- [ ] Les edge cases et erreurs sont couverts

Tu ne peux pas cocher toutes les cases ? Tu as sauté TDD. Recommence.

## Quand tu es bloqué

| Problème | Solution |
|----------|----------|
| Je ne sais pas comment tester | Écris l'API que tu voudrais. Écris l'assertion d'abord. |
| Le test est trop compliqué | Le design est trop compliqué. Simplifie l'interface. |
| Je dois tout mocker | Le code est trop couplé. Utilise l'injection de dépendances. |
| Le setup du test est énorme | Extrait des helpers. Toujours complexe ? Simplifie le design. |

## Intégration avec le debugging

Bug trouvé ? Écris un test qui échoue et reproduit le bug. Suis le cycle TDD. Le test prouve le fix ET empêche la régression.

**Ne corrige jamais un bug sans test.**

## Pour les workflows n8n (hors TDD classique)

Comme TDD ne s'applique pas directement aux workflows n8n, voici l'approche recommandée :

1. **Données de test** : Crée un jeu de données de test représentatif
2. **Test manuel structuré** : Exécute le workflow avec les données de test
3. **Vérifications** : Documente ce que tu vérifies à chaque étape
4. **Monitoring** : Configure des alertes pour les échecs en production
5. **Logs** : Ajoute des nodes de logging aux points critiques

```
Workflow n8n → Test manuel documenté → Monitoring en prod
Code Next.js → TDD strict → Tests automatisés
```

## Règle finale

```
Code de production → un test existe ET a échoué d'abord
Sinon → ce n'est pas du TDD
```

Pas d'exception sans en avoir discuté avec ton partenaire humain (ou Claude).
