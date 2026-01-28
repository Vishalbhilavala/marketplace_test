import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin_dashboard.controller';
import { AdminDashboardService } from './admin_dashboard.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from 'src/schema/user.schema';
import { Project, projectSchema } from 'src/schema/project.schema';
import { Offer, offerSchema } from 'src/schema/offer.schema';
import { SharedModule } from 'src/libs/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: Project.name, schema: projectSchema },
      { name: Offer.name, schema: offerSchema },
    ]),
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
