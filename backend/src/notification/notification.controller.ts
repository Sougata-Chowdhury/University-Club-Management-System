import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { NotificationService } from './notification.service';
import { CreateNotificationDto, UpdateNotificationDto, BulkNotificationDto, NotificationPreferencesDto } from '../dto/notification.dto';

interface AuthRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Create a notification (Admin only)
  @Post()
  async createNotification(@Request() req: AuthRequest, @Body() createNotificationDto: CreateNotificationDto) {
    try {
      // For now, allow any authenticated user to create notifications
      // In production, you might want to restrict this to admins only
      const notification = await this.notificationService.createNotification(
        req.user.userId,
        createNotificationDto
      );
      
      return {
        success: true,
        message: 'Notification created successfully',
        data: notification,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create notification',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Create bulk notifications (Admin only)
  @Post('bulk')
  async createBulkNotification(@Request() req: AuthRequest, @Body() bulkNotificationDto: BulkNotificationDto) {
    try {
      // TODO: Add admin role check
      const result = await this.notificationService.createBulkNotification(bulkNotificationDto);
      
      return {
        success: true,
        message: `Bulk notification sent. Sent: ${result.sent}, Failed: ${result.failed}`,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to send bulk notifications',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get user's notifications
  @Get()
  async getUserNotifications(
    @Request() req: AuthRequest,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('unreadOnly') unreadOnly: string = 'false',
  ) {
    try {
      const isUnreadOnly = unreadOnly === 'true';
      const result = await this.notificationService.getUserNotifications(
        req.user.userId,
        page,
        limit,
        isUnreadOnly
      );

      return {
        success: true,
        message: 'Notifications retrieved successfully',
        data: result,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve notifications',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get notification statistics
  @Get('stats')
  async getNotificationStats(@Request() req: AuthRequest) {
    try {
      const stats = await this.notificationService.getNotificationStats(req.user.userId);
      
      return {
        success: true,
        message: 'Notification statistics retrieved successfully',
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve notification statistics',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get notification preferences
  @Get('preferences')
  async getNotificationPreferences(@Request() req: AuthRequest) {
    try {
      const preferences = await this.notificationService.getNotificationPreferences(req.user.userId);
      
      return {
        success: true,
        message: 'Notification preferences retrieved successfully',
        data: preferences,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve notification preferences',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Update notification preferences
  @Put('preferences')
  async updateNotificationPreferences(
    @Request() req: AuthRequest,
    @Body() preferences: NotificationPreferencesDto,
  ) {
    try {
      const updatedUser = await this.notificationService.updateNotificationPreferences(
        req.user.userId,
        preferences
      );
      
      return {
        success: true,
        message: 'Notification preferences updated successfully',
        data: updatedUser.settings,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to update notification preferences',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Mark notification as read
  @Put(':id/read')
  async markNotificationAsRead(@Request() req: AuthRequest, @Param('id') notificationId: string) {
    try {
      const notification = await this.notificationService.markAsRead(req.user.userId, notificationId);
      
      return {
        success: true,
        message: 'Notification marked as read',
        data: notification,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to mark notification as read',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Mark all notifications as read
  @Put('read-all')
  async markAllNotificationsAsRead(@Request() req: AuthRequest) {
    try {
      const result = await this.notificationService.markAllAsRead(req.user.userId);
      
      return {
        success: true,
        message: `${result.modifiedCount} notifications marked as read`,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to mark notifications as read',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Delete a notification
  @Delete(':id')
  async deleteNotification(@Request() req: AuthRequest, @Param('id') notificationId: string) {
    try {
      await this.notificationService.deleteNotification(req.user.userId, notificationId);
      
      return {
        success: true,
        message: 'Notification deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to delete notification',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Delete all read notifications
  @Delete('read')
  async deleteReadNotifications(@Request() req: AuthRequest) {
    try {
      const result = await this.notificationService.deleteReadNotifications(req.user.userId);
      
      return {
        success: true,
        message: `${result.deletedCount} read notifications deleted`,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to delete read notifications',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Helper endpoints for different notification types
  @Post('club-approval')
  async createClubApprovalNotification(
    @Request() req: AuthRequest,
    @Body() data: { clubName: string; clubId: string; userId?: string }
  ) {
    try {
      const targetUserId = data.userId || req.user.userId;
      await this.notificationService.createClubApprovalNotification(
        targetUserId,
        data.clubName,
        data.clubId
      );
      
      return {
        success: true,
        message: 'Club approval notification created',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create club approval notification',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('club-join')
  async createClubJoinNotification(
    @Request() req: AuthRequest,
    @Body() data: { clubName: string; clubId: string }
  ) {
    try {
      await this.notificationService.createClubJoinNotification(
        req.user.userId,
        data.clubName,
        data.clubId
      );
      
      return {
        success: true,
        message: 'Club join notification created',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create club join notification',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('event-registration')
  async createEventRegistrationNotification(
    @Request() req: AuthRequest,
    @Body() data: { eventName: string; eventId: string }
  ) {
    try {
      await this.notificationService.createEventRegistrationNotification(
        req.user.userId,
        data.eventName,
        data.eventId
      );
      
      return {
        success: true,
        message: 'Event registration notification created',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create event registration notification',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('payment-approved')
  async createPaymentApprovedNotification(
    @Request() req: AuthRequest,
    @Body() data: { amount: number; description: string; paymentId: string; userId?: string }
  ) {
    try {
      const targetUserId = data.userId || req.user.userId;
      await this.notificationService.createPaymentApprovedNotification(
        targetUserId,
        data.amount,
        data.description,
        data.paymentId
      );
      
      return {
        success: true,
        message: 'Payment approval notification created',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create payment approval notification',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
