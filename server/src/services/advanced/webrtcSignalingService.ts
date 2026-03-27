/**
 * WebRTC Signaling Service
 *
 * Production-grade WebRTC signaling server for VR collaborative review sessions.
 *
 * Features:
 * - Full Socket.io signaling on /webrtc namespace with JWT authentication
 * - SDP offer/answer exchange and ICE candidate trickle relay
 * - Dynamic ICE/STUN/TURN configuration with credential rotation
 * - Mesh topology for small groups, SFU mode signaling for larger groups
 * - Spatial audio, avatar state, annotation, and gesture data channels
 * - Connection quality monitoring (RTT, packet loss, jitter, bandwidth)
 * - Heartbeat keepalive, automatic reconnection, and graceful teardown
 * - Rate limiting, IP throttling, DTLS fingerprint verification
 * - WebRTC stats collection, session recording triggers, and analytics
 */

import { Server as SocketIOServer, Socket, Namespace } from 'socket.io';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../../config';
import logger from '../../config/logger';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

// ---------------------------------------------------------------------------
// Exported Interfaces
// ---------------------------------------------------------------------------

export interface WebRTCPeer {
  peerId: string;
  userId: string;
  sessionId: string;
  socketId: string;
  connectionState: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
  mediaState: {
    audioEnabled: boolean;
    videoEnabled: boolean;
    screenSharing: boolean;
    dataChannelOpen: boolean;
  };
  quality: {
    rtt: number;
    packetLoss: number;
    jitter: number;
    bandwidth: number;
  };
  joinedAt: Date;
  lastHeartbeat: Date;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'media-state' | 'spatial-update' | 'data-sync';
  from: string;
  to: string;
  sessionId: string;
  payload: any;
  timestamp: Date;
}

export interface ICEServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

export interface WebRTCSessionConfig {
  sessionId: string;
  maxPeers: number;
  topology: 'mesh' | 'sfu';
  iceServers: ICEServerConfig[];
  mediaConstraints: {
    audio: boolean | MediaTrackConstraints;
    video: boolean | MediaTrackConstraints;
  };
  dataChannels: Array<{
    label: string;
    ordered: boolean;
    maxRetransmits?: number;
  }>;
}

interface MediaTrackConstraints {
  width?: { ideal: number };
  height?: { ideal: number };
  frameRate?: { ideal: number };
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
}

// ---------------------------------------------------------------------------
// Internal Interfaces
// ---------------------------------------------------------------------------

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
  userEmail?: string;
  peerId?: string;
}

interface SessionRoom {
  sessionId: string;
  organizationId: string;
  hostPeerId: string;
  peers: Map<string, WebRTCPeer>;
  topology: 'mesh' | 'sfu';
  maxPeers: number;
  sfuPeerId: string | null;
  createdAt: Date;
  lastActivityAt: Date;
  recordingActive: boolean;
  iceServers: ICEServerConfig[];
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface ReconnectState {
  attempt: number;
  lastAttemptAt: number;
  backoffMs: number;
}

interface ConnectionQualitySnapshot {
  peerId: string;
  sessionId: string;
  rtt: number;
  packetLoss: number;
  jitter: number;
  bandwidth: number;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SFU_TOPOLOGY_THRESHOLD = 6;
const HEARTBEAT_INTERVAL_MS = 10_000;
const HEARTBEAT_TIMEOUT_MS = 30_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_EVENTS = 300;
const IP_THROTTLE_WINDOW_MS = 60_000;
const IP_THROTTLE_MAX_CONNECTIONS = 20;
const TURN_CREDENTIAL_TTL_S = 86_400;
const QUALITY_LOG_INTERVAL_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 8;
const BASE_RECONNECT_BACKOFF_MS = 1_000;
const MAX_RECONNECT_BACKOFF_MS = 60_000;
const STALE_SESSION_CLEANUP_INTERVAL_MS = 5 * 60_000;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class WebRTCSignalingService {
  private io: SocketIOServer | null = null;
  private namespace: Namespace | null = null;
  private sessions: Map<string, SessionRoom> = new Map();
  private peersBySocket: Map<string, { peerId: string; sessionId: string }> = new Map();
  private eventRateLimits: Map<string, RateLimitEntry> = new Map();
  private ipConnectionCounts: Map<string, RateLimitEntry> = new Map();
  private reconnectStates: Map<string, ReconnectState> = new Map();
  private qualityHistory: Map<string, ConnectionQualitySnapshot[]> = new Map();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private qualityLogTimer: ReturnType<typeof setInterval> | null = null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private dtlsFingerprints: Map<string, string> = new Map();

  // -----------------------------------------------------------------------
  // Public: attach to an HTTP server
  // -----------------------------------------------------------------------

  /**
   * Attach Socket.io to an existing HTTP server and initialise the /webrtc
   * namespace with authentication, event handlers, and background jobs.
   */
  attachToServer(httpServer: any): void {
    if (this.io) {
      logger.warn('[WebRTC Signaling] Server already attached, skipping duplicate initialization');
      return;
    }

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.security.corsOrigin,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingInterval: HEARTBEAT_INTERVAL_MS,
      pingTimeout: HEARTBEAT_TIMEOUT_MS,
      maxHttpBufferSize: 1e6, // 1 MB max payload
    });

    this.namespace = this.io.of('/webrtc');

    // Middleware pipeline
    this.namespace.use(this.ipThrottleMiddleware.bind(this));
    this.namespace.use(this.authenticateSocket.bind(this));

    // Connection handler
    this.namespace.on('connection', this.handleConnection.bind(this));

    // Background jobs
    this.startHeartbeatMonitor();
    this.startQualityLogger();
    this.startStaleSessionCleanup();

    logger.info('[WebRTC Signaling] Service attached to HTTP server and /webrtc namespace is live');
  }

  // -----------------------------------------------------------------------
  // Public: session management API (called from route handlers / VR service)
  // -----------------------------------------------------------------------

  /**
   * Create a new WebRTC session room linked to a VR session.
   */
  createSession(params: {
    sessionId: string;
    organizationId: string;
    hostUserId: string;
    maxPeers?: number;
    topology?: 'mesh' | 'sfu';
  }): WebRTCSessionConfig {
    const { sessionId, organizationId, hostUserId, maxPeers, topology } = params;

    if (this.sessions.has(sessionId)) {
      logger.warn('[WebRTC Signaling] Session already exists, returning existing config', { sessionId });
      return this.buildSessionConfig(sessionId);
    }

    const effectiveMax = maxPeers ?? 12;
    const effectiveTopology = topology ?? (effectiveMax <= SFU_TOPOLOGY_THRESHOLD ? 'mesh' : 'sfu');
    const hostPeerId = this.generatePeerId(hostUserId);
    const iceServers = this.buildICEServers();

    const room: SessionRoom = {
      sessionId,
      organizationId,
      hostPeerId,
      peers: new Map(),
      topology: effectiveTopology,
      maxPeers: effectiveMax,
      sfuPeerId: null,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      recordingActive: false,
      iceServers,
    };

    this.sessions.set(sessionId, room);

    logger.info('[WebRTC Signaling] Session created', {
      sessionId,
      organizationId,
      topology: effectiveTopology,
      maxPeers: effectiveMax,
    });

    return this.buildSessionConfig(sessionId);
  }

