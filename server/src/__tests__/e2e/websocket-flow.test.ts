/**
 * E2E Tests - WebSocket Flow
 * Tests real-time WebSocket communication including authentication,
 * organization room broadcasting, and event handling.
 *
 * This suite drives the REAL WebSocketService (server/src/services/websocketService.ts):
 * the production auth middleware, connection handler, ownership-checked subscribe
 * flow, and public broadcast helpers are all exercised here, so regressions in that
 * service are caught rather than masked by a hand-copied reimplementation.
 */

import { jest, describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createServer, Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { prismaMock, createMockUser } from '../mocks/prisma';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
  testConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    jwt: { secret: 'test-secret-key-minimum-32-chars!!!' },
    security: { corsOrigin: '*' },
  },
}));

import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import websocketService from '../../services/websocketService';

const JWT_SECRET = 'test-secret-key-minimum-32-chars!!!';
const TEST_PORT = 9876;

function generateToken(userId = 'user-123', orgId = 'org-123') {
  return jwt.sign(
    { userId, email: 'test@example.com', role: 'Admin', organizationId: orgId },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('E2E: WebSocket Flow', () => {
  let httpServer: HTTPServer;
  let ioServer: SocketIOServer;
  let clientSocket: ClientSocket;
  const mockUser = createMockUser();

  beforeAll((done) => {
    httpServer = createServer();

    // Initialize the actual production WebSocket service against this http server.
    // This wires the real authentication middleware + connection/subscribe handlers.
    websocketService.initialize(httpServer);
    ioServer = websocketService.getIO() as SocketIOServer;

    httpServer.listen(TEST_PORT, done);
  });

  afterAll((done) => {
    if (ioServer) ioServer.close();
    httpServer.close(done);
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  beforeEach(() => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
  });

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  describe('Authentication', () => {
    it('should authenticate with valid JWT token and receive connection confirmation', (done) => {
      const token = generateToken();

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connected', (data: any) => {
        expect(data.message).toBe('Connected to real-time server');
        expect(data.userId).toBe('user-123');
        expect(data.organizationId).toBe('org-123');
        done();
      });

      clientSocket.on('connect_error', (err: Error) => {
        done(err);
      });
    });

    it('should reject connection without token', (done) => {
      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: {},
      });

      clientSocket.on('connect_error', (err: Error) => {
        expect(err.message).toContain('Authentication token required');
        done();
      });

      clientSocket.on('connected', () => {
        done(new Error('Should not have connected'));
      });
    });

    it('should reject connection with invalid token', (done) => {
      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token: 'invalid-token' },
      });

      clientSocket.on('connect_error', (err: Error) => {
        expect(err.message).toContain('Authentication failed');
        done();
      });
    });

    it('should reject connection when user not found', (done) => {
      prismaMock.user.findUnique.mockResolvedValue(null as any);
      const token = generateToken('nonexistent-user');

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connect_error', (err: Error) => {
        expect(err.message).toContain('User not found');
        done();
      });
    });
  });

  // ============================================================================
  // PING / PONG
  // ============================================================================

  describe('Ping/Pong Health Check', () => {
    it('should respond to ping with pong containing timestamp', (done) => {
      const token = generateToken();

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connected', () => {
        clientSocket.emit('ping');
      });

      clientSocket.on('pong', (data: any) => {
        expect(data.timestamp).toBeDefined();
        done();
      });
    });
  });

  // ============================================================================
  // RESOURCE SUBSCRIPTIONS (ownership-checked in the real service)
  // ============================================================================

  describe('Resource Subscriptions', () => {
    it('should subscribe to an owned resource room and receive targeted events', (done) => {
      const token = generateToken();
      // The real handleSubscribe verifies org ownership via prisma.riskItem.findFirst.
      prismaMock.riskItem.findFirst.mockResolvedValue({ id: 'risk-123' } as any);

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connected', () => {
        clientSocket.emit('subscribe', { resource: 'risk', id: 'risk-123' });
      });

      clientSocket.on('subscribed', (data: any) => {
        expect(data.resource).toBe('risk');
        expect(data.id).toBe('risk-123');

        // Verify the ownership check ran against the correct org-scoped delegate.
        expect(prismaMock.riskItem.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'risk-123', organizationId: 'org-123' },
            select: { id: true },
          }),
        );

        // Drive the production broadcastToResource helper to the joined room.
        websocketService.broadcastToResource('risk', 'risk-123', 'risk:updated', {
          action: 'updated',
          risk: { id: 'risk-123', title: 'Updated Risk' },
        });
      });

      clientSocket.on('risk:updated', (data: any) => {
        expect(data.action).toBe('updated');
        expect(data.risk.id).toBe('risk-123');
        done();
      });
    });

    it('should reject subscribe for a resource not owned by the organization', (done) => {
      const token = generateToken();
      // Ownership check returns null -> subscribe must be denied (cross-tenant guard).
      prismaMock.riskItem.findFirst.mockResolvedValue(null as any);

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connected', () => {
        clientSocket.emit('subscribe', { resource: 'risk', id: 'risk-foreign' });
      });

      clientSocket.on('subscribe:error', (data: any) => {
        expect(data.resource).toBe('risk');
        expect(data.id).toBe('risk-foreign');
        expect(data.reason).toBe('not_found');
        done();
      });

      clientSocket.on('subscribed', () => {
        done(new Error('Should not have subscribed to a non-owned resource'));
      });
    });

    it('should reject subscribe for an unknown resource type', (done) => {
      const token = generateToken();

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connected', () => {
        clientSocket.emit('subscribe', { resource: 'unknownThing', id: 'x' });
      });

      clientSocket.on('subscribe:error', (data: any) => {
        expect(data.reason).toBe('unknown_resource');
        done();
      });

      clientSocket.on('subscribed', () => {
        done(new Error('Should not have subscribed to an unknown resource type'));
      });
    });
  });

  // ============================================================================
  // SERVER-SIDE BROADCASTING (real WebSocketService public methods)
  // ============================================================================

  describe('Server-Side Event Broadcasting', () => {
    it('should receive organization broadcast via broadcastIntegrationSync', (done) => {
      const token = generateToken();

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connected', () => {
        websocketService.broadcastIntegrationSync('org-123', 'slack', 'completed');
      });

      clientSocket.on('integration:sync', (data: any) => {
        expect(data.provider).toBe('slack');
        expect(data.status).toBe('completed');
        done();
      });
    });

    it('should receive user-specific notification via sendNotification', (done) => {
      const token = generateToken();

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connected', () => {
        websocketService.sendNotification('user-123', {
          title: 'Task Completed',
          message: 'Your risk assessment has been reviewed',
          type: 'success',
        });
      });

      clientSocket.on('notification', (data: any) => {
        expect(data.title).toBe('Task Completed');
        expect(data.type).toBe('success');
        done();
      });
    });

    it('should receive framework update broadcast via broadcastFrameworkUpdate', (done) => {
      const token = generateToken();

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connected', () => {
        websocketService.broadcastFrameworkUpdate('org-123', 'created', {
          id: 'fw-1',
          name: 'SOC 2',
        });
      });

      clientSocket.on('framework:updated', (data: any) => {
        expect(data.action).toBe('created');
        expect(data.framework.name).toBe('SOC 2');
        done();
      });
    });

    it('should receive AI task status updates via broadcastAITaskStatus', (done) => {
      const token = generateToken();

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connected', () => {
        websocketService.broadcastAITaskStatus('org-123', 'task-1', 'completed', {
          result: 'Risk assessment complete',
        });
      });

      clientSocket.on('ai:task:status', (data: any) => {
        expect(data.taskId).toBe('task-1');
        expect(data.status).toBe('completed');
        done();
      });
    });
  });

  // ============================================================================
  // PRESENCE TRACKING (real connectedUsers map)
  // ============================================================================

  describe('Presence Tracking', () => {
    it('should track the connected user in the organization presence map', (done) => {
      const token = generateToken();

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connected', () => {
        // Allow the connection handler to register the socket before asserting.
        setTimeout(() => {
          expect(websocketService.getConnectedUsersCount('org-123')).toBeGreaterThanOrEqual(1);
          expect(websocketService.isUserOnline('user-123')).toBe(true);
          done();
        }, 20);
      });

      clientSocket.on('connect_error', (err: Error) => done(err));
    });
  });
});
