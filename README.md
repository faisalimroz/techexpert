# TechExpert Energy

**Clean Energy. Smart Technology. A Brighter Tomorrow.**

Full-stack solar, storage, smart-energy and industrial-IoT platform.
MongoDB · Express.js · React (Next.js App Router) · Node.js · TypeScript.

```
techexpert-energy/
├── apps/
│   ├── web/            Next.js 15 + React 19, Tailwind, Framer Motion, Three.js, Recharts, RHF + Zod
│   └── api/            Express 4 + Mongoose 8, JWT (HTTP-only cookie), RBAC, Socket.IO
├── packages/
│   ├── types/          Shared domain types, roles & permission map
│   ├── validation/     Shared Zod schemas (forms + API)
│   ├── solar-engine/   Solar sizing/savings estimator + EMS demo simulator (pure, tested)
│   └── ui/             shadcn-style primitives (cn, cva button variants)
├── infrastructure/
│   ├── docker/         api.Dockerfile, web.Dockerfile
│   └── nginx/          reverse proxy, rate limit, security headers, WebSocket upgrade
├── docs/architecture.md
├── docker-compose.yml  mongo, redis, api, web, nginx
└── .github/workflows/ci.yml
```

## Status — Phase 1 delivered

| Phase | Scope | State |
|---|---|---|
| 1 | Design system, homepage, responsive layout, animations | **Done** |
| 2 | Inner pages, product catalog & detail pages | Route shells live, content next |
| 3 | Express API, MongoDB models, API integration | **Foundation done**: 15 models, auth, RBAC, CRUD, leads, calculator, EMS demo |
| 4 | Admin dashboard, auth UI, CMS | API ready; UI next |
| 5 | Calculator, quotation & inquiry flows | Homepage calculator + inquiry form wired to API |
| 6 | EMS dashboard & IoT architecture | Homepage demo (simulated, labelled) + Socket.IO channel |
| 7 | Security testing, SEO, Docker, deployment docs | Docker/Nginx/CI scaffolded; hardening next |

## Local development

Requirements: Node 20.11+ (22 LTS recommended), MongoDB 7 (or `docker compose up mongo redis`).

```bash
cp .env.example .env          # set JWT_SECRET (48+ random bytes) and MONGODB_URI
npm install
npm run seed                  # roles, first super admin, categories, settings, demo projects
npm run dev:api               # http://localhost:4000/api/health
npm run dev:web               # http://localhost:3000
```

Tests and checks:

```bash
npm run typecheck
npm test                      # solar-engine unit tests + API tests (validation, RBAC, CSRF, NoSQL injection)
```

Static design preview (no API needed):

```bash
npm run export:preview        # → apps/web/out
```

## Production (single server)

```bash
cp .env.example .env          # production values; NODE_ENV=production; real JWT_SECRET
docker compose up -d --build
docker compose exec api node dist/seed.js   # first run only
```

Then put TLS in front: mount certificates into `infrastructure/nginx/certs`, enable the 443 server block and the HTTP→HTTPS redirect in `nginx.conf`.

Backups: schedule `mongodump --archive --gzip` from the `mongo` container to off-site storage (daily, keep 30), and test a restore monthly.

## API overview (`/api`)

| Route | Public | Staff (permission) |
|---|---|---|
| `GET /health` | ✓ | |
| `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | login | any signed-in |
| `/products`, `/categories`, `/brands`, `/solutions`, `/projects`, `/blogs` | `GET` published, `GET /:slug` | `GET /admin/all`, `POST`, `PATCH /:id`, `DELETE /:id` (`products:write` / `catalog:write` / `content:write`) |
| `POST /inquiries` | ✓ rate-limited, honeypot | `GET`, `PATCH /:id` (`leads:*`) |
| `/quotations` | | `GET`, `POST` (`leads:*`) |
| `POST /solar-calculator` | ✓ saves to MongoDB | `GET` review list (`leads:read`) |
| `GET /energy-monitoring/demo/snapshot`, `/demo/day` | ✓ always `simulated: true` | |
| `GET /settings/public` | ✓ | `PUT /settings/:key` (`settings:write`) |
| `GET /users`, `POST /users`, `PATCH /users/:id` | | `users:manage` (super admin) |
| `GET /audit-logs` | | `audit:read` |

Socket.IO namespace `/ems` emits `snapshot` every 5 s (simulated until devices are connected).

## Security in place

HTTP-only `SameSite=Strict` JWT cookie · double-submit CSRF token for cookie-auth writes · bcrypt (cost 12) · lockout after 5 failed logins · backend RBAC on every write · Zod validation on every body/query · `express-mongo-sanitize` · Helmet headers · CORS allow-list · rate limiting (app + Nginx) · audit log · secrets only from environment · no tokens in URLs.

## Content rules baked in

* No invented partnerships, certifications, prices or specs. Product specs carry `verified: false` until backed by a datasheet; brands carry `authorizedPartner: false` until an agreement exists.
* Demo projects are stored with `isDemo: true` and labelled on the site.
* EMS data is labelled simulated everywhere until real devices report.
* Calculator assumptions live in `Site Settings → calculator.assumptions` and are shown beside every result.

## Before launch — things to confirm

* Contact email, phone, WhatsApp number, office address (placeholders now).
* Calculator cost per kWp for on-grid / hybrid / off-grid (placeholders: ৳60k / ৳85k / ৳95k).
* Photography rights for the hero, C&I and residential images. The residential kit photo shows a manufacturer’s logo; use it only with that brand’s permission or replace it.
