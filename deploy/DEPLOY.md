# Deployment Guide - Kaka Malem

Deploy on Ubuntu 24.04 VPS with MongoDB Atlas, Nginx, and SSL.

## Prerequisites

- Ubuntu 24.04 VPS with root/sudo access (HostHatch or similar)
- Domain name pointed to your VPS IP (A record)
- MongoDB Atlas account with database created

## Step 0: SSH into Your Server (Windows)

After purchasing your VPS from HostHatch, you'll receive:

- **Server IP address** (e.g., `203.0.113.50`)
- **Root password** (via email or control panel)

### Option A: Using Windows Terminal / PowerShell (Recommended)

Windows 10/11 has SSH built-in. Open **Windows Terminal** or **PowerShell** and run:

```powershell
ssh root@YOUR_SERVER_IP
```

**Example:**

```powershell
ssh root@203.0.113.50
```

First time connecting, you'll see:

```
The authenticity of host '203.0.113.50' can't be established.
ED25519 key fingerprint is SHA256:xxxxx...
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Type `yes` and press Enter. Then enter your root password when prompted.

### Option B: Using PuTTY

1. Download PuTTY from https://www.putty.org/
2. Open PuTTY
3. Enter your server IP in "Host Name"
4. Port: `22`
5. Connection type: `SSH`
6. Click "Open"
7. Login as: `root`
8. Enter your password

### Option C: Using VS Code (Best for Development)

1. Install "Remote - SSH" extension in VS Code
2. Press `Ctrl+Shift+P` → "Remote-SSH: Connect to Host"
3. Enter: `root@YOUR_SERVER_IP`
4. Select Linux when prompted
5. Enter password

This lets you edit files directly on the server with VS Code.

### After First Login: Set Up SSH Keys (Recommended)

For passwordless login, generate and copy SSH keys:

**On your Windows machine (PowerShell):**

```powershell
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy key to server
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@YOUR_SERVER_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

Now you can SSH without a password.

### HostHatch Control Panel

Access your VPS management at: https://cloud.hosthatch.com

- View/reset root password
- Access VNC console (if SSH fails)
- Reboot server
- View server IP and specs

---

## Linux Command Basics (For Beginners)

If you're new to Linux, here are some essential concepts:

| Command           | What it does                            | Example                               |
| ----------------- | --------------------------------------- | ------------------------------------- |
| `curl -O <url>`   | Downloads a file from URL               | `curl -O https://example.com/file.sh` |
| `chmod +x <file>` | Makes a file executable (runnable)      | `chmod +x setup.sh`                   |
| `./<file>`        | Runs an executable file                 | `./setup.sh`                          |
| `cd <folder>`     | Change directory (navigate to folder)   | `cd /var/www`                         |
| `sudo <command>`  | Run command as administrator            | `sudo apt update`                     |
| `nano <file>`     | Edit a file (Ctrl+X to exit, Y to save) | `nano .env`                           |
| `cat <file>`      | Display file contents                   | `cat .env`                            |
| `ls`              | List files in current directory         | `ls -la`                              |
| `pwd`             | Print current directory path            | `pwd`                                 |

**Important:** Don't paste URLs directly - use `curl` to download them first!

---

## Step 1: Initial Server Setup

SSH into your server and run these commands one by one:

### Option A: Using the Setup Script

```bash
# Step 1: Download the setup script (curl downloads the file)
curl -O https://raw.githubusercontent.com/KakaMalem/KakaMalem/main/deploy/setup-vps.sh

# Step 2: Make it executable (gives permission to run it)
chmod +x setup-vps.sh

# Step 3: Run the script (./ means "run this file")
./setup-vps.sh
```

### Option B: Run Commands Manually

If the script doesn't work, copy and paste these commands one at a time:

```bash
# Update the system package list and upgrade existing packages
sudo apt update && sudo apt upgrade -y

# Install required packages (nginx=web server, certbot=SSL, ufw=firewall)
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw

# Install Node.js 20.x (downloads and runs the installer script)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm (package manager) and PM2 (process manager)
sudo npm install -g pnpm pm2

# Configure firewall - allow SSH so you don't get locked out!
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Create the application directory
sudo mkdir -p /var/www/KakaMalem
sudo chown -R $USER:$USER /var/www/KakaMalem
```

## Step 2: Clone and Configure Application

```bash
# Navigate to the app directory (cd = change directory)
cd /var/www/KakaMalem

# Clone your repository (the "." at the end means "into current folder")
# Replace with your actual GitHub repo URL
git clone https://github.com/KakaMalem/KakaMalem.git .

# Create logs directory (-p means "create parent folders if needed")
mkdir -p logs

# Copy the example environment file to create your actual .env file
cp .env.example .env

# Open the .env file in nano editor
# - Use arrow keys to navigate
# - Edit the values
# - Press Ctrl+X to exit, then Y to save, then Enter to confirm
nano .env
```

### Configure .env

```env
DATABASE_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/kakamalem?retryWrites=true&w=majority
PAYLOAD_SECRET=your-secure-random-string-here
NEXT_PUBLIC_SERVER_URL=https://kakamalem.com
NODE_ENV=production
ALLOWED_ORIGINS=https://kakamalem.com,https://www.kakamalem.com

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Kaka Malem
SMTP_FROM_EMAIL=noreply@kakamalem.com
```

