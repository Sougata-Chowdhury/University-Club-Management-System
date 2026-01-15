import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { UpdateUserProfileDto, UpdateUserSettingsDto, ChangePasswordDto, UserResponseDto, UserActivityDto } from './user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getUserProfile(userId: string): Promise<UserResponseDto> {
    console.log('UserService: Getting profile for user:', userId);
    
    const user = await this.userModel.findById(userId).select('-password').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user statistics
    const stats = await this.getUserStats(userId);

    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      bio: user.bio || '',
      profilePicture: user.profilePicture || '',
      department: user.department || '',
      year: user.year || '',
      studentId: user.studentId || '',
      role: user.role,
      isActive: user.isActive,
      joinedAt: (user as any).createdAt,
      lastLogin: user.lastLogin,
      settings: user.settings || {
        emailNotifications: true,
        pushNotifications: true,
        clubNotifications: true,
        eventNotifications: true,
        interests: []
      },
      stats
    };
  }

  async updateUserProfile(userId: string, updateDto: UpdateUserProfileDto): Promise<UserResponseDto> {
    console.log('UserService: Updating profile for user:', userId, updateDto);

    // Check if email is being changed and if it's already taken
    if (updateDto.email) {
      const existingUser = await this.userModel.findOne({ 
        email: updateDto.email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateDto },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    // Log activity
    await this.logUserActivity(userId, {
      activityType: 'profile_update',
      description: 'Updated profile information',
      metadata: { updatedFields: Object.keys(updateDto) }
    });

    return this.getUserProfile(userId);
  }

  async updateUserSettings(userId: string, settingsDto: UpdateUserSettingsDto): Promise<UserResponseDto> {
    console.log('UserService: Updating settings for user:', userId, settingsDto);

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          'settings': {
            ...settingsDto
          }
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    // Log activity
    await this.logUserActivity(userId, {
      activityType: 'settings_update',
      description: 'Updated account settings',
      metadata: { updatedSettings: Object.keys(settingsDto) }
    });

    return this.getUserProfile(userId);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    console.log('UserService: Changing password for user:', userId);

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(changePasswordDto.newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

    // Update password
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedNewPassword,
      passwordChangedAt: new Date()
    });

    // Log activity
    await this.logUserActivity(userId, {
      activityType: 'password_change',
      description: 'Changed account password'
    });

    return { message: 'Password changed successfully' };
  }

  async getUserActivity(userId: string, limit: number = 20): Promise<any[]> {
    console.log('UserService: Getting activity for user:', userId);

    const user = await this.userModel.findById(userId).select('activityLog');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return (user.activityLog || [])
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async logUserActivity(userId: string, activityDto: UserActivityDto): Promise<void> {
    console.log('UserService: Logging activity for user:', userId, activityDto);

    const activity = {
      ...activityDto,
      timestamp: new Date(),
      id: new Date().getTime().toString()
    };

    await this.userModel.findByIdAndUpdate(userId, {
      $push: {
        activityLog: {
          $each: [activity],
          $slice: -100 // Keep only last 100 activities
        }
      }
    });
  }

  async deactivateUser(userId: string): Promise<{ message: string }> {
    console.log('UserService: Deactivating user:', userId);

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Log activity
    await this.logUserActivity(userId, {
      activityType: 'account_deactivation',
      description: 'Account deactivated'
    });

    return { message: 'Account deactivated successfully' };
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<{users: UserResponseDto[], total: number, page: number, totalPages: number}> {
    console.log('UserService: Getting all users, page:', page, 'limit:', limit);

    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.userModel.find({ isActive: true })
        .select('-password -activityLog')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.userModel.countDocuments({ isActive: true })
    ]);

    const userProfiles = await Promise.all(
      users.map(user => this.mapUserToResponseDto(user))
    );

    return {
      users: userProfiles,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  private async getUserStats(userId: string): Promise<any> {
    const { ObjectId } = require('mongoose').Types;
    const userObjectId = new ObjectId(userId);
    
    // Get user's club memberships
    const clubsJoined = await this.userModel.aggregate([
      { $match: { _id: userObjectId } },
      { $lookup: { from: 'clubs', localField: '_id', foreignField: 'members', as: 'clubs' } },
      { $project: { clubCount: { $size: '$clubs' } } }
    ]);

    // Get user's hosted events (events they created)
    const eventsHosted = await this.userModel.aggregate([
      { $match: { _id: userObjectId } },
      { $lookup: { from: 'events', localField: '_id', foreignField: 'createdBy', as: 'events' } },
      { $project: { eventCount: { $size: '$events' } } }
    ]);

    // Get user's payment total
    const paymentsTotal = await this.userModel.aggregate([
      { $match: { _id: userObjectId } },
      { $lookup: { from: 'payments', localField: '_id', foreignField: 'userId', as: 'payments' } },
      { $unwind: { path: '$payments', preserveNullAndEmptyArrays: true } },
      { $match: { 'payments.status': 'approved' } },
      { $group: { _id: '$_id', total: { $sum: '$payments.amount' } } }
    ]);

    // Get user's leadership roles (clubs they created/own)
    const leadershipRoles = await this.userModel.aggregate([
      { $match: { _id: userObjectId } },
      { $lookup: { from: 'clubs', localField: '_id', foreignField: 'createdBy', as: 'ownedClubs' } },
      { $project: { leadershipCount: { $size: '$ownedClubs' } } }
    ]);

    const user = await this.userModel.findById(userId).select('createdAt');
    const activeSince = user ? this.getTimeSince((user as any).createdAt) : 'Unknown';

    return {
      clubsJoined: clubsJoined[0]?.clubCount || 0,
      eventsHosted: eventsHosted[0]?.eventCount || 0,
      paymentsTotal: paymentsTotal[0]?.total || 0,
      leadershipRoles: leadershipRoles[0]?.leadershipCount || 0,
      activeSince
    };
  }

  private async mapUserToResponseDto(user: any): Promise<UserResponseDto> {
    const stats = await this.getUserStats(user._id.toString());
    
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      bio: user.bio || '',
      profilePicture: user.profilePicture || '',
      department: user.department || '',
      year: user.year || '',
      studentId: user.studentId || '',
      role: user.role,
      isActive: user.isActive,
      joinedAt: (user as any).createdAt,
      lastLogin: user.lastLogin,
      settings: user.settings || {
        emailNotifications: true,
        pushNotifications: true,
        clubNotifications: true,
        eventNotifications: true,
        interests: []
      },
      stats
    };
  }

  private getTimeSince(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    }
  }
}
