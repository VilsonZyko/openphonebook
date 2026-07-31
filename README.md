# OpenPhonebook

OpenPhonebook is a fast, lightweight employee directory designed to run safely on your local network. It is built specifically for fast-paced, practical environments like hospitals, private clinics, helpdesks, and local corporate offices where staff need to look up contact information instantly without relying on complex, cloud-based enterprise software.

## Features
- **Real-Time Search:** Instantly filter and find staff contacts as you type.
- **Adaptive Interface:** Clean, responsive UI that works perfectly on desktop monitors, tablets, and mobile phones (switchable between Grid and List views).
- **Local Data Privacy:** 100% self-hosted. Your employee data never leaves your local network.
- **Customizable Fields:** Add new fields (like 'Pager Number' or 'Building Wing') directly from the web interface without touching a database.
- **Zero Default Passwords:** Secure "First-Time Setup" ensures you configure your own PINs before the system can be accessed.
- **Docker Support:** Containerized for rapid deployment and easy updates.
- **Built-in Backups:** Native backup scripts to safely snapshot your data.

## Deployment Options

OpenPhonebook supports both Docker and standard Bare-Metal Node.js deployments. Choose the one that fits your IT environment.

### Option 1: Docker (Recommended)
You can launch OpenPhonebook fully containerized with persistent data storage.

```bash
# Clone the repository (or download and extract the ZIP)
git clone https://github.com/your-org/openphonebook.git
cd openphonebook

# Build and start the container in the background
docker-compose up -d --build
```
*(Note: The initial build will compile the SQLite database natively for the Alpine Linux container.)*

### Option 2: Bare-Metal Node.js (via PM2)
If you prefer running directly on a Linux host (e.g., Ubuntu/Debian), you can run the app as a standard background service.

1. **Install Host Dependencies:**
Ensure Python 3 and C++ build tools are installed so the database driver can compile natively.
```bash
sudo apt update
sudo apt install -y python3 make g++
```

2. **Install Node Dependencies:**
```bash
# Clone the repository (or download and extract the ZIP), then enter the directory
npm install --omit=dev
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

## 🌐 Accessing the Application

Once the deployment commands have finished running:
1. Open your web browser.
2. Navigate to `http://<YOUR_SERVER_IP>:3000` (or `http://localhost:3000` if testing locally).

## 🔐 First-Time Setup & Admin Access

OpenPhonebook uses a zero-trust model and has **no default passwords**.

1. When you access the application for the very first time, you will be automatically redirected to a **First-Time Setup** screen.
2. You must securely configure your initial **Admin PIN** and **Dev PIN**.
3. Once saved, the application locks down. You will use these newly minted PINs to access the **Login / Admin** and **Dev Panel** areas moving forward.

---

## Maintenance & Observability

### Healthchecks
A simple HTTP healthcheck endpoint is available for Load Balancers (like Nginx/HAProxy) to ping and verify the server is running. 

You can test this in your terminal using `curl`:
```bash
curl http://localhost:3000/api/health
```
*(Or simply open `http://<YOUR_SERVER_IP>:3000/api/health` in your web browser!)*

### Backups
Safely snapshot the database without stopping the application:
```bash
# If using Docker (Recommended)
docker exec -it openphonebook node scripts/backup.js

# If using Bare-Metal Node.js
node scripts/backup.js
```
**Automation:**
- **Linux / macOS:** Automate via a `cron` job. If using Docker, use the command: `docker exec openphonebook node scripts/backup.js`
- **Windows:** Automate via the built-in **Task Scheduler**. Create a Basic Task, set it to Daily, and set the Action to start a program. Program: `docker`, Arguments: `exec openphonebook node scripts/backup.js`

### Password Recovery (PIN Reset)
If you lose your PINs, anyone with physical or SSH access to the server host can run the PIN reset utility to throw the application back into First-Time Setup mode without touching your contacts:
```bash
# If using Docker (Recommended)
docker exec -it openphonebook node scripts/reset-pins.js
docker restart openphonebook

# If using Bare-Metal Node.js
node scripts/reset-pins.js
# (Remember to manually restart the PM2 server!)
```
*(Note: The Node.js server must be restarted after running this script for the changes to take effect in memory.)*

---

## Updating OpenPhonebook

Because OpenPhonebook stores all of your contacts, custom fields, and PINs securely inside the `./data` folder, you can safely update the core application code at any time without losing your configurations. 

Always run a backup before updating. Once backed up, run the following commands to pull the latest version:

### If using Docker:
```bash
# Pull the latest code from GitHub
git pull origin master

# Rebuild the container in the background
# (Docker will automatically remount your existing data folder!)
docker-compose up -d --build
```

### If using Bare-Metal Node.js:
```bash
# Pull the latest code from GitHub
git pull origin master

# Install any new dependencies
npm install --omit=dev

# Restart the background process
pm2 restart openphonebook
```

---

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