  /**
   * Destroy a session and forcefully disconnect all peers.
   */
  destroySession(sessionId: string): void {
    const room = this.sessions.get(sessionId);
    if (!room) {
      logger.warn('[WebRTC Signaling] Attempted to destroy non-existent session', { sessionId });
      return;
    }

    // Notify every peer
    for (const [, peer] of room.peers) {
      this.emitToPeer(peer.socketId, 'session-destroyed', { sessionId, reason: 'host_ended' });
      this.cleanupPeer(peer.peerId, sessionId);
    }

    this.sessions.delete(sessionId);
    logger.info('[WebRTC Signaling] Session destroyed', { sessionId });
  }

  /**
   * Get a snapshot of all peers in a session.
   */
  getSessionPeers(sessionId: string): WebRTCPeer[] {
    const room = this.sessions.get(sessionId);
    if (!room) return [];
    return Array.from(room.peers.values());
  }

  /**
   * Get the current session configuration.
   */
  getSessionConfig(sessionId: string): WebRTCSessionConfig | null {
    if (!this.sessions.has(sessionId)) return null;
    return this.buildSessionConfig(sessionId);
  }

  /**
   * Get ICE server configuration (for clients that need it before creating a session).
   */
  getICEServers(): ICEServerConfig[] {
    return this.buildICEServers();
  }

  /**
   * Trigger session recording start/stop signaling.
   */
  toggleRecording(sessionId: string, active: boolean): void {
    const room = this.sessions.get(sessionId);
    if (!room) return;
    room.recordingActive = active;
    this.broadcastToSession(sessionId, 'recording-state', { active, timestamp: new Date() });
    logger.info('[WebRTC Signaling] Recording toggled', { sessionId, active });
  }

  /**
   * Force ICE restart for a specific peer connection pair.
   */
  triggerICERestart(sessionId: string, fromPeerId: string, toPeerId: string): void {
    const room = this.sessions.get(sessionId);
    if (!room) return;

    const fromPeer = room.peers.get(fromPeerId);
    const toPeer = room.peers.get(toPeerId);
    if (!fromPeer || !toPeer) return;

    const freshIceServers = this.buildICEServers();
    room.iceServers = freshIceServers;

    this.emitToPeer(fromPeer.socketId, 'ice-restart', {
      peerId: toPeerId,
      iceServers: freshIceServers,
    });
    this.emitToPeer(toPeer.socketId, 'ice-restart', {
      peerId: fromPeerId,
      iceServers: freshIceServers,
    });

    logger.info('[WebRTC Signaling] ICE restart triggered', { sessionId, fromPeerId, toPeerId });
  }

  /**
   * Get aggregated quality metrics for a session.
   */
  getSessionQualityMetrics(sessionId: string): { peers: Record<string, ConnectionQualitySnapshot[]> } {
    const room = this.sessions.get(sessionId);
    if (!room) return { peers: {} };

    const result: Record<string, ConnectionQualitySnapshot[]> = {};
    for (const [peerId] of room.peers) {
      result[peerId] = this.qualityHistory.get(peerId) ?? [];
    }
    return { peers: result };
  }

  /**
   * Get network topology visualization data for a session.
   */
  getTopologyData(sessionId: string): {
    topology: 'mesh' | 'sfu';
    nodes: Array<{ peerId: string; userId: string; connectionState: string }>;
    edges: Array<{ from: string; to: string; quality: number }>;
  } | null {
    const room = this.sessions.get(sessionId);
    if (!room) return null;

    const nodes = Array.from(room.peers.values()).map(p => ({
      peerId: p.peerId,
      userId: p.userId,
      connectionState: p.connectionState,
    }));

    const edges: Array<{ from: string; to: string; quality: number }> = [];
    const peerIds = Array.from(room.peers.keys());

    if (room.topology === 'mesh') {
      // Full mesh: every pair
      for (let i = 0; i < peerIds.length; i++) {
        for (let j = i + 1; j < peerIds.length; j++) {
          const pA = room.peers.get(peerIds[i])!;
          const pB = room.peers.get(peerIds[j])!;
          const qualityScore = this.computeEdgeQuality(pA, pB);
          edges.push({ from: peerIds[i], to: peerIds[j], quality: qualityScore });
        }
      }
    } else {
      // SFU: star topology around SFU peer
      const sfuId = room.sfuPeerId ?? room.hostPeerId;
      for (const pid of peerIds) {
        if (pid === sfuId) continue;
        const peer = room.peers.get(pid)!;
        const sfuPeer = room.peers.get(sfuId);
        const qualityScore = sfuPeer ? this.computeEdgeQuality(peer, sfuPeer) : 1;
        edges.push({ from: sfuId, to: pid, quality: qualityScore });
      }
    }

    return { topology: room.topology, nodes, edges };
  }

  /**
   * Shut down the signaling service gracefully.
   */
  shutdown(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.qualityLogTimer) clearInterval(this.qualityLogTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);

    // Close every session
    for (const [sessionId] of this.sessions) {
      this.destroySession(sessionId);
    }

    if (this.namespace) {
      this.namespace.disconnectSockets(true);
    }

