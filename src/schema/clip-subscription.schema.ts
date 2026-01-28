import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ClipSubscriptionDocument = HydratedDocument<ClipSubscription>;

@Schema({ timestamps: true, collection: 'clip_subscription' })
export class ClipSubscription {
  @Prop({
    type: String,
    required: true,
  })
  package_name: string;

  @Prop({
    type: String,
  })
  package_description: string;

  @Prop({
    type: Number,
  })
  price: number;

  @Prop({
    type: Number,
  })
  total_clips: number;

  @Prop({
    type: String,
  })
  validity_days: string;

  @Prop({
    type: Number,
  })
  monthly_duration: number;

  @Prop({
    type: Boolean,
    default: false,
  })
  is_deleted: boolean;
}

export const clipSubscriptionSchema =
  SchemaFactory.createForClass(ClipSubscription);
