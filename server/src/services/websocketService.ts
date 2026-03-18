/**
 * WebSocket Service
 * Handles real-time communication using Socket.IO
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../config/logger';
import prisma from '../config/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
  userEmail?: string;
  userRole?: string;
}

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, Set<string>> = new Map(); // organizationId -> Set of socketIds

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.security.corsOrigin,
        credentials: true,
      },
      path: '/ws',
      transports: ['websocket', 'polling'],
    });

    // Authentication middleware
    this.io.use(this.authenticateSocket.bind(this));

    // Connection handler
    this.io.on('connection', this.handleConnection.bind(this));

    logger.info('WebSocket server initialized');
  }

  /**
   * Authenticate socket connection
   */
  private async authenticateSocket(
    socket: AuthenticatedSocket,
    next: (err?: Error) => void
  ): Promise<void> {
    try {
      let token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      // Fall back to httpOnly cookie (same as REST auth middleware)
      if (!token && socket.handshake.headers.cookie) {
        const match = socket.handshake.headers.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
        if (match) token = match[1];
      }

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: string;
        email: string;
        role: string;
        organizationId: string;
      };

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          organizationId: true,
        },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user info to socket
      socket.userId = user.id;
      socket.organizationId = user.organizationId;
      socket.userEmail = user.email;
      socket.userRole = user.role;

      next();
    } catch (error) {
      logger.error('WebSocket authentication error', error);
      next(new Error('Authentication failed'));
    }
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const { userId, organizationId, userEmail } = socket;

    if (!userId || !organizationId) {
      socket.disconnect();
      return;
    }

    logger.info(`WebSocket connected: ${userEmail} (${socket.id})`);

    // Join organization room
    socket.join(`org:${organizationId}`);

    // Join user room (for direct messages)
    socket.join(`user:${userId}`);

    // Track connected users
    if (!this.connectedUsers.has(organizationId)) {
      this.connectedUsers.set(organizationId, new Set());
    }
    this.connectedUsers.get(organizationId)!.add(socket.id);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to real-time server',
      userId,
      organizationId,
    });

    // Notify organization about new connection
    this.broadcastToOrganization(organizationId, 'user:online', {
      userId,
      email: userEmail,
    }, socket.id);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Handle custom events
    this.setupEventHandlers(socket);
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socket: AuthenticatedSocket): void {
    const { userId, organizationId, userEmail } = socket;

    if (organizationId) {
      const orgSockets = this.connectedUsers.get(organizationId);
      if (orgSockets) {
        orgSockets.delete(socket.id);
        if (orgSockets.size === 0) {
          this.connectedUsers.delete(organizationId);
        }
      }

      // Notify organization about disconnection
      this.broadcastToOrganization(organizationId, 'user:offline', {
        userId,
        email: userEmail,
      });
    }

    logger.info(`WebSocket disconnected: ${userEmail} (${socket.id})`);
  }

  /**
   * Setup custom event handlers
   */
  private setupEventHandlers(socket: AuthenticatedSocket): void {
    // Ping/pong for connection health check
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // Subscribe to specific resources
    socket.on('subscribe', (data: { resource: string; id: string }) => {
      const room = `${data.resource}:${data.id}`;
      socket.join(room);
      logger.debug(`Socket ${socket.id} subscribed to ${room}`);
    });

    // Unsubscribe from resources
    socket.on('unsubscribe', (data: { resource: string; id: string }) => {
      const room = `${data.resource}:${data.id}`;
      socket.leave(room);
      logger.debug(`Socket ${socket.id} unsubscribed from ${room}`);
    });
  }

  /**
   * Broadcast message to entire organization
   */
  broadcastToOrganization(
    organizationId: string,
    event: string,
    data: any,
    excludeSocketId?: string
  ): void {
    if (!this.io) return;

    const room = `org:${organizationId}`;

    if (excludeSocketId) {
      this.io.to(room).except(excludeSocketId).emit(event, {
        ...data,
        timestamp: new Date(),
      });
    } else {
      this.io.to(room).emit(event, {
        ...data,
        timestamp: new Date(),
      });
    }

    logger.debug(`Broadcasted ${event} to organization ${organizationId}`);
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date(),
    });

    logger.debug(`Sent ${event} to user ${userId}`);
  }

  /**
   * Broadcast to specific resource
   */
  broadcastToResource(resource: string, id: string, event: string, data: any): void {
    if (!this.io) return;

    const room = `${resource}:${id}`;
    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date(),
    });

    logger.debug(`Broadcasted ${event} to ${room}`);
  }

  /**
   * Broadcast risk update
   */
  broadcastRiskUpdate(organizationId: string, action: 'created' | 'updated' | 'deleted', risk: any): void {
    this.broadcastToOrganization(organizationId, 'risk:updated', {
      action,
      risk,
    });
  }

  /**
   * Broadcast compliance framework update
   */
  broadcastFrameworkUpdate(
    organizationId: string,
    action: 'created' | 'updated' | 'deleted',
    framework: any
  ): void {
    this.broadcastToOrganization(organizationId, 'framework:updated', {
      action,
      framework,
    });
  }

  /**
   * Broadcast AI task status
   */
  broadcastAITaskStatus(
    organizationId: string,
    taskId: string,
    status: 'started' | 'processing' | 'completed' | 'failed',
    data?: any
  ): void {
    this.broadcastToOrganization(organizationId, 'ai:task:status', {
      taskId,
      status,
      data,
    });
  }

  /**
   * Broadcast integration sync status
   */
  broadcastIntegrationSync(
    organizationId: string,
    provider: string,
    status: 'started' | 'completed' | 'failed',
    data?: any
  ): void {
    this.broadcastToOrganization(organizationId, 'integration:sync', {
      provider,
      status,
      data,
    });
  }

  /**
   * Broadcast audit log event
   */
  broadcastAuditLog(organizationId: string, log: any): void {
    this.broadcastToOrganization(organizationId, 'audit:log', {
      log,
    });
  }

  /**
   * Send notification to user
   */
  sendNotification(userId: string, notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
  }): void {
    this.sendToUser(userId, 'notification', notification);
  }

  /**
   * Get connected users count for organization
   */
  getConnectedUsersCount(organizationId: string): number {
    return this.connectedUsers.get(organizationId)?.size || 0;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    if (!this.io) return false;

    const sockets = this.io.sockets.sockets;
    for (const [, socket] of sockets) {
      const authSocket = socket as AuthenticatedSocket;
      if (authSocket.userId === userId) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get IO instance (for custom operations)
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export default new WebSocketService();
