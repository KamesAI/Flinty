# Stratégie d'acquisition Flinty V4 — Roadmap juin → novembre 2026

> Document stratégique — Thomas Callendreau (Kames AI)
> Version : 2026-05-19 (v2 — refonte sur la base du context.flinty.json)
> Contraintes : 0-200 €/mois (no ads) · 15-25h/sem dispo acquisition · ICP solo founders SaaS B2B FR
> Aligné sur les milestones produit : M1 Setter Email (juin-juillet) · M2 LinkedIn (sept-oct) · M3 Polish (nov)

---

## 1. Ce qu'est réellement Flinty V4

Flinty V4 est **une plateforme de prospection autonome multi-canal**. Le SaaS sélectionne les leads (Maps + LinkedIn search/post_engagers/profile_visitors/external_post), les contacte (email Resend + LinkedIn Unipile), tient la conversation via l'AI Setter (Claude Sonnet 4.6 + techniques Voss + No-Oriented Questions), gère les objections, propose des créneaux Calendly dynamiquement, et book le RDV. L'humain n'intervient qu'en validation (mode toggle) ou sur les escalades.

C'est un **concurrent direct de MimikFlow**, lemlist, La Growth Machine, Instantly, Smartlead, HeyReach, Waalaxy, Gojiberry. Pas un add-on. Pas un qualifier. Un commercial IA complet.

