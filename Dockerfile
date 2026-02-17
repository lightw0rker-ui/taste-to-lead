# syntax=docker/dockerfile:1
FROM node:20-slim AS deps
WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM build AS migrate
CMD ["npm", "run", "db:migrate"]

FROM build AS prod-deps
RUN npm prune --omit=dev

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /app/package*.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["npm", "run", "start"]
