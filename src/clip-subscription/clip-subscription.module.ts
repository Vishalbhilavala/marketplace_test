import { Module } from '@nestjs/common';
import { ClipSubscriptionService } from './clip-subscription.service';
import { ClipSubscriptionController } from './clip-subscription.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ClipSubscription,
  clipSubscriptionSchema,
} from 'src/schema/clip-subscription.schema';
import { JwtModule } from '@nestjs/jwt';
import {
  ClipUsageHistory,
  clipUsageHistorySchema,
} from 'src/schema/clip-usage-history.schema';
import { User, userSchema } from 'src/schema/user.schema';
import {
  BusinessClips,
  businessClipSchema,
} from 'src/schema/business-clip.schema';
import { SharedModule } from 'src/libs/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: ClipSubscription.name, schema: clipSubscriptionSchema },
      { name: ClipUsageHistory.name, schema: clipUsageHistorySchema },
      { name: User.name, schema: userSchema },
      { name: BusinessClips.name, schema: businessClipSchema },
    ]),
    JwtModule.register({
      secret: 'jwtSecretKey',
      signOptions: { expiresIn: '365d' },
    }),
  ],
  controllers: [ClipSubscriptionController],
  providers: [ClipSubscriptionService],
})
export class ClipSubscriptionModule {}
