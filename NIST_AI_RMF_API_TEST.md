# NIST AI RMF API Testing Guide

## Quick Test: POST /api/ai-rmf/systems

### Prerequisites
You need a valid JWT token. Get one by:

1. **Request Magic Link:**
```bash
curl -X POST http://localhost:3001/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

2. **Verify Magic Link** (or use devToken from step 1 in development):
```bash
curl -X POST http://localhost:3001/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "your-magic-link-token"}'
```

This returns `accessToken` - use this for authentication.

### Create AI System

**Endpoint:** `POST /api/ai-rmf/systems`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
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
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:3001/api/ai-rmf/systems \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
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
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": "uuid-here",
  "organizationId": "org-uuid",
  "name": "Medical Diagnosis AI System",
  "description": "AI system for medical image diagnosis and analysis",
  "systemType": "Machine Learning",
  "useCase": "Radiology image analysis for early disease detection",
  "deploymentContext": "Healthcare",
  "lifecycleStage": "Deploy_and_Operate",
  "autonomyLevel": "Human_in_Loop",
  "status": "In_Development",
  "riskLevel": null,
  "overallTrustworthinessScore": null,
  "metadata": {
    "modelType": "Deep Learning",
    "trainingData": "Medical imaging datasets",
    "compliance": ["HIPAA", "FDA"]
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**What Happens Automatically:**
When you create an AI system, the service automatically:
1. ✅ Creates all 4 core functions (GOVERN, MAP, MEASURE, MANAGE)
2. ✅ Initializes categories for each function
3. ✅ Initializes subcategories for each category
4. ✅ Creates all 7 trustworthiness characteristics
5. ✅ Initializes all 5 lifecycle stages

### Using the Test Script

**Option 1: With token as argument**
```bash
node test_ai_rmf_create.js YOUR_JWT_TOKEN
```

**Option 2: With environment variable**
```bash
export TOKEN=YOUR_JWT_TOKEN
node test_ai_rmf_create.js
```

### Other Useful Endpoints

**Get all AI systems:**
```bash
curl -X GET http://localhost:3001/api/ai-rmf/systems \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get specific AI system:**
```bash
curl -X GET http://localhost:3001/api/ai-rmf/systems/{systemId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get dashboard data:**
```bash
curl -X GET http://localhost:3001/api/ai-rmf/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Update subcategory:**
```bash
curl -X PATCH http://localhost:3001/api/ai-rmf/subcategories/{subcategoryId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "Completed",
    "evidence": "Documentation of bias testing",
    "notes": "Bias testing completed successfully"
  }'
```

**Create assessment:**
```bash
curl -X POST http://localhost:3001/api/ai-rmf/systems/{systemId}/assessments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "assessmentType": "Pre_Deployment",
    "assessedBy": "user-id",
    "overallScore": 85,
    "functionScores": {
      "GOVERN": 90,
      "MAP": 85,
      "MEASURE": 80,
      "MANAGE": 85
    },
    "characteristicScores": {
      "Valid_and_Reliable": 90,
      "Safe": 85,
      "Secure_and_Resilient": 80,
      "Accountable_and_Transparent": 85,
      "Explainable_and_Interpretable": 75,
      "Privacy_Enhanced": 90,
      "Fair_with_Bias_Managed": 85
    },
    "findings": {
      "strengths": ["Strong governance", "Comprehensive risk mapping"],
      "weaknesses": ["Explainability needs improvement"]
    },
    "recommendations": [
      "Implement additional explainability features",
      "Conduct regular bias audits"
    ]
  }'
```

### Field Descriptions

**Required Fields:**
- `name` (string): Name of the AI system
- `systemType` (string): Type of AI system (e.g., "Machine Learning", "Generative AI", "Decision Support")

**Optional Fields:**
- `description` (string): Detailed description
- `useCase` (string): Specific use case
- `deploymentContext` (string): Deployment context (e.g., "Healthcare", "Finance", "Manufacturing")
- `lifecycleStage` (string): Current lifecycle stage (default: "Plan_and_Design")
  - Options: "Plan_and_Design", "Collect_and_Process", "Build_and_Validate", "Deploy_and_Operate", "Monitor_and_Maintain"
- `autonomyLevel` (string): Autonomy level (default: "Human_in_Loop")
  - Options: "Fully_Autonomous", "Human_in_Loop", "Human_Override", "Fully_Manual"
- `metadata` (object): Additional metadata as JSON

### Error Responses

**401 Unauthorized:**
```json
{
  "error": "No token provided"
}
```

**400 Bad Request:**
```json
{
  "error": "Failed to create AI system: [error details]"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to create AI system"
}
```

