# Production Deployment Guide

**Leadership Training Platform v1.0**
**Status:** Ready for Production Deployment
**Date:** September 19, 2025

## 🚀 Quick Start Deployment

### Prerequisites
- Docker & Docker Compose installed
- SSL certificate (for HTTPS)
- Domain name configured
- Environment variables configured

### 1-Step Production Deployment
```bash
# Clone repository
git clone <repository-url>
cd TrainingBuilderv4

# Configure environment
cp .env.production.example .env.production
# Edit .env.production with your values

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 Pre-Deployment Checklist

### Environment Setup ✅
- [ ] Domain name configured and DNS pointing to server
- [ ] SSL certificate obtained and configured
- [ ] Environment variables file created from template
- [ ] Database credentials generated (strong passwords)
- [ ] JWT secrets generated (32+ character random strings)
- [ ] External API keys configured (QR service, email, etc.)

### Security Configuration ✅
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Strong database passwords set
- [ ] JWT secrets are unique and secure
- [ ] CORS origins configured for production domain
- [ ] Rate limiting configured appropriately

### Infrastructure Requirements ✅
- [ ] Minimum 2GB RAM
- [ ] Minimum 2 CPU cores
- [ ] Minimum 20GB storage
- [ ] PostgreSQL 15+ compatible
- [ ] Node.js 18+ (handled by Docker)

## 🔧 Detailed Deployment Instructions

### Step 1: Server Preparation

**1.1 System Updates**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose git nginx certbot -y
```

**1.2 User Setup**
```bash
# Create deployment user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy
sudo su - deploy
```

### Step 2: Application Deployment

**2.1 Repository Setup**
```bash
git clone <repository-url> leadership-training
cd leadership-training
```

**2.2 Environment Configuration**
```bash
# Copy and edit production environment
cp .env.production.example .env.production
nano .env.production
```

**Required Environment Variables:**
```env
# Database
DATABASE_PASSWORD=STRONG_RANDOM_PASSWORD
JWT_SECRET=LONG_RANDOM_STRING_32_CHARS_MIN
JWT_REFRESH_SECRET=DIFFERENT_LONG_RANDOM_STRING

# External Services
QR_CLOUD_API_KEY=your_qr_api_key
EMAIL_PASSWORD=your_email_app_password

# Domain
CORS_ORIGIN=https://yourdomain.com
```

**2.3 SSL Certificate Setup**
```bash
# For Let's Encrypt certificate
sudo certbot certonly --standalone -d yourdomain.com
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/key.pem
sudo chown deploy:deploy ./nginx/ssl/*
```

**2.4 Deploy Application**
```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
```

### Step 3: Post-Deployment Verification

**3.1 Health Checks**
```bash
# Check application health
curl http://localhost/api/health

# Check database connection
curl http://localhost/api/health/live

# Check all services running
docker-compose -f docker-compose.prod.yml ps
```

**3.2 Functionality Testing**
- [ ] Homepage loads successfully
- [ ] User registration works
- [ ] Login functionality works
- [ ] API endpoints respond
- [ ] Database operations succeed

## 🔄 CI/CD Deployment (Recommended)

### GitHub Actions Setup

**1. Repository Secrets Configuration**
```
DOCKER_REGISTRY_TOKEN=<github_token>
PRODUCTION_SERVER_HOST=<server_ip>
PRODUCTION_SERVER_USER=deploy
PRODUCTION_SSH_KEY=<private_key>
DATABASE_PASSWORD=<strong_password>
JWT_SECRET=<random_string>
QR_CLOUD_API_KEY=<api_key>
```

**2. Automated Deployment**
```bash
# Push to main branch triggers deployment
git push origin main

# Monitor deployment in GitHub Actions
# https://github.com/your-org/your-repo/actions
```

### Deployment Pipeline Stages
1. **Test** - Unit tests, integration tests, security scan
2. **Build** - Docker images with versioning
3. **Deploy** - Automated deployment to production
4. **Validate** - Health checks and smoke tests

## 📊 Monitoring & Maintenance

