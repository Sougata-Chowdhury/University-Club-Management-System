import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File } from './file.schema';
import { UploadFileDto, UpdateFileDto, FileQueryDto, FileResponseDto } from './file.dto';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

@Injectable()
export class FileService {
  constructor(
    @InjectModel(File.name) private fileModel: Model<File>,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    uploadFileDto: UploadFileDto,
    userId: string,
  ): Promise<FileResponseDto> {
    try {
      console.log('FileService: Uploading file:', file.originalname, 'by user:', userId);

      // Create file document
      const fileDocument = new this.fileModel({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedBy: userId,
        category: uploadFileDto.category || 'general',
        relatedId: uploadFileDto.relatedId,
        alt: uploadFileDto.alt,
        description: uploadFileDto.description,
        isPublic: uploadFileDto.isPublic || false,
        tags: uploadFileDto.tags || [],
        status: 'active',
      });

      // Process image metadata if it's an image
      if (file.mimetype.startsWith('image/')) {
        try {
          const metadata = await sharp(file.path).metadata();
          fileDocument.metadata = {
            width: metadata.width,
            height: metadata.height,
          };

          // Create thumbnail for images
          if (metadata.width && metadata.width > 300) {
            const thumbnailPath = this.generateThumbnailPath(file.path);
            await sharp(file.path)
              .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 80 })
              .toFile(thumbnailPath);
            
            fileDocument.metadata.thumbnailPath = thumbnailPath;
          }
        } catch (error) {
          console.warn('Failed to process image metadata:', error);
        }
      }

      // Upload file to Cloudinary
      try {
        const uploadResult: any = await cloudinary.uploader.upload(file.path, {
          folder: 'cse470',
        });

        fileDocument.path = uploadResult.secure_url;
        fileDocument.cloudinary = {
          public_id: uploadResult.public_id,
          resource_type: uploadResult.resource_type,
        };
      } catch (err) {
        console.warn('Cloudinary upload failed, falling back to local path:', err);
      }

      // Upload thumbnail (if created) to Cloudinary
      if (fileDocument.metadata?.thumbnailPath) {
        try {
          const thumbUpload: any = await cloudinary.uploader.upload(fileDocument.metadata.thumbnailPath, {
            folder: 'cse470/thumbnails',
          });
          fileDocument.metadata.thumbnailPath = thumbUpload.secure_url;
        } catch (err) {
          console.warn('Cloudinary thumbnail upload failed:', err);
        }
      }

