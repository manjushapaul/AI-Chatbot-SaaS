#!/bin/bash

echo "🚀 Setting up local PostgreSQL database..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if the container already exists
if docker ps -a --format "table {{.Names}}" | grep -q "ai-chatbot-db"; then
    echo "📦 Database container already exists. Starting it..."
    docker start ai-chatbot-db
else
    echo "🐘 Creating new PostgreSQL database container..."
    docker run -d \
        --name ai-chatbot-db \
        -e POSTGRES_DB=ai_chatbot_saas \
        -e POSTGRES_USER=admin \
        -e POSTGRES_PASSWORD=password123 \
        -p 5432:5432 \
        postgres:15
fi

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Test connection
if docker exec ai-chatbot-db pg_isready -U admin -d ai_chatbot_saas > /dev/null 2>&1; then
    echo "✅ Database is ready!"
    echo ""
    echo "📋 Database Connection Details:"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   Database: ai_chatbot_saas"
    echo "   Username: admin"
    echo "   Password: password123"
    echo ""
    echo "🔗 Connection URL: postgresql://admin:password123@localhost:5432/ai_chatbot_saas"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Copy the connection URL above"
    echo "   2. Create a .env file with DATABASE_URL"
    echo "   3. Run: npx prisma migrate dev"
    echo "   4. Run: node scripts/setup-test-account.js"
else
    echo "❌ Database connection failed. Please check Docker logs:"
    echo "   docker logs ai-chatbot-db"
fi 