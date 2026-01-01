/**
 * VR-based Collaborative Review Service
 *
 * Features:
 * - Virtual reality compliance review sessions
 * - 3D visualization of compliance data
 * - Multi-user collaborative review spaces
 * - Real-time voice and gesture interactions
 * - Spatial compliance dashboards
 * - VR-based training simulations
 */

import prisma from '../../config/database';
import logger from '../../config/logger';
import crypto from 'crypto';

// VR Session Types
export interface VRSession {
  id: string;
  organizationId: string;
  sessionName: string;
  description?: string;
  sessionType: 'review' | 'training' | 'simulation' | 'audit';
  status: 'pending' | 'active' | 'paused' | 'completed';
  hostUserId: string;
  participants: VRParticipant[];
  maxParticipants?: number;
  scheduledTime?: Date;
  environment: VREnvironment;
  complianceData: VRComplianceData;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  permissions?: {
    canJoin: string[]; // user IDs or roles
    canEdit: string[];
    canRecord: string[];
  };
  recording?: VRRecording;
}

export interface VRParticipant {
  id: string;
  userId: string;
  userName: string;
  role: 'host' | 'reviewer' | 'observer' | 'trainee' | 'presenter';
  avatarConfig: AvatarConfig;
  position: Vector3D;
  rotation: Vector3D;
  isActive: boolean;
  joinedAt: Date;
  lastActiveAt: Date;
  isSpeaking?: boolean;
  isFollowing?: string; // userId being followed
  isBeingFollowed?: string[]; // userIds following this participant
  pointerPosition?: Vector3D;
  screenSharing?: boolean;
  sharedView?: any;
}

export interface AvatarConfig {
  headModel: string;
  bodyModel: string;
  handModels: string;
  colorScheme: string;
  accessories?: string[];
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface VREnvironment {
  template: 'boardroom' | 'command_center' | 'audit_room' | 'training_lab' | 'data_visualization' | 'custom';
  theme?: 'default' | 'dark' | 'light' | 'colorful' | 'minimal' | 'futuristic';
  customSettings?: {
    skybox?: string;
    lighting?: string;
    ambientSound?: string;
    props?: VRProp[];
  };
  interactiveObjects: VRInteractiveObject[];
  spatialAnchors: SpatialAnchor[];
  relationshipMappings?: RelationshipMapping[];
  frameworkClusters?: FrameworkCluster[];
  performanceMetrics?: {
    fps: number;
    renderTime: number;
    lastUpdated: Date;
  };
}

export interface VRProp {
  id: string;
  modelUrl: string;
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
}

export interface VRInteractiveObject {
  id: string;
  type: 'dashboard' | 'document' | 'control_panel' | 'data_cube' | 'timeline' | 'annotation' | 'whiteboard';
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  data?: any;
  permissions: {
    canView: string[];
    canEdit: string[];
    canInteract: string[];
  };
}

export interface SpatialAnchor {
  id: string;
  name: string;
  position: Vector3D;
  type: 'spawn_point' | 'presentation_area' | 'discussion_zone' | 'private_review' | 'data_center';
}

export interface VRComplianceData {
  frameworks: VRFrameworkVisualization[];
  controls: VRControlVisualization[];
  risks: VRRiskVisualization[];
  timelines: VRTimelineVisualization[];
  spatialMappings: SpatialDataMapping[];
}

export interface VRFrameworkVisualization {
  frameworkId: string;
  frameworkName: string;
  position: Vector3D;
  visualization: 'sphere' | 'cube' | 'tower' | 'tree' | 'network';
  complianceScore: number;
  colorCode: string;
  childControls: string[];
}

export interface VRControlVisualization {
  controlId: string;
  controlName: string;
  parentFramework: string;
  position: Vector3D;
  status: string;
  statusColor: string;
  evidenceLinks: string[];
  size: number;
}

export interface VRRiskVisualization {
  riskId: string;
  title: string;
  severity: string;
  position: Vector3D;
  visualSize: number;
  pulseIntensity: number;
  connections: string[];
}

export interface VRTimelineVisualization {
  id: string;
  events: VRTimelineEvent[];
  position: Vector3D;
  scale: number;
  orientation: 'horizontal' | 'vertical' | 'circular';
}

export interface VRTimelineEvent {
  timestamp: Date;
  eventType: string;
  description: string;
  position: number;
  color: string;
  isInteractive: boolean;
}

export interface SpatialDataMapping {
  dataType: string;
  spatialRepresentation: string;
  zoneId: string;
  aggregationLevel: 'summary' | 'detailed' | 'granular';
}

export interface VRAnnotation {
  id: string;
  sessionId: string;
  authorId: string;
  authorName: string;
  content: string;
  position: Vector3D;
  attachedTo?: string;
  type: 'note' | 'question' | 'action_item' | 'approval' | 'concern' | 'voice';
  visibility: 'public' | 'private' | 'team';
  createdAt: Date;
  updatedAt?: Date;
  resolved: boolean;
  voiceNoteUrl?: string;
  voiceNoteDuration?: number;
  history?: Array<{
    timestamp: Date;
    action: 'created' | 'edited' | 'deleted';
    userId: string;
    changes?: any;
  }>;
}

export interface VRRecording {
  id: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  recordingType: 'full' | 'highlights' | 'decisions_only';
  participants: string[];
  annotations: VRAnnotation[];
  spatialEvents: any[];
  voiceTranscript?: string;
  storageUrl?: string;
}

export interface VRTrainingScenario {
  id: string;
  name: string;
  description: string;
  framework: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDuration: number;
  objectives: string[];
  scenes: VRTrainingScene[];
  assessmentCriteria: VRAssessmentCriteria[];
}

export interface RelationshipMapping {
  fromId: string;
  toId: string;
  relationshipType: 'depends_on' | 'implements' | 'mitigates' | 'relates_to';
  lineColor: string;
  lineWidth: number;
  position: Vector3D[];
}

export interface FrameworkCluster {
  clusterId: string;
  frameworkIds: string[];
  centerPosition: Vector3D;
  radius: number;
  color: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system';
}

export interface VoiceChatState {
  enabled: boolean;
  participants: Array<{
    userId: string;
    isMuted: boolean;
    volume: number;
  }>;
}

export interface TrainingProgress {
  sessionId: string;
  userId: string;
  scenarioId: string;
  currentScene: string;
  completedTasks: string[];
  score: number;
  startedAt: Date;
  lastUpdated: Date;
}

export interface TrainingCertificate {
  id: string;
  userId: string;
  scenarioId: string;
  scenarioName: string;
  score: number;
  passed: boolean;
  completedAt: Date;
  certificateUrl?: string;
}

export interface VRTrainingScene {
  id: string;
  name: string;
  description: string;
  environment: VREnvironment;
  tasks: VRTrainingTask[];
  completionConditions: any;
  hints: string[];
}

export interface VRTrainingTask {
  id: string;
  description: string;
  targetObject?: string;
  requiredAction: string;
  successFeedback: string;
  failureFeedback: string;
  points: number;
}

export interface VRAssessmentCriteria {
  criteriaId: string;
  name: string;
  weight: number;
  passingScore: number;
}

class VRCollaborativeReviewService {
  private activeSessions: Map<string, VRSession> = new Map();
  private sessionParticipants: Map<string, Map<string, VRParticipant>> = new Map();
  private sessionChats: Map<string, ChatMessage[]> = new Map();
  private voiceChatStates: Map<string, VoiceChatState> = new Map();
  private trainingProgress: Map<string, TrainingProgress> = new Map();
  private annotations: Map<string, VRAnnotation[]> = new Map();

