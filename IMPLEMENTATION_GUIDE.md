# ComplyEasy AI - Complete Implementation Guide
## Production-Ready Development Roadmap

---

## 🎯 CURRENT STATUS

### ✅ Completed (As of December 7, 2024):
1. **Audit Logger** - Full implementation (`/server/src/utils/auditLogger.ts`)
2. **Type Helpers** - Express async handler types (`/server/src/types/express.ts`)
3. **Personnel Routes** - Fixed with proper async wrappers
4. **Vendors Routes** - Fixed with proper async wrappers
5. **Smart Quotes** - All fixed in services
6. **Prisma Schema** - Enhanced with audit fields

### ⚠️ In Progress:
- Fixing remaining route files with type wrappers

### ❌ Remaining Work:
- 50+ route files to fix
- Test infrastructure setup
- Frontend components
- WebSocket integration
- Email notifications
- Production hardening

---

## 📋 PHASE-BY-PHASE IMPLEMENTATION

### PHASE 1: Fix TypeScript Compilation (4-6 hours)

#### Step 1.1: Fix Remaining Route Files

Apply the same pattern used in `personnel.ts` and `vendors.ts` to all routes:

**Files to Fix** (in priority order):
1. ✅ `routes/personnel.ts` - DONE
2. ✅ `routes/vendors.ts` - DONE
3. `routes/enterprise.ts` (568 lines, 8 sub-routers)
4. `routes/ai.ts`
5. `routes/auth.ts`
6. `routes/billing.ts`
7. `routes/frameworks.ts`
8. `routes/integrations.ts`
9. `routes/risks.ts`
10. `routes/twoFactor.ts`

**Pattern to Apply**:
```typescript
// BEFORE (causes type errors):
router.post('/endpoint', async (req, res) => {
  try {
    const result = await service.method(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// AFTER (type-safe):
import { authAsyncHandler, AuthenticatedRequest } from '../types/express';

router.post(
  '/endpoint',
  authAsyncHandler(async (req: AuthenticatedRequest, res) => {
    const result = await service.method(req.body);
    res.json(result);
  })
);
```

**Key Points**:
- Use `authAsyncHandler` wrapper for authenticated routes
- Use `AuthenticatedRequest` type for `req` parameter
- Remove try/catch blocks (handled by wrapper)
- Access user via `req.user.id` instead of `(req as any).user.id`

#### Step 1.2: Fix Controllers

**Files to Fix**:
1. `controllers/aiController.ts`
2. `controllers/authController.ts`
3. `controllers/billingController.ts`
4. `controllers/frameworksController.ts`
5. `controllers/integrationsController.ts`
6. `controllers/risksController.ts`
7. `controllers/twoFactorController.ts`

**Common Issues**:
- Direct `prisma.auditLog.create()` calls need updated fields
- Missing `resourceType` and `resourceId` fields
- Type mismatches in Prisma queries

**Fix Pattern**:
```typescript
// BEFORE:
await prisma.auditLog.create({
  data: {
    action: 'user.login',
    userId: user.id,
    organizationId: org.id,
    hash: someHash,
  },
});

// AFTER:
await prisma.auditLog.create({
  data: {
    action: 'user.login',
    resourceType: 'User',
    resourceId: user.id,
    userId: user.id,
    organizationId: org.id,
    hash: someHash,
  },
});
```

#### Step 1.3: Update Middleware

**File**: `middleware/auth.ts`

**Issue**: Route handler type mismatches
**Fix**: Use proper Express types and async wrappers

#### Step 1.4: Verify Build

```bash
npm run build
```

**Success Criteria**: Zero TypeScript errors

---

### PHASE 2: Testing Infrastructure (20-30 hours)

#### Step 2.1: Install Test Dependencies

