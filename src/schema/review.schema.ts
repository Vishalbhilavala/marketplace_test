import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ timestamps: true, collection: 'review' })
export class Review {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
  })
  business_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  customer_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Project',
    required: true,
  })
  project_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
  })
  rating: number;

  @Prop({
    type: String,
    required: true,
  })
  review_text: string;

  @Prop({
    type: [String],
    default: [],
  })
  photos?: string[];

  @Prop({
    type: String,
    default: null,
  })
  business_reply?: string;
}

export const reviewSchema = SchemaFactory.createForClass(Review);
