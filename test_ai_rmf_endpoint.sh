#!/bin/bash

# Test script for NIST AI RMF POST /api/ai-rmf/systems endpoint
# This script demonstrates how to create an AI system

API_URL="http://localhost:3001/api"
EMAIL="test@example.com"  # Change this to your test email

echo "=== NIST AI RMF API Test ==="
echo ""

# Step 1: Request Magic Link (or use existing token)
echo "Step 1: Requesting magic link for authentication..."
MAGIC_LINK_RESPONSE=$(curl -s -X POST "${API_URL}/auth/magic-link" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${EMAIL}\"}")

echo "Magic Link Response: $MAGIC_LINK_RESPONSE"
echo ""

# Extract dev token if in development mode
DEV_TOKEN=$(echo $MAGIC_LINK_RESPONSE | grep -o '"devToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$DEV_TOKEN" ]; then
  echo "⚠️  No dev token found. Please check your email for the magic link."
  echo "   Or if you have an existing token, set it as TOKEN environment variable:"
  echo "   export TOKEN='your-jwt-token'"
  echo ""
  read -p "Do you have a token? Enter it here (or press Enter to exit): " TOKEN
  if [ -z "$TOKEN" ]; then
    echo "Exiting. Please authenticate first."
    exit 1
  fi
else
  TOKEN=$DEV_TOKEN
  echo "✓ Using dev token for authentication"
fi

echo ""
echo "Step 2: Creating AI System..."
echo ""

# Step 2: Create AI System
CREATE_RESPONSE=$(curl -s -X POST "${API_URL}/ai-rmf/systems" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "name": "Medical Diagnosis AI System",
    "description": "AI system for medical image diagnosis and analysis",
    "systemType": "Machine Learning",
    "useCase": "Radiology image analysis for early disease detection",
    "deploymentContext": "Healthcare",
    "lifecycleStage": "Deploy_and_Operate",
    "autonomyLevel": "Human_in_Loop",
    "metadata": {
      "modelType": "Deep Learning",
      "trainingData": "Medical imaging datasets",
      "compliance": ["HIPAA", "FDA"]
    }
  }')

echo "Response:"
echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"
echo ""

# Check if successful
if echo "$CREATE_RESPONSE" | grep -q '"id"'; then
  AI_SYSTEM_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "✅ AI System created successfully!"
  echo "   System ID: $AI_SYSTEM_ID"
  echo ""
  echo "You can now:"
  echo "  - View the system: GET ${API_URL}/ai-rmf/systems/${AI_SYSTEM_ID}"
  echo "  - Get dashboard: GET ${API_URL}/ai-rmf/dashboard"
else
  echo "❌ Failed to create AI System"
  echo "   Error details above"
fi

