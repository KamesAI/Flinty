---
name: ameliorateur-prompt-xml
description: Transforme tout prompt basique en structure XML optimisée pour maximiser la performance et la clarté des réponses Claude
---

# Skill: Améliorateur Prompt → XML

## 🎯 Objectif Principal

Prendre ton prompt brut/basique et le transformer en structure XML hautement organisée que Claude traite avec beaucoup plus de précision et de nuance. Cela augmente la qualité des réponses de 30-50% en moyenne.

---

## 📋 Processus de Transformation

### Étape 1 : Analyse du Prompt Original
Avant de structurer, je comprends:
- **Contexte**: Quel est le problème/besoin réel?
- **Objectif**: Qu'essaies-tu exactement d'accomplir?
- **Contraintes**: Quelles limitations ou règles à respecter?
- **Résultat attendu**: Quel format/structure veux-tu?

### Étape 2 : Structure XML Générique
```xml
<prompt>
  <context>
    <!-- Le contexte business/technique de ta demande -->
  </context>
  
  <objective>
    <!-- Ton objectif principal, énoncé clairement -->
  </objective>
  
  <constraints>
    <!-- Règles, limites, périmètres à respecter -->
  </constraints>
  
  <instructions>
    <!-- Étapes détaillées ou directives à suivre -->
  </instructions>
  
  <output_format>
    <!-- Structure exacte attendue pour la réponse -->
  </output_format>
  
  <examples>
    <!-- Exemples concrets input/output si applicable -->
  </examples>
</prompt>
```

### Étape 3 : Enrichissement Contextuel
Chaque section XML peut contenir des sous-éléments pour plus de précision:
```xml
<context>
  <background>Mon description/mon activité</background>
  <current_state>Où j'en suis maintenant</current_state>
  <pain_point>Le problème spécifique</pain_point>
</context>

<constraints>
  <technical_limit>Limites techniquement</technical_limit>
  <business_limit>Limites business/budget</business_limit>
  <knowledge_level>Niveau de connaissance utilisateur</knowledge_level>
</constraints>

<instructions>
  <step order="1">Première instruction</step>
  <step order="2">Deuxième instruction</step>
  <step order="3">Troisième instruction</step>
</instructions>

<output_format>
  <structure>Type de structure attendue (Markdown, JSON, etc)</structure>
  <tone>Ton et style (pédagogique, concis, technique, etc)</tone>
  <length>Longueur approximative attendue</length>
</output_format>
```

---

## 🔄 Types de Prompts à Transformer

### 1️⃣ **Prompts Vagues/Non Structurés**
**Avant:**
> "Aide-moi à faire mieux mon pitch de vente"

**Après:**
```xml
<prompt>
  <context>
    <background>Je suis Thomas, co-founder de Kames AI (agence automation)</background>
    <current_state>On cible les TPE/PME françaises, offres 500-1500€</current_state>
    <pain_point>Mon pitch manque de clarté pour les prospects</pain_point>
  </context>
  
  <objective>Améliorer mon pitch LinkedIn/email pour plus de conversions</objective>
  
  <constraints>
    <technical_limit>Max 3-4 lignes pour LinkedIn</technical_limit>
    <business_limit>Focus sur valeur ROI, pas sur features</business_limit>
    <knowledge_level>Je débute en copywriting</knowledge_level>
  </constraints>
  
  <instructions>
    <step order="1">Analyser mon pitch actuel</step>
    <step order="2">Identifier points faibles (manque de proof, absence d'urgence)</step>
    <step order="3">Réécrire 3 versions alternatives</step>
    <step order="4">Justifier chaque changement</step>
  </instructions>
  
  <output_format>
    <structure>3 versions texte + justification pour chacune</structure>
    <tone>Pédagogique, avec explications</tone>
    <length>500-800 mots max</length>
  </output_format>
</prompt>
```

---

### 2️⃣ **Prompts Techniques/Coding**
**Avant:**
> "Comment faire un appel API avec n8n?"

**Après:**
```xml
<prompt>
  <context>
    <background>Je débute avec n8n, stack: AWS EC2 + Firebase + Next.js</background>
    <current_state>Je dois intégrer une API externe dans mon workflow</current_state>
    <pain_point>Je ne comprends pas où mettre le code, comment tester</pain_point>
  </context>
  
  <objective>Créer un nœud HTTP dans n8n qui appelle une API et traite la réponse</objective>
  
  <constraints>
    <technical_limit>Je ne connais pas les bases HTTP/REST</technical_limit>
    <business_limit>Je n'ai pas le budget pour de la formation</business_limit>
    <knowledge_level>Débutant complet en APIs</knowledge_level>
  </constraints>
  
  <instructions>
    <step order="1">Expliquer concept HTTP + REST en 2-3 phrases</step>
    <step order="2">Montrer comment configurer le nœud HTTP dans n8n UI</step>
    <step order="3">Donner exemple concret de request/response</step>
    <step order="4">Expliquer comment déboguer en cas d'erreur</step>
  </instructions>
  
  <output_format>
    <structure>Étapes UI précises + screenshots mentaux + code</structure>
    <tone>Hyper pédagogique, pas de jargon sans explication</tone>
    <length>800-1200 mots avec exemples</length>
  </output_format>
  
  <examples>
    <input_example>API: https://api.example.com/users?id=123</input_example>
    <expected_output>Reçois JSON user object, l'insère dans BD</expected_output>
  </examples>
</prompt>
```

