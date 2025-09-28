#!/bin/bash

echo "🚀 Pathao Integration Testing Setup"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your Pathao credentials."
    echo ""
    echo "Required variables:"
    echo "PATHAO_BASE_URL=https://courier-api-sandbox.pathao.com"
    echo "PATHAO_CLIENT_ID=7N1aMJQbWm"
    echo "PATHAO_CLIENT_SECRET=wRcaibZkUdSNz2EI9ZyuXLlNrnAv0TdPUPXMnD39"
    echo "PATHAO_USERNAME=test@pathao.com"
    echo "PATHAO_PASSWORD=lovePathao"
    echo "PATHAO_STORE_ID=your_store_id"
    echo ""
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check if required environment variables are set
echo "🔍 Checking environment variables..."

if grep -q "PATHAO_BASE_URL" .env; then
    echo "✅ PATHAO_BASE_URL is set"
else
    echo "❌ PATHAO_BASE_URL is missing"
fi

if grep -q "PATHAO_CLIENT_ID" .env; then
    echo "✅ PATHAO_CLIENT_ID is set"
else
    echo "❌ PATHAO_CLIENT_ID is missing"
fi

if grep -q "PATHAO_CLIENT_SECRET" .env; then
    echo "✅ PATHAO_CLIENT_SECRET is set"
else
    echo "❌ PATHAO_CLIENT_SECRET is missing"
fi

if grep -q "PATHAO_USERNAME" .env; then
    echo "✅ PATHAO_USERNAME is set"
else
    echo "❌ PATHAO_USERNAME is missing"
fi

if grep -q "PATHAO_PASSWORD" .env; then
    echo "✅ PATHAO_PASSWORD is set"
else
    echo "❌ PATHAO_PASSWORD is missing"
fi

if grep -q "PATHAO_STORE_ID" .env; then
    echo "✅ PATHAO_STORE_ID is set"
else
    echo "❌ PATHAO_STORE_ID is missing"
fi

echo ""
echo "🧪 Running Pathao Integration Test..."
echo "====================================="
echo ""

# Run the test script
node test_pathao.js

echo ""
echo "📋 Testing Options:"
echo "==================="
echo "1. Test Script: node test_pathao.js"
echo "2. Postman Collection: Import Pathao_API_Collection.postman_collection.json"
echo "3. Manual API Testing: Use the endpoints in PATHAO_INTEGRATION.md"
echo ""
echo "📚 Documentation:"
echo "================="
echo "- PATHAO_INTEGRATION.md - Complete API documentation"
echo "- PATHAO_TESTING_GUIDE.md - Testing instructions"
echo "- PATHAO_ENV_CONFIG.md - Environment setup guide"
echo ""
echo "🎉 Setup complete! Happy testing!"
