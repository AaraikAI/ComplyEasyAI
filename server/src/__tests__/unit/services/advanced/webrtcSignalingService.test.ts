/**
 * WebRTC Signaling Service Unit Tests
 *
 * Tests for WebRTC signaling server including Socket.io integration,
 * ICE/STUN/TURN configuration, session management, peer connections,
 * mesh/SFU topology, and VR collaborative review sessions.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';
import { EventEmitter } from 'events';

// Mock Socket.io
class MockSocket extends EventEmitter {
  id = 'socket-123';
  handshake = {
    auth: { token: 'test-token', sessionId: 'session-123' },
    query: { userId: 'user-123', organizationId: 'org-123' },
  };
  rooms = new Set<string>();
  data: Record<string, any> = {};

  join = jest.fn((room: string) => {
    this.rooms.add(room);
    return Promise.resolve();
  });
  leave = jest.fn((room: string) => {
    this.rooms.delete(room);
    return Promise.resolve();
  });
  to = jest.fn().mockReturnThis();
  emit = jest.fn();
  broadcast = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };
  disconnect = jest.fn();
}

class MockServer extends EventEmitter {
  sockets = {
    sockets: new Map<string, MockSocket>(),
    adapter: {
      rooms: new Map<string, Set<string>>(),
    },
  };
  to = jest.fn().mockReturnThis();
  in = jest.fn().mockReturnThis();
  emit = jest.fn();
  use = jest.fn();
  on = jest.fn().mockImplementation((event: string, handler: (socket: MockSocket) => void) => {
    if (event === 'connection') {
      // Store handler for testing
      (this as any).connectionHandler = handler;
    }
  });
  close = jest.fn();
}

const mockSocketIOServer = new MockServer();

jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => mockSocketIOServer),
}));

// Mock HTTP server
const mockHttpServer = {
  on: jest.fn(),
  close: jest.fn(),
};

// Extend prismaMock for WebRTC-specific models
const webrtcPrismaMock = {
  ...prismaMock,
  vrSession: {
    findUnique: jest.fn().mockResolvedValue({
      id: 'session-123',
      name: 'Test VR Session',
      organizationId: 'org-123',
      createdBy: 'user-123',
      status: 'active',
      maxParticipants: 10,
      settings: JSON.stringify({ topology: 'mesh', recordingEnabled: true }),
    }) as jest.Mock<any>,
    findMany: jest.fn().mockResolvedValue([]) as jest.Mock<any>,
    create: jest.fn() as jest.Mock<any>,
    update: jest.fn() as jest.Mock<any>,
    delete: jest.fn() as jest.Mock<any>,
  },
  vrSessionParticipant: {
    findMany: jest.fn().mockResolvedValue([
      { id: 'part-1', sessionId: 'session-123', oderId: 'user-123', socketId: 'socket-123', joinedAt: new Date() },
    ]) as jest.Mock<any>,
    create: jest.fn() as jest.Mock<any>,
    update: jest.fn() as jest.Mock<any>,
    delete: jest.fn() as jest.Mock<any>,
    deleteMany: jest.fn() as jest.Mock<any>,
  },
  iceServer: {
    findMany: jest.fn().mockResolvedValue([
      { url: 'stun:stun.example.com:19302', username: null, credential: null },
      { url: 'turn:turn.example.com:3478', username: 'user', credential: 'pass' },
    ]) as jest.Mock<any>,
  },
};

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: webrtcPrismaMock,
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
  let mockSocket: MockSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket = new MockSocket();
    mockSocketIOServer.sockets.sockets.set('socket-123', mockSocket);

    // Reset internal state
    (webrtcSignalingService as any).isInitialized = false;
    (webrtcSignalingService as any).sessions = new Map();
    (webrtcSignalingService as any).socketToSession = new Map();
    (webrtcSignalingService as any).peerConnections = new Map();
  });

  // ===========================================================================
  // attachToServer
  // ===========================================================================
  describe('attachToServer', () => {
    it('should attach to HTTP server', () => {
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      expect((webrtcSignalingService as any).io).toBeDefined();
    });

    it('should configure CORS options', () => {
      const Server = require('socket.io').Server;

      webrtcSignalingService.attachToServer(mockHttpServer as any, {
        cors: {
          origin: 'https://example.com',
          credentials: true,
        },
      });

      expect(Server).toHaveBeenCalledWith(
        mockHttpServer,
        expect.objectContaining({
          cors: expect.objectContaining({
            origin: 'https://example.com',
          }),
        })
      );
    });

    it('should set up authentication middleware', () => {
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      expect(mockSocketIOServer.use).toHaveBeenCalled();
    });

    it('should register connection handler', () => {
      webrtcSignalingService.attachToServer(mockHttpServer as any);

      expect(mockSocketIOServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  // ===========================================================================
  // Session Management
  // ===========================================================================
  describe('createSession', () => {
    beforeEach(() => {
      (webrtcSignalingService as any).io = mockSocketIOServer;
      (webrtcSignalingService as any).isInitialized = true;
    });

    it('should create a new session', async () => {
      const session = await webrtcSignalingService.createSession({
        name: 'Test Session',
        organizationId: orgId,
        createdBy: 'user-123',
        maxParticipants: 10,
      });

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('name', 'Test Session');
    });

    it('should persist session to database', async () => {
      await webrtcSignalingService.createSession({
        name: 'Test Session',
        organizationId: orgId,
        createdBy: 'user-123',
      });

      expect(webrtcPrismaMock.vrSession.create).toHaveBeenCalled();
    });

    it('should store session in memory', async () => {
      const session = await webrtcSignalingService.createSession({
        name: 'Test Session',
        organizationId: orgId,
        createdBy: 'user-123',
      });

      const stored = (webrtcSignalingService as any).sessions.get(session.id);
      expect(stored).toBeDefined();
    });

    it('should set default topology to mesh', async () => {
      const session = await webrtcSignalingService.createSession({
        name: 'Test Session',
        organizationId: orgId,
        createdBy: 'user-123',
      });

      expect(session.settings.topology).toBe('mesh');
    });

    it('should support SFU topology', async () => {
      const session = await webrtcSignalingService.createSession({
        name: 'Test Session',
        organizationId: orgId,
        createdBy: 'user-123',
        settings: { topology: 'sfu' },
      });

      expect(session.settings.topology).toBe('sfu');
    });
  });

  describe('destroySession', () => {
    beforeEach(() => {
      (webrtcSignalingService as any).io = mockSocketIOServer;
      (webrtcSignalingService as any).isInitialized = true;
      (webrtcSignalingService as any).sessions.set('session-123', {
        id: 'session-123',
        participants: new Map([['socket-123', { userId: 'user-123' }]]),
      });
    });

    it('should destroy session and disconnect participants', async () => {
      await webrtcSignalingService.destroySession('session-123');

      expect((webrtcSignalingService as any).sessions.has('session-123')).toBe(false);
    });

    it('should notify participants of session end', async () => {
      await webrtcSignalingService.destroySession('session-123');

      expect(mockSocketIOServer.to).toHaveBeenCalledWith('session-123');
      expect(mockSocketIOServer.emit).toHaveBeenCalledWith(
        'session:ended',
        expect.any(Object)
      );
    });

    it('should update session status in database', async () => {
      await webrtcSignalingService.destroySession('session-123');

      expect(webrtcPrismaMock.vrSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: expect.objectContaining({ status: 'ended' }),
      });
    });

    it('should handle non-existent session gracefully', async () => {
      await expect(
        webrtcSignalingService.destroySession('non-existent')
      ).resolves.not.toThrow();
    });
  });

  // ===========================================================================
  // Peer Connection Handling
  // ===========================================================================
  describe('handlePeerConnection', () => {
    beforeEach(() => {
      (webrtcSignalingService as any).io = mockSocketIOServer;
      (webrtcSignalingService as any).isInitialized = true;
      (webrtcSignalingService as any).sessions.set('session-123', {
        id: 'session-123',
        participants: new Map(),
        settings: { topology: 'mesh' },
      });
    });

    it('should handle peer join', () => {
      (webrtcSignalingService as any).handlePeerJoin(mockSocket, 'session-123');

      expect(mockSocket.join).toHaveBeenCalledWith('session-123');
    });

    it('should notify existing peers of new participant', () => {
      const existingSocket = new MockSocket();
      existingSocket.id = 'existing-socket';
      (webrtcSignalingService as any).sessions.get('session-123').participants.set(
        'existing-socket',
        { userId: 'user-456' }
      );
      mockSocketIOServer.sockets.sockets.set('existing-socket', existingSocket);

      (webrtcSignalingService as any).handlePeerJoin(mockSocket, 'session-123');

      expect(mockSocket.broadcast.to).toHaveBeenCalledWith('session-123');
    });

    it('should enforce max participants limit', async () => {
      const session = (webrtcSignalingService as any).sessions.get('session-123');
      session.maxParticipants = 2;
      session.participants.set('socket-1', {});
      session.participants.set('socket-2', {});

      const result = await (webrtcSignalingService as any).handlePeerJoin(mockSocket, 'session-123');

      expect(result.success).toBe(false);
      expect(result.reason).toContain('full');
    });

    it('should handle peer leave', () => {
      const session = (webrtcSignalingService as any).sessions.get('session-123');
      session.participants.set('socket-123', { userId: 'user-123' });

      (webrtcSignalingService as any).handlePeerLeave(mockSocket, 'session-123');

      expect(session.participants.has('socket-123')).toBe(false);
      expect(mockSocket.leave).toHaveBeenCalledWith('session-123');
    });
  });

  // ===========================================================================
  // Signaling Messages
  // ===========================================================================
  describe('Signaling Messages', () => {
    beforeEach(() => {
      (webrtcSignalingService as any).io = mockSocketIOServer;
      (webrtcSignalingService as any).isInitialized = true;
      (webrtcSignalingService as any).sessions.set('session-123', {
        id: 'session-123',
        participants: new Map([
          ['socket-123', { userId: 'user-123' }],
          ['socket-456', { userId: 'user-456' }],
        ]),
        settings: { topology: 'mesh' },
      });
      (webrtcSignalingService as any).socketToSession.set('socket-123', 'session-123');
    });

    it('should relay offer to target peer', () => {
      const targetSocket = new MockSocket();
      targetSocket.id = 'socket-456';
      mockSocketIOServer.sockets.sockets.set('socket-456', targetSocket);

      (webrtcSignalingService as any).handleOffer(mockSocket, {
        targetId: 'socket-456',
        sdp: 'offer-sdp',
      });

      expect(targetSocket.emit).toHaveBeenCalledWith(
        'signal:offer',
        expect.objectContaining({
          fromId: 'socket-123',
          sdp: 'offer-sdp',
        })
      );
    });

    it('should relay answer to target peer', () => {
      const targetSocket = new MockSocket();
      targetSocket.id = 'socket-456';
      mockSocketIOServer.sockets.sockets.set('socket-456', targetSocket);

      (webrtcSignalingService as any).handleAnswer(mockSocket, {
        targetId: 'socket-456',
        sdp: 'answer-sdp',
      });

      expect(targetSocket.emit).toHaveBeenCalledWith(
        'signal:answer',
        expect.objectContaining({
          fromId: 'socket-123',
          sdp: 'answer-sdp',
        })
      );
    });

    it('should relay ICE candidates', () => {
      const targetSocket = new MockSocket();
      targetSocket.id = 'socket-456';
      mockSocketIOServer.sockets.sockets.set('socket-456', targetSocket);

      const iceCandidate = {
        candidate: 'candidate:...',
        sdpMid: '0',
        sdpMLineIndex: 0,
      };

      (webrtcSignalingService as any).handleIceCandidate(mockSocket, {
        targetId: 'socket-456',
        candidate: iceCandidate,
      });

      expect(targetSocket.emit).toHaveBeenCalledWith(
        'signal:ice-candidate',
        expect.objectContaining({
          fromId: 'socket-123',
          candidate: iceCandidate,
        })
      );
    });

    it('should handle missing target peer gracefully', () => {
      (webrtcSignalingService as any).handleOffer(mockSocket, {
        targetId: 'non-existent',
        sdp: 'offer-sdp',
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'signal:error',
        expect.objectContaining({
          reason: expect.stringContaining('not found'),
        })
      );
    });
  });

  // ===========================================================================
  // ICE Server Configuration
  // ===========================================================================
  describe('getICEServers', () => {
    it('should return ICE server configuration', async () => {
      const servers = await webrtcSignalingService.getICEServers(orgId);

      expect(Array.isArray(servers)).toBe(true);
      expect(servers.length).toBeGreaterThan(0);
    });

    it('should include STUN servers', async () => {
      const servers = await webrtcSignalingService.getICEServers(orgId);

      const stunServer = servers.find((s: any) => s.urls.includes('stun:'));
      expect(stunServer).toBeDefined();
    });

    it('should include TURN servers with credentials', async () => {
      const servers = await webrtcSignalingService.getICEServers(orgId);

      const turnServer = servers.find((s: any) => s.urls.includes('turn:'));
      expect(turnServer).toBeDefined();
      expect(turnServer.username).toBeDefined();
      expect(turnServer.credential).toBeDefined();
    });

    it('should generate time-limited TURN credentials', async () => {
      const servers = await webrtcSignalingService.getICEServers(orgId, {
        turnCredentialTTL: 3600,
      });

      const turnServer = servers.find((s: any) => s.urls.includes('turn:'));
      expect(turnServer).toHaveProperty('username');
      expect(turnServer).toHaveProperty('credential');
    });
  });

  // ===========================================================================
  // Session Participants
  // ===========================================================================
  describe('getSessionPeers', () => {
    beforeEach(() => {
      (webrtcSignalingService as any).sessions.set('session-123', {
        id: 'session-123',
        participants: new Map([
          ['socket-1', { oderId: 'user-1', displayName: 'User 1', joinedAt: new Date() }],
          ['socket-2', { oderId: 'user-2', displayName: 'User 2', joinedAt: new Date() }],
        ]),
      });
    });

    it('should return list of peers in session', () => {
      const peers = webrtcSignalingService.getSessionPeers('session-123');

      expect(peers.length).toBe(2);
      expect(peers[0]).toHaveProperty('socketId');
      expect(peers[0]).toHaveProperty('oderId');
    });

    it('should exclude requesting peer when specified', () => {
      const peers = webrtcSignalingService.getSessionPeers('session-123', 'socket-1');

      expect(peers.length).toBe(1);
      expect(peers[0].socketId).toBe('socket-2');
    });

    it('should return empty array for non-existent session', () => {
      const peers = webrtcSignalingService.getSessionPeers('non-existent');

      expect(peers).toEqual([]);
    });
  });

  // ===========================================================================
  // VR Collaborative Features
  // ===========================================================================
  describe('VR Collaborative Features', () => {
    beforeEach(() => {
      (webrtcSignalingService as any).io = mockSocketIOServer;
      (webrtcSignalingService as any).sessions.set('session-123', {
        id: 'session-123',
        participants: new Map([['socket-123', { userId: 'user-123' }]]),
        settings: { topology: 'mesh', vrEnabled: true },
        sharedState: {},
      });
    });

    it('should sync VR state across participants', () => {
      const vrState = {
        position: { x: 0, y: 1.6, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        controllerLeft: { position: { x: -0.3, y: 1.2, z: -0.3 } },
        controllerRight: { position: { x: 0.3, y: 1.2, z: -0.3 } },
      };

      (webrtcSignalingService as any).handleVRStateUpdate(mockSocket, vrState);

      expect(mockSocket.broadcast.to).toHaveBeenCalledWith('session-123');
    });

    it('should broadcast annotations', () => {
      const annotation = {
        type: 'highlight',
        position: { x: 1, y: 1.5, z: -2 },
        color: '#ff0000',
        authorId: 'user-123',
      };

      (webrtcSignalingService as any).handleAnnotation(mockSocket, 'session-123', annotation);

      expect(mockSocketIOServer.to).toHaveBeenCalledWith('session-123');
    });

    it('should handle document pointer sharing', () => {
      const pointer = {
        documentId: 'doc-123',
        page: 5,
        position: { x: 0.5, y: 0.3 },
      };

      (webrtcSignalingService as any).handlePointerShare(mockSocket, pointer);

      expect(mockSocket.broadcast.emit).toHaveBeenCalled();
    });

    it('should manage focus/attention indicators', () => {
      (webrtcSignalingService as any).handleFocusUpdate(mockSocket, {
        sessionId: 'session-123',
        focusTarget: { type: 'document', id: 'doc-123', page: 3 },
      });

      // Should broadcast focus to other participants
      expect(mockSocket.broadcast.to).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Recording Integration
  // ===========================================================================
  describe('Recording', () => {
    beforeEach(() => {
      (webrtcSignalingService as any).io = mockSocketIOServer;
      (webrtcSignalingService as any).sessions.set('session-123', {
        id: 'session-123',
        participants: new Map(),
        settings: { recordingEnabled: true },
        recording: null,
      });
    });

    it('should start recording session', async () => {
      const result = await webrtcSignalingService.startRecording('session-123');

      expect(result).toHaveProperty('recordingId');
      expect(result.status).toBe('recording');
    });

    it('should stop recording session', async () => {
      const session = (webrtcSignalingService as any).sessions.get('session-123');
      session.recording = { id: 'rec-123', startedAt: new Date() };

      const result = await webrtcSignalingService.stopRecording('session-123');

      expect(result.status).toBe('stopped');
    });

    it('should notify participants when recording starts', async () => {
      await webrtcSignalingService.startRecording('session-123');

      expect(mockSocketIOServer.to).toHaveBeenCalledWith('session-123');
      expect(mockSocketIOServer.emit).toHaveBeenCalledWith(
        'recording:started',
        expect.any(Object)
      );
    });
  });

  // ===========================================================================
  // Connection Quality Monitoring
  // ===========================================================================
  describe('Connection Quality', () => {
    beforeEach(() => {
      (webrtcSignalingService as any).io = mockSocketIOServer;
      (webrtcSignalingService as any).connectionStats = new Map();
    });

    it('should track connection statistics', () => {
      const stats = {
        bytesReceived: 1000000,
        bytesSent: 500000,
        packetsLost: 10,
        jitter: 0.02,
        roundTripTime: 50,
      };

      (webrtcSignalingService as any).handleConnectionStats(mockSocket, stats);

      const stored = (webrtcSignalingService as any).connectionStats.get('socket-123');
      expect(stored).toBeDefined();
      expect(stored.roundTripTime).toBe(50);
    });

    it('should detect poor connection quality', () => {
      const poorStats = {
        packetsLost: 100,
        jitter: 0.2,
        roundTripTime: 500,
      };

      const quality = (webrtcSignalingService as any).assessConnectionQuality(poorStats);

      expect(quality).toBe('poor');
    });

    it('should suggest bandwidth reduction for poor connections', () => {
      const poorStats = {
        packetsLost: 100,
        jitter: 0.2,
        roundTripTime: 500,
      };

      (webrtcSignalingService as any).handleConnectionStats(mockSocket, poorStats);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'connection:quality-warning',
        expect.objectContaining({
          suggestion: expect.stringContaining('reduce'),
        })
      );
    });
  });

  // ===========================================================================
  // Authentication & Authorization
  // ===========================================================================
  describe('Authentication', () => {
    it('should validate socket authentication token', async () => {
      const jwt = require('jsonwebtoken');

      const isValid = await (webrtcSignalingService as any).validateSocketAuth(mockSocket);

      expect(jwt.verify).toHaveBeenCalledWith('test-token', expect.any(String));
      expect(isValid).toBe(true);
    });

    it('should reject invalid tokens', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const isValid = await (webrtcSignalingService as any).validateSocketAuth(mockSocket);

      expect(isValid).toBe(false);
    });

    it('should verify session access permissions', async () => {
      const hasAccess = await (webrtcSignalingService as any).checkSessionAccess(
        'user-123',
        'session-123',
        orgId
      );

      expect(hasAccess).toBe(true);
    });

    it('should deny access to unauthorized users', async () => {
      webrtcPrismaMock.vrSession.findUnique.mockResolvedValueOnce({
        ...webrtcPrismaMock.vrSession.findUnique(),
        organizationId: 'different-org',
      });

      const hasAccess = await (webrtcSignalingService as any).checkSessionAccess(
        'user-123',
        'session-123',
        'wrong-org'
      );

      expect(hasAccess).toBe(false);
    });
  });

  // ===========================================================================
  // Error Handling & Cleanup
  // ===========================================================================
  describe('Error Handling', () => {
    beforeEach(() => {
      (webrtcSignalingService as any).io = mockSocketIOServer;
      (webrtcSignalingService as any).sessions.set('session-123', {
        id: 'session-123',
        participants: new Map([['socket-123', { userId: 'user-123' }]]),
      });
      (webrtcSignalingService as any).socketToSession.set('socket-123', 'session-123');
    });

    it('should handle socket disconnect', () => {
      (webrtcSignalingService as any).handleDisconnect(mockSocket);

      const session = (webrtcSignalingService as any).sessions.get('session-123');
      expect(session.participants.has('socket-123')).toBe(false);
    });

    it('should notify other participants on disconnect', () => {
      (webrtcSignalingService as any).handleDisconnect(mockSocket);

      expect(mockSocketIOServer.to).toHaveBeenCalledWith('session-123');
      expect(mockSocketIOServer.emit).toHaveBeenCalledWith(
        'peer:left',
        expect.objectContaining({
          socketId: 'socket-123',
        })
      );
    });

    it('should handle errors in message handlers', () => {
      const badHandler = () => {
        throw new Error('Handler error');
      };

      // Should not throw, but log error
      expect(() => {
        (webrtcSignalingService as any).safeHandler(badHandler)();
      }).not.toThrow();
    });

    it('should clean up orphaned sessions', async () => {
      const orphanedSession = {
        id: 'orphaned-session',
        participants: new Map(),
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      };
      (webrtcSignalingService as any).sessions.set('orphaned-session', orphanedSession);

      await (webrtcSignalingService as any).cleanupOrphanedSessions();

      expect((webrtcSignalingService as any).sessions.has('orphaned-session')).toBe(false);
    });
  });

  // ===========================================================================
  // Topology Support
  // ===========================================================================
  describe('Topology Support', () => {
    it('should support mesh topology for small groups', () => {
      const topology = (webrtcSignalingService as any).selectTopology(4);

      expect(topology).toBe('mesh');
    });

    it('should suggest SFU for larger groups', () => {
      const topology = (webrtcSignalingService as any).selectTopology(10);

      expect(topology).toBe('sfu');
    });

    it('should configure mesh connections correctly', () => {
      const participants = ['socket-1', 'socket-2', 'socket-3'];
      const connections = (webrtcSignalingService as any).getMeshConnections(participants);

      // Each participant should connect to all others
      expect(connections.length).toBe(3); // 3 unique pairs
    });
  });

  // ===========================================================================
  // Shutdown
  // ===========================================================================
  describe('shutdown', () => {
    it('should gracefully close all connections', async () => {
      (webrtcSignalingService as any).io = mockSocketIOServer;
      (webrtcSignalingService as any).sessions.set('session-123', {
        id: 'session-123',
        participants: new Map([['socket-123', {}]]),
      });

      await webrtcSignalingService.shutdown();

      expect(mockSocketIOServer.close).toHaveBeenCalled();
    });

    it('should notify all participants of shutdown', async () => {
      (webrtcSignalingService as any).io = mockSocketIOServer;

      await webrtcSignalingService.shutdown();

      expect(mockSocketIOServer.emit).toHaveBeenCalledWith(
        'server:shutdown',
        expect.any(Object)
      );
    });
  });
});
