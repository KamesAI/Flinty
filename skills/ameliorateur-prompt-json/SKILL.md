---
name: ameliorateur-prompt-json
description: Transforme un prompt simple en JSON structuré optimisé pour n8n MCP et workflows impeccables
---

# 🔄 Skill : Ameliorateur-Prompt-JSON

## À quoi ça sert

Ce skill **améliore automatiquement** un prompt brut et le **transforme en JSON structuré** prêt à être consommé par n8n MCP (Model Context Protocol). 

Objectifs :
- Clarifier les demandes vagues/mal formulées
- Structurer les données en JSON valide et minimaliste
- Générer des workflows n8n exécutables immédiatement
- Éliminer l'ambiguïté et les erreurs de syntaxe
- Créer une trace reproductible et versionnable

**Cas d'usage idéal :** Vous avez une idée approximative d'un workflow, vous la donnez au skill, il sort un JSON prêt pour n8n + les étapes d'implémentation.

---

## Comment l'utiliser

### Format du prompt

```plaintext
Utilise le skill "ameliorateur-prompt-JSON" pour transformer ce prompt en JSON.

Prompt initial :
[Votre demande brute]

Contexte (optionnel) :
- Outils utilisés : [n8n, Gmail, Notion, etc.]
- Déclencheur : [webhook, schedule, email, etc.]
- Résultat attendu : [description]
```

### Exemple concret

```plaintext
Utilise le skill "ameliorateur-prompt-JSON" pour transformer ce prompt en JSON.

Prompt initial :
"Crée un workflow qui récupère les emails non lus de Gmail, les analyse pour extraire les demandes de devis, crée une tâche Notion avec le sujet et le sender, puis envoie une réponse auto au sender."

Contexte :
- Outils utilisés : Gmail, Notion, n8n
- Déclencheur : Schedule (toutes les heures)
- Résultat attendu : JSON n8n prêt à importer
```

---

## Ce que le skill génère

### 1️⃣ **Prompt amélioré & clarifié**

```markdown
### Prompt améliorisé

[Version optimisée du prompt initial, avec :
- Étapes numérotées et précises
- Conditions explicites (filtres, règles)
- Variables et transformations de données
- Erreurs potentielles identifiées
- Lacunes explicitées]
```

### 2️⃣ **JSON structuré pour n8n**

Structure complète avec :

```json
{
  "name": "Nom-Workflow-Kebab-Case",
  "description": "Description courte du workflow",
  "trigger": {
    "type": "type_déclencheur",
    "schedule": "cron_ou_fréquence",
    "config": {}
  },
  "nodes": [
    {
      "id": "node_1",
      "type": "type_node",
      "name": "Nom lisible",
      "config": {
        "action": "action_spécifique",
        "params": {}
      },
      "inputs": ["input_variable"],
      "outputs": ["output_variable"]
    }
  ],
  "connections": [
    {
      "from": "node_id",
      "to": "node_id",
      "dataMapping": {
        "source_field": "target_field"
      }
    }
  ],
  "variables": {
    "nom_variable": "type | description",
    "email_sujet": "string | Sujet extrait du mail"
  },
  "errorHandling": "continue_ou_stop",
  "notifications": {
    "onSuccess": true,
    "onError": true
  }
}
```

### 3️⃣ **Mode d'emploi d'implémentation**

```markdown
## Étapes d'implémentation n8n

### 1. Créer le workflow
- Accès n8n → New Workflow
- Nom : [nom-workflow]
- Description : [copiée du JSON]

### 2. Ajouter les nodes
- Node 1 : [Type] - [Action] - [Paramètres]
- Node 2 : [Type] - [Action] - [Paramètres]
- etc.

### 3. Connecter les nœuds
- [De Node1 vers Node2] → Mapping : [source → target]
- Valider les dataTypes

### 4. Tester
- Exécuter avec données test
- Vérifier outputs
- Checker error handling

### 5. Déployer
- Activer trigger (schedule/webhook)
- Configurer notifications
- Monitorer premier cycle
```

### 4️⃣ **Alertes & Recommandations**

```markdown
## ⚠️ Points d'attention

- [Alerte 1 si applicable]
- [Alerte 2 si applicable]
- Coûts API estimés : [X appels/mois]
- Taux d'erreur anticipé : [X%]

## ✅ Recommandations

- Ajouter [node supplémentaire]
- Tester d'abord avec [données de test]
- Monitorer [métrique]
```

---

## Exemples concrets

