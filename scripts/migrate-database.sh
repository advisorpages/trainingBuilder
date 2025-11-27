#!/bin/bash

# Database Migration Script - Local to VPS
# This script helps migrate your local database to the VPS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

# Configuration
CONTAINER_NAME="leadership-training-db"
BACKUP_FILE="production_backup.sql"
VPS_BACKUP_FILE="vps_database_backup.sql"

# Function to backup local database
backup_local_database() {
    log_step "Step 1: Creating local database backup..."

    # Check if local container is running
    if ! docker ps | grep -q $CONTAINER_NAME; then
        log_error "Local database container is not running. Please start it first:"
        echo "docker-compose up -d database"
        exit 1
    fi

    # Create backup
    log_info "Backing up local database to $BACKUP_FILE..."
    docker exec $CONTAINER_NAME pg_dump -U postgres leadership_training > $BACKUP_FILE

    if [ $? -eq 0 ]; then
        log_info "✅ Local database backup created successfully"
        log_info "📁 Backup file size: $(du -h $BACKUP_FILE | cut -f1)"
    else
        log_error "❌ Failed to create local database backup"
        exit 1
    fi
}

# Function to show VPS import instructions
show_vps_import_instructions() {
    log_step "Step 2: VPS Database Setup Instructions"
    echo ""
    log_info "📋 On your VPS, run these commands:"
    echo ""
    echo "# 1. Connect to your VPS"
    echo "ssh your-vps-user@your-vps-ip"
    echo ""
    echo "# 2. Navigate to project directory"
    echo "cd /home/your-user/TrainingBuilderv4"
    echo ""
    echo "# 3. Copy the backup file from your local machine"
    echo "#    (Run this command from your LOCAL machine):"
    echo "scp $BACKUP_FILE your-vps-user@your-vps-ip:/home/your-vps-user/TrainingBuilderv4/"
    echo ""
    echo "# 4. On VPS: Import the database"
    echo "#    First, make sure the database container is not running:"
    echo "docker-compose -f docker-compose.prod.yml down database"
    echo ""
    echo "#    Then import the backup:"
    echo "docker run --rm -v \$(pwd):/backup postgres:15-alpine psql -h your-vps-ip -U training_app -d leadership_training_prod < /backup/$BACKUP_FILE"
    echo ""
    echo "# 5. On VPS: Restart the database container"
    echo "docker-compose -f docker-compose.prod.yml up -d database"
    echo ""
    echo "# 6. Verify the migration"
    echo "docker exec leadership-training-db-prod psql -U training_app -d leadership_training_prod -c \"SELECT COUNT(*) FROM sessions;\""
    echo ""
}

# Function to create a more detailed backup script for VPS
create_vps_migration_script() {
    log_step "Creating VPS migration helper script..."

    cat > vps-migration-helper.sh << 'EOF'
#!/bin/bash

# VPS Migration Helper Script
# Run this on your VPS after copying the backup file

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}ℹ️  $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

BACKUP_FILE="production_backup.sql"

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file $BACKUP_FILE not found. Please copy it from your local machine first."
    exit 1
fi

log_info "Starting database migration on VPS..."

# Stop existing database container
log_warning "Stopping existing database container..."
docker-compose -f docker-compose.prod.yml down database

# Wait for container to stop
sleep 10

# Import the backup
log_info "Importing database backup..."
docker run --rm \
    -v $(pwd):/backup \
    --network trainingbuilderv4_app-network \
    postgres:15-alpine \
    psql -h database \
    -U training_app \
    -d leadership_training_prod \
    -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" || true

docker run --rm \
    -v $(pwd):/backup \
    --network trainingbuilderv4_app-network \
    postgres:15-alpine \
    psql -h database \
    -U training_app \
    -d leadership_training_prod < /backup/$BACKUP_FILE

if [ $? -eq 0 ]; then
    log_info "✅ Database import completed successfully"
else
    log_error "❌ Database import failed"
    exit 1
fi

# Restart database container
log_info "Restarting database container..."
docker-compose -f docker-compose.prod.yml up -d database

# Wait for database to be ready
log_info "Waiting for database to be ready..."
sleep 30

# Verify migration
log_info "Verifying migration..."
if docker exec leadership-training-db-prod psql -U training_app -d leadership_training_prod -c "SELECT COUNT(*) FROM sessions;" > /dev/null 2>&1; then
    SESSION_COUNT=$(docker exec leadership-training-db-prod psql -U training_app -d leadership_training_prod -t -c "SELECT COUNT(*) FROM sessions;" | tr -d ' ')
    log_info "✅ Migration verified! Found $SESSION_COUNT sessions in database"
else
    log_warning "⚠️ Could not verify session count, but migration completed"
fi

log_info "🎉 VPS database migration completed!"
log_info "You can now start your backend service with:"
echo "docker-compose -f docker-compose.prod.yml up -d backend"

# Clean up backup file
read -p "Remove backup file $BACKUP_FILE? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm $BACKUP_FILE
    log_info "Backup file removed"
fi
EOF

    chmod +x vps-migration-helper.sh
    log_info "✅ VPS migration helper script created: vps-migration-helper.sh"
}

# Main execution
main() {
    log_info "🚀 Database Migration Assistant"
    echo ""
    log_info "This script will help you migrate your local PostgreSQL database to the VPS."
    echo ""

    read -p "Continue with database migration? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Migration cancelled"
        exit 0
    fi

    backup_local_database
    show_vps_import_instructions
    create_vps_migration_script

    echo ""
    log_info "📦 Migration package created:"
    echo "  - Local backup: $BACKUP_FILE"
    echo "  - VPS helper script: vps-migration-helper.sh"
    echo ""
    log_warning "⚠️  Important: Save a copy of $BACKUP_FILE as a backup before proceeding!"
    echo ""
    log_info "🔄 Next steps:"
    echo "  1. Copy $BACKUP_FILE to your VPS"
    echo "  2. Copy vps-migration-helper.sh to your VPS"
    echo "  3. Run vps-migration-helper.sh on your VPS"
    echo "  4. Start your production services"
    echo ""
}

# Run main function
main