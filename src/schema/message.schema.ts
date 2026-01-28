import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { MessageStatus, MessagesType } from 'src/libs/utils/constant/enum';

export type MessagesDocument = HydratedDocument<Message>;

@Schema({ timestamps: true, collection: 'message' })
export class Message {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  })
  chat_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  sender_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    required: false,
  })
  message: string;

  @Prop({
    type: String,
    required: false,
    enum: [MessageStatus.READ, MessageStatus.UNREAD],
    default: MessageStatus.UNREAD,
  })
  status: string;

  @Prop({
    type: String,
    required: false,
    enum: [MessagesType.NORMAL, MessagesType.IMAGES],
    default: MessagesType.NORMAL,
  })
  type: string;

  @Prop({
    type: String,
    required: false,
  })
  image: string;
}

export const messagesSchema = SchemaFactory.createForClass(Message);
