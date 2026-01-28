import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { Chat, chatSchema } from 'src/schema/chat.schema';
import { Message, messagesSchema } from 'src/schema/message.schema';
import { User, userSchema } from 'src/schema/user.schema';
import { SharedModule } from 'src/libs/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: Chat.name, schema: chatSchema },
      { name: Message.name, schema: messagesSchema },
      { name: User.name, schema: userSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
