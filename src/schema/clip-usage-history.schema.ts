import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { BusinessClipHistory } from 'src/libs/utils/constant/enum';

export type ClipUsageHistoryDocument = HydratedDocument<ClipUsageHistory>;

@Schema({ timestamps: true, collection: 'clip_usage_history' })
export class ClipUsageHistory {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  business_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Project',
    required: false,
  })
  project_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
  })
  clips_used: number;

  @Prop({
    type: String,
    required: true,
    enum: [BusinessClipHistory.APPLIED, BusinessClipHistory.PURCHASED],
  })
  usage_type: string;

  @Prop({ type: String })
  description: string;
}

export const clipUsageHistorySchema =
  SchemaFactory.createForClass(ClipUsageHistory);