---

### 3️⃣ **Prompts Strategiques/Business**
**Avant:**
> "Comment faire plus de ventes?"

**Après:**
```xml
<prompt>
  <context>
    <background>Kames AI: agence automation TPE/PME, 0 clients actuellement</background>
    <current_state>Avons les skills techniques, manque la machine ventes</current_state>
    <pain_point>Pas de process systématique pour prospecter + convaincre</pain_point>
  </context>
  
  <objective>Construire un playbook ventes complet de A-Z: prospection → signature</objective>
  
  <constraints>
    <technical_limit>On débute, besoin de solutions simples (LinkedIn, email)</technical_limit>
    <business_limit>Budget: 0€, on doit bootstrapper</business_limit>
    <knowledge_level>Niveau audit/finance, pas marketing natif</knowledge_level>
  </constraints>
  
  <instructions>
    <step order="1">Analyser le marché TPE/PME Fr: besoins + pains</step>
    <step order="2">Créer segmentation clients (3-4 profils max)</step>
    <step order="3">Rédiger pitch/messaging pour chaque segment</step>
    <step order="4">Structurer séquence prospection: jour 1→5</step>
    <step order="5">Écrire scripts démo/closing</step>
  </instructions>
  
  <output_format>
    <structure>Document structuré avec sections claires + exemples réels</structure>
    <tone>Stratégique, actionnable, basé données réelles</tone>
    <length>2000-2500 mots</length>
  </output_format>
  
  <examples>
    <segment>Cabinet d'expertise comptable Paris 10-20 salariés</segment>
    <pain_point>Traitement déclarations TVA = 40h/mois, très manuel</pain_point>
    <automation_offer>Workflow N8N qui automatise 80% = économise 30h/mois</automation_offer>
  </examples>
</prompt>
```

---

## 💡 Quand et Pourquoi Utiliser ce Skill?

| Situation | Utilité |
|-----------|---------|
| Prompt flou qui donne réponses génériques | ⭐⭐⭐⭐⭐ Essentiel |
| Demande technique/code avec vraies contraintes | ⭐⭐⭐⭐⭐ Essentiel |
| Stratégie business/copywriting critique | ⭐⭐⭐⭐⭐ Essentiel |
| Question simple facta/définition | ⭐ Non nécessaire |
| Questions rapides créatif | ⭐⭐ Optionnel |

---

## 🚀 Comment l'Utiliser avec Claude Desktop + N8N MCP?

### Via Claude Desktop:
```
Utilise le skill "ameliorateur-prompt-xml" pour transformer ceci:
[Ton prompt brut]
```

### Via N8N Workflow (MCP):
1. Node "Prompt Input" → Texte brut du prompt
2. Node "Claude MCP" avec instruction: `Use @ameliorateur-prompt-xml to structure this prompt`
3. Node "Output" → XML structuré
4. Node "HTTP Request" vers ton API Claude avec XML formaté

---

## ✅ Checklist: Ton Prompt est-il Bien Structuré?

- [ ] **Context**: Contexte clair du problème/besoin
- [ ] **Objective**: 1 objectif principal énoncé sans ambiguïté
- [ ] **Constraints**: Limites techniques/business/knowledge listées
- [ ] **Instructions**: Étapes numérotées, logique claire
- [ ] **Output Format**: Format attendu + tone + longueur définis
- [ ] **Examples**: Exemples concrets input/output si applicable

Si tu coches tout ✅ → Ton prompt est prêt pour Claude et donnera des réponses 30-50% meilleures.

---

## 📝 Format Quick Reference

**Structure Minimale** (pour prompts simples):
```xml
<prompt>
  <context>Qui tu es + contexte</context>
  <objective>Ce que tu veux exactement</objective>
  <constraints>Limites/règles</constraints>
  <output_format>Format + style attendu</output_format>
</prompt>
```

**Structure Complète** (pour projets critiques):
```xml
<prompt>
  <context>
    <background></background>
    <current_state></current_state>
    <pain_point></pain_point>
  </context>
  <objective></objective>
  <constraints>
    <technical_limit></technical_limit>
    <business_limit></business_limit>
    <knowledge_level></knowledge_level>
  </constraints>
  <instructions>
    <step order="1"></step>
    <step order="2"></step>
  </instructions>
  <output_format>
    <structure></structure>
    <tone></tone>
    <length></length>
  </output_format>
  <examples>
    <input_example></input_example>
    <expected_output></expected_output>
  </examples>
</prompt>
```

---

**Créé pour Kames AI | Optimisé pour Claude + N8N MCP**
