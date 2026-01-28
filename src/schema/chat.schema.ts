import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ChatDocument = HydratedDocument<Chat>;

@Schema({ timestamps: true, collection: 'chatSession' })
export class Chat {
  @Prop({
    type: [
      {
        user_id: {
          type: MongooseSchema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          default: false,
          required: false,
        },
      },
    ],
    required: true,
  })
  participant: {
    role: string;
    user_id: string;
  }[];

  @Prop({
    type: String,
    default: '',
  })
  last_message: string;

  @Prop({
    type: Boolean,
    required: true,
    default: true,
  })
  is_active: boolean;
}

export const chatSchema = SchemaFactory.createForClass(Chat);
