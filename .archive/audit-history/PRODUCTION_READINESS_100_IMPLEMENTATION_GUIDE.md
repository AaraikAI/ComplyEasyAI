# Production Readiness 100/100 Implementation Guide

**Project:** ComplyEasyAI
**Created:** 2026-02-24
**Current Score:** 90/100
**Target Score:** 100/100
**Estimated Effort:** 10-12 days

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Part 1: Feature Completeness (20/25 → 25/25)](#part-1-feature-completeness-2025--2525)
3. [Part 2: Application Logic (12/15 → 15/15)](#part-2-application-logic-1215--1515)
4. [Part 3: Azure Sync Full Implementation](#part-3-azure-sync-full-implementation)
5. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

| Category | Current | Target | Gap | Effort |
|----------|---------|--------|-----|--------|
| Feature Completeness | 20/25 | 25/25 | 5 points | 3-4 days |
| Application Logic | 12/15 | 15/15 | 3 points | 4-5 days |
| Azure Sync (included in above) | Partial | Complete | - | 2-3 days |
| **Total** | **90/100** | **100/100** | **10 points** | **10-12 days** |

### Gap Analysis Summary

- **Feature Completeness:** 22 missing CRUD operations across 12 route files
- **Application Logic:** 95+ issues across 5 categories (validation, error handling, state machines, transactions, edge cases)
- **Azure Sync:** Data fetched on-demand but not persisted; needs full sync service with scheduled jobs

---

## Part 1: Feature Completeness (20/25 → 25/25)

### Gap Summary

To achieve 25/25, complete **22 missing CRUD operations** across 12 route files.

---

### 1.1 CRITICAL: Missing Update Operations (Priority 1)

#### 1. Control Mappings - Missing PATCH Endpoint

**Location:** `server/src/routes/controlMappings.ts`
**Current:** POST (create), GET (read), DELETE (delete)
**Missing:** PATCH/PUT for updating mappings

**Route Implementation:**
```typescript
// server/src/routes/controlMappings.ts - Add after line 13
router.patch(
  '/:mappingId',
  authenticate,
  authorize('admin', 'editor'),
  controlMappingsController.updateMapping
);
```

**Controller Implementation:**
```typescript
// server/src/controllers/controlMappingsController.ts - Add new method
updateMapping = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { mappingId } = req.params;
    const { mappingType, confidence, notes, status } = req.body;

    // Validate mapping exists and belongs to organization
    const existingMapping = await prisma.controlMapping.findFirst({
      where: {
        id: mappingId,
        organizationId: authReq.user!.organizationId,
      },
    });

    if (!existingMapping) {
      res.status(404).json({ error: 'Control mapping not found' });
      return;
    }

    const updatedMapping = await prisma.controlMapping.update({
      where: { id: mappingId },
      data: {
        ...(mappingType && { mappingType }),
        ...(confidence !== undefined && { confidence }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
      include: {
        sourceControl: true,
        targetControl: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_CONTROL_MAPPING',
        resourceType: 'ControlMapping',
        resourceId: mappingId,
        userId: authReq.user!.id,
        organizationId: authReq.user!.organizationId,
        details: { changes: req.body },
      },
    });

    res.json(updatedMapping);
  } catch (error) {
    logger.error('Update control mapping error', error);
    throw new AppError('Failed to update control mapping', 500);
  }
};
```

---

#### 2. Personnel Routes - Missing PATCH and DELETE

**Location:** `server/src/routes/personnel.ts`
**Current:** POST (create), GET (list)
**Missing:** PATCH (update), DELETE (remove)

**Route Implementation:**
```typescript
// server/src/routes/personnel.ts - Add endpoints
router.patch(
  '/:personnelId',
  authenticate,
  authorize('admin', 'hr'),
  personnelController.updatePersonnel
);

router.delete(
  '/:personnelId',
  authenticate,
  authorize('admin'),
  personnelController.deletePersonnel
);
```

**Controller Implementation:**
```typescript
// server/src/controllers/personnelController.ts - Add methods
updatePersonnel = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { personnelId } = req.params;
  const updateData = req.body;

  // Validate with Joi schema
  const schema = Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    department: Joi.string(),
    jobTitle: Joi.string(),
    manager: Joi.string().allow(null),
    startDate: Joi.date(),
    endDate: Joi.date().allow(null),
    active: Joi.boolean(),
    accessLevel: Joi.string().valid('basic', 'elevated', 'admin'),
    certifications: Joi.array().items(Joi.string()),
  });

  const { error, value } = schema.validate(updateData);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  const personnel = await prisma.user.update({
    where: {
      id: personnelId,
      organizationId: authReq.user!.organizationId,
    },
    data: value,
  });

  await prisma.auditLog.create({
    data: {
      action: 'UPDATE_PERSONNEL',
      resourceType: 'User',
      resourceId: personnelId,
      userId: authReq.user!.id,
      organizationId: authReq.user!.organizationId,
      details: { changes: Object.keys(value) },
    },
  });

  res.json(personnel);
};

deletePersonnel = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { personnelId } = req.params;

  // Soft delete - set active to false and endDate
  const personnel = await prisma.user.update({
    where: {
      id: personnelId,
      organizationId: authReq.user!.organizationId,
    },
    data: {
      active: false,
      endDate: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'DELETE_PERSONNEL',
      resourceType: 'User',
      resourceId: personnelId,
      userId: authReq.user!.id,
      organizationId: authReq.user!.organizationId,
    },
  });

  res.json({ success: true, message: 'Personnel record deactivated' });
};
```

---

#### 3. Evidence Versions - Missing GET Single Version

**Location:** `server/src/routes/evidenceVersions.ts`
**Current:** GET (list), POST (create), POST (restore), DELETE
**Missing:** GET /:versionId (single version details)

**Route Implementation:**
```typescript
// server/src/routes/evidenceVersions.ts - Add endpoint
router.get(
  '/:evidenceId/versions/:versionId',
  authenticate,
  evidenceVersioningController.getVersion
);
```

**Controller Implementation:**
```typescript
// server/src/controllers/evidenceVersioningController.ts - Add method
getVersion = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { evidenceId, versionId } = req.params;

  const version = await prisma.evidenceVersion.findFirst({
    where: {
      id: versionId,
      evidenceId,
      evidence: {
        organizationId: authReq.user!.organizationId,
      },
    },
    include: {
      createdByUser: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!version) {
    res.status(404).json({ error: 'Version not found' });
    return;
  }

  res.json(version);
};
```

---

#### 4. Audit Logs - Add Immutable Archive (Not Delete)

**Location:** `server/src/routes/audit.ts`
**Current:** GET (list), POST (create log)
**Missing:** Archive/export functionality (audit logs should be immutable)

**Route Implementation:**
```typescript
// server/src/routes/audit.ts - Add export endpoint
router.get(
  '/export',
  authenticate,
  authorize('admin', 'auditor'),
  auditController.exportLogs
);

router.post(
  '/archive',
  authenticate,
  authorize('admin'),
  auditController.archiveLogs
);
```

**Controller Implementation:**
```typescript
// server/src/controllers/auditController.ts - Add methods
exportLogs = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { startDate, endDate, format = 'json' } = req.query;

  const logs = await prisma.auditLog.findMany({
    where: {
      organizationId: authReq.user!.organizationId,
      createdAt: {
        gte: startDate ? new Date(startDate as string) : undefined,
        lte: endDate ? new Date(endDate as string) : undefined,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (format === 'csv') {
    const csv = convertToCSV(logs);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  } else {
    res.json(logs);
  }
};

archiveLogs = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { beforeDate } = req.body;

  // Archive to cold storage (S3) - logs are immutable
  const logsToArchive = await prisma.auditLog.findMany({
    where: {
      organizationId: authReq.user!.organizationId,
      createdAt: { lt: new Date(beforeDate) },
      archived: false,
    },
  });

  // Upload to S3 archive
  const archiveKey = `audit-archives/${authReq.user!.organizationId}/${Date.now()}.json`;
  await s3.putObject({
    Bucket: config.aws.archiveBucket,
    Key: archiveKey,
    Body: JSON.stringify(logsToArchive),
  }).promise();

  // Mark as archived (don't delete - audit logs are immutable)
  await prisma.auditLog.updateMany({
    where: { id: { in: logsToArchive.map(l => l.id) } },
    data: { archived: true, archiveLocation: archiveKey },
  });

  res.json({ archived: logsToArchive.length, archiveKey });
};
```

---

### 1.2 HIGH: Missing Delete Operations (Priority 2)

#### 5. DORA Routes - Missing Incident Delete

**Location:** `server/src/routes/dora.ts`
**Missing:** DELETE for ICT incidents

```typescript
// server/src/routes/dora.ts - Add endpoint
router.delete(
  '/incidents/:incidentId',
  authenticate,
  authorize('admin'),
  doraController.deleteIncident
);
```

**Controller:**
```typescript
deleteIncident = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { incidentId } = req.params;

  // Soft delete - mark as archived
  await prisma.iCTIncident.update({
    where: {
      id: incidentId,
      organizationId: authReq.user!.organizationId,
    },
    data: {
      status: 'archived',
      archivedAt: new Date(),
      archivedBy: authReq.user!.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'ARCHIVE_ICT_INCIDENT',
      resourceType: 'ICTIncident',
      resourceId: incidentId,
      userId: authReq.user!.id,
      organizationId: authReq.user!.organizationId,
    },
  });

  res.json({ success: true });
};
```

---

#### 6. SoD Routes - Missing Compensation Control Delete

**Location:** `server/src/routes/sod.ts`
**Missing:** DELETE for compensation controls

```typescript
// server/src/routes/sod.ts - Add endpoint
router.delete(
  '/violations/:violationId/compensation/:controlId',
  authenticate,
  authorize('admin'),
  sodController.deleteCompensationControl
);
```

---

#### 7. Frameworks - Missing Control Delete

**Location:** `server/src/routes/frameworks.ts`
**Missing:** DELETE individual control without deleting framework

```typescript
// server/src/routes/frameworks.ts - Add endpoint
router.delete(
  '/:frameworkId/controls/:controlId',
  authenticate,
  authorize('admin'),
  frameworksController.deleteControl
);
```

---

#### 8. Workflows - Missing Rule Delete

**Location:** `server/src/routes/workflow.ts`
**Missing:** DELETE for workflow rules

```typescript
// server/src/routes/workflow.ts - Add endpoint
router.delete(
  '/:workflowId/rules/:ruleId',
  authenticate,
  authorize('admin', 'editor'),
  workflowController.deleteRule
);
```

---

### 1.3 MEDIUM: Missing Specialized Operations (Priority 3)

#### 9. MDM - Missing Device Reassignment

**Location:** `server/src/routes/mdm.ts`
**Missing:** Device owner change endpoint

**Route:**
```typescript
// server/src/routes/mdm.ts - Add endpoint
router.post(
  '/devices/:deviceId/reassign',
  authenticate,
  authorize('admin'),
  mdmController.reassignDevice
);
```

**Controller:**
```typescript
// server/src/controllers/mdmController.ts
reassignDevice = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { deviceId } = req.params;
  const { newOwnerId, reason } = req.body;

  // Validate new owner exists
  const newOwner = await prisma.user.findFirst({
    where: {
      id: newOwnerId,
      organizationId: authReq.user!.organizationId,
      active: true,
    },
  });

  if (!newOwner) {
    res.status(400).json({ error: 'Invalid new owner' });
    return;
  }

  const device = await prisma.device.update({
    where: { id: deviceId },
    data: {
      userId: newOwnerId,
      reassignedAt: new Date(),
      reassignedBy: authReq.user!.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'REASSIGN_DEVICE',
      resourceType: 'Device',
      resourceId: deviceId,
      userId: authReq.user!.id,
      organizationId: authReq.user!.organizationId,
      details: { newOwnerId, reason },
    },
  });

  res.json(device);
};
```

---

#### 10. Billing - Missing Refund Operation

**Location:** `server/src/controllers/billingController.ts`
**Missing:** Refund endpoint

**Route:**
```typescript
// server/src/routes/billing.ts - Add endpoint
router.post(
  '/refund',
  authenticate,
  authorize('admin'),
  billingController.processRefund
);
```

**Controller:**
```typescript
// server/src/controllers/billingController.ts
processRefund = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { invoiceId, amount, reason } = req.body;

  const schema = Joi.object({
    invoiceId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    reason: Joi.string().min(10).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  const refund = await stripeService.createRefund(
    authReq.user!.organizationId,
    invoiceId,
    amount,
    reason
  );

  await prisma.auditLog.create({
    data: {
      action: 'PROCESS_REFUND',
      resourceType: 'Invoice',
      resourceId: invoiceId,
      userId: authReq.user!.id,
      organizationId: authReq.user!.organizationId,
      details: { amount, reason, refundId: refund.id },
    },
  });

  res.json(refund);
};
```

---

#### 11. Feature Modules - ESG CRUD Completion

**Location:** `server/src/routes/featureModules.ts`
**Current:** GET /esg/metrics only
**Missing:** POST, PATCH, DELETE for ESG metrics

```typescript
// server/src/routes/featureModules.ts - Add ESG endpoints
router.post(
  '/esg/metrics',
  authenticate,
  authorize('admin', 'editor'),
  featureModulesController.createESGMetric
);

router.patch(
  '/esg/metrics/:metricId',
  authenticate,
  authorize('admin', 'editor'),
  featureModulesController.updateESGMetric
);

router.delete(
  '/esg/metrics/:metricId',
  authenticate,
  authorize('admin'),
  featureModulesController.deleteESGMetric
);
```

---

#### 12. Organization - Missing Create and List

**Location:** `server/src/controllers/organizationController.ts`
**Current:** get, update only
**Missing:** create (for multi-org), list (for super-admins)

```typescript
// server/src/routes/organization.ts - Add endpoints
router.post(
  '/',
  authenticate,
  authorize('super-admin'),
  organizationController.create
);

router.get(
  '/list',
  authenticate,
  authorize('super-admin'),
  organizationController.list
);
```

---

### 1.4 Feature Completeness Summary Table

| Route File | Missing Operations | Priority | Effort |
|------------|-------------------|----------|--------|
| controlMappings.ts | PATCH | 1 | 2h |
| personnel.ts | PATCH, DELETE | 1 | 3h |
| evidenceVersions.ts | GET /:versionId | 1 | 1h |
| audit.ts | Export, Archive | 2 | 4h |
| dora.ts | DELETE incident | 2 | 1h |
| sod.ts | DELETE compensation | 2 | 1h |
| frameworks.ts | DELETE control | 2 | 2h |
| workflow.ts | DELETE rule | 2 | 1h |
| mdm.ts | POST reassign | 3 | 3h |
| billing.ts | POST refund | 3 | 4h |
| featureModules.ts | ESG CRUD | 3 | 4h |
| organization.ts | POST, GET list | 3 | 2h |

**Total Effort:** ~28 hours (3-4 days)

---

## Part 2: Application Logic (12/15 → 15/15)

### Gap Summary

To achieve 15/15, fix **95+ application logic issues** across 5 categories.

---

### 2.1 CRITICAL: Missing Input Validation (Priority 1)

#### Issue: featureModulesController.ts lacks Joi schemas

**Location:** `server/src/controllers/featureModulesController.ts`

**Create Validators File:** `server/src/validators/featureModulesValidators.ts`

```typescript
import Joi from 'joi';

export const governanceBodySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string().valid('board', 'committee', 'council', 'working-group').required(),
  description: Joi.string().max(1000),
  members: Joi.array().items(Joi.string().uuid()),
  meetingFrequency: Joi.string().valid('weekly', 'biweekly', 'monthly', 'quarterly', 'annually'),
  charter: Joi.string(),
});

export const meetingSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  date: Joi.date().iso().required(),
  duration: Joi.number().integer().min(15).max(480).required(), // 15 min to 8 hours
  location: Joi.string().max(200),
  agenda: Joi.string(),
  attendees: Joi.array().items(Joi.string().uuid()),
  type: Joi.string().valid('regular', 'emergency', 'annual', 'special'),
});

export const decisionSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().required(),
  status: Joi.string().valid('proposed', 'approved', 'rejected', 'deferred', 'implemented'),
  votesFor: Joi.number().integer().min(0),
  votesAgainst: Joi.number().integer().min(0),
  votesAbstain: Joi.number().integer().min(0),
  effectiveDate: Joi.date().iso(),
});

export const breachIncidentSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(20).required(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  affectedSystems: Joi.array().items(Joi.string()),
  affectedDataTypes: Joi.array().items(Joi.string()),
  estimatedRecordsAffected: Joi.number().integer().min(0),
  discoveryDate: Joi.date().iso().required(),
  containmentDate: Joi.date().iso(),
  notificationRequired: Joi.boolean(),
});

export const escalationPathSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  triggerConditions: Joi.array().items(Joi.object({
    field: Joi.string().required(),
    operator: Joi.string().valid('eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'contains').required(),
    value: Joi.any().required(),
  })).min(1).required(),
  steps: Joi.array().items(Joi.object({
    order: Joi.number().integer().min(1).required(),
    assigneeId: Joi.string().uuid().required(),
    timeoutHours: Joi.number().integer().min(1).max(720).required(),
    action: Joi.string().valid('notify', 'escalate', 'auto-approve', 'auto-reject'),
  })).min(1).required(),
  active: Joi.boolean(),
});
```

**Update Controller to Use Validators:**
```typescript
// server/src/controllers/featureModulesController.ts
import {
  governanceBodySchema,
  meetingSchema,
  decisionSchema,
  breachIncidentSchema,
  escalationPathSchema
} from '../validators/featureModulesValidators';

createGovernanceBody = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = governanceBodySchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }
  // ... rest of implementation using validated 'value'
};
```

---

### 2.2 CRITICAL: Silent Failures Need Logging (Priority 1)

#### Issue: Functions swallow errors without logging

**Fix 1: frameworkTemplateService.ts:1598-1601**
```typescript
// BEFORE:
} catch (error) {
  logger.warn('Failed to create control mapping', { error });
  // Don't fail the template application if mapping fails
}

// AFTER:
} catch (error) {
  logger.error('Control mapping creation failed', {
    error,
    templateId,
    controlId,
    organizationId
  });

  // Record failed mapping for retry
  await prisma.failedOperation.create({
    data: {
      operation: 'CREATE_CONTROL_MAPPING',
      resourceType: 'ControlMapping',
      resourceId: controlId,
      organizationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      retryable: true,
    },
  });

  // Continue but track failure
  failedMappings.push({ controlId, error: error.message });
}

// At end of function:
if (failedMappings.length > 0) {
  logger.warn(`Template applied with ${failedMappings.length} failed mappings`, {
    templateId,
    failedMappings
  });
}
```

**Fix 2: agenticAIService.ts:1253 - Lock operations**
```typescript
// BEFORE:
} catch (error) {
  // Best effort unlock - don't throw
  logger.debug('Unlock failed', { error });
}

// AFTER:
} catch (error) {
  logger.error('Critical: Lock release failed', {
    error,
    lockId,
    resourceId,
    userId
  });

  // Alert for manual intervention
  await alertService.sendCriticalAlert({
    type: 'ORPHANED_LOCK',
    resourceId,
    lockId,
    message: 'Lock release failed - manual intervention may be required',
  });
}
```

**Fix 3: physicalAIService.ts:2938, 3077 - Remove empty catch**
```typescript
// BEFORE:
} catch { /* skip */ }

// AFTER:
} catch (error) {
  logger.warn('Non-critical operation failed', {
    operation: 'parseSignalData',
    error: error instanceof Error ? error.message : 'Unknown'
  });
}
```

---

### 2.3 HIGH: State Machine Validation (Priority 2)

#### Issue: jitAccessService.ts has no state transition validation

**Create State Machine Validator:** `server/src/utils/stateMachine.ts`

```typescript
export type JITAccessStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'expired' | 'revoked';

const validTransitions: Record<JITAccessStatus, JITAccessStatus[]> = {
  pending: ['approved', 'rejected', 'expired'],
  approved: ['active', 'expired', 'revoked'],
  rejected: [], // Terminal state
  active: ['expired', 'revoked'],
  expired: [], // Terminal state
  revoked: [], // Terminal state
};

export function validateStateTransition(
  currentStatus: JITAccessStatus,
  newStatus: JITAccessStatus
): { valid: boolean; error?: string } {
  const allowed = validTransitions[currentStatus];

  if (!allowed) {
    return { valid: false, error: `Invalid current status: ${currentStatus}` };
  }

  if (!allowed.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ')}`
    };
  }

  return { valid: true };
}

