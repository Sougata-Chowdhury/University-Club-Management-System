import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { User, UserSchema } from '../schemas/user.schema';
import { Club, ClubSchema } from '../schemas/club.schema';
import { Event, EventSchema } from '../schemas/event.schema';
import { Payment, PaymentSchema } from '../schemas/payment.schema';
import { Announcement, AnnouncementSchema } from '../schemas/announcement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Club.name, schema: ClubSchema },
      { name: Event.name, schema: EventSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Announcement.name, schema: AnnouncementSchema },
    ]),
    AuthModule,
    forwardRef(() => NotificationModule),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
