# Kovoit · Back-office administrateur

Interface web d'administration de Kovoit (covoiturage urbain à Lomé) : validation KYC, utilisateurs, trajets, réservations, signalements, paramètres.

React 19 · TypeScript · Vite · Tailwind CSS 3 (template Horizon UI, charte Nana Tech) · TanStack Query · MSW.

## Démarrer

```bash
npm install
cp .env.example .env.local   # VITE_USE_MOCKS=true pour travailler sans backend
npm run dev
```

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Vérification TypeScript + build de production |
| `npm run test` | Tests Vitest |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

Documentation : [PRD.md](PRD.md) (métier), [CLAUDE.md](CLAUDE.md) (conventions), [AGENTS.md](AGENTS.md) (agents).