export function isTerminalState(status: JITAccessStatus): boolean {
  return validTransitions[status]?.length === 0;
}
```

**Update jitAccessService.ts:**
```typescript
// server/src/services/advanced/jitAccessService.ts
import { validateStateTransition, JITAccessStatus } from '../../utils/stateMachine';

async approveRequest(requestId: string, approverId: string): Promise<JITAccessRequest> {
  const request = await prisma.jITAccessRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new AppError('Request not found', 404);
  }

  // Validate state transition
  const transition = validateStateTransition(
    request.status as JITAccessStatus,
    'approved'
  );

  if (!transition.valid) {
    throw new AppError(transition.error!, 400);
  }

  // Use optimistic locking to prevent race conditions
  const updated = await prisma.jITAccessRequest.updateMany({
    where: {
      id: requestId,
      status: request.status, // Ensure status hasn't changed
      version: request.version, // Optimistic lock
    },
    data: {
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date(),
      version: { increment: 1 },
    },
  });

  if (updated.count === 0) {
    throw new AppError('Request was modified by another process', 409);
  }

  return prisma.jITAccessRequest.findUnique({ where: { id: requestId } });
}
```

---

### 2.4 HIGH: Transaction Handling (Priority 2)

#### Issue: Multi-step operations without transactions

**Fix agenticAIService.ts rollback:**
```typescript
// server/src/services/advanced/agenticAIService.ts
async executeActionWithRollback(actionId: string): Promise<void> {
  // Use Prisma transaction for atomicity
  await prisma.$transaction(async (tx) => {
    const action = await tx.agenticAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new AppError('Action not found', 404);
    }

    try {
      // Execute the action
      const result = await this.performAction(action);

      // Update action status
      await tx.agenticAction.update({
        where: { id: actionId },
        data: {
          status: 'completed',
          result: result,
          completedAt: new Date(),
        },
      });

      // Create audit record
      await tx.auditLog.create({
        data: {
          action: 'EXECUTE_AGENTIC_ACTION',
          resourceType: 'AgenticAction',
          resourceId: actionId,
          organizationId: action.organizationId,
          details: { result },
        },
      });
    } catch (error) {
      // Rollback is automatic with transaction
      // Record the failure
      await tx.agenticAction.update({
        where: { id: actionId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date(),
        },
      });

      // Create rollback record within same transaction
      await tx.agenticActionRollback.create({
        data: {
          actionId,
          reason: error instanceof Error ? error.message : 'Unknown error',
          initiatedAt: new Date(),
        },
      });

      throw error; // Re-throw to trigger transaction rollback
    }
  }, {
    maxWait: 5000,
    timeout: 30000,
    isolationLevel: 'Serializable',
  });
}
```

**Fix featureModulesController.ts breach incident:**
```typescript
// server/src/controllers/featureModulesController.ts
createBreachIncident = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { error, value } = breachIncidentSchema.validate(req.body);

  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  // Use transaction for multi-step operation
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create incident
    const incident = await tx.breachIncident.create({
      data: {
        ...value,
        organizationId: authReq.user!.organizationId,
        reportedBy: authReq.user!.id,
        status: 'open',
      },
    });

    // 2. Create notifications (within transaction)
    if (value.notificationRequired) {
      await tx.notification.createMany({
        data: getBreachNotificationRecipients(authReq.user!.organizationId).map(
          (recipientId) => ({
            type: 'BREACH_INCIDENT',
            recipientId,
            resourceId: incident.id,
            organizationId: authReq.user!.organizationId,
            message: `New breach incident: ${incident.title}`,
          })
        ),
      });
    }

    // 3. Create audit log (within transaction)
    await tx.auditLog.create({
      data: {
        action: 'CREATE_BREACH_INCIDENT',
        resourceType: 'BreachIncident',
        resourceId: incident.id,
        userId: authReq.user!.id,
        organizationId: authReq.user!.organizationId,
        details: { severity: incident.severity },
      },
    });

    return incident;
  });

  res.status(201).json(result);
};
```

---

### 2.5 MEDIUM: Edge Case Handling (Priority 3)

#### Issue: Missing validation for edge cases

**Fix multimodalIntakeService.ts:**
```typescript
// server/src/services/advanced/multimodalIntakeService.ts
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB

async processAudio(buffer: Buffer, format: string): Promise<AudioProcessingResult> {
  // Edge case validations
  if (!buffer || buffer.length === 0) {
    throw new AppError('Empty audio buffer provided', 400);
  }

  if (buffer.length > MAX_AUDIO_SIZE) {
    throw new AppError(`Audio file exceeds maximum size of ${MAX_AUDIO_SIZE / 1024 / 1024}MB`, 400);
  }

  const supportedFormats = ['mp3', 'wav', 'ogg', 'flac', 'm4a'];
  if (!supportedFormats.includes(format.toLowerCase())) {
    throw new AppError(`Unsupported audio format: ${format}. Supported: ${supportedFormats.join(', ')}`, 400);
  }

  // Validate file header matches format
  const detectedFormat = detectAudioFormat(buffer);
  if (detectedFormat !== format.toLowerCase()) {
    throw new AppError(`File header mismatch: declared ${format}, detected ${detectedFormat}`, 400);
  }

  // Continue with processing...
}

function detectAudioFormat(buffer: Buffer): string {
  // Check magic bytes
  if (buffer.slice(0, 4).toString('hex') === '52494646') return 'wav';
  if (buffer.slice(0, 3).toString('hex') === '494433') return 'mp3';
  if (buffer.slice(0, 4).toString('hex') === '4f676753') return 'ogg';
  if (buffer.slice(0, 4).toString('hex') === '664c6143') return 'flac';
  return 'unknown';
}
```

**Fix jitAccessService.ts time validation:**
```typescript
// server/src/services/advanced/jitAccessService.ts
async createRequest(data: CreateJITRequestData): Promise<JITAccessRequest> {
  // Validate time-related edge cases
  const now = new Date();
  const requestedStart = new Date(data.requestedStartTime);
  const requestedEnd = new Date(data.requestedEndTime);

  // Check for valid dates
  if (isNaN(requestedStart.getTime()) || isNaN(requestedEnd.getTime())) {
    throw new AppError('Invalid date format for start or end time', 400);
  }

  // Check end is after start
  if (requestedEnd <= requestedStart) {
    throw new AppError('End time must be after start time', 400);
  }

  // Check duration is within policy limits
  const durationMs = requestedEnd.getTime() - requestedStart.getTime();
  const maxDurationMs = data.policy.maxDurationMinutes * 60 * 1000;

  if (durationMs > maxDurationMs) {
    throw new AppError(
      `Requested duration (${durationMs / 60000} min) exceeds policy maximum (${data.policy.maxDurationMinutes} min)`,
      400
    );
  }

  // Check start time isn't too far in the past (allow 5 min clock skew)
  const maxPastMs = 5 * 60 * 1000;
  if (requestedStart.getTime() < now.getTime() - maxPastMs) {
    throw new AppError('Start time cannot be in the past', 400);
  }

  // Check start time isn't too far in the future
  const maxFutureMs = data.policy.maxAdvanceBookingDays * 24 * 60 * 60 * 1000;
  if (requestedStart.getTime() > now.getTime() + maxFutureMs) {
    throw new AppError(
      `Start time cannot be more than ${data.policy.maxAdvanceBookingDays} days in the future`,
      400
    );
  }

  // Continue with creation...
}
```

---

### 2.6 Application Logic Summary Table

| Issue Category | Files Affected | Fixes Required | Priority | Effort |
|---------------|----------------|----------------|----------|--------|
| Missing Input Validation | featureModulesController.ts + 5 others | Create Joi schemas | 1 | 6h |
| Silent Failures | frameworkTemplateService, agenticAI, physicalAI | Add logging + alerting | 1 | 4h |
| State Machine | jitAccessService.ts | Create state validator | 2 | 4h |
| Transaction Handling | agenticAIService, featureModulesController | Wrap in Prisma $transaction | 2 | 6h |
| Edge Case Handling | multimodalIntakeService, jitAccessService | Add boundary validation | 3 | 4h |
| Inconsistent Error Handling | 10+ files | Standardize patterns | 3 | 8h |

**Total Effort:** ~32 hours (4-5 days)

---

## Part 3: Azure Sync Full Implementation

### Current State

Azure integration exists but **data is not persisted**:
- Fetches Azure data on-demand via API
- Returns data directly to client
- Does not store in database for historical tracking/compliance

### 3.1 Database Schema Updates

**Add to:** `server/prisma/schema.prisma`

```prisma
model AzureResource {
  id                String       @id @default(dbgenerated("(uuid_generate_v4())::text"))
  azureId           String       // Azure resource ID
  name              String
  type              String       // e.g., "Microsoft.Compute/virtualMachines"
  location          String
  resourceGroup     String
  tags              Json?
  provisioningState String?
  properties        Json?        // Full resource properties
  subscriptionId    String
  syncedAt          DateTime     @default(now())
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @default(now()) @updatedAt
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, azureId])
  @@index([organizationId])
  @@index([type])
  @@index([syncedAt])
}