```bash
npm install --save-dev \
  jest@^29.7.0 \
  ts-jest@^29.1.0 \
  @types/jest@^29.5.0 \
  supertest@^6.3.3 \
  @types/supertest@^2.0.12 \
  @faker-js/faker@^8.0.0
```

#### Step 2.2: Create Jest Configuration

**File**: `/server/jest.config.js`
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};
```

#### Step 2.3: Create Test Setup

**File**: `/server/src/__tests__/setup.ts`
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clear test data
  // Be careful - only in test environment!
  if (process.env.NODE_ENV === 'test') {
    await prisma.auditLog.deleteMany({});
    await prisma.personnel.deleteMany({});
    await prisma.vendor.deleteMany({});
    // ... other cleanup
  }
});
```

#### Step 2.4: Create Test Environment File

**File**: `/server/.env.test`
```bash
DATABASE_URL="postgresql://testuser:testpass@localhost:5432/complyeasy_test?schema=public"
JWT_SECRET="test-jwt-secret-key"
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
GEMINI_API_KEY="test-api-key"
NODE_ENV="test"
```

#### Step 2.5: Write Unit Tests

**Create 11 test files** in `/server/src/__tests__/services/`:

##### Example: `personnelService.test.ts`

```typescript
import personnelService from '../../services/personnelService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('PersonnelService', () => {
  describe('createPersonnel', () => {
    it('should create personnel record successfully', async () => {
      const data = {
        userId: 'user-123',
        organizationId: 'org-123',
        systemAccess: { crm: true },
        backgroundCheck: true,
      };

      const result = await personnelService.createPersonnel(data);

      expect(result).toBeDefined();
      expect(result.userId).toBe(data.userId);
      expect(result.onboardingStatus).toBe('In_Progress');
    });

    it('should log audit event', async () => {
      // Test audit logging
      const auditLogs = await prisma.auditLog.findMany({
        where: { action: 'personnel.onboarding.started' },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('should handle missing required fields', async () => {
      await expect(
        personnelService.createPersonnel({} as any)
      ).rejects.toThrow();
    });
  });

  describe('completeOnboarding', () => {
    it('should mark personnel as completed', async () => {
      // Create test personnel first
      const personnel = await personnelService.createPersonnel({
        userId: 'user-456',
        organizationId: 'org-123',
      });

      // Complete onboarding
      const completed = await personnelService.completeOnboarding(
        personnel.id,
        'user-456',
        'org-123'
      );

      expect(completed.onboardingStatus).toBe('Completed');
    });

    it('should activate user', async () => {
      // Test user activation logic
    });
  });

  describe('startOffboarding', () => {
    it('should deactivate user', async () => {
      // Test offboarding logic
    });

    it('should trigger access review', async () => {
      // Test access review creation
    });
  });

  // Add 10+ more test cases...
});
```

**Repeat for all 11 services**:
1. `personnelService.test.ts` (~200 lines)
2. `vendorRiskService.test.ts` (~300 lines)
3. `riskManagementService.test.ts` (~250 lines)
4. `questionnaireService.test.ts` (~200 lines)
5. `policyLibraryService.test.ts` (~150 lines)
6. `trustCenterService.test.ts` (~150 lines)
7. `multiWorkspaceService.test.ts` (~200 lines)
8. `reportingService.test.ts` (~200 lines)
9. `monitoringService.test.ts` (~250 lines)
10. `issueManagementService.test.ts` (~200 lines)
11. `visionaryAIService.test.ts` (~300 lines)

#### Step 2.6: Write Integration Tests

**Create directory**: `/server/src/__tests__/integration/`

