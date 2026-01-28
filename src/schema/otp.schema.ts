import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OtpDocument = HydratedDocument<Otp>;

@Schema({ timestamps: true, collection: 'otp' })
export class Otp {
  @Prop({
    type: String,
    required: false,
    maxlength: 50,
  })
  email?: string;

  @Prop({
    type: Number,
    required: true,
  })
  otp: number;

  @Prop({
    type: Date,
    default: () => new Date(Date.now() + 5 * 60 * 1000),
  })
  expire_time: Date;

  @Prop({ type: Boolean, default: false })
  is_verify: boolean;
}

export const otpSchema = SchemaFactory.createForClass(Otp);
