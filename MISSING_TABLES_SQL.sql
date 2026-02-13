-- ============================================================================
-- ComplyEasyAI - Missing Database Tables SQL
-- ============================================================================
-- This file contains CREATE TABLE statements for features that exist in the
-- codebase but currently use in-memory storage (Maps) instead of database tables.
-- 
-- Generated: 2026-02-07
-- 
-- PRIORITY LEVELS:
--   HIGH: Data loss risk on server restart
--   MEDIUM: Feature enhancement/persistence
--   LOW: Optional optimization
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- HIGH PRIORITY: JIT (Just-In-Time) Access Management
-- Source: server/src/services/advanced/jitAccessService.ts
-- Currently using: activeSessions Map, persisted via AuditLog (not optimized)
-- ============================================================================

-- JIT Access Request - tracks privilege escalation requests
CREATE TABLE IF NOT EXISTS "JITAccessRequest" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedPrivilege" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "justification" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 3600, -- duration in seconds
    "status" TEXT NOT NULL DEFAULT 'pending', -- pending, approved, denied, expired, revoked
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "deniedBy" TEXT,
    "deniedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JITAccessRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JITAccessRequest_userId_idx" ON "JITAccessRequest"("userId");
CREATE INDEX "JITAccessRequest_organizationId_idx" ON "JITAccessRequest"("organizationId");
CREATE INDEX "JITAccessRequest_status_idx" ON "JITAccessRequest"("status");
CREATE INDEX "JITAccessRequest_expiresAt_idx" ON "JITAccessRequest"("expiresAt");

ALTER TABLE "JITAccessRequest" ADD CONSTRAINT "JITAccessRequest_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JITAccessRequest" ADD CONSTRAINT "JITAccessRequest_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JITAccessRequest" ADD CONSTRAINT "JITAccessRequest_approvedBy_fkey" 
    FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- JIT Session - tracks active elevated privilege sessions
CREATE TABLE IF NOT EXISTS "JITSession" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "privilege" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "extendedCount" INTEGER NOT NULL DEFAULT 0,
    "actionsPerformed" JSONB DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "terminatedBy" TEXT,
    "terminationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JITSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JITSession_requestId_idx" ON "JITSession"("requestId");
CREATE INDEX "JITSession_userId_idx" ON "JITSession"("userId");
CREATE INDEX "JITSession_organizationId_idx" ON "JITSession"("organizationId");
CREATE INDEX "JITSession_active_idx" ON "JITSession"("active");
CREATE INDEX "JITSession_expiresAt_idx" ON "JITSession"("expiresAt");

ALTER TABLE "JITSession" ADD CONSTRAINT "JITSession_requestId_fkey" 
    FOREIGN KEY ("requestId") REFERENCES "JITAccessRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JITSession" ADD CONSTRAINT "JITSession_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JITSession" ADD CONSTRAINT "JITSession_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- HIGH PRIORITY: Swarm Task Allocation System
-- Source: server/src/services/advanced/swarmTaskAllocationService.ts
-- Currently using: taskQueue, activeTasks, completedTasks, agents Maps
-- ============================================================================

-- Swarm Agent - registered AI agents for task processing
CREATE TABLE IF NOT EXISTS "SwarmAgent" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL, -- unique identifier for the agent instance
    "name" TEXT NOT NULL,
    "agentType" TEXT NOT NULL, -- observe, act, verify, analyze, etc.
    "status" TEXT NOT NULL DEFAULT 'idle', -- idle, busy, offline, maintenance
    "capabilities" JSONB NOT NULL DEFAULT '[]', -- array of capability strings
    "currentLoad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxLoad" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "performance" JSONB DEFAULT '{"tasksCompleted": 0, "avgDuration": 0, "successRate": 1.0}',
    "lastHeartbeat" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwarmAgent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SwarmAgent_agentId_organizationId_key" ON "SwarmAgent"("agentId", "organizationId");
CREATE INDEX "SwarmAgent_organizationId_idx" ON "SwarmAgent"("organizationId");
CREATE INDEX "SwarmAgent_status_idx" ON "SwarmAgent"("status");
CREATE INDEX "SwarmAgent_agentType_idx" ON "SwarmAgent"("agentType");
CREATE INDEX "SwarmAgent_lastHeartbeat_idx" ON "SwarmAgent"("lastHeartbeat");

