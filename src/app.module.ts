import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose';
import { FaqModule } from './faq/faq.module';
import { ContactUsModule } from './contact_us/contact_us.module';
import { UserModule } from './user/user.module';
import * as dotenv from 'dotenv';
import { JwtStrategy } from './libs/service/auth/strategy/jwt.stretagy';
import { EmailTemplateModule } from './email_template/email_template.module';
import { HomePageModule } from './home-page/home-page.module';
import { ClipSubscriptionModule } from './clip-subscription/clip-subscription.module';
import { CategoryModule } from './category/category.module';
import { ProjectModule } from './project/project.module';
import { BusinessModule } from './business/business.module';
import { CommonListModule } from './common_list/common_list.module';
import { JwtModule } from '@nestjs/jwt';
import { AdminDashboardModule } from './admin_dashboard/admin_dashboard.module';
import { OfferModule } from './offer/offer.module';
import { ReviewModule } from './review/review.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CountyModule } from './county/county.module';
import { ChatModule } from './chat/chat.module';
dotenv.config();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    JwtModule.register({
      global: true,
      secret: process.env.jwtSecretKey,
      signOptions: { expiresIn: '365d' },
    }),
    MongooseModule.forRoot(process.env.MONGO_URI ?? ''),
    EmailTemplateModule,
    FaqModule,
    ContactUsModule,
    UserModule,
    HomePageModule,
    ClipSubscriptionModule,
    CategoryModule,
    ProjectModule,
    BusinessModule,
    CommonListModule,
    AdminDashboardModule,
    OfferModule,
    ReviewModule,
    DashboardModule,
    CountyModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {
  constructor() {}
}