model AzureSecurityAlert {
  id                String       @id @default(dbgenerated("(uuid_generate_v4())::text"))
  azureId           String       // Azure alert ID
  name              String
  severity          String       // High, Medium, Low
  status            String       // Active, Resolved, Dismissed
  alertType         String
  description       String?
  compromisedEntity String?
  resourceId        String?
  startTime         DateTime?
  endTime           DateTime?
  remediationSteps  Json?
  syncedAt          DateTime     @default(now())
  resolvedAt        DateTime?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @default(now()) @updatedAt
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, azureId])
  @@index([organizationId])
  @@index([severity])
  @@index([status])
}

model AzureSecurityRecommendation {
  id                     String       @id @default(dbgenerated("(uuid_generate_v4())::text"))
  azureId                String
  name                   String
  severity               String
  state                  String       // Healthy, Unhealthy, NotApplicable
  description            String?
  remediationDescription String?
  resourceId             String?
  implementedAt          DateTime?
  syncedAt               DateTime     @default(now())
  createdAt              DateTime     @default(now())
  updatedAt              DateTime     @default(now()) @updatedAt
  organizationId         String
  organization           Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, azureId])
  @@index([organizationId])
  @@index([severity])
  @@index([state])
}

model AzurePolicyCompliance {
  id                   String       @id @default(dbgenerated("(uuid_generate_v4())::text"))
  policyDefinitionId   String
  policyDefinitionName String
  policyAssignmentId   String?
  complianceState      String       // Compliant, NonCompliant, Exempt
  resourceId           String?
  resourceType         String?
  subscriptionId       String
  evaluatedAt          DateTime?
  syncedAt             DateTime     @default(now())
  createdAt            DateTime     @default(now())
  updatedAt            DateTime     @default(now()) @updatedAt
  organizationId       String
  organization         Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, policyDefinitionId, resourceId])
  @@index([organizationId])
  @@index([complianceState])
}

