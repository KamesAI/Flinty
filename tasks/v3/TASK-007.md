# Task 007: WF2 — prompt Claude Opus 4.6 via OpenRouter, 14 champs + lecture Config.icp_md
**Status**: ✅ Complété

## Context
V1 scorait avec Haiku et 7 champs génériques. V3 doit s'appuyer sur l'ICP de la campagne et produire un enrichissement riche et actionnable.
**OpenRouter remplace l'API Anthropic directe** — même modèle (`anthropic/claude-opus-4-6`), auth Bearer au lieu de `x-api-key`.

**References**: PRD §3 F2 · ARCHI §Intégrations tierces

## Objective
WF2 lit `Config.icp_md` + `Config.score_minimum` dans l'enfant, appelle Claude Opus 4.6 via OpenRouter, reçoit un JSON strict à 14 clés et le merge dans le flow.

## Requirements
### Must Have
- [ ] Node Sheets en début de WF2 : lit `Config!A:B` de l'enfant → extrait `icp_md` et `score_minimum`
- [ ] Node HTTP Request vers `https://openrouter.ai/api/v1/chat/completions` (OpenAI-compatible)
- [ ] Modèle : `anthropic/claude-opus-4-6`
- [ ] Headers HTTP :
  - `Authorization: Bearer {{$credentials.openrouterApiKey}}`
  - `Content-Type: application/json`
  - `HTTP-Referer: https://flinty.kamesai.com` (requis par OpenRouter)
- [ ] Body JSON (format OpenAI messages) :
  ```json
  {
    "model": "anthropic/claude-opus-4-6",
    "max_tokens": 1024,
    "messages": [
      { "role": "system", "content": "RÉPONDS UNIQUEMENT LE JSON. 14 clés obligatoires." },
      { "role": "user", "content": "ICP:\n{{ $json.icp_md }}\n\nSite:\n{{ $json.firecrawl_content }}\n\nScore ce lead. JSON avec exactement ces 14 clés: [...]" }
    ]
  }
  ```
- [ ] Réponse : `choices[0].message.content` → parse JSON
- [ ] 14 clés : `score, score_reason, email, prénom, poste, taille_equipe, has_ia_services, hiring_signals, growth_stage, buying_signal, personalized_hook, rejection_reason, secteur_detecté, signaux_supplémentaires`
- [ ] Fallback retry 1x si JSON parse fail
- [ ] Credential n8n : **HTTP Header Auth** — Name: `Authorization`, Value: `Bearer {{OPENROUTER_API_KEY}}`

### Must NOT
- [ ] Pas de Haiku en fallback dans cette tâche
- [ ] Pas d'écriture Sheets dans ce step (vient en TASK-009)
- [ ] Ne pas utiliser `api.anthropic.com` — utiliser OpenRouter exclusivement

## Technical Approach (n8n)

### Credential n8n à créer
1. Settings > Credentials > New > **HTTP Header Auth**
2. Name : `OpenRouter API`
3. Name (header) : `Authorization`
4. Value : `Bearer sk-or-v1-...` (depuis `.env.local` OPENROUTER_API_KEY)

### Node HTTP Request
- Method : POST
- URL : `https://openrouter.ai/api/v1/chat/completions`
- Auth : credential `OpenRouter API`
- Body : JSON (cf. ci-dessus)
- Response : JSON

### Parse JSON
```js
// Code node après HTTP Request
const content = $input.first().json.choices[0].message.content;
let parsed;
try {
  parsed = JSON.parse(content);
} catch (e) {
  // retry via Set node qui réinjecte dans l'HTTP Request
  throw new Error('JSON_PARSE_FAIL');
}
return [{ json: parsed }];
```

## Acceptance Criteria
- [ ] 10 leads test passent par WF2 → 10 JSON parsables obtenus
- [ ] `personalized_hook` ≤ 20 mots
- [ ] Coût observé ~$0.01/lead (dashboard OpenRouter)

## Dependencies
**Blocked By**: Task 003

## Complexity & Estimates
High · 3h · Risk: Medium (format JSON strict)
