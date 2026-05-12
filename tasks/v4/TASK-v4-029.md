# Task v4-029 : Vidéo perso Loom embed — auto-trigger follow-up #4 ou demande explicite
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — logique dans Setter + template email.

## Context
Pour les prospects froids ou qui ne répondent plus après 3 follow-ups, une vidéo Loom personnalisée enregistrée 1x par Thomas peut débloquer l'engagement. Auto-trigger au 4ème follow-up ou si prospect demande "pouvez-vous m'en dire plus ?".

**Références** : PRD-v4 F10 · ARCHI-v4 §Phase 3

## Objective
Embed Loom dans email HTML (follow-up #4) + lien texte dans DM LinkedIn, déclenché automatiquement ou sur intent="demande_info".

## Requirements

### Must Have
- [ ] Champ `loom_video_url` dans Config tab enfant (Thomas y colle l'URL Loom 1x par campagne)
- [ ] UI settings campagne : input "URL vidéo Loom" + preview miniature
- [ ] Logique Setter : si `follow_up_count >= 4` OU `intent.includes('demande_info')` → inclure Loom dans réponse
- [ ] Email HTML : embed thumbnail Loom cliquable (`<a href="[loom_url]"><img src="[thumbnail]" /></a>`) + texte "Regardez cette vidéo de 2 min"
- [ ] LI DM : simple lien texte Loom (LI ne supporte pas embed)
- [ ] Pas de Loom si `loom_video_url` non configuré (fallback silencieux)

### Must NOT
- Ne pas embed la vidéo en autoplay (nuisible délivrabilité email)
- Ne pas envoyer Loom sur CHAQUE follow-up — uniquement #4 ou sur demande

## Technical Approach

```typescript
// Dans generateResponse, avant génération :
if (campaign.loom_video_url && (followUpCount >= 4 || intent === 'interested_wants_more')) {
  ctx.includeLoom = true
  ctx.loomUrl = campaign.loom_video_url
  ctx.loomThumbnail = `https://www.loom.com/thumbnails/${extractLoomId(loomUrl)}.jpg`
}
```

Template email Loom embed :
```html
<a href="{{loom_url}}" target="_blank">
  <img src="{{loom_thumbnail}}" width="480" alt="Vidéo 2 min — {{sender_name}}" style="border-radius:8px;border:1px solid #eee"/>
</a>
<p>Regardez cette vidéo de 2 min → <a href="{{loom_url}}">{{loom_url}}</a></p>
```

## Acceptance Criteria
- [ ] Config enfant avec `loom_video_url` configuré → Loom inclus au follow-up #4
- [ ] Sans `loom_video_url` → follow-up normal sans erreur
- [ ] Email HTML : thumbnail visible + cliquable vers Loom
- [ ] DM LinkedIn : lien texte uniquement

## Dependencies
**Blocked By**: v4-005 (generateResponse base)

## Complexity & Estimates
Medium · 3h · Risk: Low
