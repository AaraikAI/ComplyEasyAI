# NIST AI RMF 1.0 Implementation

## Overview

This document describes the complete implementation of the NIST AI Risk Management Framework (AI RMF 1.0) based on NIST AI 100-1. The implementation provides a comprehensive system for managing AI risks across the entire AI system lifecycle.

## Database Schema

### Core Tables

1. **AISystem** - Main entity for AI systems
   - Tracks AI system metadata, lifecycle stage, autonomy level, and overall trustworthiness score
   - Links to all other AI RMF entities

2. **AIRMFCoreFunction** - The 4 core functions
   - GOVERN: Develop organizational culture and structure
   - MAP: Understand context and characterize risks
   - MEASURE: Quantify, benchmark, and monitor risks
   - MANAGE: Prioritize and respond to risks

3. **AIRMFCategory** - Categories within each core function
   - Each function has multiple categories (e.g., GOV-1, MAP-1, MEAS-1, MAN-1)

4. **AIRMFSubcategory** - Subcategories within each category
   - Detailed implementation requirements
   - Supports evidence, ownership, and status tracking

5. **AIRMFTrustworthinessCharacteristic** - The 7 trustworthiness characteristics
   - Valid and Reliable
   - Safe
   - Secure and Resilient
   - Accountable and Transparent
   - Explainable and Interpretable
   - Privacy-Enhanced
   - Fair with Harmful Bias Managed

6. **AIRMFLifecycleStage** - AI lifecycle stages
   - Plan and Design
   - Collect and Process
   - Build and Validate
   - Deploy and Operate
   - Monitor and Maintain

7. **AIRMFActor** - AI actors across the lifecycle
   - Developers, Operators, Evaluators, Decision Makers, End Users, etc.

8. **AIRMFAssessment** - Assessments for AI systems
   - Initial, Periodic, Post-Incident, Pre-Deployment assessments

9. **AIRMFProfile** - Context-specific profiles
   - Custom profiles for different use cases and sectors

10. **AIRMFRiskActivity** - Risk management activities
    - Risk identification, analysis, evaluation, treatment, and monitoring

## API Endpoints

### AI System Management

- `POST /api/ai-rmf/systems` - Create a new AI system
- `GET /api/ai-rmf/systems` - List all AI systems (with filters)
- `GET /api/ai-rmf/systems/:id` - Get AI system details
- `PATCH /api/ai-rmf/systems/:id` - Update AI system
- `DELETE /api/ai-rmf/systems/:id` - Delete AI system

### Core Functions

- `PATCH /api/ai-rmf/systems/:aiSystemId/functions/:functionName` - Update core function

### Categories and Subcategories

- `PATCH /api/ai-rmf/categories/:categoryId` - Update category
- `PATCH /api/ai-rmf/subcategories/:subcategoryId` - Update subcategory

### Trustworthiness Characteristics

- `PATCH /api/ai-rmf/systems/:aiSystemId/trustworthiness/:characteristic` - Update trustworthiness characteristic

### Lifecycle Stages

- `PATCH /api/ai-rmf/systems/:aiSystemId/lifecycle/:stage` - Update lifecycle stage

### AI Actors

- `POST /api/ai-rmf/systems/:aiSystemId/actors` - Add AI actor
- `DELETE /api/ai-rmf/actors/:actorId` - Remove AI actor

### Assessments

- `POST /api/ai-rmf/systems/:aiSystemId/assessments` - Create assessment
- `GET /api/ai-rmf/systems/:aiSystemId/assessments` - Get assessments

### Profiles

- `POST /api/ai-rmf/systems/:aiSystemId/profiles` - Create profile

### Risk Activities

- `POST /api/ai-rmf/systems/:aiSystemId/risk-activities` - Create risk activity
- `PATCH /api/ai-rmf/risk-activities/:riskActivityId` - Update risk activity

### Analytics

- `POST /api/ai-rmf/systems/:aiSystemId/calculate-trustworthiness` - Calculate overall trustworthiness score
- `GET /api/ai-rmf/dashboard` - Get dashboard statistics

## Service Layer

The `aiRmfService.ts` provides comprehensive business logic for:

