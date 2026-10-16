# SupplyChain Sentinel

### Supply Chain Disruption Early-Warning System

**SupplyChain Sentinel** is a full-stack supply chain operations platform designed to help teams monitor shipments, track inventory health, identify operational risks, evaluate supplier reliability, and review replenishment recommendations from a centralized dashboard.

It combines a React-based operational interface with a Spring Boot REST API and PostgreSQL database. Its scenario simulator helps users explore potential disruptions without modifying live records.

---

## Overview

Supply chain disruptions can develop when shipments are delayed, inventory falls below safe levels, or supplier performance becomes unreliable. SupplyChain Sentinel brings these operational signals together so users can review potential issues and evaluate their impact.

### Key Features

- **Operational Dashboard** — Review supply chain metrics, shipment activity, inventory health, and risk signals.
- **Shipment Management** — View shipment records, routes, delivery expectations, and shipment statuses.
- **Inventory Monitoring** — Inspect stock levels, reorder points, warehouse information, and stock coverage.
- **Risk Intelligence** — Review shipment-delay and inventory-risk records surfaced by the backend.
- **Supplier Reliability** — Examine supplier risk scores and available delivery-performance indicators.
- **Replenishment Recommendations** — Review recommended order quantities, estimated costs, and inventory coverage considerations.
- **Network Explorer** — Explore available shipment routes, supplier exposure, and warehouse inventory information.
- **What-if Disruption Simulator** — Adjust supplier lead-time delays and demand increases to evaluate estimated inventory exposure without changing live data.
- **Notifications** — Access open risk signals through the in-app notification panel.
- **CSV Export and Printable Reports** — Export supported operational tables and print reports.
- **Responsive Interface** — Use the application across desktop, tablet, and mobile-sized screens.
- **Dark and Light Themes** — Switch between the Carbon & Crimson dark interface and its light theme.

> **Simulation disclaimer:** Simulator results are estimates based on available records and selected scenario settings. They are not guaranteed forecasts, and the simulator does not create purchase orders or modify live records.

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Recharts
- Lucide React
- Motion

### Backend

- Java 21
- Spring Boot
- Spring Data JPA
- Spring Web / REST APIs
- Maven
- Flyway database migrations

### Database and Development Tools

- PostgreSQL
- Docker and Docker Compose
- Git and GitHub

---

## Architecture

```text
┌──────────────────────────────────────┐
│          React + TypeScript          │
│        Vite · Responsive UI           │
└──────────────────┬───────────────────┘
                   │ HTTP / REST
                   ▼
┌──────────────────────────────────────┐
│            Spring Boot               │
│       REST API · Business Logic      │
│       JPA · Flyway Migrations        │
└──────────────────┬───────────────────┘
                   │ JDBC
                   ▼
┌──────────────────────────────────────┐
│             PostgreSQL               │
│       Supply Chain Operational Data  │
└──────────────────────────────────────┘
```

The frontend retrieves operational data through the backend API. PostgreSQL stores the application's database records, while Flyway manages database schema migrations.

---

## Application Pages

| Page | Purpose |
|---|---|
| Dashboard | Operational overview and key risk signals |
| Shipments | Shipment records and delivery status |
| Inventory | Stock levels and inventory health |
| Risk Intelligence | Shipment and inventory risks |
| Suppliers | Supplier reliability indicators |
| Replenishment | Suggested inventory replenishment |
| Network Explorer | Available supply network and route information |
| Disruption Simulator | Non-destructive disruption scenario analysis |

---

## Getting Started

Follow these instructions to run the project locally on Windows.

### Prerequisites

Install the following tools:

- Java 21
- Node.js and npm
- Docker Desktop
- Git

### 1. Clone the repository

After the project has been pushed to GitHub:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd supply-chain-sentinel
```

Replace the placeholder with your actual repository URL.

### 2. Start PostgreSQL

From the project root:

```bash
docker compose up -d
```

The development Docker Compose configuration uses PostgreSQL on host port `5434`.

The current local database configuration is:

| Setting | Development value |
|---|---|
| Database | `supply_chain` |
| Username | `supply_user` |
| Host port | `5434` |

The local development password is configured in the project's Docker Compose file. Do not reuse development credentials in a public deployment.

### 3. Start the backend

Open a terminal at the project root and run:

```powershell
$env:JAVA_TOOL_OPTIONS = "-Duser.timezone=UTC"
.\backend\mvnw.cmd -f .\backend\pom.xml spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

The timezone setting is included for the current Windows development environment.

Check backend health at:

```text
http://localhost:8080/actuator/health
```

### 4. Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, typically:

```text
http://localhost:5173
```

The frontend development server proxies `/api` and `/actuator` requests to the local backend at port `8080`.

### 5. Run verification checks

Frontend lint:

```powershell
cd frontend
npm run lint
```

Frontend production build:

```powershell
npm run build
```

Backend tests, from the project root:

```powershell
$env:JAVA_TOOL_OPTIONS = "-Duser.timezone=UTC"
.\backend\mvnw.cmd -f .\backend\pom.xml test
```

---

## Backend API Overview

The backend exposes REST endpoints for the application's core operations.

| Area | Endpoint | Method |
|---|---|---|
| Shipments | `/api/shipments` | GET, POST |
| Shipment details | `/api/shipments/{id}` | GET |
| Shipment status | `/api/shipments/{id}/status` | PATCH |
| Shipment risk scanning | `/api/risks/scan` | POST |
| Shipment alerts | `/api/alerts` | GET |
| Inventory | `/api/inventory` | GET, POST |
| Inventory details | `/api/inventory/{id}` | GET |
| Inventory movements | `/api/inventory/{id}/movements` | GET, POST |
| Inventory risk scanning | `/api/inventory/risks/scan` | POST |
| Inventory risks | `/api/inventory/risks` | GET |
| Supplier risk indicators | `/api/suppliers/risks` | GET |
| Replenishment recommendations | `/api/inventory/replenishment` | GET |

The exact response structures and validation rules are defined by the backend implementation.

---

## Design

SupplyChain Sentinel uses a **Carbon & Crimson** visual identity.

- Carbon-black backgrounds and layered charcoal panels.
- Crimson accents for important actions and risk highlights.
- Porcelain typography with muted secondary information.
- A complementary light theme.
- Information-dense operational pages with responsive tables, charts, and status indicators.

The interface is designed to keep operational information readable while making important supply chain signals easy to identify.

---

## Current Scope and Limitations

- Authentication and role-based access control are not included in the current implementation.
- Simulator outputs are scenario estimates, not guaranteed predictive forecasts.
- Historical trend visualizations should be distinguished from actual historical records where applicable.
- Network Explorer displays the relationships and information available in the current application data; it does not imply a fully modeled real-time supply network.
- Notification history and persistent read/unread state are not implemented as a dedicated notification subsystem.

Before public deployment, configure production credentials, secure API access, restrict database exposure, configure environment-specific settings, and enable HTTPS.

---

## Project Status

The agreed local implementation has passed frontend linting, TypeScript compilation, the Vite production build, and backend Maven tests. The implemented pages and major interactions have also been verified in the browser.

Production deployment and its environment-specific security configuration are separate from local verification.

---

## Author

**Ankit Maurya**

- GitHub: [Ankit-code02](https://github.com/Ankit-code02)
- LinkedIn: [Ankit Maurya](https://www.linkedin.com/in/ankit0209/)

---

*SupplyChain Sentinel — Monitor the signals. Understand the risk. Prepare the response.*