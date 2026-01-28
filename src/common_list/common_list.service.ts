import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import { ProjectStatus, ResponseData } from 'src/libs/utils/constant/enum';
import { Messages, MessagesKey } from 'src/libs/utils/constant/messages';
import { ListOfMunicipalityDto } from './dto/commonList.dto';
import {
  ClipSubscription,
  ClipSubscriptionDocument,
} from 'src/schema/clip-subscription.schema';
import { County, CountyDocument } from 'src/schema/county.schema';
import {
  ProffCounty,
  ProffCountyDocument,
} from 'src/schema/proff-county.schema';
import { Review, ReviewDocument } from 'src/schema/review.schema';
import {
  Municipality,
  MunicipalityDocument,
} from 'src/schema/municipality.schema';
import { Project, ProjectDocument } from 'src/schema/project.schema';
import axios from 'axios';
import { Category, CategoryDocument } from 'src/schema/category.schema';
import { User, UserDocument } from 'src/schema/user.schema';

@Injectable()
export class CommonListService {
  constructor(
    @InjectModel(ProffCounty.name)
    private readonly proffCountyModel: Model<ProffCountyDocument>,
    @InjectModel(ClipSubscription.name)
    private readonly clipSubscriptionModel: Model<ClipSubscriptionDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(County.name)
    private readonly countyModel: Model<CountyDocument>,
    @InjectModel(Municipality.name)
    private readonly municipalityModel: Model<MunicipalityDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async listOfCounty(dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const start = (pageNumber - 1) * pageLimit;

    const pipeline: PipelineStage[] = [];

    if (search) {
      pipeline.push({
        $match: {
          $or: [{ name: { $regex: search, $options: 'i' } }],
        },
      });
    }

    pipeline.push(
      {
        $project: {
          _id: 1,
          name: 1,
          municipalities: 1,
          villages: 1,
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

    const [result] = await this.proffCountyModel.aggregate(pipeline);

    const paginatedResults = result?.paginatedResults ?? [];
    const totalItems =
      result?.totalCount?.length > 0 ? result.totalCount[0].count : 0;

    Logger.log(`County ${Messages.GET_SUCCESS}`);
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

  async listOfMunicipality(dto: ListOfMunicipalityDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue, countyId } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const start = (pageNumber - 1) * pageLimit;
    const sortOrder = sortValue === 'asc' ? 1 : -1;

    const pipeline: PipelineStage[] = [];

    pipeline.push(
      {
        $unwind: '$municipalities',
      },
      {
        $lookup: {
          from: 'municipality',
          let: { muniName: '$municipalities.name' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$name', '$$muniName'] },
                is_deleted: false,
              },
            },
          ],
          as: 'existingMunicipality',
        },
      },

      {
        $match: {
          $expr: {
            $or: [
              { $eq: [{ $size: '$existingMunicipality' }, 0] },

              ...(countyId
                ? [
                    {
                      $eq: [
                        {
                          $arrayElemAt: ['$existingMunicipality.county_id', 0],
                        },
                        new Types.ObjectId(countyId),
                      ],
                    },
                  ]
                : []),
            ],
          },
        },
      },

      {
        $addFields: {
          selected: {
            $gt: [{ $size: '$existingMunicipality' }, 0],
          },
        },
      },
      ...(search
        ? [
            {
              $match: {
                'municipalities.name': { $regex: search, $options: 'i' },
              },
            },
          ]
        : []),
      {
        $project: {
          _id: '$municipalities._id',
          name: '$municipalities.name',
          selected: 1,
          villages: '$municipalities.villages',
        },
      },
      {
        $sort: { [sortKey || 'name']: sortOrder },
      },
      {
        $facet: {
          paginatedResults: [{ $skip: start }, { $limit: pageLimit }],
          totalCount: [{ $count: 'count' }],
        },
      },
    );

    const [result] = await this.proffCountyModel.aggregate(pipeline);

    const paginatedResults = result?.paginatedResults ?? [];
    const totalItems =
      result?.totalCount?.length > 0 ? result.totalCount[0].count : 0;

    Logger.log(`Municipality ${Messages.GET_SUCCESS}`);
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

  async searchVillage(postalCode: string) {
    const [villageData] = await this.municipalityModel.aggregate([
      { $unwind: '$villages' },
      {
        $match: {
          'villages.postal_code': postalCode,
          is_deleted: false,
        },
      },
      {
        $group: {
          _id: '$_id',
          municipality: { $first: '$name' },
          county_id: { $first: '$county_id' },
          village: { $first: '$villages.name' },
          postal_code: { $first: '$villages.postal_code' },
        },
      },
      {
        $lookup: {
          from: 'county',
          localField: 'county_id',
          foreignField: '_id',
          as: 'county',
        },
      },
      { $unwind: '$county' },
      {
        $project: {
          _id: 0,
          county: '$county.name',
          municipality: 1,
          village: 1,
          postal_code: 1,
        },
      },
    ]);

    if (villageData) {
      Logger.log(`Village ${Messages.GET_SUCCESS}`);
      return HandleResponse(
        HttpStatus.OK,
        ResponseData.SUCCESS,
        undefined,
        undefined,
        villageData,
      );
    }

    try {
      const bringApiUrl: string = `https://api.bring.com/address/api/no/postal-codes?postal_code=${postalCode}`;

      const response = await axios.get(bringApiUrl, {
        headers: {
          'X-Mybring-API-Key': process.env.MY_BRING_KEY,
          'X-Mybring-API-Uid': process.env.MY_BRING_UID,
        },
      });

      const bringData = response.data.postal_codes?.[0];
      if (!bringData) {
        Logger.error(`Area ${Messages.NOT_FOUND} `);
        return HandleResponse(
          HttpStatus.NOT_FOUND,
          ResponseData.ERROR,
          MessagesKey.AREA_NOT_FOUND,
          `Area ${Messages.NOT_FOUND}`,
        );
      }

      const { city, county, municipality, postal_code } = bringData;

      // Find county from County model
      const countyRecord = await this.countyModel.findOne({
        name: county,
        is_deleted: false,
      });
      if (countyRecord) {
        // Find municipality from Municipality model
        let municipalityRecord = await this.municipalityModel.findOne({
          name: municipality,
          county_id: countyRecord._id,
          is_deleted: false,
        });

        if (municipalityRecord) {
          // Add village to existing municipality
          await this.municipalityModel.updateOne(
            {
              _id: municipalityRecord._id,
            },
            {
              $addToSet: {
                villages: {
                  name: city,
                  postal_code: postal_code,
                },
              },
            },
          );
        }
      } else {
        Logger.warn(
          `County (${county}) not found in County model, skipping Municipality model update`,
        );
      }

      // Now handle ProffCounty model
      const proffCountyRecord = await this.proffCountyModel.findOne({
        name: county,
      });

      if (!proffCountyRecord) {
        Logger.error(`ProffCounty (${county}) not found in DB`);
        return HandleResponse(
          HttpStatus.NOT_FOUND,
          ResponseData.ERROR,
          MessagesKey.AREA_NOT_FOUND,
          `Area ${Messages.NOT_FOUND}`,
        );
      }

      // Check if municipality exists in ProffCounty
      const proffMunicipalityExists = proffCountyRecord.municipalities.some(
        (muni) => muni.name === municipality,
      );

      if (proffMunicipalityExists) {
        await this.proffCountyModel.updateOne(
          {
            _id: proffCountyRecord._id,
            'municipalities.name': municipality,
          },
          {
            $addToSet: {
              'municipalities.$.villages': {
                name: city,
                postal_code: postal_code,
              },
            },
          },
        );
      } else {
        await this.proffCountyModel.updateOne(
          {
            _id: proffCountyRecord._id,
          },
          {
            $push: {
              municipalities: {
                name: municipality,
                villages: [
                  {
                    name: city,
                    postal_code: postal_code,
                  },
                ],
              },
            },
          },
        );
      }

      const responseData = {
        county,
        municipality,
        village: city,
        postal_code: postal_code,
      };

      Logger.log(`Village ${Messages.GET_SUCCESS} from Bring`);
      return HandleResponse(
        HttpStatus.OK,
        ResponseData.SUCCESS,
        undefined,
        undefined,
        responseData,
      );
    } catch (error) {
      Logger.error(`Error fetching data from Bring API: ${error}`);
    }
  }

  async listOfSubscriptionDropDown() {
    const pipeline: PipelineStage[] = [];
    pipeline.push(
      {
        $match: {
          is_deleted: false,
        },
      },
      {
        $project: {
          _id: 1,
          package_name: 1,
          monthly_duration: 1,
          price: 1,
        },
      },
    );

    const subscriptionDropDown =
      await this.clipSubscriptionModel.aggregate(pipeline);

    Logger.log(`Subscription ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      subscriptionDropDown,
    );
  }

  async listOfBusinessReview(dto: ListOfDataDto) {
    const { page = 1, limit = 10 } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const start = (pageNumber - 1) * pageLimit;

    const pipeline: PipelineStage[] = [];

    pipeline.push({
      $lookup: {
        from: 'user',
        localField: 'business_id',
        foreignField: '_id',
        as: 'business',
        pipeline: [
          {
            $project: {
              _id: 1,
              business_name: 1,
              profile_image: 1,
            },
          },
        ],
      },
    });

    pipeline.push({
      $unwind: {
        path: '$business',
        preserveNullAndEmptyArrays: false,
      },
    });

    pipeline.push({
      $lookup: {
        from: 'user',
        localField: 'customer_id',
        foreignField: '_id',
        as: 'customer',
        pipeline: [
          {
            $project: {
              _id: 1,
              full_name: 1,
              profile_image: 1,
            },
          },
        ],
      },
    });

    pipeline.push({
      $unwind: {
        path: '$customer',
        preserveNullAndEmptyArrays: false,
      },
    });

    pipeline.push({
      $project: {
        _id: 1,
        business: 1,
        customer: 1,
        rating: 1,
        review_text: 1,
        createdAt: 1,
      },
    });

    pipeline.push({
      $sort: {
        rating: -1,
        createdAt: -1,
      },
    });

    pipeline.push({
      $facet: {
        items: [{ $skip: start }, { $limit: pageLimit }],
        totalCount: [{ $count: 'count' }],
      },
    });

    const [result] = await this.reviewModel.aggregate(pipeline);

    const items = result?.items ?? [];
    const totalItems =
      result?.totalCount?.length > 0 ? result.totalCount[0].count : 0;

    Logger.log(`Business Reviews ${Messages.GET_SUCCESS}`);
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

  async stats() {
    const completedProjects = await this.projectModel.countDocuments({
      status: ProjectStatus.COMPLETED,
    });

    const [avgResult] = await this.reviewModel.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
        },
      },
      {
        $project: {
          _id: 0,
          averageRating: { $round: ['$averageRating', 1] },
        },
      },
    ]);

    const averageRating = avgResult?.averageRating ?? 0;

    Logger.log(`Home Page Stats ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      {
        completedProjects,
        averageRating,
      },
    );
  }

  async getServiceDetails(serviceName: string, municipalityName?: string) {
    const escapedName = serviceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const [categoryResult] = await this.categoryModel.aggregate([
      { $match: { is_deleted: false } },
      { $unwind: '$category' },
      {
        $match: {
          'category.is_deleted': false,
          'category.name': {
            $regex: `^${escapedName}$`,
            $options: 'i',
          },
        },
      },
      {
        $project: {
          _id: 0,
          category_id: '$category._id',
          category_name: '$category.name',
          section1: '$category.section1',
          section2: '$category.section2',
          section3: '$category.section3',
          section4: '$category.section4',
          section5: '$category.section5',
        },
      },
    ]);

    if (!categoryResult) {
      Logger.error(`Service ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.CATEGORY_NOT_FOUND,
        `Service ${Messages.NOT_FOUND}`,
      );
    }

    const { category_id, category_name } = categoryResult;

    let municipalityId: Types.ObjectId | undefined;

    if (municipalityName) {
      const escapedMunicipality = municipalityName.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );

      const municipalityDoc = await this.municipalityModel.findOne({
        name: { $regex: `^${escapedMunicipality}$`, $options: 'i' },
        is_deleted: false,
      });

      if (!municipalityDoc) {
        Logger.error(`Municipality ${Messages.NOT_FOUND}`);
        return HandleResponse(
          HttpStatus.NOT_FOUND,
          ResponseData.ERROR,
          MessagesKey.COUNTY_NOT_FOUND,
          `Municipality ${Messages.NOT_FOUND}`,
        );
      }

      municipalityId = municipalityDoc._id;
    }

    const [projectCountResult] = await this.projectModel.aggregate([
      {
        $match: {
          is_deleted: false,
          'category.category_id': category_id,
          status: ProjectStatus.COMPLETED,
          ...(municipalityId && { municipality_id: municipalityId }),
        },
      },
      { $count: 'total_projects' },
    ]);

    const total_projects = projectCountResult?.total_projects ?? 0;

    const reviewPipeline: PipelineStage[] = [
      {
        $match: {
          role: 'business',
          is_active: true,
          category: {
            $elemMatch: {
              category_id: category_id,
            },
          },
          ...(municipalityId && {
            county: {
              $elemMatch: {
                municipalities: {
                  $elemMatch: {
                    municipality_id: municipalityId,
                  },
                },
              },
            },
          }),
        },
      },

      {
        $lookup: {
          from: 'review',
          localField: '_id',
          foreignField: 'business_id',
          as: 'reviews',
        },
      },
      { $unwind: '$reviews' },

      {
        $lookup: {
          from: 'user',
          localField: 'reviews.customer_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },

      {
        $project: {
          _id: 0,
          rating: '$reviews.rating',
          review_text: '$reviews.review_text',
          createdAt: '$reviews.createdAt',
          customer: {
            name: '$customer.full_name',
            profile_image: '$customer.profile_image',
          },
        },
      },

      { $sort: { createdAt: -1 } },
    ];

    const reviews = await this.userModel.aggregate(reviewPipeline);

    Logger.log(`Service Details ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      {
        category_name: category_name,
        category_id,
        section1: categoryResult.section1,
        section2: categoryResult.section2,
        section3: categoryResult.section3,
        section4: categoryResult.section4,
        section5: categoryResult.section5,
        total_projects,
        total_reviews: reviews.length,
        reviews,
      },
    );
  }

  async getMunicipalitiesByDirection() {
    const municipalities = await this.municipalityModel.aggregate([
      { $match: { is_deleted: false, direction: { $nin: [null, ''] } } },
      {
        $group: {
          _id: '$direction',
          municipalities: { $push: '$name' },
        },
      },
      {
        $project: {
          _id: 0,
          direction: '$_id',
          municipalities: 1,
        },
      },
    ]);

    const result = {};
    municipalities.forEach((item) => {
      result[item.direction] = item.municipalities;
    });

    Logger.log(`Directions with municipalities ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      result,
    );
  }

  async viewUserDetails(userId: string) {
    const findUser = await this.userModel
      .findById(userId)
      .select('full_name profile_image business_name role');

    if (!findUser) {
      Logger.error(`User ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.USER_NOT_FOUND,
        `User ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`User ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      findUser,
    );
  }
}
