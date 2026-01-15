import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { Feedback, FeedbackSchema } from './feedback.schema';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';
import { ClubModule } from '../club/club.module';
import { EventModule } from '../event/event.module';
import { AuthModule } from '../auth/auth.module';
import { Club, ClubSchema } from '../schemas/club.schema';
import { Event, EventSchema } from '../schemas/event.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Feedback.name, schema: FeedbackSchema },
      { name: Club.name, schema: ClubSchema },
      { name: Event.name, schema: EventSchema },
      { name: User.name, schema: UserSchema }
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => UserModule),
    forwardRef(() => ClubModule),
    forwardRef(() => EventModule),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
