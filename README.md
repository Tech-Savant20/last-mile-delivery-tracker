# LastMile IQ - Intelligent Last-Mile Delivery Management Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://last-mile-delivery-tracker-mocha-three.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.2-black?logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)

> 🚀 **Live Deployment URL**: [https://last-mile-delivery-tracker-mocha-three.vercel.app](https://last-mile-delivery-tracker-mocha-three.vercel.app)

A production-ready logistics and last-mile delivery tracking platform featuring dynamic rate calculation, intelligent spatial auto-assignment, role-based workflows (Admin, Customer, Delivery Agent), immutable tracking history, failed delivery rescheduling, and automated customer notifications.

---

## 🌟 Key Features

- ⚡ **Dynamic Rate Calculation Engine**:
  - Computes Volumetric Weight: `Volumetric Weight (kg) = (L * W * H) / 5000`.
  - Bills on Chargeable Weight: `max(Actual Weight, Volumetric Weight)`.
  - Automatic Zone Detection (`INTRA_ZONE` vs `INTER_ZONE`).
  - Admin-configurable Rate Cards for `B2B` & `B2C` (Base Weight, Base Rate, Incremental Rate per kg, Min Charge).
  - Configurable COD Surcharges (Fixed fee or Percentage with minimum floor).
  - Real-time live quotation preview on order creation.
- 📍 **Intelligent Spatial Auto-Assignment**:
  - Scored assignment based on Haversine spatial proximity, zone residency, and driver workload balancing.
  - Driver capacity limits and 1-click manual override for operations admins.
- 📜 **Immutable Tracking Audit Trail**:
  - Append-only event history with actor details, timestamps, notes, and coordinates for every status transition.
- 🔄 **Failed Delivery & Reschedule Flow**:
  - Structured failure recording -> Customer notification -> Self-service customer date picker -> Automated agent re-assignment.
- 🔔 **Multi-Channel Notification Dispatcher**:
  - Automated Email & SMS alerts dispatched for confirmation, assignment, transit, delivery, and failure events.
  - In-app Notification Center and database audit logs.
- 👤 **1-Click Role Switcher**:
  - Instant demo switcher between Admin, B2C Customer, B2B Customer, and Regional Delivery Agents without typing passwords.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack) with TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Database & ORM**: PostgreSQL via Prisma ORM 5.22
- **Authentication**: Role-based JWT session cookies (`ADMIN`, `CUSTOMER`, `AGENT`) with bcrypt password hashing

---

## 🚀 Live Demo & Accounts

**Live URL**: [https://last-mile-delivery-tracker-mocha-three.vercel.app](https://last-mile-delivery-tracker-mocha-three.vercel.app)

You can use the **1-Click Role Switcher Bar** at the top of the app or login manually with these demo credentials:

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

## 💻 Local Setup & Quick Start

### 1. Prerequisites
- Node.js 18+ (Node.js 20+ / 22+ recommended)
- npm, pnpm, or yarn

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/Tech-Savant20/last-mile-delivery-tracker.git
cd last-mile-delivery-tracker
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgres://username:password@host:5432/dbname?sslmode=require"
JWT_SECRET="super-secret-jwt-key-for-last-mile-tracker-2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Initialize Database & Seed Demo Data
```bash
# Push schema to PostgreSQL database
npm run db:push

# Seed realistic demo zones, rate cards, users, and orders
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Run Automated Test Suite
```bash
npm test
```

---

## 📐 Rate Calculation Engine Logic

### Mathematical Formulation
1. **Volumetric Weight**:
   $$\text{Volumetric Weight (kg)} = \frac{L(\text{cm}) \times W(\text{cm}) \times H(\text{cm})}{5000}$$
2. **Chargeable Weight**:
   $$\text{Chargeable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$
3. **Extra Weight**:
   $$\text{Extra Weight} = \max(0, \text{Chargeable Weight} - \text{Base Weight})$$
4. **Shipping Charge**:
   $$\text{Shipping Charge} = \max(\text{Min Charge}, \text{Base Rate} + \lceil \text{Extra Weight} \rceil \times \text{Per Extra Kg Rate})$$
5. **COD Surcharge**:
   - `PREPAID`: $0.00
   - `COD (Fixed)`: $\max(\text{Min Fee}, \text{Fee Value})$
   - `COD (Percentage)`: $\max(\text{Min Fee}, \text{Declared Value} \times \frac{\text{Fee Value}}{100})$
6. **Total Charge**:
   $$\text{Total Charge} = \text{Shipping Charge} + \text{COD Surcharge}$$

### Example Calculation
A retail customer books a **B2C COD** package from **Connaught Place (North Zone)** to **Saket (South Zone)**:
- Dimensions: 25cm x 20cm x 15cm, Actual Weight: 1.2kg, Declared Value: $80.00.
- Volumetric Weight = (25 x 20 x 15) / 5000 = 1.50kg.
- Chargeable Weight = max(1.2, 1.5) = 1.50kg (Volumetric applied).
- Route: North -> South -> `INTER_ZONE`.
- Rate Card (`B2C` `INTER_ZONE`): Base Weight: 0.5kg, Base Rate: $70.00, Extra Rate: $35.00/kg.
- Extra Weight = 1.5 - 0.5 = 1.0kg -> 1 x $35 = $35.00.
- Base Shipping = $70.00 + $35.00 = $105.00.
- COD Surcharge (`B2C` Fixed) = $30.00.
- **Total Customer Charge = $105.00 + $30.00 = $135.00**.

---

## 📡 API Endpoints Documentation

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

## 🌐 Cloud Deployment (Vercel)

1. Push project to GitHub.
2. Import repository on [Vercel](https://vercel.com).
3. In **Settings -> Environment Variables**, configure:
   - `DATABASE_URL`: PostgreSQL connection string (Prisma Postgres / Supabase / Neon)
   - `JWT_SECRET`: Secret key for authentication
   - `NEXT_PUBLIC_APP_URL`: `https://last-mile-delivery-tracker-mocha-three.vercel.app`
4. Deploy / Redeploy project.

---

## 📋 Deliverables Checklist
- [x] Complete Next.js & TypeScript Fullstack Source Code
- [x] Comprehensive README with setup guide, live deployment URL, API docs, and rate formula walkthrough
- [x] System Design Write-up (`system_design.md`) under 800 words
- [x] Zero hardcoded pricing (dynamic admin configurator)
- [x] Automated test suite (`npm test`) with 100% pass rate
