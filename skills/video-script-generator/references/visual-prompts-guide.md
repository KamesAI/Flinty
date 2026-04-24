# Guide des Prompts Visuels IA

## Structure d'un prompt efficace

### Format universel (Midjourney, Leonardo, DALL-E)

```
[Sujet principal], [action/pose], [environnement/décor], [éclairage], [style artistique], [détails techniques] --ar [ratio]
```

### Composants détaillés

| Composant | Description | Exemples |
|-----------|-------------|----------|
| Sujet | Qui/quoi est représenté | "entrepreneur working", "smartphone screen" |
| Action | Ce que fait le sujet | "typing on laptop", "presenting data" |
| Environnement | Où se passe la scène | "modern office", "minimalist studio" |
| Éclairage | Ambiance lumineuse | "soft natural light", "neon glow" |
| Style | Rendu visuel | "3D render", "cinematic", "motion graphics" |
| Technique | Paramètres de rendu | "8k", "photorealistic", "clean lines" |

---

## Prompts par type de scène

### Scènes business/SaaS

**Dashboard/Interface :**
```
Clean SaaS dashboard interface showing analytics graphs, modern UI design, 
purple and blue gradient, glassmorphism style, dark mode, 8k render --ar 16:9
```

**Personne au travail :**
```
Professional entrepreneur working on laptop, modern coworking space, 
soft natural lighting, shallow depth of field, cinematic look --ar 9:16
```

**Équipe/Collaboration :**
```
Diverse team collaborating in modern office, glass walls, 
warm afternoon light, candid moment, professional photography style --ar 16:9
```

### Scènes transformation/Résultats

**Avant/Après :**
```
Split screen comparison, left side cluttered desk with papers chaos, 
right side clean organized workspace with laptop, dramatic lighting contrast --ar 9:16
```

**Graphique croissance :**
```
3D animated growth chart, arrow pointing up, green glowing particles, 
dark background, motion graphics style, professional business visual --ar 9:16
```

**Succès/Célébration :**
```
Person celebrating success at desk, arms raised, laptop showing positive graphs, 
golden hour lighting, cinematic composition, joyful expression --ar 9:16
```

### Scènes produit/Demo

**Smartphone mockup :**
```
Floating smartphone showing app interface, clean white background, 
soft shadows, product photography style, ultra realistic render --ar 9:16
```

**Laptop avec écran :**
```
MacBook Pro on wooden desk showing website, plants in background, 
cozy home office, natural daylight, lifestyle photography --ar 16:9
```

### Scènes abstraites/Concepts

**Automatisation :**
```
Abstract visualization of automation, flowing data streams, 
connected nodes, blue and purple neon, futuristic style, 3D render --ar 9:16
```

**Intelligence artificielle :**
```
AI brain concept, neural network visualization, glowing connections, 
dark background with blue accent lighting, sci-fi aesthetic --ar 9:16
```

**Productivité :**
```
Time concept visualization, clock elements dissolving into productivity icons, 
clean minimal style, soft gradient background, motion graphics --ar 9:16
```

---

## Modificateurs de style

### Styles visuels courants

| Style | Prompt modifier | Rendu |
|-------|-----------------|-------|
| Cinématique | "cinematic, film grain, anamorphic" | Look film professionnel |
| Motion Graphics | "motion graphics style, clean vectors" | Animé, moderne |
| 3D Render | "3D render, octane, blender" | Volume, profondeur |
| Flat Design | "flat design, vector art, minimal" | Simple, iconique |
| Photoréaliste | "photorealistic, 8k, detailed" | Comme une photo |
| Néon/Cyber | "neon glow, cyberpunk, dark" | Futuriste, tech |

### Éclairages recommandés

| Ambiance | Prompt modifier |
|----------|-----------------|
| Professionnel | "soft studio lighting, clean" |
| Dramatique | "dramatic rim lighting, high contrast" |
| Chaleureux | "golden hour, warm tones" |
| Tech/Moderne | "blue accent lighting, cool tones" |
| Naturel | "natural daylight, soft shadows" |

---

## Ratios d'aspect

| Ratio | Usage | Plateforme |
|-------|-------|------------|
| `--ar 9:16` | Vertical | Shorts, Reels, TikTok |
| `--ar 16:9` | Horizontal | YouTube, présentations |
| `--ar 1:1` | Carré | Instagram feed |
| `--ar 4:5` | Portrait | Instagram, Facebook |

---

## Conseils pour la cohérence visuelle

### Maintenir un style uniforme sur toutes les scènes

1. **Définir une palette** : Choisir 2-3 couleurs dominantes
2. **Fixer un style** : Garder le même style artistique
3. **Éclairage cohérent** : Même type de lumière partout
4. **Seed** : Utiliser le même seed pour les variantes

### Template de cohérence

```
[Scène spécifique], [style constant: ex: "3D motion graphics"], 
[palette: ex: "purple and blue gradient"], [éclairage: ex: "soft studio lighting"], 
clean professional look, 8k quality --ar 9:16
```

---

## Prompts pour transitions

**Zoom in :**
```
[Scène] with dramatic zoom effect, motion blur on edges, 
focus on center, dynamic composition --ar 9:16
```

**Morphing/Transformation :**
```
Visual transition between [élément A] and [élément B], 
fluid morphing effect, seamless blend, artistic interpretation --ar 9:16
```

---

## Checklist avant génération

- [ ] Ratio adapté à la plateforme cible
- [ ] Style cohérent avec les autres scènes
- [ ] Sujet clairement défini
- [ ] Éclairage spécifié
- [ ] Mots-clés de qualité inclus (8k, detailed, etc.)