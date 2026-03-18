/**
 * WebRTC Signaling Service Unit Tests
 *
 * Tests for WebRTC signaling server including Socket.io integration,
 * ICE/STUN/TURN configuration, session management, peer connections,
 * mesh/SFU topology, and VR collaborative review sessions.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EventEmitter } from 'events';

// Mock Socket.io namespace
class MockNamespace extends EventEmitter {
  use = jest.fn();
  on = jest.fn().mockImplementation((event: string, handler: (...args: any[]) => void) => {
    if (event === 'connection') {
      (this as any).connectionHandler = handler;
    }
    return this;
  });
  emit = jest.fn();
  to = jest.fn().mockReturnThis();
  in = jest.fn().mockReturnThis();
  disconnectSockets = jest.fn();
  volatile = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
  except = jest.fn().mockReturnThis();
}

// Mock Socket.io server
class MockServer {
  private mockNamespace = new MockNamespace();
  of = jest.fn().mockImplementation(() => this.mockNamespace);
  close = jest.fn();
}

let mockServerInstance: MockServer;
let mockNamespaceInstance: MockNamespace;

jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => {
    mockServerInstance = new MockServer();
    mockNamespaceInstance = (mockServerInstance as any).mockNamespace;
    return mockServerInstance;
  }),
}));

// Mock HTTP server
const mockHttpServer = {
  on: jest.fn(),
  close: jest.fn(),
};

jest.mock('../../../../config', () => ({
  __esModule: true,
  default: {
    security: {
      corsOrigin: '*',
      jwtSecret: 'test-secret',
    },
  },
}));

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock JWT for token validation
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockReturnValue({
    userId: 'user-123',
    organizationId: 'org-123',
  }),
  sign: jest.fn().mockReturnValue('signed-token'),
}));

import webrtcSignalingService from '../../../../services/advanced/webrtcSignalingService';

describe('WebRTCSignalingService', () => {
  const orgId = 'org-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset internal state of the singleton
    (webrtcSignalingService as any).io = null;
    (webrtcSignalingService as any).namespace = null;
    (webrtcSignalingService as any).sessions = new Map();
    (webrtcSignalingService as any).peersBySocket = new Map();
    (webrtcSignalingService as any).eventRateLimits = new Map();
    (webrtcSignalingService as any).ipConnectionCounts = new Map();
    (webrtcSignalingService as any).reconnectStates = new Map();
    (webrtcSignalingService as any).qualityHistory = new Map();
    (webrtcSignalingService as any).dtlsFingerprints = new Map();
    (webrtcSignalingService as any).heartbeatTimer = null;
    (webrtcSignalingService as any).qualityLogTimer = null;
    (webrtcSignalingService as any).cleanupTimer = null;

    // Re-establish socket.io mock
    const { Server } = require('socket.io');
    Server.mockImplementation(() => {
      mockServerInstance = new MockServer();
      mockNamespaceInstance = (mockServerInstance as any).mockNamespace;
      return mockServerInstance;
    });

    // Re-establish JWT mock
    const jwt = require('jsonwebtoken');
    jwt.verify.mockReturnValue({ userId: 'user-123', organizationId: 'org-123' });
    jwt.sign.mockReturnValue('signed-token');
  });

  // ===========================================================================
  // attachToServer
  // ===========================================================================
  describe('attachToServer', () => {
    it('should attach to HTTP server and create Socket.IO server', () => {
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      expect((webrtcSignalingService as any).io).toBeDefined();
      expect((webrtcSignalingService as any).namespace).toBeDefined();
    });

    it('should create the /webrtc namespace', () => {
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      expect(mockServerInstance.of).toHaveBeenCalledWith('/webrtc');
    });

    it('should set up authentication middleware', () => {
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      expect(mockNamespaceInstance.use).toHaveBeenCalled();
    });

    it('should register connection handler on namespace', () => {
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      expect(mockNamespaceInstance.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should skip duplicate initialization', () => {
      webrtcSignalingService.attachToServer(mockHttpServer as any);
      const firstIo = (webrtcSignalingService as any).io;

      // Second call should be a no-op
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      expect((webrtcSignalingService as any).io).toBe(firstIo);
    });
  });

  // ===========================================================================
  // Session Management — createSession
  // ===========================================================================
  describe('createSession', () => {
    it('should create a new session and return config', () => {
      const config = webrtcSignalingService.createSession({
        sessionId: 'session-123',
        organizationId: orgId,
        hostUserId: 'user-123',
        maxPeers: 10,
      });

      expect(config).toHaveProperty('sessionId', 'session-123');
      expect(config).toHaveProperty('iceServers');
    });

    it('should store session in memory', () => {
      webrtcSignalingService.createSession({
        sessionId: 'session-123',
        organizationId: orgId,
        hostUserId: 'user-123',
      });

      const stored = (webrtcSignalingService as any).sessions.get('session-123');
      expect(stored).toBeDefined();
      expect(stored.organizationId).toBe(orgId);
    });

    it('should use mesh topology by default for small groups', () => {
      webrtcSignalingService.createSession({
        sessionId: 'session-123',
        organizationId: orgId,
        hostUserId: 'user-123',
        maxPeers: 4,
      });

      const stored = (webrtcSignalingService as any).sessions.get('session-123');
      expect(stored.topology).toBe('mesh');
    });

    it('should use sfu topology for larger groups', () => {
      webrtcSignalingService.createSession({
        sessionId: 'session-123',
        organizationId: orgId,
        hostUserId: 'user-123',
        maxPeers: 10,
      });

      const stored = (webrtcSignalingService as any).sessions.get('session-123');
      expect(stored.topology).toBe('sfu');
    });

    it('should support explicit SFU topology', () => {
      webrtcSignalingService.createSession({
        sessionId: 'session-123',
        organizationId: orgId,
        hostUserId: 'user-123',
        topology: 'sfu',
      });

      const stored = (webrtcSignalingService as any).sessions.get('session-123');
      expect(stored.topology).toBe('sfu');
    });

    it('should return existing config for duplicate session ID', () => {
      const config1 = webrtcSignalingService.createSession({
        sessionId: 'session-123',
        organizationId: orgId,
        hostUserId: 'user-123',
      });

      const config2 = webrtcSignalingService.createSession({
        sessionId: 'session-123',
        organizationId: orgId,
        hostUserId: 'user-456',
      });

      expect(config1.sessionId).toBe(config2.sessionId);
    });

    it('should include ICE servers in config', () => {
      const config = webrtcSignalingService.createSession({
        sessionId: 'session-123',
        organizationId: orgId,
        hostUserId: 'user-123',
      });

      expect(Array.isArray(config.iceServers)).toBe(true);
      expect(config.iceServers.length).toBeGreaterThan(0);
    });

    it('should include data channel config', () => {
      const config = webrtcSignalingService.createSession({
        sessionId: 'session-123',
        organizationId: orgId,
        hostUserId: 'user-123',
      });

      expect(config).toHaveProperty('dataChannels');
      expect(Array.isArray(config.dataChannels)).toBe(true);
    });
  });

  // ===========================================================================
  // Session Management — destroySession
  // ===========================================================================
  describe('destroySession', () => {
    beforeEach(() => {
      // Set up namespace mock for emitToPeer
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      // Create a session with peers
      const peers = new Map();
      peers.set('peer-1', {
        peerId: 'peer-1',
        userId: 'user-123',
        sessionId: 'session-123',
        socketId: 'socket-123',
        connectionState: 'connected',
        mediaState: { audioEnabled: true, videoEnabled: true, screenSharing: false, dataChannelOpen: false },
        quality: { rtt: 50, packetLoss: 0, jitter: 0.01, bandwidth: 5000 },
        joinedAt: new Date(),
        lastHeartbeat: new Date(),
      });

      (webrtcSignalingService as any).sessions.set('session-123', {
        sessionId: 'session-123',
        organizationId: orgId,
        hostPeerId: 'peer-1',
        peers,
        topology: 'mesh',
        maxPeers: 10,
        sfuPeerId: null,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        recordingActive: false,
        iceServers: [],
      });
    });

    it('should remove session from memory', () => {
      webrtcSignalingService.destroySession('session-123');

      expect((webrtcSignalingService as any).sessions.has('session-123')).toBe(false);
    });

    it('should handle non-existent session gracefully', () => {
      expect(() => {
        webrtcSignalingService.destroySession('non-existent');
      }).not.toThrow();
    });

    it('should log a warning for non-existent session', () => {
      const logger = require('../../../../config/logger').default;

      webrtcSignalingService.destroySession('non-existent');

      expect(logger.warn).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // getSessionPeers
  // ===========================================================================
  describe('getSessionPeers', () => {
    beforeEach(() => {
      const peers = new Map();
      peers.set('peer-1', {
        peerId: 'peer-1',
        userId: 'user-1',
        sessionId: 'session-123',
        socketId: 'socket-1',
        connectionState: 'connected',
        mediaState: { audioEnabled: true, videoEnabled: true, screenSharing: false, dataChannelOpen: false },
        quality: { rtt: 50, packetLoss: 0, jitter: 0.01, bandwidth: 5000 },
        joinedAt: new Date(),
        lastHeartbeat: new Date(),
      });
      peers.set('peer-2', {
        peerId: 'peer-2',
        userId: 'user-2',
        sessionId: 'session-123',
        socketId: 'socket-2',
        connectionState: 'connected',
        mediaState: { audioEnabled: true, videoEnabled: false, screenSharing: false, dataChannelOpen: false },
        quality: { rtt: 80, packetLoss: 1, jitter: 0.02, bandwidth: 3000 },
        joinedAt: new Date(),
        lastHeartbeat: new Date(),
      });

      (webrtcSignalingService as any).sessions.set('session-123', {
        sessionId: 'session-123',
        organizationId: orgId,
        hostPeerId: 'peer-1',
        peers,
        topology: 'mesh',
        maxPeers: 10,
        sfuPeerId: null,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        recordingActive: false,
        iceServers: [],
      });
    });

    it('should return list of peers in session', () => {
      const peers = webrtcSignalingService.getSessionPeers('session-123');

      expect(peers.length).toBe(2);
      expect(peers[0]).toHaveProperty('peerId');
      expect(peers[0]).toHaveProperty('userId');
    });

    it('should return empty array for non-existent session', () => {
      const peers = webrtcSignalingService.getSessionPeers('non-existent');

      expect(peers).toEqual([]);
    });
  });

  // ===========================================================================
  // getICEServers
  // ===========================================================================
  describe('getICEServers', () => {
    it('should return ICE server configuration', () => {
      const servers = webrtcSignalingService.getICEServers();

      expect(Array.isArray(servers)).toBe(true);
      expect(servers.length).toBeGreaterThan(0);
    });

    it('should include STUN servers', () => {
      const servers = webrtcSignalingService.getICEServers();

      const stunServer = servers.find((s: any) =>
        (Array.isArray(s.urls) ? s.urls : [s.urls]).some((u: string) => u.startsWith('stun:'))
      );
      expect(stunServer).toBeDefined();
    });
  });

  // ===========================================================================
  // getSessionConfig
  // ===========================================================================
  describe('getSessionConfig', () => {
    beforeEach(() => {
      webrtcSignalingService.createSession({
        sessionId: 'session-123',
        organizationId: orgId,
        hostUserId: 'user-123',
      });
    });

    it('should return config for existing session', () => {
      const config = webrtcSignalingService.getSessionConfig('session-123');

      expect(config).not.toBeNull();
      expect(config!.sessionId).toBe('session-123');
    });

    it('should return null for non-existent session', () => {
      const config = webrtcSignalingService.getSessionConfig('non-existent');

      expect(config).toBeNull();
    });

    it('should include topology in config', () => {
      const config = webrtcSignalingService.getSessionConfig('session-123');

      expect(config).toHaveProperty('topology');
      expect(['mesh', 'sfu']).toContain(config!.topology);
    });
  });

  // ===========================================================================
  // toggleRecording
  // ===========================================================================
  describe('toggleRecording', () => {
    beforeEach(() => {
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      (webrtcSignalingService as any).sessions.set('session-123', {
        sessionId: 'session-123',
        organizationId: orgId,
        hostPeerId: 'peer-1',
        peers: new Map(),
        topology: 'mesh',
        maxPeers: 10,
        sfuPeerId: null,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        recordingActive: false,
        iceServers: [],
      });
    });

    it('should activate recording', () => {
      webrtcSignalingService.toggleRecording('session-123', true);

      const session = (webrtcSignalingService as any).sessions.get('session-123');
      expect(session.recordingActive).toBe(true);
    });

    it('should deactivate recording', () => {
      const session = (webrtcSignalingService as any).sessions.get('session-123');
      session.recordingActive = true;

      webrtcSignalingService.toggleRecording('session-123', false);

      expect(session.recordingActive).toBe(false);
    });

    it('should handle non-existent session gracefully', () => {
      expect(() => {
        webrtcSignalingService.toggleRecording('non-existent', true);
      }).not.toThrow();
    });
  });

  // ===========================================================================
  // triggerICERestart
  // ===========================================================================
  describe('triggerICERestart', () => {
    beforeEach(() => {
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      const peers = new Map();
      peers.set('peer-1', {
        peerId: 'peer-1',
        userId: 'user-1',
        sessionId: 'session-123',
        socketId: 'socket-1',
        connectionState: 'connected',
        mediaState: { audioEnabled: true, videoEnabled: true, screenSharing: false, dataChannelOpen: false },
        quality: { rtt: 50, packetLoss: 0, jitter: 0.01, bandwidth: 5000 },
        joinedAt: new Date(),
        lastHeartbeat: new Date(),
      });
      peers.set('peer-2', {
        peerId: 'peer-2',
        userId: 'user-2',
        sessionId: 'session-123',
        socketId: 'socket-2',
        connectionState: 'connected',
        mediaState: { audioEnabled: true, videoEnabled: true, screenSharing: false, dataChannelOpen: false },
        quality: { rtt: 80, packetLoss: 1, jitter: 0.02, bandwidth: 3000 },
        joinedAt: new Date(),
        lastHeartbeat: new Date(),
      });

      (webrtcSignalingService as any).sessions.set('session-123', {
        sessionId: 'session-123',
        organizationId: orgId,
        hostPeerId: 'peer-1',
        peers,
        topology: 'mesh',
        maxPeers: 10,
        sfuPeerId: null,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        recordingActive: false,
        iceServers: [],
      });
    });

    it('should trigger ICE restart between two peers', () => {
      webrtcSignalingService.triggerICERestart('session-123', 'peer-1', 'peer-2');

      const session = (webrtcSignalingService as any).sessions.get('session-123');
      expect(session.iceServers.length).toBeGreaterThan(0);
    });

    it('should handle non-existent session gracefully', () => {
      expect(() => {
        webrtcSignalingService.triggerICERestart('non-existent', 'peer-1', 'peer-2');
      }).not.toThrow();
    });

    it('should handle non-existent peer gracefully', () => {
      expect(() => {
        webrtcSignalingService.triggerICERestart('session-123', 'peer-1', 'non-existent');
      }).not.toThrow();
    });
  });

  // ===========================================================================
  // getSessionQualityMetrics
  // ===========================================================================
  describe('getSessionQualityMetrics', () => {
    it('should return empty peers for non-existent session', () => {
      const metrics = webrtcSignalingService.getSessionQualityMetrics('non-existent');

      expect(metrics).toEqual({ peers: {} });
    });

    it('should return quality metrics for session peers', () => {
      const peers = new Map();
      peers.set('peer-1', {
        peerId: 'peer-1',
        userId: 'user-1',
        sessionId: 'session-123',
        socketId: 'socket-1',
        connectionState: 'connected',
        mediaState: { audioEnabled: true, videoEnabled: true, screenSharing: false, dataChannelOpen: false },
        quality: { rtt: 50, packetLoss: 0, jitter: 0.01, bandwidth: 5000 },
        joinedAt: new Date(),
        lastHeartbeat: new Date(),
      });

      (webrtcSignalingService as any).sessions.set('session-123', {
        sessionId: 'session-123',
        organizationId: orgId,
        hostPeerId: 'peer-1',
        peers,
        topology: 'mesh',
        maxPeers: 10,
        sfuPeerId: null,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        recordingActive: false,
        iceServers: [],
      });

      const metrics = webrtcSignalingService.getSessionQualityMetrics('session-123');

      expect(metrics.peers).toHaveProperty('peer-1');
    });
  });

  // ===========================================================================
  // getTopologyData
  // ===========================================================================
  describe('getTopologyData', () => {
    it('should return null for non-existent session', () => {
      const data = webrtcSignalingService.getTopologyData('non-existent');

      expect(data).toBeNull();
    });

    it('should return topology data for mesh session', () => {
      const peers = new Map();
      peers.set('peer-1', {
        peerId: 'peer-1',
        userId: 'user-1',
        sessionId: 'session-123',
        socketId: 'socket-1',
        connectionState: 'connected',
        mediaState: { audioEnabled: true, videoEnabled: true, screenSharing: false, dataChannelOpen: false },
        quality: { rtt: 50, packetLoss: 0, jitter: 0.01, bandwidth: 5000 },
        joinedAt: new Date(),
        lastHeartbeat: new Date(),
      });
      peers.set('peer-2', {
        peerId: 'peer-2',
        userId: 'user-2',
        sessionId: 'session-123',
        socketId: 'socket-2',
        connectionState: 'connected',
        mediaState: { audioEnabled: true, videoEnabled: true, screenSharing: false, dataChannelOpen: false },
        quality: { rtt: 80, packetLoss: 1, jitter: 0.02, bandwidth: 3000 },
        joinedAt: new Date(),
        lastHeartbeat: new Date(),
      });

      (webrtcSignalingService as any).sessions.set('session-123', {
        sessionId: 'session-123',
        organizationId: orgId,
        hostPeerId: 'peer-1',
        peers,
        topology: 'mesh',
        maxPeers: 10,
        sfuPeerId: null,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        recordingActive: false,
        iceServers: [],
      });

      const data = webrtcSignalingService.getTopologyData('session-123');

      expect(data).not.toBeNull();
      expect(data!.topology).toBe('mesh');
      expect(data!.nodes.length).toBe(2);
      expect(data!.edges.length).toBe(1); // 1 unique pair in mesh
    });

    it('should return topology data for SFU session', () => {
      const peers = new Map();
      peers.set('peer-1', {
        peerId: 'peer-1',
        userId: 'user-1',
        sessionId: 'session-123',
        socketId: 'socket-1',
        connectionState: 'connected',
        mediaState: { audioEnabled: true, videoEnabled: true, screenSharing: false, dataChannelOpen: false },
        quality: { rtt: 50, packetLoss: 0, jitter: 0.01, bandwidth: 5000 },
        joinedAt: new Date(),
        lastHeartbeat: new Date(),
      });
      peers.set('peer-2', {
        peerId: 'peer-2',
        userId: 'user-2',
        sessionId: 'session-123',
        socketId: 'socket-2',
        connectionState: 'connected',
        mediaState: { audioEnabled: true, videoEnabled: true, screenSharing: false, dataChannelOpen: false },
        quality: { rtt: 80, packetLoss: 1, jitter: 0.02, bandwidth: 3000 },
        joinedAt: new Date(),
        lastHeartbeat: new Date(),
      });

      (webrtcSignalingService as any).sessions.set('session-123', {
        sessionId: 'session-123',
        organizationId: orgId,
        hostPeerId: 'peer-1',
        peers,
        topology: 'sfu',
        maxPeers: 20,
        sfuPeerId: 'peer-1',
        createdAt: new Date(),
        lastActivityAt: new Date(),
        recordingActive: false,
        iceServers: [],
      });

      const data = webrtcSignalingService.getTopologyData('session-123');

      expect(data).not.toBeNull();
      expect(data!.topology).toBe('sfu');
      expect(data!.nodes.length).toBe(2);
      // In SFU, edges go from SFU to each non-SFU peer
      expect(data!.edges.length).toBe(1);
    });
  });

  // ===========================================================================
  // Private: buildICEServers
  // ===========================================================================
  describe('buildICEServers (private)', () => {
    it('should include default Google STUN servers', () => {
      const servers = (webrtcSignalingService as any).buildICEServers();

      expect(Array.isArray(servers)).toBe(true);
      const hasStun = servers.some((s: any) =>
        (Array.isArray(s.urls) ? s.urls : [s.urls]).some((u: string) => u.startsWith('stun:'))
      );
      expect(hasStun).toBe(true);
    });
  });

  // ===========================================================================
  // Private: generateTURNCredentials
  // ===========================================================================
  describe('generateTURNCredentials (private)', () => {
    it('should generate username and credential', () => {
      const creds = (webrtcSignalingService as any).generateTURNCredentials();

      expect(creds).toHaveProperty('username');
      expect(creds).toHaveProperty('credential');
      expect(typeof creds.username).toBe('string');
      expect(typeof creds.credential).toBe('string');
    });
  });

  // ===========================================================================
  // Private: computeEdgeQuality
  // ===========================================================================
  describe('computeEdgeQuality (private)', () => {
    it('should return a score between 0 and 1 for healthy peers', () => {
      const peerA = {
        connectionState: 'connected',
        quality: { rtt: 50, packetLoss: 0, jitter: 0.01, bandwidth: 5000 },
      };
      const peerB = {
        connectionState: 'connected',
        quality: { rtt: 60, packetLoss: 1, jitter: 0.02, bandwidth: 4000 },
      };

      const score = (webrtcSignalingService as any).computeEdgeQuality(peerA, peerB);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should reduce score for high RTT', () => {
      const peerA = {
        connectionState: 'connected',
        quality: { rtt: 500, packetLoss: 0, jitter: 0, bandwidth: 5000 },
      };
      const peerB = {
        connectionState: 'connected',
        quality: { rtt: 500, packetLoss: 0, jitter: 0, bandwidth: 5000 },
      };

      const score = (webrtcSignalingService as any).computeEdgeQuality(peerA, peerB);

      expect(score).toBeLessThan(1);
    });

    it('should reduce score for disconnected peers', () => {
      const peerA = {
        connectionState: 'disconnected',
        quality: { rtt: 50, packetLoss: 0, jitter: 0, bandwidth: 5000 },
      };
      const peerB = {
        connectionState: 'connected',
        quality: { rtt: 50, packetLoss: 0, jitter: 0, bandwidth: 5000 },
      };

      const score = (webrtcSignalingService as any).computeEdgeQuality(peerA, peerB);

      expect(score).toBeLessThan(0.5);
    });
  });

  // ===========================================================================
  // Private: generatePeerId
  // ===========================================================================
  describe('generatePeerId (private)', () => {
    it('should generate a unique peer ID based on userId', () => {
      const peerId1 = (webrtcSignalingService as any).generatePeerId('user-1');
      const peerId2 = (webrtcSignalingService as any).generatePeerId('user-2');

      expect(typeof peerId1).toBe('string');
      expect(peerId1.length).toBeGreaterThan(0);
      expect(peerId1).not.toBe(peerId2);
    });
  });

  // ===========================================================================
  // Private: checkRateLimit
  // ===========================================================================
  describe('checkRateLimit (private)', () => {
    it('should allow requests under the limit', () => {
      const mockSocket = { id: 'socket-123' };

      const allowed = (webrtcSignalingService as any).checkRateLimit(mockSocket);

      expect(allowed).toBe(true);
    });
  });

  // ===========================================================================
  // Private: evaluateTopology
  // ===========================================================================
  describe('evaluateTopology (private)', () => {
    it('should keep mesh topology for small peer counts', () => {
      const room = {
        topology: 'mesh',
        peers: new Map([['peer-1', {}], ['peer-2', {}], ['peer-3', {}]]),
        hostPeerId: 'peer-1',
        sfuPeerId: null,
      };

      (webrtcSignalingService as any).evaluateTopology(room);

      expect(room.topology).toBe('mesh');
    });

    it('should switch to SFU for large peer counts', () => {
      const peers = new Map();
      for (let i = 0; i < 8; i++) {
        peers.set(`peer-${i}`, { userId: `user-${i}` });
      }
      const room = {
        topology: 'mesh' as string,
        peers,
        hostPeerId: 'peer-0',
        sfuPeerId: null as string | null,
      };

      (webrtcSignalingService as any).evaluateTopology(room);

      expect(room.topology).toBe('sfu');
    });
  });

  // ===========================================================================
  // shutdown
  // ===========================================================================
  describe('shutdown', () => {
    it('should clear all sessions', () => {
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      // Add a session with no peers so destroySession doesn't iterate
      (webrtcSignalingService as any).sessions.set('session-123', {
        sessionId: 'session-123',
        organizationId: orgId,
        hostPeerId: 'peer-1',
        peers: new Map(),
        topology: 'mesh',
        maxPeers: 10,
        sfuPeerId: null,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        recordingActive: false,
        iceServers: [],
      });

      webrtcSignalingService.shutdown();

      expect((webrtcSignalingService as any).sessions.size).toBe(0);
    });

    it('should set io to null after shutdown', () => {
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      webrtcSignalingService.shutdown();

      expect((webrtcSignalingService as any).io).toBeNull();
    });

    it('should set namespace to null after shutdown', () => {
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      webrtcSignalingService.shutdown();

      expect((webrtcSignalingService as any).namespace).toBeNull();
    });

    it('should disconnect sockets on namespace', () => {
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      webrtcSignalingService.shutdown();

      expect(mockNamespaceInstance.disconnectSockets).toHaveBeenCalledWith(true);
    });
  });

  // ===========================================================================
  // Private: removePeerFromSession
  // ===========================================================================
  describe('removePeerFromSession (private)', () => {
    it('should remove peer from session', () => {
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      const peers = new Map();
      peers.set('peer-1', {
        peerId: 'peer-1',
        userId: 'user-1',
        sessionId: 'session-123',
        socketId: 'socket-1',
        connectionState: 'connected',
        mediaState: { audioEnabled: true, videoEnabled: true, screenSharing: false, dataChannelOpen: false },
        quality: { rtt: 50, packetLoss: 0, jitter: 0.01, bandwidth: 5000 },
        joinedAt: new Date(),
        lastHeartbeat: new Date(),
      });

      (webrtcSignalingService as any).sessions.set('session-123', {
        sessionId: 'session-123',
        organizationId: orgId,
        hostPeerId: 'peer-1',
        peers,
        topology: 'mesh',
        maxPeers: 10,
        sfuPeerId: null,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        recordingActive: false,
        iceServers: [],
      });

      (webrtcSignalingService as any).removePeerFromSession('peer-1', 'session-123', 'test');

      expect(peers.has('peer-1')).toBe(false);
    });

    it('should handle non-existent session gracefully', () => {
      expect(() => {
        (webrtcSignalingService as any).removePeerFromSession('peer-1', 'non-existent', 'test');
      }).not.toThrow();
    });
  });

  // ===========================================================================
  // Private: buildSessionConfig
  // ===========================================================================
  describe('buildSessionConfig (private)', () => {
    it('should build config from session room', () => {
      (webrtcSignalingService as any).sessions.set('session-123', {
        sessionId: 'session-123',
        organizationId: orgId,
        hostPeerId: 'peer-1',
        peers: new Map(),
        topology: 'mesh',
        maxPeers: 10,
        sfuPeerId: null,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        recordingActive: false,
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      const config = (webrtcSignalingService as any).buildSessionConfig('session-123');

      expect(config).toHaveProperty('sessionId', 'session-123');
      expect(config).toHaveProperty('topology', 'mesh');
      expect(config).toHaveProperty('iceServers');
      expect(config).toHaveProperty('maxPeers', 10);
    });

    it('should return safe defaults for non-existent session', () => {
      const config = (webrtcSignalingService as any).buildSessionConfig('non-existent');

      expect(config).toHaveProperty('sessionId', 'non-existent');
      expect(config).toHaveProperty('topology', 'mesh');
      expect(config).toHaveProperty('maxPeers', 12);
    });
  });
});