### Exemple 1 : Automatiser la qualification de leads

**Prompt initial :**
```
"Je veux checker les messages LinkedIn, récupérer les demandes info clients, extraire nom + email, envoyer auto-réponse, et créer un lead Pipedrive."
```

**Output du skill :**

```markdown
### Prompt améliorisé

1. Récupérer les messages LinkedIn non traités
2. Filtrer ceux contenant les keywords ["info", "devis", "consultation"]
3. Extraire : nom, email, message
4. Envoyer réponse auto : "Merci pour votre intérêt..."
5. Créer contact Pipedrive avec infos extraites
6. Marquer message LinkedIn comme traité
7. Logger la création en Google Sheets

---

## JSON structuré

\`\`\`json
{
  "name": "linkedin-to-pipedrive-leads",
  "description": "Récupère demandes LinkedIn → Pipedrive + réponse auto",
  "trigger": {
    "type": "schedule",
    "schedule": "every 30 minutes"
  },
  "nodes": [
    {
      "id": "node_1",
      "type": "linkedin",
      "name": "Récupérer messages",
      "config": {
        "action": "getUnreadMessages",
        "filters": ["isUnread"]
      },
      "outputs": ["messages"]
    },
    {
      "id": "node_2",
      "type": "ai",
      "name": "Analyser avec Claude",
      "config": {
        "prompt": "Extraire : nom, email, type_demande. Retourner JSON."
      },
      "inputs": ["messages"],
      "outputs": ["analyzed_leads"]
    },
    {
      "id": "node_3",
      "type": "pipedrive",
      "name": "Créer lead Pipedrive",
      "config": {
        "action": "createContact",
        "fields": {
          "name": "{{ analyzed_leads.name }}",
          "email": "{{ analyzed_leads.email }}"
        }
      },
      "inputs": ["analyzed_leads"],
      "outputs": ["pipedrive_id"]
    },
    {
      "id": "node_4",
      "type": "linkedin",
      "name": "Répondre message",
      "config": {
        "action": "sendMessage",
        "template": "auto_response_sales"
      },
      "inputs": ["messages", "pipedrive_id"],
      "outputs": ["response_sent"]
    },
    {
      "id": "node_5",
      "type": "googleSheets",
      "name": "Logger en Sheets",
      "config": {
        "action": "appendRow",
        "spreadsheetId": "{{ env.LEADS_SHEET_ID }}",
        "values": ["{{ analyzed_leads.name }}", "{{ analyzed_leads.email }}", "{{ pipedrive_id }}", "{{ now }}"]
      },
      "inputs": ["analyzed_leads", "pipedrive_id"]
    }
  ],
  "connections": [
    { "from": "node_1", "to": "node_2" },
    { "from": "node_2", "to": "node_3" },
    { "from": "node_3", "to": "node_4" },
    { "from": "node_2", "to": "node_5" }
  ],
  "variables": {
    "messages": "array | Messages LinkedIn bruts",
    "analyzed_leads": "object | {name, email, type_demande}",
    "pipedrive_id": "string | ID du lead créé"
  },
  "errorHandling": "continue",
  "notifications": {
    "onError": true
  }
}
\`\`\`

---

## Étapes d'implémentation n8n

### 1. Créer workflow
- n8n Dashboard → New Workflow
- Nom : linkedin-to-pipedrive-leads

### 2. Ajouter trigger
- Schedule trigger : Every 30 minutes

### 3. Node 1 : LinkedIn - Récupérer messages
- Type : LinkedIn (ou HTTP si API)
- Action : getUnreadMessages
- Filtre : isUnread = true

### 4. Node 2 : Claude (via HTTP)
- Type : HTTP POST
- URL : https://api.anthropic.com/v1/messages
- Body : Prompt d'extraction structuré
- Parse JSON response

### 5. Node 3 : Pipedrive - Créer lead
- Type : Pipedrive
- Action : createContact
- Mapping : name, email depuis Node 2

### 6. Node 4 : LinkedIn - Répondre
- Type : LinkedIn
- Action : sendMessage
- Template : Message auto

### 7. Node 5 : Google Sheets - Logger
- Type : Google Sheets
- Action : Append Row
- Colones : Nom, Email, PipedriveID, Timestamp

### 8. Connexions
- Node 1 → Node 2
- Node 2 → Node 3 (create lead)
- Node 3 → Node 4 (send reply)
- Node 2 → Node 5 (log)

### 9. Test
- Exécuter manuellement
- Vérifier : Pipedrive + Sheet + LinkedIn reply

### 10. Déployer
- Activer schedule
- Monitorer 1 jour

---

## ⚠️ Points d'attention

- API LinkedIn a limitations (rate limits, accès)
- Extraction IA peut marquer faux positifs → valider avant Pipedrive
- Google Sheets peut être lent si volumétrie haute (>1000 lignes/jour)

## ✅ Recommandations

- Ajouter un step de validation humaine (Slack) avant Pipedrive
- Batch les appels API pour réduire les coûts
- Ajouter retry logic (3 tentatives)
- Tester d'abord avec données de test LinkedIn sandbox
```

