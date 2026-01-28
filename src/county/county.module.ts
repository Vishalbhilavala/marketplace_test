import { Module } from '@nestjs/common';
import { CountyService } from './county.service';
import { CountyController } from './county.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { County, countySchema } from 'src/schema/county.schema';
import { JwtModule } from '@nestjs/jwt';
import {
  Municipality,
  municipalitySchema,
} from 'src/schema/municipality.schema';
import { User, userSchema } from 'src/schema/user.schema';
import { ProffCounty, proffCountySchema } from 'src/schema/proff-county.schema';
import { SharedModule } from 'src/libs/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: County.name, schema: countySchema },
      { name: Municipality.name, schema: municipalitySchema },
      { name: User.name, schema: userSchema },
      { name: ProffCounty.name, schema: proffCountySchema },
    ]),
    JwtModule.register({
      secret: 'jwtSecretKey',
      signOptions: { expiresIn: '365d' },
    }),
  ],
  controllers: [CountyController],
  providers: [CountyService],
})
export class CountyModule {}
