import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AddHomePageDto, UpdateHomePageDto } from './dto/home-page.dto';
import { InjectModel } from '@nestjs/mongoose';
import { HomePage, HomePageDocument } from 'src/schema/home-page.schema';
import { Model, PipelineStage } from 'mongoose';
import { Messages, MessagesKey } from 'src/libs/utils/constant/messages';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import { ResponseData, Type } from 'src/libs/utils/constant/enum';
import { toReadableCase } from 'src/libs/utils/constant/common-function';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';

@Injectable()
export class HomePageService {
  constructor(
    @InjectModel(HomePage.name)
    private readonly homePageModel: Model<HomePageDocument>,
  ) {}

  async addHomePage(dto: AddHomePageDto) {
    const { type, title } = dto;

    const findData = await this.homePageModel.findOne({
      type,
      title: { $regex: `^${title}$`, $options: 'i' },
    });

    if (findData) {
      const messageKey =
        type === Type.DETAILS
          ? MessagesKey.DETAILS_ALREADY_EXIST
          : type === Type.INSPIRATION
            ? MessagesKey.INSPIRATION_ALREADY_EXIST
            : MessagesKey.CURRENT_AFFAIRS_ALREADY_EXIST;

      Logger.error(`${toReadableCase(type)} ${Messages.ALREADY_EXIST}`);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        messageKey,
        `${toReadableCase(type)} ${Messages.ALREADY_EXIST}`,
      );
    }

    await this.homePageModel.create({ ...dto });

    const messageKey =
      type === Type.DETAILS
        ? MessagesKey.DETAILS_CREATE_SUCCESS
        : type === Type.INSPIRATION
          ? MessagesKey.INSPIRATION_CREATE_SUCCESS
          : MessagesKey.CURRENT_AFFAIRS_CREATE_SUCCESS;

    Logger.log(`${toReadableCase(type)} ${Messages.CREATE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.CREATED,
      ResponseData.SUCCESS,
      messageKey,
      `${toReadableCase(type)} ${Messages.CREATE_SUCCESS}`,
    );
  }

  async viewHomePage(homePageId: string) {
    const homePageData = await this.homePageModel
      .findById(homePageId)
      .select('-__v -updatedAt');

    if (!homePageData) {
      Logger.error(`Home page ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.HOME_PAGE_NOT_FOUND,
        `Home page ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Home page ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      homePageData,
    );
  }

  async editHomePage(dto: UpdateHomePageDto) {
    const { homePageId, type, title } = dto;

    if (title) {
      const findDuplicate = await this.homePageModel.findOne({
        _id: { $ne: homePageId },
        type,
        title: { $regex: `^${title}$`, $options: 'i' },
      });

      if (findDuplicate) {
        const messageKey =
          type === Type.DETAILS
            ? MessagesKey.DETAILS_ALREADY_EXIST
            : type === Type.INSPIRATION
              ? MessagesKey.INSPIRATION_ALREADY_EXIST
              : MessagesKey.CURRENT_AFFAIRS_ALREADY_EXIST;

        Logger.error(`${toReadableCase(type)} ${Messages.ALREADY_EXIST}`);
        return HandleResponse(
          HttpStatus.CONFLICT,
          ResponseData.ERROR,
          messageKey,
          `${toReadableCase(type)} ${Messages.ALREADY_EXIST}`,
        );
      }
    }

    const findHomePage = await this.homePageModel.findOneAndUpdate(
      { _id: homePageId },
      { $set: dto },
      { new: true },
    );

    if (!findHomePage) {
      Logger.error(`${toReadableCase(type)} ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.NOT_FOUND,
        `${toReadableCase(type)} ${Messages.NOT_FOUND}`,
      );
    }

    const messageKey =
      type === Type.DETAILS
        ? MessagesKey.DETAILS_UPDATE_SUCCESS
        : type === Type.INSPIRATION
          ? MessagesKey.INSPIRATION_UPDATE_SUCCESS
          : MessagesKey.CURRENT_AFFAIRS_UPDATE_SUCCESS;

    Logger.log(`${toReadableCase(type)} ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      messageKey,
      `${toReadableCase(type)} ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async deleteHomePage(homePageId: string) {
    const deleteHomePage = await this.homePageModel.findOneAndDelete({
      _id: homePageId,
    });

    if (!deleteHomePage) {
      Logger.error(`Data ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.NOT_FOUND,
        `Data ${Messages.NOT_FOUND}`,
      );
    }

    let type = toReadableCase(deleteHomePage.type);

    const messageKey =
      deleteHomePage.type === Type.DETAILS
        ? MessagesKey.DETAILS_DELETE_SUCCESS
        : deleteHomePage.type === Type.INSPIRATION
          ? MessagesKey.INSPIRATION_DELETE_SUCCESS
          : MessagesKey.CURRENT_AFFAIRS_DELETE_SUCCESS;

    Logger.log(`${type} ${Messages.DELETE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      messageKey,
      `${type} ${Messages.DELETE_SUCCESS}`,
    );
  }

  async listOfHomePageDetails(dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue, type } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const sortOrder = sortValue === 'asc' ? 1 : -1;

    const pipeline: PipelineStage[] = [];

    if (type) {
      pipeline.push({
        $match: {
          type: type,
        },
      });
    }

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { createdAt: { $regex: search, $options: 'i' } },
            { image: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        image: 1,
        get_started_title: 1,
        get_started_description: 1,
        get_started_image: 1,
        details: 1,
        createdAt: 1,
      },
    });

    const start = (pageNumber - 1) * pageLimit;

    pipeline.push({
      $sort: { [sortKey || 'createdAt']: sortOrder },
    });

    pipeline.push({
      $facet: {
        paginatedResults: [
          { $skip: start },
          { $limit: pageLimit },
          { $sort: { [sortKey || 'createdAt']: sortOrder } },
        ],
        totalCount: [{ $count: 'count' }],
      },
    });

    const [result] = await this.homePageModel.aggregate(pipeline);

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
}
