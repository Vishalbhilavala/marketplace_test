import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import {
  BusinessClipHistory,
  BusinessClipStatus,
  BusinessPaymentStatus,
  PaymentStatus,
  ProjectStatus,
  ResponseData,
  Role,
} from 'src/libs/utils/constant/enum';
import { Messages, MessagesKey } from 'src/libs/utils/constant/messages';
import { User, UserDocument } from 'src/schema/user.schema';
import {
  AddRefillPlanDto,
  AddRenewalPlanDto,
  AssignBusinessPlanDto,
  UpdateBusinessStatusDto,
  UpdatePaymentDto,
  UpdatePaymentStatusDto,
} from './dto/purchasing.dto';
import {
  BusinessClips,
  BusinessClipsDocument,
} from 'src/schema/business-clip.schema';
import {
  calculateExpiryDate,
  generateMonthHistory,
} from 'src/libs/utils/constant/common-function';
import {
  ClipRenewal,
  ClipRenewalDocument,
} from 'src/schema/clip-renewal.schema';
import {
  ClipSubscription,
  ClipSubscriptionDocument,
} from 'src/schema/clip-subscription.schema';
import { ClipRefill, ClipRefillDocument } from 'src/schema/clip-refill.schema';
import {
  ClipUsageHistory,
  ClipUsageHistoryDocument,
} from 'src/schema/clip-usage-history.schema';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(BusinessClips.name)
    private readonly businessClipModel: Model<BusinessClipsDocument>,
    @InjectModel(ClipRenewal.name)
    private readonly clipRenewalModel: Model<ClipRenewalDocument>,
    @InjectModel(ClipSubscription.name)
    private readonly clipSubscriptionModel: Model<ClipSubscriptionDocument>,
    @InjectModel(ClipRefill.name)
    private readonly clipRefillModel: Model<ClipRefillDocument>,
    @InjectModel(ClipUsageHistory.name)
    private readonly clipUsageHistoryModel: Model<ClipUsageHistoryDocument>,
  ) {}

  async listOfBusiness(dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const start = (pageNumber - 1) * pageLimit;

    const pipeline: PipelineStage[] = [];

    pipeline.push({
      $match: {
        role: Role.BUSINESS,
        is_active: true,
      },
    });

    pipeline.push({
      $lookup: {
        from: 'business_clip',
        let: { businessId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$business_id', '$$businessId'] },
                  { $eq: ['$payment_status', 'pending'] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: 'clipRequest',
      },
    });

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { business_name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { status: { $regex: search, $options: 'i' } },
            { payment_status: { $regex: search, $options: 'i' } },
            { plan_assigned: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({
      $addFields: {
        payment_status_label: {
          $switch: {
            branches: [
              {
                case: { $eq: ['$payment_status', 'payment_received'] },
                then: 'payment_received',
              },
              {
                case: { $eq: ['$payment_status', 'payment_rejected'] },
                then: 'payment_rejected',
              },
              {
                case: {
                  $and: [
                    { $eq: ['$payment_status', 'pending'] },
                    { $gt: [{ $size: '$clipRequest' }, 0] },
                  ],
                },
                then: 'requested',
              },
            ],
            default: 'pending',
          },
        },
      },
    });

    pipeline.push(
      {
        $project: {
          _id: 1,
          business_name: 1,
          email: 1,
          phone_number: 1,
          status: 1,
          payment_status: '$payment_status_label',
          plan_assigned: 1,
        },
      },
      {
        $sort: {
          [sortKey || 'createdAt']: sortOrder,
        },
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

    const [result] = await this.userModel.aggregate(pipeline);

    const paginatedResults = result?.paginatedResults ?? [];
    const totalItems =
      result?.totalCount?.length > 0 ? result.totalCount[0].count : 0;

    Logger.log(`Business List ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      {
        items: paginatedResults,
        totalCount: totalItems,
        itemsCount: paginatedResults.length,
        currentPage: pageNumber,
        totalPage: Math.ceil(totalItems / pageLimit),
        pageSize: pageLimit,
      },
    );
  }

  async viewBusiness(businessId: string) {
    const businessObjectId = new Types.ObjectId(businessId);

    const [businessData] = await this.userModel.aggregate([
      {
        $match: {
          _id: businessObjectId,
          role: Role.BUSINESS,
          is_active: true,
        },
      },

      {
        $unwind: {
          path: '$county',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'county',
          localField: 'county.county_id',
          foreignField: '_id',
          as: 'county_info',
        },
      },
      {
        $unwind: {
          path: '$county_info',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'municipality',
          let: { countyId: '$county.county_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$county_id', '$$countyId'] },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
              },
            },
          ],
          as: 'municipalities',
        },
      },

      {
        $addFields: {
          county: {
            county_id: '$county_info._id',
            county_name: '$county_info.name',
            municipalities: {
              $map: {
                input: '$municipalities',
                as: 'm',
                in: {
                  municipality_id: '$$m._id',
                  municipality_name: '$$m.name',
                },
              },
            },
          },
        },
      },

      {
        $group: {
          _id: '$_id',
          counties: { $push: '$county' },
          business: { $first: '$$ROOT' },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$business', { county: '$counties' }],
          },
        },
      },

      {
        $lookup: {
          from: 'category',
          let: {
            userCategoryIds: {
              $ifNull: [
                {
                  $map: {
                    input: '$category',
                    as: 'c',
                    in: '$$c.category_id',
                  },
                },
                [],
              ],
            },
          },
          pipeline: [
            { $unwind: '$category' },
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$category._id', '$$userCategoryIds'] },
                    { $eq: ['$category.is_deleted', false] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: '$category._id',
                name: '$category.name',
                type_of_work: '$category.type_of_work',
              },
            },
          ],
          as: 'category',
        },
      },

      {
        $lookup: {
          from: 'project',
          let: { businessId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$business_id', '$$businessId'] },
                    { $eq: ['$status', ProjectStatus.COMPLETED] },
                  ],
                },
              },
            },
            { $count: 'count' },
          ],
          as: 'completedProjectInfo',
        },
      },

      {
        $lookup: {
          from: 'review',
          let: { businessId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$business_id', '$$businessId'] },
              },
            },
            {
              $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
              },
            },
          ],
          as: 'ratingInfo',
        },
      },

      {
        $addFields: {
          completedProjectCount: {
            $ifNull: [{ $arrayElemAt: ['$completedProjectInfo.count', 0] }, 0],
          },
          averageRating: {
            $round: [
              { $ifNull: [{ $arrayElemAt: ['$ratingInfo.avgRating', 0] }, 0] },
              1,
            ],
          },
          totalReviewCount: {
            $ifNull: [{ $arrayElemAt: ['$ratingInfo.totalReviews', 0] }, 0],
          },
        },
      },

      {
        $project: {
          full_name: 1,
          email: 1,
          phone_number: 1,
          profile_image: 1,
          banner_image: 1,
          business_name: 1,
          org_no: 1,
          description: 1,
          address: 1,
          location: 1,
          status: 1,
          createdAt: 1,
          plan_assigned: 1,
          payment_status: 1,
          category: 1,
          county: 1,
          completedProjectCount: 1,
          averageRating: 1,
          totalReviewCount: 1,
        },
      },
    ]);

    if (!businessData) {
      Logger.error(`Business ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.BUSINESS_NOT_FOUND,
        `Business ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Business ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      businessData,
    );
  }

  async updatePayment(dto: UpdatePaymentDto) {
    const { business_id, price, validity_days } = dto;

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

    const findBusinessClip = await this.businessClipModel.findOne({
      business_id: new Types.ObjectId(business_id),
      status: BusinessClipStatus.ACTIVE,
    });

    if (!findBusinessClip) {
      Logger.error(`Business Clip ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.BUSINESS_CLIP_NOT_FOUND,
        `Business Clip ${Messages.NOT_FOUND}`,
      );
    }

    const purchasedAt = new Date();
    const expiryDate = calculateExpiryDate(validity_days);
    const validityMonths = Number.parseInt(validity_days);
    const monthlyClips = findBusinessClip.package_details.monthly_duration;

    const monthHistory = generateMonthHistory(
      purchasedAt,
      expiryDate,
      validityMonths,
      monthlyClips,
    );

    const updatedPlan = await this.businessClipModel.findOneAndUpdate(
      {
        business_id: new Types.ObjectId(business_id),
        status: BusinessClipStatus.ACTIVE,
      },
      {
        $set: {
          'package_details.price': price,
          'package_details.validity_days': validity_days,
          'package_details.total_clips': validityMonths * monthlyClips,
          'package_details.monthly_duration': monthlyClips,
          remaining_clips: validityMonths * monthlyClips,
          month_history: monthHistory,
          expiry_date: expiryDate,
          purchased_at: purchasedAt,
          payment_status: BusinessPaymentStatus.RECEIVED,
        },
      },
      { new: true },
    );

    await this.userModel.updateOne(
      { _id: new Types.ObjectId(business_id), is_active: true },
      {
        $set: {
          payment_status: PaymentStatus.PAYMENT_RECEIVED,
        },
      },
    );

    await this.clipUsageHistoryModel.create({
      business_id: findBusiness._id,
      clips_used: updatedPlan?.remaining_clips,
      usage_type: BusinessClipHistory.PURCHASED,
      description: findBusinessClip.package_details.package_name,
    });

    Logger.log(`Payment details ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.BUSINESS_CLIP_UPDATED_SUCCESS,
      `Payment details ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async listOfPurchasing(dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const start = (pageNumber - 1) * pageLimit;

    const now = new Date();

    const pipeline: PipelineStage[] = [];

    pipeline.push(
      {
        $lookup: {
          from: 'user',
          localField: 'business_id',
          foreignField: '_id',
          as: 'businessData',
        },
      },
      {
        $unwind: {
          path: '$businessData',
          preserveNullAndEmptyArrays: true,
        },
      },
    );

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'businessData.business_name': { $regex: search, $options: 'i' } },
            {
              'package_details.package_name': {
                $regex: search,
                $options: 'i',
              },
            },
            { 'package_details.price': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
      {
        $addFields: {
          currentMonthData: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$month_history',
                  as: 'm',
                  cond: {
                    $and: [
                      { $lte: ['$$m.start_date', now] },
                      { $gt: ['$$m.expiry_date', now] },
                    ],
                  },
                },
              },
              0,
            ],
          },
        },
      },

      {
        $addFields: {
          monthly_remaining_clips: {
            $ifNull: ['$currentMonthData.clip', 0],
          },
        },
      },
      {
        $project: {
          _id: 1,
          business_id: 1,
          business_name: '$businessData.business_name',
          business_status: '$businessData.status',
          plan_assigned: '$businessData.plan_assigned',
          package_name: '$package_details.package_name',
          price: '$package_details.price',
          validity_days: '$package_details.validity_days',
          monthly_duration: '$package_details.monthly_duration',
          total_clips: '$package_details.total_clips',
          expiry_date: 1,
          status: 1,
          payment_status: 1,
          remaining_clips: 1,
          monthly_remaining_clips: 1,
          createdAt: 1,
        },
      },
      {
        $sort: {
          [sortKey || 'createdAt']: sortOrder,
        },
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

    const [result] = await this.businessClipModel.aggregate(pipeline);

    const paginatedResults = result?.paginatedResults ?? [];
    const totalItems =
      result?.totalCount?.length > 0 ? result.totalCount[0].count : 0;

    Logger.log(`Purchasing List ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      {
        items: paginatedResults,
        totalCount: totalItems,
        itemsCount: paginatedResults.length,
        currentPage: pageNumber,
        totalPage: Math.ceil(totalItems / pageLimit),
        pageSize: pageLimit,
      },
    );
  }

  async viewPurchasing(purchasingId: string) {
    const [purchaseData] = await this.businessClipModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(purchasingId),
        },
      },
      {
        $lookup: {
          from: 'user',
          localField: 'business_id',
          foreignField: '_id',
          as: 'businessData',
        },
      },
      {
        $unwind: {
          path: '$businessData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          business_name: '$businessData.business_name',
          business_status: '$businessData.status',
          package_name: '$package_details.package_name',
          price: '$package_details.price',
          validity_days: '$package_details.validity_days',
          total_clips: '$package_details.total_clips',
          monthly_duration: '$package_details.monthly_duration',
          expiry_date: 1,
          status: 1,
          payment_status: 1,
          subscription_id: 1,
          remaining_clips: 1,
          purchased_at: 1,
          createdAt: 1,
        },
      },
    ]);

    if (!purchaseData) {
      Logger.error(`Purchase ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.PURCHASE_NOT_FOUND,
        `Purchase ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Purchase ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      purchaseData,
    );
  }

  async updateBusinessStatus(dto: UpdateBusinessStatusDto) {
    const { business_id, status } = dto;

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

    await this.userModel.updateOne(
      { _id: new Types.ObjectId(business_id) },
      { $set: { status } },
    );

    Logger.log(`Business status ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.BUSINESS_STATUS_UPDATED_SUCCESS,
      `Business status ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async updatePaymentStatus(dto: UpdatePaymentStatusDto) {
    const { business_id, payment_status } = dto;

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

    const findBusinessClip = await this.businessClipModel.findOne({
      business_id: new Types.ObjectId(business_id),
      status: BusinessClipStatus.ACTIVE,
    });

    if (!findBusinessClip) {
      Logger.error(`Business Clip ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.BUSINESS_CLIP_NOT_FOUND,
        `Business Clip ${Messages.NOT_FOUND}`,
      );
    }

    const validityDays = Number.parseInt(
      findBusinessClip.package_details.validity_days,
    );
    const expiryDate = calculateExpiryDate(
      findBusinessClip.package_details.validity_days,
    );
    const purchasedAt = new Date();
    const monthlyClips = findBusinessClip.package_details.monthly_duration;

    const monthHistory = generateMonthHistory(
      purchasedAt,
      expiryDate,
      validityDays,
      monthlyClips,
    );

    await this.businessClipModel.updateOne(
      { business_id: new Types.ObjectId(business_id) },
      {
        $set: {
          payment_status,
          purchased_at: purchasedAt,
          expiry_date: expiryDate,
          month_history: monthHistory,
        },
      },
    );

    await this.userModel.updateOne(
      { _id: new Types.ObjectId(business_id), is_active: true },
      {
        $set: {
          payment_status:
            payment_status === BusinessPaymentStatus.RECEIVED
              ? PaymentStatus.PAYMENT_RECEIVED
              : PaymentStatus.PAYMENT_REJECTED,
        },
      },
    );

    await this.clipUsageHistoryModel.create({
      business_id: findBusiness._id,
      clips_used: findBusinessClip.remaining_clips,
      usage_type: BusinessClipHistory.PURCHASED,
      description: findBusinessClip.package_details.package_name,
    });

    Logger.log(`Payment status ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.PAYMENT_STATUS_UPDATED_SUCCESS,
      `Payment status ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async addRenewalPlan(dto: AddRenewalPlanDto) {
    const {
      business_id,
      subscription_id,
      validity_days,
      monthly_duration,
      price,
    } = dto;

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

    const findSubscription = await this.clipSubscriptionModel.findOne({
      _id: new Types.ObjectId(subscription_id),
    });

    if (!findSubscription) {
      Logger.error(`Subscription ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.SUBSCRIPTION_NOT_FOUND,
        `Subscription ${Messages.NOT_FOUND}`,
      );
    }

    const findBusinessClip = await this.businessClipModel.findOne({
      business_id: new Types.ObjectId(business_id),
    });

    if (!findBusinessClip) {
      const createPlan = {
        business_id: new Types.ObjectId(business_id),
        package_details: {
          package_name: findSubscription?.package_name,
          package_description: findSubscription?.package_description,
          price,
          validity_days: validity_days,
          total_clips: Number.parseInt(validity_days) * monthly_duration,
        },
        remaining_clips: Number.parseInt(validity_days) * monthly_duration,
        purchased_at: new Date(),
      };

      await this.businessClipModel.create(createPlan);

      await this.clipRenewalModel.create({
        business_id: new Types.ObjectId(business_id),
        subscription_id: new Types.ObjectId(subscription_id),
        validity_days: validity_days,
        monthly_duration: monthly_duration,
      });

      Logger.log(`Membership ${Messages.UPDATED_SUCCESS}`);
      return HandleResponse(
        HttpStatus.ACCEPTED,
        ResponseData.SUCCESS,
        MessagesKey.RENEWAL_PLAN_UPDATED_SUCCESS,
        `Membership ${Messages.UPDATED_SUCCESS}`,
      );
    }

    const currentDate = new Date();
    const expiryDate = new Date(findBusinessClip?.expiry_date);

    if (expiryDate > currentDate) {
      Logger.error(Messages.SUBSCRIPTION_PLAN_ALREADY_EXISTING);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.ALREADY_HAVE_PLAN,
        Messages.SUBSCRIPTION_PLAN_ALREADY_EXISTING,
      );
    }

    await this.businessClipModel.updateOne(
      { business_id: new Types.ObjectId(business_id) },
      {
        $set: {
          'package_details.package_name': findSubscription?.package_name,
          'package_details.package_description':
            findSubscription?.package_description,
          'package_details.total_clips':
            Number.parseInt(validity_days) * monthly_duration,
          'package_details.price': price,
          'package_details.validity_days': validity_days,
          'package_details.monthly_duration': monthly_duration,
          purchased_at: new Date(),
          remaining_clips: Number.parseInt(validity_days) * monthly_duration,
          status: BusinessClipStatus.ACTIVE,
          payment_status: BusinessPaymentStatus.PENDING,
          expiry_date: calculateExpiryDate(validity_days),
        },
      },
    );

    await this.clipRenewalModel.create({
      business_id: new Types.ObjectId(business_id),
      subscription_id: new Types.ObjectId(subscription_id),
      validity_days: validity_days,
      monthly_duration: monthly_duration,
    });

    Logger.log(`Membership ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.RENEWAL_PLAN_UPDATED_SUCCESS,
      `Membership ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async addRefillPlan(dto: AddRefillPlanDto) {
    const { business_id, clip, price, expiry_date } = dto;

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

    const findBusinessClip = await this.businessClipModel.findOne({
      business_id: new Types.ObjectId(business_id),
    });

    if (!findBusinessClip) {
      Logger.error(`Business Clip ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.BUSINESS_CLIP_NOT_FOUND,
        `Business Clip ${Messages.NOT_FOUND}`,
      );
    }

    const now = new Date();
    const currentMonthHistory = findBusinessClip.month_history.find((month) => {
      const startDate = new Date(month.start_date);
      const endDate = new Date(month.expiry_date);
      return now >= startDate && now < endDate;
    });

    if (currentMonthHistory && currentMonthHistory.clip > 0) {
      Logger.error(Messages.ALREADY_HAVE_CURRENT_MONTH_PLAN);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.ALREADY_HAVE_CURRENT_MONTH_PLAN,
        Messages.ALREADY_HAVE_CURRENT_MONTH_PLAN,
      );
    }

    await this.clipRefillModel.create({
      business_id: new Types.ObjectId(business_id),
      clip,
      price,
      expiry_date,
      purchased_at: new Date(),
    });

    Logger.log(`Top-up ${Messages.ADD_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.TOPUP_ADDED_SUCCESS,
      `Top-up ${Messages.ADD_SUCCESS}`,
    );
  }

  async getExpiryDate(id: string) {
    const findBusinessClip = await this.businessClipModel.findOne({
      business_id: new Types.ObjectId(id),
    });

    if (!findBusinessClip) {
      Logger.error(`Business Clip ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.BUSINESS_CLIP_NOT_FOUND,
        `Business Clip ${Messages.NOT_FOUND}`,
      );
    }

    const now = new Date();
    let expiryDate: Date;

    // Get the last expiry date from monthly history or use the main expiry date
    const monthlyHistory = findBusinessClip.month_history || [];
    const lastMonthlyHistory = monthlyHistory.at(-1);

    const expirySource =
      lastMonthlyHistory?.expiry_date ?? findBusinessClip.expiry_date;

    const lastExpiry = expirySource ? new Date(expirySource) : null;

    if (lastExpiry) {
      // If we have a last expiry date, use it if we're within the subscription period
      // or if we're in the last month
      const oneMonthFromNow = new Date(now);
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

      // If one month from now would be after the last expiry date, return the last expiry date
      if (oneMonthFromNow > lastExpiry) {
        expiryDate = lastExpiry;
      } else {
        // Otherwise, return one month from now
        expiryDate = oneMonthFromNow;
      }
    } else {
      // If no expiry dates are set, default to one month from now
      expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    const formattedExpiryDate = expiryDate.toISOString();

    Logger.log(Messages.GET_EXPIRY_DATE);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      {
        expiry_date: formattedExpiryDate,
      },
    );
  }

  async assignBusinessPlan(dto: AssignBusinessPlanDto) {
    const {
      business_id,
      subscription_id,
      validity_days,
      monthly_duration,
      price,
    } = dto;

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
      _id: new Types.ObjectId(subscription_id),
    });

    if (!findSubscription) {
      Logger.error(`Subscription ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.SUBSCRIPTION_NOT_FOUND,
        `Subscription ${Messages.NOT_FOUND}`,
      );
    }

    const purchasedAt = new Date();
    const expiryDate = calculateExpiryDate(validity_days);
    const validityMonths = Number.parseInt(validity_days);
    const monthlyClips = monthly_duration || findSubscription.monthly_duration;

    const monthHistory = generateMonthHistory(
      purchasedAt,
      expiryDate,
      validityMonths,
      monthlyClips,
    );

    const createPlan = {
      business_id: new Types.ObjectId(business_id),
      subscription_id: new Types.ObjectId(subscription_id),
      package_details: {
        package_name: findSubscription?.package_name,
        package_description: findSubscription?.package_description,
        price: price,
        total_clips: Number.parseInt(validity_days) * monthlyClips,
        validity_days: validity_days,
        monthly_duration: monthlyClips,
      },
      remaining_clips: Number.parseInt(validity_days) * monthlyClips,
      purchased_at: purchasedAt,
      expiry_date: expiryDate,
      month_history: monthHistory,
    };

    await this.businessClipModel.create(createPlan);

    await this.userModel.updateOne(
      { _id: new Types.ObjectId(business_id) },
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
