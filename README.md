# OpenPhonebook

OpenPhonebook is a highly performant, schema-agnostic corporate API directory engineered for high-paced environments (such as clinics, hospitals, or enterprises). It is built with Node.js, Express, Vue.js, and powered by an ultra-fast SQLite (WAL mode) database.

## Key Features
- **Dynamic Schema Engine**: Define, edit, and enforce custom fields on the fly without database migrations. Toggle fields to be visible, sortable, or instantly "copyable" to the clipboard directly from the UI.
- **Department Management**: Centralized department autocomplete, batch renaming (instantly updates all associated contacts), and the ability to pre-define custom departments via the Admin Panel.
- **Adaptive UI**: Seamlessly toggle between fully responsive Grid (contact cards) and List layouts with dynamic windowed pagination.
- **Custom Branding**: Completely rebrand the application (custom logos, brand names, and theming) directly from the Dev Panel without touching a single line of code.
- **Intelligent Imports**: Natively import massive JSON, CSV, and vCard directories with built-in schema validation.
- **Enterprise-Ready Security**: Out-of-the-box role-based access, PIN brute-force protection, helmet HTTP security headers, and aggressive static caching.
- **High Concurrency Support**: Utilizes SQLite with Write-Ahead Logging (WAL) to natively handle rapid, simultaneous read/writes without locking the database.

---

## Getting Started

### First-Time Setup (Bootstrap Mode)
OpenPhonebook is designed with a zero-trust approach to default credentials. There are **no hardcoded default passwords**. 

On a fresh installation, the server will launch in **Bootstrap Mode**. 
1. Navigate to the application in your browser.
2. You will be automatically redirected to a mandatory **First-Time Setup** wizard.
3. You will be prompted to securely configure your initial **Admin PIN** and **Dev PIN**.
4. Once configured, the application locks itself down and requires these newly minted PINs for all future administrative access.

---

## Deployment Options

OpenPhonebook supports dual-deployment infrastructure. Choose the option that best fits your environment:

### Option 1: Docker Orchestration (Recommended)
You can launch OpenPhonebook fully containerized with persistent data mounting for instant deployment.

```bash
# Clone the repository
git clone https://github.com/your-org/openphonebook.git
cd openphonebook

# Build and start the container detached
docker-compose up -d --build
```
*Note: The first build natively compiles `better-sqlite3` using Alpine Linux C++ build tools automatically.*

### Option 2: Bare-Metal Node.js (via PM2)
If you prefer running directly on a Linux host (e.g., Ubuntu/Debian), we provide a pre-configured `ecosystem.config.js`.

1. **Install Host Dependencies:**
Ensure Python 3 and C++ build tools are installed on your host OS so SQLite can compile natively.
```bash
sudo apt update
sudo apt install -y python3 make g++
```

2. **Install Node Dependencies:**
```bash
# Clone and enter the directory
npm install --production
```

3. **Start the Application via PM2:**
```bash
# Install PM2 globally if you don't have it
sudo npm install -g pm2

# Start the application
pm2 start ecosystem.config.js
pm2 save

# Optional: Generate a startup script to revive PM2 on server reboot
pm2 startup
```

---

## Maintenance & Observability

### Healthchecks
A lightweight, unauthenticated healthcheck endpoint is available for Load Balancers (like Nginx/HAProxy) or Orchestrators (Docker/Kubernetes):
`GET /api/health`
Returns a 200 OK with a timestamp.

### Backups
A native online-backup script is included. Because the database uses WAL mode, this script safely snapshots the database to the `./backups` folder without locking out concurrent writers or halting the application.
```bash
# Run manually or via a cron job
node scripts/backup.js
```

### Password Recovery (PIN Reset)
In a zero-trust model with no default passwords, losing your PINs means you are securely locked out of the administration panels. 

If this happens (permaloss), anyone with physical or SSH access to the server host can run the PIN reset utility. This script safely strips the PINs from the database without touching your contacts, throwing the application back into **Bootstrap Mode**:
```bash
node scripts/reset-pins.js
```
*Note: You must restart the Node.js / PM2 server after running this script for the changes to take effect in memory.*
