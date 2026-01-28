import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BusinessClipStatus } from 'src/libs/utils/constant/enum';

export type ClipRenewalDocument = HydratedDocument<ClipRenewal>;

@Schema({ timestamps: true, collection: 'clip_renewal' })
export class ClipRenewal {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  business_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ClipSubscription', required: true })
  subscription_id: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  validity_days: string;

  @Prop({
    type: Number,
    required: false,
  })
  monthly_duration: number;

  @Prop({
    type: String,
    required: true,
    default: BusinessClipStatus.ACTIVE,
    enum: Object.values(BusinessClipStatus),
  })
  status: BusinessClipStatus;
}

export const clipRenewalSchema = SchemaFactory.createForClass(ClipRenewal);