---

### Exemple 2 : Récupérer factures depuis emails

**Prompt initial :**
```
"Automatiser les factures reçues par email → extraction données → Google Sheets + classement dossier"
```

**Output du skill :**

```markdown
### Prompt améliorisé

1. Déclencher sur nouvel email avec pièce jointe PDF
2. Télécharger PDF
3. Extraire texte OCR (Mindee / docsumo)
4. Parser : Numéro facture, montant HT, TVA, date
5. Créer ligne Google Sheets
6. Classer email dans dossier "Factures Traitées"
7. Si montant > 1000€ → Slack notification

---

## JSON structuré

\`\`\`json
{
  "name": "invoice-automation-email-to-sheets",
  "description": "Emails factures → OCR → Google Sheets + classement",
  "trigger": {
    "type": "email",
    "config": {
      "hasAttachment": true,
      "attachmentType": "pdf",
      "filter": "invoices OR facture OR invoice"
    }
  },
  "nodes": [
    {
      "id": "node_1",
      "type": "email",
      "name": "Récupérer email + PDF",
      "outputs": ["email_data", "pdf_file"]
    },
    {
      "id": "node_2",
      "type": "ocr",
      "name": "OCR Mindee",
      "config": {
        "apiKey": "{{ env.MINDEE_API_KEY }}",
        "documentType": "invoice"
      },
      "inputs": ["pdf_file"],
      "outputs": ["extracted_text"]
    },
    {
      "id": "node_3",
      "type": "ai",
      "name": "Parser facture avec Claude",
      "config": {
        "prompt": "Extraire de ce texte OCR : numero_facture, montant_ht, tva, date_facture. JSON format."
      },
      "inputs": ["extracted_text"],
      "outputs": ["invoice_data"]
    },
    {
      "id": "node_4",
      "type": "googleSheets",
      "name": "Ajouter ligne Sheets",
      "config": {
        "spreadsheetId": "{{ env.INVOICES_SHEET_ID }}",
        "action": "appendRow",
        "values": [
          "{{ invoice_data.numero_facture }}",
          "{{ invoice_data.montant_ht }}",
          "{{ invoice_data.tva }}",
          "{{ invoice_data.date_facture }}",
          "{{ email_data.sender }}"
        ]
      },
      "inputs": ["invoice_data", "email_data"]
    },
    {
      "id": "node_5",
      "type": "email",
      "name": "Classer email",
      "config": {
        "action": "moveToFolder",
        "folder": "Factures Traitées"
      },
      "inputs": ["email_data"]
    },
    {
      "id": "node_6",
      "type": "slack",
      "name": "Notifier si > 1000€",
      "config": {
        "condition": "{{ invoice_data.montant_ht > 1000 }}",
        "channel": "#finance",
        "message": "Facture > 1000€ : {{ invoice_data.numero_facture }} - {{ invoice_data.montant_ht }}€"
      },
      "inputs": ["invoice_data"]
    }
  ],
  "connections": [
    { "from": "node_1", "to": "node_2" },
    { "from": "node_2", "to": "node_3" },
    { "from": "node_3", "to": "node_4" },
    { "from": "node_1", "to": "node_5" },
    { "from": "node_3", "to": "node_6" }
  ],
  "variables": {
    "email_data": "object | {sender, subject, date, attachment_path}",
    "pdf_file": "file | Fichier PDF téléchargé",
    "extracted_text": "string | Texte OCR brut",
    "invoice_data": "object | {numero_facture, montant_ht, tva, date_facture}"
  },
  "errorHandling": "continue",
  "notifications": {
    "onError": true
  }
}
\`\`\`

---

## Étapes d'implémentation n8n

### 1. Créer workflow
- Nom : invoice-automation-email-to-sheets

### 2. Trigger Email
- Type : Email trigger
- Filter : has PDF attachment
- Keywords : "facture", "invoice"

### 3. Node 1 : Récupérer email
- Récupérer : sender, subject, date, PDF

### 4. Node 2 : OCR Mindee
- Service : Mindee OCR
- Type : Invoice
- Output : extracted_text

### 5. Node 3 : Claude Parser
- HTTP POST → Claude API
- Prompt structuré pour extraction JSON

### 6. Node 4 : Google Sheets
- Append row avec données parsées

### 7. Node 5 : Email Move
- Move email → "Factures Traitées" folder

### 8. Node 6 : Slack Notif (conditionnel)
- If montant > 1000€ → Send Slack

### 9. Test
- Envoyer email test avec PDF facture
- Vérifier Sheets + Slack + email moving

### 10. Déployer
- Activer trigger
- Monitorer OCR quality

---

## ⚠️ Points d'attention

- OCR Mindee gratuit = max 250 pages/mois (plan payant existe)
- Facteurs peuvent être en image mal numérisée → prévoir fallback manuel
- Données sensibles (SIRET, etc.) → RGPD compliance
- Délais OCR = 2-5 sec par facture

## ✅ Recommandations

- Ajouter validation step (vérifier OCR quality)
- Retry sur erreurs OCR (3x)
- Batch les factures par jour (moins cher)
- Tester avec vrais emails avant production
```