**Example**: `integration/personnel.api.test.ts`
```typescript
import request from 'supertest';
import app from '../../index';
import { generateToken } from '../../middleware/auth';

describe('Personnel API Integration Tests', () => {
  let authToken: string;
  let testOrgId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user and get token
    authToken = generateToken({
      id: 'test-user-123',
      organizationId: 'test-org-123',
      role: 'admin',
    });

    testUserId = 'test-user-123';
    testOrgId = 'test-org-123';
  });

  describe('POST /api/personnel', () => {
    it('should create personnel with valid auth', async () => {
      const response = await request(app)
        .post('/api/personnel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId,
          organizationId: testOrgId,
          backgroundCheck: true,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .post('/api/personnel')
        .send({});

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/personnel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/personnel', () => {
    it('should return all personnel for organization', async () => {
      const response = await request(app)
        .get('/api/personnel')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // Add tests for all endpoints...
});
```

**Create 11 integration test files** for all modules.

#### Step 2.7: Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test personnel.test.ts

# Watch mode
npm test -- --watch
```

**Success Criteria**:
- All tests pass
- 80%+ code coverage
- No flaky tests

---

### PHASE 3: WebSocket Integration (4-6 hours)

#### Step 3.1: Create WebSocket Event Emitter

**File**: `/server/src/utils/websocketEmitter.ts`
```typescript
import websocketService from '../services/websocketService';

/**
 * Centralized WebSocket event emission
 */
export class WebSocketEmitter {
  /**
   * Emit issue events
   */
  static emitIssueCreated(organizationId: string, issue: any) {
    websocketService.emitToOrganization(organizationId, 'issue:created', {
      issueId: issue.id,
      title: issue.title,
      priority: issue.priority,
      assignedTo: issue.assignedToId,
    });
  }

  static emitIssueAssigned(organizationId: string, issue: any) {
    websocketService.emitToOrganization(organizationId, 'issue:assigned', {
      issueId: issue.id,
      assignedTo: issue.assignedToId,
    });

    // Also emit to specific user
    if (issue.assignedToId) {
      websocketService.emitToUser(issue.assignedToId, 'notification', {
        type: 'issue_assigned',
        message: `You've been assigned: ${issue.title}`,
        issueId: issue.id,
      });
    }
  }

  static emitSLABreach(organizationId: string, issue: any) {
    websocketService.emitToOrganization(organizationId, 'issue:sla_breach', {
      issueId: issue.id,
      title: issue.title,
      priority: issue.priority,
    });
  }

  /**
   * Emit monitor events
   */
  static emitMonitorFailed(organizationId: string, monitor: any) {
    websocketService.emitToOrganization(organizationId, 'monitor:failed', {
      monitorId: monitor.id,
      name: monitor.name,
      monitorType: monitor.monitorType,
      failedTests: monitor.failedTests,
    });
  }

  static emitAutoRemediation(organizationId: string, monitor: any, actions: any) {
    websocketService.emitToOrganization(organizationId, 'monitor:auto_remediated', {
      monitorId: monitor.id,
      name: monitor.name,
      actions: actions,
    });
  }

  /**
   * Emit risk events
   */
  static emitRiskCreated(organizationId: string, risk: any) {
    websocketService.emitToOrganization(organizationId, 'risk:created', {
      riskId: risk.id,
      title: risk.title,
      severity: risk.severity,
    });
  }

  static emitCriticalRisk(organizationId: string, risk: any) {
    websocketService.emitToOrganization(organizationId, 'risk:critical', {
      riskId: risk.id,
      title: risk.title,
      riskScore: risk.riskScore,
    });
  }

  /**
   * Emit vendor events
   */
  static emitVendorRiskHigh(organizationId: string, vendor: any) {
    websocketService.emitToOrganization(organizationId, 'vendor:risk_high', {
      vendorId: vendor.id,
      vendorName: vendor.name,
      riskLevel: vendor.riskLevel,
    });
  }

  static emitVendorAssessmentDue(organizationId: string, assessment: any) {
    websocketService.emitToOrganization(organizationId, 'vendor:assessment_due', {
      assessmentId: assessment.id,
      vendorId: assessment.vendorId,
      dueDate: assessment.dueDate,
    });
  }