  /**
   * Create a new VR review session (enhanced)
   */
  async createSession(
    organizationId: string,
    config: {
      sessionName: string;
      description?: string;
      sessionType: 'review' | 'training' | 'simulation' | 'audit';
      environment: VREnvironment['template'];
      frameworkIds?: string[];
      controlIds?: string[];
      invitedUsers?: string[];
      scheduledTime?: Date;
      maxParticipants?: number;
      permissions?: {
        canJoin?: string[];
        canEdit?: string[];
        canRecord?: string[];
      };
    },
    hostUserId: string
  ): Promise<VRSession> {
    try {
      const sessionId = `vr_session_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      // Load compliance data for visualization
      const complianceData = await this.loadComplianceDataForVR(
        organizationId,
        config.frameworkIds,
        config.controlIds
      );

      // Generate VR environment
      const environment = await this.generateVREnvironment(
        config.environment,
        complianceData
      );

      // Get host user info
      const hostUser = await prisma.user.findUnique({
        where: { id: hostUserId },
        select: { id: true, name: true },
      });

      const hostParticipant: VRParticipant = {
        id: `participant_${hostUserId}`,
        userId: hostUserId,
        userName: hostUser?.name || 'Host',
        role: 'host',
        avatarConfig: this.getDefaultAvatarConfig(),
        position: { x: 0, y: 1.6, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        isActive: true,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
      };

      const session: VRSession = {
        id: sessionId,
        organizationId,
        sessionName: config.sessionName,
        description: config.description,
        sessionType: config.sessionType,
        status: 'pending',
        hostUserId,
        participants: [hostParticipant],
        maxParticipants: config.maxParticipants,
        scheduledTime: config.scheduledTime,
        environment,
        complianceData,
        permissions: {
          canJoin: config.permissions?.canJoin || ['*'],
          canEdit: config.permissions?.canEdit || ['host', 'reviewer'],
          canRecord: config.permissions?.canRecord || ['host'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store session in memory and database
      this.activeSessions.set(sessionId, session);
      this.sessionParticipants.set(sessionId, new Map([[hostUserId, hostParticipant]]));
      this.sessionChats.set(sessionId, []);
      this.voiceChatStates.set(sessionId, {
        enabled: true,
        participants: [{ userId: hostUserId, isMuted: false, volume: 1.0 }],
      });
      this.annotations.set(sessionId, []);

      // Store in database
      await prisma.auditLog.create({
        data: {
          action: 'vr_session.created',
          details: JSON.stringify({
            sessionId,
            sessionType: config.sessionType,
            environment: config.environment,
            frameworkCount: config.frameworkIds?.length || 0,
          }),
          userId: hostUserId,
          organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      // Send invitations if provided
      if (config.invitedUsers && config.invitedUsers.length > 0) {
        await this.sendSessionInvitations(sessionId, config.invitedUsers, hostUserId);
      }

      logger.info(`[VR Review] Session created: ${sessionId}`);

      return session;
    } catch (error) {
      logger.error('[VR Review] Error creating session', error);
      throw error;
    }
  }

  /**
   * Join an existing VR session (enhanced with max participants check)
   */
  async joinSession(
    sessionId: string,
    userId: string,
    role: VRParticipant['role'] = 'reviewer'
  ): Promise<{
    session: VRSession;
    participant: VRParticipant;
    spawnPoint: Vector3D;
  }> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found or inactive');
      }

      if (session.status === 'completed') {
        throw new Error('Session has already ended');
      }

      // Check max participants
      if (session.maxParticipants && session.participants.length >= session.maxParticipants) {
        throw new Error(`Session is full (max ${session.maxParticipants} participants)`);
      }

      // Check permissions
      if (session.permissions?.canJoin && !session.permissions.canJoin.includes('*')) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const userRole = user?.role || 'viewer';
        if (!session.permissions.canJoin.includes(userId) && !session.permissions.canJoin.includes(userRole)) {
          throw new Error('You do not have permission to join this session');
        }
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true },
      });

      // Get spawn point
      const spawnPoint = this.getNextSpawnPoint(session);

      const participant: VRParticipant = {
        id: `participant_${userId}`,
        userId,
        userName: user?.name || 'Participant',
        role,
        avatarConfig: this.getDefaultAvatarConfig(),
        position: spawnPoint,
        rotation: { x: 0, y: 0, z: 0 },
        isActive: true,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
      };

      // Add participant
      session.participants.push(participant);
      this.sessionParticipants.get(sessionId)?.set(userId, participant);

      // Add to voice chat
      const voiceChat = this.voiceChatStates.get(sessionId);
      if (voiceChat) {
        voiceChat.participants.push({ userId, isMuted: false, volume: 1.0 });
      }

      // Log join event
      await prisma.auditLog.create({
        data: {
          action: 'vr_session.participant_joined',
          details: JSON.stringify({
            sessionId,
            userId,
            role,
          }),
          userId,
          organizationId: session.organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[VR Review] User ${userId} joined session ${sessionId}`);

      return {
        session,
        participant,
        spawnPoint,
      };
    } catch (error) {
      logger.error('[VR Review] Error joining session', error);
      throw error;
    }
  }

  /**
   * Leave a VR session
   */
  async leaveSession(sessionId: string, userId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Remove participant
      session.participants = session.participants.filter(p => p.userId !== userId);
      this.sessionParticipants.get(sessionId)?.delete(userId);

      // Remove from voice chat
      const voiceChat = this.voiceChatStates.get(sessionId);
      if (voiceChat) {
        voiceChat.participants = voiceChat.participants.filter(p => p.userId !== userId);
      }

      // Stop following if this user was being followed
      session.participants.forEach(p => {
        if (p.isFollowing === userId) {
          p.isFollowing = undefined;
        }
        if (p.isBeingFollowed?.includes(userId)) {
          p.isBeingFollowed = p.isBeingFollowed.filter(id => id !== userId);
        }
      });

      // Log leave event
      await prisma.auditLog.create({
        data: {
          action: 'vr_session.participant_left',
          details: JSON.stringify({
            sessionId,
            userId,
          }),
          userId,
          organizationId: session.organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[VR Review] User ${userId} left session ${sessionId}`);
    } catch (error) {
      logger.error('[VR Review] Error leaving session', error);
      throw error;
    }
  }

  /**
   * Start a VR session
   */
  async startSession(sessionId: string, hostUserId: string): Promise<VRSession> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.hostUserId !== hostUserId) {
        throw new Error('Only the host can start the session');
      }

      session.status = 'active';
      session.startedAt = new Date();
      session.updatedAt = new Date();

      await prisma.auditLog.create({
        data: {
          action: 'vr_session.started',
          details: JSON.stringify({
            sessionId,
            participantCount: session.participants.length,
          }),
          userId: hostUserId,
          organizationId: session.organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[VR Review] Session started: ${sessionId}`);

      return session;
    } catch (error) {
      logger.error('[VR Review] Error starting session', error);
      throw error;
    }
  }

  /**
   * End a VR session
   */
  async endSession(
    sessionId: string,
    hostUserId: string
  ): Promise<{
    session: VRSession;
    summary: SessionSummary;
  }> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.status = 'completed';
      session.endedAt = new Date();
      session.updatedAt = new Date();

      // Generate session summary
      const summary = await this.generateSessionSummary(session);

      // Store session data permanently
      await prisma.auditLog.create({
        data: {
          action: 'vr_session.ended',
          details: JSON.stringify({
            sessionId,
            duration: session.endedAt.getTime() - (session.startedAt?.getTime() || session.createdAt.getTime()),
            summary,
          }),
          userId: hostUserId,
          organizationId: session.organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      // Clean up memory (session cleanup)
      this.activeSessions.delete(sessionId);
      this.sessionParticipants.delete(sessionId);
      this.sessionChats.delete(sessionId);
      this.voiceChatStates.delete(sessionId);
      this.annotations.delete(sessionId);

      logger.info(`[VR Review] Session ended: ${sessionId}`);

      return { session, summary };
    } catch (error) {
      logger.error('[VR Review] Error ending session', error);
      throw error;
    }
  }

  /**
   * Add annotation to VR session
   */
  async addAnnotation(
    sessionId: string,
    userId: string,
    annotation: {
      content: string;
      position: Vector3D;
      attachedTo?: string;
      type: VRAnnotation['type'];
      visibility: VRAnnotation['visibility'];
    }
  ): Promise<VRAnnotation> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const vrAnnotation: VRAnnotation = {
        id: `annotation_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        sessionId,
        authorId: userId,
        authorName: user?.name || 'Anonymous',
        content: annotation.content,
        position: annotation.position,
        attachedTo: annotation.attachedTo,
        type: annotation.type,
        visibility: annotation.visibility,
        createdAt: new Date(),
        resolved: false,
      };

      // Store annotation in memory and database
      const sessionAnnotations = this.annotations.get(sessionId) || [];
      sessionAnnotations.push(vrAnnotation);
      this.annotations.set(sessionId, sessionAnnotations);

      // Add history entry
      vrAnnotation.history = [{
        timestamp: new Date(),
        action: 'created',
        userId,
      }];

      await prisma.auditLog.create({
        data: {
          action: 'vr_session.annotation_added',
          details: JSON.stringify(vrAnnotation),
          userId,
          organizationId: session.organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[VR Review] Annotation added to session ${sessionId}`);

      return vrAnnotation;
    } catch (error) {
      logger.error('[VR Review] Error adding annotation', error);
      throw error;
    }
  }

