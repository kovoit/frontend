# CLAUDE.md — Kovoit · Back-office Admin (frontend)

Kovoit : covoiturage urbain à Lomé (Togo) basé sur le partage des frais de carburant. Ce dépôt (`frontend/`) contient **le back-office web d'administration**. L'application utilisateur est dans `../mobile` (Flutter) et l'API dans `../backend` (Django REST Framework).

> **Règle d'or :** la source de vérité fonctionnelle est [PRD.md](PRD.md). En cas de conflit, `PRD.md` l'emporte sur le métier, `CLAUDE.md` sur la méthode de dev. Les agents spécialisés sont décrits dans [AGENTS.md](AGENTS.md).

---

## 1. Stack technique

| Domaine | Choix |
|---|---|
| Langage | **TypeScript** (strict) |
| Build | **Vite** (le template Horizon d'origine est en CRA : ne pas réintroduire `react-scripts`) |
| UI | React 19, **Tailwind CSS 3** (`darkMode: "class"`), react-icons |
| Base visuelle | Template **Horizon UI** (`docs/horizon-react-v1.0.0.zip`), re-skinné avec la charte **Nana Tech** (`docs/Nana Tech.zip`) |
| Routing | react-router 7 (mode data : `createBrowserRouter`) |
| Données serveur | **TanStack Query** + client **axios** (JWT access/refresh) |
| Formulaires | react-hook-form + zod |
| Tableaux / graphiques | @tanstack/react-table, ApexCharts (react-apexcharts) |
| Cartes | Leaflet + tuiles OpenStreetMap (affichage). Distances : calculées par le backend (OSRM ou Google Directions, cf. PRD) |
| Tests | Vitest + Testing Library + MSW (mocks API) |
| Qualité | ESLint, Prettier (+ plugin Tailwind) |

Backend : Django REST Framework. Mobile : Flutter.

## 2. Commandes

```bash
npm install        # dépendances
npm run dev        # serveur de dev Vite
npm run build      # tsc --noEmit + build de production
npm run test       # Vitest
npm run lint       # ESLint
npm run format     # Prettier
```

Variables d'environnement (`.env.local`, jamais commité ; modèle dans `.env.example`) : `VITE_API_URL`, `VITE_USE_MOCKS` (`true` = MSW), `VITE_FEATURE_WALLET` (`true` = écran Transactions, option portefeuille).

## 3. Arborescence

```
src/
├── app/            # App.tsx, routes.tsx, navigation.tsx (menu), providers, queryClient
├── config/         # env.ts, enums & constantes métier (statuts, types de pièces) — miroir du PRD
├── theme/          # tokens Nana Tech consommés par tailwind.config.ts
├── layouts/        # AdminLayout (sidebar + navbar Horizon), AuthLayout
├── components/
│   ├── ui/         # Card, Button, Badge, StatusBadge, DataTable, Modal, Field, EmptyState…
│   └── charts/     # wrappers ApexCharts
├── api/            # client.ts (axios + intercepteurs), un module par ressource, types DTO
├── features/       # un dossier par domaine : api hooks + pages + composants
│   ├── auth/           # connexion admin (email + mot de passe), garde de route
│   ├── dashboard/      # indicateurs
│   ├── kyc/            # file de validation, visionneuse de pièces, valider/rejeter + motif
│   ├── users/          # liste, fiche, fiabilité, suspendre/réactiver
│   ├── trips/          # trajets + points de prise en charge (carte)
│   ├── bookings/       # réservations, timeline des statuts
│   ├── reports/        # signalements & litiges, arbitrage
│   ├── transactions/   # journal (uniquement si portefeuille retenu)
│   └── settings/       # paramètres administrateur
├── hooks/  utils/  # formatage FCFA, dates (Africa/Lome), helpers
├── mocks/          # handlers MSW (navigateur + Node pour les tests)
├── test/           # setup Vitest, helpers de rendu (renderAt)
└── main.tsx
```

Imports absolus via l'alias `@/` → `src/`.

## 4. Pages du back-office

| Route | Page | Exigence PRD |
|---|---|---|
| `/` | Connexion admin (redirige vers `/admin` si déjà connecté ; `/auth/*` redirige ici) | — |
| `/admin` | Tableau de bord | Suivre les indicateurs |
| `/admin/kyc`, `/admin/kyc/:id` | Dossiers KYC | Valider / rejeter avec motif |
| `/admin/users`, `/admin/users/:id` | Utilisateurs | Consulter, suspendre / réactiver |
| `/admin/trips`, `/admin/trips/:id` | Trajets | Consulter |
| `/admin/bookings`, `/admin/bookings/:id` | Réservations | Consulter |
| `/admin/reports`, `/admin/reports/:id` | Signalements & litiges | Traiter, arbitrer |
| `/admin/settings` | Paramètres | Modifier prix du litre, grille, frais, délais, seuils |
| `/admin/transactions` | Journal des transactions | Si option portefeuille |

## 5. Méthode & règles de développement

1. **Lire le PRD** et le code existant avant toute modification. Pour une nouvelle fonctionnalité, passer par l'agent `prd-guardian` (voir AGENTS.md).
2. **Aucune règle métier côté front** : prix, commission, fiabilité, correspondance, transitions de statut sont calculés par l'API. Le front **affiche** ce que renvoie l'API et **déclenche** des actions (endpoints dédiés), jamais un `PATCH statut` libre.
3. **Valeurs métier = paramètres** : ne jamais coder en dur prix du litre, grille, délais, seuils. Ils viennent de `/parametres`.
4. **Enums centralisés** dans `src/config/` avec les valeurs exactes du PRD (snake_case, sans accents : `demandee`, `en_attente`, `verifie`…). Libellés FR et couleurs associés au même endroit.
5. **Réutiliser Horizon** : partir des composants du template (sidebar, navbar, Card, tables, charts) en les convertissant en TS ; supprimer ce qui ne sert pas (NFT marketplace, RTL, FixedPlugin, données de démo, dépendances Chakra).
6. **TypeScript strict** : pas de `any` non justifié ; les DTO de l'API sont typés dans `src/api/types`.
7. **Une feature = un dossier** : `features/<domaine>/{api.ts, pages/, components/}`. Les appels réseau passent toujours par des hooks TanStack Query.
8. **UI en français**, montants en `FCFA` (séparateur de milliers, sans décimales), dates/heures en fuseau `Africa/Lome`.
9. **Tests** : chaque page a au moins un test de rendu + un test des actions critiques (valider KYC, suspendre, trancher un litige), avec MSW.
10. **Accessibilité** : contrastes AA, focus visibles, libellés sur tous les champs, actions destructives confirmées par une modale.

## 6. Charte graphique Nana Tech (tokens)

Relevée sur les maquettes mobiles ; à appliquer au template Horizon.

| Token | Valeur | Usage |
|---|---|---|
| `brand-900` (navy) | `#0F2A55` | Couleur principale : boutons, sidebar active, cartes mises en avant |
| `brand-700` | `#1B3A6B` | Hover, textes de titres |
| `accent-500` (orange) | `#F28C28` | Accents, liens, épingles, statut « à faire » |
| `accent-50` | `#FFF3E6` | Fonds d'encarts d'info (ex. « Prix recommandé ») |
| `success-500` | `#22A55B` | Vérifié, terminé, actif |
| `success-50` | `#E8F7EE` | Fond des badges de succès |
| `danger-500` | `#E5484D` | Rejeté, suspendu, litige |
| `bg` | `#F5F7FA` | Fond de page |
| `surface` | `#FFFFFF` | Cartes |
| `text` / `text-muted` | `#0F2A55` / `#6B7A90` | Textes |

- Police : **Plus Jakarta Sans** (Google Fonts), graisses 400/500/600/700.
- Rayons : cartes `rounded-2xl` (~16–20 px), boutons et champs `rounded-xl`.
- Ombres douces, bordures `#E6EAF0`.
- Badges de statut : pastille arrondie, icône + libellé, fond clair de la couleur du statut.
- Logo : « K » navy et route orange, signature « Même trajet, moins cher ».
- Mode sombre : conserver le mécanisme Horizon (`dark` class), avec `navy` comme fond.

## 7. Authentification

- **Utilisateurs (app mobile)** : inscription avec nom complet, email, téléphone et mot de passe (Google optionnel), puis **vérification du téléphone par code SMS à 6 chiffres**. **Connexion par email + mot de passe.**
- **Back-office** : connexion admin par **email + mot de passe**, réservée aux comptes ayant le rôle administrateur. JWT : access token en mémoire, refresh token en cookie `httpOnly` si le backend le permet ; sinon `sessionStorage` (jamais `localStorage`).
- Ne pas confondre l'**OTP SMS d'inscription (6 chiffres)** et le **code de départ (4 chiffres)** d'une réservation.
- Implémentation : `src/features/auth/` (`AuthProvider` restaure la session au chargement via le refresh, `RequireAuth` protège `/admin/*`, `LoginPage`). Un compte valide sans rôle `admin` est refusé côté front ; le backend doit aussi le refuser.
- Contrat API attendu (détaillé dans `src/features/auth/types.ts`) : `POST /auth/login/`, `POST /auth/token/refresh/`, `GET /auth/me/`, `POST /auth/logout/`.
- Comptes du mode mock (MSW uniquement) : `admin@kovoit.tg` / `Admin123!` (admin), `conducteur@kovoit.tg` / `Passe123!` (non admin, refusé).

## 8. Droits d'accès & machine à états (rappel du PRD)

### A. Contrôle d'accès (DRF permissions, appliqué par le backend)
- **Non connecté :** uniquement le lien public « Partager mon trajet ».
- **Téléphone vérifié (OTP SMS) :** recherche et consultation des trajets.
- **KYC passager `verifie` :** réserver un trajet.
- **KYC conducteur `verifie` + véhicule déclaré :** publier un trajet.
- **Compte suspendu :** réservation et publication bloquées ; réservations à venir annulées et remboursées.
- **Administrateur :** seul rôle autorisé sur le back-office.

### B. Statuts KYC
`non_verifie` → `en_attente` → `verifie` | `rejete` (avec `motif_rejet`, re-soumission possible).

### C. Machine à états de la réservation (9 statuts)
- **Parcours nominal :** `demandee` → `acceptee` → `en_cours` → `terminee` → `cloturee`
- **Exceptions :** `refusee`, `annulee`, `absent`, `litige`

**Règles strictes :**
- Passage à `en_cours` **uniquement** quand le conducteur saisit le code de départ à 4 chiffres donné par le passager.
- `code_depart_hash` est stocké haché et **n'est jamais renvoyé au conducteur ni affiché dans le back-office**.
- Passage à `cloturee` à la confirmation du passager ou automatiquement après `delai_confirmation_auto_h`.
- Un `litige` n'est clos que par un arbitrage administrateur.

### D. Statuts d'un trajet
`publie`, `complet`, `en_cours`, `termine`, `annule`.

## 9. Données sensibles (KYC)

- Les pièces KYC ne sont **jamais** exposées par URL publique : le back-office les affiche via une URL signée et à durée courte fournie par l'API.
- Pas de cache navigateur ni de téléchargement automatique des pièces ; pas de log console de données personnelles.
- Chaque consultation de pièce est journalisée côté backend (l'UI appelle l'endpoint dédié, elle ne contourne pas ce journal).

## 10. Sources de référence (`docs/`)

| Fichier | Rôle |
|---|---|
| `Kovoit Spécification du MVP (1).docx` | Spécification d'origine (contenu repris dans PRD.md) |
| `Nana Tech.zip` | 11 maquettes mobiles : **charte graphique** de référence |
| `horizon-react-v1.0.0.zip` | Template admin : **structure et composants** du back-office |

Extraire les archives hors du dépôt (dossier temporaire) pour les consulter ; ne pas commiter leur contenu décompressé.
