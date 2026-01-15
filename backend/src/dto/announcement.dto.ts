import { IsString, IsNotEmpty, IsOptional, MaxLength, IsMongoId } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  @MaxLength(500, { message: 'Message must not exceed 500 characters' })
  message: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsMongoId({ message: 'Invalid club ID' })
  clubId: string;
}

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Message must not exceed 500 characters' })
  message?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  isActive?: boolean;
}

export class LikeAnnouncementDto {
  @IsMongoId({ message: 'Invalid announcement ID' })
  announcementId: string;
}
