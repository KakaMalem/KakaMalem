# Deployment Guide - Kaka Malem

Deploy on Ubuntu 24.04 VPS with MongoDB Atlas, Nginx, and SSL.

## Prerequisites

- Ubuntu 24.04 VPS with root/sudo access
- Domain name pointed to your VPS IP (A record)
- MongoDB Atlas account with database created

## Step 1: Initial Server Setup

SSH into your server and run:

```bash
# Download and run setup script
curl -O https://raw.githubusercontent.com/YOUR_REPO/main/deploy/setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

Or manually:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm and PM2
sudo npm install -g pnpm pm2

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## Step 2: Clone and Configure Application

```bash
# Create app directory
sudo mkdir -p /var/www/KakaMalem
sudo chown -R $USER:$USER /var/www/KakaMalem

# Clone repository
cd /var/www/KakaMalem
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Create logs directory
mkdir -p logs

# Copy and configure environment
cp .env.example .env
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
cd /var/www/KakaMalem

# Install dependencies
pnpm install

# Build for production
pnpm build
```

## Step 4: Configure Nginx

```bash
# Copy nginx config
sudo cp deploy/nginx.conf /etc/nginx/sites-available/KakaMalem

# Review the config (domain is already set to kakamalem.com)
sudo nano /etc/nginx/sites-available/KakaMalem

# Enable site
sudo ln -s /etc/nginx/sites-available/KakaMalem /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Step 5: Set Up SSL with Let's Encrypt

```bash
# Get SSL certificate
sudo certbot --nginx -d kakamalem.com -d www.kakamalem.com

# Certbot will automatically configure SSL in nginx
# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 6: Start Application with PM2

```bash
cd /var/www/KakaMalem

# Start the app
pm2 start ecosystem.config.cjs

# Save PM2 process list
pm2 save

# Set PM2 to start on boot
pm2 startup
# Run the command it outputs with sudo
```

## Step 7: Verify Deployment

1. Visit `https://kakamalem.com` - should see the store
2. Visit `https://kakamalem.com/admin` - should see Payload admin login

## Common Commands

```bash
# View app logs
pm2 logs KakaMalem

# Restart app
pm2 restart KakaMalem

# Stop app
pm2 stop KakaMalem

# Monitor resources
pm2 monit

# Check nginx status
sudo systemctl status nginx

# View nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Updating the Application

```bash
cd /var/www/KakaMalem

# Pull latest changes
git pull origin main

# Install any new dependencies
pnpm install

# Rebuild
pnpm build

# Restart PM2
pm2 restart KakaMalem
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
