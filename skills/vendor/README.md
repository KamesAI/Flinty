# Vendor — skills tiers

## marketingskills (Corey Haines)

**Décision** : sous-module Git sous [`external/marketingskills`](../../external/marketingskills), pointant sur le dépôt public upstream. Pas de fork tant qu’aucun patch local sur les SKILL.md n’est nécessaire (FR / UE peut tenir dans le hub [`flinty-product-marketing-context`](../flinty-product-marketing-context/SKILL.md)).

**Cloner le repo avec les sous-modules** :

```bash
git clone --recurse-submodules <url-du-repo-flinty>
# ou après clone :
git submodule update --init --recursive
```

**Mettre à jour** : voir [marketingskills-INDEX.md](marketingskills-INDEX.md) section « Mise à jour du vendor ».

**Alternative non retenue ici** : `npx skills add coreyhaines31/marketingskills` vers `.agents/skills/` — utile hors repo Flinty ; dans ce monorepo le submodule garde une source unique et des PR lisibles.
