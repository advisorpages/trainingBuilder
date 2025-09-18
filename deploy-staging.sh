#!/bin/bash

# Leadership Training App - Staging Deployment Script
echo "🚀 Deploying Leadership Training App to Staging..."

# Check if QR_CLOUD_API_KEY is set
if [ -z "$QR_CLOUD_API_KEY" ]; then
    echo "❌ ERROR: QR_CLOUD_API_KEY environment variable is not set!"
    echo "Please set your qrcodes.at API key:"
    echo "export QR_CLOUD_API_KEY=your_actual_api_key_here"
    echo "Then run this script again."
    exit 1
fi

echo "✅ QR_CLOUD_API_KEY is set"

# Stop any existing staging containers
echo "🛑 Stopping existing staging containers..."
docker-compose -f docker-compose.staging.yml down

# Build and start staging environment
echo "🔨 Building and starting staging environment..."
docker-compose -f docker-compose.staging.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service health..."
docker-compose -f docker-compose.staging.yml ps

# Show logs for troubleshooting
echo "📋 Recent logs:"
docker-compose -f docker-compose.staging.yml logs --tail=20

echo ""
echo "🎉 Staging deployment complete!"
echo ""
echo "📱 Access URLs:"
echo "Frontend: http://localhost:3001"
echo "Backend:  http://localhost:3002"
echo "Database: localhost:5433"
echo ""
echo "🧪 To test QR code functionality:"
echo "1. Create a session and publish it"
echo "2. Check admin QR management: http://localhost:3001/admin/qr-codes"
echo "3. Use a mobile device to scan generated QR codes"
echo ""
echo "📊 To view logs: docker-compose -f docker-compose.staging.yml logs -f"
echo "🛑 To stop staging: docker-compose -f docker-compose.staging.yml down"