**Phasage produit (à intégrer dans toute la stratégie d'acquisition)**

- **M1 (juin-juillet 2026)** — Setter Email + Calendly + Inbox. Flinty V4 sort en email-only au lancement public. La promesse marketing à ce stade : "Le commercial IA qui lit tes replies, gère les objections et book tes RDV pendant que tu codes."
- **M2 (sept-octobre 2026)** — LinkedIn (Unipile) ajouté. Repositionnement complet : "La seule plateforme multi-canal email + LI avec pacing anti-ban enterprise et validation EU AI Act."
- **M3 (novembre 2026)** — Polish, multi-workspace, cost/meeting <$15, scaling clients agences.

**Différenciateurs vs MimikFlow (à matraquer dès M2)**
- Multi-canal email + LinkedIn (MimikFlow = LI only, ICP non-tech bloqué)
- Pacing anti-ban enterprise (cap 100 invits/sem hard, ramp-up 4 sem, circuit breaker WF12, IP résidentielle, human hours)
- Validation mode configurable par canal (Setter peut être ON sur email et OFF sur LI, ou inverse) → compliance EU AI Act article 50
- Scoring ICP 14 champs (vs auto-fill MimikFlow imprécis)
- Inbox unifié cross-canal avec ConversationThread
- Google Sheets comme DB → no-code pour les agences/clients
- Workspace multi-tenant Phase 3 → revente en marque blanche aux agences

---

## 2. Diagnostic stratégique

### Le marché concurrentiel (mai 2026)

MimikFlow a lancé en avril 2026 (Mohamed Alani, solo founder, FR). Il occupe le terrain "AI Setter LinkedIn 15 RDV/mois" et capte l'attention. Mais sa surface d'attaque est connue : LI-only, ICP auto-fill imprécis, pas de pacing pro, pas de validation mode, pas de CRM avancé. **Tu arrives 4-6 mois après avec un produit techniquement supérieur sur tous les axes** — l'effet "second-mover" peut jouer si tu communiques bien.

lemlist, Instantly, La Growth Machine sont les concurrents installés : audience massive, brand bien posée, communautés (Cold Outreach Masterclass d'Instantly = 50k+ membres FB, lemlist family = communauté propre). Ne pas attaquer frontalement. Te positionner comme "le multi-canal IA-native pour solo founders qui n'ont pas de SDR".

### L'ICP retenu : Solo founders SaaS B2B FR

Tu as raison de raffiner. Les freelances lead-gen sont un wedge possible mais saturés en outils et négocient les prix. Le segment qui matche le mieux Flinty V4 :

**Solo founders SaaS B2B FR (1-3 employés, MRR 0-50k €/mois)**
- Ils paient DÉJÀ lemlist (99 €/mois) ou Instantly (97 $/mois) ou Apollo (49 $/mois) ou un combo Apollo + Smartlead
- Ils n'ont pas de SDR, ils prospectent eux-mêmes ou pas du tout
- Ils sont sur LinkedIn et X (audience accessible)
- Ils achètent vite (pas de procès interne, pas de CFO)
- Ils sont influents dans la communauté indie hacker FR → 1 témoignage = effet réseau
- Ticket 79-149 €/mois est immédiatement digérable s'il leur ramène 3 RDV
- **Tu es l'un d'eux** → autorité naturelle, langage commun, pain réel

**Persona archétype "Antoine"**
- 32 ans, fondateur d'un SaaS B2B vertical (legaltech, fintech, HR-tech FR)
- 8 000 € MRR, vise 30k en fin d'année
- Codes 40h/sem, fait 10h de "growth" mais sans méthode
- Lemlist depuis 6 mois, 200 emails/sem, 2-3 RDV/mois, lit ses replies à 23h avec Notion ouvert
- Stack : Vercel + Supabase + Stripe + Linear + Notion + lemlist + Calendly
- Suit Scalezia, Yann Leonardi, Bruno Estrella, Pierre Lechelle sur LinkedIn
- Lit Maddyness, Indie Hackers FR, /r/SaaS
- A déjà essayé MimikFlow, mais s'est arrêté à cause du LI-only et de la peur du ban

**Channels où "Antoine" passe son temps**
- LinkedIn (quotidien, mode lurker + commentaire actif)
- X / Twitter (quotidien, build-in-public)
- YouTube (1-2h/sem, tutoriels techniques)
- Communautés FR : Scalezia (gratuit + payant), Indie Hackers FR, BuildInPublic FR, Slack "Salesfolks"
- Newsletters : Snowball, Yann Leonardi, Pierre Lechelle, Lenny Newsletter
- Podcasts : GDIY, Indie Maker FR

### Wedge secondaire (à n'attaquer qu'après M2)

**Agences SDR / outbound FR** (5-20 employés). Ticket plus haut (250-500 €/mois × N comptes), cycle de vente plus long, mais effet de levier énorme via workspace multi-tenant Phase 3. Tu en parles en M3 (novembre 2026), pas avant.

---

## 3. Plan d'acquisition aligné sur le phasage produit

Trois phases d'acquisition synchronisées avec M1 / M2 / M3. Logique : tu utilises chaque milestone produit comme événement médiatique.

### Phase A — Build in Public (maintenant → mi-juin 2026, ~4 semaines)

**Objectif** : construire l'audience AVANT d'avoir le produit prêt. Quand M1 sort, tu as déjà 1 000 followers LinkedIn engagés qui ont vu Flinty se construire et qui veulent l'essayer.

**Le levier #1 absolu : Build in Public sur LinkedIn + X**

Tu codes Flinty 30-40h/sem. Chaque session de code = matière à un post. Tu n'inventes rien, tu documentes. C'est le levier le plus rentable pour un développeur solo : 0 € de coût, 100 % d'authenticité, social proof immédiat.

**Cadence visée Phase A**
- **LinkedIn** : 5 posts/semaine, ton "carnet de dev", screens du dashboard, screens n8n, captures Cursor, snippets TypeScript, leçons apprises
- **X (Twitter)** : 2-3 tweets/jour, micro-format, threads hebdo sur des leçons techniques (anti-ban, Sonnet 4.6 prompt caching, Unipile webhooks)
- **Newsletter (Beehiiv ou Substack gratuit)** : 1 édition/semaine, "Le carnet de Flinty #N", 800-1 500 mots

**Topics 4 premières semaines (déjà prêts à exploiter dans ton context.flinty.json)**
1. "Pourquoi j'ai construit Flinty V4 alors que MimikFlow existe déjà" (différenciation)
2. "Comment j'utilise Claude Sonnet 4.6 + prompt caching pour économiser 70 % de tokens"
3. "Le pacing anti-ban LinkedIn : 100 invits/sem hard cap, voici pourquoi tous les concurrents se font ban"
4. "Les 14 champs ICP que mon SaaS utilise pour scorer un lead (vs auto-fill MimikFlow)"
5. "Validation mode + EU AI Act article 50 : pourquoi tous les SaaS IA vont devoir se conformer"
6. "n8n self-hosted vs Make/Zapier : pourquoi je dépense 4 €/mois au lieu de 200"
7. "Comment je dogfoode Flinty : voici les 23 RDV qu'il a bookés pour Kames AI ce mois"
8. "Calendly tool call + Claude : le bug qui m'a fait perdre 4h aujourd'hui"

**Discipline absolue** : poste les leçons brutes, pas les wins polish. Le contenu "voici mon échec et ce que j'en ai tiré" performe 3-5× mieux qu'un humble brag.

**Setup technique semaine 1 de la phase A**
- Profil LinkedIn Thomas Callendreau optimisé : photo, bannière Flinty, headline "Je construis Flinty — le commercial IA multi-canal pour solo founders SaaS B2B", featured section avec liens vers landing Flinty + 1 article phare
- Profil X @callendreau (ou équivalent) : bio similaire, pinned tweet "Je construis Flinty en public, voici la roadmap"
- Newsletter Beehiiv "Le carnet de Flinty" créée, page de capture sur ton site Kames
- Landing flinty.app (ou flinty.kamesai.com) v0 : 1 page seule avec waiting list (Formspree gratuit ou ConvertKit gratuit jusqu'à 1k contacts)

**Outils Phase A (budget)**
- Plausible Analytics : 9 €/mois
- Beehiiv : gratuit jusqu'à 2 500 subs
- ConvertKit : gratuit jusqu'à 1 000 subs (alternative)
- Loom : gratuit (5 min max par vidéo)
- Screen.studio : 89 € one-time (super recommandé pour démos LinkedIn)
- Tally ou Formspree pour formulaires : gratuit
- **Total : 9 €/mois récurrent + 89 € one-time = 98 € au total cette phase**

**Action communauté Phase A**

Tu rejoins et tu commentes (pas tu pitches) dans 4 endroits :
1. **Scalezia** (communauté payante FR Yann Leonardi) — abonnement ~30-50 €/mois, lui sert d'audience
2. **Indie Hackers FR** (Slack/Discord)
3. **Build In Public FR** (LinkedIn Group + Discord)
4. **r/SaaS, r/cofounder, r/startups** (Reddit, internationals)

Règle : 10 commentaires utiles avant 1 mention de Flinty. Le ratio compte. Tu réponds aux questions de prospection, tu partages tes apprentissages, tu cites des concurrents quand c'est plus pertinent que Flinty. Ça te construit une crédibilité que les vendors qui pitchent ne pourront jamais avoir.

---

### Phase B — Launch 1 : Setter Email (mi-juin → fin août 2026, ~10 semaines)

**Milestone produit** : M1 livré fin sem 6 du phasage produit (Setter Email + Calendly + Inbox + Email Health Monitor).

**Objectif acquisition Phase B**
- 30 utilisateurs payants à fin juillet (49 ou 79 €/mois)
- 80 à fin août
- 3 000 followers LinkedIn cumulés
- 1 500 subscribers newsletter
- 1 lancement Product Hunt classé top 5 du jour

#### Étape B.1 — Beta privée (mi-juin → fin juin, 2 semaines)

20 beta-users triés à la main parmi tes meilleurs commentateurs Phase A. Tu les contactes directement par DM LinkedIn :

> "Hey [prénom], je sors la beta privée de Flinty (le SaaS dont je parle depuis 4 semaines) la semaine prochaine. J'ouvre 20 places, gratuit pendant 1 mois en échange d'un feedback honnête + un screenshot LinkedIn si tu aimes. Je pense que t'es exactement la cible. Ça t'intéresse ?"

Critères de sélection des 20 :
- Solo founder SaaS B2B FR identifié
- A déjà payé un outil de cold email (lemlist, Instantly, Apollo) → ils savent évaluer
- Engagement réel sur tes posts Phase A (likes + commentaires)
- Pas de concurrent direct dans leur cercle proche

**Pendant la beta tu**
- Onboard chacun en 1:1 (15 min sur Calendly) → tu apprends leur ICP, leur stack, leur use case
- Tu setup leur première campagne avec eux → garantie de succès
- Tu interviens sur la moindre friction → 24h response time max
- Tu records les calls (avec consentement) → matière à clip vidéo pour LinkedIn

**Tu en sors avec**
- 10-15 témoignages bruts (screens LinkedIn, vidéos Loom 60s)
- 5-8 cas chiffrés ("X RDV bookés en Y jours")
- Une feature request list priorisée
- 0 € dépensé, juste 20-30h de ton temps

#### Étape B.2 — Launch public (1er juillet → 31 juillet)

**Le launch en 5 actes**

1. **Landing v1 finale**. Inspire-toi de la structure mimikflow.com/en (qui est techniquement excellente) :
   - H1 + sous-titre + double CTA (essai 7j + demo)
   - VSL de 2 min (Screen.studio + ton commentaire) montrant Flinty en action sur tes propres campagnes Kames
   - Bloc chiffres réels (Email Health Monitor stats + Setter accuracy de la beta)
   - Bloc "How it works" en 4 étapes avec captures du dashboard
   - **Page `/alternatives` SEO-killer** : Flinty vs MimikFlow / lemlist / Instantly / La Growth Machine / Smartlead / Apollo / Clay / HeyReach. Chaque tableau ultra-honnête (où Flinty perd, tu le dis). Date "verified May 2026". Liens vers le site de chaque concurrent (signal de confiance + SEO).
   - Page `/customer-stories` avec les 10-15 témoignages bruts beta
   - Pricing transparent : 1 plan unique à 79 €/mois (Setter Email + 1 campagne + 1 GSheet enfant). Essai 7j sans CB.
   - FAQ + RGPD + EU AI Act
   - Footer avec lien manifesto "Pourquoi je construis Flinty"

2. **Annonce LinkedIn (J-7)** : "Vendredi prochain, je sors Flinty au public. 4 mois de dev, 22 tâches V3, 22 tâches V4. Voici ce que ça fait." → carousel 8 slides + lien waiting list.

3. **Day-of launch (vendredi 4 juillet ou équivalent)**
   - Post LinkedIn (Thomas + page Flinty)
   - Thread X 12 tweets
   - Newsletter blast
   - Cross-post Indie Hackers / Reddit r/SaaS / Build In Public
   - DM personnel à 50 contacts qualifiés Phase A : "C'est live, voici un coupon LAUNCH50 (-50 % le premier mois)"

4. **Product Hunt launch (semaine suivante, lundi)**. Si possible, vise un mardi ou mercredi (gros trafic). Prépare :
   - Maker comment de 800 mots (pourquoi Flinty, qui c'est pour, ce qui change par rapport aux concurrents, offre PH = 3 mois à -50 %)
   - 8 GIFs animés du produit (Screen.studio export GIF)
   - 1 vidéo VSL 90 sec
   - Mobilisation tes 20 beta-users + ton réseau LinkedIn 1 semaine avant
   - Réponse <2h à TOUS les commentaires PH du jour

5. **Press FR (semaine après Product Hunt)**. Cible 5 médias FR :
   - **Maddyness** : pitch "Un solo founder FR lance un SaaS qui rivalise avec MimikFlow"
   - **FrenchWeb** : angle "L'IA prospection multi-canal made in France"
   - **Capital.fr / BFM Tech** : angle EU AI Act + souveraineté
   - **Le Journal du Net** : angle technique (Claude Sonnet 4.6, Unipile, n8n self-hosted)
   - **Frenchweb startup directory / Welcome to the Jungle Lab** : profil founder
   
   Format pitch : email court (8 lignes), 1 angle clair par média, lien vers press kit (page /press avec logos + screens + bio Thomas + chiffres).

#### Étape B.3 — Content engine en régime (août)

Une fois lancé, l'objectif est d'installer un flywheel content. Tu allouages 15-20h/sem à 4 livrables hebdo :

- **2-3 posts LinkedIn Thomas** (60 min total / sem, tu peux batch le dimanche)
- **1 vidéo YouTube long format 10-15 min** (3-4h pour script + record + édition basique CapCut)
- **1 article SEO blog Flinty** (2-3h avec Claude en assistant)
- **1 newsletter "Le carnet de Flinty"** (1h)

**Topics YouTube à exploiter immédiatement (au moins 10 vidéos dans la chaîne d'ici fin août)**
- "J'ai construit un commercial IA en 4 mois — bilan complet (Flinty)"
- "Tuto : automatiser ta prospection email avec n8n + Claude Sonnet 4.6 (sans no-code superficiel)"
- "MimikFlow vs Flinty : test honnête côte à côte"
- "L'EU AI Act explique simplement (et ce que ça change pour ton SaaS)"
- "Comment je gère 5 campagnes cold email en parallèle sans cramer mon domaine"
- "Le coût caché de bannir son compte LinkedIn (vrais chiffres)"
- "Stack tech solo founder 2026 : Next.js + n8n + Claude + Google Sheets"
- "J'ai testé 7 outils de prospection IA, voici le verdict"
- "Démonstration live : Flinty book 3 RDV en 2h"
- "Behind the scenes : ma routine de solo founder SaaS B2B"

**Topics SEO blog à publier**
- "Flinty vs MimikFlow : comparatif complet 2026" (la page rapporte 30 % du trafic SEO probable)
- "Comment choisir son outil de cold email B2B en 2026 (guide complet)"
- "Pacing LinkedIn : les 7 règles pour ne jamais se faire bannir"
- "AI Setter : comment fonctionne un commercial IA (technique)"
- "EU AI Act article 50 : guide pratique pour SaaS B2B"
- "Cold email RGPD : ce que tu peux et ne peux pas faire"
- "Calendly + IA : automatiser la prise de RDV sans hallucination"
- "Claude Sonnet 4.6 vs GPT-4o pour la prospection : test"
- "Le coût réel d'un commercial IA (LLM + APIs détaillé)"
- "Comment scorer un lead avec 14 champs (méthode Flinty)"

Chaque article ≥ 1 800 mots, image héro, schema markup FAQ, lien interne vers landing + alternatives, CTA en bas.

**Discipline SEO** : tu cibles **"longue traîne"** sur tes 4 premiers mois (mots-clés faciles, intention transactionnelle). Pas "cold email" (impossible à classer), mais "alternative MimikFlow", "lemlist concurrent français", "outil prospection IA EU AI Act".

---

### Phase C — Launch 2 : LinkedIn ajouté (septembre → octobre 2026, ~8 semaines)

**Milestone produit** : M2 (LinkedIn live, KPIs LI accept >35 %, LI reply >20 %, RDV/mois >12).

C'est ton MOMENT MARKETING le plus puissant. Tu peux désormais te positionner frontalement comme **la seule alternative multi-canal + anti-ban + EU à MimikFlow**. Le narratif passe de "concurrent émergent" à "MimikFlow killer".

**Repositioning complet du site**
- Nouvelle H1 : "Le seul commercial IA qui prospecte sur email ET LinkedIn — sans cramer ton compte"
- VSL refaite : démo multi-canal cross-thread (lead reçoit email → répond → Setter relance LinkedIn)
- Page `/alternatives` repositionnée : Flinty devient supérieur à MimikFlow sur 9/10 critères. Tableau choc.
- Page `/anti-ban` dédiée : explications techniques du pacing engine (cap 100/sem, ramp-up 4 sem, circuit breaker WF12, IP résidentielle, mix organic likes). Ça parle aux prospects qui ont peur du ban.

**Launch 2 (mi-septembre)** : tu replay le playbook de juillet en plus gros.
- Product Hunt Launch v2 ("LinkedIn is now live")
- Press FR + EU élargie (TechCrunch FR, Sifted, Tech.eu)
- Webinar live "MimikFlow vs Flinty : faceoff multi-canal" (45 min, inscription via Beehiiv)
- Programme affiliés ouvert publiquement

**Programme affiliés (lancement octobre)**

Inspire-toi de Clay Experts + Lemlist Family. Trois tiers :

1. **Affilié simple (lien tracker)** : 25 % de commission récurrente pendant 12 mois. Ouvert à tous. Auto-onboarding via Rewardful (19 €/mois) ou Tolt (29 €/mois).
2. **Flinty Expert (vetted)** : 30 % de commission récurrente à vie + badge "Flinty Expert" + listing sur ta page `/experts`. Tu sélectionnes 10 experts max (freelances lead-gen + agences alliées). Ils ont accès direct à toi sur Slack/Telegram, prerelease features, co-marketing (ils interviennent sur tes webinars).
3. **Agence Partner** (Phase 3, novembre) : workspace multi-tenant + tarif revente + 40 % marge.

Le secret : tu choisis tes experts parmi les 20-30 meilleurs commentateurs LinkedIn de ta Phase A + B. Ce sont eux qui produisent déjà du contenu autour de toi. Tu les officialises.

**Content engine intensifié**
- Cadence vidéo : passes à 2 YouTube/semaine
- Cadence LinkedIn : 4-5 posts/semaine
- 1 webinar mensuel
- 1 article blog/semaine
- Newsletter : 2 éditions/semaine (gain de fréquence = gain d'audience)

**Communautés à intensifier**
- Tu organises 1 meetup IRL à Paris (octobre) sur "Prospection autonome 2026". Format : 2h, 15-30 invités, AMA, accès Flinty Pro offert. Coût ~150-300 €. Crée une vague de témoignages + posts LinkedIn.
- Tu lances un Slack public "Flinty Lab" (gratuit) inspiré du Slack Clay → ton support s'y fait, les power-users s'y croisent, l'effet réseau démarre.

---

### Phase D — Scale & multi-tenant (novembre 2026 → ouvert)

**Milestone produit** : M3 (Polish, Workspaces, cost/meeting <$15).

À ce stade tu as 150-300 utilisateurs payants. Tu attaques deux nouveaux fronts :

1. **Marché agences** (vrai potentiel revenu). Tu ouvres l'offre workspace multi-tenant à 5-10 agences SDR/outbound FR. Ticket 250-500 €/mois × N comptes. Stratégie sales-led 1:1 (pas de marketing de masse). Tu vas chercher Linkdoo, Scalezia services, agences inbound FR via DM ciblé.

2. **Internationalisation soft (anglais)**. Tu traduits la landing en anglais, tu ajoutes une page `/en/alternatives`, tu attaques Reddit US et Indie Hackers globally. Pas avant d'avoir 30+ clients FR satisfaits. Le risque : support anglais que tu ne peux pas tenir si tu es seul.

---

## 4. Architecture du founder-led marketing (canal principal absolu)

Tu as 15-25h/sem dispo pour l'acquisition et tu refuses les ads. Le seul levier qui te scale à coût marginal nul : **toi, en public, sur LinkedIn d'abord, YouTube ensuite, X en fond**.

### La règle d'or 3-2-1 (à tenir tous les jours d'août à novembre)

- **3** signaux d'entrée quotidiens : tu vis 1 conversation prospect, 1 bug ou learning produit, 1 lecture/discussion (ami, podcast, article)
- **2** sorties publiques par jour : 1 post LinkedIn + 1 tweet OU 1 commentaire LinkedIn long-form (300+ caractères)
- **1** vidéo ou article long-format par semaine

Cette discipline produit ~250 posts par an. Statistiquement, **5-10 d'entre eux feront 50k-200k impressions** (les "viraux compounding"). Ces 5-10 posts généreront 70 % de ton trafic organique et 50 % de tes inscriptions.

### Templates de posts qui marchent en 2026 (à utiliser, pas à copier mot pour mot)

**Template "Échec et leçon"**
> "J'ai cramé mon domaine email aujourd'hui.
> Voici ce que j'ai fait de mal et ce que j'ai changé.
> [3-5 lignes du fail]
> [3-5 lignes du fix]
> [1 ligne "moralité"]
> Si tu construis un SaaS B2B, le pacing email c'est non-négociable."

**Template "Avant/Après"**
> "Avant Flinty : 1h/jour à trier 5-8 replies cold email. 32 % devenaient des RDV.
> Après Flinty : 0 minute. Le Setter classifie + répond + propose un slot. 41 % deviennent des RDV.
> Voici comment je l'ai construit."

**Template "Build-in-public technique"**
> "Aujourd'hui j'ai branché le prompt caching Claude Sonnet 4.6.
> Avant : $0.18 par classification d'intent.
> Après : $0.04. -78 %.
> Voilà comment ça marche [3-4 lignes].
> Si tu utilises Anthropic SDK, voici le doc : [lien]"

**Template "Contrarian opinion"**
> "Tout le monde dit que le cold email est mort.
> C'est faux.
> Ce qui est mort, c'est envoyer 1 000 emails à des leads non qualifiés.
> Ce qui marche en 2026 : 50 emails par jour à des leads scorés en 14 champs.
> Mes chiffres ce mois : [stats]."

**Template "MimikFlow vs Flinty" (à utiliser avec parcimonie, max 1×/mois)**
> "On me demande souvent : pourquoi Flinty alors que MimikFlow existe ?
> Réponse honnête en 3 points :
> 1. MimikFlow = LinkedIn-only. Flinty = email + LI multi-canal.
> 2. MimikFlow pacing = minimal. Flinty = cap 100/sem hard, ramp-up 4 sem, circuit breaker.
> 3. MimikFlow validation mode = absent. Flinty = par canal + EU AI Act.
> Sur 9 critères j'en gagne 8. Et oui, mimik a 1 vrai point fort : leur AI Setter LI est ultra-rodé. C'est ce que j'ai construit en miroir, en mieux."

Note importante : **respecte MimikFlow publiquement.** Tu peux comparer sans dénigrer. C'est ta marque qui en profite (positionnement mature) et ça te protège juridiquement.

---

## 5. Stratégie SEO long-terme

Le trafic SEO démarre lentement (mois 4-5) mais c'est ton meilleur ROI à 12 mois. Plan en 3 piliers.

### Pilier 1 — Pages /alternatives (SEO transactionnel)

Ces pages capturent les recherches "X alternative" / "X concurrent" qui ont la plus forte intention d'achat. À faire pour chaque concurrent :
- `/alternatives/mimikflow`
- `/alternatives/lemlist`
- `/alternatives/instantly`
- `/alternatives/lgm` (La Growth Machine)
- `/alternatives/smartlead`
- `/alternatives/apollo`
- `/alternatives/clay`
- `/alternatives/heyreach`
- `/alternatives/waalaxy`

Chaque page : 1 200-1 800 mots, tableau comparatif transparent, screens, 3 raisons de switcher, CTA essai 7j.

### Pilier 2 — Blog technique de fond (SEO informationnel)

Articles 2 000+ mots qui ciblent les recherches "comment faire X" / "X expliqué". Ton avantage : tu es développeur, tu écris du contenu technique vrai (pas de blog SaaS-marketo poli). Pioche dans la liste des topics blog Phase B.

### Pilier 3 — Glossaire & ressources gratuites (lien magnet)

- Glossaire "Vocabulaire de la prospection IA 2026" (50+ termes définis, format wiki)
- Calculatrice "Cost per Meeting calculator" (formulaire interactif, output partageable)
- Template gratuit "ICP profile en 14 champs" (Google Sheet copiable)
- Audit gratuit "Score ton cold email setup" (formulaire 10 questions + email automatisé avec score)

Ces ressources se backlinkent naturellement (les blogueurs marketing les citent). Tu construits ta domain authority sans payer.

---

## 6. Communautés FR : où passer ton temps en commentaire

Hierarchy de priorité (par ROI temps).

| Plateforme | ROI | Action | Fréquence |
|------------|-----|--------|-----------|
| LinkedIn (posts d'autres founders FR) | ★★★★★ | Commenter 5 posts/jour de founders FR de ton ICP | Quotidien |
| Scalezia (Slack/Discord payant Yann Leonardi) | ★★★★ | Répondre aux questions outbound | 3×/sem |
| Indie Hackers FR (Slack/Discord) | ★★★★ | Partager learnings techniques | 2×/sem |
| Build In Public FR (LinkedIn group + Discord) | ★★★★ | Cross-post tes posts LinkedIn | 1×/sem |
| X (Twitter) | ★★★ | Engagement quotidien + threads hebdo | Quotidien |
| Reddit (r/SaaS, r/coldemail, r/startups) | ★★★ | Réponses détaillées sans pitch | 2×/sem |
| Lemlist Family (Slack lemlist) | ★★ | Présence légère (compétiteur, sois subtil) | 1×/sem |
| Cold Outreach Masterclass FB (Instantly) | ★★ | Présence très légère, partage gratuit | 1×/sem |
| Slack Clay | ★★ | Apprentissage + soft mention | 1×/sem |

**Règle d'or** : tu donnes 10× avant de prendre 1×. Si tu pitches Flinty au bout de 3 messages, tu te brûles. Si tu réponds à 30 questions techniques en 4 semaines, tu deviens "le mec de Flinty qui sait" et le pitch arrive tout seul.

---

## 7. Stratégie press FR (boost lancements M1 et M2)

Tu vas faire 2 vagues PR : juillet (launch Setter Email) et septembre (launch LinkedIn). Setup en amont.

**Press kit à préparer Phase A (semaine 2)**
- Page `/press` sur le site Flinty
- 1 fact sheet PDF 1 page (qui est Flinty, qui est Thomas, chiffres clés, screens HD, citations clés)
- 8 visuels HD (logo, dashboard, founder photo, screens features)
- Bio Thomas en 50 / 150 / 300 mots
- 5 citations prêtes à l'emploi (sur l'IA, le marché, l'EU AI Act, MimikFlow, l'avenir de la prospection)

**Médias FR à pitcher (par ordre de priorité)**

1. **Maddyness** — focus startup tech FR, lectorat exact de ton ICP
2. **FrenchWeb** — focus innovation FR, audience pro
3. **Le Journal du Net** — focus technique, lectorat dev/CTO/RSI
4. **Frenchweb startup directory** — listing gratuit + interview founder
5. **Sifted** (anglais EU) — focus startup EU, lectorat international
6. **Tech.eu** — annonces produit EU
7. **Welcome to the Jungle Lab** — interview founder
8. **BFM Business / TF1+** — focus IA (chance plus faible mais possible avec angle EU AI Act)
9. **Capital.fr** — focus business, angle "made in France"
10. **Les Echos Entrepreneurs** — focus solopreneur/startup

**Format pitch email (à envoyer 10-14 jours avant launch)**

Objet : "Lancement [date] — un solo founder FR lance un concurrent direct à MimikFlow"

Corps :
> Bonjour [prénom],
> 
> [1 ligne sur pourquoi tu écris à ce journaliste précisément — référence à 1 article qu'il a publié sur un sujet adjacent]
> 
> Je lance Flinty le [date], un SaaS de prospection autonome multi-canal (email + LinkedIn) qui rivalise frontalement avec MimikFlow (97-147 $/mois, lancé en avril 2026 par Mohamed Alani).
> 
> 3 angles potentiels qui peuvent t'intéresser :
> - Solo founder FR vs solo founder FR : on est plusieurs à se battre sur ce créneau IA, je peux raconter l'envers du décor
> - EU AI Act article 50 : Flinty est le premier outil à proposer un mode "validation forcée IA" pour les SaaS B2B
> - 4 mois de build-in-public + 22 tâches livrées : technique de dev solo qui marche en 2026
> 
> Press kit : [lien]
> Démo : [lien Calendly]
> 
> Disponible pour un call cette semaine,
> Thomas

Discipline : pas plus de 250 mots. Pas de "révolutionnaire" ou "disruptif" (mots morts en presse).

---

## 8. Routine hebdo concrète (15-25h/sem acquisition)

Bloc dédié et discipliné. La régularité bat l'intensité.

| Jour | Bloc | Durée | Tâche |
|------|------|-------|-------|
| Lundi | Matin | 1h30 | Rédaction + publication post LinkedIn + thread X |
| Lundi | Après-midi | 30 min | Commentaires LinkedIn (10 posts d'autres founders) |
| Lundi | Soir | 1h | Réponses DM + emails entrants |
| Mardi | Matin | 1h | Post LinkedIn + commentaires |
| Mardi | Après-midi | 2h | Call beta-user / prospect (Calendly slots) |
| Mardi | Soir | 30 min | Newsletter draft hebdo |
| Mercredi | Matin | 1h | Post LinkedIn + commentaires |
| Mercredi | Après-midi | 4h | Recording + édition vidéo YouTube |
| Jeudi | Matin | 1h | Post LinkedIn + commentaires |
| Jeudi | Après-midi | 2h | Rédaction article SEO blog (avec Claude) |
| Jeudi | Soir | 30 min | Send newsletter |
| Vendredi | Matin | 1h | Post LinkedIn + commentaires |
| Vendredi | Après-midi | 2h | Communauté (Scalezia, IH FR, Reddit) |
| Vendredi | Soir | 1h | Review KPIs semaine + plan semaine suivante |
| Samedi | Matin | 2h | Vidéo YouTube #2 (Phase C uniquement) ou contenu evergreen |
| Dimanche | Matin | 30 min | Batch posts LinkedIn semaine suivante (drafts) |
| **Total** | | **~21h** | |

Tu peux scaler down à 15h si Phase A (build in public seul) ou up à 25h si Phase C (deux vidéos, webinar, meetup prep).

---

## 9. KPIs à tracker (review tous les vendredis soir, 30 min)

Trois niveaux de KPIs : top-funnel, mid-funnel, bottom-funnel.

### Top-funnel (audience)
| KPI | Cible juillet | Cible août | Cible septembre | Cible octobre | Cible novembre |
|-----|--------------|-----------|----------------|--------------|----------------|
| Followers LinkedIn Thomas | 1 500 | 2 500 | 4 000 | 6 000 | 9 000 |
| Subscribers newsletter | 400 | 800 | 1 500 | 2 800 | 4 500 |
| Followers X | 300 | 600 | 1 000 | 1 500 | 2 500 |
| Subscribers YouTube | 50 | 200 | 600 | 1 500 | 3 000 |
| Visiteurs uniques site/mois | 1 500 | 4 000 | 8 000 | 15 000 | 25 000 |

### Mid-funnel (intention)
| KPI | Cible juillet | Cible août | Cible septembre | Cible octobre | Cible novembre |
|-----|--------------|-----------|----------------|--------------|----------------|
| Inscriptions essai gratuit/mois | 30 | 80 | 150 | 250 | 400 |
| Demos bookées Calendly/mois | 15 | 40 | 80 | 130 | 200 |
| Téléchargements ressources gratuites/mois | n/a | 100 | 250 | 500 | 800 |

### Bottom-funnel (revenu)
| KPI | Cible juillet | Cible août | Cible septembre | Cible octobre | Cible novembre |
|-----|--------------|-----------|----------------|--------------|----------------|
| Conversion essai → payant | 20 % | 25 % | 28 % | 30 % | 32 % |
| Clients payants cumulés | 6 | 30 | 80 | 160 | 280 |
| MRR | 474 € | 2 370 € | 6 320 € | 12 640 € | 22 120 € |
| Affiliés actifs | 0 | 0 | 3 | 10 | 25 |
| Cost per meeting (LLM + APIs) | n/a | n/a | <$25 | <$20 | <$15 |

**Règle d'alerte** : si à la fin de chaque mois tu n'as pas atteint **70 % de la cible MRR**, tu re-challenges en priorité dans cet ordre :
1. Le positionnement (test 5 prospects qualifiés en interview qualitative)
2. Le pricing (peut-être 49 € au lieu de 79 €, ou inverse selon retours)
3. La landing (heatmap Plausible + 5 user tests sur Maze)
4. **Jamais le canal d'acquisition.** LinkedIn founder-led prend 3-4 mois à compounder. Ne tue pas l'arbre avant qu'il ne porte ses fruits.

---

## 10. Ce qu'il ne faut PAS faire (et pourquoi)

- **LinkedIn / Google Ads** : tu as dit non, c'est le bon choix. À ce stade le ROI est imprévisible et tu n'as pas la baseline organique pour mesurer l'incrémentalité. À reconsidérer à 10k €/mois MRR uniquement.
- **Cold email pour vendre Flinty avant août** : tu seras un de plus parmi 1 000 outils. Pire, si ton domaine outreach.kamesai.com est brûlé par des prospects qui spamment, tu détruis ton produit. Tu peux le faire **après** d'avoir 20+ témoignages publics et avec un domaine de prospection séparé (pas outreach.kamesai.com qui est dogfoodé Kames).
- **Recruter un freelance growth/SEO** : tu n'as pas le volume pour rentabiliser. À reconsidérer à 5k €/mois MRR.
- **Acheter des followers / followers X bots** : zéro ROI, signal négatif. Jamais.
- **Engager une PR agency** : 3-5k €/mois pour ouvrir des portes que tu peux ouvrir toi-même avec un pitch propre à 10 journalistes. À reconsidérer à 20k €/mois MRR.
- **Étendre l'ICP trop vite** : tant que tu n'as pas 100 clients solo founders SaaS FR, tu ne touches PAS aux agences ni à l'international. La concentration ICP est le seul levier qui gagne en early-stage.
- **Migrer sur HubSpot / Salesforce CRM** : Google Sheets + Notion suffit jusqu'à 200 clients. Ne paie pas un CRM avant.
- **Faire 2 produits en parallèle** : Kames + Flinty est déjà 2 produits. Pas d'autres en // sur les 6 prochains mois. Discipline.
- **Donner Flinty gratuit à des "influenceurs"** : tu donneras à 10 personnes, 1 postera, et tu perdras du revenu. Mieux : programme affiliés à 30 % récurrent. Les vrais influenceurs préfèrent commission récurrente à 1 mois gratuit.

---

## 11. Étapes concrètes des 7 prochains jours (semaine du 19 mai 2026)

1. **Lundi (3h)** — Optimiser tes profils. LinkedIn Thomas Callendreau : headline "Je construis Flinty — le commercial IA multi-canal pour solo founders SaaS B2B" ; bannière avec screenshot dashboard Flinty (Screen.studio) ; featured section avec 3 liens (landing waiting list, manifesto, vidéo VSL). Pareil sur X.
2. **Mardi (2h)** — Créer la landing v0 Flinty (1 page Next.js sur flinty.kamesai.com ou flinty.app). Bullet points : tagline, 3 features Phase 1, screens dashboard, formulaire waiting list (ConvertKit ou Formspree). Pas de pricing encore. Mets le compteur "Lancement 4 juillet 2026".
3. **Mercredi (1h)** — Créer la newsletter Beehiiv "Le carnet de Flinty". Page de capture + premier mail de bienvenue.
4. **Mercredi (2h)** — Écrire et publier ton premier post LinkedIn V4 : "Pourquoi je construis Flinty alors que MimikFlow existe déjà". Ton honnête, ton manifeste. Inclus la roadmap M1 / M2 / M3.
5. **Jeudi (1h)** — Lister tes 100 prospects ICP idéaux (solo founders SaaS B2B FR) via LinkedIn search. Suis-les. Pas de message direct, juste follow + 1 commentaire utile sur leur dernier post.
6. **Vendredi (3h)** — Préparer 4 posts LinkedIn pour la semaine prochaine. Batch-write avec Claude en assistant. Plannifie-les dans Buffer ou Hypefury (gratuit start).
7. **Vendredi (2h)** — Identifier et acheter Screen.studio (89 €). Faire ta première VSL de 90 sec de Flinty en démo (même rough, on l'améliore après).
8. **Samedi (2h)** — Rejoindre Scalezia (abonnement mensuel ~30-50 €), Indie Hackers FR, Build In Public FR. Pas de pitch. Présentation honnête, 1 commentaire utile dans chacun.
9. **Dimanche (30 min)** — Setup Plausible Analytics sur la landing. Configurer Calendly demo gratuite 30 min.

**Budget cette semaine** : Screen.studio 89 € one-time + Scalezia ~40 € + Plausible 9 € = 138 €. Tu rentres pile dans ton budget.

---

## 12. Mon avis brut sur tes chances

Tu as **5 atouts structurels** que MimikFlow et la plupart des concurrents n'ont pas :

1. **Tu construis Kames en parallèle** = laboratoire client permanent + dogfooding réel + cash flow indépendant. Ton runway n'est pas un compte à rebours.
2. **Stack technique solide** (Next.js + n8n + Claude Sonnet 4.6 + Unipile + Calendly + Resend) avec architecture documentée. Aucun no-code-only solo founder ne peut te rattraper sur les features anti-ban et multi-canal.
3. **Tu parles français nativement** sur un marché FR sous-servi par des SaaS US chers. MimikFlow est FR, c'est pas un hasard, c'est un signal du marché.
4. **Tu as 60-70h/sem dispo** dont 15-25h pour l'acquisition. Un solo founder typique en a 5-10. Ton avantage temps est réel et durable tant que tu n'as pas d'enfants ou de salarié.
5. **Tu arrives 4-6 mois après MimikFlow avec un produit techniquement supérieur sur 8/9 critères.** L'avantage du second-mover qui apprend des erreurs du premier (notamment pacing + multi-canal) est réel.

**Tes 3 risques structurels**

1. **MimikFlow peut copier le multi-canal en septembre.** S'ils ajoutent l'email avant ton M2, ton différenciateur principal s'effondre. Mitigation : tu communiques sur tes différenciateurs avant qu'ils ne réagissent (pacing engine, validation mode, scoring 14 champs, EU AI Act).
2. **Ton MRR cible 22k € en novembre 2026 dépend de 280 clients à 79 €.** C'est ambitieux pour 6 mois post-launch. Plan B : tu peux atteindre 22k avec 100 clients à 220 € (offre Pro avec multi-comptes) en novembre si M3 livre le multi-tenant à temps.
3. **Le burn-out solo founder.** Construire + vendre + supporter à 60-70h/sem sur 6 mois est tenable, sur 18 mois c'est dangereux. Plan : à 10k € MRR (probablement octobre), recrute un dev senior part-time pour Phase 3 backend + multi-tenant. À 25k € MRR, un CSM/sales 50 %.

**Mon pari** : si tu tiens la discipline founder-led marketing 5 jours sur 5 + tu livres M1 et M2 dans les temps + tu protèges ton domaine email et ton compte LinkedIn perso, tu fais **5k € MRR fin août, 15k € fin octobre, 25-30k € fin novembre.** À condition zéro de ne pas zigzaguer sur le positionnement et l'ICP.

La stratégie est connue. C'est l'exécution qui décide. Bonne chance.
