import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ClubService } from './club.service';
import { CreateClubDto, UpdateClubDto, ApproveClubDto, HandleMemberApplicationDto } from '../dto/club.dto';
import { AuthGuard } from '../guards/auth.guard';
import { AdminGuard } from '../guards/admin.guard';

@Controller('clubs')
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createClub(@Body() createClubDto: CreateClubDto, @Request() req) {
    return this.clubService.createClub(createClubDto, req.user.userId);
  }

  @Get()
  async getAllClubs(@Query('status') status?: string) {
    if (status) {
      return this.clubService.getAllClubs(status);
    }
    return this.clubService.getApprovedClubs();
  }

  // List all users for debugging
  @Get('debug/all-users')
  async debugAllUsers() {
    console.log('=== DEBUG ALL USERS ENDPOINT CALLED ===');
    
    const userModel = this.clubService['userModel']; // Access the userModel
    const users = await userModel.find({}, 'firstName lastName email _id').limit(20);
    
    console.log('Found users:', users.length);
    
    return {
      users: users.map(user => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }))
    };
  }

  @Get('debug/user-clubs/:userId')
  async debugUserClubs(@Param('userId') userId: string) {
    console.log('=== DEBUG USER CLUBS ENDPOINT CALLED ===');
    console.log('User ID from params:', userId);
    
    const userModel = this.clubService['userModel']; // Access the userModel
    const clubModel = this.clubService['clubModel']; // Access the clubModel
    
    const user = await userModel.findById(userId);
    const allClubs = await clubModel.find({ createdBy: userId });
    
    if (!user) {
      return { error: 'User not found', userId: userId };
    }
    
    console.log('User found:', user.firstName, user.lastName, '- Email:', user.email);
    console.log('Clubs created by user:', allClubs.length);
    
    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        joinedClubs: user.joinedClubs || []
      },
      userCreatedClubsArray: user?.createdClubs || [],
      clubsCreatedByUser: allClubs.map(club => ({
        id: club._id,
        name: club.name,
        status: club.status,
        createdBy: club.createdBy
      })),
      // Also test the actual getUserClubs method
      getUserClubsResult: await this.clubService.getUserClubs(userId)
    };
  }

  @Get('my-clubs')
  @UseGuards(AuthGuard)
  async getUserClubs(@Request() req) {
    console.log('=== MY-CLUBS CONTROLLER CALLED ===');
    console.log('User from request:', req.user);
    console.log('User ID from request:', req.user?.userId);
    return this.clubService.getUserClubs(req.user.userId);
  }

  @Get('my-applications')
  @UseGuards(AuthGuard)
  async getUserApplications(@Request() req) {
    console.log('=== MY-APPLICATIONS ENDPOINT CALLED ===');
    console.log('User from request:', req.user);
    console.log('User ID:', req.user?.userId);
    return this.clubService.getUserApplications(req.user.userId);
  }

  @Get('create-test-application/:clubId/:userId')
  async createTestApplication(@Param('clubId') clubId: string, @Param('userId') userId: string) {
    console.log('=== CREATING TEST APPLICATION ===');
    console.log('Club ID:', clubId);
    console.log('User ID:', userId);
    
    const clubModel = this.clubService['clubModel'];
    
    try {
      const club = await clubModel.findById(clubId);
      if (!club) {
        return { error: 'Club not found' };
      }
      
      // Add test application
      club.memberApplications.push({
        _id: new this.clubService['mongoose'].Types.ObjectId(),
        userId: new this.clubService['mongoose'].Types.ObjectId(userId),
        status: 'pending',
        appliedAt: new Date(),
      });
      
      await club.save();
      
      console.log('Test application created successfully');
      return { 
        message: 'Test application created',
        clubName: club.name,
        applicationsCount: club.memberApplications.length
      };
    } catch (error) {
      console.error('Error creating test application:', error);
      return { error: error.message };
    }
  }
  async testApplications() {
    console.log('=== TEST APPLICATIONS ENDPOINT CALLED ===');
    
    const clubModel = this.clubService['clubModel'];
    
    try {
      // Get all clubs
      const allClubs = await clubModel.find({}).select('name memberApplications');
      console.log('Total clubs found:', allClubs.length);
      
      // Count total applications
      let totalApplications = 0;
      const clubsWithApps: any[] = [];
      
      allClubs.forEach(club => {
        if (club.memberApplications && club.memberApplications.length > 0) {
          totalApplications += club.memberApplications.length;
          clubsWithApps.push({
            clubName: club.name,
            applicationsCount: club.memberApplications.length,
            applications: club.memberApplications.map(app => ({
              userId: app.userId.toString(),
              status: app.status,
              appliedAt: app.appliedAt
            }))
          });
        }
      });
      
      console.log('Total applications in database:', totalApplications);
      console.log('Clubs with applications:', clubsWithApps.length);
      
      return {
        totalClubs: allClubs.length,
        totalApplications,
        clubsWithApplications: clubsWithApps.length,
        clubsWithApps
      };
    } catch (error) {
      console.error('Test endpoint error:', error);
      return { error: error.message };
    }
  }

  @Get('debug/applications/:userId')
  async debugUserApplications(@Param('userId') userId: string) {
    console.log('=== DEBUG APPLICATIONS CALLED ===');
    console.log('User ID:', userId);
    
    const clubModel = this.clubService['clubModel'];
    
    // Get all clubs with their applications
    const allClubs = await clubModel.find({}).select('name memberApplications');
    console.log('Total clubs found:', allClubs.length);
    
    // Filter clubs that have applications for this user
    const clubsWithUserApplications = allClubs.filter(club => 
      club.memberApplications && club.memberApplications.some(app => 
        app.userId.toString() === userId
      )
    );
    
    console.log('Clubs with user applications:', clubsWithUserApplications.length);
    
    const applications: { clubId: unknown; clubName: string; status: string; appliedAt: Date }[] = [];
    clubsWithUserApplications.forEach(club => {
      const userApp = club.memberApplications.find(app => app.userId.toString() === userId);
      if (userApp) {
        applications.push({
          clubId: club._id,
          clubName: club.name,
          status: userApp.status,
          appliedAt: userApp.appliedAt
        });
      }
    });
    
    return {
      totalClubs: allClubs.length,
      clubsWithUserApplications: clubsWithUserApplications.length,
      applications,
      allClubsData: allClubs.map(c => ({
        name: c.name,
        applicationsCount: c.memberApplications?.length || 0,
        applications: c.memberApplications?.map(app => ({
          userId: app.userId.toString(),
          status: app.status
        })) || []
      }))
    };
  }

  @Get('pending')
  @UseGuards(AdminGuard)
  async getPendingClubs() {
    return this.clubService.getPendingClubs();
  }

  @Get(':id')
  async getClubById(@Param('id') id: string) {
    return this.clubService.getClubById(id);
  }

  @Get(':id/applications')
  @UseGuards(AuthGuard)
  async getClubApplications(@Param('id') id: string, @Request() req) {
    return this.clubService.getClubApplications(id, req.user.userId);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateClub(
    @Param('id') id: string,
    @Body() updateClubDto: UpdateClubDto,
    @Request() req
  ) {
    return this.clubService.updateClub(id, updateClubDto, req.user.userId);
  }

  @Post(':id/apply')
  @UseGuards(AuthGuard)
  async applyToJoinClub(@Param('id') id: string, @Request() req) {
    return this.clubService.applyToJoinClub(id, req.user.userId);
  }

  @Delete(':id/withdraw-application')
  @UseGuards(AuthGuard)
  async withdrawApplication(@Param('id') id: string, @Request() req) {
    return this.clubService.withdrawApplication(id, req.user.userId);
  }

  @Put(':id/applications/:userId')
  @UseGuards(AuthGuard)
  async handleMemberApplication(
    @Param('id') clubId: string,
    @Param('userId') userId: string,
    @Body() handleApplicationDto: HandleMemberApplicationDto,
    @Request() req
  ) {
    return this.clubService.handleMemberApplication(
      clubId,
      userId,
      handleApplicationDto,
      req.user.userId
    );
  }

  @Patch(':id/applications/:applicationId')
  @UseGuards(AuthGuard)
  async handleMemberApplicationById(
    @Param('id') clubId: string,
    @Param('applicationId') applicationId: string,
    @Body() body: { action: 'approve' | 'reject' },
    @Request() req
  ) {
    return this.clubService.handleMemberApplicationById(
      clubId,
      applicationId,
      body.action,
      req.user.userId
    );
  }

  @Put(':id/approve')
  @UseGuards(AdminGuard)
  async approveClub(
    @Param('id') id: string,
    @Body() approveClubDto: ApproveClubDto,
    @Request() req
  ) {
    return this.clubService.approveClub(id, approveClubDto, req.user.userId);
  }

  @Patch(':id/admin-action')
  @UseGuards(AuthGuard, AdminGuard)
  async handleAdminAction(
    @Param('id') clubId: string,
    @Body() body: { action: 'approve' | 'reject' }
  ) {
    return this.clubService.handleAdminAction(clubId, body.action);
  }

  @Delete(':id/members/:userId')
  @UseGuards(AuthGuard)
  async removeMember(
    @Param('id') clubId: string,
    @Param('userId') userId: string,
    @Request() req
  ) {
    return this.clubService.removeMember(clubId, userId, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteClub(@Param('id') id: string, @Request() req) {
    return this.clubService.deleteClub(id, req.user.userId);
  }

  @Post('fix-creator-membership')
  @UseGuards(AdminGuard)
  async fixCreatorMembership() {
    return this.clubService.fixCreatorMembership();
  }

  @Get('test-cascade-deletion/:clubId')
  async testCascadeDeletion(@Param('clubId') clubId: string) {
    // This is a test endpoint to verify cascade deletion works
    const eventModel = this.clubService['eventModel'];
    const eventsCount = await eventModel.countDocuments({ clubId: clubId });
    
    return {
      clubId,
      eventsAssociated: eventsCount,
      message: `This club has ${eventsCount} events that would be deleted if the club is deleted/rejected`
    };
  }
}
