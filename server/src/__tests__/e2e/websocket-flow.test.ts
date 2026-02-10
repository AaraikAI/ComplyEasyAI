/**
 * E2E Tests - WebSocket Flow
 * Tests real-time WebSocket communication including authentication,
 * organization room broadcasting, and event handling.
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

    ioServer = new SocketIOServer(httpServer, {
      cors: { origin: '*', credentials: true },
      path: '/ws',
      transports: ['websocket', 'polling'],
    });

    // Setup authentication middleware (mirrors WebSocketService)
    ioServer.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
          organizationId: string;
        };

        const user = await prismaMock.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, role: true, organizationId: true },
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        (socket as any).userId = user.id;
        (socket as any).organizationId = user.organizationId;
        (socket as any).userEmail = user.email;
        (socket as any).userRole = user.role;

        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    // Setup connection handler (mirrors WebSocketService)
    ioServer.on('connection', (socket) => {
      const userId = (socket as any).userId;
      const organizationId = (socket as any).organizationId;

      if (!userId || !organizationId) {
        socket.disconnect();
        return;
      }

      // Join organization room
      socket.join(`org:${organizationId}`);
      socket.join(`user:${userId}`);

      // Send connection confirmation
      socket.emit('connected', {
        message: 'Connected to real-time server',
        userId,
        organizationId,
      });

      // Ping/pong
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date() });
      });

      // Resource subscription
      socket.on('subscribe', (data: { resource: string; id: string }) => {
        socket.join(`${data.resource}:${data.id}`);
        socket.emit('subscribed', { resource: data.resource, id: data.id });
      });

      socket.on('unsubscribe', (data: { resource: string; id: string }) => {
        socket.leave(`${data.resource}:${data.id}`);
      });
    });

    httpServer.listen(TEST_PORT, done);
  });

  afterAll((done) => {
    ioServer.close();
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
  // RESOURCE SUBSCRIPTIONS
  // ============================================================================

  describe('Resource Subscriptions', () => {
    it('should subscribe to resource room and receive targeted events', (done) => {
      const token = generateToken();

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

        // Now emit from server to the room
        ioServer.to('risk:risk-123').emit('risk:updated', {
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
  });

  // ============================================================================
  // SERVER-SIDE BROADCASTING
  // ============================================================================

  describe('Server-Side Event Broadcasting', () => {
    it('should receive organization broadcast from server', (done) => {
      const token = generateToken();

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connected', () => {
        // Simulate server-side broadcast
        ioServer.to('org:org-123').emit('integration:sync', {
          provider: 'slack',
          status: 'completed',
          timestamp: new Date(),
        });
      });

      clientSocket.on('integration:sync', (data: any) => {
        expect(data.provider).toBe('slack');
        expect(data.status).toBe('completed');
        done();
      });
    });

    it('should receive user-specific notification', (done) => {
      const token = generateToken();

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connected', () => {
        // Send notification to specific user
        ioServer.to('user:user-123').emit('notification', {
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

    it('should receive framework update broadcast', (done) => {
      const token = generateToken();

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connected', () => {
        ioServer.to('org:org-123').emit('framework:updated', {
          action: 'created',
          framework: { id: 'fw-1', name: 'SOC 2' },
          timestamp: new Date(),
        });
      });

      clientSocket.on('framework:updated', (data: any) => {
        expect(data.action).toBe('created');
        expect(data.framework.name).toBe('SOC 2');
        done();
      });
    });

    it('should receive AI task status updates', (done) => {
      const token = generateToken();

      clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connected', () => {
        ioServer.to('org:org-123').emit('ai:task:status', {
          taskId: 'task-1',
          status: 'completed',
          data: { result: 'Risk assessment complete' },
          timestamp: new Date(),
        });
      });

      clientSocket.on('ai:task:status', (data: any) => {
        expect(data.taskId).toBe('task-1');
        expect(data.status).toBe('completed');
        done();
      });
    });
  });
});
