import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ClipRefillDocument = HydratedDocument<ClipRefill>;

@Schema({ timestamps: true, collection: 'clip_refill' })
export class ClipRefill {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  business_id: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
  })
  price: number;

  @Prop({
    type: Number,
    required: true,
  })
  clip: number;

  @Prop({ type: Date })
  expiry_date: Date;

  @Prop({ type: Date })
  purchased_at: Date;
}

export const clipRefillSchema = SchemaFactory.createForClass(ClipRefill);
