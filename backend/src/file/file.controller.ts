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
  UploadedFiles,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createReadStream } from 'fs';
import { AuthGuard } from '../guards/auth.guard';
import { FileService } from './file.service';
import { UploadFileDto, UpdateFileDto, FileQueryDto, FileResponseDto } from './file.dto';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/files',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        cb(null, `file-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      // Allow all file types but validate size and type on service level
      cb(null, true);
    },
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
    },
  }))
  async uploadFile(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
  ): Promise<FileResponseDto> {
    console.log('FileController: Uploading file for user:', req.user.userId);
    
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.fileService.uploadFile(file, uploadFileDto, req.user.userId);
  }

  @Post('upload/multiple')
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({
      destination: './uploads/files',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        cb(null, `file-${uniqueSuffix}${ext}`);
      },
    }),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB per file
    },
  }))
  async uploadMultipleFiles(
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadFileDto: UploadFileDto,
  ): Promise<FileResponseDto[]> {
    console.log('FileController: Uploading multiple files for user:', req.user.userId, 'count:', files?.length);
    
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    return this.fileService.uploadMultipleFiles(files, uploadFileDto, req.user.userId);
  }

  @Get()
  async getFiles(
    @Query() queryDto: FileQueryDto,
    @Request() req,
  ): Promise<{
    files: FileResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    console.log('FileController: Getting files with query:', queryDto);
    // Allow access without authentication
    const userId = req.user?.userId;
    return this.fileService.getFiles(queryDto, userId);
  }

  @Get('search')
  async searchFiles(
    @Query('query') searchQuery: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Request() req,
  ): Promise<{
    files: FileResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    console.log('FileController: Searching files with query:', searchQuery);
    
    if (!searchQuery) {
      throw new BadRequestException('Search query is required');
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    
    // Allow access without authentication
    const userId = req.user?.userId;
    return this.fileService.searchFiles(searchQuery, pageNum, limitNum, userId);
  }

  @Get('my-files')
  @UseGuards(AuthGuard)
  async getMyFiles(
    @Request() req,
    @Query() queryDto: FileQueryDto,
  ): Promise<{
    files: FileResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    console.log('FileController: Getting files for user:', req.user.userId);
    return this.fileService.getFiles({ ...queryDto, uploadedBy: req.user.userId }, req.user.userId);
  }

  @Get('stats')
  @UseGuards(AuthGuard)
  async getFileStats(@Request() req): Promise<any> {
    console.log('FileController: Getting file stats for user:', req.user.userId);
    return this.fileService.getFileStats(req.user.userId);
  }

  @Get('public/stats')
  async getPublicFileStats(): Promise<any> {
    console.log('FileController: Getting public file stats');
    return this.fileService.getFileStats();
  }

  @Get('gallery')
  async getPublicGallery(
    @Query('category') category?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{
    files: FileResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    console.log('FileController: Getting public gallery, category:', category, 'page:', page, 'limit:', limit);
    return this.fileService.getPublicGallery(category, page || 1, limit || 20);
  }

  @Get('serve/:id')
  async serveFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    console.log('FileController: Serving file:', id);
    
    const { file, path } = await this.fileService.serveFile(id);
    
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': `inline; filename="${file.originalname}"`,
      'Cache-Control': 'public, max-age=31536000',
    });

    const stream = createReadStream(path);
    return new StreamableFile(stream);
  }

  @Get('serve/:id/thumbnail')
  async serveThumbnail(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    console.log('FileController: Serving thumbnail for file:', id);
    
    const { file, path } = await this.fileService.serveThumbnail(id);
    
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `inline; filename="${file.filename}_thumb.jpg"`,
      'Cache-Control': 'public, max-age=31536000',
    });

    const stream = createReadStream(path);
    return new StreamableFile(stream);
  }

  @Get('download/:id')
  async downloadFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    console.log('FileController: Downloading file:', id);
    
    const { file, path } = await this.fileService.serveFile(id);
    
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': `attachment; filename="${file.originalname}"`,
    });

    const stream = createReadStream(path);
    return new StreamableFile(stream);
  }

  @Get(':id')
  async getFileById(
    @Param('id') id: string,
    @Request() req,
  ): Promise<FileResponseDto> {
    console.log('FileController: Getting file by ID:', id);
    const userId = req.user?.userId;
    return this.fileService.getFileById(id, userId);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateFile(
    @Param('id') id: string,
    @Body() updateFileDto: UpdateFileDto,
    @Request() req,
  ): Promise<FileResponseDto> {
    console.log('FileController: Updating file:', id, 'by user:', req.user.userId);
    return this.fileService.updateFile(id, updateFileDto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteFile(
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    console.log('FileController: Deleting file:', id);
    // Use a default user ID if no authentication
    const userId = req.user?.userId || 'anonymous';
    return this.fileService.deleteFile(id, userId);
  }
}
