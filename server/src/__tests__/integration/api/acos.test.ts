/**
 * aCOS Routes Integration Tests
 *
 * Comprehensive tests for all aCOS (Autonomous Compliance Operating System) routes:
 * - Goals & Control Loops
 * - Agentic AI Actions
 * - Evidence Truth Layer
 * - Regulatory Intelligence Fabric
 * - Temporal Graph Networks
 * - Compliance Digital Twin
 * - Red Teaming
 * - Federated Swarm Learning
 * - Multi-modal Intake
 * - Physical AI (Edge Devices)
 * - VR Collaborative Review
 * - JIT Access Management
 * - Swarm Task Allocation
 * - NeuroSymbolic AI
 * - Homomorphic Encryption
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock dependencies
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mutable role for the injected user. Defaults to the canonical lowercase 'admin'
// (matching the Prisma Role enum: admin|editor|viewer|compliance_admin|security_admin),
// which is what the JIT controller's in-handler role checks compare against. Individual
// tests override this to exercise the non-admin (403) authorization path.
const authState = { role: 'admin' };

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123',
      role: authState.role,
    };
    next();
  },
  authorize: (..._roles: string[]) => (_req: any, _res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../../middleware/tierMiddleware', () => ({
  requireAcosFeature: () => [(req: any, res: any, next: any) => next()],
  requireVisionaryFeature: () => [(req: any, res: any, next: any) => next()],
  requireFeature: () => (req: any, res: any, next: any) => next(),
}));

// Mock all advanced services - extract references so we can re-setup in beforeEach
const mockAcosService: Record<string, jest.Mock<any>> = {
  createComplianceGoal: jest.fn(),
  getComplianceGoals: jest.fn(),
  getComplianceGoalById: jest.fn(),
  updateComplianceGoal: jest.fn(),
  deleteComplianceGoal: jest.fn(),
  restoreComplianceGoal: jest.fn(),
  createControlLoop: jest.fn(),
  getControlLoopById: jest.fn(),
  getControlLoops: jest.fn(),
  getControlLoopHistory: jest.fn(),
  executeControlLoop: jest.fn(),
  pauseControlLoop: jest.fn(),
  resumeControlLoop: jest.fn(),
  updateControlLoop: jest.fn(),
  deleteControlLoop: jest.fn(),
  getComplianceDebts: jest.fn(),
  trackComplianceDebt: jest.fn(),
  calculateDebtFromGapAnalysis: jest.fn(),
  resolveComplianceDebt: jest.fn(),
  exportDebtReport: jest.fn(),
  getChangeImpacts: jest.fn(),
  forecastChangeImpact: jest.fn(),
  resolveChangeImpact: jest.fn(),
};
jest.mock('../../../services/advanced/acosService', () => ({ __esModule: true, default: mockAcosService }));

const mockAgenticAIService: Record<string, jest.Mock<any>> = {
  estimateBlastRadius: jest.fn(),
  executeAction: jest.fn(),
  rollbackAction: jest.fn(),
  rollbackMultipleActions: jest.fn(),
};
jest.mock('../../../services/advanced/agenticAIService', () => ({ __esModule: true, default: mockAgenticAIService }));

const mockEvidenceTruthLayerService: Record<string, jest.Mock<any>> = {
  analyzeEvidence: jest.fn(),
  getEvidenceAnalysis: jest.fn(),
  reanalyzeEvidence: jest.fn(),
  getAnalysisHistory: jest.fn(),
  bulkAnalyzeEvidence: jest.fn(),
  exportAnalysisReport: jest.fn(),
  verifyFileHash: jest.fn(),
  signEvidence: jest.fn(),
  verifyEvidenceSignature: jest.fn(),
  timestampEvidence: jest.fn(),
  createChainOfCustody: jest.fn(),
  createMultiPartyAttestation: jest.fn(),
};
jest.mock('../../../services/advanced/evidenceTruthLayerService', () => ({ __esModule: true, default: mockEvidenceTruthLayerService }));

const mockRegulatoryIntelligenceFabricService: Record<string, jest.Mock<any>> = {
  ingestRegulation: jest.fn(),
  detectRegulatoryChanges: jest.fn(),
  autoUpdateControls: jest.fn(),
  rollbackAutoUpdate: jest.fn(),
  batchAutoUpdate: jest.fn(),
  bulkConflictAnalysis: jest.fn(),
  getConflictHistory: jest.fn(),
  resolveConflict: jest.fn(),
  addFeed: jest.fn(),
  removeFeed: jest.fn(),
  getFeedStatusDashboard: jest.fn(),
  getRegulatoryChanges: jest.fn(),
  monitorRegulatoryFeeds: jest.fn(),
};
jest.mock('../../../services/advanced/regulatoryIntelligenceFabricService', () => ({ __esModule: true, default: mockRegulatoryIntelligenceFabricService }));

const mockTemporalGraphNetworkService: Record<string, jest.Mock<any>> = {
  predictFutureRisks: jest.fn(),
  predictComplianceTrajectory: jest.fn(),
  getEarlyWarnings: jest.fn(),
};
jest.mock('../../../services/advanced/temporalGraphNetworkService', () => ({ __esModule: true, default: mockTemporalGraphNetworkService }));

const mockComplianceDigitalTwinService: Record<string, jest.Mock<any>> = {
  runSimulation: jest.fn(),
  runSimulationWithConstraints: jest.fn(),
  compareScenarios: jest.fn(),
  saveSimulationState: jest.fn(),
  loadSimulationState: jest.fn(),
  rollbackSimulation: jest.fn(),
  runMonteCarloSimulation: jest.fn(),
};
jest.mock('../../../services/advanced/complianceDigitalTwinService', () => ({ __esModule: true, default: mockComplianceDigitalTwinService }));

const mockRedTeamService: Record<string, jest.Mock<any>> = {
  runRedTeamSimulation: jest.fn(),
  runAutomatedScan: jest.fn(),
  scanForComplianceGaps: jest.fn(),
  scanForMisconfigurations: jest.fn(),
  scanForPolicyViolations: jest.fn(),
  scheduleScan: jest.fn(),
  exportScanResults: jest.fn(),
  compareScanResults: jest.fn(),
  markFalsePositive: jest.fn(),
};
jest.mock('../../../services/advanced/redTeamService', () => ({ __esModule: true, default: mockRedTeamService }));

const mockFederatedSwarmService: Record<string, jest.Mock<any>> = {
  joinFederation: jest.fn(),
  leaveFederation: jest.fn(),
  contributeToFederation: jest.fn(),
  receiveFederatedModel: jest.fn(),
  recoverFederation: jest.fn(),
  getSwarmInsights: jest.fn(),
  getIndustryInsights: jest.fn(),
  getSectorInsights: jest.fn(),
  getFrameworkInsights: jest.fn(),
  benchmarkAgainstPeers: jest.fn(),
  identifyTrends: jest.fn(),
  exportInsights: jest.fn(),
  rollbackModel: jest.fn(),
  distributeModel: jest.fn(),
  getModelAuditTrail: jest.fn(),
  getFederationStatus: jest.fn(),
  participateInSwarm: jest.fn(),
};
jest.mock('../../../services/advanced/federatedSwarmService', () => ({ __esModule: true, default: mockFederatedSwarmService }));

const mockMultimodalIntakeService: Record<string, jest.Mock<any>> = {
  transcribeAudio: jest.fn(),
  analyzeVideo: jest.fn(),
};
jest.mock('../../../services/advanced/multimodalIntakeService', () => ({ __esModule: true, default: mockMultimodalIntakeService }));

const mockPhysicalAIService: Record<string, jest.Mock<any>> = {
  registerDevice: jest.fn(),
  bulkRegisterDevices: jest.fn(),
  deregisterDevice: jest.fn(),
  getDevices: jest.fn(),
  performEdgeComplianceCheck: jest.fn(),
  monitorDeviceHeartbeat: jest.fn(),
  detectOfflineDevices: jest.fn(),
  monitorBatteryLevel: jest.fn(),
  monitorConnectivity: jest.fn(),
  trackFirmwareVersion: jest.fn(),
  getHealthDashboard: jest.fn(),
  getHealthHistory: jest.fn(),
  performPredictiveMaintenance: jest.fn(),
  bulkHealthCheck: jest.fn(),
};
jest.mock('../../../services/advanced/physicalAIService', () => ({ __esModule: true, default: mockPhysicalAIService }));

const mockVrCollaborativeReviewService: Record<string, jest.Mock<any>> = {
  // Controller method names (actual service API)
  createSession: jest.fn(),
  getActiveSessions: jest.fn(),
  getSessionDetails: jest.fn(),
  healthCheck: jest.fn(),
  joinSession: jest.fn(),
  leaveSession: jest.fn(),
  startSession: jest.fn(),
  endSession: jest.fn(),
  addAnnotation: jest.fn(),
  addVoiceAnnotation: jest.fn(),
  editAnnotation: jest.fn(),
  deleteAnnotation: jest.fn(),
  getAnnotationHistory: jest.fn(),
  exportAnnotations: jest.fn(),
  sendChatMessage: jest.fn(),
  getChatHistory: jest.fn(),
  toggleVoiceChat: jest.fn(),
  muteParticipant: jest.fn(),
  updatePointer: jest.fn(),
  enableScreenSharing: jest.fn(),
  disableScreenSharing: jest.fn(),
  enableFollowMode: jest.fn(),
  disableFollowMode: jest.fn(),
  enablePresenterMode: jest.fn(),
  updateEnvironment: jest.fn(),
  setEnvironmentTheme: jest.fn(),
  createTrainingScenario: jest.fn(),
  startTrainingSession: jest.fn(),
  trackTrainingProgress: jest.fn(),
  evaluateTrainingPerformance: jest.fn(),
  completeTraining: jest.fn(),
  getTrainingHistory: jest.fn(),
};
jest.mock('../../../services/advanced/vrCollaborativeReviewService', () => ({ __esModule: true, default: mockVrCollaborativeReviewService }));

const mockJitAccessService: Record<string, jest.Mock<any>> = {
  requestAccess: jest.fn(),
  getUserSessionsAndRequests: jest.fn(),
  revokeSession: jest.fn(),
  cancelAccessRequest: jest.fn(),
  getPendingAccessRequests: jest.fn(),
  getAllAccessRequests: jest.fn(),
  approveAccess: jest.fn(),
  denyAccess: jest.fn(),
};
jest.mock('../../../services/advanced/jitAccessService', () => ({ __esModule: true, default: mockJitAccessService }));

const mockSwarmTaskAllocationService: Record<string, jest.Mock<any>> = {
  registerAgent: jest.fn(),
  getAgents: jest.fn(),
  getAgentById: jest.fn(),
  updateAgentStatus: jest.fn(),
  deactivateAgent: jest.fn(),
  reactivateAgent: jest.fn(),
  getAgentWorkload: jest.fn(),
  submitTask: jest.fn(),
  bulkSubmitTasks: jest.fn(),
  getAllTasks: jest.fn(),
  getActiveTasks: jest.fn(),
  getTaskStatus: jest.fn(),
  cancelTask: jest.fn(),
  reportProgress: jest.fn(),
  completeTask: jest.fn(),
  getSwarmMetrics: jest.fn(),
  getHistoricalMetrics: jest.fn(),
  getMetricAlerts: jest.fn(),
  resolveMetricAlert: jest.fn(),
  exportMetrics: jest.fn(),
  getDashboard: jest.fn(),
};
jest.mock('../../../services/advanced/swarmTaskAllocationService', () => ({ __esModule: true, default: mockSwarmTaskAllocationService }));

const mockNeuroSymbolicAIService: Record<string, jest.Mock<any>> = {
  performHybridReasoning: jest.fn(),
  inferRulesFromPatterns: jest.fn(),
  performCausalReasoning: jest.fn(),
  generateExplainableDecision: jest.fn(),
  getReasoningHistory: jest.fn(),
  validateInferredRule: jest.fn(),
};
jest.mock('../../../services/advanced/neuroSymbolicAIService', () => ({ __esModule: true, default: mockNeuroSymbolicAIService }));

const mockHomomorphicAIService: Record<string, jest.Mock<any>> = {
  generateKeys: jest.fn(),
  encryptData: jest.fn(),
  decryptData: jest.fn(),
  encryptedLinearRegression: jest.fn(),
  encryptedStatistics: jest.fn(),
  encryptedNeuralNetworkInference: jest.fn(),
};
jest.mock('../../../services/advanced/homomorphicAIService', () => ({ __esModule: true, default: mockHomomorphicAIService }));

// Setup app
let app: Express;

// Helper function to setup all service mock implementations
function setupServiceMocks() {
  // aCOS Service
  mockAcosService.createComplianceGoal.mockResolvedValue({ id: 'goal-123', name: 'Test Goal' });
  mockAcosService.getComplianceGoals.mockResolvedValue([]);
  mockAcosService.getComplianceGoalById.mockResolvedValue({ id: 'goal-123' });
  mockAcosService.updateComplianceGoal.mockResolvedValue({ id: 'goal-123', status: 'Updated' });
  mockAcosService.deleteComplianceGoal.mockResolvedValue({ success: true });
  mockAcosService.restoreComplianceGoal.mockResolvedValue({ id: 'goal-123' });
  mockAcosService.createControlLoop.mockResolvedValue({ id: 'loop-123' });
  mockAcosService.getControlLoopById.mockResolvedValue({ id: 'loop-123' });
  mockAcosService.getControlLoops.mockResolvedValue([]);
  mockAcosService.getControlLoopHistory.mockResolvedValue([]);
  mockAcosService.executeControlLoop.mockResolvedValue({ success: true });
  mockAcosService.pauseControlLoop.mockResolvedValue({ id: 'loop-123', status: 'Paused' });
  mockAcosService.resumeControlLoop.mockResolvedValue({ id: 'loop-123', status: 'Active' });
  mockAcosService.updateControlLoop.mockResolvedValue({ id: 'loop-123' });
  mockAcosService.deleteControlLoop.mockResolvedValue({ success: true });
  mockAcosService.getComplianceDebts.mockResolvedValue([]);
  mockAcosService.trackComplianceDebt.mockResolvedValue({ id: 'debt-123' });
  mockAcosService.calculateDebtFromGapAnalysis.mockResolvedValue({ debtScore: 45 });
  mockAcosService.resolveComplianceDebt.mockResolvedValue({ id: 'debt-123', resolved: true });
  mockAcosService.exportDebtReport.mockResolvedValue({ data: 'report' });
  mockAcosService.getChangeImpacts.mockResolvedValue([]);
  mockAcosService.forecastChangeImpact.mockResolvedValue({ impact: 'Medium' });
  mockAcosService.resolveChangeImpact.mockResolvedValue({ success: true });

  // Agentic AI Service
  mockAgenticAIService.estimateBlastRadius.mockResolvedValue({ affectedControls: 5 });
  mockAgenticAIService.executeAction.mockResolvedValue({ actionId: 'action-123', status: 'Executed' });
  mockAgenticAIService.rollbackAction.mockResolvedValue({ success: true });
  mockAgenticAIService.rollbackMultipleActions.mockResolvedValue({ rolled: 3 });

  // Evidence Truth Layer Service
  mockEvidenceTruthLayerService.analyzeEvidence.mockResolvedValue({ verified: true, confidence: 0.95 });
  mockEvidenceTruthLayerService.getEvidenceAnalysis.mockResolvedValue({ verified: true });
  mockEvidenceTruthLayerService.reanalyzeEvidence.mockResolvedValue({ verified: true });
  mockEvidenceTruthLayerService.getAnalysisHistory.mockResolvedValue([]);
  mockEvidenceTruthLayerService.bulkAnalyzeEvidence.mockResolvedValue({ analyzed: 5 });
  mockEvidenceTruthLayerService.exportAnalysisReport.mockResolvedValue({ report: 'data' });
  mockEvidenceTruthLayerService.verifyFileHash.mockResolvedValue({ valid: true });
  mockEvidenceTruthLayerService.signEvidence.mockResolvedValue({ signature: 'sig-123' });
  mockEvidenceTruthLayerService.verifyEvidenceSignature.mockResolvedValue({ valid: true });
  mockEvidenceTruthLayerService.timestampEvidence.mockResolvedValue({ timestamp: new Date() });
  mockEvidenceTruthLayerService.createChainOfCustody.mockResolvedValue({ chainId: 'chain-123' });
  mockEvidenceTruthLayerService.createMultiPartyAttestation.mockResolvedValue({ attestationId: 'att-123' });

  // Regulatory Intelligence Fabric Service
  mockRegulatoryIntelligenceFabricService.ingestRegulation.mockResolvedValue({ regulationId: 'reg-123' });
  mockRegulatoryIntelligenceFabricService.detectRegulatoryChanges.mockResolvedValue({ changes: [] });
  mockRegulatoryIntelligenceFabricService.autoUpdateControls.mockResolvedValue({ updated: 3 });
  mockRegulatoryIntelligenceFabricService.rollbackAutoUpdate.mockResolvedValue({ success: true });
  mockRegulatoryIntelligenceFabricService.batchAutoUpdate.mockResolvedValue({ updated: 5 });
  mockRegulatoryIntelligenceFabricService.bulkConflictAnalysis.mockResolvedValue({ conflicts: [] });
  mockRegulatoryIntelligenceFabricService.getConflictHistory.mockResolvedValue([]);
  mockRegulatoryIntelligenceFabricService.resolveConflict.mockResolvedValue({ success: true });
  mockRegulatoryIntelligenceFabricService.addFeed.mockResolvedValue({ feedId: 'feed-123' });
  mockRegulatoryIntelligenceFabricService.removeFeed.mockResolvedValue({ success: true });
  mockRegulatoryIntelligenceFabricService.getFeedStatusDashboard.mockResolvedValue({ feeds: [] });
  mockRegulatoryIntelligenceFabricService.getRegulatoryChanges.mockResolvedValue([]);
  mockRegulatoryIntelligenceFabricService.monitorRegulatoryFeeds.mockResolvedValue({ monitoring: true });

  // Temporal Graph Network Service
  mockTemporalGraphNetworkService.predictFutureRisks.mockResolvedValue({ predictions: [] });
  mockTemporalGraphNetworkService.predictComplianceTrajectory.mockResolvedValue({ trajectory: [] });
  mockTemporalGraphNetworkService.getEarlyWarnings.mockResolvedValue({ warnings: [] });

  // Compliance Digital Twin Service
  mockComplianceDigitalTwinService.runSimulation.mockResolvedValue({ simulationId: 'sim-123' });
  mockComplianceDigitalTwinService.runSimulationWithConstraints.mockResolvedValue({ simulationId: 'sim-123' });
  mockComplianceDigitalTwinService.compareScenarios.mockResolvedValue({ comparison: {} });
  mockComplianceDigitalTwinService.saveSimulationState.mockResolvedValue({ success: true });
  mockComplianceDigitalTwinService.loadSimulationState.mockResolvedValue({ state: {} });
  mockComplianceDigitalTwinService.rollbackSimulation.mockResolvedValue({ success: true });
  mockComplianceDigitalTwinService.runMonteCarloSimulation.mockResolvedValue({ results: [] });

  // Red Team Service
  mockRedTeamService.runRedTeamSimulation.mockResolvedValue({ findings: [] });
  mockRedTeamService.runAutomatedScan.mockResolvedValue({ scanId: 'scan-123' });
  mockRedTeamService.scanForComplianceGaps.mockResolvedValue({ gaps: [] });
  mockRedTeamService.scanForMisconfigurations.mockResolvedValue({ misconfigs: [] });
  mockRedTeamService.scanForPolicyViolations.mockResolvedValue({ violations: [] });
  mockRedTeamService.scheduleScan.mockResolvedValue({ scheduled: true });
  mockRedTeamService.exportScanResults.mockResolvedValue({ data: 'report' });
  mockRedTeamService.compareScanResults.mockResolvedValue({ comparison: {} });
  mockRedTeamService.markFalsePositive.mockResolvedValue({ success: true });

  // Federated Swarm Service
  mockFederatedSwarmService.joinFederation.mockResolvedValue({ joined: true });
  mockFederatedSwarmService.leaveFederation.mockResolvedValue({ left: true });
  mockFederatedSwarmService.contributeToFederation.mockResolvedValue({ contributed: true });
  mockFederatedSwarmService.receiveFederatedModel.mockResolvedValue({ model: {} });
  mockFederatedSwarmService.recoverFederation.mockResolvedValue({ recovered: true });
  mockFederatedSwarmService.getSwarmInsights.mockResolvedValue({ insights: [] });
  mockFederatedSwarmService.getIndustryInsights.mockResolvedValue({ insights: [] });
  mockFederatedSwarmService.getSectorInsights.mockResolvedValue({ insights: [] });
  mockFederatedSwarmService.getFrameworkInsights.mockResolvedValue({ insights: [] });
  mockFederatedSwarmService.benchmarkAgainstPeers.mockResolvedValue({ benchmark: {} });
  mockFederatedSwarmService.identifyTrends.mockResolvedValue({ trends: [] });
  mockFederatedSwarmService.exportInsights.mockResolvedValue({ data: 'report' });
  mockFederatedSwarmService.rollbackModel.mockResolvedValue({ success: true });
  mockFederatedSwarmService.distributeModel.mockResolvedValue({ distributed: true });
  mockFederatedSwarmService.getModelAuditTrail.mockResolvedValue({ trail: [] });
  mockFederatedSwarmService.getFederationStatus.mockResolvedValue({ status: 'Active' });
  mockFederatedSwarmService.participateInSwarm.mockResolvedValue({ participating: true });

  // Multi-modal Intake Service
  mockMultimodalIntakeService.transcribeAudio.mockResolvedValue({ transcript: 'text' });
  mockMultimodalIntakeService.analyzeVideo.mockResolvedValue({ analysis: {} });

  // Physical AI Service
  mockPhysicalAIService.registerDevice.mockResolvedValue({ deviceId: 'device-123' });
  mockPhysicalAIService.bulkRegisterDevices.mockResolvedValue({ registered: 5 });
  mockPhysicalAIService.deregisterDevice.mockResolvedValue({ success: true });
  mockPhysicalAIService.getDevices.mockResolvedValue([]);
  mockPhysicalAIService.performEdgeComplianceCheck.mockResolvedValue({ compliant: true });
  mockPhysicalAIService.monitorDeviceHeartbeat.mockResolvedValue({ alive: true });
  mockPhysicalAIService.detectOfflineDevices.mockResolvedValue({ offline: [] });
  mockPhysicalAIService.monitorBatteryLevel.mockResolvedValue({ level: 85 });
  mockPhysicalAIService.monitorConnectivity.mockResolvedValue({ connected: true });
  mockPhysicalAIService.trackFirmwareVersion.mockResolvedValue({ version: '1.0.0' });
  mockPhysicalAIService.getHealthDashboard.mockResolvedValue({ health: {} });
  mockPhysicalAIService.getHealthHistory.mockResolvedValue({ history: [] });
  mockPhysicalAIService.performPredictiveMaintenance.mockResolvedValue({ prediction: {} });
  mockPhysicalAIService.bulkHealthCheck.mockResolvedValue({ results: [] });

  // VR Collaborative Review Service
  mockVrCollaborativeReviewService.createSession.mockResolvedValue({ sessionId: 'vr-123' });
  mockVrCollaborativeReviewService.getActiveSessions.mockResolvedValue([]);
  mockVrCollaborativeReviewService.getSessionDetails.mockResolvedValue({ sessionId: 'vr-123' });
  mockVrCollaborativeReviewService.healthCheck.mockResolvedValue({ healthy: true });
  mockVrCollaborativeReviewService.joinSession.mockResolvedValue({ joined: true });
  mockVrCollaborativeReviewService.leaveSession.mockResolvedValue({ left: true });
  mockVrCollaborativeReviewService.startSession.mockResolvedValue({ started: true });
  mockVrCollaborativeReviewService.endSession.mockResolvedValue({ ended: true });
  mockVrCollaborativeReviewService.addAnnotation.mockResolvedValue({ annotationId: 'ann-123' });
  mockVrCollaborativeReviewService.addVoiceAnnotation.mockResolvedValue({ annotationId: 'ann-123' });
  mockVrCollaborativeReviewService.editAnnotation.mockResolvedValue({ updated: true });
  mockVrCollaborativeReviewService.deleteAnnotation.mockResolvedValue({ deleted: true });
  mockVrCollaborativeReviewService.getAnnotationHistory.mockResolvedValue({ history: [] });
  mockVrCollaborativeReviewService.exportAnnotations.mockResolvedValue({ data: 'export' });
  mockVrCollaborativeReviewService.sendChatMessage.mockResolvedValue({ sent: true });
  mockVrCollaborativeReviewService.getChatHistory.mockResolvedValue({ messages: [] });
  mockVrCollaborativeReviewService.toggleVoiceChat.mockResolvedValue({ enabled: true });
  mockVrCollaborativeReviewService.muteParticipant.mockResolvedValue({ muted: true });
  mockVrCollaborativeReviewService.updatePointer.mockResolvedValue({ updated: true });
  mockVrCollaborativeReviewService.enableScreenSharing.mockResolvedValue({ enabled: true });
  mockVrCollaborativeReviewService.disableScreenSharing.mockResolvedValue({ disabled: true });
  mockVrCollaborativeReviewService.enableFollowMode.mockResolvedValue({ enabled: true });
  mockVrCollaborativeReviewService.disableFollowMode.mockResolvedValue({ disabled: true });
  mockVrCollaborativeReviewService.enablePresenterMode.mockResolvedValue({ enabled: true });
  mockVrCollaborativeReviewService.updateEnvironment.mockResolvedValue({ updated: true });
  mockVrCollaborativeReviewService.setEnvironmentTheme.mockResolvedValue({ set: true });
  mockVrCollaborativeReviewService.createTrainingScenario.mockResolvedValue({ scenarioId: 'scenario-123' });
  mockVrCollaborativeReviewService.startTrainingSession.mockResolvedValue({ started: true });
  mockVrCollaborativeReviewService.trackTrainingProgress.mockResolvedValue({ progress: 50 });
  mockVrCollaborativeReviewService.evaluateTrainingPerformance.mockResolvedValue({ score: 85 });
  mockVrCollaborativeReviewService.completeTraining.mockResolvedValue({ completed: true });
  mockVrCollaborativeReviewService.getTrainingHistory.mockResolvedValue({ history: [] });

  // JIT Access Service
  mockJitAccessService.requestAccess.mockResolvedValue({ requestId: 'jit-123' });
  mockJitAccessService.getUserSessionsAndRequests.mockResolvedValue([]);
  mockJitAccessService.revokeSession.mockResolvedValue({ revoked: true });
  mockJitAccessService.cancelAccessRequest.mockResolvedValue({ cancelled: true });
  mockJitAccessService.getPendingAccessRequests.mockResolvedValue([]);
  mockJitAccessService.getAllAccessRequests.mockResolvedValue({ requests: [], total: 0 });
  mockJitAccessService.approveAccess.mockResolvedValue({ approved: true });
  mockJitAccessService.denyAccess.mockResolvedValue({ denied: true });

  // Swarm Task Allocation Service
  mockSwarmTaskAllocationService.registerAgent.mockResolvedValue({ agentId: 'agent-123' });
  mockSwarmTaskAllocationService.getAgents.mockReturnValue([]);
  mockSwarmTaskAllocationService.getAgentById.mockReturnValue({ agentId: 'agent-123' });
  mockSwarmTaskAllocationService.updateAgentStatus.mockResolvedValue({ updated: true });
  mockSwarmTaskAllocationService.deactivateAgent.mockResolvedValue({ deactivated: true });
  mockSwarmTaskAllocationService.reactivateAgent.mockResolvedValue({ reactivated: true });
  mockSwarmTaskAllocationService.getAgentWorkload.mockReturnValue({ workload: 5 });
  mockSwarmTaskAllocationService.submitTask.mockResolvedValue({ taskId: 'task-123' });
  mockSwarmTaskAllocationService.bulkSubmitTasks.mockResolvedValue({ submitted: 10 });
  mockSwarmTaskAllocationService.getAllTasks.mockReturnValue([]);
  mockSwarmTaskAllocationService.getActiveTasks.mockReturnValue([]);
  mockSwarmTaskAllocationService.getTaskStatus.mockReturnValue({ status: 'Running' });
  mockSwarmTaskAllocationService.cancelTask.mockResolvedValue({ cancelled: true });
  mockSwarmTaskAllocationService.reportProgress.mockResolvedValue({ reported: true });
  mockSwarmTaskAllocationService.completeTask.mockResolvedValue({ completed: true });
  mockSwarmTaskAllocationService.getSwarmMetrics.mockReturnValue({ metrics: {} });
  mockSwarmTaskAllocationService.getHistoricalMetrics.mockReturnValue({ history: [] });
  mockSwarmTaskAllocationService.getMetricAlerts.mockReturnValue({ alerts: [] });
  mockSwarmTaskAllocationService.resolveMetricAlert.mockResolvedValue({ resolved: true });
  mockSwarmTaskAllocationService.exportMetrics.mockResolvedValue({ data: 'export' });
  mockSwarmTaskAllocationService.getDashboard.mockReturnValue({ dashboard: {} });

  // NeuroSymbolic AI Service
  mockNeuroSymbolicAIService.performHybridReasoning.mockResolvedValue({ reasoning: {} });
  mockNeuroSymbolicAIService.inferRulesFromPatterns.mockResolvedValue({ rules: [] });
  mockNeuroSymbolicAIService.performCausalReasoning.mockResolvedValue({ causalChain: [] });
  mockNeuroSymbolicAIService.generateExplainableDecision.mockResolvedValue({ decision: {}, explanation: '' });
  mockNeuroSymbolicAIService.getReasoningHistory.mockResolvedValue({ history: [] });
  mockNeuroSymbolicAIService.validateInferredRule.mockResolvedValue({ valid: true });

  // Homomorphic AI Service
  mockHomomorphicAIService.generateKeys.mockResolvedValue({ publicKey: 'pk', privateKey: 'sk' });
  mockHomomorphicAIService.encryptData.mockResolvedValue({ ciphertext: 'encrypted' });
  mockHomomorphicAIService.decryptData.mockResolvedValue({ plaintext: 'decrypted' });
  mockHomomorphicAIService.encryptedLinearRegression.mockResolvedValue({ result: [] });
  mockHomomorphicAIService.encryptedStatistics.mockResolvedValue({ stats: {} });
  mockHomomorphicAIService.encryptedNeuralNetworkInference.mockResolvedValue({ predictions: [] });
}

beforeEach(async () => {
  jest.clearAllMocks();
  setupServiceMocks();
  authState.role = 'admin';
  // Audit-log writes happen on the JIT approve/deny paths via prisma + logControllerAction.
  prismaMock.auditLog.create.mockResolvedValue({} as never);
  prismaMock.user.findUnique.mockResolvedValue({
    id: 'user-123', name: 'Test User', email: 'test@example.com', role: 'admin',
  } as never);

  app = express();
  app.use(express.json());

  const acosRoutes = (await import('../../../routes/acos')).default;
  app.use('/api/acos', acosRoutes);

  // Add error handler so AppError responses are properly serialized
  const { errorHandler } = await import('../../../middleware/errorHandler');
  app.use(errorHandler);
});

// Asserts a route resolved successfully. All collaborating services are mocked to
// resolve in setupServiceMocks(), so a correctly-wired route MUST return a 2xx status.
// A 404 (route not mounted / shadowed) or 500 (unhandled service error) is a real
// failure and must fail the test rather than being silently accepted.
const expectRouteSucceeds = (status: number) => {
  expect(status).toBeGreaterThanOrEqual(200);
  expect(status).toBeLessThan(300);
};

describe('aCOS Routes Integration', () => {
  // ===========================================================================
  // Goals Management Tests
  // ===========================================================================
  describe('Goals Management', () => {
    describe('POST /api/acos/goals', () => {
      it('should create a goal and return the created resource', async () => {
        mockAcosService.createComplianceGoal.mockResolvedValue({ id: 'goal-123', name: 'Achieve SOC2 Compliance' });

        const response = await request(app)
          .post('/api/acos/goals')
          .send({
            name: 'Achieve SOC2 Compliance',
            targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            frameworkId: 'fw-soc2',
          });

        expectRouteSucceeds(response.status);
        expect(response.body).toHaveProperty('id', 'goal-123');
        expect(mockAcosService.createComplianceGoal).toHaveBeenCalledTimes(1);
      });
    });

    describe('GET /api/acos/goals', () => {
      it('should list goals scoped to the caller organization', async () => {
        mockAcosService.getComplianceGoals.mockResolvedValue([{ id: 'goal-1' }]);

        const response = await request(app)
          .get('/api/acos/goals');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(mockAcosService.getComplianceGoals).toHaveBeenCalledWith('org-123', expect.anything());
      });

      it('should pass the status filter through to the service', async () => {
        mockAcosService.getComplianceGoals.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/acos/goals?status=Active');

        expect(response.status).toBe(200);
        // The status query param must reach the service layer as a filter.
        expect(mockAcosService.getComplianceGoals).toHaveBeenCalledWith(
          'org-123',
          expect.objectContaining({ status: 'Active' })
        );
      });
    });

    describe('GET /api/acos/goals/:goalId', () => {
      it('should return the requested goal', async () => {
        mockAcosService.getComplianceGoalById.mockResolvedValue({ id: 'goal-123' });

        const response = await request(app)
          .get('/api/acos/goals/goal-123');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', 'goal-123');
      });
    });

    describe('PATCH /api/acos/goals/:goalId', () => {
      it('should update the goal and return it', async () => {
        mockAcosService.updateComplianceGoal.mockResolvedValue({ id: 'goal-123', status: 'Completed' });

        const response = await request(app)
          .patch('/api/acos/goals/goal-123')
          .send({ status: 'Completed' });

        expectRouteSucceeds(response.status);
        expect(response.body).toHaveProperty('id', 'goal-123');
        expect(mockAcosService.updateComplianceGoal).toHaveBeenCalledTimes(1);
      });
    });

    describe('DELETE /api/acos/goals/:goalId', () => {
      it('should handle delete goal request', async () => {
        const response = await request(app)
          .delete('/api/acos/goals/goal-123')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('POST /api/acos/goals/:goalId/restore', () => {
      it('should restore a deleted goal', async () => {
        const response = await request(app)
          .post('/api/acos/goals/goal-123/restore')
          .expect(200);

        expect(response.body).toHaveProperty('id');
      });
    });
  });

  // ===========================================================================
  // Control Loops Tests
  // ===========================================================================
  describe('Control Loops', () => {
    describe('POST /api/acos/control-loops', () => {
      it('should create a control loop', async () => {
        const response = await request(app)
          .post('/api/acos/control-loops')
          .send({
            name: 'Test Control Loop',
            controlId: 'ctrl-123',
            schedule: { cron: '0 0 * * *' },
          })
          .expect(200);

        expect(response.body).toHaveProperty('id');
      });

      it('should require name', async () => {
        const response = await request(app)
          .post('/api/acos/control-loops')
          .send({
            controlId: 'ctrl-123',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/acos/control-loops/:loopId', () => {
      it('should get control loop by ID', async () => {
        const response = await request(app)
          .get('/api/acos/control-loops/loop-123')
          .expect(200);

        expect(response.body).toHaveProperty('id');
      });
    });

    describe('POST /api/acos/control-loops/:loopId/execute', () => {
      it('should execute a control loop', async () => {
        const response = await request(app)
          .post('/api/acos/control-loops/loop-123/execute')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('POST /api/acos/control-loops/:loopId/pause', () => {
      it('should pause a control loop', async () => {
        const response = await request(app)
          .post('/api/acos/control-loops/loop-123/pause')
          .expect(200);

        expect(response.body).toHaveProperty('status', 'Paused');
      });
    });

    describe('POST /api/acos/control-loops/:loopId/resume', () => {
      it('should resume a paused control loop', async () => {
        const response = await request(app)
          .post('/api/acos/control-loops/loop-123/resume')
          .expect(200);

        expect(response.body).toHaveProperty('status', 'Active');
      });
    });
  });

  // ===========================================================================
  // Agentic AI Tests
  // ===========================================================================
  describe('Agentic AI', () => {
    describe('POST /api/acos/agentic/estimate-blast-radius', () => {
      it('should estimate blast radius of an action', async () => {
        const response = await request(app)
          .post('/api/acos/agentic/estimate-blast-radius')
          .send({
            action: 'UpdateControl',
            targetId: 'ctrl-123',
          })
          .expect(200);

        expect(response.body).toHaveProperty('affectedControls');
      });
    });

    describe('POST /api/acos/agentic/execute-action', () => {
      it('should execute an agentic action', async () => {
        const response = await request(app)
          .post('/api/acos/agentic/execute-action')
          .send({
            action: 'UpdateControl',
            targetId: 'ctrl-123',
            parameters: {},
          })
          .expect(200);

        expect(response.body).toHaveProperty('actionId');
      });
    });

    describe('POST /api/acos/agentic/rollback/:actionId', () => {
      it('should rollback an action', async () => {
        const response = await request(app)
          .post('/api/acos/agentic/rollback/action-123')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('POST /api/acos/agentic/rollback-multiple', () => {
      it('should rollback multiple actions', async () => {
        const response = await request(app)
          .post('/api/acos/agentic/rollback-multiple')
          .send({ actionIds: ['action-1', 'action-2', 'action-3'] })
          .expect(200);

        expect(response.body).toHaveProperty('rolled');
      });
    });
  });

  // ===========================================================================
  // Evidence Truth Layer Tests
  // ===========================================================================
  describe('Evidence Truth Layer', () => {
    describe('POST /api/acos/evidence/:evidenceId/analyze', () => {
      it('should analyze evidence', async () => {
        const response = await request(app)
          .post('/api/acos/evidence/ev-123/analyze')
          .expect(200);

        expect(response.body).toHaveProperty('verified');
      });
    });

    describe('GET /api/acos/evidence/:evidenceId/analysis', () => {
      it('should get evidence analysis', async () => {
        const response = await request(app)
          .get('/api/acos/evidence/ev-123/analysis')
          .expect(200);

        expect(response.body).toHaveProperty('verified');
      });
    });

    describe('POST /api/acos/evidence/verify-hash', () => {
      it('should reject a request with no file and no stored hash with 400', async () => {
        // validateMultipartBody(verifyFileHashSchema) runs before the controller and
        // rejects the missing required storedHash deterministically with 400.
        const response = await request(app)
          .post('/api/acos/evidence/verify-hash');

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(mockEvidenceTruthLayerService.verifyFileHash).not.toHaveBeenCalled();
      });
    });

    describe('POST /api/acos/evidence/sign', () => {
      it('should require file upload', async () => {
        // sign requires a multipart file upload
        const response = await request(app)
          .post('/api/acos/evidence/sign');

        // Without file, returns 400
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/acos/evidence/chain-of-custody', () => {
      it('should create chain of custody', async () => {
        const response = await request(app)
          .post('/api/acos/evidence/chain-of-custody')
          .send({ evidenceId: 'ev-123', action: 'upload' })
          .expect(200);

        expect(response.body).toHaveProperty('chainId');
      });
    });
  });

  // ===========================================================================
  // Regulatory Intelligence Fabric Tests
  // ===========================================================================
  describe('Regulatory Intelligence Fabric', () => {
    describe('POST /api/acos/rif/ingest-regulation', () => {
      it('should ingest a regulation from a JSON text body', async () => {
        mockRegulatoryIntelligenceFabricService.ingestRegulation.mockResolvedValue({ regulationId: 'reg-123' });

        const response = await request(app)
          .post('/api/acos/rif/ingest-regulation')
          .send({ text: 'Sample regulation text', metadata: { name: 'Test Regulation' } });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('regulationId', 'reg-123');
        // The text body must reach the service as the regulation input, scoped to the org.
        expect(mockRegulatoryIntelligenceFabricService.ingestRegulation).toHaveBeenCalledWith(
          'org-123',
          expect.objectContaining({ text: 'Sample regulation text' }),
          expect.anything(),
          'user-123'
        );
      });
    });

    describe('POST /api/acos/rif/detect-changes', () => {
      it('should detect regulatory changes', async () => {
        const response = await request(app)
          .post('/api/acos/rif/detect-changes')
          .send({ regulationText: 'Updated text', metadata: {} });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('changes');
      });
    });

    describe('POST /api/acos/rif/:regulatoryChangeId/auto-update', () => {
      it('should auto-update controls for regulatory change', async () => {
        const response = await request(app)
          .post('/api/acos/rif/change-123/auto-update')
          .expect(200);

        expect(response.body).toHaveProperty('updated');
      });
    });

    describe('POST /api/acos/rif/feeds', () => {
      it('should add a regulatory feed', async () => {
        const response = await request(app)
          .post('/api/acos/rif/feeds')
          .send({ name: 'Test Feed', url: 'https://example.com/feed', type: 'RSS' })
          .expect(200);

        expect(response.body).toHaveProperty('feedId');
      });
    });

    describe('GET /api/acos/rif/feeds/dashboard', () => {
      it('should get feed status dashboard', async () => {
        const response = await request(app)
          .get('/api/acos/rif/feeds/dashboard')
          .expect(200);

        expect(response.body).toHaveProperty('feeds');
      });
    });
  });

  // ===========================================================================
  // Temporal Graph Networks Tests
  // ===========================================================================
  describe('Temporal Graph Networks', () => {
    describe('GET /api/acos/tgn/predict-risks', () => {
      it('should predict future risks', async () => {
        const response = await request(app)
          .get('/api/acos/tgn/predict-risks')
          .expect(200);

        expect(response.body).toHaveProperty('predictions');
      });
    });

    describe('GET /api/acos/tgn/frameworks/:frameworkId/trajectory', () => {
      it('should return the compliance trajectory for the framework', async () => {
        mockTemporalGraphNetworkService.predictComplianceTrajectory.mockResolvedValue({ trajectory: [{ period: 'Q1', score: 80 }] });

        const response = await request(app)
          .get('/api/acos/tgn/frameworks/fw-123/trajectory');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('trajectory');
        expect(mockTemporalGraphNetworkService.predictComplianceTrajectory).toHaveBeenCalled();
      });
    });

    describe('GET /api/acos/tgn/early-warnings', () => {
      it('should get early warnings', async () => {
        const response = await request(app)
          .get('/api/acos/tgn/early-warnings')
          .expect(200);

        expect(response.body).toHaveProperty('warnings');
      });
    });
  });

  // ===========================================================================
  // Compliance Digital Twin Tests
  // ===========================================================================
  describe('Compliance Digital Twin', () => {
    describe('POST /api/acos/digital-twin/simulate', () => {
      it('should run a simulation', async () => {
        const response = await request(app)
          .post('/api/acos/digital-twin/simulate')
          .send({ scenario: 'BaselineCompliance' })
          .expect(200);

        expect(response.body).toHaveProperty('simulationId');
      });
    });

    describe('POST /api/acos/digital-twin/compare-scenarios', () => {
      it('should compare scenarios', async () => {
        const response = await request(app)
          .post('/api/acos/digital-twin/compare-scenarios')
          .send({ scenarioIds: ['scenario-1', 'scenario-2'] })
          .expect(200);

        expect(response.body).toHaveProperty('comparison');
      });
    });

    describe('POST /api/acos/digital-twin/monte-carlo', () => {
      it('should run Monte Carlo simulation', async () => {
        const response = await request(app)
          .post('/api/acos/digital-twin/monte-carlo')
          .send({ iterations: 1000 })
          .expect(200);

        expect(response.body).toHaveProperty('results');
      });
    });
  });

  // ===========================================================================
  // Red Teaming Tests
  // ===========================================================================
  describe('Red Teaming', () => {
    describe('POST /api/acos/red-team/simulate', () => {
      it('should run red team simulation', async () => {
        const response = await request(app)
          .post('/api/acos/red-team/simulate')
          .send({ attackVectors: ['SocialEngineering'] })
          .expect(200);

        expect(response.body).toHaveProperty('findings');
      });
    });

    describe('POST /api/acos/red-team/automated-scan', () => {
      it('should start an automated scan and return its id', async () => {
        mockRedTeamService.runAutomatedScan.mockResolvedValue({ scanId: 'scan-123' });

        const response = await request(app)
          .post('/api/acos/red-team/automated-scan')
          .send({ scope: 'full' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('scanId', 'scan-123');
        expect(mockRedTeamService.runAutomatedScan).toHaveBeenCalled();
      });
    });

    describe('GET /api/acos/red-team/compliance-gaps', () => {
      it('should scan for compliance gaps', async () => {
        const response = await request(app)
          .get('/api/acos/red-team/compliance-gaps')
          .expect(200);

        expect(response.body).toHaveProperty('gaps');
      });
    });

    describe('GET /api/acos/red-team/misconfigurations', () => {
      it('should scan for misconfigurations', async () => {
        const response = await request(app)
          .get('/api/acos/red-team/misconfigurations')
          .expect(200);

        expect(response.body).toHaveProperty('misconfigs');
      });
    });
  });

  // ===========================================================================
  // Federated Swarm Tests
  // ===========================================================================
  describe('Federated Swarm', () => {
    describe('POST /api/acos/swarm/join', () => {
      it('should join federation', async () => {
        const response = await request(app)
          .post('/api/acos/swarm/join')
          .expect(200);

        expect(response.body).toHaveProperty('joined');
      });
    });

    describe('POST /api/acos/swarm/contribute', () => {
      it('should contribute to federation', async () => {
        const response = await request(app)
          .post('/api/acos/swarm/contribute')
          .send({ data: { insights: 'anonymized_insights' } })
          .expect(200);

        expect(response.body).toHaveProperty('contributed');
      });
    });

    describe('GET /api/acos/swarm/insights', () => {
      it('should get swarm insights', async () => {
        const response = await request(app)
          .get('/api/acos/swarm/insights')
          .expect(200);

        expect(response.body).toHaveProperty('insights');
      });
    });

    describe('GET /api/acos/swarm/benchmark', () => {
      it('should benchmark against peers', async () => {
        const response = await request(app)
          .get('/api/acos/swarm/benchmark')
          .expect(200);

        expect(response.body).toHaveProperty('benchmark');
      });
    });
  });

  // ===========================================================================
  // Physical AI Tests
  // ===========================================================================
  describe('Physical AI (Edge Devices)', () => {
    describe('POST /api/acos/physical-ai/register-device', () => {
      it('should register an edge device', async () => {
        const response = await request(app)
          .post('/api/acos/physical-ai/register-device')
          .send({
            name: 'Edge Device 1',
            type: 'IoT',
            metadata: { serialNumber: 'SN12345' },
          })
          .expect(200);

        expect(response.body).toHaveProperty('deviceId');
      });
    });

    describe('GET /api/acos/physical-ai/devices', () => {
      it('should list devices', async () => {
        const response = await request(app)
          .get('/api/acos/physical-ai/devices')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/acos/physical-ai/devices/:deviceId/compliance-check', () => {
      it('should perform edge compliance check', async () => {
        const response = await request(app)
          .post('/api/acos/physical-ai/devices/device-123/compliance-check')
          .expect(200);

        expect(response.body).toHaveProperty('compliant');
      });
    });

    describe('GET /api/acos/physical-ai/health/dashboard', () => {
      it('should get health dashboard', async () => {
        const response = await request(app)
          .get('/api/acos/physical-ai/health/dashboard')
          .expect(200);

        expect(response.body).toHaveProperty('health');
      });
    });
  });

  // ===========================================================================
  // VR Collaborative Review Tests
  // ===========================================================================
  describe('VR Collaborative Review', () => {
    describe('POST /api/acos/vr/sessions', () => {
      it('should create a VR session', async () => {
        const response = await request(app)
          .post('/api/acos/vr/sessions')
          .send({ name: 'Compliance Review Session' })
          .expect(200);

        expect(response.body).toHaveProperty('sessionId');
      });
    });

    describe('GET /api/acos/vr/sessions', () => {
      it('should list active VR sessions', async () => {
        const response = await request(app)
          .get('/api/acos/vr/sessions')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/acos/vr/sessions/:sessionId/join', () => {
      it('should join the VR session and return the joined state', async () => {
        mockVrCollaborativeReviewService.joinSession.mockResolvedValue({ joined: true });

        const response = await request(app)
          .post('/api/acos/vr/sessions/vr-123/join')
          .send({ role: 'reviewer' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('joined', true);
        expect(mockVrCollaborativeReviewService.joinSession).toHaveBeenCalled();
      });
    });

    describe('POST /api/acos/vr/sessions/:sessionId/annotations', () => {
      it('should add annotation to session', async () => {
        const response = await request(app)
          .post('/api/acos/vr/sessions/vr-123/annotations')
          .send({ content: 'Review this control', position: { x: 0, y: 0, z: 0 } })
          .expect(200);

        expect(response.body).toHaveProperty('annotationId');
      });
    });

    describe('POST /api/acos/vr/training/scenarios', () => {
      it('should create training scenario', async () => {
        const response = await request(app)
          .post('/api/acos/vr/training/scenarios')
          .send({ name: 'SOC2 Training', type: 'Intermediate' })
          .expect(200);

        expect(response.body).toHaveProperty('scenarioId');
      });
    });
  });

  // ===========================================================================
  // JIT Access Tests
  // ===========================================================================
  describe('JIT Access Management', () => {
    describe('POST /api/acos/jit/request', () => {
      it('should request JIT access', async () => {
        const response = await request(app)
          .post('/api/acos/jit/request')
          .send({
            resource: 'sensitive-data',
            duration: 3600,
            reason: 'Audit investigation',
          })
          .expect(200);

        expect(response.body).toHaveProperty('requestId');
      });
    });

    describe('GET /api/acos/jit/sessions', () => {
      it('should list JIT sessions', async () => {
        const response = await request(app)
          .get('/api/acos/jit/sessions')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('GET /api/acos/jit/requests/pending', () => {
      it('returns 200 with the pending requests for an admin', async () => {
        // Canonical admin role (lowercase, per the Prisma Role enum) is the authorized case.
        mockJitAccessService.getPendingAccessRequests.mockResolvedValue([
          { id: 'jit-1', userId: 'user-9', status: 'Pending' },
        ]);

        const response = await request(app).get('/api/acos/jit/requests/pending');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toHaveProperty('id', 'jit-1');
        expect(mockJitAccessService.getPendingAccessRequests).toHaveBeenCalledWith('org-123');
      });

      it('returns 403 for a non-admin caller', async () => {
        authState.role = 'editor';

        const response = await request(app).get('/api/acos/jit/requests/pending');

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error', 'Insufficient privileges. Admin access required.');
        expect(mockJitAccessService.getPendingAccessRequests).not.toHaveBeenCalled();
      });
    });

    describe('POST /api/acos/jit/requests/:requestId/approve', () => {
      it('approves the request and returns 200 for an admin', async () => {
        mockJitAccessService.approveAccess.mockResolvedValue({ id: 'session-1' });

        const response = await request(app).post('/api/acos/jit/requests/jit-123/approve');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(mockJitAccessService.approveAccess).toHaveBeenCalledWith('jit-123', 'user-123', 'org-123');
      });

      it('returns 403 for a non-admin caller', async () => {
        authState.role = 'viewer';

        const response = await request(app).post('/api/acos/jit/requests/jit-123/approve');

        expect(response.status).toBe(403);
        expect(mockJitAccessService.approveAccess).not.toHaveBeenCalled();
      });
    });

    describe('POST /api/acos/jit/requests/:requestId/deny', () => {
      it('denies the request and returns 200 for an admin', async () => {
        mockJitAccessService.denyAccess.mockResolvedValue({ denied: true });

        const response = await request(app)
          .post('/api/acos/jit/requests/jit-123/deny')
          .send({ reason: 'Insufficient justification' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(mockJitAccessService.denyAccess).toHaveBeenCalledWith('jit-123', 'user-123', 'Insufficient justification');
      });

      it('returns 400 when an admin omits the denial reason', async () => {
        const response = await request(app)
          .post('/api/acos/jit/requests/jit-123/deny')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Denial reason is required');
        expect(mockJitAccessService.denyAccess).not.toHaveBeenCalled();
      });

      it('returns 403 for a non-admin caller', async () => {
        authState.role = 'editor';

        const response = await request(app)
          .post('/api/acos/jit/requests/jit-123/deny')
          .send({ reason: 'No' });

        expect(response.status).toBe(403);
        expect(mockJitAccessService.denyAccess).not.toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // Swarm Task Allocation Tests
  // ===========================================================================
  describe('Swarm Task Allocation', () => {
    describe('POST /api/acos/swarm-tasks/agents', () => {
      it('should register swarm agent', async () => {
        const response = await request(app)
          .post('/api/acos/swarm-tasks/agents')
          .send({ name: 'Agent-001', capabilities: ['compliance', 'audit'] })
          .expect(200);

        expect(response.body).toHaveProperty('agentId');
      });
    });

    describe('GET /api/acos/swarm-tasks/agents', () => {
      it('should list swarm agents', async () => {
        const response = await request(app)
          .get('/api/acos/swarm-tasks/agents')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/acos/swarm-tasks', () => {
      it('should submit swarm task', async () => {
        const response = await request(app)
          .post('/api/acos/swarm-tasks')
          .send({ type: 'Compliance Check', priority: 'High' })
          .expect(200);

        expect(response.body).toHaveProperty('taskId');
      });
    });

    describe('GET /api/acos/swarm-tasks/dashboard', () => {
      it('should return the swarm dashboard (static segment not shadowed by /:taskId)', async () => {
        mockSwarmTaskAllocationService.getDashboard.mockReturnValue({ activeAgents: 2, queuedTasks: 1 });

        const response = await request(app)
          .get('/api/acos/swarm-tasks/dashboard');

        expect(response.status).toBe(200);
        // The dedicated dashboard handler must run, not getSwarmTaskStatus with taskId="dashboard".
        expect(mockSwarmTaskAllocationService.getDashboard).toHaveBeenCalled();
        expect(mockSwarmTaskAllocationService.getTaskStatus).not.toHaveBeenCalledWith('dashboard');
      });
    });

    describe('GET /api/acos/swarm-tasks/metrics', () => {
      it('should return swarm metrics (static segment not shadowed by /:taskId)', async () => {
        mockSwarmTaskAllocationService.getSwarmMetrics.mockReturnValue({ throughput: 5 });

        const response = await request(app)
          .get('/api/acos/swarm-tasks/metrics');

        expect(response.status).toBe(200);
        expect(mockSwarmTaskAllocationService.getSwarmMetrics).toHaveBeenCalled();
        expect(mockSwarmTaskAllocationService.getTaskStatus).not.toHaveBeenCalledWith('metrics');
      });
    });
  });

  // ===========================================================================
  // NeuroSymbolic AI Tests
  // ===========================================================================
  describe('NeuroSymbolic AI', () => {
    describe('POST /api/acos/neuro-symbolic/hybrid-reasoning', () => {
      it('should perform hybrid reasoning', async () => {
        const response = await request(app)
          .post('/api/acos/neuro-symbolic/hybrid-reasoning')
          .send({ query: 'What controls are required for GDPR compliance?' })
          .expect(200);

        expect(response.body).toHaveProperty('reasoning');
      });
    });

    describe('POST /api/acos/neuro-symbolic/infer-rules', () => {
      it('should infer rules from patterns and return them under "inferences"', async () => {
        mockNeuroSymbolicAIService.inferRulesFromPatterns.mockResolvedValue([{ rule: 'r1' }]);

        const response = await request(app)
          .post('/api/acos/neuro-symbolic/infer-rules')
          .send({ patterns: ['pattern-1', 'pattern-2'] });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('inferences');
        expect(mockNeuroSymbolicAIService.inferRulesFromPatterns).toHaveBeenCalledWith(
          'org-123',
          ['pattern-1', 'pattern-2']
        );
      });
    });

    describe('POST /api/acos/neuro-symbolic/causal-reasoning', () => {
      it('should perform causal reasoning', async () => {
        const response = await request(app)
          .post('/api/acos/neuro-symbolic/causal-reasoning')
          .send({ event: 'Data breach', context: {} })
          .expect(200);

        expect(response.body).toHaveProperty('causalChain');
      });
    });

    describe('POST /api/acos/neuro-symbolic/explainable-decision', () => {
      it('should generate explainable decision', async () => {
        const response = await request(app)
          .post('/api/acos/neuro-symbolic/explainable-decision')
          .send({ decisionType: 'RiskAssessment', input: {} })
          .expect(200);

        expect(response.body).toHaveProperty('decision');
        expect(response.body).toHaveProperty('explanation');
      });
    });
  });

  // ===========================================================================
  // Homomorphic AI Tests
  // ===========================================================================
  describe('Homomorphic AI', () => {
    describe('POST /api/acos/homomorphic/keys/generate', () => {
      it('should generate homomorphic keys', async () => {
        const response = await request(app)
          .post('/api/acos/homomorphic/keys/generate')
          .send({ keySize: 2048, parameters: { scheme: 'CKKS' } });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('publicKey');
      });
    });

    describe('POST /api/acos/homomorphic/encrypt', () => {
      it('should reject a publicKey field that the request schema does not allow with 400', async () => {
        // encryptDataSchema permits only { data, keyId } with unknown(false); a publicKey
        // field is rejected at validation. (Schema/controller mismatch: the controller
        // requires publicKey, which the validation schema does not permit — a real product
        // gap. Asserted deterministically so the build fails if either side changes silently.)
        const response = await request(app)
          .post('/api/acos/homomorphic/encrypt')
          .send({ data: [1.0, 2.0, 3.0], publicKey: 'pk-123', scheme: 'CKKS' });

        expect(response.status).toBe(400);
        expect(mockHomomorphicAIService.encryptData).not.toHaveBeenCalled();
      });

      it('should reject a schema-valid body that lacks the controller-required publicKey with 400', async () => {
        // { data, keyId } passes validation but the controller still requires publicKey,
        // returning a deterministic 400 (no longer masked as a 500 by the catch block).
        const response = await request(app)
          .post('/api/acos/homomorphic/encrypt')
          .send({ data: [1.0, 2.0, 3.0], keyId: 'pk-123' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Public key is required');
        expect(mockHomomorphicAIService.encryptData).not.toHaveBeenCalled();
      });
    });

    describe('POST /api/acos/homomorphic/linear-regression', () => {
      it('should run encrypted linear regression with the supplied keys', async () => {
        mockHomomorphicAIService.encryptedLinearRegression.mockResolvedValue({ result: { ciphertext: 'enc-result' } });

        const response = await request(app)
          .post('/api/acos/homomorphic/linear-regression')
          .send({
            encryptedFeatures: { ciphertext: 'enc-features' },
            weights: [0.5, 0.3],
            publicKey: 'pk-123',
            relinKeys: 'relin-123',
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result');
        expect(mockHomomorphicAIService.encryptedLinearRegression).toHaveBeenCalled();
      });
    });

    describe('POST /api/acos/homomorphic/statistics', () => {
      it('should compute encrypted statistics with the supplied keys', async () => {
        mockHomomorphicAIService.encryptedStatistics.mockResolvedValue({ stats: { mean: { ciphertext: 'enc' } } });

        const response = await request(app)
          .post('/api/acos/homomorphic/statistics')
          .send({
            encryptedData: { ciphertext: 'enc-data' },
            galoisKeys: 'galois-123',
            relinKeys: 'relin-123',
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('stats');
        expect(mockHomomorphicAIService.encryptedStatistics).toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // Compliance Debt Tests
  // ===========================================================================
  describe('Compliance Debt Management', () => {
    describe('GET /api/acos/compliance-debts', () => {
      it('should list compliance debts', async () => {
        const response = await request(app)
          .get('/api/acos/compliance-debts')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/acos/compliance-debts', () => {
      it('should track compliance debt', async () => {
        const response = await request(app)
          .post('/api/acos/compliance-debts')
          .send({
            description: 'Missing encryption controls',
            severity: 'High',
          })
          .expect(200);

        expect(response.body).toHaveProperty('id');
      });
    });

    describe('POST /api/acos/compliance-debts/calculate-from-gap', () => {
      it('should calculate debt from gap analysis', async () => {
        const response = await request(app)
          .post('/api/acos/compliance-debts/calculate-from-gap')
          .send({ frameworkId: 'fw-123' })
          .expect(200);

        expect(response.body).toHaveProperty('debtScore');
      });
    });

    describe('POST /api/acos/compliance-debts/:debtId/resolve', () => {
      it('should resolve compliance debt', async () => {
        const response = await request(app)
          .post('/api/acos/compliance-debts/debt-123/resolve')
          .send({ resolution: 'Implemented missing controls' })
          .expect(200);

        expect(response.body).toHaveProperty('resolved', true);
      });
    });
  });

  // ===========================================================================
  // Change Impact Tests
  // ===========================================================================
  describe('Change Impact Analysis', () => {
    describe('GET /api/acos/change-impacts', () => {
      it('should list change impacts', async () => {
        const response = await request(app)
          .get('/api/acos/change-impacts')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/acos/change-impacts/forecast', () => {
      it('should forecast change impact', async () => {
        const response = await request(app)
          .post('/api/acos/change-impacts/forecast')
          .send({
            changeDescription: 'Regulatory change impacting frameworks',
            scope: 'SOC2,ISO27001',
          })
          .expect(200);

        expect(response.body).toHaveProperty('impact');
      });
    });
  });
});
