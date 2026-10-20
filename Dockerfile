# Front Kovoit : construit avec Vite, servi par nginx.
# L'URL de l'API est figée dans le JavaScript au moment du build :
#   docker build --build-arg VITE_API_URL=https://api.kovoittg.com/api/v1 -t kovoit-front .

# ── Construction ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Manifestes d'abord : la couche npm ci reste en cache tant qu'ils ne changent pas.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Variables lues par Vite au build (jamais au démarrage du conteneur).
ARG VITE_API_URL
ARG VITE_USE_MOCKS=false
ARG VITE_FEATURE_WALLET=false
ENV VITE_API_URL=$VITE_API_URL \
    VITE_USE_MOCKS=$VITE_USE_MOCKS \
    VITE_FEATURE_WALLET=$VITE_FEATURE_WALLET
RUN test -n "$VITE_API_URL" || (echo "VITE_API_URL manquant : --build-arg VITE_API_URL=..." && exit 1)
RUN npm run build

# ── Service ──────────────────────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