model AzureUser {
  id                 String       @id @default(dbgenerated("(uuid_generate_v4())::text"))
  azureId            String       // Azure AD user ID
  displayName        String
  userPrincipalName  String
  mail               String?
  accountEnabled     Boolean      @default(true)
  jobTitle           String?
  department         String?
  createdDateTime    DateTime?
  lastSignInDateTime DateTime?
  syncedAt           DateTime     @default(now())
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @default(now()) @updatedAt
  organizationId     String
  organization       Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, azureId])
  @@index([organizationId])
  @@index([accountEnabled])
}

model AzureSyncHistory {
  id             String       @id @default(dbgenerated("(uuid_generate_v4())::text"))
  syncType       String       // full, incremental, resources, alerts, etc.
  status         String       // running, completed, failed, partial
  startedAt      DateTime     @default(now())
  completedAt    DateTime?
  itemsSynced    Int          @default(0)
  itemsFailed    Int          @default(0)
  errorMessage   String?
  details        Json?
  triggeredBy    String?      // userId or 'scheduled'
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
  @@index([syncType])
  @@index([status])
}
```

---

### 3.2 Azure Sync Service

**Create:** `server/src/services/integrations/azureSyncService.ts`

```typescript
import prisma from '../../config/database';
import logger from '../../config/logger';
import azureService from './azureService';
import { AppError } from '../../middleware/errorHandler';

interface SyncResult {
  syncId: string;
  status: 'completed' | 'failed' | 'partial';
  itemsSynced: number;
  itemsFailed: number;
  duration: number;
  details: Record<string, any>;
}