ALTER TABLE "SwarmAgent" ADD CONSTRAINT "SwarmAgent_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Swarm Task - tasks queued for processing by swarm agents
CREATE TABLE IF NOT EXISTS "SwarmTask" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5, -- 1-10, higher = more urgent
    "status" TEXT NOT NULL DEFAULT 'queued', -- queued, assigned, in_progress, completed, failed, cancelled
    "payload" JSONB NOT NULL,
    "constraints" JSONB DEFAULT '{}', -- resource/timing constraints
    "assignedAgents" JSONB DEFAULT '[]', -- array of agent IDs
    "dependencies" JSONB DEFAULT '[]', -- array of task IDs that must complete first
    "parentTaskId" TEXT,
    "subtasks" JSONB DEFAULT '[]', -- array of subtask IDs
    "estimatedDuration" INTEGER, -- in milliseconds
    "actualDuration" INTEGER,
    "deadline" TIMESTAMP(3),
    "timeoutAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "result" JSONB,
    "error" TEXT,
    "metrics" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwarmTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SwarmTask_organizationId_idx" ON "SwarmTask"("organizationId");
CREATE INDEX "SwarmTask_status_idx" ON "SwarmTask"("status");
CREATE INDEX "SwarmTask_priority_idx" ON "SwarmTask"("priority");
CREATE INDEX "SwarmTask_taskType_idx" ON "SwarmTask"("taskType");
CREATE INDEX "SwarmTask_parentTaskId_idx" ON "SwarmTask"("parentTaskId");
CREATE INDEX "SwarmTask_deadline_idx" ON "SwarmTask"("deadline");
CREATE INDEX "SwarmTask_createdAt_idx" ON "SwarmTask"("createdAt");

ALTER TABLE "SwarmTask" ADD CONSTRAINT "SwarmTask_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SwarmTask" ADD CONSTRAINT "SwarmTask_parentTaskId_fkey" 
    FOREIGN KEY ("parentTaskId") REFERENCES "SwarmTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Swarm Task Checkpoint - progress checkpoints for long-running tasks
CREATE TABLE IF NOT EXISTS "SwarmTaskCheckpoint" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "taskId" TEXT NOT NULL,
    "agentId" TEXT,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0, -- 0.0 to 1.0
    "state" JSONB NOT NULL DEFAULT '{}', -- serialized task state
    "description" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwarmTaskCheckpoint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SwarmTaskCheckpoint_taskId_idx" ON "SwarmTaskCheckpoint"("taskId");
CREATE INDEX "SwarmTaskCheckpoint_timestamp_idx" ON "SwarmTaskCheckpoint"("timestamp");

ALTER TABLE "SwarmTaskCheckpoint" ADD CONSTRAINT "SwarmTaskCheckpoint_taskId_fkey" 
    FOREIGN KEY ("taskId") REFERENCES "SwarmTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- HIGH PRIORITY: User Session Management
-- Source: server/src/services/sessionManagementService.ts
-- Currently using: activeSessions Map
-- ============================================================================

CREATE TABLE IF NOT EXISTS "UserSession" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" JSONB,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "timeoutWarningSent" BOOLEAN NOT NULL DEFAULT false,
    "terminatedAt" TIMESTAMP(3),
    "terminationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSession_sessionToken_key" ON "UserSession"("sessionToken");
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX "UserSession_organizationId_idx" ON "UserSession"("organizationId");
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");
CREATE INDEX "UserSession_lastActivityAt_idx" ON "UserSession"("lastActivityAt");

ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- HIGH PRIORITY: VR Collaborative Session Data
-- Source: server/src/services/advanced/vrCollaborativeReviewService.ts
-- Currently using: sessionParticipants, sessionChats, annotations, 
--                  voiceChatStates, trainingProgress Maps
-- Note: VRCollaborativeSession table already exists
-- ============================================================================

-- VR Participant - participants in collaborative VR sessions
CREATE TABLE IF NOT EXISTS "VRParticipant" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "sessionId" TEXT NOT NULL, -- references VRCollaborativeSession.sessionId
    "vrSessionDbId" TEXT NOT NULL, -- references VRCollaborativeSession.id
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant', -- host, moderator, participant, observer
    "avatarConfig" JSONB,
    "position" JSONB DEFAULT '{"x": 0, "y": 0, "z": 0}',
    "rotation" JSONB DEFAULT '{"x": 0, "y": 0, "z": 0}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSpeaking" BOOLEAN NOT NULL DEFAULT false,
    "isFollowing" TEXT, -- userId of person being followed
    "pointerPosition" JSONB,
    "screenSharing" BOOLEAN NOT NULL DEFAULT false,
    "sharedView" JSONB,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "VRParticipant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VRParticipant_sessionId_idx" ON "VRParticipant"("sessionId");