  /**
   * Emit compliance events
   */
  static emitComplianceScoreChanged(organizationId: string, data: any) {
    websocketService.emitToOrganization(organizationId, 'compliance:score_changed', {
      previousScore: data.previousScore,
      newScore: data.newScore,
      framework: data.framework,
    });
  }

  static emitAccessReviewDue(organizationId: string, review: any) {
    websocketService.emitToOrganization(organizationId, 'access_review:due', {
      reviewId: review.id,
      personnelId: review.personnelId,
      dueDate: review.dueDate,
    });
  }
}

export default WebSocketEmitter;
```

#### Step 3.2: Integrate into Services

Add WebSocket emissions to each service method:

**Example in `issueManagementService.ts`**:
```typescript
import WebSocketEmitter from '../utils/websocketEmitter';

async createIssue(data: any) {
  const issue = await prisma.issue.create({ data });

  // Emit WebSocket event
  WebSocketEmitter.emitIssueCreated(data.organizationId, issue);

  // Check if critical
  if (issue.priority === 'Critical') {
    WebSocketEmitter.emitCriticalIssue(data.organizationId, issue);
  }

  return issue;
}
```

#### Step 3.3: Test WebSocket Events

Create test file: `__tests__/websocket.test.ts`
```typescript
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioc, Socket } from 'socket.io-client';

