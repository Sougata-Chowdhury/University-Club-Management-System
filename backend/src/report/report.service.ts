import { Injectable, BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument } from './report.schema';
import { CreateReportDto, UpdateReportStatusDto, ReportQueryDto, ReportResponseDto, ReportStatsDto } from './report.dto';
import { NotificationService } from '../notification/notification.service';
import { EventService } from '../event/event.service';
import { ClubService } from '../club/club.service';
import { AnnouncementService } from '../announcement/announcement.service';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    private notificationService: NotificationService,
    private eventService: EventService,
    private clubService: ClubService,
    private announcementService: AnnouncementService,
  ) {}

  async createReport(createReportDto: CreateReportDto, userId: string): Promise<ReportResponseDto> {
    try {
      // Validate target exists if targetId is provided
      if (createReportDto.targetId) {
        const targetExists = await this.validateTarget(createReportDto.type, createReportDto.targetId);
        if (!targetExists) {
          throw new BadRequestException(`${createReportDto.type} with ID ${createReportDto.targetId} not found`);
        }
      }

      // Check for duplicate reports (same user, same target, within 24 hours)
      if (createReportDto.targetId) {
        const existingReport = await this.reportModel.findOne({
          reportedBy: new Types.ObjectId(userId),
          targetId: new Types.ObjectId(createReportDto.targetId),
          type: createReportDto.type,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          status: { $in: ['pending', 'under_review'] }
        });

        if (existingReport) {
          throw new BadRequestException('You have already reported this content within the last 24 hours');
        }
      }

      // Calculate priority based on category
      const priority = this.calculatePriority(createReportDto.category);

      const report = new this.reportModel({
        ...createReportDto,
        reportedBy: new Types.ObjectId(userId),
        targetId: createReportDto.targetId ? new Types.ObjectId(createReportDto.targetId) : undefined,
        priority,
      });

      const savedReport = await report.save();
      await savedReport.populate('reportedBy', 'firstName lastName email');

      // Send notification to user confirming report submission
      try {
        const priorityText = priority >= 4 ? ' This report has been marked as high priority.' : '';
        await this.notificationService.createNotification(userId, {
          title: '📝 Report Submitted Successfully',
          message: `Your ${createReportDto.type} report for ${createReportDto.category.replace('_', ' ')} has been received and is being reviewed by our moderation team.${priorityText} We'll notify you of any updates.`,
          type: 'report_submitted',
          priority: priority >= 4 ? 'high' : 'info',
          actionUrl: `/my-reports`,
          actionText: 'Track Report Status',
          relatedId: (savedReport._id as Types.ObjectId).toString(),
          relatedType: 'report',
          channels: { email: false, push: true, inApp: true }
        });
      } catch (error) {
        console.error('Failed to send user notification:', error);
      }

      return this.toReportResponseDto(await this.getReportWithDetails((savedReport._id as Types.ObjectId).toString()));
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error creating report:', error);
      throw new InternalServerErrorException('Failed to create report');
    }
  }

  async getReports(queryDto: ReportQueryDto, isAdmin: boolean = false): Promise<{
    reports: ReportResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = parseInt(queryDto.page?.toString() || '1') || 1;
    const limit = parseInt(queryDto.limit?.toString() || '20') || 20;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (!isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    if (queryDto.type) query.type = queryDto.type;
    if (queryDto.status) query.status = queryDto.status;
    if (queryDto.category) query.category = queryDto.category;
    
    query.isDeleted = false;

    if (queryDto.search) {
      query.$or = [
        { description: { $regex: queryDto.search, $options: 'i' } },
        { additionalInfo: { $regex: queryDto.search, $options: 'i' } },
      ];
    }

    const sortBy = queryDto.sortBy || 'createdAt';
    const sortOrder = queryDto.sortOrder === 'asc' ? 1 : -1;

    const total = await this.reportModel.countDocuments(query);
    const reports = await this.reportModel
      .find(query)
      .populate('reportedBy', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec();

    const reportsWithDetails = await Promise.all(
      reports.map(async (report) => {
        const reportWithDetails = await this.getReportWithDetails((report._id as Types.ObjectId).toString());
        return this.toReportResponseDto(reportWithDetails);
      })
    );

    return {
      reports: reportsWithDetails,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserReports(userId: string, queryDto: ReportQueryDto): Promise<{
    reports: ReportResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = parseInt(queryDto.page?.toString() || '1') || 1;
    const limit = parseInt(queryDto.limit?.toString() || '20') || 20;
    const skip = (page - 1) * limit;

    const query: any = { reportedBy: new Types.ObjectId(userId), isDeleted: false };

    if (queryDto.type) query.type = queryDto.type;
    if (queryDto.status) query.status = queryDto.status;
    if (queryDto.category) query.category = queryDto.category;

    if (queryDto.search) {
      query.$or = [
        { description: { $regex: queryDto.search, $options: 'i' } },
        { additionalInfo: { $regex: queryDto.search, $options: 'i' } },
      ];
    }

    const sortBy = queryDto.sortBy || 'createdAt';
    const sortOrder = queryDto.sortOrder === 'asc' ? 1 : -1;

    const total = await this.reportModel.countDocuments(query);
    const reports = await this.reportModel
      .find(query)
      .populate('reportedBy', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec();

    const reportsWithDetails = await Promise.all(
      reports.map(async (report) => {
        const reportWithDetails = await this.getReportWithDetails((report._id as Types.ObjectId).toString());
        return this.toReportResponseDto(reportWithDetails);
      })
    );

    return {
      reports: reportsWithDetails,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateReportStatus(reportId: string, updateDto: UpdateReportStatusDto, adminId: string): Promise<ReportResponseDto> {
    const report = await this.reportModel.findById(reportId);
    
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updatedReport = await this.reportModel.findByIdAndUpdate(
      reportId,
      {
        status: updateDto.status,
        adminNotes: updateDto.adminNotes,
        actionTaken: updateDto.actionTaken,
        reviewedBy: new Types.ObjectId(adminId),
        reviewedAt: new Date(),
        ...(updateDto.status === 'action_taken' || updateDto.status === 'resolved' ? { resolvedAt: new Date() } : {}),
      },
      { new: true }
    );

    if (!updatedReport) {
      throw new NotFoundException('Report not found');
    }

    // Send detailed notification to user about status change
    try {
      let notificationData;
      
      switch (updateDto.status) {
        case 'under_review':
          notificationData = {
            title: 'Report Under Review',
            message: `Your ${report.type} report is now being reviewed by our moderation team. We'll update you on our findings.`,
            type: 'report_under_review',
            priority: 'info',
            actionUrl: `/my-reports`,
            actionText: 'View Report Status',
            relatedId: reportId,
            relatedType: 'report',
            channels: { email: false, push: true, inApp: true }
          };
          break;
          
        case 'action_taken':
          notificationData = {
            title: 'Action Taken on Your Report',
            message: `We've taken action on the ${report.type} you reported. Thank you for helping keep our community safe.`,
            type: 'report_action_taken',
            priority: 'success',
            actionUrl: `/my-reports`,
            actionText: 'View Details',
            relatedId: reportId,
            relatedType: 'report',
            channels: { email: true, push: true, inApp: true }
          };
          break;
          
        case 'dismissed':
          notificationData = {
            title: 'Report Update',
            message: `Your ${report.type} report has been reviewed. While no immediate action was needed, we appreciate your vigilance in keeping our community safe.`,
            type: 'report_dismissed',
            priority: 'info',
            actionUrl: `/my-reports`,
            actionText: 'View Details',
            relatedId: reportId,
            relatedType: 'report',
            channels: { email: false, push: true, inApp: true }
          };
          break;
          
        case 'resolved':
          notificationData = {
            title: 'Report Resolved',
            message: `Your ${report.type} report has been successfully resolved. Thank you for helping maintain community standards.`,
            type: 'report_action_taken',
            priority: 'success',
            actionUrl: `/my-reports`,
            actionText: 'View Resolution',
            relatedId: reportId,
            relatedType: 'report',
            channels: { email: true, push: true, inApp: true }
          };
          break;
          
        default:
          notificationData = {
            title: 'Report Status Updated',
            message: `Your ${report.type} report status has been updated to: ${updateDto.status.replace('_', ' ')}.`,
            type: 'report_status_updated',
            priority: 'info',
            actionUrl: `/my-reports`,
            actionText: 'Check Update',
            relatedId: reportId,
            relatedType: 'report',
            channels: { email: false, push: true, inApp: true }
          };
      }

      if (updateDto.adminNotes) {
        notificationData.message += ` Admin note: ${updateDto.adminNotes}`;
      }

      await this.notificationService.createNotification(report.reportedBy.toString(), notificationData);
    } catch (error) {
      console.error('Failed to send status update notification:', error);
    }

    return this.toReportResponseDto(await this.getReportWithDetails((updatedReport._id as Types.ObjectId).toString()));
  }

  async takeActionOnReportedItem(reportId: string, adminId: string): Promise<{ success: boolean; message: string }> {
    const report = await this.reportModel.findById(reportId);
    
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    try {
      let actionDescription = `Direct moderation action taken on ${report.type}`;
      
      // Get specific action based on report type and category
      switch (report.category) {
        case 'inappropriate_content':
          actionDescription = `Inappropriate ${report.type} content has been removed`;
          break;
        case 'spam':
          actionDescription = `Spam ${report.type} has been removed`;
          break;
        case 'harassment':
          actionDescription = `Harassment report addressed - appropriate action taken`;
          break;
        case 'misleading_info':
          actionDescription = `Misleading information in ${report.type} has been corrected/removed`;
          break;
        case 'violation_of_rules':
          actionDescription = `Rule violation in ${report.type} has been addressed`;
          break;
        default:
          actionDescription = `Direct action taken on reported ${report.type}`;
      }

      // Update report status
      await this.reportModel.findByIdAndUpdate(reportId, {
        status: 'action_taken',
        actionTaken: actionDescription,
        reviewedBy: new Types.ObjectId(adminId),
        reviewedAt: new Date(),
        resolvedAt: new Date(),
      });

      // Notify user with detailed action information
      try {
        await this.notificationService.createNotification(report.reportedBy.toString(), {
          title: '✅ Action Taken on Your Report',
          message: `Great news! We've taken action on the ${report.type} you reported. ${actionDescription}. Your vigilance helps keep our community safe and welcoming for everyone.`,
          type: 'report_action_taken',
          priority: 'success',
          actionUrl: `/my-reports`,
          actionText: 'View Report Details',
          relatedId: reportId,
          relatedType: 'report',
          channels: { email: true, push: true, inApp: true }
        });
      } catch (error) {
        console.error('Failed to send action notification:', error);
      }

      return { success: true, message: actionDescription };
    } catch (error) {
      console.error('Error taking action on reported item:', error);
      throw new InternalServerErrorException('Failed to take action on reported item');
    }
  }

  async deleteReport(reportId: string, adminId: string): Promise<void> {
    const report = await this.reportModel.findById(reportId);
    
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Soft delete the report
    await this.reportModel.findByIdAndUpdate(reportId, {
      isDeleted: true,
      deletedBy: new Types.ObjectId(adminId),
      deletedAt: new Date(),
    });

    // Notify user with explanation about report review
    try {
      await this.notificationService.createNotification(report.reportedBy.toString(), {
        title: '📋 Report Review Complete',
        message: `Thank you for your ${report.type} report. After thorough review, we found the content didn't violate our community guidelines. We appreciate your continued vigilance in helping us maintain a safe environment.`,
        type: 'report_dismissed',
        priority: 'info',
        actionUrl: `/my-reports`,
        actionText: 'View Report History',
        relatedId: reportId,
        relatedType: 'report',
        channels: { email: false, push: true, inApp: true }
      });
    } catch (error) {
      console.error('Failed to send deletion notification:', error);
    }
  }

  async getReportStats(): Promise<ReportStatsDto> {
    const totalReports = await this.reportModel.countDocuments({ isDeleted: false });
    const pendingReports = await this.reportModel.countDocuments({ status: 'pending', isDeleted: false });
    const underReviewReports = await this.reportModel.countDocuments({ status: 'under_review', isDeleted: false });
    const resolvedReports = await this.reportModel.countDocuments({ 
      status: { $in: ['action_taken', 'resolved'] }, 
      isDeleted: false 
    });

    // Get reports by status for detailed breakdown
    const reportsByStatus = {
      pending: pendingReports,
      under_review: underReviewReports,
      action_taken: await this.reportModel.countDocuments({ status: 'action_taken', isDeleted: false }),
      dismissed: await this.reportModel.countDocuments({ status: 'dismissed', isDeleted: false }),
      resolved: await this.reportModel.countDocuments({ status: 'resolved', isDeleted: false }),
    };

    // Get reports by category
    const reportsByCategory = {
      inappropriate_content: await this.reportModel.countDocuments({ category: 'inappropriate_content', isDeleted: false }),
      spam: await this.reportModel.countDocuments({ category: 'spam', isDeleted: false }),
      harassment: await this.reportModel.countDocuments({ category: 'harassment', isDeleted: false }),
      misleading_info: await this.reportModel.countDocuments({ category: 'misleading_info', isDeleted: false }),
      violation_of_rules: await this.reportModel.countDocuments({ category: 'violation_of_rules', isDeleted: false }),
      other: await this.reportModel.countDocuments({ category: 'other', isDeleted: false }),
    };

    // Get reports by type
    const reportsByType = {
      events: await this.reportModel.countDocuments({ type: 'event', isDeleted: false }),
      clubs: await this.reportModel.countDocuments({ type: 'club', isDeleted: false }),
      announcements: await this.reportModel.countDocuments({ type: 'announcement', isDeleted: false }),
    };

    return {
      totalReports,
      pendingReports,
      underReviewReports,
      resolvedReports,
      averageResolutionTime: 24, // Default value
      reportsByStatus,
      reportsByCategory,
      reportsByType,
      recentReports: [],
    };
  }

  // Helper methods
  private calculatePriority(category: string): number {
    const priorityMap = {
      harassment: 5,
      inappropriate_content: 4,
      violation_of_rules: 3,
      misleading_info: 3,
      spam: 2,
      other: 1,
    };
    return priorityMap[category] || 1;
  }

  private async validateTarget(type: string, targetId: string): Promise<boolean> {
    try {
      switch (type) {
        case 'event':
          const event = await this.eventService.getEventById(targetId);
          return !!event;
        case 'club':
          const club = await this.clubService.getClubById(targetId);
          return !!club;
        case 'announcement':
          const announcement = await this.announcementService.getAnnouncementById(targetId);
          return !!announcement;
        default:
          return true; // Allow reports without specific targets
      }
    } catch (error) {
      return false;
    }
  }

  private async getReportWithDetails(reportId: string): Promise<ReportDocument> {
    const report = await this.reportModel
      .findById(reportId)
      .populate('reportedBy', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .exec();

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  private toReportResponseDto(report: ReportDocument): ReportResponseDto {
    return {
      id: (report._id as Types.ObjectId).toString(),
      type: report.type,
      category: report.category,
      targetId: report.targetId?.toString(),
      reportedBy: {
        id: (report.reportedBy as any)?._id?.toString() || report.reportedBy?.toString(),
        name: `${(report.reportedBy as any)?.firstName || ''} ${(report.reportedBy as any)?.lastName || ''}`.trim(),
        email: (report.reportedBy as any)?.email,
      },
      description: report.description,
      additionalInfo: report.additionalInfo,
      attachments: report.attachments || [],
      status: report.status,
      priority: report.priority,
      adminNotes: report.adminNotes,
      actionTaken: report.actionTaken,
      reviewedBy: report.reviewedBy ? {
        id: (report.reviewedBy as any)?._id?.toString() || report.reviewedBy?.toString(),
        name: `${(report.reviewedBy as any)?.firstName || ''} ${(report.reviewedBy as any)?.lastName || ''}`.trim(),
      } : undefined,
      reviewedAt: report.reviewedAt,
      resolvedAt: report.resolvedAt,
      createdAt: (report as any).createdAt,
      updatedAt: (report as any).updatedAt,
      userNotifiedOfSubmission: report.userNotifiedOfSubmission,
      userNotifiedOfAction: report.userNotifiedOfAction,
      targetInfo: (report as any).targetInfo,
    };
  }
}
