import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationDocument } from '../schemas/notification.schema';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: '/notifications',
})
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth or query
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      
      if (!token) {
        console.log('No token provided, disconnecting client');
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub || payload.userId;

      if (!userId) {
        console.log('Invalid token payload, disconnecting client');
        client.disconnect();
        return;
      }

      // Associate socket with user
      client.userId = userId;
      this.connectedUsers.set(userId, client.id);

      // Join user to their personal room
      client.join(`user:${userId}`);

      console.log(`User ${userId} connected with socket ${client.id}`);

      // Send connection confirmation
      client.emit('connected', { 
        message: 'Successfully connected to notifications',
        userId: userId 
      });

      // Send any pending real-time notifications
      await this.sendPendingNotifications(userId, client);

    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      console.log(`User ${client.userId} disconnected`);
    }
  }

  // Send notification to specific user
  sendNotificationToUser(userId: string, notification: NotificationDocument) {
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit('newNotification', {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      createdAt: (notification as any).createdAt, // TypeScript fix for timestamps
      metadata: notification.metadata,
    });

    console.log(`Notification sent to user ${userId}:`, notification.title);
  }

  // Send notification to multiple users
  sendNotificationToUsers(userIds: string[], notification: any) {
    userIds.forEach(userId => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  // Broadcast notification to all connected users
  broadcastNotification(notification: any) {
    this.server.emit('broadcast', notification);
    console.log('Broadcast notification sent:', notification.title);
  }

  // Send notification to users in specific clubs
  sendNotificationToClubs(clubIds: string[], notification: any) {
    clubIds.forEach(clubId => {
      this.server.to(`club:${clubId}`).emit('clubNotification', notification);
    });
  }

  @SubscribeMessage('joinClub')
  handleJoinClub(@MessageBody() clubId: string, @ConnectedSocket() client: AuthenticatedSocket) {
    if (client.userId) {
      client.join(`club:${clubId}`);
      client.emit('joinedClub', { clubId, message: `Joined club ${clubId} notifications` });
      console.log(`User ${client.userId} joined club ${clubId} notifications`);
    }
  }

  @SubscribeMessage('leaveClub')
  handleLeaveClub(@MessageBody() clubId: string, @ConnectedSocket() client: AuthenticatedSocket) {
    if (client.userId) {
      client.leave(`club:${clubId}`);
      client.emit('leftClub', { clubId, message: `Left club ${clubId} notifications` });
      console.log(`User ${client.userId} left club ${clubId} notifications`);
    }
  }

  @SubscribeMessage('markAsRead')
  handleMarkAsRead(@MessageBody() notificationId: string, @ConnectedSocket() client: AuthenticatedSocket) {
    if (client.userId) {
      // Emit to the user that the notification was marked as read
      client.emit('notificationRead', { notificationId });
      console.log(`User ${client.userId} marked notification ${notificationId} as read`);
    }
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() client: AuthenticatedSocket) {
    const onlineUserIds = Array.from(this.connectedUsers.keys());
    client.emit('onlineUsers', { users: onlineUserIds, count: onlineUserIds.length });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  // Admin methods
  @SubscribeMessage('adminBroadcast')
  handleAdminBroadcast(@MessageBody() data: any, @ConnectedSocket() client: AuthenticatedSocket) {
    // TODO: Add admin role verification
    if (client.userId && data.message) {
      this.server.emit('adminAnnouncement', {
        title: data.title || 'Admin Announcement',
        message: data.message,
        timestamp: new Date().toISOString(),
        priority: data.priority || 'info',
      });
      
      console.log(`Admin broadcast sent by user ${client.userId}`);
    }
  }

  // Utility methods
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Send typing indicators for chat-like features
  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { room: string; typing: boolean }, @ConnectedSocket() client: AuthenticatedSocket) {
    if (client.userId && data.room) {
      client.to(data.room).emit('userTyping', {
        userId: client.userId,
        typing: data.typing,
      });
    }
  }

  // Handle real-time status updates
  sendStatusUpdate(userId: string, status: string, data?: any) {
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit('statusUpdate', {
      status,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Send unread count updates
  sendUnreadCountUpdate(userId: string, unreadCount: number) {
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit('unreadCountUpdate', {
      unreadCount,
      timestamp: new Date().toISOString(),
    });
  }

  // Helper method to send pending notifications on connection
  private async sendPendingNotifications(userId: string, client: AuthenticatedSocket) {
    // This would typically fetch recent unread notifications from the database
    // For now, just send a welcome message
    client.emit('pendingNotifications', {
      message: 'Connected successfully. You will receive real-time notifications here.',
      timestamp: new Date().toISOString(),
    });
  }

  // Health check for WebSocket connection
  @SubscribeMessage('healthCheck')
  handleHealthCheck(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('healthCheckResponse', {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      userId: client.userId,
      socketId: client.id,
    });
  }
}
