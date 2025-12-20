# Deployment Guide

Complete guide for deploying Kaka Malem on Ubuntu VPS with automatic CI/CD.

## Infrastructure

- **VPS**: HostHatch (Ubuntu 24.04)
- **Database**: MongoDB Atlas
- **Domain**: Namecheap
- **CI/CD**: GitHub Actions

---

## Part 1: Initial VPS Setup

### Step 1: Configure DNS (Namecheap)

1. Log into Namecheap → **Domain List** → **Manage**
2. Set **Nameservers** to **Namecheap BasicDNS**
3. Go to **Advanced DNS** and add:

| Type     | Host  | Value         | TTL       |
| -------- | ----- | ------------- | --------- |
| A Record | `@`   | `YOUR_VPS_IP` | Automatic |
| A Record | `www` | `YOUR_VPS_IP` | Automatic |

4. Delete any conflicting records
5. Wait 10-30 minutes for DNS propagation

**Verify:** `nslookup kakamalem.com` in PowerShell

### Step 2: SSH into Your VPS

Open **Windows Terminal** or **PowerShell**:

```powershell
ssh root@YOUR_VPS_IP
```

First time: type `yes` when prompted, then enter your root password.

### Step 3: Run Server Setup

```bash
# Download and run setup script
curl -O https://raw.githubusercontent.com/KakaMalem/KakaMalem/main/deploy/setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

### Step 4: Clone and Configure App

```bash
cd /var/www/KakaMalem
git clone https://github.com/KakaMalem/KakaMalem.git .
cp .env.example .env
nano .env  # Edit with your production values
```

**Required .env values:**

```env
DATABASE_URI=mongodb+srv://user:pass@cluster.mongodb.net/kakamalem
PAYLOAD_SECRET=<run: openssl rand -base64 32>
NEXT_PUBLIC_SERVER_URL=https://kakamalem.com
NODE_ENV=production
```

### Step 5: Build and Start

```bash
pnpm install
pnpm build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # Run the command it outputs
```

### Step 6: Configure Nginx and SSL

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/KakaMalem
sudo ln -s /etc/nginx/sites-available/KakaMalem /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d kakamalem.com -d www.kakamalem.com
```

---

## Part 2: CI/CD Setup (Automatic Deployments)

### How It Works

```
Push to main → Lint → Build → Deploy (if all pass)
     │          │       │         │
     │          ✗ FAIL  │         │
     │                  ✗ FAIL    │
     └────────────────────────────✓ Site updated
```

### Step 1: Generate SSH Key for GitHub Actions

On your VPS:

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy  # Copy this private key
```

### Step 2: Add GitHub Secrets

Go to **Repository → Settings → Secrets and variables → Actions** and add:

| Secret                   | Value                                |
| ------------------------ | ------------------------------------ |
| `VPS_HOST`               | Your VPS IP address                  |
| `VPS_USERNAME`           | `root`                               |
| `VPS_PORT`               | `22`                                 |
| `VPS_SSH_KEY`            | The private key from Step 1          |
| `APP_PATH`               | `/var/www/KakaMalem`                 |
| `DATABASE_URI`           | Your MongoDB Atlas connection string |
| `PAYLOAD_SECRET`         | Your Payload secret                  |
| `NEXT_PUBLIC_SERVER_URL` | `https://kakamalem.com`              |

### Step 3: Push and Deploy

```powershell
git add .
git commit -m "Your changes"
git push
```

Check **Actions** tab in GitHub to see deployment status.

---

## Commands Reference

### PM2 (App Management)

```bash
pm2 status                     # Show status
pm2 logs KakaMalem             # View logs
pm2 restart KakaMalem          # Restart app
pm2 monit                      # Live dashboard
```

### Nginx

```bash
sudo nginx -t                  # Test config
sudo systemctl reload nginx    # Apply changes
```

### Manual Deploy

```bash
cd /var/www/KakaMalem
./deploy/deploy.sh
```

### Rollback

```bash
cd /var/www/KakaMalem
./deploy/rollback.sh           # Previous commit
./deploy/rollback.sh abc123    # Specific commit
```

---

## Troubleshooting

| Issue              | Solution                                             |
| ------------------ | ---------------------------------------------------- |
| 502 Bad Gateway    | `pm2 status` - check if app is running               |
| Build fails        | Check `.env` values, especially `DATABASE_URI`       |
| SSL fails          | Wait for DNS propagation, check `ping kakamalem.com` |
| MongoDB error      | Whitelist VPS IP in MongoDB Atlas Network Access     |
| Deploy not running | Check GitHub Actions tab for errors                  |
