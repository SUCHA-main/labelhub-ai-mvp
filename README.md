# LabelHub AI MVP

LabelHub AI MVP is a runnable prototype for an AI-assisted data annotation platform. It demonstrates a simple workflow from task creation, schema-driven annotation, AI pre-review, human review, and dashboard tracking.

## Features

- Role-based demo login: `admin`, `annotator`, and `reviewer`
- Admin task creation with dynamic form schema
- Annotator workflow with generated annotation forms
- Mock AI pre-review with risk level, confidence, possible issue, and suggestion
- Reviewer approval/rejection with comments
- Dashboard metrics for task status, pass rate, AI risk count, and pending workload

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Storage: JSON file
- Deployment: Docker, docker-compose, Nginx

## Local Development

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` requests to `http://localhost:4000`.

## Docker

```bash
docker compose up --build
```

Open `http://localhost:5173`.

## Demo Accounts

No password is required. Use username `demo` and select one of the roles:

| Role | Purpose |
| --- | --- |
| admin | Create tasks and view dashboard |
| annotator | Submit annotation results |
| reviewer | Review AI pre-check results and approve or reject tasks |

## Demo Flow

1. Log in as `admin` and review dashboard metrics.
2. Create a task with a dynamic schema.
3. Log in as `annotator` and submit an annotation.
4. Log in as `reviewer` and inspect the AI pre-review card.
5. Approve or reject the task and observe updated dashboard metrics.

## Screenshots

Screenshots can be placed under `docs/images/`.

## More Docs

- Chinese README: `README_CN.md`
- Demo script: `docs/demo-script.md`
- Project summary: `docs/project-summary.md`
