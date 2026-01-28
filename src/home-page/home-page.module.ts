import { homePageSchema } from './../schema/home-page.schema';
import { Module } from '@nestjs/common';
import { HomePageService } from './home-page.service';
import { HomePageController } from './home-page.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { HomePage } from 'src/schema/home-page.schema';
import { SharedModule } from 'src/libs/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: HomePage.name, schema: homePageSchema },
    ]),
    JwtModule.register({
      secret: 'jwtSecretKey',
      signOptions: { expiresIn: '365d' },
    }),
  ],
  controllers: [HomePageController],
  providers: [HomePageService],
})
export class HomePageModule {}
