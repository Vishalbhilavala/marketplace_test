import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { UserRequest } from 'src/libs/utils/constant/interface';
import { Offer, OfferDocument } from 'src/schema/offer.schema';
import { AcceptOfferDto, ApplyProjectDto } from './dto/offer.dto';
import { User, UserDocument } from 'src/schema/user.schema';
import {
  BusinessClipHistory,
  BusinessClipStatus,
  BusinessPaymentStatus,
  OfferStatus,
  PaymentStatus,
  ProjectStatus,
  ResponseData,
} from 'src/libs/utils/constant/enum';
import { Messages, MessagesKey } from 'src/libs/utils/constant/messages';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import {
  ClipUsageHistory,
  ClipUsageHistoryDocument,
} from 'src/schema/clip-usage-history.schema';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { Project, ProjectDocument } from 'src/schema/project.schema';
import {
  BusinessClips,
  BusinessClipsDocument,
} from 'src/schema/business-clip.schema';

@Injectable()
export class OfferService {
  constructor(
    @InjectModel(Offer.name)
    private readonly offerModel: Model<OfferDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(ClipUsageHistory.name)
    private readonly clipUsageHistoryModel: Model<ClipUsageHistoryDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(BusinessClips.name)
    private readonly businessClipModel: Model<BusinessClipsDocument>,
  ) {}

