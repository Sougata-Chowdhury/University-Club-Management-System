import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment, PaymentSchema } from '../schemas/payment.schema';
import { Event, EventSchema } from '../schemas/event.schema';
import { Club, ClubSchema } from '../schemas/club.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Event.name, schema: EventSchema },
      { name: Club.name, schema: ClubSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/payments',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, `payment-proof-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
    AuthModule,
    forwardRef(() => NotificationModule),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