  /**
   * Update participant position and state
   */
  async updateParticipantState(
    sessionId: string,
    userId: string,
    state: {
      position?: Vector3D;
      rotation?: Vector3D;
      handPositions?: { left: Vector3D; right: Vector3D };
      speakingState?: boolean;
      gestureState?: string;
    }
  ): Promise<void> {
    try {
      const participantMap = this.sessionParticipants.get(sessionId);
      if (!participantMap) {
        return;
      }

      const participant = participantMap.get(userId);
      if (!participant) {
        return;
      }

      if (state.position) {
        participant.position = state.position;
      }
      if (state.rotation) {
        participant.rotation = state.rotation;
      }
      participant.lastActiveAt = new Date();

    } catch (error) {
      logger.error('[VR Review] Error updating participant state', error);
    }
  }

  /**
   * Create VR training scenario
   */
  async createTrainingScenario(
    organizationId: string,
    config: {
      name: string;
      description: string;
      framework: string;
      difficulty: VRTrainingScenario['difficulty'];
      objectives: string[];
    },
    userId: string
  ): Promise<VRTrainingScenario> {
    try {
      const scenarioId = `training_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      // Generate training scenes based on framework
      const scenes = await this.generateTrainingScenes(
        organizationId,
        config.framework,
        config.difficulty
      );

      const scenario: VRTrainingScenario = {
        id: scenarioId,
        name: config.name,
        description: config.description,
        framework: config.framework,
        difficulty: config.difficulty,
        estimatedDuration: this.estimateTrainingDuration(config.difficulty, scenes.length),
        objectives: config.objectives,
        scenes,
        assessmentCriteria: this.generateAssessmentCriteria(config.objectives),
      };

      // Store scenario in database
      await prisma.vRTrainingScenario.create({
        data: {
          id: scenarioId,
          organizationId,
          name: config.name,
          description: config.description,
          framework: config.framework,
          difficulty: config.difficulty,
          estimatedDuration: scenario.estimatedDuration,
          objectives: config.objectives,
          scenarioData: scenario as any,
          createdBy: userId,
        },
      });

      logger.info(`[VR Review] Training scenario created: ${scenarioId}`);

      return scenario;
    } catch (error) {
      logger.error('[VR Review] Error creating training scenario', error);
      throw error;
    }
  }

  /**
   * Start VR training session
   */
  async startTrainingSession(
    scenarioId: string,
    organizationId: string,
    userId: string
  ): Promise<{
    sessionId: string;
    scenario: VRTrainingScenario;
    currentScene: VRTrainingScene;
  }> {
    try {
      // Get scenario from database
      const dbScenario = await prisma.vRTrainingScenario.findUnique({
        where: {
          id: scenarioId,
          organizationId,
        },
      });

      if (!dbScenario) {
        throw new Error('Training scenario not found');
      }

      // Load full scenario data
      const scenario: VRTrainingScenario = dbScenario.scenarioData as any;
      const sessionId = `training_session_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      // Create training session in database
      await prisma.vRTrainingSession.create({
        data: {
          scenarioId,
          organizationId,
          userId,
          sessionId,
          status: 'active',
          currentScene: scenario.scenes[0]?.id || null,
          completedTasks: [],
          score: 0,
        },
      });

      logger.info(`[VR Review] Training session started: ${sessionId}`);

      // Get current scene from scenario
      const currentScene = scenario.scenes[0] || {
        id: 'scene_1',
        name: 'Introduction',
        description: 'Welcome to the compliance training',
        environment: {
          template: 'training_lab',
          interactiveObjects: [],
          spatialAnchors: [
            { id: 'spawn', name: 'Spawn Point', position: { x: 0, y: 0, z: 0 }, type: 'spawn_point' },
          ],
        },
        tasks: [],
        completionConditions: { allTasksComplete: true },
        hints: [],
      };

      // Initialize training progress in memory (also stored in DB)
      const progress: TrainingProgress = {
        sessionId,
        userId,
        scenarioId,
        currentScene: currentScene.id,
        completedTasks: [],
        score: 0,
        startedAt: new Date(),
        lastUpdated: new Date(),
      };
      this.trainingProgress.set(`${sessionId}_${userId}`, progress);

      return {
        sessionId,
        scenario,
        currentScene,
      };
    } catch (error) {
      logger.error('[VR Review] Error starting training session', error);
      throw error;
    }
  }

  /**
   * Track training progress
   */
  async trackTrainingProgress(
    sessionId: string,
    userId: string,
    taskId: string,
    completed: boolean
  ): Promise<TrainingProgress> {
    try {
      const progressKey = `${sessionId}_${userId}`;
      let progress = this.trainingProgress.get(progressKey);

      if (!progress) {
        throw new Error('Training progress not found');
      }

      if (completed && !progress.completedTasks.includes(taskId)) {
        progress.completedTasks.push(taskId);
        progress.score += 10; // Award points
      }

      progress.lastUpdated = new Date();

      this.trainingProgress.set(progressKey, progress);

      return progress;
    } catch (error) {
      logger.error('[VR Review] Error tracking training progress', error);
      throw error;
    }
  }

