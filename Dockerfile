# syntax=docker/dockerfile:1
FROM node:20-slim AS build
WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package*.json ./
RUN npm ci

COPY . .

FROM build AS migrate
CMD ["npm", "run", "db:migrate"]

FROM build AS service-build
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=service-build /app/package*.json ./
COPY --from=service-build /app/node_modules ./node_modules
COPY --from=service-build /app/dist ./dist

EXPOSE 8080
CMD ["npm", "run", "start"]
