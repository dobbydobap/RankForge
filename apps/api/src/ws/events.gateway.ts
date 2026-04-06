import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IncomingMessage } from 'http';

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  rooms: Set<string>;
}

@WebSocketGateway({
  path: '/ws',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private clients = new Map<string, Set<AuthenticatedSocket>>();
  private rooms = new Map<string, Set<AuthenticatedSocket>>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket, req: IncomingMessage) {
    try {
      // Extract token from query string
      const url = new URL(req.url || '', 'http://localhost');
      const token = url.searchParams.get('token');

      if (token) {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'dev-access-secret'),
        });
        client.userId = payload.sub;
      }
    } catch {
      // Anonymous connection allowed (for public leaderboards)
    }

    client.rooms = new Set();

    if (client.userId) {
      if (!this.clients.has(client.userId)) {
        this.clients.set(client.userId, new Set());
      }
      this.clients.get(client.userId)!.add(client);
    }

    this.logger.log(
      `Client connected: ${client.userId || 'anonymous'} (total: ${this.server.clients.size})`,
    );

    // Set up message handling
    client.on('message', (rawData) => {
      try {
        const data = JSON.parse(rawData.toString());
        this.handleClientMessage(client, data);
      } catch {
        // ignore invalid messages
      }
    });
  }

  handleDisconnect(client: AuthenticatedSocket) {
    // Remove from user tracking
    if (client.userId) {
      const userClients = this.clients.get(client.userId);
      if (userClients) {
        userClients.delete(client);
        if (userClients.size === 0) {
          this.clients.delete(client.userId);
        }
      }
    }

    // Remove from all rooms
    for (const room of client.rooms) {
      const roomClients = this.rooms.get(room);
      if (roomClients) {
        roomClients.delete(client);
        if (roomClients.size === 0) {
          this.rooms.delete(room);
        }
      }
    }

    this.logger.log(`Client disconnected: ${client.userId || 'anonymous'}`);
  }

  private handleClientMessage(client: AuthenticatedSocket, data: any) {
    switch (data.event) {
      case 'contest:join':
        this.joinRoom(client, `contest:${data.contestId}`);
        break;
      case 'contest:leave':
        this.leaveRoom(client, `contest:${data.contestId}`);
        break;
      case 'submission:subscribe':
        this.joinRoom(client, `submission:${data.submissionId}`);
        break;
    }
  }

  private joinRoom(client: AuthenticatedSocket, room: string) {
    client.rooms.add(room);
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(client);
    this.logger.debug(`${client.userId || 'anon'} joined room ${room}`);
  }

  private leaveRoom(client: AuthenticatedSocket, room: string) {
    client.rooms.delete(room);
    const roomClients = this.rooms.get(room);
    if (roomClients) {
      roomClients.delete(client);
      if (roomClients.size === 0) {
        this.rooms.delete(room);
      }
    }
  }

  // ── Public API for other services ──

  /** Send event to all clients in a room */
  emitToRoom(room: string, event: string, data: any) {
    const roomClients = this.rooms.get(room);
    if (!roomClients) return;

    const message = JSON.stringify({ event, data });
    for (const client of roomClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  /** Send event to a specific user (all their connected clients) */
  emitToUser(userId: string, event: string, data: any) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    const message = JSON.stringify({ event, data });
    for (const client of userClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  /** Send event to all connected clients */
  emitToAll(event: string, data: any) {
    const message = JSON.stringify({ event, data });
    for (const client of this.server.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  /** Get count of clients in a room */
  getRoomSize(room: string): number {
    return this.rooms.get(room)?.size || 0;
  }
}