      // Attempt to remove local original file after upload
      try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }

      const savedFile = await fileDocument.save();
      return this.toFileResponseDto(savedFile);
    } catch (error) {
      console.error('FileService: Error uploading file:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    uploadFileDto: UploadFileDto,
    userId: string,
  ): Promise<FileResponseDto[]> {
    console.log('FileService: Uploading multiple files, count:', files.length);
    
    const uploadPromises = files.map(file => 
      this.uploadFile(file, uploadFileDto, userId)
    );
    
    return Promise.all(uploadPromises);
  }

  async getFiles(queryDto: FileQueryDto, userId?: string): Promise<{
    files: FileResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    console.log('FileService: Getting files with query:', queryDto);

    const query: any = {};

    // Build query conditions
    if (queryDto.category) query.category = queryDto.category;
    if (queryDto.relatedId) query.relatedId = queryDto.relatedId;
    if (queryDto.uploadedBy) query.uploadedBy = queryDto.uploadedBy;
    if (queryDto.status) query.status = queryDto.status;
    else query.status = { $ne: 'deleted' }; // Exclude deleted files by default

    // File type filtering based on mimetype
    if (queryDto.type) {
      switch (queryDto.type.toLowerCase()) {
        case 'image':
          query.mimetype = { $regex: '^image/', $options: 'i' };
          break;
        case 'video':
          query.mimetype = { $regex: '^video/', $options: 'i' };
          break;
        case 'audio':
          query.mimetype = { $regex: '^audio/', $options: 'i' };
          break;
        case 'document':
          query.mimetype = { 
            $regex: '^(application/|text/)', 
            $options: 'i' 
          };
          break;
        default:
          // If type is not recognized, don't filter by type
          break;
      }
    }

    // Public files or user's own files or all files if no user
    if (userId) {
      query.$or = [
        { isPublic: true },
        { uploadedBy: userId }
      ];
    } else {
      // If no userId provided, show all files (not just public)
      // Remove the public-only restriction for anonymous access
      // query.isPublic = true; // Commented out to show all files
    }

    if (queryDto.isPublic !== undefined) query.isPublic = queryDto.isPublic;
    if (queryDto.tags && queryDto.tags.length > 0) {
      query.tags = { $in: queryDto.tags };
    }

    // Search functionality
    if (queryDto.search) {
      query.$or = [
        { originalname: { $regex: queryDto.search, $options: 'i' } },
        { description: { $regex: queryDto.search, $options: 'i' } },
        { alt: { $regex: queryDto.search, $options: 'i' } },
        { tags: { $in: [new RegExp(queryDto.search, 'i')] } }
      ];
    }

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      this.fileModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.fileModel.countDocuments(query).exec(),
    ]);

    const fileResponses = files.map(file => this.toFileResponseDto(file));

    return {
      files: fileResponses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchFiles(searchQuery: string, page: number = 1, limit: number = 20, userId?: string): Promise<{
    files: FileResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    console.log('FileService: Searching files with query:', searchQuery);

    const query: any = {
      status: { $ne: 'deleted' }, // Exclude deleted files
      $or: [
        { originalname: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { alt: { $regex: searchQuery, $options: 'i' } },
        { tags: { $in: [new RegExp(searchQuery, 'i')] } }
      ]
    };

    // Show all files for search (not restricted to public or user files)
    // This allows comprehensive search across all available files

    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      this.fileModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.fileModel.countDocuments(query).exec(),
    ]);

    const fileResponses = files.map(file => this.toFileResponseDto(file));

    return {
      files: fileResponses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFileById(id: string, userId?: string): Promise<FileResponseDto> {
    console.log('FileService: Getting file by ID:', id);

    const file = await this.fileModel.findById(id).exec();
    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check access permissions
    if (!file.isPublic && file.uploadedBy !== userId) {
      throw new NotFoundException('File not found');
    }

    return this.toFileResponseDto(file);
  }

  async updateFile(id: string, updateFileDto: UpdateFileDto, userId: string): Promise<FileResponseDto> {
    console.log('FileService: Updating file:', id, 'by user:', userId);

    const file = await this.fileModel.findById(id).exec();
    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check ownership
    if (file.uploadedBy !== userId) {
      throw new BadRequestException('You can only update your own files');
    }

    const updatedFile = await this.fileModel
      .findByIdAndUpdate(id, updateFileDto, { new: true })
      .exec();

    return this.toFileResponseDto(updatedFile);
  }

  async deleteFile(id: string, userId: string): Promise<{ message: string }> {
    console.log('FileService: Deleting file:', id, 'by user:', userId);

    const file = await this.fileModel.findById(id).exec();
    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Allow deletion of any file - remove ownership check
    // Original ownership check was: if (file.uploadedBy !== userId)

    // Soft delete - mark as deleted instead of removing
    await this.fileModel.findByIdAndUpdate(id, { status: 'deleted' }).exec();

    // Optionally, delete physical file (commented out for safety)
    // try {
    //   if (fs.existsSync(file.path)) {
    //     fs.unlinkSync(file.path);
    //   }
    //   if (file.metadata?.thumbnailPath && fs.existsSync(file.metadata.thumbnailPath)) {
    //     fs.unlinkSync(file.metadata.thumbnailPath);
    //   }
    // } catch (error) {
    //   console.warn('Failed to delete physical file:', error);
    // }

    return { message: 'File deleted successfully' };
  }

  async getFileStats(userId?: string): Promise<any> {
    console.log('FileService: Getting file statistics');

    const baseQuery = userId ? { uploadedBy: userId } : {};
    const activeQuery = { ...baseQuery, status: 'active' };

    const [
      totalFiles,
      totalImages,
      totalVideos,
      totalDocuments,
      totalSize,
      recentFiles,
      categoryCounts
    ] = await Promise.all([
      this.fileModel.countDocuments(activeQuery),
      this.fileModel.countDocuments({ ...activeQuery, mimetype: { $regex: '^image/' } }),
      this.fileModel.countDocuments({ ...activeQuery, mimetype: { $regex: '^video/' } }),
      this.fileModel.countDocuments({ 
        ...activeQuery, 
        mimetype: { $in: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] }
      }),
      this.fileModel.aggregate([
        { $match: activeQuery },
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ]).then(result => result[0]?.totalSize || 0),
      this.fileModel
        .find(activeQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .exec(),
      this.fileModel.aggregate([
        { $match: activeQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    return {
      totalFiles,
      totalImages,
      totalVideos,
      totalDocuments,
      totalSize,
      formattedSize: this.formatFileSize(totalSize),
      recentFiles: recentFiles.map(file => this.toFileResponseDto(file)),
      categoryCounts
    };
  }

  async getPublicGallery(category?: string, page: number = 1, limit: number = 20): Promise<{
    files: FileResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    console.log('FileService: Getting public gallery, category:', category, 'page:', page, 'limit:', limit);

    const query: any = {
      status: 'active',
      // Remove isPublic filter and mimetype filter to show all active files
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    const skip = (page - 1) * limit;
    const total = await this.fileModel.countDocuments(query);
    const files = await this.fileModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      files: files.map(file => this.toFileResponseDto(file)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  private toFileResponseDto(file: any): FileResponseDto {
    const baseUrl = process.env.BASE_URL || 'http://localhost:8000';
    
    return {
      id: file._id.toString(),
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `${baseUrl}/files/serve/${file._id}`,
      uploadedBy: file.uploadedBy,
      category: file.category,
      relatedId: file.relatedId,
      status: file.status,
      alt: file.alt,
      description: file.description,
      isPublic: file.isPublic,
      tags: file.tags,
      metadata: file.metadata ? {
        ...file.metadata,
        thumbnailUrl: file.metadata.thumbnailPath ? 
          `${baseUrl}/files/serve/${file._id}/thumbnail` : undefined
      } : undefined,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  private generateThumbnailPath(originalPath: string): string {
    const parsed = path.parse(originalPath);
    return path.join(parsed.dir, `${parsed.name}_thumb.jpg`);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async serveFile(id: string): Promise<{ file: any; path: string }> {
    const file = await this.fileModel.findById(id).exec();
    if (!file || file.status === 'deleted') {
      throw new NotFoundException('File not found');
    }

    if (!fs.existsSync(file.path)) {
      throw new NotFoundException('Physical file not found');
    }

    return { file, path: file.path };
  }

  async serveThumbnail(id: string): Promise<{ file: any; path: string }> {
    const file = await this.fileModel.findById(id).exec();
    if (!file || file.status === 'deleted') {
      throw new NotFoundException('File not found');
    }

    const thumbnailPath = file.metadata?.thumbnailPath;
    if (!thumbnailPath || !fs.existsSync(thumbnailPath)) {
      throw new NotFoundException('Thumbnail not found');
    }

    return { file, path: thumbnailPath };
  }
}