  async applyProject(req: UserRequest, dto: ApplyProjectDto) {
    const { id } = req.user;
    const { project_id } = dto;

    const findBusiness = await this.userModel.findOne({
      _id: id,
      payment_status: PaymentStatus.PAYMENT_RECEIVED,
      plan_assigned: true,
      is_active: true,
    });

    if (!findBusiness) {
      Logger.error(`Business Plan ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.BUSINESS_PLAN_NOT_FOUND,
        `Business Plan ${Messages.NOT_FOUND}`,
      );
    }

    const findBusinessClip = await this.businessClipModel.findOne({
      business_id: findBusiness._id,
      status: BusinessClipStatus.ACTIVE,
      payment_status: BusinessPaymentStatus.RECEIVED,
    });

    if (!findBusinessClip || findBusinessClip.remaining_clips < 1) {
      Logger.error(Messages.INSUFFICIENT_CLIPS);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.INSUFFICIENT_CLIPS,
        Messages.INSUFFICIENT_CLIPS,
      );
    }

    const now = new Date();

    const currentMonthIndex = findBusinessClip.month_history.findIndex(
      (month) =>
        new Date(month.start_date) <= now && now < new Date(month.expiry_date),
    );

    // if (findBusinessClip.month_history[currentMonthIndex].clip < 1) {
    // Logger.error('No monthly clips remaining');
    //   return HandleResponse(
    //     HttpStatus.BAD_REQUEST,
    //     ResponseData.ERROR,
    //     MessagesKey.INSUFFICIENT_MONTHLY_CLIPS,
    //     'No monthly clips remaining',
    //   );
    // }

    const findBusinessOffer = await this.offerModel.findOne({
      business_id: findBusiness._id,
      project_id,
    });

    if (findBusinessOffer) {
      Logger.error(Messages.ALREADY_OFFERED);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.PROJECT_ALREADY_OFFERD,
        Messages.ALREADY_OFFERED,
      );
    }

    await this.offerModel.create({
      business_id: findBusiness._id,
      clips_used: 1,
      ...dto,
    });

    const project = await this.projectModel
      .findById(project_id)
      .select('title')
      .lean();

    await this.clipUsageHistoryModel.create({
      business_id: findBusiness._id,
      clips_used: 1,
      project_id,
      description: project?.title,
      usage_type: BusinessClipHistory.APPLIED,
    });

    await this.businessClipModel.updateOne(
      {
        _id: findBusinessClip._id,
        remaining_clips: { $gte: 1 },
      },
      {
        $inc: {
          remaining_clips: -1,
          [`month_history.${currentMonthIndex}.clip`]: -1,
        },
      },
    );

    Logger.log(`Offer ${Messages.CREATE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.OFFER_CREATED_SUCCESS,
      `Offer ${Messages.CREATE_SUCCESS}`,
    );
  }

  async listOfOffer(req: UserRequest, dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue, status } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const start = (pageNumber - 1) * pageLimit;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const sortField = sortKey || 'createdAt';

    const pipeline: PipelineStage[] = [];

    pipeline.push(
      {
        $match: {
          business_id: new Types.ObjectId(req.user.id),
        },
      },
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
        $lookup: {
          from: 'user',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true,
        },
      },
    );

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'project.title': { $regex: search, $options: 'i' } },
            { 'customer.full_name': { $regex: search, $options: 'i' } },
            { amount: { $regex: search, $options: 'i' } },
            { status: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
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
            ...(status ? [{ $match: { status } }] : []),
            { $sort: { sortValue: sortOrder } },
            { $skip: start },
            { $limit: pageLimit },
            {
              $project: {
                _id: 1,
                project_id: 1,
                amount: 1,
                status: 1,
                createdAt: 1,
                project_title: '$project.title',
                customer_name: '$customer.full_name',
              },
            },
          ],
          totalCount: [
            ...(status ? [{ $match: { status } }] : []),
            { $count: 'count' },
          ],
          count: [
            {
              $group: {
                _id: null,
                pending: {
                  $sum: {
                    $cond: [{ $eq: ['$status', OfferStatus.PENDING] }, 1, 0],
                  },
                },
                assigned: {
                  $sum: {
                    $cond: [{ $eq: ['$status', OfferStatus.ASSIGNED] }, 1, 0],
                  },
                },
                rejected: {
                  $sum: {
                    $cond: [{ $eq: ['$status', OfferStatus.REJECTED] }, 1, 0],
                  },
                },
                completed: {
                  $sum: {
                    $cond: [{ $eq: ['$status', OfferStatus.COMPLETED] }, 1, 0],
                  },
                },
                cancelled: {
                  $sum: {
                    $cond: [{ $eq: ['$status', OfferStatus.CANCELLED] }, 1, 0],
                  },
                },
                deleted: {
                  $sum: {
                    $cond: [{ $eq: ['$status', OfferStatus.DELETED] }, 1, 0],
                  },
                },
                all: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                pending: 1,
                assigned: 1,
                rejected: 1,
                completed: 1,
                cancelled: 1,
                deleted: 1,
                all: 1,
              },
            },
          ],
        },
      },
    );

    const [result] = await this.offerModel.aggregate(pipeline);
    const items = result?.paginatedResults ?? [];
    const totalItems = result?.totalCount?.[0]?.count ?? 0;

    const count = result?.count?.[0] ?? {
      all: 0,
      pending: 0,
      assigned: 0,
      rejected: 0,
      completed: 0,
      cancelled: 0,
    };

    Logger.log(`Offers ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      {
        items,
        count,
        totalCount: totalItems,
        itemsCount: items.length,
        currentPage: pageNumber,
        totalPage: Math.ceil(totalItems / pageLimit),
        pageSize: pageLimit,
      },
    );
  }

  async viewOffer(req: UserRequest, offerId: string) {
    const offer = await this.offerModel.findOne({
      _id: offerId,
      business_id: req.user.id,
    });

    if (!offer) {
      Logger.error(`Offer ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.OFFER_NOT_FOUND,
        `Offer ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Offer ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      offer,
    );
  }

  async acceptOffer(req: UserRequest, dto: AcceptOfferDto) {
    const { id } = req.user;
    const { offer_id } = dto;

    const findOffer = await this.offerModel.findOne({
      _id: offer_id,
      customer_id: id,
    });

    if (!findOffer) {
      Logger.error(`Offer ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.OFFER_NOT_FOUND,
        `Offer ${Messages.NOT_FOUND}`,
      );
    }

    await this.offerModel.findByIdAndUpdate(offer_id, {
      status: OfferStatus.ASSIGNED,
    });

    await this.offerModel.updateMany(
      {
        project_id: findOffer.project_id,
        _id: { $ne: offer_id },
      },
      {
        $set: { status: OfferStatus.REJECTED },
      },
    );

    await this.projectModel.findByIdAndUpdate(findOffer.project_id, {
      status: ProjectStatus.ASSIGNED,
      business_id: findOffer.business_id,
    });

    Logger.log(`Offer ${Messages.ACCEPTED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      MessagesKey.OFFER_ACCEPTED_SUCCESS,
      `Offer ${Messages.ACCEPTED_SUCCESS}`,
    );
  }
}
