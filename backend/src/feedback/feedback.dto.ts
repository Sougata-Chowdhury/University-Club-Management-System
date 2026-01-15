import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min, Max, MaxLength, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFeedbackDto {
  @IsEnum(['club', 'event', 'announcement', 'general', 'course', 'instructor', 'facility'])
  targetType: string;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MaxLength(2000)
  comment: string;

  @IsOptional()
  @IsEnum(['general', 'organization', 'communication', 'facilities', 'content', 'instructor', 'other'])
  category?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class UpdateFeedbackStatusDto {
  @IsEnum(['pending', 'approved', 'rejected', 'under_review'])
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminResponse?: string;
}

export class FeedbackQueryDto {
  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class FeedbackStatsDto {
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  categoryBreakdown: Record<string, number>;
  thisMonth: number; // Feedback this month
  pendingReview: number;
  approvedFeedback: number;
  highRatedFeedback: number; // 4-5 stars
  lowRatedFeedback: number; // 1-2 stars
}

export class VoteFeedbackDto {
  @IsBoolean()
  helpful: boolean;
}

export class FeedbackResponseDto {
  id: string;
  userId: any;
  targetType: string;
  targetId: any;
  rating: number;
  comment: string;
  category: string;
  isAnonymous: boolean;
  isVerified: boolean;
  attachments: string[];
  status: string;
  reviewedBy: any;
  adminResponse: string;
  helpfulVotes: number;
  votedUsers: any[];
  respondedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  targetInfo?: any; // Populated target information
}
