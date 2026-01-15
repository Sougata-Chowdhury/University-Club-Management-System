import { IsString, IsOptional, IsBoolean, IsEnum, IsDate, IsObject, IsMongoId, IsArray, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(['club', 'event', 'payment', 'announcement', 'admin', 'system', 'reminder', 'info'])
  @IsOptional()
  type?: string = 'system';

  @IsEnum(['info', 'success', 'warning', 'error', 'urgent', 'high', 'medium', 'low'])
  @IsOptional()
  priority?: string = 'info';

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsString()
  @IsOptional()
  actionText?: string;

  @IsMongoId()
  @IsOptional()
  relatedId?: string;

  @IsString()
  @IsOptional()
  relatedType?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  scheduledFor?: Date;

  @IsObject()
  @IsOptional()
  channels?: {
    email?: boolean;
    push?: boolean;
    inApp?: boolean;
  };

  @IsObject()
  @IsOptional()
  metadata?: any;
}

export class UpdateNotificationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsBoolean()
  @IsOptional()
  read?: boolean;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsString()
  @IsOptional()
  actionText?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  scheduledFor?: Date;

  @IsObject()
  @IsOptional()
  channels?: {
    email?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
}

export class NotificationPreferencesDto {
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  clubNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  eventNotifications?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];
}

export class BulkNotificationDto extends CreateNotificationDto {
  @IsMongoId({ each: true })
  userIds: string[];

  @IsObject()
  @IsOptional()
  filters?: {
    clubs?: string[];
    roles?: string[];
    departments?: string[];
  };
}
