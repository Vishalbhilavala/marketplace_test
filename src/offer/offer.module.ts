import { Module } from '@nestjs/common';
import { OfferController } from './offer.controller';
import { OfferService } from './offer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from 'src/schema/user.schema';
import { Offer, offerSchema } from 'src/schema/offer.schema';
import {
  ClipUsageHistory,
  clipUsageHistorySchema,
} from 'src/schema/clip-usage-history.schema';
import {
  BusinessClips,
  businessClipSchema,
} from 'src/schema/business-clip.schema';
import { Project, projectSchema } from 'src/schema/project.schema';
import { SharedModule } from 'src/libs/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: Offer.name, schema: offerSchema },
      { name: ClipUsageHistory.name, schema: clipUsageHistorySchema },
      { name: BusinessClips.name, schema: businessClipSchema },
      { name: Project.name, schema: projectSchema },
    ]),
  ],
  controllers: [OfferController],
  providers: [OfferService],
})
export class OfferModule {}
