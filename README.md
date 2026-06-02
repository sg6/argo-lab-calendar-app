# K8s Argo Labs

Full-stack calendar application with a NestJS backend, Prisma/Postgres persistence, and a Vite frontend.

## Stack

- Backend: NestJS, Prisma, PostgreSQL
- Frontend: Vite, TypeScript
- Local services: Docker Compose
- Container publishing: GitHub Actions to GitHub Container Registry

## Project Structure

```text
.
├── backend/              # NestJS API and Prisma schema
├── frontend/             # Vite frontend
├── devops/               # Deployment/devops files
├── docker-compose.yaml   # Local development stack
└── .github/workflows/    # GitHub Actions workflows
```

## Requirements

- Docker and Docker Compose
- Node.js 24 if running the apps outside Docker
- npm

## Local Development

Start the full local stack:

```bash
docker compose up
```

The services are available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:9100
- PostgreSQL: localhost:5432
- Adminer: http://localhost:9180

The local compose setup installs dependencies in the containers, pushes the Prisma schema to Postgres, and starts both apps in development mode.

## Backend

Run from `backend/`:

```bash
npm install
npm run prisma:generate
npm run build
npm run start:dev
```

Useful scripts:

```bash
npm run test
npm run test:e2e
npm run lint
```

Required environment variables:

```bash
DATABASE_URL=postgresql://calendar:calendar@localhost:5432/calendar?schema=public
JWT_SECRET=local-calendar-secret
FRONTEND_ORIGIN=http://localhost:5173
PORT=3000
```

## Frontend

Run from `frontend/`:

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

The frontend reads the backend URL from:

```bash
VITE_API_URL=http://localhost:9100
```

## API Overview

Authentication:

- `POST /auth/register`
- `POST /auth/login`

Events, authenticated with a bearer token:

- `GET /events`
- `POST /events`
- `DELETE /events/:id`

## Container Images

Both apps include Dockerfiles:

- `backend/Dockerfile`
- `frontend/Dockerfile`

Build locally:

```bash
docker build -t k8s-argo-labs-backend ./backend
docker build -t k8s-argo-labs-frontend ./frontend
```

The backend image runs the compiled NestJS app on port `3000`. The frontend image serves the Vite build with nginx on port `80`.

## GitHub Container Publishing

The workflow at `.github/workflows/publish-containers.yml` publishes images to GitHub Container Registry.

It runs only on pushes to:

- `main`
- `dev`

Every other branch is ignored.

The workflow detects changed paths:

- Changes under `backend/` build and publish only the backend image.
- Changes under `frontend/` build and publish only the frontend image.
- If both change, both images are published.

Image tags use the version from each app's `package.json`:

```text
ghcr.io/<owner>/<repo>-backend:dev-<backend-version>
ghcr.io/<owner>/<repo>-frontend:dev-<frontend-version>
```

For example:

```text
ghcr.io/<owner>/<repo>-backend:dev-0.0.1
ghcr.io/<owner>/<repo>-frontend:dev-0.0.0
```

## GitOps Deployment

Kubernetes manifests live in:

```text
devops/k8s_manifests
```

The layout is built for Argo CD:

- `root-application.yaml` bootstraps the app-of-apps setup.
- `applications/cnpg-operator.yaml` installs the CloudNativePG operator from the official Helm chart.
- `applications/calendar-app.yaml` syncs the calendar application manifests.
- `calendar-app/` contains the namespace, CNPG database cluster, backend, frontend, services, and ingress.

Before using it, replace these placeholders:

- `https://github.com/sg6/argo-lab-calendar-app.git`
- `ghcr.io/sg6/argo-lab-calendar-app-backend:dev-0.0.1`
- `ghcr.io/sg6/argo-lab-calendar-app-frontend:dev-0.0.0`
- `calendar.example.com`
- the secret values in `calendar-app/*secret.yaml`

## Database

Prisma schema location:

```text
backend/prisma/schema.prisma
```

The local database uses:

```text
database: calendar
user: calendar
password: calendar
```

## Notes

- `backend/dist` and `frontend/dist` are generated build outputs.
- Use `docker compose down -v` only when you intentionally want to remove the local Postgres volume.