class AzureSyncService {
  /**
   * Execute a full Azure data sync
   */
  async runFullSync(organizationId: string, triggeredBy?: string): Promise<SyncResult> {
    const syncHistory = await prisma.azureSyncHistory.create({
      data: {
        syncType: 'full',
        status: 'running',
        triggeredBy,
        organizationId,
      },
    });

    const startTime = Date.now();
    let totalSynced = 0;
    let totalFailed = 0;
    const details: Record<string, any> = {};

    try {
      // Sync all data types in parallel where possible
      const [
        resourcesResult,
        alertsResult,
        recommendationsResult,
        complianceResult,
        usersResult,
      ] = await Promise.allSettled([
        this.syncResources(organizationId),
        this.syncSecurityAlerts(organizationId),
        this.syncSecurityRecommendations(organizationId),
        this.syncPolicyCompliance(organizationId),
        this.syncUsers(organizationId),
      ]);

      // Aggregate results
      const results = [
        { name: 'resources', result: resourcesResult },
        { name: 'alerts', result: alertsResult },
        { name: 'recommendations', result: recommendationsResult },
        { name: 'compliance', result: complianceResult },
        { name: 'users', result: usersResult },
      ];

      for (const { name, result } of results) {
        if (result.status === 'fulfilled') {
          totalSynced += result.value.synced;
          totalFailed += result.value.failed;
          details[name] = { status: 'success', ...result.value };
        } else {
          totalFailed++;
          details[name] = { status: 'failed', error: result.reason?.message };
          logger.error(`Azure sync failed for ${name}`, { error: result.reason });
        }
      }

      // Update sync history
      const finalStatus = totalFailed > 0 ? 'partial' : 'completed';
      await prisma.azureSyncHistory.update({
        where: { id: syncHistory.id },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          itemsSynced: totalSynced,
          itemsFailed: totalFailed,
          details,
        },
      });

      // Update integration lastSync
      await azureService.updateLastSync(organizationId);

      return {
        syncId: syncHistory.id,
        status: finalStatus,
        itemsSynced: totalSynced,
        itemsFailed: totalFailed,
        duration: Date.now() - startTime,
        details,
      };
    } catch (error) {
      await prisma.azureSyncHistory.update({
        where: { id: syncHistory.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Sync Azure resources
   */
  async syncResources(organizationId: string): Promise<{ synced: number; failed: number }> {
    const resources = await azureService.getResources(organizationId);
    let synced = 0;
    let failed = 0;

    for (const resource of resources) {
      try {
        await prisma.azureResource.upsert({
          where: {
            organizationId_azureId: {
              organizationId,
              azureId: resource.id,
            },
          },
          update: {
            name: resource.name,
            type: resource.type,
            location: resource.location,
            resourceGroup: this.extractResourceGroup(resource.id),
            tags: resource.tags,
            provisioningState: resource.provisioningState,
            properties: resource.properties,
            syncedAt: new Date(),
          },
          create: {
            azureId: resource.id,
            name: resource.name,
            type: resource.type,
            location: resource.location,
            resourceGroup: this.extractResourceGroup(resource.id),
            tags: resource.tags,
            provisioningState: resource.provisioningState,
            properties: resource.properties,
            subscriptionId: this.extractSubscriptionId(resource.id),
            organizationId,
          },
        });
        synced++;
      } catch (error) {
        logger.error('Failed to sync Azure resource', { resourceId: resource.id, error });
        failed++;
      }
    }

    // Mark stale resources
    await this.markStaleResources(organizationId, resources.map(r => r.id));

    return { synced, failed };
  }

  /**
   * Sync Azure Security Alerts
   */
  async syncSecurityAlerts(organizationId: string): Promise<{ synced: number; failed: number }> {
    const alerts = await azureService.getSecurityAlerts(organizationId);
    let synced = 0;
    let failed = 0;

    for (const alert of alerts) {
      try {
        await prisma.azureSecurityAlert.upsert({
          where: {
            organizationId_azureId: {
              organizationId,
              azureId: alert.id,
            },
          },
          update: {
            name: alert.name,
            severity: alert.severity,
            status: alert.status,
            alertType: alert.alertType,
            description: alert.description,
            compromisedEntity: alert.compromisedEntity,
            resourceId: alert.resourceId,
            startTime: alert.startTimeUtc ? new Date(alert.startTimeUtc) : null,
            endTime: alert.endTimeUtc ? new Date(alert.endTimeUtc) : null,
            remediationSteps: alert.remediationSteps,
            syncedAt: new Date(),
            resolvedAt: alert.status === 'Resolved' ? new Date() : null,
          },
          create: {
            azureId: alert.id,
            name: alert.name,
            severity: alert.severity,
            status: alert.status,
            alertType: alert.alertType,
            description: alert.description,
            compromisedEntity: alert.compromisedEntity,
            resourceId: alert.resourceId,
            startTime: alert.startTimeUtc ? new Date(alert.startTimeUtc) : null,
            endTime: alert.endTimeUtc ? new Date(alert.endTimeUtc) : null,
            remediationSteps: alert.remediationSteps,
            organizationId,
          },
        });
        synced++;
      } catch (error) {
        logger.error('Failed to sync Azure alert', { alertId: alert.id, error });
        failed++;
      }
    }

    return { synced, failed };
  }

  /**
   * Sync Azure Security Recommendations
   */
  async syncSecurityRecommendations(organizationId: string): Promise<{ synced: number; failed: number }> {
    const recommendations = await azureService.getSecurityRecommendations(organizationId);
    let synced = 0;
    let failed = 0;

    for (const rec of recommendations) {
      try {
        await prisma.azureSecurityRecommendation.upsert({
          where: {
            organizationId_azureId: {
              organizationId,
              azureId: rec.id,
            },
          },
          update: {
            name: rec.name,
            severity: rec.severity,
            state: rec.state,
            description: rec.description,
            remediationDescription: rec.remediationDescription,
            resourceId: rec.resourceId,
            syncedAt: new Date(),
            implementedAt: rec.state === 'Healthy' ? new Date() : null,
          },
          create: {
            azureId: rec.id,
            name: rec.name,
            severity: rec.severity,
            state: rec.state,
            description: rec.description,
            remediationDescription: rec.remediationDescription,
            resourceId: rec.resourceId,
            organizationId,
          },
        });
        synced++;
      } catch (error) {
        logger.error('Failed to sync Azure recommendation', { recId: rec.id, error });
        failed++;
      }
    }

    return { synced, failed };
  }

  /**
   * Sync Azure Policy Compliance
   */
  async syncPolicyCompliance(organizationId: string): Promise<{ synced: number; failed: number }> {
    const compliance = await azureService.getPolicyCompliance(organizationId);
    let synced = 0;
    let failed = 0;

    for (const policy of compliance) {
      try {
        await prisma.azurePolicyCompliance.upsert({
          where: {
            organizationId_policyDefinitionId_resourceId: {
              organizationId,
              policyDefinitionId: policy.policyDefinitionId,
              resourceId: policy.resourceId || 'subscription',
            },
          },
          update: {
            policyDefinitionName: policy.policyDefinitionName,
            complianceState: policy.complianceState,
            evaluatedAt: policy.timestamp ? new Date(policy.timestamp) : null,
            syncedAt: new Date(),
          },
          create: {
            policyDefinitionId: policy.policyDefinitionId,
            policyDefinitionName: policy.policyDefinitionName,
            policyAssignmentId: policy.policyAssignmentId,
            complianceState: policy.complianceState,
            resourceId: policy.resourceId || 'subscription',
            resourceType: policy.resourceType,
            subscriptionId: policy.subscriptionId,
            evaluatedAt: policy.timestamp ? new Date(policy.timestamp) : null,
            organizationId,
          },
        });
        synced++;
      } catch (error) {
        logger.error('Failed to sync Azure policy', { policyId: policy.policyDefinitionId, error });
        failed++;
      }
    }

    return { synced, failed };
  }

  /**
   * Sync Azure AD Users
   */
  async syncUsers(organizationId: string): Promise<{ synced: number; failed: number }> {
    const users = await azureService.getUsers(organizationId);
    let synced = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await prisma.azureUser.upsert({
          where: {
            organizationId_azureId: {
              organizationId,
              azureId: user.id,
            },
          },
          update: {
            displayName: user.displayName,
            userPrincipalName: user.userPrincipalName,
            mail: user.mail,
            accountEnabled: user.accountEnabled,
            jobTitle: user.jobTitle,
            department: user.department,
            lastSignInDateTime: user.lastSignInDateTime ? new Date(user.lastSignInDateTime) : null,
            syncedAt: new Date(),
          },
          create: {
            azureId: user.id,
            displayName: user.displayName,
            userPrincipalName: user.userPrincipalName,
            mail: user.mail,
            accountEnabled: user.accountEnabled,
            jobTitle: user.jobTitle,
            department: user.department,
            createdDateTime: user.createdDateTime ? new Date(user.createdDateTime) : null,
            lastSignInDateTime: user.lastSignInDateTime ? new Date(user.lastSignInDateTime) : null,
            organizationId,
          },
        });
        synced++;
      } catch (error) {
        logger.error('Failed to sync Azure user', { userId: user.id, error });
        failed++;
      }
    }

    return { synced, failed };
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(organizationId: string): Promise<{
    lastSync: Date | null;
    resources: number;
    alerts: { total: number; active: number; bySeverity: Record<string, number> };
    recommendations: { total: number; unhealthy: number; bySeverity: Record<string, number> };
    compliance: { total: number; compliant: number; nonCompliant: number };
    users: { total: number; enabled: number };
  }> {
    const [
      lastSync,
      resourceCount,
      alertStats,
      recommendationStats,
      complianceStats,
      userStats,
    ] = await Promise.all([
      prisma.azureSyncHistory.findFirst({
        where: { organizationId, status: { in: ['completed', 'partial'] } },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
      }),
      prisma.azureResource.count({ where: { organizationId } }),
      prisma.azureSecurityAlert.groupBy({
        by: ['severity', 'status'],
        where: { organizationId },
        _count: true,
      }),
      prisma.azureSecurityRecommendation.groupBy({
        by: ['severity', 'state'],
        where: { organizationId },
        _count: true,
      }),
      prisma.azurePolicyCompliance.groupBy({
        by: ['complianceState'],
        where: { organizationId },
        _count: true,
      }),
      prisma.azureUser.groupBy({
        by: ['accountEnabled'],
        where: { organizationId },
        _count: true,
      }),
    ]);

    return {
      lastSync: lastSync?.completedAt || null,
      resources: resourceCount,
      alerts: this.aggregateAlertStats(alertStats),
      recommendations: this.aggregateRecommendationStats(recommendationStats),
      compliance: this.aggregateComplianceStats(complianceStats),
      users: this.aggregateUserStats(userStats),
    };
  }

  // Helper methods
  private extractResourceGroup(resourceId: string): string {
    const match = resourceId.match(/resourceGroups\/([^/]+)/i);
    return match ? match[1] : 'unknown';
  }

  private extractSubscriptionId(resourceId: string): string {
    const match = resourceId.match(/subscriptions\/([^/]+)/i);
    return match ? match[1] : 'unknown';
  }

  private async markStaleResources(organizationId: string, currentIds: string[]): Promise<void> {
    const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

    await prisma.azureResource.updateMany({
      where: {
        organizationId,
        azureId: { notIn: currentIds },
        syncedAt: { lt: staleThreshold },
      },
      data: {
        provisioningState: 'PossiblyDeleted',
      },
    });
  }

  private aggregateAlertStats(data: any[]): any {
    const result = { total: 0, active: 0, bySeverity: {} as Record<string, number> };
    for (const item of data) {
      result.total += item._count;
      if (item.status === 'Active') result.active += item._count;
      result.bySeverity[item.severity] = (result.bySeverity[item.severity] || 0) + item._count;
    }
    return result;
  }

  private aggregateRecommendationStats(data: any[]): any {
    const result = { total: 0, unhealthy: 0, bySeverity: {} as Record<string, number> };
    for (const item of data) {
      result.total += item._count;
      if (item.state === 'Unhealthy') result.unhealthy += item._count;
      result.bySeverity[item.severity] = (result.bySeverity[item.severity] || 0) + item._count;
    }
    return result;
  }

  private aggregateComplianceStats(data: any[]): any {
    const result = { total: 0, compliant: 0, nonCompliant: 0 };
    for (const item of data) {
      result.total += item._count;
      if (item.complianceState === 'Compliant') result.compliant += item._count;
      if (item.complianceState === 'NonCompliant') result.nonCompliant += item._count;
    }
    return result;
  }

  private aggregateUserStats(data: any[]): any {
    const result = { total: 0, enabled: 0 };
    for (const item of data) {
      result.total += item._count;
      if (item.accountEnabled) result.enabled += item._count;
    }
    return result;
  }
}

export default new AzureSyncService();
```

---

### 3.3 Scheduled Sync Job

**Create:** `server/src/jobs/azureSyncJob.ts`

```typescript
import cron from 'node-cron';
import prisma from '../config/database';
import logger from '../config/logger';
import azureSyncService from '../services/integrations/azureSyncService';

class AzureSyncJob {
  private job: cron.ScheduledTask | null = null;

  /**
   * Start the scheduled Azure sync job
   * Runs every 6 hours by default
   */
  start(cronExpression = '0 */6 * * *'): void {
    if (this.job) {
      logger.warn('Azure sync job is already running');
      return;
    }

    this.job = cron.schedule(cronExpression, async () => {
      logger.info('Starting scheduled Azure sync job');
      await this.runForAllOrganizations();
    });

    logger.info(`Azure sync job scheduled with cron: ${cronExpression}`);
  }

  stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = null;
      logger.info('Azure sync job stopped');
    }
  }

  /**
   * Run sync for all organizations with active Azure integration
   */
  async runForAllOrganizations(): Promise<void> {
    const integrations = await prisma.integration.findMany({
      where: {
        provider: 'azure',
        connected: true,
      },
      select: {
        organizationId: true,
        organization: { select: { name: true } },
      },
    });

    logger.info(`Found ${integrations.length} organizations with Azure integration`);

    for (const integration of integrations) {
      try {
        logger.info(`Starting Azure sync for organization: ${integration.organization.name}`);

        const result = await azureSyncService.runFullSync(
          integration.organizationId,
          'scheduled'
        );

        logger.info(`Azure sync completed for ${integration.organization.name}`, {
          itemsSynced: result.itemsSynced,
          itemsFailed: result.itemsFailed,
          duration: result.duration,
        });
      } catch (error) {
        logger.error(`Azure sync failed for ${integration.organization.name}`, { error });
      }
    }
  }
}

export default new AzureSyncJob();
```

**Register in index.ts:**
```typescript
// server/src/index.ts - Add after server starts
import azureSyncJob from './jobs/azureSyncJob';

// Start Azure sync job (every 6 hours)
if (process.env.AZURE_SYNC_ENABLED === 'true') {
  azureSyncJob.start(process.env.AZURE_SYNC_CRON || '0 */6 * * *');
}
```

---

### 3.4 New API Endpoints

**Update:** `server/src/routes/integrations.ts`

```typescript
// Add new Azure sync routes
router.post(
  '/azure/sync/trigger',
  authenticate,
  authorize('admin', 'editor'),
  integrationsController.triggerAzureSync
);

router.get(
  '/azure/sync/status',
  authenticate,
  integrationsController.getAzureSyncStatus
);

router.get(
  '/azure/resources',
  authenticate,
  integrationsController.getAzureResources
);

router.get(
  '/azure/alerts',
  authenticate,
  integrationsController.getAzureAlerts
);

router.get(
  '/azure/dashboard',
  authenticate,
  integrationsController.getAzureComplianceDashboard
);
```

**Update Controller:** `server/src/controllers/integrationsController.ts`

```typescript
import azureSyncService from '../services/integrations/azureSyncService';

triggerAzureSync: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { syncType = 'full' } = req.body;

