# E-Water Management System (EWMS) — WASAC Rwanda
## Phase 2 Prototype + Phase 3 Docker Deployment

---

## Project Structure

```
ewms/
├── frontend/
│   ├── css/style.css          ← All styles (clean, humanized)
│   ├── js/
│   │   ├── auth.js            ← Shared auth utilities
│   │   ├── dashboard.js       ← Homeowner dashboard logic
│   │   └── admin.js           ← Admin dashboard logic
│   ├── pages/
│   │   ├── login.html         ← Homeowner login
│   │   ├── register.html      ← Registration + OTP
│   │   ├── admin-login.html   ← Admin portal login
│   │   ├── dashboard.html     ← Homeowner dashboard
│   │   └── admin-dashboard.html ← Admin dashboard
│   ├── Dockerfile             ← nginx container
│   └── nginx.conf
├── backend/
│   ├── server.js              ← Express entry point
│   ├── config/db.js           ← MongoDB connection
│   ├── middleware/auth.js     ← JWT middleware
│   ├── models/
│   │   ├── User.js            ← User + Admin schemas
│   │   └── Meter.js           ← Meter + Bill + Payment
│   ├── routes/
│   │   ├── auth.js            ← Register / Login / OTP
│   │   ├── meters.js          ← Usage & summary
│   │   ├── bills.js           ← Bills
│   │   ├── payments.js        ← Payments
│   │   └── admin.js           ← Admin management
│   ├── seed.js                ← Test data seeder
│   ├── .env.example           ← Copy to .env
│   └── Dockerfile
└── docker-compose.yml         ← Orchestrates everything
```

---

## Phase 3 — Docker Deployment (Step by Step)

### Step 1 — Install Docker

Download and install Docker Desktop from https://www.docker.com/products/docker-desktop
- Windows: run the .exe installer, restart your computer
- Mac: drag Docker.app to Applications
- Linux: follow https://docs.docker.com/engine/install/ubuntu/

Verify it works:
```bash
docker --version
docker-compose --version
```

---

### Step 2 — Set up environment variables

```bash
cd ewms/backend
cp .env.example .env
```

Open `.env` and set a strong JWT_SECRET:
```
JWT_SECRET=wasac_ewms_super_secret_2024_change_this
```

---

### Step 3 — Build and start all containers

From the root `ewms/` folder:
```bash
docker-compose up --build
```

What happens:
1. Docker builds the **backend** image (Node 20 + your code)
2. Docker builds the **frontend** image (nginx + HTML/CSS/JS)
3. Docker pulls the **MongoDB 7** image from Docker Hub
4. All 3 containers start on an isolated network called `ewms_net`
5. They can find each other by service name (backend calls `mongo`, not an IP)

Wait for this message:
```
ewms_backend  | EWMS server running on port 5000
ewms_backend  | MongoDB connected
```

> Note: For local development, the Docker Compose setup now mounts your frontend and backend source files directly into the containers.
> - Frontend HTML/CSS/JS changes appear instantly in the browser.
> - Backend code changes still require restarting the container because Node does not reload automatically.

---

### Step 4 — Seed test data

Open a second terminal:
```bash
docker exec -it ewms_backend node seed.js
```

This creates:
- Homeowner account: alice@gmail.com / Test1234!
- Admin account: admin@wasac.rw / Admin1234!
- Sample meter, 6 months of usage, 3 bills

---

### Step 5 — Open in your browser

| URL | What you see |
|-----|-------------|
| http://localhost:8090 | Homeowner login page |
| http://localhost:8090/pages/register.html | Registration |
| http://localhost:8090/pages/admin-login.html | Admin portal |
| http://localhost:5000/health | API health check |

---

### Step 6 — Useful Docker commands

```bash
# Stop all containers (keep data)
docker-compose down

# Stop AND delete all data (fresh start)
docker-compose down -v

# View live logs
docker-compose logs -f

# View only backend logs
docker-compose logs -f backend

# Rebuild after changing code
docker-compose up --build

# Run a command inside a container
docker exec -it ewms_backend sh
```

---

### Step 7 — Design patterns used (Phase 2 requirement)

**Observer Pattern** — The billing service observes meter readings.
When a meter sends new data, the billing engine automatically generates a bill.
This decouples the meter from the billing logic.

**Middleware Pattern (Chain of Responsibility)** — Every protected API route
passes through `authMiddleware` before reaching the route handler.
This is exactly the Chain of Responsibility pattern.

**MVC (Model-View-Controller)** — Models in `/models`, views are the HTML pages,
controllers are the route handlers in `/routes`.

---

### Step 8 — Google coding standards applied

- **JavaScript (Node.js)**: follows Google JS Style Guide — `const`/`let` only,
  async/await over callbacks, 2-space indents, single quotes, no trailing commas
- **Comments**: only on non-obvious code (not every line)
- **Naming**: camelCase for variables, PascalCase for classes/models
- **Error handling**: every async function wrapped in try/catch with meaningful messages
- **Security**: passwords hashed with bcrypt (cost factor 10), JWT expiry set, no passwords in responses

---

### Stopping the system

```bash
# Ctrl+C in the terminal where docker-compose is running, then:
docker-compose down
```

Your MongoDB data is saved in a Docker volume and will be there next time you run `docker-compose up`.
