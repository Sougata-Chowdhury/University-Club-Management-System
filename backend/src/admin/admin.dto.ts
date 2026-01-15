import { IsString, IsEmail, IsBoolean, IsOptional, IsNumber, IsDateString, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

// System Statistics DTO
export class AdminStatsDto {
  totalUsers: number;
  activeUsers: number;
  totalClubs: number;
  pendingClubs: number;
  approvedClubs: number;
  totalEvents: number;
  upcomingEvents: number;
  totalPayments: number;
  pendingPayments: number;
  totalAnnouncements: number;
  totalRevenue: number;
  newUsersLast30Days: number;
  newClubsLast30Days: number;
  newEventsLast30Days: number;
  recentUsers: any[];
  recentClubs: any[];
  recentEvents: any[];
}

// User Management DTOs
export class UserManagementDto {
  users: any[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class ToggleUserStatusDto {
  @IsString()
  userId: string;
}

export class DeleteUserDto {
  @IsString()
  userId: string;
}

// Club Management DTOs
export class ClubManagementDto {
  clubs: any[];
}

export class ApproveClubDto {
  @IsString()
  clubId: string;
}

export class RejectClubDto {
  @IsString()
  clubId: string;

  @IsString()
  reason: string;
}

// Payment Management DTOs
export class ApprovePaymentDto {
  @IsString()
  paymentId: string;
}

export class RejectPaymentDto {
  @IsString()
  paymentId: string;

  @IsString()
  reason: string;
}

// System Report DTOs
export class SystemReportDto {
  period: {
    start: Date;
    end: Date;
  };
  userGrowth: any[];
  clubGrowth: any[];
  eventGrowth: any[];
  paymentStats: {
    totalAmount: number;
    totalCount: number;
    averageAmount: number;
  };
  topClubs: any[];
  topEvents: any[];
}

export class GenerateReportDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// Admin Activity DTOs
export class AdminActivityDto {
  action: string;
  targetId?: string;
  details: string;
  timestamp: Date;
}

// Search DTOs
export class SearchUsersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

// Announcement Management DTOs
export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  isPriority?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  isPriority?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// System Settings DTOs
export class SystemSettingsDto {
  @IsOptional()
  @IsString()
  siteName?: string;

  @IsOptional()
  @IsString()
  siteDescription?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsNumber()
  maxClubMembers?: number;

  @IsOptional()
  @IsNumber()
  maxEventCapacity?: number;

  @IsOptional()
  @IsBoolean()
  allowClubCreation?: boolean;

  @IsOptional()
  @IsBoolean()
  requireClubApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  allowEventCreation?: boolean;

  @IsOptional()
  @IsArray()
  allowedFileTypes?: string[];

  @IsOptional()
  @IsNumber()
  maxFileSize?: number;
}

// User Role Management DTOs
export class ChangeUserRoleDto {
  @IsString()
  userId: string;

  @IsString()
  newRole: string;
}

// Bulk Operations DTOs
export class BulkUserActionDto {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @IsString()
  action: 'activate' | 'deactivate' | 'delete';

  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkClubActionDto {
  @IsArray()
  @IsString({ each: true })
  clubIds: string[];

  @IsString()
  action: 'approve' | 'reject' | 'delete';

  @IsOptional()
  @IsString()
  reason?: string;
}

// Analytics DTOs
export class AnalyticsFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  type?: 'users' | 'clubs' | 'events' | 'payments';

  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month';
}

// Dashboard Data DTO
export class AdminDashboardDto {
  stats: AdminStatsDto;
  recentActivities: any[];
  pendingApprovals: {
    clubs: number;
    payments: number;
    reports: number;
  };
  systemAlerts: any[];
  quickActions: any[];
}
