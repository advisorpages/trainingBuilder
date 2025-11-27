# TrainingBuilderv4 Deployment Guide

This guide walks you through migrating from local development to a production setup using GitHub, Vercel, and your VPS.

## 🎯 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel CDN    │    │   Your VPS       │    │   GitHub        │
│   (Frontend)    │◄──►│   (Backend)      │◄──►│   (CI/CD)       │
│   events.8531   │    │   + Database     │    │   + Repository  │
│   .ca           │    │   PostgreSQL     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- ✅ VPS server with Ubuntu 22.04 LTS
- ✅ Domain: events.8531.ca
- ✅ GitHub repository with your code
- ✅ OpenAI API key (for AI features)
- ✅ QR Cloud API key (for QR code generation)

## 🗂️ Files Created

The following files have been created for your migration:

- `docker-compose.prod.yml` - Production Docker configuration
- `nginx/nginx.conf` - Nginx reverse proxy configuration
- `.env.production` - Production environment template
- `vercel.json` - Vercel deployment configuration
- `scripts/setup-vps.sh` - VPS setup automation script
- `scripts/migrate-database.sh` - Database migration helper
- `.github/workflows/ci-cd.yml` - Updated CI/CD pipeline

## 🚀 Week 1: VPS Infrastructure Setup

### 1.1 Connect to Your VPS

```bash
ssh your-vps-user@your-vps-ip
```

### 1.2 Run Setup Script

Copy the setup script to your VPS and run it:

```bash
# On your local machine
scp scripts/setup-vps.sh your-vps-user@your-vps-ip:~/

# On your VPS
chmod +x setup-vps.sh
./setup-vps.sh
```

### 1.3 Clone Your Repository

```bash
# On your VPS
cd /home/your-user
git clone https://github.com/your-username/TrainingBuilderv4.git
cd TrainingBuilderv4
```

### 1.4 Configure Environment Variables

Edit the `.env.production` file with your actual values:

```bash
nano .env.production
```

Add your API keys:
```bash
OPENAI_API_KEY=your_actual_openai_key
QR_CLOUD_API_KEY=your_actual_qr_cloud_key
GOOGLE_ANALYTICS_ID=your_ga_id
```

### 1.5 Obtain SSL Certificates

First, update your DNS:
- Point `api.events.8531.ca` to your VPS IP
- Point `events.8531.ca` to Vercel (after setup)

Then get SSL certificates:

```bash
# On your VPS
sudo certbot certonly --standalone -d api.events.8531.ca

# Copy certificates to nginx directory
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/api.events.8531.ca/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/api.events.8531.ca/privkey.pem nginx/ssl/
```

### 1.6 Test Backend Deployment

```bash
# On your VPS
docker-compose -f docker-compose.prod.yml up -d database
docker-compose -f docker-compose.prod.yml up -d backend
```

Test the health endpoint:
```bash
curl http://localhost/health
```

## 🗄️ Week 2: Database Migration

### 2.1 Create Database Backup

From your local development environment:

```bash
# Make sure local database is running
docker-compose up -d database

# Run migration script
./scripts/migrate-database.sh
```

This creates a `production_backup.sql` file with all your data.

### 2.2 Transfer Backup to VPS

```bash
# From your local machine
scp production_backup.sql your-vps-user@your-vps-ip:/home/your-user/TrainingBuilderv4/
```

### 2.3 Import Database on VPS

```bash
# On your VPS
cd /home/your-user/TrainingBuilderv4

# Run the VPS migration helper
chmod +x vps-migration-helper.sh
./vps-migration-helper.sh
```

### 2.4 Run Database Migrations

```bash
# On your VPS - ensure database schema is up to date
docker-compose -f docker-compose.prod.yml run --rm backend npm run migration:run
```

## 🌐 Week 3: Frontend & CI/CD Setup

### 3.1 Configure Vercel

1. Connect your GitHub repository to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set Framework Preset to "Vite"

2. Configure domain:
   - Go to project settings
   - Add custom domain: `events.8531.ca`
   - Follow DNS instructions

3. Set environment variables:
   - `VITE_API_URL`: `https://api.events.8531.ca`
   - `VITE_APP_URL`: `https://events.8531.ca`

### 3.2 Configure GitHub Repository Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions:

