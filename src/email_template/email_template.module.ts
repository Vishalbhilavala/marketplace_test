import { Module } from '@nestjs/common';
import { EmailTemplateService } from './email_template.service';
import { EmailTemplateController } from './email_template.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MailTemplate,
  mailTemplateSchema,
} from 'src/schema/email-template.schema';
import { SharedModule } from 'src/libs/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: MailTemplate.name, schema: mailTemplateSchema },
    ]),
  ],
  providers: [EmailTemplateService],
  controllers: [EmailTemplateController],
})
export class EmailTemplateModule {}
