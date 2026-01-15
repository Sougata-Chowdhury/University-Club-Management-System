import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Club, ClubDocument } from '../schemas/club.schema';
import { Event, EventDocument } from '../schemas/event.schema';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { Announcement, AnnouncementDocument } from '../schemas/announcement.schema';
import { AdminStatsDto, UserManagementDto, ClubManagementDto, SystemReportDto } from './admin.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Announcement.name) private announcementModel: Model<AnnouncementDocument>,
    @Inject(forwardRef(() => NotificationService)) private notificationService: NotificationService,
  ) {}

  // System Statistics
  async getSystemStats(): Promise<AdminStatsDto> {
    console.log('AdminService: Getting system statistics');
    
    const [
      totalUsers,
      activeUsers,
      totalClubs,
      pendingClubs,
      approvedClubs,
      totalEvents,
      upcomingEvents,
      totalPayments,
      pendingPayments,
      totalAnnouncements,
      recentUsers,
      recentClubs,
      recentEvents
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ isActive: true }),
      this.clubModel.countDocuments(),
      this.clubModel.countDocuments({ status: 'pending' }),
      this.clubModel.countDocuments({ status: 'approved' }),
      this.eventModel.countDocuments(),
      this.eventModel.countDocuments({ date: { $gte: new Date() } }),
      this.paymentModel.countDocuments(),
      this.paymentModel.countDocuments({ status: 'pending' }),
      this.announcementModel.countDocuments(),
      this.userModel.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email createdAt'),
      this.clubModel.find().sort({ createdAt: -1 }).limit(5).select('name description status createdAt'),
      this.eventModel.find().sort({ createdAt: -1 }).limit(5).select('title description date createdAt')
    ]);

    // Calculate revenue
    const revenueResult = await this.paymentModel.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Growth statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [newUsersLast30Days, newClubsLast30Days, newEventsLast30Days] = await Promise.all([
      this.userModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      this.clubModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      this.eventModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    return {
      totalUsers,
      activeUsers,
      totalClubs,
      pendingClubs,
      approvedClubs,
      totalEvents,
      upcomingEvents,
      totalPayments,
      pendingPayments,
      totalAnnouncements,
      totalRevenue,
      newUsersLast30Days,
      newClubsLast30Days,
      newEventsLast30Days,
      recentUsers,
      recentClubs,
      recentEvents
    };
  }

  // User Management
  async getAllUsers(page: number = 1, limit: number = 20, search?: string): Promise<UserManagementDto> {
    console.log('AdminService: Getting all users for management');
    
    const skip = (page - 1) * limit;
    let query = {};
    
    if (search) {
      query = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const [users, total] = await Promise.all([
      this.userModel.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(query)
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };
  }

  async toggleUserStatus(userId: string, adminId: string): Promise<{ message: string; user: any }> {
    console.log('AdminService: Toggling user status', userId);
    
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'admin') {
      throw new ForbiddenException('Cannot modify admin user status');
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { isActive: !user.isActive },
      { new: true }
    ).select('-password');

    // Log admin activity
    await this.logAdminActivity(adminId, {
      action: user.isActive ? 'deactivate_user' : 'activate_user',
      targetId: userId,
      details: `${user.isActive ? 'Deactivated' : 'Activated'} user: ${user.email}`
    });

    return {
      message: `User ${user.isActive ? 'deactivated' : 'activated'} successfully`,
      user: updatedUser
    };
  }

  async deleteUser(userId: string, adminId: string): Promise<{ message: string }> {
    console.log('AdminService: Deleting user', userId);
    
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'admin') {
      throw new ForbiddenException('Cannot delete admin user');
    }

    // Handle user's created clubs
    const userCreatedClubs = await this.clubModel.find({ createdBy: userId });
    
    for (const club of userCreatedClubs) {
      // Delete all events created by this club
      await this.eventModel.deleteMany({ clubId: club._id });
      
      // Remove club from all members' joinedClubs arrays
      await this.userModel.updateMany(
        { joinedClubs: club._id },
        { $pull: { joinedClubs: club._id } }
      );
      
      // Delete the club
      await this.clubModel.findByIdAndDelete(club._id);
    }

    // Delete any events directly created by the user (if applicable)
    await this.eventModel.deleteMany({ createdBy: userId });

    // Remove user from any clubs they joined
    await this.clubModel.updateMany(
      { members: userId },
      { $pull: { members: userId, 'memberApplications.userId': userId } }
    );

    // Delete the user
    await this.userModel.findByIdAndDelete(userId);

    // Log admin activity
    await this.logAdminActivity(adminId, {
      action: 'delete_user',
      targetId: userId,
      details: `Deleted user: ${user.email} and all associated clubs/events`
    });

    return { 
      message: `User deleted successfully. ${userCreatedClubs.length} clubs and their associated events were also deleted.`
    };
  }

  // Club Management
  async getPendingClubs(): Promise<ClubManagementDto> {
    console.log('AdminService: Getting pending clubs');
    
    const clubs = await this.clubModel.find({ status: 'pending' })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    return { clubs };
  }

  async approveClub(clubId: string, adminId: string): Promise<{ message: string; club: any }> {
    console.log('AdminService: Approving club', clubId);
    
    const club = await this.clubModel.findById(clubId).populate('createdBy', 'firstName lastName email _id');
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    if (club.status !== 'pending') {
      throw new BadRequestException('Club is not pending approval');
    }

    const updatedClub = await this.clubModel.findByIdAndUpdate(
      clubId,
      { status: 'approved' },
      { new: true }
    ).populate('createdBy', 'firstName lastName email');

    // Send approval notification to club creator
    try {
      await this.notificationService.createClubApprovalNotification(
        (club.createdBy as any)._id.toString(),
        club.name,
        clubId
      );
    } catch (notificationError) {
      console.error('Failed to send club approval notification:', notificationError);
      // Don't fail the approval if notification fails
    }

    // Log admin activity
    await this.logAdminActivity(adminId, {
      action: 'approve_club',
      targetId: clubId,
      details: `Approved club: ${club.name}`
    });

    return {
      message: 'Club approved successfully',
      club: updatedClub
    };
  }

  async rejectClub(clubId: string, reason: string, adminId: string): Promise<{ message: string }> {
    console.log('AdminService: Rejecting club', clubId);
    
    const club = await this.clubModel.findById(clubId);
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    if (club.status !== 'pending') {
      throw new BadRequestException('Club is not pending approval');
    }

    // Delete all events associated with this club
    const deletedEvents = await this.eventModel.deleteMany({ clubId: clubId });
    console.log(`Deleted ${deletedEvents.deletedCount} events for rejected club`);

    // Remove club from all members' joinedClubs arrays
    await this.userModel.updateMany(
      { joinedClubs: clubId },
      { $pull: { joinedClubs: clubId } }
    );

    await this.clubModel.findByIdAndUpdate(clubId, { 
      status: 'rejected',
      rejectionReason: reason 
    });

    // Log admin activity
    await this.logAdminActivity(adminId, {
      action: 'reject_club',
      targetId: clubId,
      details: `Rejected club: ${club.name}. Reason: ${reason}. Deleted ${deletedEvents.deletedCount} associated events.`
    });

    return { 
      message: `Club rejected successfully. ${deletedEvents.deletedCount} associated events were also deleted.`
    };
  }

  // System Reports
  async generateSystemReport(startDate?: Date, endDate?: Date): Promise<SystemReportDto> {
    console.log('AdminService: Generating system report');
    
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate || new Date();

    const [
      userGrowth,
      clubGrowth,
      eventGrowth,
      paymentStats,
      topClubs,
      topEvents
    ] = await Promise.all([
      this.userModel.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { 
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      this.clubModel.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { 
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      this.eventModel.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { 
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      this.paymentModel.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: 'approved' } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 },
            averageAmount: { $avg: '$amount' }
          }
        }
      ]),
      this.clubModel.aggregate([
        { $match: { status: 'approved' } },
        { 
          $addFields: { 
            memberCount: { 
              $cond: {
                if: { $isArray: '$members' },
                then: { $size: '$members' },
                else: 0
              }
            }
          }
        },
        { $sort: { memberCount: -1 } },
        { $limit: 10 },
        { $project: { name: 1, memberCount: 1, description: 1 } }
      ]),
      this.eventModel.aggregate([
        { $match: { date: { $gte: new Date() } } },
        { 
          $addFields: { 
            registrationCount: { 
              $cond: {
                if: { $isArray: '$registrations' },
                then: { $size: '$registrations' },
                else: 0
              }
            }
          }
        },
        { $sort: { registrationCount: -1 } },
        { $limit: 10 },
        { $project: { title: 1, registrationCount: 1, date: 1 } }
      ])
    ]);

    return {
      period: { start, end },
      userGrowth,
      clubGrowth,
      eventGrowth,
      paymentStats: paymentStats[0] || { totalAmount: 0, totalCount: 0, averageAmount: 0 },
      topClubs,
      topEvents
    };
  }

  // Admin Activity Logging
  private async logAdminActivity(adminId: string, activity: {
    action: string;
    targetId?: string;
    details: string;
  }): Promise<void> {
    try {
      await this.userModel.findByIdAndUpdate(adminId, {
        $push: {
          activityLog: {
            $each: [{
              id: new Date().getTime().toString(),
              activityType: 'admin_action',
              description: `${activity.action}: ${activity.details}`,
              timestamp: new Date(),
              relatedId: activity.targetId,
              metadata: activity
            }],
            $slice: -100
          }
        }
      });
    } catch (error) {
      console.error('Error logging admin activity:', error);
    }
  }

  // Payment Management
  async getPendingPayments(): Promise<any[]> {
    console.log('AdminService: Getting pending payments');
    
    return this.paymentModel.find({ status: 'pending' })
      .populate('userId', 'firstName lastName email')
      .populate('clubId', 'name')
      .populate('eventId', 'title')
      .sort({ createdAt: -1 })
      .lean();
  }

  async approvePayment(paymentId: string, adminId: string): Promise<{ message: string }> {
    console.log('AdminService: Approving payment', paymentId);
    
    const payment = await this.paymentModel.findById(paymentId).populate('userId', 'firstName lastName email _id');
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.paymentModel.findByIdAndUpdate(paymentId, { 
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date()
    });

    // Send payment approval notification
    try {
      await this.notificationService.createPaymentApprovedNotification(
        (payment.userId as any)._id.toString(),
        payment.amount,
        payment.notes || 'Payment',
        paymentId
      );
    } catch (notificationError) {
      console.error('Failed to send payment approval notification:', notificationError);
      // Don't fail the approval if notification fails
    }

    // Log admin activity
    await this.logAdminActivity(adminId, {
      action: 'approve_payment',
      targetId: paymentId,
      details: `Approved payment of $${payment.amount}`
    });

    return { message: 'Payment approved successfully' };
  }

  async rejectPayment(paymentId: string, reason: string, adminId: string): Promise<{ message: string }> {
    console.log('AdminService: Rejecting payment', paymentId);
    
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.paymentModel.findByIdAndUpdate(paymentId, { 
      status: 'rejected',
      rejectionReason: reason,
      rejectedBy: adminId,
      rejectedAt: new Date()
    });

    // Log admin activity
    await this.logAdminActivity(adminId, {
      action: 'reject_payment',
      targetId: paymentId,
      details: `Rejected payment of $${payment.amount}. Reason: ${reason}`
    });

    return { message: 'Payment rejected successfully' };
  }
}
