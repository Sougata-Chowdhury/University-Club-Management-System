import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { Club, ClubSchema } from '../schemas/club.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Event, EventSchema } from '../schemas/event.schema';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { AuthGuard } from '../guards/auth.guard';
import { AdminGuard } from '../guards/admin.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Club.name, schema: ClubSchema },
      { name: User.name, schema: UserSchema },
      { name: Event.name, schema: EventSchema },
    ]),
    AuthModule,
    forwardRef(() => UserModule),
  ],
  controllers: [ClubController],
  providers: [ClubService, AuthGuard, AdminGuard],
  exports: [ClubService],
})
export class ClubModule {}
