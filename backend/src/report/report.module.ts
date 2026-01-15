import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { Report, ReportSchema } from './report.schema';
import { NotificationModule } from '../notification/notification.module';
import { EventModule } from '../event/event.module';
import { ClubModule } from '../club/club.module';
import { AnnouncementModule } from '../announcement/announcement.module';
import { AuthModule } from '../auth/auth.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]),
    NotificationModule,
    EventModule,
    ClubModule,
    AnnouncementModule,
    AuthModule,
    FileModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
