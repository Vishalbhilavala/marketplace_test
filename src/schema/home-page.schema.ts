import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Type } from 'src/libs/utils/constant/enum';

export type HomePageDocument = HydratedDocument<HomePage>;

@Schema({ timestamps: true, collection: 'home_page' })
export class HomePage {
  @Prop({
    type: String,
    required: true,
  })
  title: string;

  @Prop({
    type: String,
    required: false,
  })
  description: string;

  @Prop({
    type: String,
    required: false,
  })
  image: string;

  @Prop({
    type: String,
    enum: [Type.DETAILS, Type.INSPIRATION, Type.CURRENT_AFFAIR],
    required: true,
  })
  type: Type.DETAILS | Type.INSPIRATION | Type.CURRENT_AFFAIR;

  @Prop({
    type: String,
    required: false,
  })
  get_started_title: string;

  @Prop({
    type: String,
    required: false,
  })
  get_started_description: string;

  @Prop({
    type: String,
    required: false,
  })
  get_started_image: string;

  @Prop({
    type: [
      {
        detail_title: { type: String, required: false },
        detail_description: { type: String, required: false },
        detail_sub_description: { type: String, required: false },
      },
    ],
    default: [],
  })
  details?: {
    detail_title: string;
    detail_description: string;
    detail_sub_description: string;
  }[];
}

export const homePageSchema = SchemaFactory.createForClass(HomePage);
