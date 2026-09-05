# AGEO — app

Frontend Vite + React qui remplace le prototype (artifact Claude). Branché en dur sur le vrai
projet Supabase `A.G.E.O` (organisation DigiHome) — voir `src/lib/supabase.js`.

## Ce qui fonctionne déjà

- **Accueil** → choix Voyageur / Hôte
- **Voyageur** : code d'accès → création de compte → connexion ; onglet Logement connecté au vrai
  backend (pièces + plan isométrique). Les autres onglets sont des emplacements réservés
  (« bientôt disponible ») — c'est la suite du chantier, pas un oubli.
- **Hôte** : inscription (crée votre compte + votre première propriété), connexion, génération de
  codes d'accès — tout parle réellement à Supabase, RLS comprise.

## Déployer (sans terminal, via GitHub + Vercel)

1. Sur [github.com](https://github.com), créez un nouveau dépôt vide (pas de README auto-généré).
2. Dans ce dépôt, **Add file → Upload files**, glissez-y tout le contenu de ce dossier
   (sauf `node_modules` et `dist`, déjà exclus par `.gitignore` — ne les uploadez pas).
3. Sur [vercel.com](https://vercel.com), **Add New → Project**, importez ce dépôt GitHub.
   Vercel détecte Vite automatiquement (build : `npm run build`, dossier de sortie : `dist`) —
   aucune configuration à toucher.
4. Déployez. C'est tout : les identifiants Supabase publics sont déjà dans le code, pas de
   variable d'environnement à configurer pour ce premier déploiement.

## Développer localement (si un jour vous avez un terminal sous la main)

```
npm install
npm run dev
```

## Prochaine itération

Porter depuis le prototype (artifact) : Services, Bons plans, Recommandations, Socialiser, Avis,
le tableau de bord hôte complet (Pièces avec upload photo 4 angles, Objets avec repères, Demandes,
Activités, Réglages), et l'i18n (FR/EN/AR/RU/ZH).

## Point de vigilance sécurité (non bloquant)

`npm audit` signale une CVE sur `react-router-dom` (redirection ouverte via `useNavigate`/`Link`
avec une cible contrôlée par l'utilisateur). Cette app n'appelle jamais `navigate()` avec une valeur
dynamique — uniquement des chemins fixes en dur — donc le scénario d'exploitation ne s'applique pas
ici. À surveiller si vous ajoutez un jour une redirection basée sur une entrée utilisateur.
