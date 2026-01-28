import { Module } from '@nestjs/common';
import { ContactUsService } from './contact_us.service';
import { ContactUsController } from './contact_us.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ContactUs, contactUsSchema } from 'src/schema/contact-us.schema';
import { SharedModule } from 'src/libs/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: ContactUs.name, schema: contactUsSchema },
    ]),
    JwtModule.register({
      secret: 'jwtSecretKey',
      signOptions: { expiresIn: '365d' },
    }),
  ],

  providers: [ContactUsService],
  controllers: [ContactUsController],
})
export class ContactUsModule {}