Generate a secure PAYLOAD_SECRET:

```bash
openssl rand -base64 32
```

## Step 3: Build Application

```bash
# Make sure you're in the app directory
cd /var/www/KakaMalem

# Install all project dependencies (this may take a few minutes)
pnpm install

# Build the app for production (this may take 2-5 minutes)
# You'll see a lot of output - wait until it says "Build completed"
pnpm build
```

**Note:** If the build fails, check that your `.env` file has correct values, especially `DATABASE_URI`.

## Step 4: Configure Nginx

Nginx is the web server that handles incoming requests and forwards them to your app.

```bash
# Copy the nginx config file to nginx's config folder
sudo cp deploy/nginx.conf /etc/nginx/sites-available/KakaMalem

# (Optional) Review/edit the config - domain is set to kakamalem.com
# Change the domain if yours is different
sudo nano /etc/nginx/sites-available/KakaMalem

# Create a symbolic link to enable the site (ln -s = create link)
sudo ln -s /etc/nginx/sites-available/KakaMalem /etc/nginx/sites-enabled/

# Remove the default nginx welcome page
sudo rm /etc/nginx/sites-enabled/default

# Test nginx config for syntax errors (should say "syntax is ok")
sudo nginx -t

# Reload nginx to apply changes
sudo systemctl reload nginx
```

**If `nginx -t` shows errors:** Check the config file for typos with `sudo nano /etc/nginx/sites-available/KakaMalem`

## Step 5: Set Up SSL with Let's Encrypt

SSL gives your site HTTPS (the padlock icon). This is free with Let's Encrypt.

**Before this step:** Make sure your domain DNS is pointing to your server IP!

```bash
# Get SSL certificate (replace kakamalem.com with your domain)
# Certbot will ask for your email and to agree to terms
sudo certbot --nginx -d kakamalem.com -d www.kakamalem.com

# Test that auto-renewal works (certificates expire every 90 days)
sudo certbot renew --dry-run
```

**If certbot fails:**

- DNS not propagated yet - wait 10-30 minutes and try again
- Check domain points to correct IP: `ping kakamalem.com`
- Make sure port 80 is open: `sudo ufw status`

## Step 6: Start Application with PM2

PM2 keeps your app running in the background and restarts it if it crashes.

```bash
cd /var/www/KakaMalem

# Start the app using the PM2 config file
pm2 start ecosystem.config.cjs

# Check if it's running (should show "online" status)
pm2 status

# Save the process list so PM2 remembers what to run
pm2 save

# Set PM2 to start automatically when server reboots
pm2 startup
# ^ This command will output another command - copy and run it!
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

**Verify it's working:**

```bash
# Check app status
pm2 status

# View live logs (Ctrl+C to exit)
pm2 logs KakaMalem
```

## Step 7: Verify Deployment

1. Visit `https://kakamalem.com` - should see the store
2. Visit `https://kakamalem.com/admin` - should see Payload admin login

## Common Commands Cheat Sheet

### PM2 (App Management)

| Command                          | What it does                   |
| -------------------------------- | ------------------------------ |
| `pm2 status`                     | Show all running apps          |
| `pm2 logs KakaMalem`             | View app logs (Ctrl+C to exit) |
| `pm2 logs KakaMalem --lines 100` | View last 100 lines of logs    |
| `pm2 restart KakaMalem`          | Restart the app                |
| `pm2 stop KakaMalem`             | Stop the app                   |
| `pm2 delete KakaMalem`           | Remove app from PM2            |
| `pm2 monit`                      | Live monitoring dashboard      |

### Nginx (Web Server)

| Command                                  | What it does               |
| ---------------------------------------- | -------------------------- |
| `sudo systemctl status nginx`            | Check if nginx is running  |
| `sudo systemctl restart nginx`           | Restart nginx              |
| `sudo nginx -t`                          | Test config for errors     |
| `sudo tail -f /var/log/nginx/error.log`  | View nginx error logs live |
| `sudo tail -f /var/log/nginx/access.log` | View access logs live      |

### System

| Command   | What it does                      |
| --------- | --------------------------------- |
| `htop`    | Show CPU/memory usage (q to quit) |
| `df -h`   | Show disk space                   |
| `free -h` | Show memory usage                 |
| `reboot`  | Restart the server                |

## Updating the Application

When you push changes to GitHub and want to deploy them:

```bash
# Navigate to app folder
cd /var/www/KakaMalem

# Pull latest code from GitHub
git pull origin main

# Install any new dependencies (skip if no package.json changes)
pnpm install

# Rebuild the app
pnpm build

# Restart to apply changes
pm2 restart KakaMalem

# Check it's running
pm2 status
```

**Quick update (one-liner):**

```bash
cd /var/www/KakaMalem && git pull origin main && pnpm install && pnpm build && pm2 restart KakaMalem
```

## Troubleshooting

### App won't start

```bash
# Check PM2 logs
pm2 logs KakaMalem --lines 100

# Check if port 3000 is in use
sudo lsof -i :3000
```

### 502 Bad Gateway

- App might not be running: `pm2 status`
- Port mismatch: verify nginx proxy_pass matches app port

### SSL issues

```bash
# Renew certificates
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### MongoDB connection issues

- Verify MongoDB Atlas IP whitelist includes your VPS IP
- Check connection string in .env
- Ensure database user has correct permissions
