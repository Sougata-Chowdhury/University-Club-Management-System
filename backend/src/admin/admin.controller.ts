import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Req,
  HttpStatus,
  HttpException,
  BadRequestException
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AdminService } from './admin.service';
import { 
  SearchUsersDto, 
  ApproveClubDto, 
  RejectClubDto, 
  ApprovePaymentDto, 
  RejectPaymentDto,
  GenerateReportDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  SystemSettingsDto,
  ChangeUserRoleDto,
  BulkUserActionDto,
  BulkClubActionDto,
  AnalyticsFilterDto
} from './admin.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Dashboard & Statistics
  @Get('dashboard')
  async getDashboard(@Req() req) {
    try {
      console.log('AdminController: Getting dashboard data');
      const stats = await this.adminService.getSystemStats();
      
      return {
        success: true,
        data: {
          stats,
          timestamp: new Date(),
          adminId: req.user.userId
        }
      };
    } catch (error) {
      console.error('AdminController: Error getting dashboard:', error);
      throw new HttpException(
        'Failed to load dashboard data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  async getSystemStats() {
    try {
      console.log('AdminController: Getting system statistics');
      const stats = await this.adminService.getSystemStats();
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('AdminController: Error getting stats:', error);
      throw new HttpException(
        'Failed to load system statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // User Management
  @Get('users')
  async getAllUsers(@Query() query: SearchUsersDto) {
    try {
      console.log('AdminController: Getting all users');
      const { search, page = 1, limit = 20 } = query;
      const result = await this.adminService.getAllUsers(page, limit, search);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('AdminController: Error getting users:', error);
      throw new HttpException(
        'Failed to load users',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('users/:userId/toggle-status')
  async toggleUserStatus(@Param('userId') userId: string, @Req() req) {
    try {
      console.log('AdminController: Toggling user status for:', userId);
      
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const result = await this.adminService.toggleUserStatus(userId, req.user.userId);
      
      return {
        success: true,
        message: result.message,
        data: result.user
      };
    } catch (error) {
      console.error('AdminController: Error toggling user status:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update user status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('users/:userId')
  async deleteUser(@Param('userId') userId: string, @Req() req) {
    try {
      console.log('AdminController: Deleting user:', userId);
      
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const result = await this.adminService.deleteUser(userId, req.user.userId);
      
      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      console.error('AdminController: Error deleting user:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('users/bulk-action')
  async bulkUserAction(@Body() bulkActionDto: BulkUserActionDto, @Req() req) {
    try {
      console.log('AdminController: Performing bulk user action:', bulkActionDto.action);
      
      const results: Array<{ userId: string; success: boolean; message: string }> = [];
      for (const userId of bulkActionDto.userIds) {
        try {
          switch (bulkActionDto.action) {
            case 'activate':
            case 'deactivate':
              const result = await this.adminService.toggleUserStatus(userId, req.user.userId);
              results.push({ userId, success: true, message: result.message });
              break;
            case 'delete':
              const deleteResult = await this.adminService.deleteUser(userId, req.user.userId);
              results.push({ userId, success: true, message: deleteResult.message });
              break;
            default:
              results.push({ userId, success: false, message: 'Invalid action' });
          }
        } catch (error) {
          results.push({ userId, success: false, message: error.message });
        }
      }
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('AdminController: Error in bulk user action:', error);
      throw new HttpException(
        'Failed to perform bulk action',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Club Management
  @Get('clubs/pending')
  async getPendingClubs() {
    try {
      console.log('AdminController: Getting pending clubs');
      const result = await this.adminService.getPendingClubs();
      
      return {
        success: true,
        data: result.clubs
      };
    } catch (error) {
      console.error('AdminController: Error getting pending clubs:', error);
      throw new HttpException(
        'Failed to load pending clubs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('clubs/:clubId/approve')
  async approveClub(@Param('clubId') clubId: string, @Req() req) {
    try {
      console.log('AdminController: Approving club:', clubId);
      
      if (!clubId) {
        throw new BadRequestException('Club ID is required');
      }

      const result = await this.adminService.approveClub(clubId, req.user.userId);
      
      return {
        success: true,
        message: result.message,
        data: result.club
      };
    } catch (error) {
      console.error('AdminController: Error approving club:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to approve club',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('clubs/:clubId/reject')
  async rejectClub(@Param('clubId') clubId: string, @Body() rejectDto: RejectClubDto, @Req() req) {
    try {
      console.log('AdminController: Rejecting club:', clubId);
      
      if (!clubId) {
        throw new BadRequestException('Club ID is required');
      }

      if (!rejectDto.reason) {
        throw new BadRequestException('Rejection reason is required');
      }

      const result = await this.adminService.rejectClub(clubId, rejectDto.reason, req.user.userId);
      
      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      console.error('AdminController: Error rejecting club:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to reject club',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Payment Management
  @Get('payments/pending')
  async getPendingPayments() {
    try {
      console.log('AdminController: Getting pending payments');
      const payments = await this.adminService.getPendingPayments();
      
      return {
        success: true,
        data: payments
      };
    } catch (error) {
      console.error('AdminController: Error getting pending payments:', error);
      throw new HttpException(
        'Failed to load pending payments',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('payments/:paymentId/approve')
  async approvePayment(@Param('paymentId') paymentId: string, @Req() req) {
    try {
      console.log('AdminController: Approving payment:', paymentId);
      
      if (!paymentId) {
        throw new BadRequestException('Payment ID is required');
      }

      const result = await this.adminService.approvePayment(paymentId, req.user.userId);
      
      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      console.error('AdminController: Error approving payment:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to approve payment',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('payments/:paymentId/reject')
  async rejectPayment(@Param('paymentId') paymentId: string, @Body() rejectDto: RejectPaymentDto, @Req() req) {
    try {
      console.log('AdminController: Rejecting payment:', paymentId);
      
      if (!paymentId) {
        throw new BadRequestException('Payment ID is required');
      }

      if (!rejectDto.reason) {
        throw new BadRequestException('Rejection reason is required');
      }

      const result = await this.adminService.rejectPayment(paymentId, rejectDto.reason, req.user.userId);
      
      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      console.error('AdminController: Error rejecting payment:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to reject payment',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Reports & Analytics
  @Get('reports/system')
  async generateSystemReport(@Query() query: GenerateReportDto) {
    try {
      console.log('AdminController: Generating system report');
      
      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;
      
      const report = await this.adminService.generateSystemReport(startDate, endDate);
      
      return {
        success: true,
        data: report
      };
    } catch (error) {
      console.error('AdminController: Error generating report:', error);
      throw new HttpException(
        'Failed to generate system report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('analytics')
  async getAnalytics(@Query() query: AnalyticsFilterDto) {
    try {
      console.log('AdminController: Getting analytics data');
      
      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;
      
      const analytics = await this.adminService.generateSystemReport(startDate, endDate);
      
      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      console.error('AdminController: Error getting analytics:', error);
      throw new HttpException(
        'Failed to load analytics data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // System Health Check
  @Get('health')
  async getSystemHealth() {
    try {
      console.log('AdminController: Checking system health');
      
      const stats = await this.adminService.getSystemStats();
      
      const health = {
        status: 'healthy',
        timestamp: new Date(),
        services: {
          database: 'connected',
          api: 'running',
          files: 'accessible'
        },
        metrics: {
          totalUsers: stats.totalUsers,
          activeUsers: stats.activeUsers,
          totalClubs: stats.totalClubs,
          totalEvents: stats.totalEvents
        }
      };
      
      return {
        success: true,
        data: health
      };
    } catch (error) {
      console.error('AdminController: Error checking system health:', error);
      throw new HttpException(
        'Failed to check system health',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
