import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CountyDocument = HydratedDocument<County>;
@Schema({ timestamps: true, collection: 'county' })
export class County {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({
    type: Boolean,
    required: true,
    default: false,
  })
  is_deleted: boolean;
}

export const countySchema = SchemaFactory.createForClass(County);