1. **AI System Management**
   - Creating and managing AI systems
   - Automatic initialization of core functions, categories, subcategories, trustworthiness characteristics, and lifecycle stages

2. **Core Functions Management**
   - Updating core function status and completion percentage
   - Managing categories and subcategories

3. **Trustworthiness Assessment**
   - Managing trustworthiness characteristics
   - Calculating overall trustworthiness scores

4. **Lifecycle Management**
   - Tracking AI system through lifecycle stages
   - Managing stage-specific risks and activities

5. **Actor Management**
   - Adding and removing AI actors
   - Tracking responsibilities and involvement stages

6. **Assessment Management**
   - Creating and managing assessments
   - Tracking assessment history

7. **Profile Management**
   - Creating context-specific profiles
   - Customizing framework implementation

8. **Risk Activity Management**
   - Creating and tracking risk activities
   - Managing mitigation plans

9. **Analytics**
   - Dashboard statistics
   - Trustworthiness score calculation

## Database Migration

To apply the database schema, run:

```sql
-- Execute the SQL migration file
\i server/prisma/migrations/nist_ai_rmf_tables.sql
```

Or use Prisma:

```bash
npx prisma migrate dev --name nist_ai_rmf
npx prisma generate
```

## Usage Example

### Creating an AI System

```typescript
POST /api/ai-rmf/systems
{
  "name": "Medical Diagnosis AI",
  "description": "AI system for medical image diagnosis",
  "systemType": "Machine Learning",
  "useCase": "Radiology image analysis",
  "deploymentContext": "Healthcare",
  "lifecycleStage": "Deploy_and_Operate",
  "autonomyLevel": "Human_in_Loop"
}
```

### Updating a Subcategory

```typescript
PATCH /api/ai-rmf/subcategories/:subcategoryId
{
  "status": "Completed",
  "evidence": "Documentation of bias testing procedures",
  "evidenceUrl": "https://example.com/evidence.pdf",
  "ownerId": "user-id",
  "notes": "Bias testing completed with satisfactory results"
}
```

### Creating an Assessment

```typescript
POST /api/ai-rmf/systems/:aiSystemId/assessments
{
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
    "strengths": ["Strong governance structure", "Comprehensive risk mapping"],
    "weaknesses": ["Explainability needs improvement"]
  },
  "recommendations": [
    "Implement additional explainability features",
    "Conduct regular bias audits"
  ]
}
```

## Key Features

1. **Comprehensive Framework Coverage**
   - All 4 core functions (GOVERN, MAP, MEASURE, MANAGE)
   - All categories and subcategories
   - All 7 trustworthiness characteristics
   - Complete lifecycle management

2. **Automatic Initialization**
   - When an AI system is created, all core functions, categories, subcategories, trustworthiness characteristics, and lifecycle stages are automatically initialized

3. **Flexible Assessment**
   - Support for multiple assessment types
   - Detailed scoring at function and characteristic levels
   - Recommendations and findings tracking

4. **Profile Support**
   - Context-specific profiles for different use cases
   - Customizable framework implementation

5. **Risk Management**
   - Comprehensive risk activity tracking
   - Mitigation plan management
   - Evidence collection

6. **Analytics and Reporting**
   - Dashboard statistics
   - Trustworthiness score calculation
   - Progress tracking

## Files Created

1. `server/prisma/schema.prisma` - Updated with NIST AI RMF models
2. `server/prisma/migrations/nist_ai_rmf_tables.sql` - SQL migration file
3. `server/src/services/aiRmfService.ts` - Service layer
4. `server/src/controllers/aiRmfController.ts` - Controller layer
5. `server/src/routes/aiRmf.ts` - Route definitions
6. `server/src/index.ts` - Updated to include AI RMF routes

## Next Steps

1. Run database migration
2. Generate Prisma client: `npx prisma generate`
3. Test API endpoints
4. Create frontend components (optional)
5. Add comprehensive NIST AI RMF category/subcategory data (currently simplified)

## References

- NIST AI 100-1: Artificial Intelligence Risk Management Framework (AI RMF 1.0)
- https://doi.org/10.6028/NIST.AI.100-1

