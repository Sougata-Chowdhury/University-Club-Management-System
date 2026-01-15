import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Announcement, AnnouncementDocument } from '../schemas/announcement.schema';
import { Club, ClubDocument } from '../schemas/club.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from '../dto/announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectModel(Announcement.name) private announcementModel: Model<AnnouncementDocument>,
    @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createAnnouncement(createAnnouncementDto: CreateAnnouncementDto, userId: string) {
    const { clubId, message, image } = createAnnouncementDto;

    // Verify club exists and is approved
    const club = await this.clubModel.findById(clubId);
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    if (club.status !== 'approved') {
      throw new BadRequestException('Only approved clubs can make announcements');
    }

    // Verify user is the club creator or member
    const userObjectId = new Types.ObjectId(userId);
    const isCreator = club.createdBy.equals(userObjectId);
    const isMember = club.members.some(memberId => memberId.equals(userObjectId));

    if (!isCreator && !isMember) {
      throw new ForbiddenException('Only club creators and members can make announcements');
    }

    // Create announcement
    const announcement = new this.announcementModel({
      message,
      image: image || null,
      createdBy: userId,
      club: clubId,
      isActive: true,
      likes: 0,
      likedBy: [],
    });

    const savedAnnouncement = await announcement.save();
    
    return await this.announcementModel
      .findById(savedAnnouncement._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('club', 'name description category')
      .lean();
  }

  async getAllAnnouncements(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const announcements = await this.announcementModel
      .find({ isActive: true })
      .populate('createdBy', 'firstName lastName email')
      .populate('club', 'name description category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.announcementModel.countDocuments({ isActive: true });

    return {
      announcements,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getAllAnnouncementsForAdmin(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Admin can see all announcements including soft-deleted ones
    const announcements = await this.announcementModel
      .find({})
      .populate('createdBy', 'firstName lastName email')
      .populate('club', 'name description category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.announcementModel.countDocuments({});

    return {
      announcements,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getAnnouncementsByClub(clubId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Verify club exists
    const club = await this.clubModel.findById(clubId);
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    const announcements = await this.announcementModel
      .find({ club: clubId, isActive: true })
      .populate('createdBy', 'firstName lastName email')
      .populate('club', 'name description category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.announcementModel.countDocuments({ club: clubId, isActive: true });

    return {
      announcements,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getUserAnnouncements(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const announcements = await this.announcementModel
      .find({ createdBy: userId, isActive: true })
      .populate('createdBy', 'firstName lastName email')
      .populate('club', 'name description category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.announcementModel.countDocuments({ createdBy: userId, isActive: true });

    return {
      announcements,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getAnnouncementById(announcementId: string) {
    const announcement = await this.announcementModel
      .findById(announcementId)
      .populate('createdBy', 'firstName lastName email')
      .populate('club', 'name description category')
      .populate('likedBy', 'firstName lastName')
      .lean();

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return announcement;
  }

  async updateAnnouncement(announcementId: string, updateAnnouncementDto: UpdateAnnouncementDto, userId: string) {
    const announcement = await this.announcementModel.findById(announcementId);
    
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Check if user is the creator
    if (!announcement.createdBy.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('Only announcement creator can update it');
    }

    const updatedAnnouncement = await this.announcementModel
      .findByIdAndUpdate(announcementId, updateAnnouncementDto, { new: true })
      .populate('createdBy', 'firstName lastName email')
      .populate('club', 'name description category')
      .lean();

    return updatedAnnouncement;
  }

  async deleteAnnouncement(announcementId: string, userId: string) {
    const announcement = await this.announcementModel.findById(announcementId);
    
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Get user to check if they are admin
    const user = await this.userModel.findById(userId);
    const isAdmin = user?.role === 'admin';
    const isOwner = announcement.createdBy.equals(new Types.ObjectId(userId));

    // Check if user is the creator or admin
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Only announcement creator or admin can delete it');
    }

    // Soft delete - set isActive to false
    await this.announcementModel.findByIdAndUpdate(announcementId, { isActive: false });

    return { message: 'Announcement deleted successfully' };
  }

  async toggleLike(announcementId: string, userId: string) {
    const announcement = await this.announcementModel.findById(announcementId);
    
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const hasLiked = announcement.likedBy.some(id => id.equals(userObjectId));

    if (hasLiked) {
      // Unlike
      announcement.likedBy = announcement.likedBy.filter(id => !id.equals(userObjectId));
      announcement.likes = Math.max(0, announcement.likes - 1);
    } else {
      // Like
      announcement.likedBy.push(userObjectId);
      announcement.likes += 1;
    }

    await announcement.save();

    return {
      liked: !hasLiked,
      likes: announcement.likes,
      message: hasLiked ? 'Announcement unliked' : 'Announcement liked',
    };
  }

  async getAnnouncementStats(userId: string) {
    const userAnnouncements = await this.announcementModel.countDocuments({ 
      createdBy: userId, 
      isActive: true 
    });

    const totalLikes = await this.announcementModel.aggregate([
      { $match: { createdBy: new Types.ObjectId(userId), isActive: true } },
      { $group: { _id: null, totalLikes: { $sum: '$likes' } } }
    ]);

    return {
      totalAnnouncements: userAnnouncements,
      totalLikes: totalLikes.length > 0 ? totalLikes[0].totalLikes : 0,
    };
  }
}