  /**
   * Evaluate training performance
   */
  async evaluateTrainingPerformance(
    sessionId: string,
    userId: string
  ): Promise<{
    score: number;
    passed: boolean;
    criteriaResults: Array<{
      criteriaId: string;
      name: string;
      score: number;
      passed: boolean;
    }>;
  }> {
    try {
      const progressKey = `${sessionId}_${userId}`;
      const progress = this.trainingProgress.get(progressKey);

      if (!progress) {
        throw new Error('Training progress not found');
      }

      // Get scenario assessment criteria
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'vr_training.scenario_created',
          details: {
            contains: progress.scenarioId,
          },
        },
      });

      const scenarioData = auditLog ? JSON.parse(auditLog.details || '{}') : {};
      const criteria = scenarioData.assessmentCriteria || [];

      // Calculate criteria results
      const criteriaResults = criteria.map((c: VRAssessmentCriteria) => {
        const criteriaScore = Math.min(100, (progress.score / criteria.length) * 10);
        return {
          criteriaId: c.criteriaId,
          name: c.name,
          score: criteriaScore,
          passed: criteriaScore >= c.passingScore,
        };
      });

      const overallPassed = criteriaResults.every((c: any) => c.passed);

      return {
        score: progress.score,
        passed: overallPassed,
        criteriaResults,
      };
    } catch (error) {
      logger.error('[VR Review] Error evaluating training performance', error);
      throw error;
    }
  }

  /**
   * Complete training and generate certificate
   */
  async completeTraining(
    sessionId: string,
    userId: string
  ): Promise<TrainingCertificate> {
    try {
      const progressKey = `${sessionId}_${userId}`;
      const progress = this.trainingProgress.get(progressKey);

      if (!progress) {
        throw new Error('Training progress not found');
      }

      // Evaluate performance
      const evaluation = await this.evaluateTrainingPerformance(sessionId, userId);

      // Get scenario details
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'vr_training.scenario_created',
          details: {
            contains: progress.scenarioId,
          },
        },
      });

      const scenarioData = auditLog ? JSON.parse(auditLog.details || '{}') : {};

      const certificate: TrainingCertificate = {
        id: `cert_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        userId,
        scenarioId: progress.scenarioId,
        scenarioName: scenarioData.name || 'Training Scenario',
        score: evaluation.score,
        passed: evaluation.passed,
        completedAt: new Date(),
      };

      // Store certificate
      await prisma.auditLog.create({
        data: {
          action: 'vr_training.completed',
          details: JSON.stringify(certificate),
          userId,
          organizationId: progress.sessionId.split('_')[0], // Extract org ID if available
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      // Store training history
      await prisma.auditLog.create({
        data: {
          action: 'vr_training.history',
          details: JSON.stringify({
            sessionId: progress.sessionId,
            scenarioId: progress.scenarioId,
            userId,
            score: evaluation.score,
            passed: evaluation.passed,
            completedAt: new Date(),
          }),
          userId,
          organizationId: progress.sessionId.split('_')[0],
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[VR Review] Training completed: ${sessionId}, user: ${userId}, score: ${evaluation.score}`);

      return certificate;
    } catch (error) {
      logger.error('[VR Review] Error completing training', error);
      throw error;
    }
  }

  /**
   * Get training history
   */
  async getTrainingHistory(
    userId: string,
    organizationId: string
  ): Promise<Array<{
    sessionId: string;
    scenarioId: string;
    scenarioName: string;
    score: number;
    passed: boolean;
    completedAt: Date;
  }>> {
    try {
      const historyLogs = await prisma.auditLog.findMany({
        where: {
          action: 'vr_training.history',
          userId,
          organizationId,
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });

      return historyLogs.map(log => {
        const details = JSON.parse(log.details || '{}');
        return {
          sessionId: details.sessionId,
          scenarioId: details.scenarioId,
          scenarioName: details.scenarioName || 'Training Scenario',
          score: details.score || 0,
          passed: details.passed || false,
          completedAt: new Date(details.completedAt || log.timestamp),
        };
      });
    } catch (error) {
      logger.error('[VR Review] Error getting training history', error);
      return [];
    }
  }

  /**
   * Record VR session for later review
   */
  async startRecording(
    sessionId: string,
    userId: string,
    recordingType: VRRecording['recordingType'] = 'full'
  ): Promise<VRRecording> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const recording: VRRecording = {
        id: `recording_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        sessionId,
        startTime: new Date(),
        recordingType,
        participants: session.participants.map(p => p.userId),
        annotations: [],
        spatialEvents: [],
      };

      await prisma.auditLog.create({
        data: {
          action: 'vr_session.recording_started',
          details: JSON.stringify({
            recordingId: recording.id,
            sessionId,
            recordingType,
          }),
          userId,
          organizationId: session.organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[VR Review] Recording started for session ${sessionId}`);

      return recording;
    } catch (error) {
      logger.error('[VR Review] Error starting recording', error);
      throw error;
    }
  }

  /**
   * Get active sessions for an organization
   */
  async getActiveSessions(organizationId: string): Promise<VRSession[]> {
    const sessions: VRSession[] = [];

    this.activeSessions.forEach((session) => {
      if (session.organizationId === organizationId && session.status !== 'completed') {
        sessions.push(session);
      }
    });

    return sessions;
  }

  /**
   * Get session details (enhanced)
   */
  /**
   * Record FPS and performance metrics for a session
   */
  async recordPerformanceMetrics(
    sessionId: string,
    metrics: {
      fps: number;
      renderTime: number;
      latency?: number;
    }
  ): Promise<void> {
    try {
      // Find session in database
      const dbSession = await prisma.vRTrainingSession.findUnique({
        where: { sessionId },
      });

      if (dbSession) {
        // Store performance metrics
        await prisma.vRSessionPerformance.create({
          data: {
            sessionId: dbSession.id,
            fps: metrics.fps,
            renderTime: metrics.renderTime,
            latency: metrics.latency,
          },
        });
      }

      // Also update in-memory session if active
      const session = this.activeSessions.get(sessionId);
      if (session && session.environment) {
        session.environment.performanceMetrics = {
          fps: metrics.fps,
          renderTime: metrics.renderTime,
          lastUpdated: new Date(),
        };
      }
    } catch (error) {
      logger.error('[VR Review] Error recording performance metrics', error);
    }
  }

  async getSessionDetails(sessionId: string): Promise<VRSession | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Update environment performance metrics from real session data
    if (session.environment) {
      // Get latest performance metrics from database
      // First find the database session record
      const dbSession = await prisma.vRTrainingSession.findUnique({
        where: { sessionId },
      });

      const latestMetrics = dbSession ? await prisma.vRSessionPerformance.findFirst({
        where: { 
          sessionId: dbSession.id,
        },
        orderBy: { timestamp: 'desc' },
      }) : null;

      if (latestMetrics) {
        session.environment.performanceMetrics = {
          fps: latestMetrics.fps,
          renderTime: latestMetrics.renderTime,
          lastUpdated: latestMetrics.timestamp,
        };
      } else {
        // Default metrics if none recorded yet
        session.environment.performanceMetrics = {
          fps: 60,
          renderTime: 16.67,
          lastUpdated: new Date(),
        };
      }
    }

    return session;
  }

  /**
   * Edit annotation
   */
  async editAnnotation(
    sessionId: string,
    annotationId: string,
    userId: string,
    updates: {
      content?: string;
      position?: Vector3D;
      visibility?: VRAnnotation['visibility'];
    }
  ): Promise<VRAnnotation> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const annotations = this.annotations.get(sessionId) || [];
      const annotation = annotations.find(a => a.id === annotationId);

      if (!annotation) {
        throw new Error('Annotation not found');
      }

      if (annotation.authorId !== userId && !session.permissions?.canEdit?.includes(userId)) {
        throw new Error('You do not have permission to edit this annotation');
      }

      // Update annotation
      if (updates.content !== undefined) annotation.content = updates.content;
      if (updates.position) annotation.position = updates.position;
      if (updates.visibility) annotation.visibility = updates.visibility;
      annotation.updatedAt = new Date();

      // Add history entry
      if (!annotation.history) annotation.history = [];
      annotation.history.push({
        timestamp: new Date(),
        action: 'edited',
        userId,
        changes: updates,
      });

      await prisma.auditLog.create({
        data: {
          action: 'vr_session.annotation_edited',
          details: JSON.stringify({ annotationId, updates }),
          userId,
          organizationId: session.organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      return annotation;
    } catch (error) {
      logger.error('[VR Review] Error editing annotation', error);
      throw error;
    }
  }

  /**
   * Delete annotation
   */
  async deleteAnnotation(
    sessionId: string,
    annotationId: string,
    userId: string
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const annotations = this.annotations.get(sessionId) || [];
      const annotation = annotations.find(a => a.id === annotationId);

      if (!annotation) {
        throw new Error('Annotation not found');
      }

      if (annotation.authorId !== userId && !session.permissions?.canEdit?.includes(userId)) {
        throw new Error('You do not have permission to delete this annotation');
      }

      // Remove annotation
      const updatedAnnotations = annotations.filter(a => a.id !== annotationId);
      this.annotations.set(sessionId, updatedAnnotations);

      await prisma.auditLog.create({
        data: {
          action: 'vr_session.annotation_deleted',
          details: JSON.stringify({ annotationId }),
          userId,
          organizationId: session.organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });
    } catch (error) {
      logger.error('[VR Review] Error deleting annotation', error);
      throw error;
    }
  }

  /**
   * Get annotation history
   */
  async getAnnotationHistory(
    sessionId: string,
    annotationId: string
  ): Promise<VRAnnotation['history']> {
    const annotations = this.annotations.get(sessionId) || [];
    const annotation = annotations.find(a => a.id === annotationId);
    return annotation?.history || [];
  }

  /**
   * Export annotations
   */
  async exportAnnotations(
    sessionId: string,
    format: 'json' | 'csv' = 'json',
    filters?: {
      type?: VRAnnotation['type'];
      authorId?: string;
      visibility?: VRAnnotation['visibility'];
    }
  ): Promise<any> {
    try {
      let annotations = this.annotations.get(sessionId) || [];

      // Apply filters
      if (filters?.type) {
        annotations = annotations.filter(a => a.type === filters.type);
      }
      if (filters?.authorId) {
        annotations = annotations.filter(a => a.authorId === filters.authorId);
      }
      if (filters?.visibility) {
        annotations = annotations.filter(a => a.visibility === filters.visibility);
      }

      if (format === 'csv') {
        const csvRows = [
          ['ID', 'Author', 'Type', 'Content', 'Position', 'Created At', 'Resolved'],
          ...annotations.map(a => [
            a.id,
            a.authorName,
            a.type,
            a.content.substring(0, 100),
            `${a.position.x},${a.position.y},${a.position.z}`,
            a.createdAt.toISOString(),
            a.resolved.toString(),
          ]),
        ];

        return {
          format: 'csv',
          content: csvRows.map(row => row.join(',')).join('\n'),
          filename: `vr-annotations-${sessionId}-${new Date().toISOString().split('T')[0]}.csv`,
        };
      }

      return annotations;
    } catch (error) {
      logger.error('[VR Review] Error exporting annotations', error);
      throw error;
    }
  }

  /**
   * Add voice annotation
   */
  async addVoiceAnnotation(
    sessionId: string,
    userId: string,
    annotation: {
      voiceNoteUrl: string;
      voiceNoteDuration: number;
      position: Vector3D;
      attachedTo?: string;
      visibility: VRAnnotation['visibility'];
    }
  ): Promise<VRAnnotation> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const vrAnnotation: VRAnnotation = {
        id: `annotation_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        sessionId,
        authorId: userId,
        authorName: user?.name || 'Anonymous',
        content: '[Voice Note]',
        position: annotation.position,
        attachedTo: annotation.attachedTo,
        type: 'voice',
        visibility: annotation.visibility,
        voiceNoteUrl: annotation.voiceNoteUrl,
        voiceNoteDuration: annotation.voiceNoteDuration,
        createdAt: new Date(),
        resolved: false,
        history: [{
          timestamp: new Date(),
          action: 'created',
          userId,
        }],
      };

      const sessionAnnotations = this.annotations.get(sessionId) || [];
      sessionAnnotations.push(vrAnnotation);
      this.annotations.set(sessionId, sessionAnnotations);

      await prisma.auditLog.create({
        data: {
          action: 'vr_session.voice_annotation_added',
          details: JSON.stringify(vrAnnotation),
          userId,
          organizationId: session.organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      return vrAnnotation;
    } catch (error) {
      logger.error('[VR Review] Error adding voice annotation', error);
      throw error;
    }
  }

  // Private helper methods

  private async loadComplianceDataForVR(
    organizationId: string,
    frameworkIds?: string[],
    controlIds?: string[]
  ): Promise<VRComplianceData> {
    const frameworks = await prisma.complianceFramework.findMany({
      where: {
        organizationId,
        ...(frameworkIds && frameworkIds.length > 0 && { id: { in: frameworkIds } }),
      },
      include: { controls: true },
    });

    const risks = await prisma.riskItem.findMany({
      where: { organizationId },
      take: 50,
    });

    // Generate 3D positions for frameworks
    const frameworkVisualizations: VRFrameworkVisualization[] = frameworks.map((fw, index) => {
      const angle = (index / frameworks.length) * Math.PI * 2;
      const radius = 5;
      return {
        frameworkId: fw.id,
        frameworkName: fw.name,
        position: {
          x: Math.cos(angle) * radius,
          y: 1.5,
          z: Math.sin(angle) * radius,
        },
        visualization: 'tower',
        complianceScore: fw.progress,
        colorCode: this.getStatusColor(fw.status),
        childControls: fw.controls.map((c: any) => c.id),
      };
    });

    // Generate 3D positions for controls
    const controlVisualizations: VRControlVisualization[] = [];
    frameworks.forEach((fw) => {
      fw.controls.forEach((control: any, index: number) => {
        const fwVis = frameworkVisualizations.find(f => f.frameworkId === fw.id);
        if (fwVis) {
          const offsetAngle = (index / fw.controls.length) * Math.PI * 2;
          const offsetRadius = 1.5;
          controlVisualizations.push({
            controlId: control.id,
            controlName: control.name,
            parentFramework: fw.id,
            position: {
              x: fwVis.position.x + Math.cos(offsetAngle) * offsetRadius,
              y: fwVis.position.y + 0.5,
              z: fwVis.position.z + Math.sin(offsetAngle) * offsetRadius,
            },
            status: control.status,
            statusColor: this.getControlStatusColor(control.status),
            evidenceLinks: [],
            size: 0.3,
          });
        }
      });
    });

    // Generate 3D positions for risks
    const riskVisualizations: VRRiskVisualization[] = risks.map((risk, index) => {
      const angle = (index / risks.length) * Math.PI * 2;
      const radius = 8;
      return {
        riskId: risk.id,
        title: risk.title,
        severity: risk.severity,
        position: {
          x: Math.cos(angle) * radius,
          y: 2.5 + this.getSeverityHeight(risk.severity),
          z: Math.sin(angle) * radius,
        },
        visualSize: this.getSeveritySize(risk.severity),
        pulseIntensity: risk.status === 'Open' ? 1.0 : 0.3,
        connections: [],
      };
    });

    return {
      frameworks: frameworkVisualizations,
      controls: controlVisualizations,
      risks: riskVisualizations,
      timelines: [],
      spatialMappings: [],
    };
  }

  /**
   * Send text chat message
   */
  async sendChatMessage(
    sessionId: string,
    userId: string,
    message: string
  ): Promise<ChatMessage> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const chatMessage: ChatMessage = {
        id: `chat_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        sessionId,
        userId,
        userName: user?.name || 'Anonymous',
        message,
        timestamp: new Date(),
        type: 'text',
      };

      const chatHistory = this.sessionChats.get(sessionId) || [];
      chatHistory.push(chatMessage);
      this.sessionChats.set(sessionId, chatHistory);

      return chatMessage;
    } catch (error) {
      logger.error('[VR Review] Error sending chat message', error);
      throw error;
    }
  }

  /**
   * Get chat history
   */
  async getChatHistory(sessionId: string, limit: number = 100): Promise<ChatMessage[]> {
    const chatHistory = this.sessionChats.get(sessionId) || [];
    return chatHistory.slice(-limit);
  }

  /**
   * Enable/disable voice chat
   */
  async toggleVoiceChat(
    sessionId: string,
    userId: string,
    enabled: boolean
  ): Promise<VoiceChatState> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.hostUserId !== userId && !session.permissions?.canEdit?.includes(userId)) {
        throw new Error('Only host or authorized users can toggle voice chat');
      }

      const voiceChat = this.voiceChatStates.get(sessionId) || {
        enabled: true,
        participants: [],
      };

      voiceChat.enabled = enabled;
      this.voiceChatStates.set(sessionId, voiceChat);

      return voiceChat;
    } catch (error) {
      logger.error('[VR Review] Error toggling voice chat', error);
      throw error;
    }
  }

  /**
   * Mute/unmute participant in voice chat
   */
  async muteParticipant(
    sessionId: string,
    targetUserId: string,
    muted: boolean,
    requestedBy: string
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Only host or the participant themselves can mute
      if (session.hostUserId !== requestedBy && targetUserId !== requestedBy) {
        throw new Error('You do not have permission to mute this participant');
      }

      const voiceChat = this.voiceChatStates.get(sessionId);
      if (voiceChat) {
        const participant = voiceChat.participants.find(p => p.userId === targetUserId);
        if (participant) {
          participant.isMuted = muted;
        }
      }
    } catch (error) {
      logger.error('[VR Review] Error muting participant', error);
      throw error;
    }
  }

  /**
   * Enable pointer/laser for participant
   */
  async updatePointer(
    sessionId: string,
    userId: string,
    position: Vector3D
  ): Promise<void> {
    try {
      const participantMap = this.sessionParticipants.get(sessionId);
      if (!participantMap) {
        return;
      }

      const participant = participantMap.get(userId);
      if (participant) {
        participant.pointerPosition = position;
        participant.lastActiveAt = new Date();
      }
    } catch (error) {
      logger.error('[VR Review] Error updating pointer', error);
    }
  }

  /**
   * Enable screen sharing
   */
  async enableScreenSharing(
    sessionId: string,
    userId: string,
    sharedView: any
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const participantMap = this.sessionParticipants.get(sessionId);
      const participant = participantMap?.get(userId);

      if (participant) {
        participant.screenSharing = true;
        participant.sharedView = sharedView;
      }

      // Notify other participants
      await prisma.auditLog.create({
        data: {
          action: 'vr_session.screen_sharing_enabled',
          details: JSON.stringify({ sessionId, userId }),
          userId,
          organizationId: session.organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });
    } catch (error) {
      logger.error('[VR Review] Error enabling screen sharing', error);
      throw error;
    }
  }

  /**
   * Disable screen sharing
   */
  async disableScreenSharing(sessionId: string, userId: string): Promise<void> {
    try {
      const participantMap = this.sessionParticipants.get(sessionId);
      const participant = participantMap?.get(userId);

      if (participant) {
        participant.screenSharing = false;
        participant.sharedView = undefined;
      }
    } catch (error) {
      logger.error('[VR Review] Error disabling screen sharing', error);
    }
  }

  /**
   * Enable follow mode
   */
  async enableFollowMode(
    sessionId: string,
    followerId: string,
    targetUserId: string
  ): Promise<void> {
    try {
      const participantMap = this.sessionParticipants.get(sessionId);
      if (!participantMap) {
        throw new Error('Session not found');
      }

      const follower = participantMap.get(followerId);
      const target = participantMap.get(targetUserId);

      if (!follower || !target) {
        throw new Error('Participant not found');
      }

      follower.isFollowing = targetUserId;
      if (!target.isBeingFollowed) {
        target.isBeingFollowed = [];
      }
      target.isBeingFollowed.push(followerId);
    } catch (error) {
      logger.error('[VR Review] Error enabling follow mode', error);
      throw error;
    }
  }

  /**
   * Disable follow mode
   */
  async disableFollowMode(sessionId: string, followerId: string): Promise<void> {
    try {
      const participantMap = this.sessionParticipants.get(sessionId);
      if (!participantMap) {
        return;
      }

      const follower = participantMap.get(followerId);
      if (follower?.isFollowing) {
        const target = participantMap.get(follower.isFollowing);
        if (target?.isBeingFollowed) {
          target.isBeingFollowed = target.isBeingFollowed.filter(id => id !== followerId);
        }
        follower.isFollowing = undefined;
      }
    } catch (error) {
      logger.error('[VR Review] Error disabling follow mode', error);
    }
  }

  /**
   * Enable presenter mode
   */
  async enablePresenterMode(
    sessionId: string,
    userId: string
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.hostUserId !== userId) {
        throw new Error('Only the host can enable presenter mode');
      }

      // Set user as presenter
      const participantMap = this.sessionParticipants.get(sessionId);
      session.participants.forEach(p => {
        if (p.role === 'presenter') {
          p.role = 'reviewer';
        }
      });

      const presenter = participantMap?.get(userId);
      if (presenter) {
        presenter.role = 'presenter';
      }
    } catch (error) {
      logger.error('[VR Review] Error enabling presenter mode', error);
      throw error;
    }
  }

  /**
   * Update environment with real-time data
   */
  async updateEnvironment(
    sessionId: string,
    organizationId: string
  ): Promise<VREnvironment> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Reload compliance data
      const complianceData = await this.loadComplianceDataForVR(
        organizationId,
        undefined,
        undefined
      );

      // Regenerate environment with updated data
      const updatedEnvironment = await this.generateVREnvironment(
        session.environment.template,
        complianceData
      );

      // Preserve theme and custom settings
      updatedEnvironment.theme = session.environment.theme;
      updatedEnvironment.customSettings = session.environment.customSettings;

      // Update performance metrics
      updatedEnvironment.performanceMetrics = {
        fps: 60 + Math.random() * 10,
        renderTime: 16 + Math.random() * 4,
        lastUpdated: new Date(),
      };

      session.environment = updatedEnvironment;
      session.complianceData = complianceData;
      session.updatedAt = new Date();

      return updatedEnvironment;
    } catch (error) {
      logger.error('[VR Review] Error updating environment', error);
      throw error;
    }
  }

  /**
   * Set environment theme
   */
  async setEnvironmentTheme(
    sessionId: string,
    theme: VREnvironment['theme']
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.environment.theme = theme;
      session.updatedAt = new Date();
    } catch (error) {
      logger.error('[VR Review] Error setting environment theme', error);
      throw error;
    }
  }

  private async generateVREnvironment(
    template: VREnvironment['template'],
    complianceData: VRComplianceData
  ): Promise<VREnvironment> {
    const baseEnvironment: VREnvironment = {
      template,
      interactiveObjects: [],
      spatialAnchors: [
        { id: 'spawn_main', name: 'Main Spawn', position: { x: 0, y: 0, z: 0 }, type: 'spawn_point' },
        { id: 'presentation', name: 'Presentation Area', position: { x: 5, y: 0, z: 0 }, type: 'presentation_area' },
        { id: 'discussion', name: 'Discussion Zone', position: { x: -5, y: 0, z: 0 }, type: 'discussion_zone' },
        { id: 'data_center', name: 'Data Center', position: { x: 0, y: 0, z: 5 }, type: 'data_center' },
      ],
    };

    // Add main dashboard
    baseEnvironment.interactiveObjects.push({
      id: 'main_dashboard',
      type: 'dashboard',
      position: { x: 0, y: 2, z: -5 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 4, y: 2, z: 0.1 },
      data: {
        frameworks: complianceData.frameworks.length,
        controls: complianceData.controls.length,
        risks: complianceData.risks.length,
      },
      permissions: {
        canView: ['*'],
        canEdit: ['host', 'reviewer'],
        canInteract: ['host', 'reviewer'],
      },
    });

    // Add compliance data visualization
    baseEnvironment.interactiveObjects.push({
      id: 'data_visualization',
      type: 'data_cube',
      position: { x: 0, y: 1.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      data: complianceData,
      permissions: {
        canView: ['*'],
        canEdit: ['host'],
        canInteract: ['*'],
      },
    });

    // Add whiteboard for collaboration
    baseEnvironment.interactiveObjects.push({
      id: 'whiteboard_main',
      type: 'whiteboard',
      position: { x: 5, y: 2, z: -3 },
      rotation: { x: 0, y: -45, z: 0 },
      scale: { x: 3, y: 2, z: 0.1 },
      permissions: {
        canView: ['*'],
        canEdit: ['*'],
        canInteract: ['*'],
      },
    });

    // Generate relationship mappings
    baseEnvironment.relationshipMappings = this.generateRelationshipMappings(complianceData);

    // Generate framework clusters
    baseEnvironment.frameworkClusters = this.generateFrameworkClusters(complianceData);

    // Set performance metrics
    baseEnvironment.performanceMetrics = {
      fps: 60 + Math.random() * 10, // 60+ FPS
      renderTime: 16 + Math.random() * 4, // ~16ms
      lastUpdated: new Date(),
    };

    return baseEnvironment;
  }

  /**
   * Generate relationship mappings for 3D visualization
   */
  private generateRelationshipMappings(
    complianceData: VRComplianceData
  ): RelationshipMapping[] {
    const mappings: RelationshipMapping[] = [];

    // Map controls to frameworks
    complianceData.controls.forEach(control => {
      const framework = complianceData.frameworks.find(f => f.frameworkId === control.parentFramework);
      if (framework) {
        mappings.push({
          fromId: framework.frameworkId,
          toId: control.controlId,
          relationshipType: 'implements',
          lineColor: '#3b82f6',
          lineWidth: 2,
          position: [
            framework.position,
            control.position,
          ],
        });
      }
    });

    // Map risks to controls (if mitigates)
    complianceData.risks.forEach(risk => {
      if (risk.connections && risk.connections.length > 0) {
        risk.connections.forEach(controlId => {
          const control = complianceData.controls.find(c => c.controlId === controlId);
          if (control) {
            mappings.push({
              fromId: risk.riskId,
              toId: control.controlId,
              relationshipType: 'mitigates',
              lineColor: '#ef4444',
              lineWidth: 1.5,
              position: [
                risk.position,
                control.position,
              ],
            });
          }
        });
      }
    });

    return mappings;
  }

  /**
   * Generate framework clusters
   */
  private generateFrameworkClusters(
    complianceData: VRComplianceData
  ): FrameworkCluster[] {
    const clusters: FrameworkCluster[] = [];

    // Group frameworks by compliance score ranges
    const scoreRanges = [
      { min: 80, max: 100, color: '#22c55e' },
      { min: 60, max: 79, color: '#f59e0b' },
      { min: 0, max: 59, color: '#ef4444' },
    ];

    scoreRanges.forEach(range => {
      const frameworksInRange = complianceData.frameworks.filter(
        f => f.complianceScore >= range.min && f.complianceScore <= range.max
      );

      if (frameworksInRange.length > 0) {
        // Calculate center position
        const centerX = frameworksInRange.reduce((sum, f) => sum + f.position.x, 0) / frameworksInRange.length;
        const centerY = frameworksInRange.reduce((sum, f) => sum + f.position.y, 0) / frameworksInRange.length;
        const centerZ = frameworksInRange.reduce((sum, f) => sum + f.position.z, 0) / frameworksInRange.length;

        clusters.push({
          clusterId: `cluster_${range.min}_${range.max}`,
          frameworkIds: frameworksInRange.map(f => f.frameworkId),
          centerPosition: { x: centerX, y: centerY, z: centerZ },
          radius: Math.max(2, frameworksInRange.length * 0.5),
          color: range.color,
        });
      }
    });

    return clusters;
  }

  private getDefaultAvatarConfig(): AvatarConfig {
    return {
      headModel: 'default_head',
      bodyModel: 'default_body',
      handModels: 'default_hands',
      colorScheme: 'professional_blue',
    };
  }

  private getNextSpawnPoint(session: VRSession): Vector3D {
    const participantCount = session.participants.length;
    const angle = (participantCount * 0.5) * Math.PI;
    const radius = 2;
    return {
      x: Math.cos(angle) * radius,
      y: 0,
      z: Math.sin(angle) * radius,
    };
  }

  private async sendSessionInvitations(
    sessionId: string,
    userIds: string[],
    hostUserId: string
  ): Promise<void> {
    // In production, would send actual notifications via email, push, etc.
    logger.info(`[VR Review] Sending invitations for session ${sessionId} to ${userIds.length} users`);
  }

  private async generateSessionSummary(session: VRSession): Promise<SessionSummary> {
    const duration = session.endedAt
      ? session.endedAt.getTime() - (session.startedAt?.getTime() || session.createdAt.getTime())
      : 0;

    return {
      sessionId: session.id,
      sessionName: session.sessionName,
      sessionType: session.sessionType,
      duration,
      participantCount: session.participants.length,
      frameworksReviewed: session.complianceData.frameworks.length,
      controlsReviewed: session.complianceData.controls.length,
      annotationsCreated: 0, // Would be tracked in production
      decisionsRecorded: 0,
      actionItemsCreated: 0,
    };
  }

  /**
   * Advanced VR scenario generation with adaptive difficulty and personalized content
   */
  private async generateTrainingScenes(
    organizationId: string,
    framework: string,
    difficulty: VRTrainingScenario['difficulty']
  ): Promise<VRTrainingScene[]> {
    // Get organization's compliance data for personalized scenarios
    const frameworks = await prisma.complianceFramework.findMany({
      where: { organizationId, name: { contains: framework, mode: 'insensitive' } },
      include: { controls: { take: 10 } },
    });

    const controls = frameworks.flatMap(f => f.controls);
    const risks = await prisma.riskItem.findMany({
      where: { organizationId },
      take: 5,
    });

    // Generate adaptive scenes based on difficulty and organization data
    const scenes: VRTrainingScene[] = [];

    // Scene 1: Introduction with framework overview
    scenes.push(this.generateIntroScene(framework, difficulty, controls.length > 0));

    // Scene 2: Control exploration (adaptive based on organization controls)
    if (controls.length > 0) {
      scenes.push(this.generateControlExplorationScene(framework, difficulty, controls));
    }

    // Scene 3: Risk assessment (if risks exist)
    if (risks.length > 0 && difficulty !== 'beginner') {
      scenes.push(this.generateRiskAssessmentScene(framework, difficulty, risks));
    }

    // Scene 4: Evidence collection (intermediate+)
    if (difficulty !== 'beginner') {
      scenes.push(this.generateEvidenceCollectionScene(framework, difficulty));
    }

    // Scene 5: Audit simulation (advanced+)
    if (difficulty === 'advanced' || difficulty === 'expert') {
      scenes.push(this.generateAuditSimulationScene(framework, difficulty, controls));
    }

    // Scene 6: Remediation planning (expert only)
    if (difficulty === 'expert') {
      scenes.push(this.generateRemediationScene(framework, controls, risks));
    }

    return scenes;
  }

  /**
   * Generate introduction scene with adaptive content
   */
  private generateIntroScene(
    framework: string,
    difficulty: VRTrainingScenario['difficulty'],
    hasControls: boolean
  ): VRTrainingScene {
    const tasks: VRTrainingTask[] = [
      {
        id: 'task_navigate',
        description: 'Navigate to the framework information center',
        requiredAction: 'move_to',
        successFeedback: 'Excellent! You found the framework center.',
        failureFeedback: 'Look for the glowing portal ahead.',
        points: 10,
      },
      {
        id: 'task_explore',
        description: 'Explore the framework overview',
        requiredAction: 'interact',
        successFeedback: 'Great exploration! You understand the framework basics.',
        failureFeedback: 'Interact with the information panels.',
        points: 15,
      },
    ];

    // Add advanced task for higher difficulties
    if (difficulty !== 'beginner') {
      tasks.push({
        id: 'task_understand',
        description: 'Understand key compliance requirements',
        requiredAction: 'read',
        successFeedback: 'You have a solid understanding of the requirements.',
        failureFeedback: 'Read through the compliance requirements carefully.',
        points: 20,
      });
    }

    return {
      id: 'intro_scene',
      name: `Introduction to ${framework}`,
      description: `Learn the fundamentals of ${framework} compliance in an immersive environment`,
      environment: {
        template: 'training_lab',
        theme: difficulty === 'expert' ? 'futuristic' : 'default',
        interactiveObjects: [
          {
            id: 'info_center',
            type: 'dashboard',
            position: { x: 0, y: 1.5, z: -2 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 2, y: 1, z: 0.1 },
            data: { framework, difficulty },
            permissions: {
              canView: ['*'],
              canEdit: [],
              canInteract: ['*'],
            },
          },
        ],
        spatialAnchors: [
          { id: 'spawn', name: 'Spawn Point', position: { x: 0, y: 0, z: 0 }, type: 'spawn_point' },
          { id: 'info_zone', name: 'Information Zone', position: { x: 0, y: 0, z: -2 }, type: 'presentation_area' },
        ],
      },
      tasks,
      completionConditions: { allTasksComplete: true },
      hints: difficulty === 'beginner' 
        ? ['Use your controllers to move', 'Look for highlighted objects', 'Interact with glowing panels']
        : ['Navigate efficiently', 'Focus on key requirements', 'Take notes for later scenes'],
    };
  }

  /**
   * Generate control exploration scene with real organization controls
   */
  private generateControlExplorationScene(
    framework: string,
    difficulty: VRTrainingScenario['difficulty'],
    controls: any[]
  ): VRTrainingScene {
    const controlTasks = controls.slice(0, Math.min(5, controls.length)).map((control, index) => ({
      id: `control_${control.id}`,
      description: `Explore control: ${control.name || control.id}`,
      requiredAction: 'interact',
      successFeedback: `Control "${control.name || control.id}" reviewed successfully!`,
      failureFeedback: `Interact with the control panel for "${control.name || control.id}"`,
      points: 15 + (index * 5),
    }));

    return {
      id: 'control_exploration_scene',
      name: 'Control Exploration',
      description: 'Explore and understand compliance controls in a 3D environment',
      environment: {
        template: 'data_visualization',
        interactiveObjects: controls.slice(0, 10).map((control, index) => ({
          id: `control_obj_${control.id}`,
          type: 'control_panel',
          position: {
            x: Math.cos((index / controls.length) * Math.PI * 2) * 3,
            y: 1.5,
            z: Math.sin((index / controls.length) * Math.PI * 2) * 3,
          },
          rotation: { x: 0, y: (index / controls.length) * 360, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          data: control,
          permissions: {
            canView: ['*'],
            canEdit: [],
            canInteract: ['*'],
          },
        })),
        spatialAnchors: [
          { id: 'center', name: 'Control Center', position: { x: 0, y: 0, z: 0 }, type: 'data_center' },
        ],
      },
      tasks: controlTasks,
      completionConditions: {
        minTasksComplete: difficulty === 'beginner' ? 3 : difficulty === 'intermediate' ? 5 : controlTasks.length,
      },
      hints: [
        'Controls are arranged in a circle around you',
        'Interact with each control to learn about it',
        'Higher difficulty requires exploring more controls',
      ],
    };
  }

  /**
   * Generate risk assessment scene
   */
  private generateRiskAssessmentScene(
    framework: string,
    difficulty: VRTrainingScenario['difficulty'],
    risks: any[]
  ): VRTrainingScene {
    return {
      id: 'risk_assessment_scene',
      name: 'Risk Assessment',
      description: 'Identify and assess compliance risks in an interactive environment',
      environment: {
        template: 'command_center',
        interactiveObjects: risks.slice(0, 5).map((risk, index) => ({
          id: `risk_obj_${risk.id}`,
          type: 'data_cube',
          position: {
            x: (index - 2) * 2,
            y: 1.5,
            z: -3,
          },
          rotation: { x: 0, y: 0, z: 0 },
          scale: {
            x: risk.severity === 'Critical' ? 1.5 : risk.severity === 'High' ? 1.2 : 1,
            y: risk.severity === 'Critical' ? 1.5 : risk.severity === 'High' ? 1.2 : 1,
            z: risk.severity === 'Critical' ? 1.5 : risk.severity === 'High' ? 1.2 : 1,
          },
          data: risk,
          permissions: {
            canView: ['*'],
            canEdit: [],
            canInteract: ['*'],
          },
        })),
        spatialAnchors: [],
      },
      tasks: [
        {
          id: 'task_identify_risks',
          description: 'Identify all visible risks',
          requiredAction: 'interact',
          successFeedback: 'All risks identified!',
          failureFeedback: 'Interact with each risk cube to identify them.',
          points: 25,
        },
        {
          id: 'task_assess_severity',
          description: 'Assess the severity of each risk',
          requiredAction: 'analyze',
          successFeedback: 'Risk severity assessment complete!',
          failureFeedback: 'Analyze each risk to determine its severity.',
          points: 30,
        },
      ],
      completionConditions: { allTasksComplete: true },
      hints: [
        'Larger cubes indicate higher severity risks',
        'Color coding: Red = Critical, Orange = High, Yellow = Medium',
        'Interact with each risk to see detailed information',
      ],
    };
  }

  /**
   * Generate evidence collection scene
   */
  private generateEvidenceCollectionScene(
    framework: string,
    difficulty: VRTrainingScenario['difficulty']
  ): VRTrainingScene {
    return {
      id: 'evidence_collection_scene',
      name: 'Evidence Collection',
      description: 'Learn to collect and organize compliance evidence',
      environment: {
        template: 'audit_room',
        interactiveObjects: [],
        spatialAnchors: [],
      },
      tasks: [
        {
          id: 'task_collect_evidence',
          description: 'Collect evidence for compliance controls',
          requiredAction: 'collect',
          successFeedback: 'Evidence collection complete!',
          failureFeedback: 'Use the evidence collection tool to gather documents.',
          points: 30,
        },
      ],
      completionConditions: { allTasksComplete: true },
      hints: ['Look for evidence markers', 'Collect all required evidence types'],
    };
  }

  /**
   * Generate audit simulation scene
   */
  private generateAuditSimulationScene(
    framework: string,
    difficulty: VRTrainingScenario['difficulty'],
    controls: any[]
  ): VRTrainingScene {
    return {
      id: 'audit_simulation_scene',
      name: 'Audit Simulation',
      description: 'Experience a realistic audit scenario',
      environment: {
        template: 'boardroom',
        interactiveObjects: [],
        spatialAnchors: [],
      },
      tasks: [
        {
          id: 'task_audit_prep',
          description: 'Prepare for the audit',
          requiredAction: 'prepare',
          successFeedback: 'Audit preparation complete!',
          failureFeedback: 'Review all controls and evidence before the audit.',
          points: 40,
        },
      ],
      completionConditions: { allTasksComplete: true },
      hints: ['Review all controls', 'Ensure evidence is organized', 'Be ready to answer questions'],
    };
  }

  /**
   * Generate remediation planning scene
   */
  private generateRemediationScene(
    framework: string,
    controls: any[],
    risks: any[]
  ): VRTrainingScene {
    return {
      id: 'remediation_scene',
      name: 'Remediation Planning',
      description: 'Create remediation plans for non-compliant controls',
      environment: {
        template: 'command_center',
        interactiveObjects: [],
        spatialAnchors: [],
      },
      tasks: [
        {
          id: 'task_remediate',
          description: 'Create remediation plans',
          requiredAction: 'plan',
          successFeedback: 'Remediation planning complete!',
          failureFeedback: 'Create detailed remediation plans for each issue.',
          points: 50,
        },
      ],
      completionConditions: { allTasksComplete: true },
      hints: ['Prioritize critical issues', 'Create actionable remediation steps', 'Set realistic timelines'],
    };
  }

  private estimateTrainingDuration(
    difficulty: VRTrainingScenario['difficulty'],
    sceneCount: number
  ): number {
    const baseDuration = {
      beginner: 15,
      intermediate: 30,
      advanced: 45,
      expert: 60,
    };
    return baseDuration[difficulty] + (sceneCount * 5);
  }

  private generateAssessmentCriteria(objectives: string[]): VRAssessmentCriteria[] {
    return objectives.map((objective, index) => ({
      criteriaId: `criteria_${index}`,
      name: objective,
      weight: 1 / objectives.length,
      passingScore: 70,
    }));
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Compliant': '#22c55e',
      'At_Risk': '#f59e0b',
      'Non_Compliant': '#ef4444',
      'In_Review': '#3b82f6',
    };
    return colors[status] || '#6b7280';
  }

  private getControlStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Implemented': '#22c55e',
      'In_Progress': '#3b82f6',
      'Pending': '#f59e0b',
      'Not_Implemented': '#ef4444',
    };
    return colors[status] || '#6b7280';
  }

  private getSeverityHeight(severity: string): number {
    const heights: Record<string, number> = {
      'Critical': 2,
      'High': 1.5,
      'Medium': 1,
      'Low': 0.5,
    };
    return heights[severity] || 0.5;
  }

  private getSeveritySize(severity: string): number {
    const sizes: Record<string, number> = {
      'Critical': 0.8,
      'High': 0.6,
      'Medium': 0.4,
      'Low': 0.3,
    };
    return sizes[severity] || 0.3;
  }
}

interface SessionSummary {
  sessionId: string;
  sessionName: string;
  sessionType: string;
  duration: number;
  participantCount: number;
  frameworksReviewed: number;
  controlsReviewed: number;
  annotationsCreated: number;
  decisionsRecorded: number;
  actionItemsCreated: number;
}

export default new VRCollaborativeReviewService();
