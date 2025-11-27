#!/bin/bash

# VPS Setup Script for TrainingBuilderv4
# This script sets up the production environment on your VPS

set -e  # Exit on any error

echo "🚀 Starting VPS setup for TrainingBuilderv4..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    log_error "Please don't run this script as root. Run as your deploy user."
    exit 1
fi

# Update system
log_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
log_info "Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    gnupg \
    lsb-release \
    apt-transport-https \
    ca-certificates \
    software-properties-common \
    ufw \
    fail2ban \
    nginx \
    certbot \
    python3-certbot-nginx \
    git \
    htop \
    unzip \
    zip

# Install Docker
log_info "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    log_info "Docker installed successfully"
else
    log_warning "Docker already installed"
fi

# Install Docker Compose
log_info "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    log_info "Docker Compose installed successfully"
else
    log_warning "Docker Compose already installed"
fi

# Setup firewall
log_info "Configuring UFW firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Setup fail2ban
log_info "Configuring fail2ban..."
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create project directory
PROJECT_DIR="/home/$USER/TrainingBuilderv4"
log_info "Creating project directory at $PROJECT_DIR..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Create necessary directories
log_info "Creating necessary directories..."
mkdir -p nginx/ssl
mkdir -p logs/nginx
mkdir -p backups/database

# Generate secure passwords if not provided
if [ -z "$DB_PASSWORD" ]; then
    log_info "Generating secure database password..."
    DB_PASSWORD=$(openssl rand -base64 32)
    echo "Database password: $DB_PASSWORD"
fi

if [ -z "$JWT_SECRET" ]; then
    log_info "Generating JWT secret..."
    JWT_SECRET=$(openssl rand -base64 64)
    echo "JWT secret: $JWT_SECRET"
fi

if [ -z "$JWT_REFRESH_SECRET" ]; then
    log_info "Generating JWT refresh secret..."
    JWT_REFRESH_SECRET=$(openssl rand -base64 64)
    echo "JWT refresh secret: $JWT_REFRESH_SECRET"
fi

# Create .env.production file
log_info "Creating .env.production file..."
cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production

# Database Configuration
DATABASE_HOST=database
DATABASE_PORT=5432
DATABASE_NAME=leadership_training_prod
DATABASE_USER=training_app
DATABASE_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Frontend Configuration
FRONTEND_URL=https://events.8531.ca
CORS_ORIGIN=https://events.8531.ca

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Feature Flags
ENABLE_VARIANT_GENERATION_V2=true
VARIANT_GENERATION_ROLLOUT_PERCENTAGE=10
LOG_VARIANT_SELECTIONS=false

# QR Code Configuration
QR_CODE_ERROR_CORRECTION=M
QR_CODE_SIZE=300x300
QR_CODE_FORMAT=PNG

# SSL/HTTP Ports
HTTP_PORT=80
HTTPS_PORT=443

# Add your API keys here:
# OPENAI_API_KEY=your_openai_api_key_here
# QR_CLOUD_API_KEY=your_qr_cloud_api_key_here
# GOOGLE_ANALYTICS_ID=your_google_analytics_id_here
EOF

log_info "Environment file created. Please add your API keys to .env.production"

# Setup log rotation
log_info "Setting up log rotation..."
sudo tee /etc/logrotate.d/leadership-training << EOF
$PROJECT_DIR/logs/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        docker kill -s USR1 leadership-training-nginx 2>/dev/null || true
    endscript
}
EOF

# Setup backup script
log_info "Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash

# Backup script for database and application data
BACKUP_DIR="/home/$USER/TrainingBuilderv4/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="$BACKUP_DIR/database/backup_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR/database

# Database backup
cd /home/$USER/TrainingBuilderv4
docker exec leadership-training-db-prod pg_dump -U training_app leadership_training_prod > $DB_BACKUP_FILE

# Compress backup
gzip $DB_BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR/database -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${DB_BACKUP_FILE}.gz"
EOF

chmod +x backup.sh

# Setup cron jobs
log_info "Setting up cron jobs..."
(crontab -l 2>/dev/null; echo "0 2 * * * /home/$USER/TrainingBuilderv4/backup.sh") | crontab -

# Setup SSL certificate placeholder
log_info "Setting up SSL certificate preparation..."
echo "📝 SSL Setup Instructions:"
echo "1. Update your DNS to point api.events.8531.ca to this VPS IP"
echo "2. Run: sudo certbot certonly --standalone -d api.events.8531.ca"
echo "3. Copy certificates to nginx/ssl directory"
echo ""

# Download project files from GitHub (you'll need to update this)
log_info "Project structure created. Next steps:"
echo "1. Clone your repository: git clone <your-repo-url> ."
echo "2. Update nginx/ssl with your SSL certificates"
echo "3. Add your API keys to .env.production"
echo "4. Run: docker-compose -f docker-compose.prod.yml up -d"
echo ""

log_info "VPS setup completed successfully!"
log_warning "Please:"
echo "  - Add your API keys to .env.production"
echo "  - Update DNS records for api.events.8531.ca"
echo "  - Obtain SSL certificates"
echo "  - Clone your repository and start the services"

echo ""
echo "🔧 Your secure passwords/secrets (save these in a password manager):"
echo "Database password: $DB_PASSWORD"
echo "JWT secret: $JWT_SECRET"
echo "JWT refresh secret: $JWT_REFRESH_SECRET"