Add these secrets:
```
VPS_HOST=your-vps-ip-address
VPS_USER=your-vps-username
VPS_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
[your-ssh-private-key-content]
-----END OPENSSH PRIVATE KEY-----
VPS_DB_PASSWORD=your-production-db-password
JWT_SECRET=your-256-bit-jwt-secret
OPENAI_API_KEY=your-openai-api-key
VERCEL_TOKEN=your-vercel-deployment-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

### 3.3 Get Vercel Credentials

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Get your organization and project IDs:
   ```bash
   vercel projects ls
   vercel link
   ```

4. Create Vercel token:
   ```bash
   vercel tokens create
   ```

### 3.4 Test CI/CD Pipeline

Push your changes to the main branch:

```bash
git add .
git commit -m "Configure production deployment"
git push origin main
```

This will trigger the GitHub Actions workflow that:
1. Runs all tests
2. Builds Docker images
3. Deploys frontend to Vercel
4. Deploys backend to VPS

## ✅ Week 4: Testing & Validation

### 4.1 Frontend Testing

Visit `https://events.8531.ca` and verify:
- ✅ Application loads correctly
- ✅ All pages are accessible
- ✅ API calls work
- ✅ No console errors

### 4.2 Backend Testing

Test various endpoints:

```bash
# Health check
curl https://api.events.8531.ca/health

# API endpoints (adjust based on your actual endpoints)
curl https://api.events.8531.ca/api/sessions
curl https://api.events.8531.ca/api/topics
```

### 4.3 Database Verification

```bash
# On VPS - check database connectivity
docker exec leadership-training-db-prod psql -U training_app -d leadership_training_prod -c "SELECT COUNT(*) FROM sessions;"
```

### 4.4 Security Validation

```bash
# Test SSL certificates
openssl s_client -connect api.events.8531.ca:443 -servername api.events.8531.ca

# Check HTTP to HTTPS redirect
curl -I http://api.events.8531.ca
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database container status
docker-compose -f docker-compose.prod.yml ps database

# Check database logs
docker-compose -f docker-compose.prod.yml logs database

# Test database connectivity
docker exec leadership-training-db-prod pg_isready -U training_app
```

#### SSL Certificate Issues
```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificate if needed
sudo certbot renew

# Test certificate
sudo openssl x509 -in /etc/letsencrypt/live/api.events.8531.ca/cert.pem -text -noout
```

#### Nginx Configuration Issues
```bash
# Test nginx configuration
sudo nginx -t

# Reload nginx if configuration is valid
sudo nginx -s reload

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### Docker Container Issues
```bash
# Check all containers
docker-compose -f docker-compose.prod.yml ps

# View container logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs database

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Performance Monitoring

#### On VPS
```bash
# Monitor system resources
htop

# Monitor Docker containers
docker stats

# Monitor disk space
df -h

# Monitor network connections
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

#### Application Logs
```bash
# Backend logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Database logs
docker-compose -f docker-compose.prod.yml logs -f database

# Nginx logs
tail -f /home/your-user/TrainingBuilderv4/logs/nginx/access.log
tail -f /home/your-user/TrainingBuilderv4/logs/nginx/error.log
```

## 📊 Monitoring & Maintenance

### Regular Tasks

#### Daily
- [ ] Check application health: `https://api.events.8531.ca/health`
- [ ] Monitor system resources and logs

#### Weekly
- [ ] Check SSL certificate expiration
- [ ] Review system security updates
- [ ] Monitor database performance

#### Monthly
- [ ] Update Docker images
- [ ] Review and rotate secrets
- [ ] Test backup and recovery procedures

### Backups

#### Database Backups (Automated)
Backups are created daily and stored in `/home/your-user/TrainingBuilderv4/backups/database/`

#### Manual Backup
```bash
# Create manual backup
./backup.sh

# List backups
ls -la backups/database/

# Restore from backup (if needed)
gunzip -c backups/database/backup_YYYYMMDD_HHMMSS.sql.gz | docker exec -i leadership-training-db-prod psql -U training_app -d leadership_training_prod
```

## 📞 Support

If you encounter issues:

1. **Check logs** - Always check application and system logs first
2. **Review this guide** - Most common issues are covered here
3. **Test locally** - Ensure your changes work in local development first
4. **Rollback** - Use Git and Docker image versioning to rollback if needed

## 🎉 Success Criteria

Your migration is successful when:

- ✅ Frontend loads at `https://events.8531.ca`
- ✅ Backend API responds at `https://api.events.8531.ca`
- ✅ Database is connected and functional
- ✅ All core features work as expected
- ✅ CI/CD pipeline deploys automatically
- ✅ SSL certificates are valid
- ✅ Monitoring and logging are functional

Congratulations! You now have a production-ready deployment setup with automated CI/CD, proper security, and improved scalability.