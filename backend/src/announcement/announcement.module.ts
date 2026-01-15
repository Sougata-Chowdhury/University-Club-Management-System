import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { AnnouncementController } from './announcement.controller';
import { AnnouncementService } from './announcement.service';
import { Announcement, AnnouncementSchema } from '../schemas/announcement.schema';
import { Club, ClubSchema } from '../schemas/club.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Announcement.name, schema: AnnouncementSchema },
      { name: Club.name, schema: ClubSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/announcements',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, `announcement-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
    AuthModule,
  ],
  controllers: [AnnouncementController],
  providers: [AnnouncementService],
  exports: [AnnouncementService],
})
export class AnnouncementModule {}
