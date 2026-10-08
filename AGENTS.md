# AGENTS.md — Agents spécialisés Kovoit (back-office)

Agents Claude Code du projet. Leurs définitions exécutables sont dans [.claude/agents/](.claude/agents/). Tous obéissent à [CLAUDE.md](CLAUDE.md) (méthode) et à [PRD.md](PRD.md) (métier).

| Agent | Rôle | Quand l'utiliser | Outils |
|---|---|---|---|
| `prd-guardian` | Vérifie qu'une fonctionnalité ou un diff respecte le PRD : statuts, droits d'accès, paramètres, hors MVP | Avant de démarrer une feature, et en revue avant de committer | Lecture seule |
| `admin-ui-builder` | Construit écrans et composants à partir d'Horizon, en TypeScript, avec la charte Nana Tech | Nouvelle page, nouveau composant UI, re-skin | Lecture + écriture |
| `api-integrator` | Client axios, DTO typés, hooks TanStack Query, mocks MSW, contrat avec l'API DRF | Brancher un écran sur l'API, définir ou mettre à jour un contrat | Lecture + écriture |
| `kyc-security-reviewer` | Audite authentification, gestion des tokens, pièces KYC, code de départ, fuites de données personnelles | Toute modification touchant à l'auth, au KYC, aux utilisateurs ou aux réservations | Lecture seule |
| `dashboard-analyst` | Indicateurs et graphiques du tableau de bord (ApexCharts), choix de visualisation | Tableau de bord, statistiques | Lecture + écriture |
| `qa-tester` | Tests Vitest, Testing Library et MSW ; scénarios de la machine à états et des actions admin | Après chaque feature, ou pour reproduire un bug | Lecture + écriture + exécution |
| `docs-keeper` | Tient à jour CLAUDE.md, PRD.md (sections techniques) et AGENTS.md | Après une décision ou un changement d'architecture | Lecture + écriture (docs) |

## Flux recommandé pour une feature

1. `prd-guardian` extrait les exigences et critères d'acceptation de l'écran.
2. `api-integrator` définit les types, les hooks et les mocks MSW.
3. `admin-ui-builder` construit la page avec les composants Horizon re-skinnés.
4. `qa-tester` écrit les tests et les lance.
5. `kyc-security-reviewer` audite la feature si elle touche des données sensibles.
6. `docs-keeper` reporte les décisions dans la documentation.

## Règles communes

- Ne jamais implémenter une règle métier côté front (prix, fiabilité, transitions de statut).
- Ne jamais coder en dur une valeur qui figure dans la table `parametres`.
- Ne jamais afficher ni logger `code_depart_hash`, les codes OTP ou les URL de pièces KYC.
- En cas d'ambiguïté ou d'écart maquette / PRD : s'arrêter et signaler, plutôt qu'inventer.