CREATE INDEX "VRParticipant_vrSessionDbId_idx" ON "VRParticipant"("vrSessionDbId");
CREATE INDEX "VRParticipant_userId_idx" ON "VRParticipant"("userId");
CREATE INDEX "VRParticipant_isActive_idx" ON "VRParticipant"("isActive");

ALTER TABLE "VRParticipant" ADD CONSTRAINT "VRParticipant_vrSessionDbId_fkey" 
    FOREIGN KEY ("vrSessionDbId") REFERENCES "VRCollaborativeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VRParticipant" ADD CONSTRAINT "VRParticipant_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- VR Chat Message - chat messages in VR sessions
CREATE TABLE IF NOT EXISTS "VRChatMessage" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "sessionId" TEXT NOT NULL,
    "vrSessionDbId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text', -- text, system, action, annotation
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VRChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VRChatMessage_sessionId_idx" ON "VRChatMessage"("sessionId");
CREATE INDEX "VRChatMessage_vrSessionDbId_idx" ON "VRChatMessage"("vrSessionDbId");
CREATE INDEX "VRChatMessage_userId_idx" ON "VRChatMessage"("userId");
CREATE INDEX "VRChatMessage_timestamp_idx" ON "VRChatMessage"("timestamp");

ALTER TABLE "VRChatMessage" ADD CONSTRAINT "VRChatMessage_vrSessionDbId_fkey" 
    FOREIGN KEY ("vrSessionDbId") REFERENCES "VRCollaborativeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- VR Annotation - annotations placed in VR environment
CREATE TABLE IF NOT EXISTS "VRAnnotation" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "sessionId" TEXT NOT NULL,
    "vrSessionDbId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL, -- control, document, evidence, 3d-object
    "targetId" TEXT NOT NULL,
    "position" JSONB NOT NULL,
    "content" TEXT NOT NULL,
    "annotationType" TEXT NOT NULL DEFAULT 'note', -- note, highlight, question, approval
    "color" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VRAnnotation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VRAnnotation_sessionId_idx" ON "VRAnnotation"("sessionId");
CREATE INDEX "VRAnnotation_vrSessionDbId_idx" ON "VRAnnotation"("vrSessionDbId");
CREATE INDEX "VRAnnotation_userId_idx" ON "VRAnnotation"("userId");
CREATE INDEX "VRAnnotation_targetType_idx" ON "VRAnnotation"("targetType");
CREATE INDEX "VRAnnotation_targetId_idx" ON "VRAnnotation"("targetId");

ALTER TABLE "VRAnnotation" ADD CONSTRAINT "VRAnnotation_vrSessionDbId_fkey" 
    FOREIGN KEY ("vrSessionDbId") REFERENCES "VRCollaborativeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- VR Voice Chat State - voice chat settings per participant
CREATE TABLE IF NOT EXISTS "VRVoiceChatState" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "sessionId" TEXT NOT NULL,
    "vrSessionDbId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "spatialAudioEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VRVoiceChatState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VRVoiceChatState_sessionId_userId_key" ON "VRVoiceChatState"("sessionId", "userId");
CREATE INDEX "VRVoiceChatState_vrSessionDbId_idx" ON "VRVoiceChatState"("vrSessionDbId");

ALTER TABLE "VRVoiceChatState" ADD CONSTRAINT "VRVoiceChatState_vrSessionDbId_fkey" 
    FOREIGN KEY ("vrSessionDbId") REFERENCES "VRCollaborativeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- VR Training Progress - training progress tracking in VR
CREATE TABLE IF NOT EXISTS "VRTrainingProgress" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "sessionId" TEXT NOT NULL,
    "vrSessionDbId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT,
    "completedTasks" JSONB NOT NULL DEFAULT '[]',
    "score" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0, -- in seconds
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VRTrainingProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VRTrainingProgress_sessionId_userId_key" ON "VRTrainingProgress"("sessionId", "userId");
CREATE INDEX "VRTrainingProgress_vrSessionDbId_idx" ON "VRTrainingProgress"("vrSessionDbId");
CREATE INDEX "VRTrainingProgress_userId_idx" ON "VRTrainingProgress"("userId");