  // Validate sync type
  const validTypes = ['full', 'resources', 'alerts', 'recommendations', 'compliance', 'users'];
  if (!validTypes.includes(syncType)) {
    res.status(400).json({ error: `Invalid sync type. Valid: ${validTypes.join(', ')}` });
    return;
  }

  // Check for existing running sync
  const runningSync = await prisma.azureSyncHistory.findFirst({
    where: {
      organizationId: authReq.user!.organizationId,
      status: 'running',
    },
  });

  if (runningSync) {
    res.status(409).json({
      error: 'A sync is already in progress',
      syncId: runningSync.id
    });
    return;
  }

  const result = await azureSyncService.runFullSync(
    authReq.user!.organizationId,
    authReq.user!.id
  );

  res.json(result);
};

getAzureSyncStatus: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;

  const stats = await azureSyncService.getSyncStats(authReq.user!.organizationId);

  const recentSyncs = await prisma.azureSyncHistory.findMany({
    where: { organizationId: authReq.user!.organizationId },
    orderBy: { startedAt: 'desc' },
    take: 10,
  });

  res.json({ stats, recentSyncs });
};

getAzureResources: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { type, resourceGroup, page = 1, limit = 50 } = req.query;

  const where: any = { organizationId: authReq.user!.organizationId };
  if (type) where.type = { contains: type as string };
  if (resourceGroup) where.resourceGroup = resourceGroup;

  const [resources, total] = await Promise.all([
    prisma.azureResource.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { syncedAt: 'desc' },
    }),
    prisma.azureResource.count({ where }),
  ]);

  res.json({
    resources,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
};

getAzureAlerts: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { severity, status, page = 1, limit = 50 } = req.query;

  const where: any = { organizationId: authReq.user!.organizationId };
  if (severity) where.severity = severity;
  if (status) where.status = status;

  const [alerts, total] = await Promise.all([
    prisma.azureSecurityAlert.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { startTime: 'desc' },
    }),
    prisma.azureSecurityAlert.count({ where }),
  ]);

  res.json({
    alerts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
};

getAzureComplianceDashboard: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;

  const [
    complianceSummary,
    alertSummary,
    recommendationSummary,
    resourceCount,
  ] = await Promise.all([
    prisma.azurePolicyCompliance.groupBy({
      by: ['complianceState'],
      where: { organizationId: authReq.user!.organizationId },
      _count: true,
    }),
    prisma.azureSecurityAlert.groupBy({
      by: ['severity'],
      where: {
        organizationId: authReq.user!.organizationId,
        status: 'Active',
      },
      _count: true,
    }),
    prisma.azureSecurityRecommendation.groupBy({
      by: ['severity', 'state'],
      where: { organizationId: authReq.user!.organizationId },
      _count: true,
    }),
    prisma.azureResource.count({
      where: { organizationId: authReq.user!.organizationId },
    }),
  ]);

  // Calculate compliance score
  const totalPolicies = complianceSummary.reduce((sum, item) => sum + item._count, 0);
  const compliantPolicies = complianceSummary.find(s => s.complianceState === 'Compliant')?._count || 0;
  const complianceScore = totalPolicies > 0 ? Math.round((compliantPolicies / totalPolicies) * 100) : 0;

  res.json({
    complianceScore,
    totalResources: resourceCount,
    policyCompliance: {
      total: totalPolicies,
      compliant: compliantPolicies,
      nonCompliant: complianceSummary.find(s => s.complianceState === 'NonCompliant')?._count || 0,
    },
    activeAlerts: {
      total: alertSummary.reduce((sum, item) => sum + item._count, 0),
      bySeverity: Object.fromEntries(alertSummary.map(s => [s.severity, s._count])),
    },
    recommendations: {
      total: recommendationSummary.reduce((sum, item) => sum + item._count, 0),
      unhealthy: recommendationSummary
        .filter(s => s.state === 'Unhealthy')
        .reduce((sum, item) => sum + item._count, 0),
    },
  });
};
```

---

### 3.5 Environment Variables

**Add to `.env`:**
```env
# Azure Sync Configuration
AZURE_SYNC_ENABLED=true
AZURE_SYNC_CRON=0 */6 * * *
AZURE_SYNC_BATCH_SIZE=100
AZURE_SYNC_TIMEOUT_MS=300000
```

---

## Implementation Checklist

### Feature Completeness (28 hours / 3-4 days)

| Task | Files | Effort | Status |
|------|-------|--------|--------|
| Control Mappings PATCH | routes/controlMappings.ts, controllers/controlMappingsController.ts | 2h | [ ] |
| Personnel PATCH/DELETE | routes/personnel.ts, controllers/personnelController.ts | 3h | [ ] |
| Evidence Version GET | routes/evidenceVersions.ts, controllers/evidenceVersioningController.ts | 1h | [ ] |
| Audit Export/Archive | routes/audit.ts, controllers/auditController.ts | 4h | [ ] |
| DORA Incident DELETE | routes/dora.ts, controllers/doraController.ts | 1h | [ ] |
| SoD Compensation DELETE | routes/sod.ts, controllers/sodController.ts | 1h | [ ] |
| Framework Control DELETE | routes/frameworks.ts, controllers/frameworksController.ts | 2h | [ ] |
| Workflow Rule DELETE | routes/workflow.ts, controllers/workflowController.ts | 1h | [ ] |
| MDM Device Reassign | routes/mdm.ts, controllers/mdmController.ts | 3h | [ ] |
| Billing Refund | routes/billing.ts, controllers/billingController.ts | 4h | [ ] |
| ESG CRUD | routes/featureModules.ts, controllers/featureModulesController.ts | 4h | [ ] |
| Organization Create/List | routes/organization.ts, controllers/organizationController.ts | 2h | [ ] |

### Application Logic (32 hours / 4-5 days)

| Task | Files | Effort | Status |
|------|-------|--------|--------|
| Joi Validators | validators/featureModulesValidators.ts + 5 controllers | 6h | [ ] |
| Silent Failure Logging | frameworkTemplateService, agenticAIService, physicalAIService | 4h | [ ] |
| State Machine | utils/stateMachine.ts, jitAccessService.ts | 4h | [ ] |
| Transaction Handling | agenticAIService, featureModulesController | 6h | [ ] |
| Edge Case Validation | multimodalIntakeService, jitAccessService | 4h | [ ] |
| Error Pattern Standardization | 10+ services | 8h | [ ] |

### Azure Sync (21 hours / 2-3 days)

| Task | Files | Effort | Status |
|------|-------|--------|--------|
| Schema Updates | prisma/schema.prisma | 2h | [ ] |
| Sync Service | services/integrations/azureSyncService.ts | 8h | [ ] |
| Scheduled Job | jobs/azureSyncJob.ts | 2h | [ ] |
| Controller Updates | controllers/integrationsController.ts | 4h | [ ] |
| Route Updates | routes/integrations.ts | 1h | [ ] |
| Tests | __tests__/unit/services/integrations/azureSyncService.test.ts | 4h | [ ] |

---

## Summary

| Category | Current | Target | Gap | Total Effort |
|----------|---------|--------|-----|--------------|
| Feature Completeness | 20/25 | 25/25 | 5 pts | 28 hours |
| Application Logic | 12/15 | 15/15 | 3 pts | 32 hours |
| Azure Sync | Partial | Complete | - | 21 hours |
| **Total** | **90/100** | **100/100** | **10 pts** | **81 hours (10-12 days)** |

---

**Document Created:** 2026-02-24
**Target Completion:** 2026-03-08
**Author:** Claude Code Production Readiness Audit
