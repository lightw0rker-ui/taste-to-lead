# taste-to-lead

## Project structure

This is a **single Node.js app repository** with a split code layout:

- `client/`: React + Vite + Tailwind frontend
- `server/`: Express API + server bootstrap
- `shared/`: schema/types used by both sides
- `script/build.ts`: production build script that compiles both frontend and backend into `dist/`

For production, the app follows **Option A**: one Cloud Run service. Express serves the Vite static build from `dist/public` and also serves `/api` routes.

## Deploy to Cloud Run (via GitHub + Cloud Build)

### What is implemented

- `cloudbuild.yaml` builds and deploys one Cloud Run service.
- Docker image is built from the included `Dockerfile`.
- Cloud Build runs DB migrations first (`npm run db:migrate`) using `DATABASE_URL` from Secret Manager.

### Required environment variables / secrets

Create these in Secret Manager and grant your Cloud Build + Cloud Run service accounts access:

- `DATABASE_URL` (Postgres connection string, include SSL params as required by your provider)
- `SESSION_SECRET`
- `GOOGLE_AI_API_KEY`
- `RESEND_API_KEY`

If you use additional integrations in code (for example Google Cloud credentials/config for Vertex or Storage), add them as secrets and pass with `--set-secrets`.

### One-time setup

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

gcloud artifacts repositories create cloud-run-source-deploy \
  --repository-format=docker \
  --location=us-central1
```

Create your GitHub trigger pointing to this repository and `cloudbuild.yaml`.

### Drizzle migration strategy (production-safe)

- Migrations run in Cloud Build before container build/deploy.
- Command: `npm run db:migrate` (Drizzle `push`) against `DATABASE_URL` from Secret Manager.
- If migration fails, deploy is blocked.

Recommended team workflow:

1. Update `shared/schema.ts`.
2. Validate migration in staging first.
3. Merge to main; Cloud Build trigger runs migration + deploy.

## Runtime behavior required by Cloud Run

Implemented in server bootstrap:

- listens on `process.env.PORT` (fallback `8080` locally)
- binds `0.0.0.0`
- exposes fast `GET /healthz` returning 200 JSON

## Playwright note

Playwright is used by scraping code, but container builds skip downloading browser binaries via `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`.

This keeps deploy lightweight and avoids Cloud Run build failures due to browser installs. If you need browser-backed scraping in production, run that workload in a separate worker/job image with Playwright runtime dependencies.

## How to test locally with Docker

```bash
docker build -t app .

docker run --rm -e PORT=8080 -p 8080:8080 app

curl http://localhost:8080/healthz
```

## Deployment checklist

- [ ] Artifact Registry repository exists (`cloud-run-source-deploy` in target region)
- [ ] Secret Manager secrets created (`DATABASE_URL`, `SESSION_SECRET`, `GOOGLE_AI_API_KEY`, `RESEND_API_KEY`)
- [ ] Cloud Build service account has Secret Manager access
- [ ] Cloud Run runtime service account has Secret Manager access
- [ ] Cloud Build GitHub trigger configured for `cloudbuild.yaml`
- [ ] First build succeeds and `/healthz` returns `200`
- [ ] Confirm app + API routes from deployed URL

## Cloud Run recommendations

- **Auth**: use `--allow-unauthenticated` only for public web app traffic; restrict admin/internal endpoints via app auth and/or separate internal service.
- **Concurrency**: start with `80` (good default for Node + mixed API/static), tune down if latency spikes under CPU pressure.
- **Min instances**: `0` for lowest cost; use `1` if cold starts are unacceptable for your user experience.
- **Max instances**: set a ceiling (example `20`) to protect Postgres from connection storms.
