import { IsString, IsEmail, IsOptional, IsEnum, IsDateString, IsArray, MinLength } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  studentId?: string;
}

export class UpdateUserSettingsDto {
  @IsOptional()
  emailNotifications?: boolean;

  @IsOptional()
  pushNotifications?: boolean;

  @IsOptional()
  clubNotifications?: boolean;

  @IsOptional()
  eventNotifications?: boolean;

  @IsOptional()
  @IsEnum(['light', 'dark'])
  theme?: string;

  @IsOptional()
  @IsEnum(['en', 'es', 'fr'])
  language?: string;

  @IsOptional()
  @IsArray()
  interests?: string[];
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}

export class UserActivityDto {
  @IsString()
  activityType: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  relatedId?: string; // Club ID, Event ID, etc.

  @IsOptional()
  metadata?: any;
}

export class UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  profilePicture?: string;
  department?: string;
  year?: string;
  studentId?: string;
  role: string;
  isActive: boolean;
  joinedAt: Date;
  lastLogin?: Date;
  settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    clubNotifications: boolean;
    eventNotifications: boolean;
    interests: string[];
  };
  stats: {
    clubsJoined: number;
    eventsHosted: number;
    paymentsTotal: number;
    leadershipRoles: number;
    activeSince: string;
  };
}
