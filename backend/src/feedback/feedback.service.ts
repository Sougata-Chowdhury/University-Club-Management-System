import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Feedback, FeedbackDocument } from './feedback.schema';
import { CreateFeedbackDto, UpdateFeedbackStatusDto, FeedbackQueryDto, FeedbackStatsDto, VoteFeedbackDto } from './feedback.dto';
import { NotificationService } from '../notification/notification.service';
import { UserService } from '../user/user.service';
import { ClubService } from '../club/club.service';
import { EventService } from '../event/event.service';
import { Club } from '../schemas/club.schema';
import { Event } from '../schemas/event.schema';
import { User } from '../schemas/user.schema';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>,
    @InjectModel(Club.name) private clubModel: Model<Club>,
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(User.name) private userModel: Model<User>,
    private notificationService: NotificationService,
    private userService: UserService,
    private clubService: ClubService,
    private eventService: EventService,
  ) {}

  async createFeedback(createFeedbackDto: CreateFeedbackDto, userId: string): Promise<Feedback> {
    try {
      // Validate target exists if targetId is provided
      if (createFeedbackDto.targetId) {
        await this.validateTarget(createFeedbackDto.targetType, createFeedbackDto.targetId);
      }

      // Validate user authorization for club and event feedback
      if (createFeedbackDto.targetType === 'club' && createFeedbackDto.targetId) {
        await this.validateClubMembership(userId, createFeedbackDto.targetId);
      }

      if (createFeedbackDto.targetType === 'event' && createFeedbackDto.targetId) {
        await this.validateEventAttendance(userId, createFeedbackDto.targetId);
      }

      // Check if user already submitted feedback for this target
      if (createFeedbackDto.targetId) {
        const existingFeedback = await this.feedbackModel.findOne({
          userId: new Types.ObjectId(userId),
          targetType: createFeedbackDto.targetType,
          targetId: createFeedbackDto.targetId,
        });

        if (existingFeedback) {
          throw new BadRequestException('You have already submitted feedback for this item');
        }
      }

      const feedback = new this.feedbackModel({
        ...createFeedbackDto,
        userId: new Types.ObjectId(userId),
        targetId: createFeedbackDto.targetId ? new Types.ObjectId(createFeedbackDto.targetId) : null,
      });

      const savedFeedback = await feedback.save();

      // Send notification to admins for new feedback
      await this.notifyAdmins(savedFeedback);

      // If feedback is for a specific target, notify relevant users
      if (createFeedbackDto.targetId) {
        await this.notifyTargetUsers(savedFeedback);
      }

      return savedFeedback;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to create feedback');
    }
  }

  async getFeedback(query: FeedbackQueryDto, userId?: string, isAdmin?: boolean): Promise<{
    feedback: Feedback[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;
    
    const mongoQuery: any = {};

    // Apply filters
    if (filters.targetType) {
      mongoQuery.targetType = filters.targetType;
    }
    if (filters.targetId) {
      mongoQuery.targetId = new Types.ObjectId(filters.targetId);
    }
    if (filters.category) {
      mongoQuery.category = filters.category;
    }
    if (filters.status) {
      mongoQuery.status = filters.status;
    }
    if (filters.userId) {
      mongoQuery.userId = new Types.ObjectId(filters.userId);
    }

    // If not admin AND not explicitly filtering by userId, only show approved feedback or user's own pending feedback (exclude rejected)
    if (!isAdmin && !filters.userId) {
      mongoQuery.$or = [
        { status: 'approved' },
        { 
          userId: new Types.ObjectId(userId),
          status: { $ne: 'rejected' } // Exclude rejected feedback from user's own view
        }
      ];
    }

    const total = await this.feedbackModel.countDocuments(mongoQuery);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const feedback = await this.feedbackModel
      .find(mongoQuery)
      .populate('userId', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Populate target information
    const populatedFeedback = await this.populateTargetInfo(feedback);

    return {
      feedback: populatedFeedback,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getFeedbackById(id: string, userId?: string, isAdmin?: boolean): Promise<Feedback> {
    const feedback = await this.feedbackModel
      .findById(id)
      .populate('userId', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName')
      .exec();

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    // Check permissions
    if (!isAdmin && feedback.status !== 'approved' && feedback.userId._id.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const [populatedFeedback] = await this.populateTargetInfo([feedback]);
    return populatedFeedback;
  }

  async updateFeedbackStatus(
    id: string,
    updateStatusDto: UpdateFeedbackStatusDto,
    adminId: string,
  ): Promise<Feedback> {
    const feedback = await this.feedbackModel.findById(id);
    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    feedback.status = updateStatusDto.status as any;
    if (updateStatusDto.adminResponse) {
      feedback.adminResponse = updateStatusDto.adminResponse;
    }
    feedback.reviewedBy = new Types.ObjectId(adminId);
    feedback.respondedAt = new Date();

    const updatedFeedback = await feedback.save();

    // Notify user about status change
    await this.notifyUserStatusChange(updatedFeedback);

    return updatedFeedback;
  }

  async voteFeedback(id: string, voteDto: VoteFeedbackDto, userId: string): Promise<Feedback> {
    const feedback = await this.feedbackModel.findById(id);
    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const hasVoted = feedback.votedUsers.some(votedUser => votedUser.toString() === userId);

    if (hasVoted) {
      throw new BadRequestException('You have already voted on this feedback');
    }

    if (voteDto.helpful) {
      feedback.helpfulVotes += 1;
    }
    feedback.votedUsers.push(userObjectId);

    return await feedback.save();
  }

  async getFeedbackStats(targetType?: string, targetId?: string): Promise<FeedbackStatsDto> {
    const matchQuery: any = { status: 'approved' };
    if (targetType) matchQuery.targetType = targetType;
    if (targetId) matchQuery.targetId = new Types.ObjectId(targetId);

    // Calculate date range for current month (not 30 days)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [stats] = await this.feedbackModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratings: { $push: '$rating' },
          categories: { $push: '$category' },
          thisMonth: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $gte: ['$createdAt', startOfMonth] },
                    { $lte: ['$createdAt', endOfMonth] }
                  ]
                }, 
                1, 
                0
              ]
            }
          }
        }
      }
    ]);

    if (!stats) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryBreakdown: {},
        thisMonth: 0,
        pendingReview: 0,
        approvedFeedback: 0,
        highRatedFeedback: 0,
        lowRatedFeedback: 0,
      };
    }

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats.ratings.forEach(rating => {
      ratingDistribution[rating]++;
    });

    // Calculate category breakdown
    const categoryBreakdown = {};
    stats.categories.forEach(category => {
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    // Get additional stats
    const pendingReview = await this.feedbackModel.countDocuments({ 
      ...matchQuery, 
      status: 'pending' 
    });

    const highRatedFeedback = stats.ratings.filter(rating => rating >= 4).length;
    const lowRatedFeedback = stats.ratings.filter(rating => rating <= 2).length;

    return {
      totalFeedback: stats.totalFeedback,
      averageRating: Math.round(stats.averageRating * 10) / 10,
      ratingDistribution,
      categoryBreakdown,
      thisMonth: stats.thisMonth, // Use the calculated monthly count
      pendingReview,
      approvedFeedback: stats.totalFeedback,
      highRatedFeedback,
      lowRatedFeedback,
    };
  }

  async deleteFeedback(id: string, userId: string, isAdmin?: boolean): Promise<void> {
    const feedback = await this.feedbackModel.findById(id);
    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    // Only allow deletion by the author or admin
    if (!isAdmin && feedback.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.feedbackModel.findByIdAndDelete(id);
  }

  private async validateTarget(targetType: string, targetId: string): Promise<void> {
    try {
      switch (targetType) {
        case 'club':
          const club = await this.clubModel.findById(targetId);
          if (!club) throw new Error('Club not found');
          break;
        case 'event':
          const event = await this.eventModel.findById(targetId);
          if (!event) throw new Error('Event not found');
          break;
        case 'announcement':
          // Add announcement service validation if available
          break;
        default:
          // For general, course, instructor, facility - no specific validation needed
          break;
      }
    } catch (error) {
      throw new BadRequestException(`Invalid ${targetType} ID`);
    }
  }

  private async populateTargetInfo(feedback: Feedback[]): Promise<Feedback[]> {
    const results: any[] = [];
    
    for (const item of feedback) {
      const result = { ...(item as any).toObject() };
      
      if (item.targetId) {
        try {
          switch (item.targetType) {
            case 'club':
              const club = await this.clubModel.findById(item.targetId.toString());
              if (club) {
                result.targetInfo = { name: club.name, description: club.description };
              }
              break;
            case 'event':
              const event = await this.eventModel.findById(item.targetId.toString());
              if (event) {
                result.targetInfo = { title: event.name, description: event.description };
              }
              break;
            default:
              result.targetInfo = null;
              break;
          }
        } catch (error) {
          result.targetInfo = null;
        }
      }
      
      results.push(result);
    }
    
    return results;
  }

  private async notifyAdmins(feedback: Feedback): Promise<void> {
    try {
      const admins = await this.userModel.find({ role: 'admin' });
      
      for (const admin of admins) {
        await this.notificationService.createNotification(admin._id.toString(), {
          type: 'feedback',
          title: 'New Feedback Submitted',
          message: `New ${feedback.targetType} feedback received with ${feedback.rating} stars`,
          relatedType: 'Feedback',
          relatedId: (feedback as any)._id.toString(),
        });
      }
    } catch (error) {
      console.error('Failed to notify admins:', error);
    }
  }

  private async notifyTargetUsers(feedback: Feedback): Promise<void> {
    try {
      if (feedback.targetType === 'club' && feedback.targetId) {
        const club = await this.clubModel.findById(feedback.targetId.toString());
        if (club && club.createdBy) {
          await this.notificationService.createNotification(club.createdBy.toString(), {
            type: 'feedback',
            title: 'New Club Feedback',
            message: `Your club "${club.name}" received new feedback`,
            relatedType: 'Feedback',
            relatedId: (feedback as any)._id.toString(),
          });
        }
      }
    } catch (error) {
      console.error('Failed to notify target users:', error);
    }
  }

  private async notifyUserStatusChange(feedback: Feedback): Promise<void> {
    try {
      await this.notificationService.createNotification(feedback.userId.toString(), {
        type: 'feedback',
        title: 'Feedback Status Updated',
        message: `Your feedback has been ${feedback.status}`,
        relatedType: 'Feedback',
        relatedId: (feedback as any)._id.toString(),
      });
    } catch (error) {
      console.error('Failed to notify user about status change:', error);
    }
  }
  private async validateClubMembership(userId: string, clubId: string): Promise<void> {
    const club = await this.clubModel.findById(clubId);
    
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    const userIdStr = String(userId);

    const isCreator = club.createdBy?.toString() === userIdStr;
    const isMember = club.members?.some(memberId => memberId.toString() === userIdStr);
    const hasApprovedApplication = club.memberApplications?.some(
      app => app.userId.toString() === userIdStr && app.status === 'approved'
    );

    // Debug short log (kept minimal)
    console.log('CLUB VALIDATION:', { userId: userIdStr, clubId, isCreator, isMember, hasApprovedApplication });

    if (!isCreator && !isMember && !hasApprovedApplication) {
      throw new ForbiddenException('You can only provide feedback for clubs you are a member of');
    }
  }

  private async validateEventAttendance(userId: string, eventId: string): Promise<void> {
    const event = await this.eventModel.findById(eventId);
    
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if event is in the past
    const now = new Date();
    const eventDate = new Date(event.date);
    
    if (eventDate >= now) {
      throw new BadRequestException('You can only provide feedback for past events');
    }

    // Check if user attended the event
    const userObjectId = new Types.ObjectId(userId);
    const hasAttended = event.attendees?.some(attendeeId => attendeeId.toString() === userId);

    if (!hasAttended) {
      throw new ForbiddenException('You can only provide feedback for events you attended');
    }
  }}
