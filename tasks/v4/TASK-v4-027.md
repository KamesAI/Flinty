# Task v4-027 : Inbox unifié email + LI dans `<ConversationThread>` (channel badge)
**Status**: ✅ Complété

## Autonomie
🤖 **Claude 100%** — extension composant React + route API.

## Context
Thomas doit voir dans le même thread un email sortant v3, la reply email, le DM LinkedIn, et la réponse Setter LI — tout chronologiquement, avec badges canal pour distinguer email/linkedin.

**Références** : PRD-v4 F9 · ARCHI-v4 §Frontend ConversationThread

## Objective
`<ConversationThread>` étendu pour afficher turns cross-canal (email + linkedin) avec badges distincts.

## Requirements

### Must Have
- [x] Composant `<ConversationThread>` (v4-013) étendu : chaque turn affiche badge canal
- [x] Badge email : 📧 "Email"
- [x] Badge linkedin : 💼 "LinkedIn"
- [x] Visuel distinct : turns LI avec légère teinte bleu LinkedIn (border left bleu)
- [x] Route `GET /api/replies/[lead_id]` (v4-011) : retourne déjà `channel` dans Turn → aucune modification route
- [x] Inbox tab "À valider" : dans la liste, afficher canal du dernier message (email ou linkedin)
- [x] Si thread mixte (email + LI) : afficher les deux canaux dans un même thread

### Must NOT
- Pas de tab "Email" et "LinkedIn" séparés dans l'inbox — tout dans le même thread chronologique
- Pas de refactoring de <ConversationThread> — extension uniquement

## Technical Approach

```tsx
// Extension dans ConversationThread.tsx
const CHANNEL_CONFIG = {
  email: { icon: '📧', label: 'Email', borderClass: 'border-l-2 border-gray-300' },
  linkedin: { icon: '💼', label: 'LinkedIn', borderClass: 'border-l-2 border-blue-500' },
}

// Dans TurnBubble :
const channelCfg = CHANNEL_CONFIG[turn.channel]
<div className={`${bgClass} ${channelCfg.borderClass} ...`}>
  <span className="text-xs text-muted-foreground">{channelCfg.icon} {channelCfg.label}</span>
  {/* contenu */}
</div>
```

## Acceptance Criteria
- [x] Thread avec turns email + linkedin s'affiche chronologiquement dans un seul composant
- [x] Badges email/linkedin visibles et distincts sur chaque turn
- [x] Turn LI setter draft : badge LinkedIn + fond draft (même que email draft)
- [x] Inbox liste : canal du dernier message visible dans chaque item

## Avancement

### 2026-05-20 — Badges canal + liste inbox livrés
- `ConversationThread` affiche les badges Email/LinkedIn sur chaque turn et une bordure bleue LinkedIn.
- La liste inbox affiche le canal du dernier message prospect dans `À valider` et `À répondre`.
- Fixtures/tests couvrent threads mixtes email + LinkedIn, draft Setter et dernier message LinkedIn.
- Aucun split de tab canal : thread chronologique unique conservé.

## Dependencies
**Blocked By**: v4-013 (ConversationThread base), v4-026 (WF11 génère des turns LI)

## Complexity & Estimates
Low · 2h · Risk: Low