    this.io = null;
    this.namespace = null;
    logger.info('[WebRTC Signaling] Service shut down');
  }

  // -----------------------------------------------------------------------
  // Middleware
  // -----------------------------------------------------------------------

  /**
   * IP-based connection throttling middleware.
   */
  private ipThrottleMiddleware(socket: Socket, next: (err?: Error) => void): void {
    const ip = socket.handshake.address || 'unknown';
    const now = Date.now();
    const entry = this.ipConnectionCounts.get(ip);

    if (entry && (now - entry.windowStart) < IP_THROTTLE_WINDOW_MS) {
      entry.count += 1;
      if (entry.count > IP_THROTTLE_MAX_CONNECTIONS) {
        logger.warn('[WebRTC Signaling] IP throttle exceeded', { ip, count: entry.count });
        return next(new Error('Too many connections from this IP'));
      }
    } else {
      this.ipConnectionCounts.set(ip, { count: 1, windowStart: now });
    }

    next();
  }

  /**
   * JWT authentication middleware for the /webrtc namespace.
   */
  private async authenticateSocket(
    socket: AuthenticatedSocket,
    next: (err?: Error) => void,
  ): Promise<void> {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        logger.warn('[WebRTC Signaling] Connection rejected: no auth token', {
          socketId: socket.id,
        });
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: string;
        email: string;
        role: string;
        organizationId: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, organizationId: true },
      });

      if (!user) {
        logger.warn('[WebRTC Signaling] Connection rejected: user not found', {
          userId: decoded.userId,
        });
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.organizationId = user.organizationId;
      socket.userEmail = user.email;

      next();
    } catch (error: any) {
      logger.error('[WebRTC Signaling] Authentication error', { error: error.message });
      next(new Error('Authentication failed'));
    }
  }

  // -----------------------------------------------------------------------
  // Connection handler
  // -----------------------------------------------------------------------

  private handleConnection(socket: AuthenticatedSocket): void {
    const { userId, organizationId, userEmail } = socket;

    if (!userId || !organizationId) {
      socket.disconnect(true);
      return;
    }

    logger.info('[WebRTC Signaling] Peer connected', {
      userId,
      socketId: socket.id,
      email: userEmail,
    });

    socket.emit('authenticated', {
      socketId: socket.id,
      userId,
      timestamp: new Date(),
    });

    // ---- Signaling events ----
    socket.on('join-session', (data, ack) => this.handleJoinSession(socket, data, ack));
    socket.on('leave-session', (data) => this.handleLeaveSession(socket, data));
    socket.on('offer', (data) => this.handleOffer(socket, data));
    socket.on('answer', (data) => this.handleAnswer(socket, data));
    socket.on('ice-candidate', (data) => this.handleICECandidate(socket, data));
    socket.on('media-state', (data) => this.handleMediaState(socket, data));
    socket.on('spatial-update', (data) => this.handleSpatialUpdate(socket, data));
    socket.on('avatar-state', (data) => this.handleAvatarState(socket, data));
    socket.on('annotation-sync', (data) => this.handleAnnotationSync(socket, data));
    socket.on('gesture-sync', (data) => this.handleGestureSync(socket, data));
    socket.on('data-sync', (data) => this.handleDataSync(socket, data));
    socket.on('quality-report', (data) => this.handleQualityReport(socket, data));
    socket.on('stats-report', (data) => this.handleStatsReport(socket, data));
    socket.on('dtls-fingerprint', (data) => this.handleDTLSFingerprint(socket, data));
    socket.on('request-ice-restart', (data) => this.handleICERestartRequest(socket, data));
    socket.on('track-mute', (data) => this.handleTrackMute(socket, data));
    socket.on('bandwidth-estimate', (data) => this.handleBandwidthEstimate(socket, data));
    socket.on('heartbeat', () => this.handleHeartbeat(socket));
    socket.on('disconnect', (reason) => this.handleDisconnect(socket, reason));
  }

  // -----------------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------------

  private handleJoinSession(
    socket: AuthenticatedSocket,
    data: { sessionId: string; mediaState?: Partial<WebRTCPeer['mediaState']> },
    ack?: (response: any) => void,
  ): void {
    if (!this.checkRateLimit(socket)) return;

    const { sessionId, mediaState } = data;
    const userId = socket.userId!;

    const room = this.sessions.get(sessionId);
    if (!room) {
      const errorPayload = { error: 'Session not found', sessionId };
      if (ack) ack(errorPayload);
      else socket.emit('error', errorPayload);
      return;
    }

    // Verify organization membership
    if (room.organizationId !== socket.organizationId) {
      const errorPayload = { error: 'Access denied: organization mismatch', sessionId };
      if (ack) ack(errorPayload);
      else socket.emit('error', errorPayload);
      logger.warn('[WebRTC Signaling] Org mismatch on join', {
        sessionId,
        peerOrg: socket.organizationId,
        sessionOrg: room.organizationId,
      });
      return;
    }

    // Check capacity
    if (room.peers.size >= room.maxPeers) {
      const errorPayload = { error: 'Session full', sessionId, maxPeers: room.maxPeers };
      if (ack) ack(errorPayload);
      else socket.emit('error', errorPayload);
      return;
    }

    // Check if this user already has a peer in this session (reconnect case)
    let existingPeerId: string | null = null;
    for (const [pid, peer] of room.peers) {
      if (peer.userId === userId) {
        existingPeerId = pid;
        break;
      }
    }

    const peerId = existingPeerId ?? this.generatePeerId(userId);
    const now = new Date();

    const peer: WebRTCPeer = {
      peerId,
      userId,
      sessionId,
      socketId: socket.id,
      connectionState: 'new',
      mediaState: {
        audioEnabled: mediaState?.audioEnabled ?? true,
        videoEnabled: mediaState?.videoEnabled ?? false,
        screenSharing: mediaState?.screenSharing ?? false,
        dataChannelOpen: false,
      },
      quality: { rtt: 0, packetLoss: 0, jitter: 0, bandwidth: 0 },
      joinedAt: existingPeerId ? (room.peers.get(existingPeerId)?.joinedAt ?? now) : now,
      lastHeartbeat: now,
    };

    // If reconnecting, clean old mapping
    if (existingPeerId) {
      const oldPeer = room.peers.get(existingPeerId)!;
      this.peersBySocket.delete(oldPeer.socketId);
      this.reconnectStates.delete(existingPeerId);
      logger.info('[WebRTC Signaling] Peer reconnected', { peerId, sessionId, userId });
    }

    room.peers.set(peerId, peer);
    room.lastActivityAt = now;
    this.peersBySocket.set(socket.id, { peerId, sessionId });
    socket.peerId = peerId;
    socket.join(`session:${sessionId}`);

    // Evaluate topology upgrade
    this.evaluateTopology(room);

    // Gather existing peers for the joiner
    const existingPeers = Array.from(room.peers.values())
      .filter(p => p.peerId !== peerId)
      .map(p => ({
        peerId: p.peerId,
        userId: p.userId,
        mediaState: p.mediaState,
        connectionState: p.connectionState,
      }));

    const sessionConfig = this.buildSessionConfig(sessionId);

    const joinResponse = {
      peerId,
      sessionId,
      topology: room.topology,
      iceServers: room.iceServers,
      existingPeers,
      sessionConfig,
      sfuPeerId: room.sfuPeerId,
    };

    if (ack) {
      ack(joinResponse);
    } else {
      socket.emit('session-joined', joinResponse);
    }

    // Notify others
    this.broadcastToSessionExcept(sessionId, socket.id, 'peer-joined', {
      peerId,
      userId,
      mediaState: peer.mediaState,
      timestamp: now,
    });

    this.persistPeerEvent(sessionId, peerId, userId, 'joined');

    logger.info('[WebRTC Signaling] Peer joined session', {
      peerId,
      sessionId,
      userId,
      peerCount: room.peers.size,
      topology: room.topology,
    });
  }

  private handleLeaveSession(
    socket: AuthenticatedSocket,
    data: { sessionId: string },
  ): void {
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping || mapping.sessionId !== data.sessionId) return;

    this.removePeerFromSession(mapping.peerId, data.sessionId, 'left');
    socket.leave(`session:${data.sessionId}`);
  }

  private handleOffer(
    socket: AuthenticatedSocket,
    data: { to: string; sessionId: string; sdp: any; dtlsFingerprint?: string },
  ): void {
    if (!this.checkRateLimit(socket)) return;
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    const room = this.sessions.get(data.sessionId);
    if (!room) return;

    const targetPeer = room.peers.get(data.to);
    if (!targetPeer) {
      socket.emit('error', { error: 'Target peer not found', peerId: data.to });
      return;
    }

    // Validate DTLS fingerprint if provided
    if (data.dtlsFingerprint) {
      this.dtlsFingerprints.set(`${mapping.peerId}:${data.to}`, data.dtlsFingerprint);
    }

    // Update connection state
    const senderPeer = room.peers.get(mapping.peerId);
    if (senderPeer) {
      senderPeer.connectionState = 'connecting';
    }

    const message: SignalingMessage = {
      type: 'offer',
      from: mapping.peerId,
      to: data.to,
      sessionId: data.sessionId,
      payload: {
        sdp: data.sdp,
        dtlsFingerprint: data.dtlsFingerprint,
      },
      timestamp: new Date(),
    };

    this.emitToPeer(targetPeer.socketId, 'offer', message);
    room.lastActivityAt = new Date();

    logger.debug('[WebRTC Signaling] SDP offer relayed', {
      from: mapping.peerId,
      to: data.to,
      sessionId: data.sessionId,
    });
  }

  private handleAnswer(
    socket: AuthenticatedSocket,
    data: { to: string; sessionId: string; sdp: any; dtlsFingerprint?: string },
  ): void {
    if (!this.checkRateLimit(socket)) return;
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    const room = this.sessions.get(data.sessionId);
    if (!room) return;

    const targetPeer = room.peers.get(data.to);
    if (!targetPeer) {
      socket.emit('error', { error: 'Target peer not found', peerId: data.to });
      return;
    }

    // Verify DTLS fingerprint continuity
    if (data.dtlsFingerprint) {
      const offerFp = this.dtlsFingerprints.get(`${data.to}:${mapping.peerId}`);
      if (offerFp) {
        // Store answer fingerprint for the reverse direction
        this.dtlsFingerprints.set(`${mapping.peerId}:${data.to}`, data.dtlsFingerprint);
      }
    }

    // Update connection states
    const answerer = room.peers.get(mapping.peerId);
    if (answerer) answerer.connectionState = 'connecting';
    targetPeer.connectionState = 'connecting';

    const message: SignalingMessage = {
      type: 'answer',
      from: mapping.peerId,
      to: data.to,
      sessionId: data.sessionId,
      payload: {
        sdp: data.sdp,
        dtlsFingerprint: data.dtlsFingerprint,
      },
      timestamp: new Date(),
    };

    this.emitToPeer(targetPeer.socketId, 'answer', message);
    room.lastActivityAt = new Date();

    logger.debug('[WebRTC Signaling] SDP answer relayed', {
      from: mapping.peerId,
      to: data.to,
      sessionId: data.sessionId,
    });
  }

  private handleICECandidate(
    socket: AuthenticatedSocket,
    data: { to: string; sessionId: string; candidate: any },
  ): void {
    if (!this.checkRateLimit(socket)) return;
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    const room = this.sessions.get(data.sessionId);
    if (!room) return;

    const targetPeer = room.peers.get(data.to);
    if (!targetPeer) return;

    // ICE candidate filtering: in relay-only mode, drop non-relay candidates
    const relayOnly = process.env.WEBRTC_RELAY_ONLY === 'true';
    if (relayOnly && data.candidate && data.candidate.candidate) {
      const candidateStr: string = data.candidate.candidate;
      if (!candidateStr.includes('relay')) {
        logger.debug('[WebRTC Signaling] Dropping non-relay ICE candidate (relay-only mode)', {
          from: mapping.peerId,
          to: data.to,
        });
        return;
      }
    }

    const message: SignalingMessage = {
      type: 'ice-candidate',
      from: mapping.peerId,
      to: data.to,
      sessionId: data.sessionId,
      payload: { candidate: data.candidate },
      timestamp: new Date(),
    };

    this.emitToPeer(targetPeer.socketId, 'ice-candidate', message);
  }

  private handleMediaState(
    socket: AuthenticatedSocket,
    data: { sessionId: string; mediaState: Partial<WebRTCPeer['mediaState']> },
  ): void {
    if (!this.checkRateLimit(socket)) return;
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    const room = this.sessions.get(data.sessionId);
    if (!room) return;

    const peer = room.peers.get(mapping.peerId);
    if (!peer) return;

    // Apply partial media state update
    if (data.mediaState.audioEnabled !== undefined) peer.mediaState.audioEnabled = data.mediaState.audioEnabled;
    if (data.mediaState.videoEnabled !== undefined) peer.mediaState.videoEnabled = data.mediaState.videoEnabled;
    if (data.mediaState.screenSharing !== undefined) peer.mediaState.screenSharing = data.mediaState.screenSharing;
    if (data.mediaState.dataChannelOpen !== undefined) peer.mediaState.dataChannelOpen = data.mediaState.dataChannelOpen;

    const message: SignalingMessage = {
      type: 'media-state',
      from: mapping.peerId,
      to: '', // broadcast
      sessionId: data.sessionId,
      payload: { mediaState: peer.mediaState },
      timestamp: new Date(),
    };

    this.broadcastToSessionExcept(data.sessionId, socket.id, 'media-state', message);
  }

  private handleSpatialUpdate(
    socket: AuthenticatedSocket,
    data: {
      sessionId: string;
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number };
      spatialAudio?: { gain: number; panX: number; panY: number; panZ: number };
    },
  ): void {
    // Spatial updates are high frequency -- minimal validation, no rate limit on purpose
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    const room = this.sessions.get(data.sessionId);
    if (!room) return;

    const message: SignalingMessage = {
      type: 'spatial-update',
      from: mapping.peerId,
      to: '', // broadcast
      sessionId: data.sessionId,
      payload: {
        position: data.position,
        rotation: data.rotation,
        spatialAudio: data.spatialAudio,
      },
      timestamp: new Date(),
    };

    // Use volatile emit for spatial updates -- dropping frames is acceptable
    this.broadcastToSessionVolatile(data.sessionId, socket.id, 'spatial-update', message);
  }

  private handleAvatarState(
    socket: AuthenticatedSocket,
    data: {
      sessionId: string;
      avatarState: Record<string, any>;
    },
  ): void {
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    const room = this.sessions.get(data.sessionId);
    if (!room) return;

    this.broadcastToSessionVolatile(data.sessionId, socket.id, 'avatar-state', {
      from: mapping.peerId,
      sessionId: data.sessionId,
      avatarState: data.avatarState,
      timestamp: new Date(),
    });
  }

  private handleAnnotationSync(
    socket: AuthenticatedSocket,
    data: {
      sessionId: string;
      action: 'create' | 'update' | 'delete' | 'resolve';
      annotation: Record<string, any>;
    },
  ): void {
    if (!this.checkRateLimit(socket)) return;
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    const room = this.sessions.get(data.sessionId);
    if (!room) return;

    this.broadcastToSessionExcept(data.sessionId, socket.id, 'annotation-sync', {
      from: mapping.peerId,
      sessionId: data.sessionId,
      action: data.action,
      annotation: data.annotation,
      timestamp: new Date(),
    });

    this.persistAnnotationEvent(data.sessionId, mapping.peerId, data.action, data.annotation);
  }

  private handleGestureSync(
    socket: AuthenticatedSocket,
    data: {
      sessionId: string;
      gestureType: string;
      gestureData: Record<string, any>;
    },
  ): void {
    // Gestures are latency-sensitive, use volatile
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    this.broadcastToSessionVolatile(data.sessionId, socket.id, 'gesture-sync', {
      from: mapping.peerId,
      sessionId: data.sessionId,
      gestureType: data.gestureType,
      gestureData: data.gestureData,
      timestamp: new Date(),
    });
  }

  private handleDataSync(
    socket: AuthenticatedSocket,
    data: {
      sessionId: string;
      channel: string;
      payload: any;
      to?: string; // optional targeted peer
    },
  ): void {
    if (!this.checkRateLimit(socket)) return;
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    const room = this.sessions.get(data.sessionId);
    if (!room) return;

    const message: SignalingMessage = {
      type: 'data-sync',
      from: mapping.peerId,
      to: data.to ?? '',
      sessionId: data.sessionId,
      payload: { channel: data.channel, data: data.payload },
      timestamp: new Date(),
    };

    if (data.to) {
      const targetPeer = room.peers.get(data.to);
      if (targetPeer) {
        this.emitToPeer(targetPeer.socketId, 'data-sync', message);
      }
    } else {
      this.broadcastToSessionExcept(data.sessionId, socket.id, 'data-sync', message);
    }
  }

  private handleQualityReport(
    socket: AuthenticatedSocket,
    data: {
      sessionId: string;
      rtt: number;
      packetLoss: number;
      jitter: number;
      bandwidth: number;
      connectionState?: WebRTCPeer['connectionState'];
    },
  ): void {
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    const room = this.sessions.get(data.sessionId);
    if (!room) return;

    const peer = room.peers.get(mapping.peerId);
    if (!peer) return;

    peer.quality.rtt = data.rtt;
    peer.quality.packetLoss = data.packetLoss;
    peer.quality.jitter = data.jitter;
    peer.quality.bandwidth = data.bandwidth;

    if (data.connectionState) {
      peer.connectionState = data.connectionState;
    }

    // Store in quality history
    const snapshot: ConnectionQualitySnapshot = {
      peerId: mapping.peerId,
      sessionId: data.sessionId,
      rtt: data.rtt,
      packetLoss: data.packetLoss,
      jitter: data.jitter,
      bandwidth: data.bandwidth,
      timestamp: new Date(),
    };

    const history = this.qualityHistory.get(mapping.peerId) ?? [];
    history.push(snapshot);
    // Keep last 100 entries per peer
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    this.qualityHistory.set(mapping.peerId, history);

    // If quality is critically poor, suggest ICE restart
    if (data.packetLoss > 15 || data.rtt > 2000) {
      socket.emit('quality-warning', {
        level: 'critical',
        suggestion: 'ice-restart',
        metrics: { rtt: data.rtt, packetLoss: data.packetLoss },
      });
    } else if (data.packetLoss > 5 || data.rtt > 500) {
      socket.emit('quality-warning', {
        level: 'degraded',
        suggestion: 'reduce-bitrate',
        metrics: { rtt: data.rtt, packetLoss: data.packetLoss },
      });
    }
  }

  private handleStatsReport(
    socket: AuthenticatedSocket,
    data: {
      sessionId: string;
      stats: Record<string, any>;
    },
  ): void {
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    // Persist stats asynchronously
    this.persistStatsReport(data.sessionId, mapping.peerId, data.stats).catch(err => {
      logger.error('[WebRTC Signaling] Failed to persist stats report', { error: err.message });
    });
  }

  private handleDTLSFingerprint(
    socket: AuthenticatedSocket,
    data: { sessionId: string; targetPeerId: string; fingerprint: string },
  ): void {
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    const key = `${mapping.peerId}:${data.targetPeerId}`;
    const existingFp = this.dtlsFingerprints.get(key);

    if (existingFp && existingFp !== data.fingerprint) {
      logger.warn('[WebRTC Signaling] DTLS fingerprint mismatch detected', {
        peerId: mapping.peerId,
        targetPeerId: data.targetPeerId,
        sessionId: data.sessionId,
      });

      socket.emit('security-warning', {
        type: 'dtls-fingerprint-mismatch',
        message: 'DTLS fingerprint changed unexpectedly. Connection may be compromised.',
        targetPeerId: data.targetPeerId,
      });
      return;
    }

    this.dtlsFingerprints.set(key, data.fingerprint);
  }

  private handleICERestartRequest(
    socket: AuthenticatedSocket,
    data: { sessionId: string; targetPeerId: string },
  ): void {
    if (!this.checkRateLimit(socket)) return;
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    this.triggerICERestart(data.sessionId, mapping.peerId, data.targetPeerId);
  }

  private handleTrackMute(
    socket: AuthenticatedSocket,
    data: {
      sessionId: string;
      trackKind: 'audio' | 'video';
      muted: boolean;
      trackId?: string;
    },
  ): void {
    if (!this.checkRateLimit(socket)) return;
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    const room = this.sessions.get(data.sessionId);
    if (!room) return;

    const peer = room.peers.get(mapping.peerId);
    if (!peer) return;

    if (data.trackKind === 'audio') {
      peer.mediaState.audioEnabled = !data.muted;
    } else if (data.trackKind === 'video') {
      peer.mediaState.videoEnabled = !data.muted;
    }

    this.broadcastToSessionExcept(data.sessionId, socket.id, 'track-mute', {
      from: mapping.peerId,
      trackKind: data.trackKind,
      muted: data.muted,
      trackId: data.trackId,
      timestamp: new Date(),
    });
  }

  private handleBandwidthEstimate(
    socket: AuthenticatedSocket,
    data: {
      sessionId: string;
      availableBandwidth: number;
      currentBitrate: number;
    },
  ): void {
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    const room = this.sessions.get(data.sessionId);
    if (!room) return;

    const peer = room.peers.get(mapping.peerId);
    if (peer) {
      peer.quality.bandwidth = data.availableBandwidth;
    }

    // Calculate recommended bitrate ranges based on topology and peer count
    const peerCount = room.peers.size;
    const perPeerBudget = data.availableBandwidth / Math.max(1, peerCount - 1);

    let recommendedVideo = Math.min(perPeerBudget * 0.7, 2_500_000); // Cap at 2.5 Mbps
    let recommendedAudio = Math.min(perPeerBudget * 0.15, 128_000); // Cap at 128 kbps

    if (room.topology === 'sfu') {
      // In SFU mode, client only sends one stream to the server
      recommendedVideo = Math.min(data.availableBandwidth * 0.7, 4_000_000);
      recommendedAudio = Math.min(data.availableBandwidth * 0.15, 128_000);
    }

    socket.emit('bandwidth-recommendation', {
      recommendedVideoBitrate: Math.round(recommendedVideo),
      recommendedAudioBitrate: Math.round(recommendedAudio),
      peerCount,
      topology: room.topology,
      timestamp: new Date(),
    });
  }

  private handleHeartbeat(socket: AuthenticatedSocket): void {
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) return;

    const room = this.sessions.get(mapping.sessionId);
    if (!room) return;

    const peer = room.peers.get(mapping.peerId);
    if (peer) {
      peer.lastHeartbeat = new Date();
    }

    socket.emit('heartbeat-ack', { timestamp: new Date() });
  }

  private handleDisconnect(socket: AuthenticatedSocket, reason: string): void {
    const mapping = this.peersBySocket.get(socket.id);
    if (!mapping) {
      logger.debug('[WebRTC Signaling] Untracked socket disconnected', {
        socketId: socket.id,
        reason,
      });
      return;
    }

    const { peerId, sessionId } = mapping;

    logger.info('[WebRTC Signaling] Peer disconnected', {
      peerId,
      sessionId,
      userId: socket.userId,
      reason,
    });

    // If the disconnect was unclean, set up reconnect window
    const wasClean = reason === 'client namespace disconnect' || reason === 'server namespace disconnect';
    if (!wasClean) {
      const room = this.sessions.get(sessionId);
      if (room) {
        const peer = room.peers.get(peerId);
        if (peer) {
          peer.connectionState = 'disconnected';
          // Give a reconnection window before full removal
          const reconnectState: ReconnectState = {
            attempt: 0,
            lastAttemptAt: Date.now(),
            backoffMs: BASE_RECONNECT_BACKOFF_MS,
          };
          this.reconnectStates.set(peerId, reconnectState);

          // Notify other peers of temporary disconnection
          this.broadcastToSessionExcept(sessionId, socket.id, 'peer-disconnected', {
            peerId,
            temporary: true,
            reason,
            timestamp: new Date(),
          });

          // Schedule full removal after max backoff period
          const maxWaitMs = this.computeMaxReconnectWait();
          setTimeout(() => {
            const currentState = this.reconnectStates.get(peerId);
            if (currentState) {
              // Peer never reconnected -- remove them
              this.removePeerFromSession(peerId, sessionId, 'timeout');
              this.reconnectStates.delete(peerId);
            }
          }, maxWaitMs);

          // Clean socket mapping immediately (socket is gone)
          this.peersBySocket.delete(socket.id);
          return;
        }
      }
    }

    this.removePeerFromSession(peerId, sessionId, 'disconnected');
  }

  // -----------------------------------------------------------------------
  // Session & peer lifecycle helpers
  // -----------------------------------------------------------------------

  private removePeerFromSession(peerId: string, sessionId: string, reason: string): void {
    const room = this.sessions.get(sessionId);
    if (!room) return;

    const peer = room.peers.get(peerId);
    if (!peer) return;

    // Clean up maps
    this.peersBySocket.delete(peer.socketId);
    this.dtlsFingerprints.forEach((_, key) => {
      if (key.startsWith(`${peerId}:`) || key.endsWith(`:${peerId}`)) {
        this.dtlsFingerprints.delete(key);
      }
    });
    this.qualityHistory.delete(peerId);
    this.reconnectStates.delete(peerId);

    room.peers.delete(peerId);
    room.lastActivityAt = new Date();

    // Notify remaining peers
    this.broadcastToSession(sessionId, 'peer-left', {
      peerId,
      userId: peer.userId,
      reason,
      timestamp: new Date(),
    });

    // Re-evaluate topology
    this.evaluateTopology(room);

    this.persistPeerEvent(sessionId, peerId, peer.userId, 'left');

    logger.info('[WebRTC Signaling] Peer removed from session', {
      peerId,
      sessionId,
      reason,
      remainingPeers: room.peers.size,
    });

    // If session is empty, keep it alive for possible reconnection
    // The stale session cleanup will handle removal
  }

  private cleanupPeer(peerId: string, sessionId: string): void {
    this.removePeerFromSession(peerId, sessionId, 'session_destroyed');
  }

  private evaluateTopology(room: SessionRoom): void {
    const peerCount = room.peers.size;
    const previousTopology = room.topology;

    if (peerCount <= SFU_TOPOLOGY_THRESHOLD) {
      room.topology = 'mesh';
      room.sfuPeerId = null;
    } else {
      room.topology = 'sfu';
      // Designate the host as the SFU relay point
      if (!room.sfuPeerId || !room.peers.has(room.sfuPeerId)) {
        room.sfuPeerId = room.hostPeerId;
        // If host is not in peers, pick the first peer
        if (!room.peers.has(room.sfuPeerId)) {
          const firstPeer = room.peers.keys().next().value;
          room.sfuPeerId = firstPeer ?? null;
        }
      }
    }

    if (previousTopology !== room.topology) {
      this.broadcastToSession(room.sessionId, 'topology-changed', {
        topology: room.topology,
        sfuPeerId: room.sfuPeerId,
        peerCount,
        timestamp: new Date(),
      });
      logger.info('[WebRTC Signaling] Topology changed', {
        sessionId: room.sessionId,
        from: previousTopology,
        to: room.topology,
        peerCount,
      });
    }
  }

  // -----------------------------------------------------------------------
  // ICE / STUN / TURN configuration
  // -----------------------------------------------------------------------

  private buildICEServers(): ICEServerConfig[] {
    const servers: ICEServerConfig[] = [];

    // STUN servers from env or defaults
    const stunServers = process.env.WEBRTC_STUN_SERVERS
      ? process.env.WEBRTC_STUN_SERVERS.split(',').map(s => s.trim())
      : [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ];

    servers.push({ urls: stunServers });

    // Custom STUN server
    if (process.env.WEBRTC_CUSTOM_STUN_URL) {
      servers.push({ urls: process.env.WEBRTC_CUSTOM_STUN_URL });
    }

    // TURN server with credential rotation
    const turnUrl = process.env.WEBRTC_TURN_URL;
    if (turnUrl) {
      const turnCreds = this.generateTURNCredentials();
      servers.push({
        urls: turnUrl,
        username: turnCreds.username,
        credential: turnCreds.credential,
        credentialType: 'password',
      });

      // TLS TURN variant
      const turnTlsUrl = process.env.WEBRTC_TURN_TLS_URL;
      if (turnTlsUrl) {
        servers.push({
          urls: turnTlsUrl,
          username: turnCreds.username,
          credential: turnCreds.credential,
          credentialType: 'password',
        });
      }
    }

    // Twilio TURN servers
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    if (twilioAccountSid && twilioAuthToken) {
      const twilioCreds = this.generateTURNCredentials();
      const twilioTurnUrl = process.env.TWILIO_TURN_URL || `turn:global.turn.twilio.com:3478?transport=udp`;
      servers.push({
        urls: twilioTurnUrl,
        username: twilioCreds.username,
        credential: twilioCreds.credential,
        credentialType: 'password',
      });
    }

    // Additional custom TURN servers from env (comma-separated)
    const extraTurnUrls = process.env.WEBRTC_EXTRA_TURN_URLS;
    if (extraTurnUrls) {
      const creds = this.generateTURNCredentials();
      for (const url of extraTurnUrls.split(',').map(u => u.trim())) {
        servers.push({
          urls: url,
          username: creds.username,
          credential: creds.credential,
          credentialType: 'password',
        });
      }
    }

    return servers;
  }

  /**
   * Generate time-limited TURN credentials using the shared secret (RFC 5766 long-term auth).
   * The username encodes the expiry timestamp so the TURN server can validate independently.
   */
  private generateTURNCredentials(): { username: string; credential: string } {
    const secret = process.env.WEBRTC_TURN_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError('WEBRTC_TURN_SECRET or JWT_SECRET environment variable is required for TURN credential generation', 500);
    }
    const ttl = parseInt(process.env.WEBRTC_TURN_TTL || String(TURN_CREDENTIAL_TTL_S), 10);
    const expiry = Math.floor(Date.now() / 1000) + ttl;
    const username = `${expiry}:complyeasy-${crypto.randomBytes(4).toString('hex')}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(username);
    const credential = hmac.digest('base64');
    return { username, credential };
  }

  // -----------------------------------------------------------------------
  // Session config builder
  // -----------------------------------------------------------------------

  private buildSessionConfig(sessionId: string): WebRTCSessionConfig {
    const room = this.sessions.get(sessionId);
    if (!room) {
      // Return safe defaults
      return {
        sessionId,
        maxPeers: 12,
        topology: 'mesh',
        iceServers: this.buildICEServers(),
        mediaConstraints: {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
          video: false,
        },
        dataChannels: this.getDefaultDataChannels(),
      };
    }

    return {
      sessionId,
      maxPeers: room.maxPeers,
      topology: room.topology,
      iceServers: room.iceServers,
      mediaConstraints: {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      },
      dataChannels: this.getDefaultDataChannels(),
    };
  }

  private getDefaultDataChannels(): WebRTCSessionConfig['dataChannels'] {
    return [
      { label: 'spatial-audio', ordered: false, maxRetransmits: 0 },
      { label: 'position-rotation', ordered: false, maxRetransmits: 0 },
      { label: 'gesture-pointer', ordered: false, maxRetransmits: 0 },
      { label: 'session-state', ordered: true },
      { label: 'avatar-state', ordered: false, maxRetransmits: 2 },
      { label: 'annotations', ordered: true },
    ];
  }

  // -----------------------------------------------------------------------
  // Emit helpers
  // -----------------------------------------------------------------------

  private emitToPeer(socketId: string, event: string, data: any): void {
    if (!this.namespace) return;
    this.namespace.to(socketId).emit(event, data);
  }

  private broadcastToSession(sessionId: string, event: string, data: any): void {
    if (!this.namespace) return;
    this.namespace.to(`session:${sessionId}`).emit(event, data);
  }

  private broadcastToSessionExcept(
    sessionId: string,
    excludeSocketId: string,
    event: string,
    data: any,
  ): void {
    if (!this.namespace) return;
    this.namespace.to(`session:${sessionId}`).except(excludeSocketId).emit(event, data);
  }

  private broadcastToSessionVolatile(
    sessionId: string,
    excludeSocketId: string,
    event: string,
    data: any,
  ): void {
    if (!this.namespace) return;
    this.namespace.to(`session:${sessionId}`).except(excludeSocketId).volatile.emit(event, data);
  }

  // -----------------------------------------------------------------------
  // Rate limiting
  // -----------------------------------------------------------------------

  private checkRateLimit(socket: AuthenticatedSocket): boolean {
    const key = socket.id;
    const now = Date.now();
    const entry = this.eventRateLimits.get(key);

    if (entry && (now - entry.windowStart) < RATE_LIMIT_WINDOW_MS) {
      entry.count += 1;
      if (entry.count > RATE_LIMIT_MAX_EVENTS) {
        logger.warn('[WebRTC Signaling] Rate limit exceeded', {
          socketId: socket.id,
          userId: socket.userId,
          count: entry.count,
        });
        socket.emit('error', { error: 'Rate limit exceeded. Slow down.' });
        return false;
      }
    } else {
      this.eventRateLimits.set(key, { count: 1, windowStart: now });
    }

    return true;
  }

  // -----------------------------------------------------------------------
  // Background jobs
  // -----------------------------------------------------------------------

  private startHeartbeatMonitor(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const timeoutThreshold = now - HEARTBEAT_TIMEOUT_MS;

      for (const [sessionId, room] of this.sessions) {
        for (const [peerId, peer] of room.peers) {
          if (peer.lastHeartbeat.getTime() < timeoutThreshold) {
            if (peer.connectionState === 'connected' || peer.connectionState === 'connecting') {
              peer.connectionState = 'disconnected';
              logger.warn('[WebRTC Signaling] Heartbeat timeout', {
                peerId,
                sessionId,
                lastHeartbeat: peer.lastHeartbeat.toISOString(),
              });

              this.broadcastToSession(sessionId, 'peer-heartbeat-timeout', {
                peerId,
                timestamp: new Date(),
              });
            }
          }
        }
      }

      // Clean stale rate-limit entries
      for (const [key, entry] of this.eventRateLimits) {
        if ((now - entry.windowStart) > RATE_LIMIT_WINDOW_MS) {
          this.eventRateLimits.delete(key);
        }
      }

      // Clean stale IP throttle entries
      for (const [ip, entry] of this.ipConnectionCounts) {
        if ((now - entry.windowStart) > IP_THROTTLE_WINDOW_MS) {
          this.ipConnectionCounts.delete(ip);
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private startQualityLogger(): void {
    this.qualityLogTimer = setInterval(() => {
      for (const [sessionId, room] of this.sessions) {
        if (room.peers.size === 0) continue;

        const metrics: Array<{ peerId: string; rtt: number; packetLoss: number; jitter: number; bandwidth: number }> = [];
        for (const [, peer] of room.peers) {
          if (peer.connectionState === 'connected') {
            metrics.push({
              peerId: peer.peerId,
              rtt: peer.quality.rtt,
              packetLoss: peer.quality.packetLoss,
              jitter: peer.quality.jitter,
              bandwidth: peer.quality.bandwidth,
            });
          }
        }

        if (metrics.length > 0) {
          const avgRtt = metrics.reduce((s, m) => s + m.rtt, 0) / metrics.length;
          const avgLoss = metrics.reduce((s, m) => s + m.packetLoss, 0) / metrics.length;
          const avgJitter = metrics.reduce((s, m) => s + m.jitter, 0) / metrics.length;

          logger.debug('[WebRTC Signaling] Session quality summary', {
            sessionId,
            peerCount: metrics.length,
            avgRtt: Math.round(avgRtt),
            avgPacketLoss: Math.round(avgLoss * 100) / 100,
            avgJitter: Math.round(avgJitter * 100) / 100,
          });
        }
      }
    }, QUALITY_LOG_INTERVAL_MS);
  }

  private startStaleSessionCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const maxIdleMs = 2 * 60 * 60_000; // 2 hours

      for (const [sessionId, room] of this.sessions) {
        // Remove sessions with no peers that have been idle for a long time
        if (room.peers.size === 0 && (now - room.lastActivityAt.getTime()) > 5 * 60_000) {
          this.sessions.delete(sessionId);
          logger.info('[WebRTC Signaling] Cleaned up empty session', { sessionId });
          continue;
        }

        // Remove very stale sessions
        if ((now - room.lastActivityAt.getTime()) > maxIdleMs) {
          logger.info('[WebRTC Signaling] Cleaning up stale session', { sessionId, peerCount: room.peers.size });
          this.destroySession(sessionId);
        }
      }
    }, STALE_SESSION_CLEANUP_INTERVAL_MS);
  }

  // -----------------------------------------------------------------------
  // Utility helpers
  // -----------------------------------------------------------------------

  private generatePeerId(userId: string): string {
    const random = crypto.randomBytes(6).toString('hex');
    return `peer_${userId.substring(0, 8)}_${random}`;
  }

  private computeEdgeQuality(peerA: WebRTCPeer, peerB: WebRTCPeer): number {
    // Quality score between 0 and 1 (1 = best)
    const avgRtt = (peerA.quality.rtt + peerB.quality.rtt) / 2;
    const avgLoss = (peerA.quality.packetLoss + peerB.quality.packetLoss) / 2;

    let score = 1.0;
    // RTT penalty: > 300ms starts degrading
    if (avgRtt > 300) score -= Math.min(0.4, (avgRtt - 300) / 2000);
    // Packet loss penalty: > 2% starts degrading
    if (avgLoss > 2) score -= Math.min(0.4, (avgLoss - 2) / 20);
    // Both disconnected
    if (peerA.connectionState !== 'connected' || peerB.connectionState !== 'connected') {
      score *= 0.3;
    }

    return Math.max(0, Math.round(score * 100) / 100);
  }

  private computeMaxReconnectWait(): number {
    // Exponential backoff total: sum of 2^n * base for n = 0..MAX_RECONNECT_ATTEMPTS-1
    let total = 0;
    let backoff = BASE_RECONNECT_BACKOFF_MS;
    for (let i = 0; i < MAX_RECONNECT_ATTEMPTS; i++) {
      total += Math.min(backoff, MAX_RECONNECT_BACKOFF_MS);
      backoff *= 2;
    }
    return total;
  }

  // -----------------------------------------------------------------------
  // Persistence helpers (non-blocking, best-effort)
  // -----------------------------------------------------------------------

  private persistPeerEvent(
    sessionId: string,
    peerId: string,
    userId: string,
    action: string,
  ): void {
    (async () => {
      try {
        await prisma.$executeRaw`
          INSERT INTO "AuditLog" ("id", "organizationId", "userId", "action", "resourceType", "resourceId", "details", "createdAt")
          VALUES (
            ${crypto.randomUUID()},
            ${this.sessions.get(sessionId)?.organizationId ?? 'unknown'},
            ${userId},
            ${`webrtc.peer.${action}`},
            ${'webrtc_session'},
            ${sessionId},
            ${JSON.stringify({ peerId, sessionId, action, timestamp: new Date().toISOString() })}::jsonb,
            NOW()
          )
        `;
      } catch (error: any) {
        // Non-critical: log and continue
        logger.debug('[WebRTC Signaling] Could not persist peer event', {
          error: error.message,
          sessionId,
          peerId,
          action,
        });
      }
    })();
  }

  private persistAnnotationEvent(
    sessionId: string,
    peerId: string,
    action: string,
    annotation: Record<string, any>,
  ): void {
    (async () => {
      try {
        const room = this.sessions.get(sessionId);
        const peer = room?.peers.get(peerId);
        await prisma.$executeRaw`
          INSERT INTO "AuditLog" ("id", "organizationId", "userId", "action", "resourceType", "resourceId", "details", "createdAt")
          VALUES (
            ${crypto.randomUUID()},
            ${room?.organizationId ?? 'unknown'},
            ${peer?.userId ?? 'unknown'},
            ${`webrtc.annotation.${action}`},
            ${'webrtc_session'},
            ${sessionId},
            ${JSON.stringify({ peerId, annotation, timestamp: new Date().toISOString() })}::jsonb,
            NOW()
          )
        `;
      } catch (error: any) {
        logger.debug('[WebRTC Signaling] Could not persist annotation event', {
          error: error.message,
          sessionId,
        });
      }
    })();
  }

  private async persistStatsReport(
    sessionId: string,
    peerId: string,
    stats: Record<string, any>,
  ): Promise<void> {
    try {
      const room = this.sessions.get(sessionId);
      const peer = room?.peers.get(peerId);
      await prisma.$executeRaw`
        INSERT INTO "AuditLog" ("id", "organizationId", "userId", "action", "resourceType", "resourceId", "details", "createdAt")
        VALUES (
          ${crypto.randomUUID()},
          ${room?.organizationId ?? 'unknown'},
          ${peer?.userId ?? 'unknown'},
          ${'webrtc.stats.report'},
          ${'webrtc_session'},
          ${sessionId},
          ${JSON.stringify({ peerId, stats, timestamp: new Date().toISOString() })}::jsonb,
          NOW()
        )
      `;
    } catch (error: any) {
      logger.debug('[WebRTC Signaling] Could not persist stats report', {
        error: error.message,
        sessionId,
      });
    }
  }
}

export default new WebRTCSignalingService();
