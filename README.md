# LastMile IQ - Intelligent Last-Mile Delivery Management Platform

A production-ready logistics and last-mile delivery tracking platform featuring dynamic rate calculation, intelligent spatial auto-assignment, role-based workflows (Admin, Customer, Delivery Agent), immutable tracking history, failed delivery rescheduling, and automated customer notifications.

---

## Key Features

- ? **Dynamic Rate Calculation Engine**:
  - Computes Volumetric Weight $\frac{L \times B \times H}{5000}\text{ kg}$ vs Actual Weight.
  - Bills on $\max(\text{Actual Weight}, \text{Volumetric Weight})$.
  - Automatic Zone Detection (`INTRA_ZONE` vs `INTER_ZONE`).
  - Admin-configurable Rate Cards for `B2B` & `B2C` (Base Weight, Base Rate, Incremental Rate per kg, Min Charge).
  - Configurable COD Surcharges (Fixed fee or Percentage with minimum).
  - Real-time live quotation preview on order creation.
- ?? **Intelligent Auto-Assignment**:
  - Scored assignment based on Haversine spatial proximity, zone residency, and driver workload balancing.
  - Driver capacity limits and 1-click manual override for operations admins.
- ??? **Immutable Tracking Audit Trail**:
  - Append-only event history with actor details, timestamps, notes, and locations for every status transition.
- ?? **Failed Delivery & Reschedule Flow**:
  - Structured failure recording $\rightarrow$ Customer notification $\rightarrow$ Self-service customer date picker $\rightarrow$ Automated agent re-assignment.
- ?? **Multi-Channel Notification Dispatcher**:
  - Automated Email & SMS alerts dispatched for confirmation, assignment, transit, delivery, and failure events.
  - In-app Notification Center and database audit logs.
- ?? **1-Click Role Switcher**:
  - Instant demo switcher between Admin, B2C Customer, B2B Customer, and Regional Delivery Agents.

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Database & ORM**: SQLite (via Prisma ORM 5.22 LTS) — Zero-friction local startup, 1-click switchable to PostgreSQL for cloud deployment.
- **Authentication**: Role-based JWT session cookies (`ADMIN`, `CUSTOMER`, `AGENT`).

---

## Quick Start & Setup Guide

### 1. Prerequisites
- Node.js 18+ (Node.js 20+ / 24+ supported)
- npm or pnpm

### 2. Clone & Install Dependencies
```bash
git clone <repository-url>
cd last-mile-delivery-tracker
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-jwt-key-for-last-mile-tracker-2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Initialize Database & Seed Demo Data
```bash
# Push schema to SQLite
npx prisma db push

# Seed realistic demo zones, rate cards, users, and orders
npx tsx prisma/seed.ts
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Accounts (1-Click Switcher or Manual Login)

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Admin** | `admin@tracker.com` | `password123` | Full Operations & Rate Card Control |
| **Customer (B2C)** | `alice@customer.com` | `password123` | Retail consumer placing retail parcels |
| **Customer (B2B)** | `logistics@techcorp.com` | `password123` | Enterprise bulk freight logistics |
| **Agent (North)** | `agent.john@tracker.com` | `password123` | Delivery rider stationed in North Zone |
| **Agent (South)** | `agent.sarah@tracker.com` | `password123` | Delivery rider stationed in South Zone |
| **Agent (East)** | `agent.mike@tracker.com` | `password123` | Delivery rider stationed in East Zone |

> **Tip**: You can also use the **1-Click Role Switcher Bar** at the top of the app to switch personas instantly without typing passwords!

---

## Rate Calculation Engine Logic

### Mathematical Formulation
1. **Volumetric Weight**:
   $$\text{Volumetric Weight (kg)} = \frac{L(\text{cm}) \times W(\text{cm}) \times H(\text{cm})}{5000}$$
