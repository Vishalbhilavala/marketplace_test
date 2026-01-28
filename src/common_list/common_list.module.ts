import { Module } from '@nestjs/common';
import { CommonListController } from './common_list.controller';
import { CommonListService } from './common_list.service';
import { MongooseModule } from '@nestjs/mongoose';
import { County, countySchema } from 'src/schema/county.schema';
import {
  ClipSubscription,
  clipSubscriptionSchema,
} from 'src/schema/clip-subscription.schema';
import {
  Municipality,
  ProffCounty,
  proffCountySchema,
} from 'src/schema/proff-county.schema';
import { Review, reviewSchema } from 'src/schema/review.schema';
import { municipalitySchema } from 'src/schema/municipality.schema';
import { Project, projectSchema } from 'src/schema/project.schema';
import { Category } from 'src/schema/category.schema';
import { User, userSchema } from 'src/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: County.name, schema: countySchema },
      { name: ProffCounty.name, schema: proffCountySchema },
      { name: ClipSubscription.name, schema: clipSubscriptionSchema },
      { name: Review.name, schema: reviewSchema },
      { name: Municipality.name, schema: municipalitySchema },
      { name: Project.name, schema: projectSchema },
      { name: Category.name, schema: countySchema },
      { name: User.name, schema: userSchema },
    ]),
  ],
  controllers: [CommonListController],
  providers: [CommonListService],
})
export class CommonListModule {}
