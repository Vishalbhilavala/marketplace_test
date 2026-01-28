import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  BusinessClipStatus,
  BusinessPaymentStatus,
} from 'src/libs/utils/constant/enum';

export type BusinessClipsDocument = HydratedDocument<BusinessClips>;

@Schema({ _id: false })
class PackageDetails {
  @Prop({ type: String })
  package_name: string;

  @Prop({ type: String })
  package_description: string;

  @Prop({ type: Number })
  total_clips: number;

  @Prop({ type: Number })
  price: number;

  @Prop({ type: String })
  validity_days: string;

  @Prop({ type: Number })
  monthly_duration: number;
}

@Schema({ timestamps: true, collection: 'business_clip' })
export class BusinessClips {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  business_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ClipSubscription' })
  subscription_id: Types.ObjectId;

  @Prop({ type: PackageDetails })
  package_details: PackageDetails;

  @Prop({ type: Number })
  remaining_clips: number;

  @Prop({ type: Array })
  month_history: Array<{
    start_date: Date;
    expiry_date: Date;
    clip: number;
  }>;

  @Prop({ type: Date })
  purchased_at: Date;

  @Prop({ type: Date })
  expiry_date: Date;

  @Prop({
    type: String,
    default: BusinessClipStatus.ACTIVE,
    enum: [BusinessClipStatus.ACTIVE, BusinessClipStatus.EXPIRED],
  })
  status: string;

  @Prop({
    type: String,
    default: BusinessPaymentStatus.PENDING,
    enum: [
      BusinessPaymentStatus.PENDING,
      BusinessPaymentStatus.RECEIVED,
      BusinessPaymentStatus.REJECTED,
    ],
  })
  payment_status: string;
}

export const businessClipSchema = SchemaFactory.createForClass(BusinessClips);