describe('WebSocket Events', () => {
  let io: Server;
  let clientSocket: Socket;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      clientSocket = ioc(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  it('should receive issue:created event', (done) => {
    clientSocket.on('issue:created', (data) => {
      expect(data).toHaveProperty('issueId');
      done();
    });

    // Trigger event
    io.emit('issue:created', { issueId: '123' });
  });
});
```

---

### PHASE 4: Email Notifications (6-8 hours)

#### Step 4.1: Create Notification Service

**File**: `/server/src/services/notificationService.ts`
```typescript
import emailService from './emailService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Send access review reminder
   */
  async sendAccessReviewReminder(reviewId: string) {
    const review = await prisma.accessReview.findUnique({
      where: { id: reviewId },
      include: {
        personnel: {
          include: { user: true },
        },
        reviewer: true,
      },
    });

    if (!review || !review.reviewer) return;

    await emailService.send({
      to: review.reviewer.email,
      subject: 'Access Review Due Soon',
      template: 'access-review-reminder',
      data: {
        reviewerName: review.reviewer.name,
        personnelName: review.personnel.user.name,
        dueDate: review.dueDate,
        reviewUrl: `${process.env.APP_URL}/personnel/access-reviews/${reviewId}`,
      },
    });
  }

  /**
   * Send vendor assessment deadline notification
   */
  async sendVendorAssessmentDeadline(assessmentId: string) {
    const assessment = await prisma.vendorAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        vendor: {
          include: {
            organization: {
              include: { users: true },
            },
          },
        },
      },
    });

    if (!assessment) return;

    // Notify all admins
    const admins = assessment.vendor.organization.users.filter(
      (u) => u.role === 'admin' || u.role === 'compliance_manager'
    );

    for (const admin of admins) {
      await emailService.send({
        to: admin.email,
        subject: `Vendor Assessment Due: ${assessment.vendor.name}`,
        template: 'vendor-assessment-deadline',
        data: {
          adminName: admin.name,
          vendorName: assessment.vendor.name,
          assessmentType: assessment.assessmentType,
          dueDate: assessment.dueDate,
          assessmentUrl: `${process.env.APP_URL}/vendors/${assessment.vendorId}/assessments/${assessmentId}`,
        },
      });
    }
  }

  /**
   * Send issue assignment notification
   */
  async sendIssueAssignment(issueId: string, assigneeId: string) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { createdBy: true },
    });

    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!issue || !assignee) return;

    await emailService.send({
      to: assignee.email,
      subject: `New Issue Assigned: ${issue.title}`,
      template: 'issue-assignment',
      data: {
        assigneeName: assignee.name,
        issueTitle: issue.title,
        priority: issue.priority,
        createdBy: issue.createdBy.name,
        dueDate: issue.dueDate,
        issueUrl: `${process.env.APP_URL}/issues/${issueId}`,
      },
    });
  }

  /**
   * Send SLA breach warning
   */
  async sendSLABreachWarning(issueId: string) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        assignedTo: true,
        organization: {
          include: { users: true },
        },
      },
    });

    if (!issue) return;

    const recipients = [
      issue.assignedTo?.email,
      ...issue.organization.users
        .filter((u) => u.role === 'admin')
        .map((u) => u.email),
    ].filter(Boolean) as string[];

    for (const email of recipients) {
      await emailService.send({
        to: email,
        subject: `⚠️ SLA Breach Warning: ${issue.title}`,
        template: 'sla-breach-warning',
        data: {
          issueTitle: issue.title,
          priority: issue.priority,
          slaTarget: issue.slaTarget,
          currentStatus: issue.slaStatus,
          issueUrl: `${process.env.APP_URL}/issues/${issueId}`,
        },
      });
    }
  }

  /**
   * Send monitor failure alert
   */
  async sendMonitorFailureAlert(monitorId: string) {
    const monitor = await prisma.continuousMonitor.findUnique({
      where: { id: monitorId },
      include: {
        organization: {
          include: { users: true },
        },
        results: {
          orderBy: { runDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!monitor) return;

    const admins = monitor.organization.users.filter(
      (u) => u.role === 'admin' || u.role === 'security_engineer'
    );

    for (const admin of admins) {
      await emailService.send({
        to: admin.email,
        subject: `🚨 Monitor Failure: ${monitor.name}`,
        template: 'monitor-failure',
        data: {
          adminName: admin.name,
          monitorName: monitor.name,
          monitorType: monitor.monitorType,
          failedTests: monitor.results[0]?.failedTests || 0,
          findings: monitor.findings,
          monitorUrl: `${process.env.APP_URL}/monitoring/${monitorId}`,
        },
      });
    }
  }

  // Add 10+ more notification methods...
}

export default new NotificationService();
```

#### Step 4.2: Create Email Templates

**Directory**: `/server/src/templates/emails/`

**Example**: `access-review-reminder.html`
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; }
    .content { padding: 20px; background: #f9fafb; }
    .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
    .footer { padding: 20px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Access Review Due Soon</h1>
    </div>
    <div class="content">
      <p>Hello {{reviewerName}},</p>

      <p>This is a reminder that an access review is due soon for <strong>{{personnelName}}</strong>.</p>

      <p><strong>Due Date:</strong> {{dueDate}}</p>

      <p>Please complete this review to ensure access rights are up to date and compliant with your organization's policies.</p>

      <p>
        <a href="{{reviewUrl}}" class="button">Review Access Now</a>
      </p>
    </div>
    <div class="footer">
      <p>ComplyEasy AI - Enterprise Compliance Platform</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
```

**Create 15+ email templates** for all notification types.

#### Step 4.3: Integrate into Services

Add notification calls:

```typescript
// In issueManagementService.ts
import notificationService from './notificationService';

async assignIssue(issueId: string, assignedToId: string, ...) {
  const issue = await prisma.issue.update({ ... });

  // Send notification
  await notificationService.sendIssueAssignment(issueId, assignedToId);

  return issue;
}
```

---

## 🎯 NEXT STEPS

1. **Immediate (Today)**:
   - Finish fixing route type signatures
   - Test compilation
   - Commit progress

2. **This Week**:
   - Set up Jest testing
   - Write tests for 3-4 critical services
   - Add basic WebSocket events

3. **Next 2 Weeks**:
   - Complete all tests
   - Build frontend components
   - Production hardening

See `PRODUCTION_READINESS_STATUS.md` for detailed timeline and estimates.
