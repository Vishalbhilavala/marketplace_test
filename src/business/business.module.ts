import { Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from 'src/schema/user.schema';
import {
  BusinessClips,
  businessClipSchema,
} from 'src/schema/business-clip.schema';
import { ClipRenewal, clipRenewalSchema } from 'src/schema/clip-renewal.schema';
import {
  ClipSubscription,
  clipSubscriptionSchema,
} from 'src/schema/clip-subscription.schema';
import { ClipRefill, clipRefillSchema } from 'src/schema/clip-refill.schema';
import {
  ClipUsageHistory,
  clipUsageHistorySchema,
} from 'src/schema/clip-usage-history.schema';
import { SharedModule } from 'src/libs/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: BusinessClips.name, schema: businessClipSchema },
      { name: ClipRenewal.name, schema: clipRenewalSchema },
      { name: ClipSubscription.name, schema: clipSubscriptionSchema },
      { name: ClipRefill.name, schema: clipRefillSchema },
      { name: ClipUsageHistory.name, schema: clipUsageHistorySchema },
    ]),
  ],
  controllers: [BusinessController],
  providers: [BusinessService],
})
export class BusinessModule {}
