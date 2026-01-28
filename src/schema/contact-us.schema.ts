import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContactUsDocument = HydratedDocument<ContactUs>;

@Schema({ timestamps: true, collection: 'contact_us' })
export class ContactUs {
  @Prop({
    type: String,
    required: true,
  })
  full_name: string;

  @Prop({
    type: String,
    required: true,
  })
  email: string;

  @Prop({
    type: String,
    required: true,
  })
  phone_number: string;

  @Prop({
    type: String,
    required: true,
  })
  message: string;

  @Prop({
    type: Boolean,
    required: true,
    default: false,
  })
  is_contacted: boolean;
}

export const contactUsSchema = SchemaFactory.createForClass(ContactUs);
