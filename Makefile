# Makefile du back-office Kovoit (React + Vite) : raccourcis des scripts npm de package.json,
# qui restent la référence. L'URL de l'API vient du .env (VITE_API_URL, voir .env.example).

.DEFAULT_GOAL := aide
.PHONY: aide installer env dev mocks build apercu tests lint format

aide: ## Liste les cibles disponibles
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*## "} {printf "  %-15s %s\n", $$1, $$2}'

installer: env ## Installe les dépendances exactes du verrou (npm ci)
	npm ci

env: ## Crée le .env depuis .env.example s'il n'existe pas (ne l'écrase jamais)
	@if [ -f .env ]; then echo ".env déjà présent : conservé."; \
	else cp .env.example .env && echo ".env créé depuis .env.example."; fi

dev: ## Lance le back-office sur http://localhost:5173 (backend sur le port 8000)
	npm run dev

mocks: ## Lance le back-office avec les réponses simulées (MSW), sans backend
	VITE_USE_MOCKS=true npm run dev

build: ## Construit la version de production (dist/)
	npm run build

apercu: ## Sert la version construite (dist/)
	npm run preview

tests: ## Lance les tests (Vitest)
	npm test

lint: ## Vérifie le code (ESLint)
	npm run lint

format: ## Formate le code (Prettier)
	npm run format
