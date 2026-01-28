import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FaqDocument = HydratedDocument<Faq>;

@Schema({ timestamps: true, collection: 'faq' })
export class Faq {
  @Prop({
    type: String,
    required: true,
  })
  question: string;

  @Prop({
    type: String,
    required: true,
  })
  answer: string;

  @Prop({
    type: Boolean,
    required: true,
    default: false,
  })
  is_deleted: boolean;
}

export const faqSchema = SchemaFactory.createForClass(Faq);
