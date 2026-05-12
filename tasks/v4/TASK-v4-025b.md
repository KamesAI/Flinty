# Task v4-025b : WF10 mix d'actions organiques — 1 like + 1 profile view toutes les N invitations
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — ajout nodes dans WF10 n8n.

## Context
Pour casser le pattern bot détectable par LinkedIn (envoyer uniquement des invitations en boucle), WF10 intercale des actions organiques : liker un post ou consulter un profil. Ces actions ne comptent pas dans le cap invitation.

**Références** : ARCHI-v4 §Pacing engine organic_mix · PRD-v4 F12

## Objective
Actions organiques intercalées dans WF10 : 1 like ou 1 view toutes les 3 invitations.

## Requirements

### Must Have
- [ ] Node `Code` dans WF10 : après chaque 3ème invitation → décide action organique (like ou view, aléatoire 50/50)
- [ ] Action like : Unipile `POST /api/v1/posts/{post_id}/like` (post récent du secteur ICP)
- [ ] Action view : Unipile `GET /api/v1/users/{profile_id}` (profile d'un lead de la liste, simulé comme view)
- [ ] Ces actions comptent dans cap `views: 200/j` warm mais pas dans `invitations`
- [ ] Délai Gauss entre action organique et prochaine invitation (µ=120s σ=60s)
- [ ] Log `organic_action: like|view` dans LI_Health pour traçabilité

### Must NOT
- Ne pas liker du contenu non lié au secteur ICP — risque de paraître incohérent
- Pas plus de 1 action organique par série de 3 invitations (ne pas sur-simuler)

## Technical Approach

```javascript
// Code node dans WF10 (après chaque invitation)
const invitCount = $('Loop Over Items').context.currentRunIndex + 1
if (invitCount % 3 === 0) {
  const action = Math.random() > 0.5 ? 'like' : 'view'
  // Déclencher l'action via Unipile
  return [{ json: { trigger_organic: true, organic_action: action } }]
}
return [{ json: { trigger_organic: false } }]
```

## Acceptance Criteria
- [ ] Sur un run de 9 invitations → 3 actions organiques observées (toutes les 3)
- [ ] Actions loggées dans LI_Health ou n8n logs
- [ ] Délai post-organic avant prochaine invitation ≥60s

## Dependencies
**Blocked By**: v4-025 (WF10 base)

## Complexity & Estimates
Low · 2h · Risk: Low
