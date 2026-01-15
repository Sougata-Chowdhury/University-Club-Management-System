import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '../guards/auth.guard';
import { UserService } from './user.service';
import { FileService } from '../file/file.service';
import {
  UpdateUserProfileDto,
  UpdateUserSettingsDto,
  ChangePasswordDto,
  UserResponseDto
} from './user.dto';

@Controller('users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService, private readonly fileService: FileService) {}

  @Get('profile')
  async getProfile(@Request() req): Promise<UserResponseDto> {
    console.log('UserController: Getting profile for user:', req.user.userId);
    return this.userService.getUserProfile(req.user.userId);
  }

  @Put('profile')
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateUserProfileDto,
  ): Promise<UserResponseDto> {
    console.log('UserController: Updating profile for user:', req.user.userId, updateProfileDto);
    return this.userService.updateUserProfile(req.user.userId, updateProfileDto);
  }

  @Post('profile/upload-picture')
  @UseInterceptors(FileInterceptor('profilePicture', {
    storage: diskStorage({
      destination: './uploads/profiles',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `profile-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Only image files (jpg, jpeg, png, gif) are allowed'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async uploadProfilePicture(
    @Request() req,
    @UploadedFile() file: any,
  ): Promise<UserResponseDto> {
    console.log('UserController: Uploading profile picture for user:', req.user.userId, file?.filename);
    
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const uploaded = await this.fileService.uploadFile(file, { category: 'profile', relatedId: req.user.userId, isPublic: true } as any, req.user.userId);
    return this.userService.updateUserProfile(req.user.userId, { profilePicture: uploaded.url });
  }

  @Put('settings')
  async updateSettings(
    @Request() req,
    @Body() updateSettingsDto: UpdateUserSettingsDto,
  ): Promise<UserResponseDto> {
    console.log('UserController: Updating settings for user:', req.user.userId, updateSettingsDto);
    return this.userService.updateUserSettings(req.user.userId, updateSettingsDto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    console.log('UserController: Changing password for user:', req.user.userId);
    return this.userService.changePassword(req.user.userId, changePasswordDto);
  }

  @Get('activity')
  async getUserActivity(
    @Request() req,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<any[]> {
    console.log('UserController: Getting activity for user:', req.user.userId, 'limit:', limit);
    return this.userService.getUserActivity(req.user.userId, limit);
  }

  @Post('deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateAccount(@Request() req): Promise<{ message: string }> {
    console.log('UserController: Deactivating account for user:', req.user.userId);
    return this.userService.deactivateUser(req.user.userId);
  }

  @Get('all')
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{users: UserResponseDto[], total: number, page: number, totalPages: number}> {
    console.log('UserController: Getting all users, page:', page, 'limit:', limit);
    return this.userService.getAllUsers(page, limit);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    console.log('UserController: Getting user by ID:', id);
    return this.userService.getUserProfile(id);
  }

  @Post(':id/activity')
  @HttpCode(HttpStatus.CREATED)
  async logActivity(
    @Param('id') userId: string,
    @Body() activityDto: any,
  ): Promise<{ message: string }> {
    console.log('UserController: Logging activity for user:', userId, activityDto);
    await this.userService.logUserActivity(userId, activityDto);
    return { message: 'Activity logged successfully' };
  }
}
