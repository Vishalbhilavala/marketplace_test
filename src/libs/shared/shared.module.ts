import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from 'src/schema/user.schema';
import {
  BusinessClips,
  businessClipSchema,
} from 'src/schema/business-clip.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: BusinessClips.name, schema: businessClipSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class SharedModule {}
