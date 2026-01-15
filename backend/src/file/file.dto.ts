import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, IsNumber, IsNotEmpty } from 'class-validator';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  category?: string = 'general';

  @IsOptional()
  @IsString()
  relatedId?: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateFileDto {
  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(['active', 'deleted', 'archived'])
  status?: string;
}

export class FileQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  relatedId?: string;

  @IsOptional()
  @IsString()
  uploadedBy?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsEnum(['active', 'deleted', 'archived'])
  status?: string;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  type?: string; // For file type filtering (image, video, document, etc.)
}

export class FileResponseDto {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  uploadedBy: string;
  category: string;
  relatedId?: string;
  status: string;
  alt?: string;
  description?: string;
  isPublic: boolean;
  tags?: string[];
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    thumbnailPath?: string;
    thumbnailUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