### Application Monitoring

**Health Endpoints:**
- `GET /api/health` - Basic health check
- `GET /api/health/live` - Liveness probe
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/metrics` - Performance metrics

**Log Monitoring:**
```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# System logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Performance Monitoring

**Resource Usage:**
```bash
# Container resource usage
docker stats

# System resource usage
htop
df -h
free -h
```

**Application Metrics:**
- Response times via health endpoint
- Error rates in application logs
- Database performance metrics
- Memory and CPU usage

### Backup Procedures

**Database Backup:**
```bash
# Daily backup script
docker exec leadership-training-db-prod pg_dump -U postgres leadership_training > backup_$(date +%Y%m%d).sql

# Automated backup (add to crontab)
0 2 * * * /home/deploy/backup-database.sh
```

**Application Backup:**
```bash
# Backup uploaded files and configurations
tar -czf app_backup_$(date +%Y%m%d).tar.gz ./uploads ./nginx/ssl .env.production
```

## 🔧 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check database container
docker-compose -f docker-compose.prod.yml logs database

# Verify environment variables
docker exec backend-container env | grep DATABASE

# Test connection manually
docker exec -it database-container psql -U postgres -d leadership_training
```

**2. Application Won't Start**
```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs backend

# Verify environment file
cat .env.production

# Check resource usage
docker stats
```

**3. SSL Certificate Issues**
```bash
# Verify certificate files
ls -la ./nginx/ssl/

# Test certificate validity
openssl x509 -in ./nginx/ssl/cert.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew
```

### Performance Issues

**High Memory Usage:**
```bash
# Restart services
docker-compose -f docker-compose.prod.yml restart

# Check for memory leaks
docker exec backend-container node --expose-gc -e "gc(); console.log(process.memoryUsage())"
```

**Slow Response Times:**
```bash
# Check database performance
docker exec -it database-container psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Monitor API response times
curl -w "%{time_total}" http://localhost/api/health
```

## 🔄 Updates & Maintenance

### Application Updates

**Automated Updates (CI/CD):**
```bash
# Updates triggered by git push to main
git tag v1.1.0
git push origin v1.1.0
```

**Manual Updates:**
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Migrations

**Automatic Migrations:**
```bash
# Migrations run automatically on container start
docker-compose -f docker-compose.prod.yml restart backend
```

**Manual Migration:**
```bash
# Run specific migration
docker exec backend-container npm run migration:run
```

### Security Updates

**System Updates:**
```bash
# Monthly system updates
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

**SSL Certificate Renewal:**
```bash
# Auto-renewal (set up in crontab)
0 3 1 * * certbot renew --quiet && docker-compose -f docker-compose.prod.yml restart nginx
```

## 📞 Support & Maintenance

### Production Support Contacts
- **Technical Lead:** [Your contact information]
- **DevOps:** [DevOps contact information]
- **Security:** [Security team contact]

### Escalation Procedures
1. **Critical Issues:** Immediate notification via [alert system]
2. **High Priority:** Response within 4 hours
3. **Medium Priority:** Response within 24 hours
4. **Low Priority:** Response within 72 hours

### Maintenance Windows
- **Regular Maintenance:** First Sunday of each month, 2-4 AM EST
- **Emergency Maintenance:** As needed with 2-hour notice
- **Security Updates:** Within 48 hours of release

---

## ✅ Deployment Checklist Summary

**Pre-Deployment:**
- [ ] Environment configured
- [ ] SSL certificates ready
- [ ] DNS configured
- [ ] Server resources adequate

**Deployment:**
- [ ] Application deployed via Docker Compose
- [ ] Health checks passing
- [ ] Functionality verified
- [ ] Monitoring configured

**Post-Deployment:**
- [ ] Backup procedures in place
- [ ] CI/CD pipeline configured
- [ ] Monitoring alerts set up
- [ ] Documentation updated

**Status: 🚀 READY FOR PRODUCTION DEPLOYMENT**

*This deployment guide provides comprehensive instructions for production deployment of the Leadership Training platform.*