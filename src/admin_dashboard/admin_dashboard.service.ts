import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import {
  ProjectStatus,
  ResponseData,
  Role,
} from 'src/libs/utils/constant/enum';
import { AdminDto } from './dto/admin.dto';
import { Model, PipelineStage } from 'mongoose';
import { User, UserDocument } from 'src/schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Messages, MessagesKey } from 'src/libs/utils/constant/messages';
import { Project, ProjectDocument } from 'src/schema/project.schema';
import { Offer, OfferDocument } from 'src/schema/offer.schema';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Offer.name) private readonly offerModel: Model<OfferDocument>,
  ) {}

  private formatMonthLabel(label: string): string {
    const [year, month] = label.split('-');
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    return date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  }

  private generateLabels(
    type: 'day' | 'month',
    start: Date,
    end: Date,
  ): string[] {
    const labels: string[] = [];

    switch (type) {
      case 'day': {
        const cursor = new Date(start);
        while (cursor <= end) {
          labels.push(cursor.toISOString().split('T')[0]); // YYYY-MM-DD
          cursor.setDate(cursor.getDate() + 1);
        }
        break;
      }

      case 'month': {
        let year = start.getFullYear();
        let month = start.getMonth();
        const endYear = end.getFullYear();
        const endMonth = end.getMonth();

        while (year < endYear || (year === endYear && month <= endMonth)) {
          labels.push(`${year}-${String(month + 1).padStart(2, '0')}`);
          month++;
          if (month > 11) {
            month = 0;
            year++;
          }
        }
        break;
      }
    }

    return labels;
  }

  async getNewBusinessRegistrations(dto: AdminDto) {
    const { timeFrame } = dto;

    if (!['day', 'month'].includes(timeFrame)) {
      Logger.log(Messages.INVALID_TIMEFRAME);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.INVALID_TIMEFRAME,
        Messages.INVALID_TIMEFRAME,
      );
    }

    const now = new Date();
    const end = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    let start = new Date();
    let dateFormat = '';

    switch (timeFrame) {
      case 'day':
        start = new Date(end);
        start.setUTCDate(start.getUTCDate() - 6);
        start.setUTCHours(0, 0, 0, 0);
        dateFormat = '%Y-%m-%d';
        break;

      case 'month':
        start = new Date(
          Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1, 0, 0, 0, 0),
        );
        dateFormat = '%Y-%m';
        break;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          role: Role.BUSINESS,
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalBusinesses: { $sum: 1 },
        },
      },
    ];

    const aggregated = await this.userModel.aggregate(pipeline);

    const dataMap: Record<string, number> = {};
    for (const item of aggregated) {
      dataMap[item._id] = item.totalBusinesses;
    }

    const labels = this.generateLabels(timeFrame, start, end);

    type DayData = {
      day: string;
      totalBusinesses: number;
    };

    type MonthData = {
      month: string;
      totalBusinesses: number;
    };

    type AnalyticsData = DayData | MonthData;
    const data: AnalyticsData[] = [];

    for (const label of labels) {
      switch (timeFrame) {
        case 'day': {
          const dayName = new Date(label + 'T00:00:00Z').toLocaleString(
            'en-US',
            {
              weekday: 'short',
              timeZone: 'UTC',
            },
          );

          data.push({
            day: dayName,
            totalBusinesses: dataMap[label] || 0,
          });
          break;
        }

        case 'month': {
          data.push({
            month: this.formatMonthLabel(label),
            totalBusinesses: dataMap[label] || 0,
          });
          break;
        }
      }
    }

    Logger.log(`New Businesses Count ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      data,
    );
  }

  async getNewCustomerRegistrations(dto: AdminDto) {
    const { timeFrame } = dto;

    if (!['day', 'month'].includes(timeFrame)) {
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.INVALID_TIMEFRAME,
        Messages.INVALID_TIMEFRAME,
      );
    }

    const now = new Date();
    const end = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    let start = new Date();
    let dateFormat = '';

    switch (timeFrame) {
      case 'day':
        start = new Date(end);
        start.setUTCDate(start.getUTCDate() - 6);
        start.setUTCHours(0, 0, 0, 0);
        dateFormat = '%Y-%m-%d';
        break;

      case 'month':
        start = new Date(
          Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1, 0, 0, 0, 0),
        );
        dateFormat = '%Y-%m';
        break;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          role: Role.CUSTOMER,
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalCustomers: { $sum: 1 },
        },
      },
    ];

    const aggregated = await this.userModel.aggregate(pipeline);

    const dataMap: Record<string, number> = {};
    for (const item of aggregated) {
      dataMap[item._id] = item.totalCustomers;
    }

    const labels = this.generateLabels(timeFrame, start, end);

    type DayData = {
      day: string;
      totalCustomers: number;
    };

    type MonthData = {
      month: string;
      totalCustomers: number;
    };

    type AnalyticsData = DayData | MonthData;
    const data: AnalyticsData[] = [];

    for (const label of labels) {
      switch (timeFrame) {
        case 'day': {
          const dayName = new Date(label + 'T00:00:00Z').toLocaleString(
            'en-US',
            {
              weekday: 'short',
              timeZone: 'UTC',
            },
          );

          data.push({
            day: dayName,
            totalCustomers: dataMap[label] || 0,
          });
          break;
        }

        case 'month': {
          data.push({
            month: this.formatMonthLabel(label),
            totalCustomers: dataMap[label] || 0,
          });
          break;
        }
      }
    }

    Logger.log(`New Customers Count ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      data,
    );
  }

  async getProjectPostCounts(dto: AdminDto) {
    const { timeFrame } = dto;

    if (!['day', 'month'].includes(timeFrame)) {
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.INVALID_TIMEFRAME,
        Messages.INVALID_TIMEFRAME,
      );
    }

    const now = new Date();
    const end = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    let start = new Date();
    let dateFormat = '';

    switch (timeFrame) {
      case 'day':
        start = new Date(end);
        start.setUTCDate(start.getUTCDate() - 6);
        start.setUTCHours(0, 0, 0, 0);
        dateFormat = '%Y-%m-%d';
        break;

      case 'month':
        start = new Date(
          Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1, 0, 0, 0, 0),
        );
        dateFormat = '%Y-%m';
        break;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          status: ProjectStatus.PUBLISHED,
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalProjects: { $sum: 1 },
        },
      },
    ];

    const aggregated = await this.projectModel.aggregate(pipeline);

    const dataMap: Record<string, number> = {};
    for (const item of aggregated) {
      dataMap[item._id] = item.totalProjects;
    }

    const labels = this.generateLabels(timeFrame, start, end);

    type DayData = {
      day: string;
      totalProjects: number;
    };

    type MonthData = {
      month: string;
      totalProjects: number;
    };

    type AnalyticsData = DayData | MonthData;
    const data: AnalyticsData[] = [];

    for (const label of labels) {
      switch (timeFrame) {
        case 'day': {
          const dayName = new Date(label + 'T00:00:00Z').toLocaleString(
            'en-US',
            {
              weekday: 'short',
              timeZone: 'UTC',
            },
          );

          data.push({
            day: dayName,
            totalProjects: dataMap[label] || 0,
          });
          break;
        }

        case 'month': {
          data.push({
            month: this.formatMonthLabel(label),
            totalProjects: dataMap[label] || 0,
          });
          break;
        }
      }
    }

    Logger.log(`Project Count ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      data,
    );
  }

  async getTopLevelStats() {
    const now = new Date();

    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
    );

    const startOfLastMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0),
    );

    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return +(((current - previous) / previous) * 100).toFixed(2);
    };

    // Published Projects
    const totalPublishedProjects = await this.projectModel.countDocuments({
      status: ProjectStatus.PUBLISHED,
      is_deleted: false,
    });

    const publishedThisMonth = await this.projectModel.countDocuments({
      status: ProjectStatus.PUBLISHED,
      is_deleted: false,
      createdAt: { $gte: startOfMonth },
    });

    const publishedLastMonth = await this.projectModel.countDocuments({
      status: ProjectStatus.PUBLISHED,
      is_deleted: false,
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
    });

    const publishedGrowth = calculateGrowth(
      publishedThisMonth,
      publishedLastMonth,
    );

    // Completed Projects
    const totalCompletedProjects = await this.projectModel.countDocuments({
      status: ProjectStatus.COMPLETED,
      is_deleted: false,
    });

    const completedThisMonth = await this.projectModel.countDocuments({
      status: ProjectStatus.COMPLETED,
      is_deleted: false,
      updatedAt: { $gte: startOfMonth },
    });

    const completedLastMonth = await this.projectModel.countDocuments({
      status: ProjectStatus.COMPLETED,
      is_deleted: false,
      updatedAt: { $gte: startOfLastMonth, $lt: startOfMonth },
    });

    const completedGrowth = calculateGrowth(
      completedThisMonth,
      completedLastMonth,
    );

    // Active Customers
    const totalActiveCustomers = await this.userModel.countDocuments({
      role: Role.CUSTOMER,
      is_active: true,
    });

    const activeCustomersThisMonth = await this.userModel.countDocuments({
      role: Role.CUSTOMER,
      is_active: true,
      createdAt: { $gte: startOfMonth },
    });

    const activeCustomersLastMonth = await this.userModel.countDocuments({
      role: Role.CUSTOMER,
      is_active: true,
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
    });

    const activeCustomerGrowth = calculateGrowth(
      activeCustomersThisMonth,
      activeCustomersLastMonth,
    );

    // Active Businesses
    const totalActiveBusinesses = await this.userModel.countDocuments({
      role: Role.BUSINESS,
      is_active: true,
    });

    const activeBusinessThisMonth = await this.userModel.countDocuments({
      role: Role.BUSINESS,
      is_active: true,
      createdAt: { $gte: startOfMonth },
    });

    const activeBusinessLastMonth = await this.userModel.countDocuments({
      role: Role.BUSINESS,
      is_active: true,
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
    });

    const activeBusinessGrowth = calculateGrowth(
      activeBusinessThisMonth,
      activeBusinessLastMonth,
    );

    //Total Offers sent
    const totalOffersSent = await this.offerModel.countDocuments({});

    const offersSentThisMonth = await this.offerModel.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    const offersSentLastMonth = await this.offerModel.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
    });

    const offersGrowth = calculateGrowth(
      offersSentThisMonth,
      offersSentLastMonth,
    );

    const result = {
      totalProjectsPublished: {
        value: totalPublishedProjects, // ALL TIME
        growth: publishedGrowth, // THIS MONTH vs LAST MONTH
        trend: publishedGrowth >= 0 ? 'up' : 'down',
      },

      totalProjectsCompleted: {
        value: totalCompletedProjects, // ALL TIME
        growth: completedGrowth, // THIS MONTH vs LAST MONTH
        trend: completedGrowth >= 0 ? 'up' : 'down',
      },

      activeCustomers: {
        value: totalActiveCustomers, // ALL TIME
        growth: activeCustomerGrowth, // THIS MONTH vs LAST MONTH
        trend: activeCustomerGrowth >= 0 ? 'up' : 'down',
      },

      activeBusinesses: {
        value: totalActiveBusinesses, // ALL TIME
        growth: activeBusinessGrowth, // THIS MONTH vs LAST MONTH
        trend: activeBusinessGrowth >= 0 ? 'up' : 'down',
      },

      offerSent: {
        value: totalOffersSent, // ALL TIME
        growth: offersGrowth, // THIS MONTH vs LAST MONTH
        trend: offersGrowth >= 0 ? 'up' : 'down',
      },
    };

    Logger.log(`Top Level Stats ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      result,
    );
  }

  async getTopBusinesses(dto: ListOfDataDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortKey = 'completedJobs',
      sortValue = 'desc',
    } = dto;

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

    if (search) {
      pipeline.push({
        $match: {
          business_name: { $regex: search, $options: 'i' },
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'project',
          localField: '_id',
          foreignField: 'business_id',
          pipeline: [
            {
              $match: {
                status: ProjectStatus.COMPLETED,
                is_deleted: false,
              },
            },
          ],
          as: 'completedProjects',
        },
      },
      {
        $lookup: {
          from: 'offer',
          localField: '_id',
          foreignField: 'business_id',
          as: 'offersSent',
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
      {
        $addFields: {
          completedJobs: { $size: '$completedProjects' },
          offerSent: { $size: '$offersSent' },
          averageRating: {
            $cond: [
              { $gt: [{ $size: '$reviews' }, 0] },
              { $avg: '$reviews.rating' },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          sortValue: {
            $cond: [
              { $eq: [{ $type: `$${sortKey}` }, 'string'] },
              { $toLower: `$${sortKey}` },
              `$${sortKey}`,
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
                business_name: 1,
                completedJobs: 1,
                offerSent: 1,
                averageRating: { $round: ['$averageRating', 1] },
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    );

    const [result] = await this.userModel.aggregate(pipeline);

    const paginatedResults = result?.paginatedResults ?? [];
    const totalItems =
      result?.totalCount?.length > 0 ? result.totalCount[0].count : 0;

    Logger.log(`Top Businesses ${Messages.GET_SUCCESS}`);
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
}
