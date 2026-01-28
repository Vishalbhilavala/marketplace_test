import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, projectSchema } from 'src/schema/project.schema';
import { User, userSchema } from 'src/schema/user.schema';
import {
  MailTemplate,
  mailTemplateSchema,
} from 'src/schema/email-template.schema';
import { Municipality } from 'src/schema/proff-county.schema';
import { municipalitySchema } from 'src/schema/municipality.schema';
import { Offer, offerSchema } from 'src/schema/offer.schema';
import { SharedModule } from 'src/libs/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: projectSchema },
      { name: User.name, schema: userSchema },
      { name: MailTemplate.name, schema: mailTemplateSchema },
      { name: Municipality.name, schema: municipalitySchema },
      { name: Offer.name, schema: offerSchema },
    ]),
  ],
  providers: [ProjectService],
  controllers: [ProjectController],
})
export class ProjectModule {}
