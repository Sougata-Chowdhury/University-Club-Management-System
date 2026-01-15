import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Club, ClubDocument } from '../schemas/club.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { Event, EventDocument } from '../schemas/event.schema';
import { CreateClubDto, UpdateClubDto, ApproveClubDto, HandleMemberApplicationDto } from '../dto/club.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class ClubService {
  constructor(
    @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
  ) {}

  async createClub(createClubDto: CreateClubDto, userId: string) {
    const club = new this.clubModel({
      ...createClubDto,
      createdBy: userId,
      status: 'pending',
      members: [userId], // Add creator as first member
      memberApplications: [],
    });

    const savedClub = await club.save();
    
    // Add club ID to user's createdClubs array
    await this.userModel.findByIdAndUpdate(
      userId,
      { $push: { createdClubs: savedClub._id } }
    );

    // Also add club to creator's joinedClubs array since they are now a member
    await this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { joinedClubs: savedClub._id } }
    );

    // Log activity
    try {
      await this.userService.logUserActivity(userId, {
        activityType: 'club_created',
        description: `Created club "${createClubDto.name}"`,
        relatedId: savedClub._id as string,
        metadata: { clubName: createClubDto.name, action: 'create' }
      });
    } catch (error) {
      console.error('Error logging club creation activity:', error);
    }

    return savedClub.populate('createdBy', 'firstName lastName email');
  }

  async getAllClubs(status?: string) {
    let filter = {};
    if (status && status !== 'all') {
      filter = { status };
    }
    return this.clubModel
      .find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  async getApprovedClubs() {
    return this.clubModel
      .find({ status: 'approved', isActive: true })
      .populate('createdBy', 'firstName lastName email')
      .select('-memberApplications')
      .sort({ createdAt: -1 });
  }

  async getClubById(clubId: string) {
    const club = await this.clubModel
      .findById(clubId)
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .populate('memberApplications.userId', 'firstName lastName email');

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    return club;
  }

  async getUserClubs(userId: string) {
    console.log('=== getUserClubs called ===');
    console.log('User ID received:', userId);
    console.log('User ID type:', typeof userId);
    
    // First, let's find clubs created by this user directly
    const directlyCreatedClubs = await this.clubModel
      .find({ createdBy: userId })
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Also get user with populated arrays for joined clubs
    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'joinedClubs',
        populate: { path: 'createdBy', select: 'firstName lastName email' }
      });

    if (!user) {
      console.log('❌ User not found with ID:', userId);
      throw new NotFoundException('User not found');
    }

    console.log('✅ User found:', user.firstName, user.lastName, '- Email:', user.email);
    console.log('Direct clubs found:', directlyCreatedClubs.length);
    console.log('User joinedClubs array:', user.joinedClubs?.length || 0);
    
    if (directlyCreatedClubs.length > 0) {
      console.log('First club details:', {
        name: directlyCreatedClubs[0].name,
        status: directlyCreatedClubs[0].status,
        id: directlyCreatedClubs[0]._id,
        memberApplications: directlyCreatedClubs[0].memberApplications?.length
      });
    }

    // Log all club details for debugging
    directlyCreatedClubs.forEach((club, index) => {
      console.log(`Created Club ${index + 1}:`, {
        name: club.name,
        status: club.status,
        id: club._id,
        createdBy: club.createdBy._id,
        membersCount: club.members?.length
      });
    });

    return {
      createdClubs: directlyCreatedClubs,
      joinedClubs: user.joinedClubs || [],
    };
  }

  async updateClub(clubId: string, updateClubDto: UpdateClubDto, userId: string) {
    const club = await this.clubModel.findById(clubId);
    
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Handle both string and ObjectId userId types
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    if (!club.createdBy.equals(userObjectId)) {
      throw new ForbiddenException('Only club creator can update the club');
    }

    const updatedClub = await this.clubModel
      .findByIdAndUpdate(clubId, updateClubDto, { new: true })
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email');

    return updatedClub;
  }

  async applyToJoinClub(clubId: string, userId: string) {
    const club = await this.clubModel.findById(clubId);
    
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    if (club.status !== 'approved') {
      throw new BadRequestException('Club is not approved yet');
    }

    // Handle both string and ObjectId userId types
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    if (club.createdBy.equals(userObjectId)) {
      throw new BadRequestException('You are the creator and already a member of this club');
    }

    console.log('Apply to join debug:', {
      clubId,
      userId,
      membersArray: club.members.map(m => m.toString()),
      applicationsArray: club.memberApplications.map(app => ({ userId: app.userId.toString(), status: app.status }))
    });

    // Check if user is already a member - use proper ObjectId comparison
    const isMember = club.members.some(memberId => 
      memberId.equals(new Types.ObjectId(userId))
    );
    if (isMember) {
      throw new BadRequestException('You are already a member of this club');
    }

    // Check for existing applications - use proper ObjectId comparison
    const existingApplication = club.memberApplications.find(
      app => app.userId.equals(new Types.ObjectId(userId))
    );

    if (existingApplication) {
      if (existingApplication.status === 'pending') {
        throw new BadRequestException('You already have a pending application for this club');
      } else if (existingApplication.status === 'approved') {
        throw new BadRequestException('You are already a member of this club');
      }
      // If status is 'rejected', allow new application by updating the existing one
      existingApplication.status = 'pending';
      existingApplication.appliedAt = new Date();
      await club.save();
      return { message: 'Application resubmitted successfully' };
    }

    // Add application
    club.memberApplications.push({
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(userId),
      status: 'pending',
      appliedAt: new Date(),
    });

    await club.save();

    // Log activity
    try {
      await this.userService.logUserActivity(userId, {
        activityType: 'club_application',
        description: `Applied to join ${club.name}`,
        relatedId: clubId,
        metadata: { clubName: club.name, action: 'apply' }
      });
    } catch (error) {
      console.error('Error logging club application activity:', error);
    }

    return { message: 'Application submitted successfully' };
  }

  async withdrawApplication(clubId: string, userId: string) {
    const club = await this.clubModel.findById(clubId);
    
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Find existing pending application
    const applicationIndex = club.memberApplications.findIndex(
      app => app.userId.equals(new Types.ObjectId(userId)) && app.status === 'pending'
    );

    if (applicationIndex === -1) {
      throw new NotFoundException('No pending application found for this club');
    }

    // Remove the application
    club.memberApplications.splice(applicationIndex, 1);
    await club.save();
    
    return { message: 'Application withdrawn successfully' };
  }

  async handleMemberApplication(
    clubId: string, 
    applicationUserId: string, 
    handleApplicationDto: HandleMemberApplicationDto, 
    clubCreatorId: string
  ) {
    const club = await this.clubModel.findById(clubId);
    
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Handle both string and ObjectId clubCreatorId types
    const clubCreatorObjectId = typeof clubCreatorId === 'string' ? new Types.ObjectId(clubCreatorId) : clubCreatorId;
    if (!club.createdBy.equals(clubCreatorObjectId)) {
      throw new ForbiddenException('Only club creator can handle applications');
    }

    const application = club.memberApplications.find(
      app => app.userId.toString() === applicationUserId
    );

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    application.status = handleApplicationDto.status;

    if (handleApplicationDto.status === 'approved') {
      // Add user to members array
      club.members.push(new Types.ObjectId(applicationUserId));
      
      // Add club to user's joinedClubs array
      await this.userModel.findByIdAndUpdate(
        applicationUserId,
        { $push: { joinedClubs: clubId } }
      );

      // Log activity for the user who was approved
      try {
        await this.userService.logUserActivity(applicationUserId, {
          activityType: 'club_joined',
          description: `Joined ${club.name}`,
          relatedId: clubId,
          metadata: { clubName: club.name, action: 'approved' }
        });
      } catch (error) {
        console.error('Error logging club join activity:', error);
      }
    }

    await club.save();
    return { message: `Application ${handleApplicationDto.status} successfully` };
  }

  // Admin functions
  async approveClub(clubId: string, approveClubDto: ApproveClubDto, adminId: string) {
    const club = await this.clubModel.findById(clubId);
    
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    club.status = approveClubDto.status;
    if (approveClubDto.status === 'approved') {
      club.approvedAt = new Date();
      club.approvedBy = new Types.ObjectId(adminId);
    }

    await club.save();
    return club.populate('createdBy', 'firstName lastName email');
  }

  async getPendingClubs() {
    return this.clubModel
      .find({ status: 'pending' })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  async getClubApplications(clubId: string, userId: string) {
    const club = await this.clubModel
      .findById(clubId)
      .populate('memberApplications.userId', 'firstName lastName email');
    
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Handle both string and ObjectId userId types
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    if (!club.createdBy.equals(userObjectId)) {
      throw new ForbiddenException('Only club creator can view applications');
    }

    return club.memberApplications.filter(app => app.status === 'pending');
  }

  async handleAdminAction(clubId: string, action: 'approve' | 'reject') {
    const club = await this.clubModel.findById(clubId);
    
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    if (club.status !== 'pending') {
      throw new BadRequestException('Club is not pending approval');
    }

    if (action === 'reject') {
      // Delete all events associated with this club when rejecting
      const deletedEvents = await this.eventModel.deleteMany({ clubId: clubId });
      console.log(`Deleted ${deletedEvents.deletedCount} events for rejected club`);

      // Remove club from all members' joinedClubs arrays
      await this.userModel.updateMany(
        { joinedClubs: clubId },
        { $pull: { joinedClubs: clubId } }
      );

      club.status = 'rejected';
      await club.save();
      
      return { 
        message: `Club ${action}d successfully. ${deletedEvents.deletedCount} associated events were also deleted.` 
      };
    }

    club.status = action === 'approve' ? 'approved' : 'rejected';
    
    if (action === 'approve') {
      club.approvedAt = new Date();
    }

    await club.save();
    return { message: `Club ${action}d successfully` };
  }

  async getUserApplications(userId: string) {
    console.log('getUserApplications called for userId:', userId);
    
    const clubs = await this.clubModel
      .find({ 'memberApplications.userId': userId })
      .populate('createdBy', 'firstName lastName email')
      .select('name description category memberApplications');

    console.log('Found clubs with applications:', clubs.length);
    clubs.forEach(club => {
      console.log('Club:', club.name, 'Applications:', club.memberApplications.length);
    });

    const applications: any[] = [];
    
    clubs.forEach(club => {
      const application = club.memberApplications.find(
        app => app.userId.toString() === userId
      );
      
      if (application) {
        console.log('Found application for user in club:', club.name, 'Status:', application.status);
        applications.push({
          _id: `${club._id}_${application.userId}`,
          club: {
            _id: club._id,
            name: club.name,
            description: club.description,
            category: club.category
          },
          status: application.status,
          appliedAt: application.appliedAt
        });
      }
    });

    console.log('Returning applications:', applications.length);
    return applications;
  }

  async handleMemberApplicationById(
    clubId: string,
    applicationId: string,
    action: 'approve' | 'reject',
    clubCreatorId: string
  ) {
    const club = await this.clubModel.findById(clubId).populate('memberApplications.userId', 'firstName lastName email');
    
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Handle both string and ObjectId clubCreatorId types
    const clubCreatorObjectId = typeof clubCreatorId === 'string' ? new Types.ObjectId(clubCreatorId) : clubCreatorId;
    if (!club.createdBy.equals(clubCreatorObjectId)) {
      throw new ForbiddenException('Only club creator can handle applications');
    }

    const application = club.memberApplications.find(
      app => app._id.toString() === applicationId
    );

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    application.status = action === 'approve' ? 'approved' : 'rejected';

    if (action === 'approve') {
      // Check if user is already in members array
      const isAlreadyMember = club.members.some(
        memberId => memberId.toString() === application.userId.toString()
      );
      
      if (!isAlreadyMember) {
        // Add user to members array
        club.members.push(application.userId);
        
        // Also add club to user's joinedClubs array
        await this.userModel.findByIdAndUpdate(
          application.userId,
          { $addToSet: { joinedClubs: clubId } }
        );
      }
    }

    await club.save();
    
    return { 
      message: `Application ${action}d successfully`,
      application: {
        _id: application._id,
        userId: application.userId,
        status: application.status,
        appliedAt: application.appliedAt
      }
    };
  }

  async deleteClub(clubId: string, userId: string) {
    const club = await this.clubModel.findById(clubId);
    
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Handle both string and ObjectId userId types
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    if (!club.createdBy.equals(userObjectId)) {
      throw new ForbiddenException('Only club creator can delete the club');
    }

    // Delete all events associated with this club
    const deletedEvents = await this.eventModel.deleteMany({ clubId: clubId });
    console.log(`Deleted ${deletedEvents.deletedCount} events for deleted club`);

    // Remove club from all members' joinedClubs arrays
    if (club.members && club.members.length > 0) {
      await this.userModel.updateMany(
        { _id: { $in: club.members } },
        { $pull: { joinedClubs: clubId } }
      );
    }

    // Remove club from creator's createdClubs array
    await this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { createdClubs: clubId } }
    );

    // Delete the club
    await this.clubModel.findByIdAndDelete(clubId);

    return { 
      message: `Club deleted successfully. ${deletedEvents.deletedCount} associated events were also deleted.`
    };
  }

  async removeMember(clubId: string, userIdToRemove: string, requestingUserId: string) {
    const club = await this.clubModel.findById(clubId);
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Check if requesting user is the club creator
    if (!club.createdBy.equals(new this.clubModel.base.Types.ObjectId(requestingUserId))) {
      throw new ForbiddenException('Only club creator can remove members');
    }

    // Prevent club creator from removing themselves
    if (userIdToRemove === requestingUserId) {
      throw new BadRequestException('Club creator cannot remove themselves from the club');
    }

    // Check if user is actually a member
    const isMember = club.members.some(memberId => 
      memberId.equals(new this.clubModel.base.Types.ObjectId(userIdToRemove))
    );

    if (!isMember) {
      throw new NotFoundException('User is not a member of this club');
    }

    // Remove user from club members and their application record
    const updateResult = await this.clubModel.findByIdAndUpdate(
      clubId,
      { 
        $pull: { 
          members: userIdToRemove,
          // Remove application record by matching userId field
          memberApplications: { userId: new Types.ObjectId(userIdToRemove) }
        }
      },
      { new: true } // Return the updated document
    );

    console.log('Update result after member removal:', {
      clubId,
      userIdToRemove,
      membersCount: updateResult?.members?.length,
      applicationsCount: updateResult?.memberApplications?.length
    });

    // Remove club from user's joinedClubs
    await this.userModel.findByIdAndUpdate(
      userIdToRemove,
      { $pull: { joinedClubs: clubId } }
    );

    return { message: 'Member removed successfully' };
  }

  // Fix existing clubs where creator is not a member
  async fixCreatorMembership() {
    const clubs = await this.clubModel.find({});
    const fixedClubs: string[] = [];

    for (const club of clubs) {
      // Check if creator is already a member
      const creatorIsMember = club.members.some(memberId => 
        memberId.equals(club.createdBy)
      );

      if (!creatorIsMember) {
        // Add creator as member
        club.members.push(club.createdBy);
        await club.save();

        // Also add club to creator's joinedClubs array
        await this.userModel.findByIdAndUpdate(
          club.createdBy,
          { $addToSet: { joinedClubs: club._id } }
        );

        fixedClubs.push(club.name);
      }
    }

    return { 
      message: `Fixed creator membership for ${fixedClubs.length} clubs`,
      fixedClubs 
    };
  }
}
