import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { County } from './county.schema';

export type MunicipalityDocument = HydratedDocument<Municipality>;

@Schema({ _id: true })
export class Village {
  _id?: Types.ObjectId;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  postal_code: string;
}

@Schema({ timestamps: true, collection: 'municipality' })
export class Municipality {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({
    type: Types.ObjectId,
    ref: County.name,
    required: true,
    index: true,
  })
  county_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  direction: string;

  @Prop({ type: [Village], default: [] })
  villages: Village[];

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;
}

export const municipalitySchema = SchemaFactory.createForClass(Municipality);
