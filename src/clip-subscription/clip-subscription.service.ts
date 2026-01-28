import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AddClipDto, EditClipDto, ListOfClipUsageDto } from './dto/clip.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  ClipSubscription,
  ClipSubscriptionDocument,
} from 'src/schema/clip-subscription.schema';
import { Model, PipelineStage, Types } from 'mongoose';
import { Messages, MessagesKey } from 'src/libs/utils/constant/messages';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import { ResponseData, Role } from 'src/libs/utils/constant/enum';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { UserRequest } from 'src/libs/utils/constant/interface';
import {
  ClipUsageHistory,
  ClipUsageHistoryDocument,
} from 'src/schema/clip-usage-history.schema';
import { User, UserDocument } from 'src/schema/user.schema';
import {
  BusinessClips,
  BusinessClipsDocument,
} from 'src/schema/business-clip.schema';

@Injectable()
export class ClipSubscriptionService {
  constructor(
    @InjectModel(ClipSubscription.name)
    private readonly clipSubscriptionModel: Model<ClipSubscriptionDocument>,
    @InjectModel(ClipUsageHistory.name)
    private readonly clipUsageHistoryModel: Model<ClipUsageHistoryDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(BusinessClips.name)
    private readonly businessClipModel: Model<BusinessClipsDocument>,
  ) {}

  async addSubscription(dto: AddClipDto) {
    const findSubscription = await this.clipSubscriptionModel.findOne({
      package_name: {
        $regex: `^${dto.package_name}$`,
        $options: 'i',
      },
    });

    if (findSubscription) {
      Logger.error(Messages.SUBSCRIPTION_NAME_ALREADY_EXIST);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.SUBSCRIPTION_ALREADY_EXIST,
        Messages.SUBSCRIPTION_NAME_ALREADY_EXIST,
      );
    }

    await this.clipSubscriptionModel.create({ ...dto });