ALTER TABLE "VRTrainingProgress" ADD CONSTRAINT "VRTrainingProgress_vrSessionDbId_fkey" 
    FOREIGN KEY ("vrSessionDbId") REFERENCES "VRCollaborativeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VRTrainingProgress" ADD CONSTRAINT "VRTrainingProgress_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- MEDIUM PRIORITY: Questionnaire Templates
-- Source: server/src/data/questionnaireTemplates.ts
-- Currently using: Static TypeScript array
-- ============================================================================

CREATE TABLE IF NOT EXISTS "QuestionnaireTemplate" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT, -- NULL for system templates
    "title" TEXT NOT NULL,
    "description" TEXT,
    "templateType" TEXT NOT NULL, -- SIG_Lite, VDD, PIA, SOC2, HIPAA, ITGC, etc.
    "category" TEXT,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "categories" JSONB DEFAULT '[]', -- array of category names
    "questions" JSONB NOT NULL DEFAULT '[]', -- array of question objects
    "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionnaireTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuestionnaireTemplate_organizationId_idx" ON "QuestionnaireTemplate"("organizationId");
CREATE INDEX "QuestionnaireTemplate_templateType_idx" ON "QuestionnaireTemplate"("templateType");
CREATE INDEX "QuestionnaireTemplate_isSystemTemplate_idx" ON "QuestionnaireTemplate"("isSystemTemplate");
CREATE INDEX "QuestionnaireTemplate_isActive_idx" ON "QuestionnaireTemplate"("isActive");

ALTER TABLE "QuestionnaireTemplate" ADD CONSTRAINT "QuestionnaireTemplate_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- MEDIUM PRIORITY: Policy Templates
-- Source: server/src/services/policyLibraryService.ts
-- Currently using: Dynamic generation or in-memory
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PolicyTemplate" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT, -- NULL for system templates
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL, -- Security, Privacy, HR, IT, Compliance
    "framework" TEXT, -- SOC2, ISO27001, HIPAA, etc.
    "content" TEXT NOT NULL, -- Template content with placeholders
    "variables" JSONB DEFAULT '[]', -- Variables that need to be filled in
    "version" TEXT NOT NULL DEFAULT '1.0',
    "tags" JSONB DEFAULT '[]',
    "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PolicyTemplate_organizationId_idx" ON "PolicyTemplate"("organizationId");
CREATE INDEX "PolicyTemplate_category_idx" ON "PolicyTemplate"("category");
CREATE INDEX "PolicyTemplate_framework_idx" ON "PolicyTemplate"("framework");
CREATE INDEX "PolicyTemplate_isSystemTemplate_idx" ON "PolicyTemplate"("isSystemTemplate");
CREATE INDEX "PolicyTemplate_isActive_idx" ON "PolicyTemplate"("isActive");

ALTER TABLE "PolicyTemplate" ADD CONSTRAINT "PolicyTemplate_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- MEDIUM PRIORITY: WebRTC Signaling
-- Source: server/src/services/advanced/webrtcSignalingService.ts
-- Currently using: sessions Map, peers Map, rateLimiting Maps
-- ============================================================================

-- WebRTC Session - WebRTC session rooms
CREATE TABLE IF NOT EXISTS "WebRTCSession" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "sessionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'call', -- call, screen-share, vr-collab
    "hostUserId" TEXT NOT NULL,
    "maxPeers" INTEGER NOT NULL DEFAULT 10,
    "config" JSONB DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active', -- active, ended
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "WebRTCSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WebRTCSession_sessionId_key" ON "WebRTCSession"("sessionId");
CREATE INDEX "WebRTCSession_organizationId_idx" ON "WebRTCSession"("organizationId");
CREATE INDEX "WebRTCSession_hostUserId_idx" ON "WebRTCSession"("hostUserId");
CREATE INDEX "WebRTCSession_status_idx" ON "WebRTCSession"("status");