2. **Chargeable Weight**:
   $$\text{Chargeable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$
3. **Extra Weight**:
   $$\text{Extra Weight} = \max(0, \text{Chargeable Weight} - \text{Base Weight})$$
4. **Shipping Charge**:
   $$\text{Shipping Charge} = \max\left(\text{Min Charge}, \text{Base Rate} + \lceil \text{Extra Weight} \rceil \times \text{Per Extra Kg Rate}\right)$$
5. **COD Surcharge**:
   - `PREPAID`: $\$0.00$
   - `COD (Fixed)`: $\max(\text{Min Fee}, \text{Fee Value})$
   - `COD (Percentage)`: $\max\left(\text{Min Fee}, \text{Declared Value} \times \frac{\text{Fee Value}}{100}\right)$
6. **Total Charge**:
   $$\text{Total Charge} = \text{Shipping Charge} + \text{COD Surcharge}$$

### Example Calculation
A retail customer books a **B2C COD** package from **Connaught Place (North Zone)** to **Saket (South Zone)**:
- Dimensions: $25\text{cm} \times 20\text{cm} \times 15\text{cm}$, Actual Weight: $1.2\text{kg}$, Declared Value: $\$80.00$.
- Volumetric Weight = $\frac{25 \times 20 \times 15}{5000} = 1.50\text{kg}$.
- Chargeable Weight = $\max(1.2, 1.5) = 1.50\text{kg}$ (Volumetric applied).
- Route: North $\rightarrow$ South $\rightarrow$ `INTER_ZONE`.
- Rate Card (`B2C` `INTER_ZONE`): Base Weight: $0.5\text{kg}$, Base Rate: $\$70.00$, Extra Rate: $\$35.00/\text{kg}$.
- Extra Weight = $1.5 - 0.5 = 1.0\text{kg} \rightarrow 1 \times \$35 = \$35.00$.
- Base Shipping = $\$70.00 + \$35.00 = \$105.00$.
- COD Surcharge (`B2C` Fixed) = $\$30.00$.
- **Total Customer Charge = $\$105.00 + \$30.00 = \$135.00$**.

---

## API Endpoints Documentation

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/login` | User login (returns JWT cookie & token) | Public |
| `POST` | `/api/auth/register` | Customer / Agent registration | Public |
| `GET`  | `/api/auth/me` | Current session verification | Cookie / Bearer |
| `POST` | `/api/auth/demo-login` | 1-Click Persona switcher | Public |
| `POST` | `/api/rates/calculate` | Real-time rate calculation engine | Public |
| `GET`  | `/api/rates/configs` | Get active Rate Cards & COD Surcharges | Public |
| `PUT`  | `/api/rates/configs` | Update Rate Cards & Surcharges in DB | Admin |
| `GET`  | `/api/zones` | List all zones and area mappings | Public |
| `POST` | `/api/zones` | Create new operational zone | Admin |
| `POST` | `/api/zones/areas` | Assign neighborhood/pincode to zone | Admin |
| `GET`  | `/api/orders` | List orders (with search, status, zone filters) | Authenticated |
| `POST` | `/api/orders` | Book a new shipment order | Customer / Admin |
| `GET`  | `/api/orders/[id]` | Full order details & immutable history | Public / Auth |
| `POST` | `/api/orders/[id]/status` | Advance status (Picked Up, Delivered, Failed) | Agent / Admin |
| `POST` | `/api/orders/[id]/assign` | Auto or manual agent assignment | Admin |
| `POST` | `/api/orders/[id]/reschedule`| Customer delivery date rescheduling | Customer / Admin |
| `GET`  | `/api/agents` | View delivery workforce fleet & workloads | Admin |
| `PUT`  | `/api/agents` | Toggle agent availability / location | Agent / Admin |
| `GET`  | `/api/notifications` | View system Email & SMS alert logs | Authenticated |
| `GET`  | `/api/analytics` | Logistics KPIs & SLA metrics | Admin |

---

## Deployment to Cloud (Vercel / Render / Railway)

### Deploying to Vercel:
1. Push project to your GitHub repository.
2. Import repository in [Vercel](https://vercel.com).
3. Set environment variable `DATABASE_URL` (for cloud PostgreSQL e.g., Supabase / Neon / Railway PostgreSQL, or use Vercel Postgres / SQLite file for serverless).
4. Run `npx prisma db push && npx tsx prisma/seed.ts` as build command or postinstall script.

---

## Deliverables Checklist
- [x] Complete TypeScript Fullstack Source Code
- [x] Comprehensive README with setup guide, API docs, and rate formula walkthrough
- [x] System Design Write-up (`system_design.md`) under 800 words
- [x] Zero hardcoded pricing (dynamic admin configurator)
- [x] Automated test suite (`npx tsx tests/rate-engine.test.ts`) with 100% pass rate
