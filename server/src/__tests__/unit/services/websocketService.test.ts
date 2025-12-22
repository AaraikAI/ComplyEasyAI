/**
 * WebSocket Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Server as HTTPServer } from 'http';
import { prismaMock } from '../../mocks/prisma';

// Mock Socket.IO
const mockEmit = jest.fn();
const mockOn = jest.fn();
const mockUse = jest.fn();
const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
const mockSockets = {
  emit: mockEmit,
  to: mockTo,
};

jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    use: mockUse,
    on: mockOn,
    to: mockTo,
    sockets: mockSockets,
  })),
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockReturnValue({
    userId: 'user-123',
    email: 'test@example.com',
    role: 'admin',
    organizationId: 'org-123',
  }),
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    security: {
      corsOrigin: 'http://localhost:3000',
    },
    jwt: {
      secret: 'test-secret',
    },
  },
}));

import websocketService from '../../../services/websocketService';

describe('WebSocketService', () => {
  let mockHttpServer: Partial<HTTPServer>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpServer = {};
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      role: 'admin',
      organizationId: 'org-123',
    } as any);
  });

  describe('initialize()', () => {
    it('should initialize WebSocket server', () => {
      websocketService.initialize(mockHttpServer as HTTPServer);

      expect(mockOn).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('broadcastToOrganization()', () => {
    it('should broadcast message to organization', () => {
      websocketService.initialize(mockHttpServer as HTTPServer);
      websocketService.broadcastToOrganization('org-123', 'test-event', { data: 'test' });

      expect(mockTo).toHaveBeenCalledWith('org-org-123');
    });
  });

  describe('sendToUser()', () => {
    it('should send message to specific user', () => {
      websocketService.initialize(mockHttpServer as HTTPServer);
      websocketService.sendToUser('user-123', 'test-event', { data: 'test' });

      expect(mockTo).toHaveBeenCalled();
    });
  });
});

