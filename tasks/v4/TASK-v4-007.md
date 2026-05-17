# Task v4-007 : Setter tool call `get_calendly_slots` intégré dans `generateResponse`
**Status**: ✅ Done — 2026-05-14

## Autonomie
🤖 **Claude 100%** — intégration dans lib/setter.ts.

## Context
Quand Claude détecte `meeting_ready` et émet le tool call `get_calendly_slots`, le code doit intercepter l'appel, appeler `lib/calendly.ts`, retourner les slots à Claude pour qu'il les intègre naturellement dans la réponse finale.

**Références** : ARCHI-v4 §AI Setter Pipeline step 4 · PRD-v4 F3

## Objective
Boucle tool-call complète dans `generateResponse` : Claude demande les slots → on les fetche → on re-envoie à Claude → réponse finale avec slots intégrés naturellement.

## Requirements

### Must Have
- [x] Détecter `stop_reason === 'tool_use'` dans la réponse Anthropic SDK
- [x] Si tool call = `get_calendly_slots` → appeler `calendly.getAvailableSlots(eventTypeUri)`
- [x] Re-envoyer résultat des slots à Claude comme `tool_result` message
- [x] Claude génère réponse finale avec slots au format naturel (via `formatSlotsNatural`)
- [x] Fallback si 0 slots disponibles : message "Je peux vous proposer un créneau sur Calendly : [lien direct]"
- [x] Tests Vitest : mock Anthropic retourne tool_use → vérifier que slots sont fetchés + réponse finale générée

### Must NOT
- Ne pas appeler Calendly si intent ≠ meeting_ready (vérifier avant generateResponse)
- Ne pas exposer le lien brut Calendly si des slots sont disponibles

## Technical Approach

```typescript
// Dans generateResponse, après premier appel Anthropic :
if (response.stop_reason === 'tool_use') {
  const toolUse = response.content.find(b => b.type === 'tool_use')
  if (toolUse?.name === 'get_calendly_slots') {
    const eventTypeUri = toolUse.input.event_type_uri
      ?? process.env.CALENDLY_EVENT_TYPE_URI
    const slots = await getAvailableSlots(eventTypeUri, 3)
    const slotsText = slots.length > 0
      ? formatSlotsNatural(slots)
      : `[lien Calendly : ${process.env.CALENDLY_EVENT_TYPE_URI}]`

    // Second call avec tool_result
    const finalResponse = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: [...], // même system avec cache
      messages: [
        ...previousMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: slotsText }] },
      ],
    })
    return { content: extractText(finalResponse), tool_calls: [toolUse] }
  }
}
```

## Acceptance Criteria
- [x] `npm run test` — test tool call flow passe (mock Anthropic + mock calendly)
- [x] Réponse finale contient les slots format naturel quand meeting_ready
- [x] Fallback lien direct Calendly si 0 slots
- [x] Pas d'appel Calendly si intent ≠ meeting_ready

## Dependencies
**Blocked By**: v4-005 (generateResponse base), v4-006 (lib/calendly.ts)

## Complexity & Estimates
Medium · 2h · Risk: Medium (tool call loop Anthropic SDK)
