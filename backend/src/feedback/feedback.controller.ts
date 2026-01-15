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
  Request,
  HttpStatus,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { Roles } from '../decorators/roles.decorator';
import { FeedbackService } from './feedback.service';
import {
  CreateFeedbackDto,
  UpdateFeedbackStatusDto,
  FeedbackQueryDto,
  VoteFeedbackDto,
} from './feedback.dto';

@Controller('feedback')
@UseGuards(AuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async createFeedback(
    @Body() createFeedbackDto: CreateFeedbackDto,
    @Request() req: any,
  ) {
    const feedback = await this.feedbackService.createFeedback(
      createFeedbackDto,
      req.user.userId,
    );
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Feedback created successfully',
      data: feedback,
    };
  }

  @Get()
  async getFeedback(
    @Query() query: FeedbackQueryDto,
    @Query('admin', new DefaultValuePipe(false), ParseBoolPipe) isAdmin: boolean,
    @Request() req: any,
  ) {
    // Check if user is actually admin
    const userIsAdmin = req.user.role === 'admin' && isAdmin;
    
    const result = await this.feedbackService.getFeedback(
      query,
      req.user.userId,
      userIsAdmin,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Feedback retrieved successfully',
      data: result,
    };
  }

  @Get('stats')
  async getFeedbackStats(
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
  ) {
    const stats = await this.feedbackService.getFeedbackStats(targetType, targetId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Feedback statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('my-feedback')
  async getMyFeedback(
    @Query() query: FeedbackQueryDto,
    @Request() req: any,
  ) {
    // Force filter to user's own feedback
    const userQuery = {
      ...query,
      userId: req.user.userId,
    };
    
    const result = await this.feedbackService.getFeedback(
      userQuery,
      req.user.userId,
      false,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Your feedback retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  async getFeedbackById(
    @Param('id') id: string,
    @Query('admin', new DefaultValuePipe(false), ParseBoolPipe) isAdmin: boolean,
    @Request() req: any,
  ) {
    const userIsAdmin = req.user.role === 'admin' && isAdmin;
    
    const feedback = await this.feedbackService.getFeedbackById(
      id,
      req.user.userId,
      userIsAdmin,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Feedback retrieved successfully',
      data: feedback,
    };
  }

  @Put(':id/status')
  @UseGuards(AdminGuard)
  @Roles('admin')
  async updateFeedbackStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateFeedbackStatusDto,
    @Request() req: any,
  ) {
    const feedback = await this.feedbackService.updateFeedbackStatus(
      id,
      updateStatusDto,
      req.user.userId,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Feedback status updated successfully',
      data: feedback,
    };
  }

  @Post(':id/vote')
  async voteFeedback(
    @Param('id') id: string,
    @Body() voteDto: VoteFeedbackDto,
    @Request() req: any,
  ) {
    const feedback = await this.feedbackService.voteFeedback(
      id,
      voteDto,
      req.user.userId,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Vote recorded successfully',
      data: feedback,
    };
  }

  @Delete(':id')
  async deleteFeedback(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const isAdmin = req.user.role === 'admin';
    
    await this.feedbackService.deleteFeedback(
      id,
      req.user.userId,
      isAdmin,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Feedback deleted successfully',
    };
  }

  // Admin-only endpoints
  @Get('admin/pending')
  @UseGuards(AdminGuard)
  @Roles('admin')
  async getPendingFeedback(
    @Query() query: FeedbackQueryDto,
  ) {
    const pendingQuery = {
      ...query,
      status: 'pending',
    };
    
    const result = await this.feedbackService.getFeedback(
      pendingQuery,
      undefined,
      true,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Pending feedback retrieved successfully',
      data: result,
    };
  }

  @Get('admin/all')
  @UseGuards(AdminGuard)
  @Roles('admin')
  async getAllFeedback(
    @Query() query: FeedbackQueryDto,
  ) {
    const result = await this.feedbackService.getFeedback(
      query,
      undefined,
      true,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'All feedback retrieved successfully',
      data: result,
    };
  }

  @Get('target/:targetType/:targetId')
  async getTargetFeedback(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Query() query: FeedbackQueryDto,
    @Request() req: any,
  ) {
    const targetQuery = {
      ...query,
      targetType,
      targetId,
    };
    
    const result = await this.feedbackService.getFeedback(
      targetQuery,
      req.user.userId,
      req.user.role === 'admin',
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: `${targetType} feedback retrieved successfully`,
      data: result,
    };
  }

  @Get('target/:targetType/:targetId/stats')
  async getTargetFeedbackStats(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    const stats = await this.feedbackService.getFeedbackStats(targetType, targetId);
    
    return {
      statusCode: HttpStatus.OK,
      message: `${targetType} feedback statistics retrieved successfully`,
      data: stats,
    };
  }
}
