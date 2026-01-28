import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, projectSchema } from 'src/schema/project.schema';
import {
  BusinessCounty,
  businessCountySchema,
} from 'src/schema/business-county.schema';
import { Offer, offerSchema } from 'src/schema/offer.schema';
import { Review, reviewSchema } from 'src/schema/review.schema';
import {
  BusinessClips,
  businessClipSchema,
} from 'src/schema/business-clip.schema';
import { User, userSchema } from 'src/schema/user.schema';
import { SharedModule } from 'src/libs/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: projectSchema },
      { name: BusinessCounty.name, schema: businessCountySchema },
      { name: Offer.name, schema: offerSchema },
      { name: Review.name, schema: reviewSchema },
      { name: BusinessClips.name, schema: businessClipSchema },
      { name: User.name, schema: userSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
