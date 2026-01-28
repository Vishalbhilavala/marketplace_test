import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Review, ReviewDocument } from 'src/schema/review.schema';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { UserRequest } from 'src/libs/utils/constant/interface';
import { Project, ProjectDocument } from 'src/schema/project.schema';
import { ProjectStatus, ResponseData } from 'src/libs/utils/constant/enum';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import { Messages, MessagesKey } from 'src/libs/utils/constant/messages';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async createReview(req: UserRequest, dto: CreateReviewDto) {
    const { id } = req.user;
    const { project_id, ...reviewDetails } = dto;
    const project = await this.projectModel.findById(project_id);

    if (!project) {
      Logger.error(`Project ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.PROJECT_NOT_FOUND,
        `Project ${Messages.NOT_FOUND}`,
      );
    }

    if (project?.status !== ProjectStatus.COMPLETED) {
      Logger.error(`Project ${Messages.NOT_COMPLETED}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.PROJECT_NOT_COMPLETED,
        `Project ${Messages.NOT_COMPLETED}`,
      );
    }

    const existingReview = await this.reviewModel.findOne({
      customer_id: id,
      project_id,
    });

    if (existingReview) {
      Logger.error(`Review ${Messages.ALREADY_EXIST}`);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.REVIEW_ALREADY_EXIST,
        `Review ${Messages.ALREADY_EXIST}`,
      );
    }

    await this.reviewModel.create({
      customer_id: id,
      project_id,
      ...reviewDetails,
    });

    Logger.log(`Review ${Messages.CREATE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.CREATED,
      ResponseData.SUCCESS,
      MessagesKey.REVIEW_CREATED_SUCCESS,
      `Review ${Messages.CREATE_SUCCESS}`,
    );
  }

  async updateReview(dto: UpdateReviewDto) {
    const { ...reviewDetails } = dto;
    const review = await this.reviewModel.findById(reviewDetails.review_id);

    if (!review) {
      Logger.error(`Review ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.REVIEW_NOT_FOUND,
        `Review ${Messages.NOT_FOUND}`,
      );
    }

    if (review?.business_reply) {
      Logger.error(`Reply ${Messages.ALREADY_EXIST}`);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.REPLAY_ALREADY_EXIST,
        `Reply ${Messages.ALREADY_EXIST}`,
      );
    }

    await this.reviewModel.findByIdAndUpdate(
      reviewDetails?.review_id,
      reviewDetails,
    );

    Logger.log(`Reply ${Messages.SENT_SUCCESSFULLY}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.REPLAY_SENT_SUCCESSFULLY,
      `Reply ${Messages.SENT_SUCCESSFULLY}`,
    );
  }

  async listOfReview(businessId: string, dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortValue } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const start = (pageNumber - 1) * pageLimit;
    const sortOrder = sortValue === 'asc' ? 1 : -1;

    const pipeline: PipelineStage[] = [];

    if (businessId && Types.ObjectId.isValid(businessId)) {
      pipeline.push({
        $match: {
          business_id: new Types.ObjectId(businessId),
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
        $lookup: {
          from: 'category',
          let: { categoryId: '$project.category.category_id' },
          pipeline: [
            { $unwind: '$category' },
            {
              $match: {
                $expr: { $eq: ['$category._id', '$$categoryId'] },
              },
            },
            {
              $project: {
                _id: 0,
                name: '$category.name',
              },
            },
          ],
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
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
            { rating: { $regex: search, $options: 'i' } },
            { review_text: { $regex: search, $options: 'i' } },
            { business_reply: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({
      $facet: {
        paginatedResults: [
          { $sort: { 'project.createdAt': sortOrder } },
          { $skip: start },
          { $limit: pageLimit },
          {
            $project: {
              _id: 1,
              rating: 1,
              review_text: 1,
              business_reply: 1,
              createdAt: 1,
              project_title: '$project.title',
              project_description: '$project.description',
              category_name: '$category.name',
              customer_name: '$customer.full_name',
              customer_profile_image: '$customer.profile_image',
            },
          },
        ],
        totalCount: [{ $count: 'count' }],

        averageRating: [
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$rating' },
            },
          },
        ],

        ratingBreakdown: [
          {
            $group: {
              _id: { $floor: '$rating' },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              rating: '$_id',
              count: 1,
            },
          },
          {
            $group: {
              _id: null,
              ratings: {
                $push: {
                  k: { $toString: '$rating' },
                  v: '$count',
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              ratingCounts: {
                $mergeObjects: [
                  { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
                  { $arrayToObject: '$ratings' },
                ],
              },
            },
          },
        ],
      },
    });

    const [result] = await this.reviewModel.aggregate(pipeline);
    const items = result?.paginatedResults ?? [];
    const totalItems = result?.totalCount?.[0]?.count ?? 0;
    const averageRating = result?.averageRating?.[0]?.avgRating
      ? Number(result.averageRating[0].avgRating.toFixed(1))
      : 0;
    const ratingCounts = result?.ratingBreakdown?.[0]?.ratingCounts ?? {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    Logger.log(`Reviews ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      {
        averageRating,
        ratingCounts,
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