---

## Variables & Syntaxe

### Variables système n8n

```json
{
  "{{ now }}": "timestamp actuel",
  "{{ $input }}": "input du node actuel",
  "{{ $prev }}": "output du node précédent",
  "{{ env.VAR_NAME }}": "variable d'environnement"
}
```

### DataTypes courants

```json
{
  "string": "Texte",
  "number": "Entier ou décimal",
  "boolean": "true/false",
  "object": "{ key: value }",
  "array": "[ item1, item2 ]",
  "date": "ISO 8601 format",
  "file": "{ filename, mimetype, buffer }"
}
```

---

## Bonnes pratiques

✅ **À faire :**
- Nommer les nodes en kebab-case
- Documenter chaque variable
- Tester avant déploiement
- Ajouter error handling
- Monitorer logs n8n

❌ **À éviter :**
- Nodes sans nom explicite
- Variables sans type défini
- Workflow sans conditions
- Pas de logging

---

## Questions fréquentes

**Q : Mon JSON n'est pas valide JSON ?**
A : Copier le JSON dans https://jsonlint.com/ pour valider. Attention aux guillemets et virgules.

**Q : Comment tester sans exécuter le workflow entier ?**
A : n8n → "Execute node" (juste ce node) + données test.

**Q : Quel est le coût API estimé ?**
A : Spécifier dans le JSON sous "estimatedCosts" si applicable.

**Q : Comment monitorer les erreurs ?**
A : n8n → Executions tab → Filtrer par failed, consulter logs détaillés.

---

## Intégration avec Claude Code

Pour utiliser ce skill via Claude Code :

```bash
# Dans Claude Code
npm install @anthropic-sdk/sdk
```

```javascript
// Appeler le skill directement
const skill = require('./ameliorateur-prompt-JSON');
const result = skill.transform(yourPrompt, context);
console.log(JSON.stringify(result, null, 2));
```

---

## Intégration avec n8n MCP

Si vous avez Claude Code + n8n MCP configuré :

1. Créer un webhook n8n pour recevoir prompts
2. Transformer via skill
3. Créer workflow automatiquement
4. Retourner URL du workflow

```json
{
  "webhook_url": "https://instance.n8n.kamesai.com/webhook/improve-prompt",
  "method": "POST",
  "body": {
    "prompt": "Votre prompt ici",
    "context": { "tools": ["Gmail", "Notion"] }
  },
  "response": {
    "improved_prompt": "...",
    "json_workflow": { ... },
    "n8n_workflow_url": "https://instance.n8n.kamesai.com/workflow/xxxx"
  }
}
```

---

## Changelog

**v1.0 - 24/12/2024**
- Initial release
- Support : JSON structuré pour n8n
- 7 types de nodes supportés
- Exemples concrets LinkedIn + Factures

---

## Support

**Questions ?** Utilise ce prompt :
```
Améliore ce prompt de workflow avec le skill "ameliorateur-prompt-JSON".
```

**Problème avec le JSON ?** Valide sur https://jsonlint.com/

**Workflow trop complexe ?** Découpe en 2-3 workflows plus petits.
