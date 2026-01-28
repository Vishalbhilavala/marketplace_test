import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { CreateChatDto } from './dto/createChat.dto';
import { ChatGateway } from './chat.gateway';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import { MessageStatus, ResponseData } from 'src/libs/utils/constant/enum';
import { Messages, MessagesKey } from 'src/libs/utils/constant/messages';
import { Chat, ChatDocument } from 'src/schema/chat.schema';
import { User, UserDocument } from 'src/schema/user.schema';
import { UserRequest } from 'src/libs/utils/constant/interface';
import { Message, MessagesDocument } from 'src/schema/message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessagesDocument>,
    private readonly chatGateway: ChatGateway,
  ) {}

  async createChat(req: UserRequest, dto: CreateChatDto) {
    const { receiver_id } = dto;
    const sender_id = req.user.id;

    const sortedParticipants = [sender_id, receiver_id]
      .map((id) => id.toString())
      .sort((a, b) => a.localeCompare(b));

    const findChat = await this.chatModel.findOne({
      'participant.user_id': { $all: sortedParticipants },
    });

    if (findChat) {
      Logger.log(`Chat ${Messages.GET_SUCCESS}`);
      return HandleResponse(
        HttpStatus.CREATED,
        ResponseData.SUCCESS,
        undefined,
        undefined,
        { id: findChat._id },
      );
    }

    const newChat = await this.chatModel.create({
      participant: sortedParticipants.map((userId) => ({
        user_id: new Types.ObjectId(userId),
      })),
    });

    Logger.log(`Chat ${Messages.ADD_SUCCESS}`);
    return HandleResponse(
      HttpStatus.CREATED,
      ResponseData.SUCCESS,
      MessagesKey.CHAT_CREATED_SUCCESS,
      `Chat ${Messages.CREATE_SUCCESS}`,
      {
        id: newChat._id,
      },
    );
  }

  async listOfChat(req: UserRequest, dto: ListOfDataDto) {
    const user_id = new Types.ObjectId(req.user.id);
    const {
      page = 1,
      limit = 10,
      search,
      sortKey = 'updatedAt',
      sortValue = 'desc',
    } = dto;
    const start = (page - 1) * limit;
    const pipeline: PipelineStage[] = [];

    pipeline.push({
      $match: {
        'participant.user_id': user_id,
        last_message: { $ne: '' },
      },
    });

    pipeline.push({ $unwind: '$participant' });

    pipeline.push({
      $lookup: {
        from: 'user',
        localField: 'participant.user_id',
        foreignField: '_id',
        as: 'userDetails',
      },
    });

    pipeline.push({
      $addFields: {
        'participant.userDetails': { $arrayElemAt: ['$userDetails', 0] },
      },
    });

    pipeline.push({
      $match: {
        'participant.user_id': { $ne: user_id },
      },
    });

    pipeline.push({
      $addFields: {
        'participant.name': '$participant.userDetails.full_name',
        'participant.profile_image': '$participant.userDetails.profile_image',
      },
    });

    pipeline.push({
      $project: {
        __v: 0,
        'participant.userDetails': 0,
      },
    });

    pipeline.push({
      $group: {
        _id: '$_id',
        last_message: { $first: '$last_message' },
        updatedAt: { $first: '$updatedAt' },
        user_id: { $first: '$participant.user_id' },
        name: { $first: '$participant.name' },
        profile_image: { $first: '$participant.profile_image' },
      },
    });

    pipeline.push({
      $lookup: {
        from: 'message',
        let: { chatId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$chat_id', '$$chatId'] },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          {
            $project: {
              _id: 0,
              status: 1,
            },
          },
        ],
        as: 'lastMessage',
      },
    });

    pipeline.push({
      $addFields: {
        last_message_status: {
          $ifNull: [{ $arrayElemAt: ['$lastMessage.status', 0] }, 'sent'],
        },
      },
    });

    pipeline.push({
      $project: {
        lastMessage: 0,
      },
    });

    const sortOrder = sortValue === 'asc' ? 1 : -1;

    pipeline.push({
      $sort: { [sortKey]: sortOrder },
    });

    if (search) {
      pipeline.push({
        $match: {
          $or: [{ name: { $regex: search, $options: 'i' } }],
        },
      });
    }

    pipeline.push({
      $facet: {
        paginatedResults: [
          { $sort: { [sortKey]: sortOrder } },
          { $skip: start },
          { $limit: limit },
        ],
        totalCount: [{ $count: 'count' }],
      },
    });

    const [findChat] = await this.chatModel.aggregate(pipeline);
    const items = findChat?.paginatedResults ?? [];
    const totalItems = findChat?.totalCount?.[0]?.count ?? 0;
    if (findChat.length === 0) {
      Logger.error(`Chat ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        `Chat ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Chat ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      {
        items,
        totalCount: totalItems,
        itemsCount: items.length,
        currentPage: page,
        totalPage: Math.ceil(totalItems / limit),
        pageSize: limit,
      },
    );
  }

  async getUnreadMessageCount(req: UserRequest) {
    const userId = new Types.ObjectId(req.user.id);
    const chats = await this.chatModel.find(
      { 'participant.user_id': userId },
      { _id: 1 },
    );
    const chatIds = chats.map((chat) => chat._id);
    const count = await this.messageModel.countDocuments({
      chat_id: { $in: chatIds },
      sender_id: { $ne: userId },
      status: MessageStatus.UNREAD,
    });
    Logger.log(`Unread message count retrieved for user ${req.user.id}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      { count },
    );
  }
}