ALTER TABLE "WebRTCSession" ADD CONSTRAINT "WebRTCSession_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- WebRTC Peer - peers connected to WebRTC sessions
CREATE TABLE IF NOT EXISTS "WebRTCPeer" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "sessionId" TEXT NOT NULL,
    "webrtcSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "peerId" TEXT NOT NULL,
    "socketId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'connecting', -- connecting, connected, disconnected
    "connectionQuality" JSONB DEFAULT '{}',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "WebRTCPeer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebRTCPeer_sessionId_idx" ON "WebRTCPeer"("sessionId");
CREATE INDEX "WebRTCPeer_webrtcSessionId_idx" ON "WebRTCPeer"("webrtcSessionId");
CREATE INDEX "WebRTCPeer_userId_idx" ON "WebRTCPeer"("userId");
CREATE INDEX "WebRTCPeer_status_idx" ON "WebRTCPeer"("status");

ALTER TABLE "WebRTCPeer" ADD CONSTRAINT "WebRTCPeer_webrtcSessionId_fkey" 
    FOREIGN KEY ("webrtcSessionId") REFERENCES "WebRTCSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- MEDIUM PRIORITY: Liveness Detection
-- Source: server/src/services/advanced/livenessDetectionService.ts
-- Currently using: activeChallenges Map, sessionHistory Map
-- ============================================================================

-- Liveness Challenge - biometric liveness verification challenges
CREATE TABLE IF NOT EXISTS "LivenessChallenge" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "challengeType" TEXT NOT NULL, -- blink, head-turn, smile, random-gesture
    "challengeData" JSONB NOT NULL, -- specific challenge parameters
    "status" TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed, expired
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "result" JSONB, -- verification results
    "confidence" DOUBLE PRECISION,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LivenessChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LivenessChallenge_userId_idx" ON "LivenessChallenge"("userId");
CREATE INDEX "LivenessChallenge_organizationId_idx" ON "LivenessChallenge"("organizationId");
CREATE INDEX "LivenessChallenge_status_idx" ON "LivenessChallenge"("status");
CREATE INDEX "LivenessChallenge_expiresAt_idx" ON "LivenessChallenge"("expiresAt");

ALTER TABLE "LivenessChallenge" ADD CONSTRAINT "LivenessChallenge_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LivenessChallenge" ADD CONSTRAINT "LivenessChallenge_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Liveness Frame - individual frame data from liveness checks
CREATE TABLE IF NOT EXISTS "LivenessFrame" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "challengeId" TEXT NOT NULL,
    "frameNumber" INTEGER NOT NULL,
    "frameData" JSONB NOT NULL, -- analysis data (not raw image)
    "livenessScore" DOUBLE PRECISION NOT NULL,
    "spoofScore" DOUBLE PRECISION,
    "faceDetected" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LivenessFrame_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LivenessFrame_challengeId_idx" ON "LivenessFrame"("challengeId");
CREATE INDEX "LivenessFrame_timestamp_idx" ON "LivenessFrame"("timestamp");

ALTER TABLE "LivenessFrame" ADD CONSTRAINT "LivenessFrame_challengeId_fkey" 
    FOREIGN KEY ("challengeId") REFERENCES "LivenessChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- LOW PRIORITY: LDAP Role Mappings
-- Source: server/src/services/advanced/ldapPermissionService.ts
-- Currently using: roleMappings Map
-- ============================================================================

CREATE TABLE IF NOT EXISTS "LDAPRoleMapping" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "ldapGroupDN" TEXT NOT NULL, -- Distinguished Name of LDAP group
    "ldapGroupName" TEXT, -- Friendly name
    "internalRole" TEXT NOT NULL, -- admin, compliance_manager, auditor, viewer
    "priority" INTEGER NOT NULL DEFAULT 0, -- Higher priority mappings take precedence
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LDAPRoleMapping_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LDAPRoleMapping_organizationId_ldapGroupDN_key" ON "LDAPRoleMapping"("organizationId", "ldapGroupDN");
CREATE INDEX "LDAPRoleMapping_organizationId_idx" ON "LDAPRoleMapping"("organizationId");
CREATE INDEX "LDAPRoleMapping_enabled_idx" ON "LDAPRoleMapping"("enabled");

ALTER TABLE "LDAPRoleMapping" ADD CONSTRAINT "LDAPRoleMapping_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- LOW PRIORITY: Swarm Metrics and Alerts
-- Source: server/src/services/advanced/swarmTaskAllocationService.ts
-- Currently using: historicalMetrics Map, metricAlerts Map
-- ============================================================================

