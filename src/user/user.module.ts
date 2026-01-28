import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from 'src/schema/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { Otp, otpSchema } from 'src/schema/otp.schema';
import {
  MailTemplate,
  mailTemplateSchema,
} from 'src/schema/email-template.schema';
import { Category, categorySchema } from 'src/schema/category.schema';
import { County, countySchema } from 'src/schema/county.schema';
import { Municipality } from 'src/schema/proff-county.schema';
import { municipalitySchema } from 'src/schema/municipality.schema';
import {
  BusinessDemoData,
  businessDemoDataSchema,
} from 'src/schema/business-demo-data.schema';
import { SharedModule } from 'src/libs/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: Otp.name, schema: otpSchema },
      { name: MailTemplate.name, schema: mailTemplateSchema },
      { name: Category.name, schema: categorySchema },
      { name: County.name, schema: countySchema },
      { name: Municipality.name, schema: municipalitySchema },
      { name: BusinessDemoData.name, schema: businessDemoDataSchema },
    ]),
    JwtModule.register({
      secret: 'jwtSecretKey',
      signOptions: { expiresIn: '365d' },
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
