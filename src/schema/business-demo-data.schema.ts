import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BusinessDemoDataDocument = HydratedDocument<BusinessDemoData>;

@Schema({ timestamps: true, collection: 'business_demo_data' })
export class BusinessDemoData {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
  })
  organizationNumber: string;
}

export const businessDemoDataSchema =
  SchemaFactory.createForClass(BusinessDemoData);
