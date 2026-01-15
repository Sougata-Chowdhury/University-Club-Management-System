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
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnnouncementService } from './announcement.service';
import { FileService } from '../file/file.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from '../dto/announcement.dto';
import { AuthGuard } from '../guards/auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService, private readonly fileService: FileService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/announcements',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `announcement-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Only image files are allowed'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async createAnnouncement(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @UploadedFile() file: any,
    @Request() req
  ) {
    if (file) {
      const relatedId = (createAnnouncementDto as any).clubId || null;
      const uploaded = await this.fileService.uploadFile(file, { category: 'announcement', relatedId } as any, req.user.userId);
      createAnnouncementDto.image = uploaded.url;
    }

    return this.announcementService.createAnnouncement(createAnnouncementDto, req.user.userId);
  }

  @Get()
  async getAllAnnouncements(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.announcementService.getAllAnnouncements(pageNum, limitNum);
  }

  @Get('admin/all')
  @UseGuards(AdminGuard)
  async getAllAnnouncementsForAdmin(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.announcementService.getAllAnnouncementsForAdmin(pageNum, limitNum);
  }

  @Get('my-announcements')
  @UseGuards(AuthGuard)
  async getUserAnnouncements(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.announcementService.getUserAnnouncements(req.user.userId, pageNum, limitNum);
  }

  @Get('stats')
  @UseGuards(AuthGuard)
  async getAnnouncementStats(@Request() req) {
    return this.announcementService.getAnnouncementStats(req.user.userId);
  }

  @Get('club/:clubId')
  async getAnnouncementsByClub(
    @Param('clubId') clubId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.announcementService.getAnnouncementsByClub(clubId, pageNum, limitNum);
  }

  @Get(':id')
  async getAnnouncementById(@Param('id') id: string) {
    return this.announcementService.getAnnouncementById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/announcements',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `announcement-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Only image files are allowed'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
    @UploadedFile() file: any,
    @Request() req
  ) {
    if (file) {
      const relatedId = (updateAnnouncementDto as any).clubId || null;
      const uploaded = await this.fileService.uploadFile(file, { category: 'announcement', relatedId } as any, req.user.userId);
      updateAnnouncementDto.image = uploaded.url;
    }

    return this.announcementService.updateAnnouncement(id, updateAnnouncementDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteAnnouncement(@Param('id') id: string, @Request() req) {
    return this.announcementService.deleteAnnouncement(id, req.user.userId);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard)
  async toggleLike(@Param('id') id: string, @Request() req) {
    return this.announcementService.toggleLike(id, req.user.userId);
  }
}
