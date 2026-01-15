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
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '../guards/auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { ReportService } from './report.service';
import { CreateReportDto, UpdateReportStatusDto, ReportQueryDto, ReportResponseDto, ReportStatsDto } from './report.dto';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('attachments', 5, {
    storage: diskStorage({
      destination: './uploads/reports',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        cb(null, `report-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      // Only allow images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only image files are allowed'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit per file
    },
  }))
  async createReport(
    @Body() createReportDto: CreateReportDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ): Promise<ReportResponseDto> {
    console.log('ReportController: Creating report:', createReportDto);

    // Add file URLs to the DTO
    if (files && files.length > 0) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:8000';
      createReportDto.attachments = files.map(file => `${baseUrl}/reports/attachment/${file.filename}`);
    }

    return this.reportService.createReport(createReportDto, req.user.userId);
  }

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  async getReports(@Query() queryDto: ReportQueryDto): Promise<{
    reports: ReportResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    console.log('ReportController: Getting reports with query:', queryDto);
    return this.reportService.getReports(queryDto, true);
  }

  @Get('my-reports')
  @UseGuards(AuthGuard)
  async getUserReports(
    @Query() queryDto: ReportQueryDto,
    @Request() req,
  ): Promise<{
    reports: ReportResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    console.log('ReportController: Getting user reports for:', req.user.userId);
    return this.reportService.getUserReports(req.user.userId, queryDto);
  }

  @Get('stats')
  @UseGuards(AuthGuard, AdminGuard)
  async getReportStats(): Promise<ReportStatsDto> {
    console.log('ReportController: Getting report statistics');
    return this.reportService.getReportStats();
  }

  @Get(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async getReport(@Param('id') id: string): Promise<ReportResponseDto> {
    console.log('ReportController: Getting report:', id);
    // This will be implemented in the service if needed
    throw new BadRequestException('Not implemented yet');
  }

  @Put(':id/status')
  @UseGuards(AuthGuard, AdminGuard)
  async updateReportStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateReportStatusDto,
    @Request() req,
  ): Promise<ReportResponseDto> {
    console.log('ReportController: Updating report status:', id, updateDto);
    return this.reportService.updateReportStatus(id, updateDto, req.user.userId);
  }

  @Post(':id/take-action')
  @UseGuards(AuthGuard, AdminGuard)
  async takeActionOnReportedItem(
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ success: boolean; message: string }> {
    console.log('ReportController: Taking action on reported item:', id);
    return this.reportService.takeActionOnReportedItem(id, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async deleteReport(
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    console.log('ReportController: Deleting report:', id);
    await this.reportService.deleteReport(id, req.user.userId);
    return { message: 'Report deleted successfully' };
  }

  @Get('attachment/:filename')
  async getAttachment(@Param('filename') filename: string): Promise<any> {
    // This would serve the uploaded attachment files
    // Implementation similar to file serving in FileController
    console.log('ReportController: Serving attachment:', filename);
    throw new BadRequestException('Attachment serving not implemented yet');
  }
}
