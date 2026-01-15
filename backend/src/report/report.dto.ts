import { IsEnum, IsString, IsOptional, IsArray, IsMongoId, IsNumber, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportType, ReportCategory, ReportStatus } from './report.schema';

export class CreateReportDto {
  @IsEnum(ReportType)
  type: ReportType;

  @IsMongoId()
  targetId: string;

  @IsEnum(ReportCategory)
  category: ReportCategory;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalInfo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priority?: number;
}

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  actionTaken?: string;
}

export class ReportQueryDto {
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsEnum(ReportCategory)
  category?: ReportCategory;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  search?: string;
}

export class ReportResponseDto {
  id: string;
  reportedBy: {
    id: string;
    name: string;
    email: string;
  };
  type: ReportType;
  targetId: string;
  targetInfo?: any; // Will contain details about the reported item
  category: ReportCategory;
  description: string;
  additionalInfo?: string;
  attachments?: string[];
  status: ReportStatus;
  reviewedBy?: {
    id: string;
    name: string;
  };
  reviewedAt?: Date;
  adminNotes?: string;
  actionTaken?: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  userNotifiedOfSubmission: boolean;
  userNotifiedOfAction: boolean;
  resolvedAt?: Date;
}

export class ReportStatsDto {
  totalReports: number;
  pendingReports: number;
  underReviewReports: number;
  resolvedReports: number;
  reportsByType: {
    events: number;
    clubs: number;
    announcements: number;
  };
  reportsByCategory: {
    [key in ReportCategory]: number;
  };
  reportsByStatus: {
    [key in ReportStatus]: number;
  };
  averageResolutionTime: number; // in hours
  recentReports: ReportResponseDto[];
}