-- Swarm Task Metric - historical performance metrics
CREATE TABLE IF NOT EXISTS "SwarmTaskMetric" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL, -- throughput, latency, success_rate, queue_depth, agent_utilization
    "value" DOUBLE PRECISION NOT NULL,
    "taskType" TEXT,
    "agentId" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwarmTaskMetric_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SwarmTaskMetric_organizationId_idx" ON "SwarmTaskMetric"("organizationId");
CREATE INDEX "SwarmTaskMetric_metricType_idx" ON "SwarmTaskMetric"("metricType");
CREATE INDEX "SwarmTaskMetric_timestamp_idx" ON "SwarmTaskMetric"("timestamp");
CREATE INDEX "SwarmTaskMetric_taskType_idx" ON "SwarmTaskMetric"("taskType");

ALTER TABLE "SwarmTaskMetric" ADD CONSTRAINT "SwarmTaskMetric_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Swarm Task Alert - alerts for swarm system issues
CREATE TABLE IF NOT EXISTS "SwarmTaskAlert" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL, -- high_latency, low_throughput, agent_offline, task_timeout, queue_overflow
    "severity" TEXT NOT NULL DEFAULT 'warning', -- info, warning, error, critical
    "message" TEXT NOT NULL,
    "context" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwarmTaskAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SwarmTaskAlert_organizationId_idx" ON "SwarmTaskAlert"("organizationId");
CREATE INDEX "SwarmTaskAlert_alertType_idx" ON "SwarmTaskAlert"("alertType");
CREATE INDEX "SwarmTaskAlert_severity_idx" ON "SwarmTaskAlert"("severity");
CREATE INDEX "SwarmTaskAlert_resolved_idx" ON "SwarmTaskAlert"("resolved");
CREATE INDEX "SwarmTaskAlert_createdAt_idx" ON "SwarmTaskAlert"("createdAt");

ALTER TABLE "SwarmTaskAlert" ADD CONSTRAINT "SwarmTaskAlert_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- LOW PRIORITY (OPTIONAL): GNN Model Storage
-- Source: server/src/services/advanced/graphNeuralNetworkService.ts
-- Currently using: In-memory weights, file system for persistence
-- Note: This is optional - file system storage may be sufficient
-- ============================================================================

CREATE TABLE IF NOT EXISTS "GNNModel" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "modelType" TEXT NOT NULL, -- compliance_graph, risk_prediction, control_embedding
    "version" INTEGER NOT NULL DEFAULT 1,
    "weights" JSONB NOT NULL, -- Serialized model weights (for small models)
    "weightsPath" TEXT, -- Path to file for large models
    "architecture" JSONB, -- Model architecture description
    "hyperparameters" JSONB,
    "trainingMetrics" JSONB,
    "performanceMetrics" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "trainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GNNModel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GNNModel_organizationId_modelId_version_key" ON "GNNModel"("organizationId", "modelId", "version");
CREATE INDEX "GNNModel_organizationId_idx" ON "GNNModel"("organizationId");
CREATE INDEX "GNNModel_modelType_idx" ON "GNNModel"("modelType");
CREATE INDEX "GNNModel_isActive_idx" ON "GNNModel"("isActive");

ALTER TABLE "GNNModel" ADD CONSTRAINT "GNNModel_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- SUMMARY
-- ============================================================================
-- 
-- HIGH PRIORITY (Data Loss Risk) - 8 tables:
--   1. JITAccessRequest
--   2. JITSession
--   3. SwarmAgent
--   4. SwarmTask
--   5. SwarmTaskCheckpoint
--   6. UserSession
--   7. VRParticipant
--   8. VRChatMessage
--   + VRAnnotation, VRVoiceChatState, VRTrainingProgress (5 more VR tables)
--
-- MEDIUM PRIORITY (Feature Enhancement) - 6 tables:
--   1. QuestionnaireTemplate
--   2. PolicyTemplate
--   3. WebRTCSession
--   4. WebRTCPeer
--   5. LivenessChallenge
--   6. LivenessFrame
--
-- LOW PRIORITY (Optional/Optimization) - 4 tables:
--   1. LDAPRoleMapping
--   2. SwarmTaskMetric
--   3. SwarmTaskAlert
--   4. GNNModel
--
-- TOTAL NEW TABLES: 21
-- ============================================================================
