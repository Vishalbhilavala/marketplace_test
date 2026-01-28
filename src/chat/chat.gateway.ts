import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Model, PipelineStage, Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { MessageStatus } from 'src/libs/utils/constant/enum';
import { ChatMatchStage } from 'src/libs/utils/constant/interface';
import { Chat, ChatDocument } from 'src/schema/chat.schema';
import { Message, MessagesDocument } from 'src/schema/message.schema';
import { User, UserDocument } from 'src/schema/user.schema';

@WebSocketGateway({ cors: true, transports: ['websocket'] })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly users = new Map<string, string>();

  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessagesDocument>,
    @InjectModel(Chat.name)
    private readonly chatModel: Model<ChatDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async handleConnection(client: Socket) {
    const clientId = client.id;
    const chatId = client.handshake.query.chat_id as string | undefined;

    if (chatId) {
      Logger.log(`User connected: ${clientId} to chat room: ${chatId}`);
      await client.join(chatId);
      this.users.set(clientId, chatId);
    } else {
      Logger.log(`No chat_id found in query params for user ${clientId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;

    Logger.log(`User disconnected: ${clientId}`);

    const roomId = this.users.get(clientId);
    if (roomId) {
      Logger.log(`User ${clientId} left room: ${roomId}`);
    }

    this.users.delete(clientId);
    this.server.emit('userDisconnected', clientId);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: {
      chat_id: string;
      sender: string;
      message?: string;
      type?: string;
      image?: string;
    },
  ) {
    Logger.log(
      `New message from ${payload.sender} in chat ${payload.chat_id}: ${payload.message}`,
    );

    if (!payload.chat_id || !payload.sender) {
      Logger.log(`Invalid message payload received:`, payload);
      return;
    }

    const chat = await this.chatModel.findOne({ _id: payload.chat_id });

    if (!chat) {
      Logger.error(`Chat not found: ${payload.chat_id}`);
      return;
    }

    const sender = chat.participant.find(
      (p) => p.user_id.toString() === payload.sender,
    );

    if (!sender) {
      Logger.error(
        `User ${payload.sender} is not a participant in chat ${payload.chat_id}`,
      );
      return;
    }

    const newMessage = new this.messageModel({
      chat_id: payload.chat_id,
      sender_id: payload.sender,
      message: payload.message,
      type: payload.type,
      image: payload.image,
      status: MessageStatus.UNREAD,
    });

    try {
      await newMessage.save();

      await this.chatModel.updateOne(
        { _id: payload.chat_id },
        { last_message: payload.message || payload.image || '' },
      );

      const isImage =
        payload.image &&
        payload.image !== '' &&
        /\.(jpg|jpeg|png|gif|webp)$/i.test(payload.image);

      Logger.log(`Message saved successfully:`, newMessage);
      client.to(payload.chat_id).emit('receivedMessage', {
        _id: newMessage._id,
        chat_id: newMessage.chat_id,
        sender_id: newMessage.sender_id,
        message: newMessage.message,
        type: newMessage.type,
        image: newMessage.image,
        isImage,
        status: newMessage.status,
      });

      const receivers = await this.chatModel.aggregate([
        { $match: { _id: new Types.ObjectId(payload.chat_id) } },
        { $unwind: '$participant' },
        {
          $match: {
            'participant.user_id': { $ne: new Types.ObjectId(payload.sender) },
          },
        },
        {
          $lookup: {
            from: 'user',
            localField: 'participant.user_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
      ]);

      if (receivers.length === 0) {
        Logger.log('No receivers found for notifications.');
        return;
      }
    } catch (err) {
      Logger.error('Error saving message:', err);
    }
  }

  @SubscribeMessage('chatHistory')
  async getChatHistory(
    client: Socket,
    payload: { search?: string; page?: number; limit?: number },
  ) {
    const search = payload.search || '';
    const page = payload.page || 1;
    const limit = payload.limit || 10;
    const chatId = client.handshake.query.chat_id as string;

    if (!chatId) {
      client.emit('chatHistoryError', 'Chat id missing');
      return;
    }

    const chatObjectId = new Types.ObjectId(chatId);
    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const skip = (pageNumber - 1) * pageLimit;

    Logger.log(
      `Fetching chat history for chat_id: ${chatObjectId.toString()}, page: ${pageNumber}, limit: ${pageLimit}`,
    );

    try {
      const matchStage: ChatMatchStage = {
        chat_id: chatObjectId,
      };

      if (typeof search === 'string' && search.trim().length > 0) {
        matchStage.message = {
          $regex: search.trim(),
          $options: 'i',
        };
      }

      const pipeline: PipelineStage[] = [
        { $match: matchStage },

        { $sort: { createdAt: -1 } },

        {
          $lookup: {
            from: 'user',
            localField: 'sender_id',
            foreignField: '_id',
            as: 'senderDetails',
          },
        },
        {
          $unwind: {
            path: '$senderDetails',
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: 'chatSession',
            localField: 'chat_id',
            foreignField: '_id',
            as: 'chatData',
          },
        },
        { $unwind: '$chatData' },

        {
          $addFields: {
            senderParticipantData: {
              $first: {
                $filter: {
                  input: '$chatData.participant',
                  as: 'part',
                  cond: { $eq: ['$$part.user_id', '$sender_id'] },
                },
              },
            },
            receiverParticipantData: {
              $first: {
                $filter: {
                  input: '$chatData.participant',
                  as: 'part',
                  cond: { $ne: ['$$part.user_id', '$sender_id'] },
                },
              },
            },
          },
        },

        {
          $addFields: {
            isImage: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$image', null] },
                    { $ne: ['$image', ''] },
                    {
                      $regexMatch: {
                        input: '$image',
                        regex: /\.(jpg|jpeg|png|gif|webp)$/i,
                      },
                    },
                  ],
                },
                true,
                false,
              ],
            },
          },
        },

        {
          $facet: {
            paginatedResults: [
              {
                $project: {
                  _id: 1,
                  chat_id: 1,
                  message: 1,
                  status: 1,
                  type: 1,
                  image: 1,
                  isImage: 1,
                  createdAt: 1,
                  sender_id: 1,
                  senderDetails: {
                    full_name: 1,
                    profile_image: 1,
                  },
                  senderId: '$receiverParticipantData.user_id',
                  receiver_id: '$senderParticipantData.user_id',
                },
              },
              { $skip: skip },
              { $limit: pageLimit },
            ],
            totalCount: [{ $count: 'count' }],
          },
        },
      ];

      const [result] = await this.messageModel.aggregate(pipeline);

      const paginatedMessages = result?.paginatedResults ?? [];
      const totalItems = result?.totalCount?.[0]?.count ?? 0;

      // mark messages as read
      await this.messageModel.updateMany(
        {
          chat_id: chatObjectId,
          status: MessageStatus.UNREAD,
        },
        { $set: { status: MessageStatus.READ } },
      );

      client.emit('chatHistory', {
        items: paginatedMessages,
        totalCount: totalItems,
        itemsCount: paginatedMessages.length,
        currentPage: pageNumber,
        totalPage: Math.ceil(totalItems / pageLimit),
        pageSize: pageLimit,
      });
    } catch (error) {
      Logger.error('Error fetching chat history', error);
      client.emit('chatHistoryError', 'Failed to fetch chat history');
    }
  }

  @SubscribeMessage('userTyping')
  handleUserTyping(
    client: Socket,
    payload: { chat_id: string; sender: string },
  ) {
    if (!payload.chat_id || !payload.sender) return;

    Logger.log(`User ${payload.sender} is typing in chat ${payload.chat_id}`);

    client.to(payload.chat_id).emit('userTyping', {
      sender: payload.sender,
      chat_id: payload.chat_id,
    });
  }

  @SubscribeMessage('userStoppedTyping')
  handleUserStoppedTyping(
    client: Socket,
    payload: { chat_id: string; sender: string },
  ) {
    if (!payload.chat_id || !payload.sender) return;

    Logger.log(
      `User ${payload.sender} stopped typing in chat ${payload.chat_id}`,
    );

    client.to(payload.chat_id).emit('userStoppedTyping', {
      sender: payload.sender,
      chat_id: payload.chat_id,
    });
  }
}
