import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BusinessCountyDocument = HydratedDocument<BusinessCounty>;

@Schema({ _id: false })
class Municipality {
  @Prop({ type: String, required: true })
  name: string;
}

@Schema({ _id: false })
class County {
  @Prop({ type: String, required: true })
  county_name: string;

  @Prop({ type: [Municipality], required: true })
  municipality: Municipality[];
}

@Schema({ timestamps: true, collection: 'business_county' })
export class BusinessCounty {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  business_id: Types.ObjectId;

  @Prop({ type: [County], required: false })
  county: County[];
}

export const businessCountySchema =
  SchemaFactory.createForClass(BusinessCounty);
