# Architecture

```
Visitor / Customer / Administrator
            │  HTTPS
            ▼
        Nginx (TLS, rate limit, headers)
     ┌──────┴────────────┐
     ▼                   ▼
Next.js web (React)   Express API ──► MongoDB (documents + time-series)
 SSR / SSG / ISR        │  ▲            ▲
                        │  └ Redis (cache, rate-limit store) 
                        ├─► Object storage (S3 / Cloudinary) for media & datasheets
                        ├─► SMTP / transactional email
                        └─► Socket.IO /ems (live dashboards)
```

## Rendering strategy

| Page | Mode | Why |
|---|---|---|
| Home | ISR 5 min | catalog & posts change rarely; fast first paint |
| Products list / detail | ISR + on-demand revalidate on publish | SEO-critical, admin-managed |
| Projects, Insights | ISR | SEO, admin-managed |
| Calculator, Quotation, Contact | Static shell + client forms | interactive |
| EMS dashboards | Client, Socket.IO | live data |
| Admin | Client, cookie auth, `noindex` | private |

## IoT / EMS data path

```
IoT sensors / smart meters / inverters / BESS
        ↓
Industrial IoT gateway (edge buffer)
        ↓  MQTT · Modbus TCP/RTU · vendor cloud API
Node.js ingestion service (validate, scale, alarm rules)
        ↓
MongoDB time-series `energyreadings` (granularity: minutes, 3-year TTL)
   + roll-up collections (15 min, daily, monthly)
        ↓
Express API (history, aggregates)  +  Socket.IO (live)
        ↓
Next.js energy dashboards
```

`IotDevice` records protocol + address per device. Until a site is connected, all endpoints return the shared simulator from `@te/solar-engine` with `simulated: true`.

## Data model (Mongoose)

Users · Roles · Products · Categories · Brands · Solutions · Projects · BlogPosts · Inquiries · Quotations · SolarCalculations · IotDevices · EnergyReadings (time-series) · SiteSettings · AuditLogs.

Key indexes: `Product {status, category, createdAt}`, text index on name/model/summary, unique slugs on all content, `Inquiry {status}`, `{createdAt:-1}` on leads and audit logs.

## RBAC

| Permission | Super Admin | Admin | Content Editor | Sales Manager |
|---|:-:|:-:|:-:|:-:|
| products / catalog / content write | ✓ | ✓ | ✓ | |
| leads read / write | ✓ | ✓ | | ✓ |
| settings write | ✓ | ✓ | | |
| audit read | ✓ | ✓ | | |
| users manage | ✓ | | | |

Defined once in `packages/types` and enforced by `can()` middleware in the API.
