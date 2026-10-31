# Umuryango

Umuryango is a mobile-first family money and administration platform built for Rwandan and broader African family patterns.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

## Features

- Secure registration, login, email verification, password reset, Google OAuth, refresh sessions, and audit events.
- Family workspaces with invitations, kinship, role/capability permissions, settings, and membership audits.
- Personal and family income, expenses, categories, budgets, receipts, approvals, and recurring income tracking.
- Family contributions, contacts, loans, repayments, personal plans, and project tracking.
- Server-generated family report summaries based on persisted records.
- Responsive Next.js interface with dark mode, installable PWA support, and localization-ready messages.
- Savings workflows, announcements, events, document storage, report exports, notifications, and additional languages are **planned**.

## Tech stack

| Layer | Technology |
| --- | --- |
| Runtime and package manager | Bun |
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS, TypeScript, REST, Swagger/OpenAPI |
| Database | PostgreSQL with Prisma ORM |
| Validation and forms | class-validator, Zod, React Hook Form |
| Testing and quality | Jest, Supertest, Bun test, Biome |

## Prerequisites

- [Bun](https://bun.sh/) latest stable release
- PostgreSQL 16 or later
- Git
- Docker with Docker Compose, if you use the database example below

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/brunorwanda4/umuryango.git
cd umuryango
```

### 2. Install dependencies

The frontend and backend are separate Bun projects with separate lockfiles.

```bash
cd frontend
bun install
cd ../backend
bun install --ignore-scripts
cd ..
```

The backend install uses `--ignore-scripts` during initial setup because its current `postinstall` command runs Prisma before the database and environment are ready.

### 3. Configure the environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Replace all example credentials and secrets. For the Docker database below, set:

```dotenv
DATABASE_URL="postgresql://umuryango:change-me-local-only@localhost:5432/umuryango"
```

### 4. Start PostgreSQL

Create a local `compose.yaml` with:

```yaml
services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: umuryango
      POSTGRES_USER: umuryango
      POSTGRES_PASSWORD: change-me-local-only
    volumes:
      - umuryango-postgres:/var/lib/postgresql/data

volumes:
  umuryango-postgres:
```

Start it:

```bash
docker compose up -d postgres
```

### 5. Prepare and seed the database

```bash
cd backend
bunx prisma generate
bunx prisma migrate dev
bun run db:seed
cd ..
```

### 6. Start the applications

Run the API and web app in separate terminals:

```bash
cd backend
bun run dev
```

```bash
cd frontend
bun run dev
```

The web app runs at <http://localhost:4914>. The API and Swagger UI run at <http://localhost:4915>.

## Environment variables

### Backend (`backend/.env`)

| Name | Description | Example value |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma | `postgresql://umuryango:<password>@localhost:5432/umuryango` |
| `JWT_ACCESS_SECRET` | Secret used to sign access tokens | `<long-random-secret>` |
| `JWT_REFRESH_SECRET` | Refresh-token secret reserved by the environment template | `<different-long-random-secret>` |
| `JWT_ACCESS_EXPIRES_IN` | Access-token lifetime reserved by the environment template | `15m` |
| `JWT_REFRESH_EXPIRES_IN_DAYS` | Refresh-session lifetime in days | `30` |
| `FRONTEND_URL` | Web origin used for redirects and invitation links | `http://localhost:4914` |
| `PORT` | API and Swagger port | `4915` |
| `HOST` | API bind address | `0.0.0.0` |
| `CORS_ORIGINS` | Comma-separated browser origins allowed to send credentials | `http://localhost:4914,http://127.0.0.1:4914` |
| `MAIL_DEV_MODE` | Log verification/reset codes instead of sending email | `true` |
| `DEV_VERIFICATION_CODE` | Six-digit local code used only when mail dev mode is enabled | `<six-digit-code>` |
| `SMTP_HOST` | SMTP server hostname | `smtp.example.com` |
| `SMTP_PORT` | SMTP server port | `465` |
| `SMTP_SECURE` | Enable TLS for SMTP | `true` |
| `SMTP_USER` | SMTP account username | `mailer@example.com` |
| `SMTP_PASS` | SMTP account password or app password | `<smtp-password>` |
| `SMTP_FROM` | Sender address for application email | `mailer@example.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `<google-client-id>` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `<google-client-secret>` |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback handled by the API | `http://localhost:4915/api/v1/auth/google/callback` |

`GOOGLE_*` values are required by the current backend at startup. SMTP credentials are not required when `MAIL_DEV_MODE=true`.

### Frontend (`frontend/.env`)

| Name | Description | Example value |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public URL of the web application | `http://localhost:4914` |
| `NEXT_PUBLIC_API_URL` | Public API base URL | `http://localhost:4915` |
| `NEXT_PUBLIC_API_BASE_URL` | Fallback public API base URL | `http://localhost:4915` |
| `NEXT_PUBLIC_DIRECT_API_URL` | Optional direct production API URL | `https://api.example.com` |
| `API_PROXY_URL` | Server-side and rewrite target for `/api/v1/*` | `http://localhost:4915` |
| `NEXT_PUBLIC_API_PORT` | API port reserved by the environment template | `4915` |
| `VERCEL_URL` | Deployment URL supplied automatically by Vercel | `umuryango.example.com` |

## Available scripts

Run each command from the listed application directory.

| App | Command | Purpose |
| --- | --- | --- |
| Backend | `bun run dev` | Build once, then start NestJS in watch mode |
| Backend | `bun run build` | Compile the NestJS application |
| Backend | `bun run start` | Start NestJS without watch mode |
| Backend | `bun run start:prod` | Run the compiled API with Bun |
| Backend | `bun run test` | Run unit tests |
| Backend | `bun run test:e2e` | Run the Jest e2e suite |
| Backend | `bun run test:cov` | Run tests with coverage |
| Backend | `bun run lint` | Run Biome lint |
| Backend | `bun run db:seed` | Seed the configured database |
| Backend | `bun run db:migrate:deploy` | Apply pending production migrations |
| Frontend | `bun run dev` | Start Next.js development mode on port 4914 |
| Frontend | `bun run build` | Create a production Next.js build |
| Frontend | `bun run start` | Start the production Next.js server |
| Frontend | `bun run lint` | Run Biome checks |
| Frontend | `bun run i18n` | Run the translation maintenance CLI |

## Project structure

```text
umuryango/
├── backend/                 # NestJS API (umuryango-backend)
│   ├── prisma/
│   │   ├── schema.prisma    # PostgreSQL models and enums
│   │   ├── migrations/      # Versioned database migrations
│   │   └── seed.ts          # Development seed data
│   ├── src/                 # Domain modules, controllers, and services
│   └── test/                # API e2e tests
├── frontend/                # Next.js App Router web app (umuryango-frontend)
│   ├── public/              # PWA manifest, service worker, and assets
│   └── src/                 # Routes, components, hooks, messages, and API client
├── context/                 # Product and engineering context
└── docs/                    # Additional project documentation
```

There is no `packages/` shared-code workspace in the current repository.

## Database

The PostgreSQL schema is defined in `backend/prisma/schema.prisma`. It currently keeps its enums and models in one schema file, covering users and sessions, families and membership, audit events, contributions, projects, contacts, transactions, receipts, budgets, loans, and personal plans. Migrations live in `backend/prisma/migrations/`.

Create a migration after changing the schema:

```bash
cd backend
bunx prisma migrate dev --name describe_your_change
```

Apply committed migrations in production:

```bash
cd backend
bun run db:migrate:deploy
```

Regenerate the Prisma client when needed:

```bash
cd backend
bunx prisma generate
```

## API documentation

The backend uses `@nestjs/swagger` and serves Swagger UI at:

- UI: <http://localhost:4915/>
- OpenAPI JSON: <http://localhost:4915/docs-json>
- OpenAPI YAML: <http://localhost:4915/docs-yaml>

Application endpoints are versioned under `/api/v1`.

## Testing

Run backend unit, e2e, or coverage tests:

```bash
cd backend
bun run test
bun run test:e2e
bun run test:cov
```

The frontend has Bun-compatible test files but no `test` package script. Run them directly with:

```bash
cd frontend
bun test
```

## Deployment

Set production environment variables, provision PostgreSQL, then apply migrations before starting the applications.

```bash
cd backend
bun install --frozen-lockfile --ignore-scripts
bunx prisma generate
bun run db:migrate:deploy
bun run build
bun run start:prod
```

```bash
cd frontend
bun install --frozen-lockfile
bun run build
bun run start
```

Terminate TLS at a reverse proxy or hosting platform, keep the API and database on private networks where possible, and configure `FRONTEND_URL`, `CORS_ORIGINS`, cookie security, OAuth callbacks, and SMTP for the production domains.

## Contributing

Contributions are welcome.

1. Fork the repository and clone your fork.
2. Create a focused branch such as `feat/family-savings`, `fix/expense-approval`, or `docs/setup`.
3. Make a small, tested change that follows the existing family authorization and audit rules.
4. Use Conventional Commits, for example `feat(money): add savings goal`.
5. Run the relevant build, lint, and test commands.
6. Open a pull request with the problem, solution, verification, and any migration or environment changes.

Never commit `.env` files, production data, or real credentials.

## License

Umuryango is open source under the [GNU Affero General Public License v3.0](LICENSE). If you distribute a modified version or make it available over a network, the AGPL requires you to provide the corresponding source code under the same license.

## Troubleshooting

### A port is already in use

The defaults are `4914` for the web app, `4915` for the API, and `5432` for PostgreSQL. Stop the conflicting process or update the relevant environment variable and CORS configuration.

### Prisma Client is missing or stale

```bash
cd backend
bunx prisma generate
```

### The API cannot connect to PostgreSQL

Confirm the container is healthy with `docker compose ps`, verify `DATABASE_URL`, and make sure migrations were applied from `backend/`.

### Browser requests fail with CORS errors

Ensure `FRONTEND_URL` and `CORS_ORIGINS` in `backend/.env` exactly include the web origin, including its scheme and port. Restart the API after changing them.

### The backend fails during install or startup

For first-time installation, use `bun install --ignore-scripts`, start PostgreSQL, configure `backend/.env`, and then run Prisma generate and migrations explicitly. Also provide the required `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` values.
