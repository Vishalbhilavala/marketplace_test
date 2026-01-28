import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { OfferStatus } from 'src/libs/utils/constant/enum';

export type OfferDocument = HydratedDocument<Offer>;

@Schema({ timestamps: true, collection: 'offer' })
export class Offer {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true })
  project_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  business_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  customer_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  estimated_duration: string;

  @Prop({ type: Number })
  amount: number;

  @Prop({
    type: String,
    enum: [
      OfferStatus.PENDING,
      OfferStatus.ASSIGNED,
      OfferStatus.REJECTED,
      OfferStatus.CANCELLED,
      OfferStatus.COMPLETED,
      OfferStatus.DELETED,
    ],
    default: OfferStatus.PENDING,
  })
  status: string;

  @Prop({ type: Number })
  clips_used: number;

  @Prop({ type: Date })
  cancelledAt: Date;
}

export const offerSchema = SchemaFactory.createForClass(Offer);
