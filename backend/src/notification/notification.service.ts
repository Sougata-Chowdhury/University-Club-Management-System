import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas/notification.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateNotificationDto, UpdateNotificationDto, BulkNotificationDto, NotificationPreferencesDto } from '../dto/notification.dto';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => NotificationGateway)) private notificationGateway: NotificationGateway,
  ) {}

  // Create a single notification
  async createNotification(userId: string, createNotificationDto: CreateNotificationDto): Promise<Notification> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check user preferences
      const userPrefs = user.settings || {};
      const shouldSend = this.shouldSendNotification(createNotificationDto.type || 'info', userPrefs);
      
      if (!shouldSend) {
        throw new BadRequestException('Notification type disabled for user');
      }

      const notification = new this.notificationModel({
        userId: new Types.ObjectId(userId),
        ...createNotificationDto,
        relatedId: createNotificationDto.relatedId ? new Types.ObjectId(createNotificationDto.relatedId) : undefined,
      });

      const savedNotification = await notification.save();
      
      // Send real-time notification if inApp channel is enabled
      if (savedNotification.channels.inApp) {
        try {
          this.notificationGateway.sendNotificationToUser(userId, savedNotification);
        } catch (error) {
          console.log('WebSocket not available:', error.message);
        }
      }

      // TODO: Implement email and push notification sending
      if (savedNotification.channels.email) {
        await this.sendEmailNotification(user, savedNotification);
      }

      if (savedNotification.channels.push) {
        await this.sendPushNotification(user, savedNotification);
      }

      return savedNotification;
    } catch (error) {
      throw new BadRequestException(`Failed to create notification: ${error.message}`);
    }
  }

  // Create bulk notifications
  async createBulkNotification(bulkNotificationDto: BulkNotificationDto): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    const { userIds, filters, ...notificationData } = bulkNotificationDto;
    
    // Get target users
    let targetUsers: UserDocument[] = [];
    
    if (userIds && userIds.length > 0) {
      targetUsers = await this.userModel.find({ _id: { $in: userIds } });
    } else if (filters) {
      const query: any = {};
      
      if (filters.clubs) {
        query.joinedClubs = { $in: filters.clubs };
      }
      
      if (filters.roles) {
        query.role = { $in: filters.roles };
      }
      
      if (filters.departments) {
        query.department = { $in: filters.departments };
      }
      
      targetUsers = await this.userModel.find(query);
    }

    // Send notifications to each user
    for (const user of targetUsers) {
      try {
        await this.createNotification((user as any)._id.toString(), notificationData);
        sent++;
      } catch (error) {
        console.error(`Failed to send notification to user ${(user as any)._id}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }

  // Get user notifications
  async getUserNotifications(
    userId: string, 
    page: number = 1, 
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const skip = (page - 1) * limit;
    const query: any = { userId: new Types.ObjectId(userId) };
    
    if (unreadOnly) {
      query.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(query),
      this.notificationModel.countDocuments({ userId: new Types.ObjectId(userId), read: false })
    ]);

    return { notifications, total, unreadCount };
  }

  // Mark notification as read
  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: notificationId, userId: new Types.ObjectId(userId) },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true, readAt: new Date() }
    );

    return { modifiedCount: result.modifiedCount };
  }

  // Delete notification
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const result = await this.notificationModel.deleteOne({
      _id: notificationId,
      userId: new Types.ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  // Delete all read notifications
  async deleteReadNotifications(userId: string): Promise<{ deletedCount: number }> {
    const result = await this.notificationModel.deleteMany({
      userId: new Types.ObjectId(userId),
      read: true
    });

    return { deletedCount: result.deletedCount };
  }

  // Update notification preferences
  async updateNotificationPreferences(userId: string, preferences: NotificationPreferencesDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { settings: preferences } },
      { new: true }
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Get notification preferences
  async getNotificationPreferences(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.settings || {
      emailNotifications: true,
      pushNotifications: true,
      clubNotifications: true,
      eventNotifications: true,
      interests: [],
    };
  }

  // Get notification statistics
  async getNotificationStats(userId: string): Promise<any> {
    const stats = await this.notificationModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ["$read", false] }, 1, 0] } },
          byType: {
            $push: {
              type: "$type",
              priority: "$priority",
              read: "$read"
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return { total: 0, unread: 0, byType: {} };
    }

    const typeStats = {};
    stats[0].byType.forEach(item => {
      if (!typeStats[item.type]) {
        typeStats[item.type] = { total: 0, unread: 0 };
      }
      typeStats[item.type].total++;
      if (!item.read) {
        typeStats[item.type].unread++;
      }
    });

    return {
      total: stats[0].total,
      unread: stats[0].unread,
      byType: typeStats
    };
  }

  // Helper method to check if notification should be sent based on user preferences
  private shouldSendNotification(type: string, userSettings: any): boolean {
    switch (type) {
      case 'club':
        return userSettings.clubNotifications !== false;
      case 'event':
        return userSettings.eventNotifications !== false;
      case 'payment':
        return userSettings.emailNotifications !== false; // Use email notifications for payments
      case 'announcement':
        return userSettings.pushNotifications !== false; // Use push notifications for announcements
      case 'admin':
        return userSettings.emailNotifications !== false; // Use email notifications for admin
      case 'reminder':
        return userSettings.pushNotifications !== false; // Use push notifications for reminders
      default:
        return true;
    }
  }

  // Placeholder for email notification
  private async sendEmailNotification(user: UserDocument, notification: NotificationDocument): Promise<void> {
    // TODO: Implement email service integration
    console.log(`Email notification sent to ${user.email}:`, notification.title);
  }

  // Placeholder for push notification
  private async sendPushNotification(user: UserDocument, notification: NotificationDocument): Promise<void> {
    // TODO: Implement push notification service integration
    console.log(`Push notification sent to user ${user._id}:`, notification.title);
  }

  // Create system notifications for common events
  async createClubApprovalNotification(userId: string, clubName: string, clubId: string): Promise<void> {
    await this.createNotification(userId, {
      title: 'Club Approved!',
      message: `Congratulations! Your club "${clubName}" has been approved by the administration.`,
      type: 'club',
      priority: 'success',
      actionUrl: `/clubs/${clubId}`,
      actionText: 'View Club',
      relatedId: clubId,
      relatedType: 'club',
      channels: { email: true, push: true, inApp: true }
    });
  }

  async createClubJoinNotification(userId: string, clubName: string, clubId: string): Promise<void> {
    await this.createNotification(userId, {
      title: 'Welcome to the Club!',
      message: `You have successfully joined ${clubName}. Start exploring events and announcements.`,
      type: 'club',
      priority: 'success',
      actionUrl: `/clubs/${clubId}`,
      actionText: 'View Club',
      relatedId: clubId,
      relatedType: 'club',
      channels: { email: true, push: true, inApp: true }
    });
  }

  async createEventRegistrationNotification(userId: string, eventName: string, eventId: string): Promise<void> {
    await this.createNotification(userId, {
      title: 'Event Registration Confirmed',
      message: `You have successfully registered for "${eventName}". Don't forget to attend!`,
      type: 'event',
      priority: 'success',
      actionUrl: `/events/${eventId}`,
      actionText: 'View Event',
      relatedId: eventId,
      relatedType: 'event',
      channels: { email: true, push: true, inApp: true }
    });
  }

  async createPaymentApprovedNotification(userId: string, amount: number, description: string, paymentId: string): Promise<void> {
    await this.createNotification(userId, {
      title: 'Payment Approved',
      message: `Your payment of $${amount} for "${description}" has been approved and processed successfully.`,
      type: 'payment',
      priority: 'success',
      actionUrl: '/payment-history',
      actionText: 'View Payment History',
      relatedId: paymentId,
      relatedType: 'payment',
      channels: { email: true, push: false, inApp: true }
    });
  }
}