    Logger.log(`Subscription ${Messages.CREATE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.CREATED,
      ResponseData.SUCCESS,
      MessagesKey.SUBSCRIPTION_CREATED_SUCCESS,
      `Subscription ${Messages.CREATE_SUCCESS}`,
    );
  }

  async viewSubscription(subscriptionId: string) {
    const subscriptionData = await this.clipSubscriptionModel
      .findOne({ _id: subscriptionId, is_deleted: false })
      .select('-__v -updatedAt');

    if (!subscriptionData) {
      Logger.error(`Subscription ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.CLIP_SUBSCRIPTION_NOT_FOUND,
        `Subscription ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Clip subscription ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      subscriptionData,
    );
  }

  async updateSubscription(dto: EditClipDto) {
    const { subscriptionId, package_name } = dto;

    if (package_name) {
      const findSubscription = await this.clipSubscriptionModel.findOne({
        _id: { $ne: subscriptionId },
        package_name: {
          $regex: `^${package_name}$`,
          $options: 'i',
        },
      });

      if (findSubscription) {
        Logger.error(Messages.SUBSCRIPTION_NAME_ALREADY_EXIST);
        return HandleResponse(
          HttpStatus.BAD_REQUEST,
          ResponseData.ERROR,
          MessagesKey.SUBSCRIPTION_ALREADY_EXIST,
          Messages.SUBSCRIPTION_NAME_ALREADY_EXIST,
        );
      }
    }

    const updatedSubscription =
      await this.clipSubscriptionModel.findOneAndUpdate(
        { _id: subscriptionId, is_deleted: false },
        { $set: dto },
        { new: true },
      );

    if (!updatedSubscription) {
      Logger.error(`Subscription ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.CLIP_SUBSCRIPTION_NOT_FOUND,
        `Subscription ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Subscription ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.CLIP_SUBSCRIPTION_UPDATED_SUCCESS,
      `Subscription ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async deleteSubscription(subscriptionId: string) {
    const deleteSubscription =
      await this.clipSubscriptionModel.findOneAndUpdate(
        { _id: subscriptionId },
        { $set: { is_deleted: true } },
        { new: true },
      );

    if (!deleteSubscription) {
      Logger.error(`Subscription ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.CLIP_SUBSCRIPTION_NOT_FOUND,
        `Subscription ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Subscription ${Messages.DELETE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      MessagesKey.CLIP_SUBSCRIPTION_DELETED_SUCCESS,
      `Subscription ${Messages.DELETE_SUCCESS}`,
    );
  }

  async listOfClipSubscriptions(req: UserRequest, dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const start = (pageNumber - 1) * pageLimit;

    const pipeline: PipelineStage[] = [];

    pipeline.push({
      $match: {
        is_deleted: false,
      },
    });

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { package_name: { $regex: search, $options: 'i' } },
            { price: { $regex: search, $options: 'i' } },
            { validity_days: { $regex: search, $options: 'i' } },
            { total_clips: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'business_clip',
          let: {
            subscriptionId: '$_id',
            businessId: new Types.ObjectId(req.user.id),
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$subscription_id', '$$subscriptionId'] },
                    { $eq: ['$business_id', '$$businessId'] },
                    { $eq: ['$status', 'active'] },
                    {
                      $in: ['$payment_status', ['pending', 'received']],
                    },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'business_clip_info',
        },
      },
      {
        $addFields: {
          plan_status: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $gt: [{ $size: '$business_clip_info' }, 0] },
                      {
                        $eq: [
                          {
                            $arrayElemAt: [
                              '$business_clip_info.payment_status',
                              0,
                            ],
                          },
                          'received',
                        ],
                      },
                    ],
                  },
                  then: 'accepted',
                },
                {
                  case: {
                    $and: [
                      { $gt: [{ $size: '$business_clip_info' }, 0] },
                      {
                        $eq: [
                          {
                            $arrayElemAt: [
                              '$business_clip_info.payment_status',
                              0,
                            ],
                          },
                          'pending',
                        ],
                      },
                    ],
                  },
                  then: 'requested',
                },
              ],
              default: 'pending',
            },
          },
        },
      },

      {
        $project: {
          _id: 1,
          package_name: 1,
          price: 1,
          total_clips: 1,
          plan_status: 1,
          validity_days: 1,
          monthly_duration: 1,
          createdAt: 1,
        },
      },
      {
        $sort: { [sortKey || 'createdAt']: sortOrder },
      },
      {
        $facet: {
          paginatedResults: [
            { $skip: start },
            { $limit: pageLimit },
            { $sort: { [sortKey || 'createdAt']: sortOrder } },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    );

    const [result] = await this.clipSubscriptionModel.aggregate(pipeline);
    const { paginatedResults, totalCount } = result;
    const totalItems = totalCount?.length > 0 ? totalCount[0].count : 0;

    Logger.log(`Clip Subscriptions ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      {
        items: paginatedResults ?? [],
        totalCount: totalItems,
        itemsCount: paginatedResults?.length ?? 0,
        currentPage: pageNumber,
        totalPage: Math.ceil(totalItems / pageLimit),
        pageSize: pageLimit,
      },
    );
  }

  async listOfClipHistory(req: UserRequest, dto: ListOfClipUsageDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue, usageType } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const start = (pageNumber - 1) * pageLimit;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const sortField = sortKey || 'createdAt';

    const pipeline: PipelineStage[] = [];

    pipeline.push({
      $match: {
        business_id: new Types.ObjectId(req.user.id),
      },
    });

    if (usageType) {
      pipeline.push({
        $match: {
          usage_type: usageType,
        },
      });
    }

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { usage_type: { $regex: search, $options: 'i' } },
            { clips_used: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'project',
          localField: 'project_id',
          foreignField: '_id',
          as: 'project',
        },
      },
      {
        $unwind: {
          path: '$project',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          sortValue: {
            $cond: [
              { $eq: [{ $type: `$${sortField}` }, 'string'] },
              { $toLower: `$${sortField}` },
              `$${sortField}`,
            ],
          },
        },
      },

      {
        $facet: {
          paginatedResults: [
            { $sort: { sortValue: sortOrder } },
            { $skip: start },
            { $limit: pageLimit },
            {
              $project: {
                _id: 1,
                project_title: '$project.title',
                clips_used: 1,
                usage_type: 1,
                title: '$description',
                createdAt: 1,
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    );

    const [result] = await this.clipUsageHistoryModel.aggregate(pipeline);

    const items = result?.paginatedResults ?? [];
    const totalItems = result?.totalCount?.[0]?.count ?? 0;

    Logger.log(`Clip usage history ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      {
        items,
        totalCount: totalItems,
        itemsCount: items.length,
        currentPage: pageNumber,
        totalPage: Math.ceil(totalItems / pageLimit),
        pageSize: pageLimit,
      },
    );
  }

  async businessClipHistory(businessId: string, dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const start = (pageNumber - 1) * pageLimit;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const sortField = sortKey || 'createdAt';

    const pipeline: PipelineStage[] = [];

    pipeline.push({
      $match: {
        business_id: new Types.ObjectId(businessId),
      },
    });

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { usage_type: { $regex: search, $options: 'i' } },
            { clips_used: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'project',
          localField: 'project_id',
          foreignField: '_id',
          as: 'project',
        },
      },
      {
        $unwind: {
          path: '$project',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          sortValue: {
            $cond: [
              { $eq: [{ $type: `$${sortField}` }, 'string'] },
              { $toLower: `$${sortField}` },
              `$${sortField}`,
            ],
          },
        },
      },

      {
        $facet: {
          paginatedResults: [
            { $sort: { sortValue: sortOrder } },
            { $skip: start },
            { $limit: pageLimit },
            {
              $project: {
                _id: 1,
                project_title: '$project.title',
                clips_used: 1,
                usage_type: 1,
                title: '$description',
                createdAt: 1,
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    );

    const [result] = await this.clipUsageHistoryModel.aggregate(pipeline);

    const items = result?.paginatedResults ?? [];
    const totalItems = result?.totalCount?.[0]?.count ?? 0;

    Logger.log(`Clip usage history ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      {
        items,
        totalCount: totalItems,
        itemsCount: items.length,
        currentPage: pageNumber,
        totalPage: Math.ceil(totalItems / pageLimit),
        pageSize: pageLimit,
      },
    );
  }

  async sendPlanRequest(req: UserRequest, subscriptionId: string) {
    const business_id = new Types.ObjectId(req.user.id);

    const findBusiness = await this.userModel.findOne({
      _id: new Types.ObjectId(business_id),
      is_active: true,
      role: Role.BUSINESS,
    });

    if (!findBusiness) {
      Logger.error(`Business ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.BUSINESS_NOT_FOUND,
        `Business ${Messages.NOT_FOUND}`,
      );
    }

    if (findBusiness.plan_assigned === true) {
      Logger.error(Messages.ALREADY_HAVE_PLAN);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.ALREADY_HAVE_PLAN,
        Messages.ALREADY_HAVE_PLAN,
      );
    }

    const findSubscription = await this.clipSubscriptionModel.findOne({
      _id: new Types.ObjectId(subscriptionId),
    });

    if (!findSubscription) {
      Logger.error(`Subscription ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.CLIP_SUBSCRIPTION_NOT_FOUND,
        `Subscription ${Messages.NOT_FOUND}`,
      );
    }

    const purchasedAt = new Date();
    const monthlyClips = findSubscription.monthly_duration;

    const createPlan = {
      business_id: new Types.ObjectId(business_id),
      subscription_id: new Types.ObjectId(subscriptionId),
      package_details: {
        package_name: findSubscription?.package_name,
        package_description: findSubscription?.package_description,
        price: findSubscription.price,
        monthly_duration: monthlyClips,
      },
      purchased_at: purchasedAt,
    };

    await this.businessClipModel.create(createPlan);

    await this.userModel.updateOne(
      { _id: new Types.ObjectId(business_id), is_active: true },
      { $set: { plan_assigned: true } },
    );

    Logger.log(Messages.SUBSCRIPTION_REQUEST_SENT);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.SUBSCRIPTION_REQUEST_SENT,
      Messages.SUBSCRIPTION_REQUEST_SENT,
    );
  }
}
