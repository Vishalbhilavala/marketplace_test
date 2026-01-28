import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import {
  BusinessClipStatus,
  OfferStatus,
  ProjectFilterStatus,
  ProjectStatus,
  ResponseData,
} from 'src/libs/utils/constant/enum';
import { UserRequest } from 'src/libs/utils/constant/interface';
import { Project, ProjectDocument } from 'src/schema/project.schema';
import { Messages } from 'src/libs/utils/constant/messages';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import {
  BusinessCounty,
  BusinessCountyDocument,
} from 'src/schema/business-county.schema';
import {
  ListOfBusinessProjectDto,
  ListOfDataDto,
  ListOfProjectDataDto,
} from 'src/libs/helper/common/dto/listOfData.dto';
import { Offer, OfferDocument } from 'src/schema/offer.schema';
import { Review, ReviewDocument } from 'src/schema/review.schema';
import {
  BusinessClips,
  BusinessClipsDocument,
} from 'src/schema/business-clip.schema';
import { User, UserDocument } from 'src/schema/user.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Offer.name)
    private readonly offerModel: Model<OfferDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(BusinessClips.name)
    private readonly businessClipModel: Model<BusinessClipsDocument>,
    @InjectModel(BusinessCounty.name)
    private readonly businessCountyModel: Model<BusinessCountyDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async listOfProject(
    req: UserRequest,
    dto: ListOfBusinessProjectDto,
    isActive: boolean,
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      sortKey,
      sortValue,
      county,
      municipality,
      status,
      category,
      typeOfWork,
    } = dto;

    let pageNumber = Number(page) || 1;
    let pageLimit = Number(limit) || 10;

    const business = await this.userModel.findById(req.user.id, {
      plan_assigned: 1,
      payment_status: 1,
    });

    let projectCount = false;
    if (business?.payment_status === 'pending') {
      pageNumber = 1;
      pageLimit = 10;
      projectCount = true;
    }

    const start = (pageNumber - 1) * pageLimit;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const sortField = sortKey || 'createdAt';

    const pipeline: PipelineStage[] = [];

    const matchStage: Record<string, unknown> = {
      is_deleted: false,
      status: ProjectStatus.PUBLISHED,
    };

    if (isActive) {
      matchStage.business_id = new Types.ObjectId(req.user.id);
    }

    const orConditions: Record<string, unknown>[] = [];

    if (Array.isArray(county) && county.length > 0) {
      orConditions.push({
        county_id: {
          $in: county.map((id) => new Types.ObjectId(id)),
        },
      });
    }

    if (Array.isArray(municipality) && municipality.length > 0) {
      orConditions.push({
        municipality_id: {
          $in: municipality.map((id) => new Types.ObjectId(id)),
        },
      });
    }

    if (Array.isArray(category) && category.length > 0) {
      orConditions.push({
        'category.category_id': {
          $in: category.map((id) => new Types.ObjectId(id)),
        },
        'category.type_of_work_id': { $in: [null] },
      });
    }

    if (Array.isArray(typeOfWork) && typeOfWork.length > 0) {
      orConditions.push({
        'category.type_of_work_id': {
          $in: typeOfWork.map((id) => new Types.ObjectId(id)),
        },
      });
    }

    if (orConditions.length > 0) {
      matchStage.$or = orConditions;
    }

    pipeline.push(
      { $match: matchStage },
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { title: { $regex: search, $options: 'i' } },
                  { description: { $regex: search, $options: 'i' } },
                ],
              },
            },
          ]
        : []),
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
        $lookup: {
          from: 'county',
          localField: 'county_id',
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
          localField: 'municipality_id',
          foreignField: '_id',
          as: 'municipality_info',
        },
      },
      {
        $unwind: {
          path: '$municipality_info',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'municipality',
          let: { postalCode: '$postal_code' },
          pipeline: [
            { $unwind: '$villages' },
            {
              $match: {
                $expr: {
                  $eq: ['$villages.postal_code', '$$postalCode'],
                },
              },
            },
            {
              $project: {
                _id: 0,
                village_name: '$villages.name',
              },
            },
            { $limit: 1 },
          ],
          as: 'villageInfo',
        },
      },
      {
        $addFields: {
          village_name: {
            $arrayElemAt: ['$villageInfo.village_name', 0],
          },
        },
      },

      {
        $lookup: {
          from: 'category',
          let: {
            categoryId: '$category.category_id',
            typeOfWorkId: '$category.type_of_work_id',
          },
          pipeline: [
            { $unwind: '$category' },
            {
              $match: {
                $expr: { $eq: ['$category._id', '$$categoryId'] },
              },
            },
            {
              $project: {
                _id: '$category._id',
                name: '$category.name',
                type_of_work: {
                  $filter: {
                    input: '$category.type_of_work',
                    as: 'work',
                    cond: {
                      $eq: ['$$work._id', '$$typeOfWorkId'],
                    },
                  },
                },
              },
            },
          ],
          as: 'category_info',
        },
      },
      {
        $unwind: {
          path: '$category_info',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'offer',
          let: {
            projectId: '$_id',
            businessId: new Types.ObjectId(req.user.id),
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$project_id', '$$projectId'] },
                    { $eq: ['$business_id', '$$businessId'] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'offer_info',
        },
      },
      {
        $addFields: {
          offered: {
            $cond: [{ $gt: [{ $size: '$offer_info' }, 0] }, true, false],
          },
        },
      },
      ...(status === ProjectFilterStatus.APPLIED
        ? [{ $match: { offered: true } }]
        : status === ProjectFilterStatus.PUBLISHED
          ? [{ $match: { offered: false } }]
          : []),
      {
        $project: {
          _id: 1,
          project_id: 1,
          title: 1,
          description: 1,
          project_image: 1,
          status: 1,
          createdAt: 1,
          offered: 1,
          village_name: 1,

          county: {
            _id: '$county_info._id',
            name: '$county_info.name',
          },

          municipality: {
            _id: '$municipality_info._id',
            name: '$municipality_info.name',
          },

          category: {
            _id: '$category_info._id',
            name: '$category_info.name',
          },

          type_of_work: {
            $let: {
              vars: {
                work: { $arrayElemAt: ['$category_info.type_of_work', 0] },
              },
              in: {
                _id: '$$work._id',
                name: '$$work.name',
              },
            },
          },
        },
      },
      {
        $facet: {
          paginatedResults: [
            { $sort: { [sortField]: sortOrder } },
            { $skip: start },
            { $limit: pageLimit },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    );

    const [result] = await this.projectModel.aggregate(pipeline);

    const items = result?.paginatedResults ?? [];
    const totalItems = result?.totalCount?.[0]?.count ?? 0;

    Logger.log(`Projects ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      {
        items,
        totalCount: projectCount ? items.length : totalItems,
        itemsCount: items.length,
        currentPage: pageNumber,
        totalPage: Math.ceil(totalItems / pageLimit),
        pageSize: pageLimit,
      },
    );
  }

  async getBusinessTopStats(req: UserRequest) {
    const businessId = new Types.ObjectId(req.user.id);

    const activeBusinessClip = await this.businessClipModel.findOne({
      business_id: businessId,
      status: BusinessClipStatus.ACTIVE,
    });

    const remainingClips =
      activeBusinessClip?.package_details?.total_clips ?? 0;

    const newProjects = await this.projectModel.countDocuments({
      business_id: businessId,
      status: ProjectStatus.ASSIGNED,
      is_deleted: false,
    });

    const activeOffers = await this.offerModel.countDocuments({
      business_id: businessId,
      status: OfferStatus.PENDING,
    });

    const ratingAggregation = await this.reviewModel.aggregate([
      {
        $match: {
          business_id: businessId,
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    const avgRating =
      ratingAggregation.length > 0
        ? Number(ratingAggregation[0].avgRating.toFixed(1))
        : 0;

    const result = {
      remaining_clips: remainingClips,
      new_projects: newProjects,
      active_offers: activeOffers,
      avg_rating: avgRating,
    };

    Logger.log(`Business Top Stats ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      result,
    );
  }

  async listRecentOffers(req: UserRequest, dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const start = (pageNumber - 1) * pageLimit;

    const sortField = sortKey || 'createdAt';
    const sortOrder = sortValue === 'asc' ? 1 : -1;

    const pipeline: PipelineStage[] = [];

    pipeline.push({
      $match: {
        business_id: new Types.ObjectId(req.user.id),
      },
    });

    if (search) {
      pipeline.push({
        $match: {
          title: { $regex: search, $options: 'i' },
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
        $unwind: '$project',
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
        $unwind: '$customer',
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
        $project: {
          _id: 1,
          project_name: '$project.title',
          project_image: '$project.project_image',
          customer_name: '$customer.full_name',
          createdAt: 1,
          status: 1,
        },
      },
      {
        $facet: {
          paginatedResults: [
            { $sort: { sortValue: sortOrder } },
            { $skip: start },
            { $limit: pageLimit },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    );

    const [result] = await this.offerModel.aggregate(pipeline);

    const items = result?.paginatedResults ?? [];
    const totalItems = result?.totalCount?.[0]?.count ?? 0;

    Logger.log(`Recent Offers ${Messages.GET_SUCCESS}`);
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

  async listOfCustomerProject(
    req: UserRequest,
    dto: ListOfProjectDataDto,
    isActive: boolean,
  ) {
    let { page = 1, limit = 10, search, sortKey, sortValue, status } = dto;
    const { id } = req.user;
    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const start = (pageNumber - 1) * pageLimit;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const sortField = sortKey || 'createdAt';

    const pipeline: PipelineStage[] = [];

    if (id && Types.ObjectId.isValid(id)) {
      pipeline.push({
        $match: {
          customer_id: new Types.ObjectId(id),
          status: { $ne: ProjectStatus.DRAFT },
        },
      });
    }

    if (isActive) {
      pipeline.push({
        $match: {
          $or: [
            { status: ProjectStatus.ASSIGNED },
            { status: ProjectStatus.PUBLISHED },
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
        $lookup: {
          from: 'category',
          let: {
            categoryId: '$category.category_id',
            typeOfWorkId: '$category.type_of_work_id',
          },
          pipeline: [
            { $unwind: '$category' },
            {
              $match: {
                $expr: { $eq: ['$category._id', '$$categoryId'] },
              },
            },
            {
              $project: {
                _id: '$category._id',
                category: '$category.name',
                type_of_work: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$category.type_of_work',
                        as: 'work',
                        cond: {
                          $eq: ['$$work._id', '$$typeOfWorkId'],
                        },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          ],
          as: 'categoryInfo',
        },
      },
      {
        $unwind: {
          path: '$categoryInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'county',
          localField: 'county_id',
          foreignField: '_id',
          as: 'countyInfo',
        },
      },
      {
        $unwind: {
          path: '$countyInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'municipality',
          let: { postalCode: '$postal_code' },
          pipeline: [
            { $unwind: '$villages' },
            {
              $match: {
                $expr: {
                  $eq: ['$villages.postal_code', '$$postalCode'],
                },
              },
            },
            {
              $project: {
                _id: 0,
                village_name: '$villages.name',
              },
            },
            { $limit: 1 },
          ],
          as: 'villageInfo',
        },
      },
      {
        $addFields: {
          village_name: {
            $ifNull: [{ $arrayElemAt: ['$villageInfo.village_name', 0] }, null],
          },
        },
      },

      {
        $lookup: {
          from: 'review',
          let: {
            projectId: '$_id',
            customerId: new Types.ObjectId(id),
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$project_id', '$$projectId'] },
                    { $eq: ['$customer_id', '$$customerId'] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'reviewInfo',
        },
      },
      {
        $addFields: {
          review_added: {
            $cond: [{ $gt: [{ $size: '$reviewInfo' }, 0] }, true, false],
          },
        },
      },
    );

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { 'categoryInfo.category': { $regex: search, $options: 'i' } },
            { 'categoryInfo.type_of_work': { $regex: search, $options: 'i' } },
            { status: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({
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
              title: 1,
              description: 1,
              project_image: 1,
              status: 1,
              review_added: 1,
              category: {
                _id: '$categoryInfo._id',
                name: '$categoryInfo.category',
              },
              type_of_work: {
                _id: '$categoryInfo.type_of_work._id',
                name: '$categoryInfo.type_of_work.name',
              },
              county: {
                _id: '$countyInfo._id',
                name: '$countyInfo.name',
              },
              village_name: 1,
              createdAt: 1,
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
              published: {
                $sum: {
                  $cond: [{ $eq: ['$status', ProjectStatus.PUBLISHED] }, 1, 0],
                },
              },
              assigned: {
                $sum: {
                  $cond: [{ $eq: ['$status', ProjectStatus.ASSIGNED] }, 1, 0],
                },
              },
              completed: {
                $sum: {
                  $cond: [{ $eq: ['$status', ProjectStatus.COMPLETED] }, 1, 0],
                },
              },
              cancelled: {
                $sum: {
                  $cond: [{ $eq: ['$status', ProjectStatus.CANCELLED] }, 1, 0],
                },
              },
              deleted: {
                $sum: {
                  $cond: [{ $eq: ['$status', ProjectStatus.DELETED] }, 1, 0],
                },
              },
              all: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              published: 1,
              assigned: 1,
              completed: 1,
              cancelled: 1,
              deleted: 1,
              all: 1,
            },
          },
        ],
      },
    });

    const [result] = await this.projectModel.aggregate(pipeline);
    const items = result?.paginatedResults ?? [];
    const totalItems = result?.totalCount?.[0]?.count ?? 0;

    const count = result?.count?.[0] ?? {
      all: 0,
      published: 0,
      assigned: 0,
      completed: 0,
      cancelled: 0,
      deleted: 0,
    };

    Logger.log(`Projects ${Messages.GET_SUCCESS}`);
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

  async getCustomerTopStats(req: UserRequest) {
    const customerId = new Types.ObjectId(req.user.id);

    const activeProjects = await this.projectModel.countDocuments({
      customer_id: customerId,
      status: {
        $in: [ProjectStatus.PUBLISHED],
      },
    });

    const inProgressProjects = await this.projectModel.countDocuments({
      customer_id: customerId,
      status: {
        $in: [ProjectStatus.ASSIGNED],
      },
    });

    const totalOffers = await this.offerModel.countDocuments({
      customer_id: customerId,
    });

    const completedProjects = await this.projectModel.countDocuments({
      customer_id: customerId,
      status: ProjectStatus.COMPLETED,
    });

    const result = {
      active_projects: activeProjects,
      progress_projects: inProgressProjects,
      total_offers: totalOffers,
      completed_projects: completedProjects,
    };

    Logger.log(`Customer Top Stats ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      result,
    );
  }

  async listOfReceivedOffer(
    req: UserRequest,
    projectId: string,
    dto: ListOfDataDto,
  ) {
    const { page = 1, limit = 10, search, sortKey, sortValue } = dto;
    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const start = (pageNumber - 1) * pageLimit;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const sortField = sortKey || 'createdAt';

    const pipeline: PipelineStage[] = [];

    if (projectId && Types.ObjectId.isValid(projectId)) {
      pipeline.push({
        $match: {
          customer_id: new Types.ObjectId(req.user.id),
          project_id: new Types.ObjectId(projectId),
          status: {
            $in: [
              OfferStatus.PENDING,
              OfferStatus.ASSIGNED,
              OfferStatus.COMPLETED,
              OfferStatus.CANCELLED,
              OfferStatus.REJECTED,
            ],
          },
        },
      });
    }

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'business.business_name': { $regex: search, $options: 'i' } },
            { amount: { $regex: search, $options: 'i' } },
            { estimated_duration: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'user',
          localField: 'business_id',
          foreignField: '_id',
          as: 'business',
        },
      },
      {
        $unwind: {
          path: '$business',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'review',
          let: {
            businessId: '$business_id',
            projectId: '$project_id',
            customerId: '$customer_id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$business_id', '$$businessId'],
                },
              },
            },
            {
              $facet: {
                businessStats: [
                  {
                    $group: {
                      _id: null,
                      avgRating: { $avg: '$rating' },
                      totalReviews: { $sum: 1 },
                    },
                  },
                ],
                customerReview: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$project_id', '$$projectId'] },
                          { $eq: ['$customer_id', '$$customerId'] },
                        ],
                      },
                    },
                  },
                  { $limit: 1 },
                ],
              },
            },
          ],
          as: 'reviewInfo',
        },
      },
      {
        $addFields: {
          _reviewInfo: { $arrayElemAt: ['$reviewInfo', 0] },
        },
      },
      {
        $addFields: {
          averageRating: {
            $round: [
              {
                $ifNull: [
                  {
                    $arrayElemAt: ['$_reviewInfo.businessStats.avgRating', 0],
                  },
                  0,
                ],
              },
              1,
            ],
          },
          totalReviewCount: {
            $ifNull: [
              {
                $arrayElemAt: ['$_reviewInfo.businessStats.totalReviews', 0],
              },
              0,
            ],
          },
          review_added: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', OfferStatus.COMPLETED] },
                  {
                    $gt: [
                      {
                        $size: {
                          $ifNull: ['$_reviewInfo.customerReview', []],
                        },
                      },
                      0,
                    ],
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
        $addFields: {
          statusOrder: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', OfferStatus.ASSIGNED] }, then: 1 },
                { case: { $eq: ['$status', OfferStatus.PENDING] }, then: 2 },
                { case: { $eq: ['$status', OfferStatus.COMPLETED] }, then: 3 },
                { case: { $eq: ['$status', OfferStatus.CANCELLED] }, then: 4 },
                { case: { $eq: ['$status', OfferStatus.REJECTED] }, then: 5 },
              ],
              default: 99,
            },
          },
        },
      },
      {
        $sort: {
          statusOrder: 1,
          [sortField]: sortOrder,
        },
      },
      {
        $facet: {
          paginatedResults: [
            { $skip: start },
            { $limit: pageLimit },
            {
              $project: {
                _id: 1,
                amount: 1,
                estimated_duration: 1,
                description: 1,
                status: 1,
                review_added: 1,
                createdAt: 1,
                business_id: '$business._id',
                business_name: '$business.business_name',
                business_image: '$business.profile_image',
                averageRating: 1,
                totalReviewCount: 1,
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    );

    const [result] = await this.offerModel.aggregate(pipeline);
    const items = result?.paginatedResults ?? [];
    const totalItems = result?.totalCount?.[0]?.count ?? 0;

    Logger.log(`Offers ${Messages.GET_SUCCESS}`);
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
}
