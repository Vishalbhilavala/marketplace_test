import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Faq, FaqDocument } from 'src/schema/faq.schema';
import { Model, PipelineStage } from 'mongoose';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { Messages, MessagesKey } from 'src/libs/utils/constant/messages';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import { ResponseData } from 'src/libs/utils/constant/enum';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { buildExactRegex } from 'src/libs/utils/constant/common-function';

@Injectable()
export class FaqService {
  constructor(
    @InjectModel(Faq.name) private readonly faqModel: Model<FaqDocument>,
  ) {}

  async findFaq(faqId: string) {
    const faqData = await this.faqModel.findOne({
      _id: faqId,
      is_deleted: false,
    });

    if (!faqData) {
      Logger.error(`FAQ ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.FAQ_NOT_FOUND,
        `FAQ ${Messages.NOT_FOUND}`,
      );
    }

    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      faqData,
    );
  }

  async createFaq(dto: CreateFaqDto) {
    const { question } = dto;

    const findQuestion = await this.faqModel.findOne({
      is_deleted: false,
      question: buildExactRegex(question),
    });

    if (findQuestion) {
      Logger.error(`Question ${Messages.ALREADY_EXIST}`);
      return HandleResponse(
        HttpStatus.CONFLICT,
        ResponseData.ERROR,
        MessagesKey.FAQ_ALREADY_EXIST,
        `Question ${Messages.ALREADY_EXIST}`,
      );
    }

    await this.faqModel.create({
      ...dto,
    });

    Logger.log(`FAQ ${Messages.CREATE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.CREATED,
      ResponseData.SUCCESS,
      MessagesKey.FAQ_CREATED_SUCCESS,
      `FAQ ${Messages.CREATE_SUCCESS}`,
    );
  }

  async viewFaq(faqId: string) {
    const faqData = await this.findFaq(faqId);

    if (faqData.status !== ResponseData.ERROR) {
      Logger.log(`FAQ ${Messages.GET_SUCCESS}`);
    }

    return faqData;
  }

  async listOfFaq(dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;

    const sortOrder = sortValue === 'asc' ? 1 : -1;

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
            { question: { $regex: search, $options: 'i' } },
            { answer: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({
      $sort: {
        [sortKey || 'createdAt']: sortOrder,
      },
    });

    pipeline.push({
      $project: {
        _id: 1,
        question: 1,
        answer: 1,
        createdAt: 1,
      },
    });

    const start = (pageNumber - 1) * pageLimit;

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

    const [result] = await this.faqModel.aggregate(pipeline);
    const { paginatedResults, totalCount } = result;
    const totalItems = totalCount?.length > 0 ? totalCount[0].count : 0;

    Logger.log(`FAQ's ${Messages.GET_SUCCESS}`);
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

  async deleteFaq(faqId: string) {
    const faqData = await this.faqModel.findOneAndUpdate(
      { _id: faqId, is_deleted: false },
      { is_deleted: true },
    );

    if (!faqData) {
      Logger.error(`FAQ ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.FAQ_NOT_FOUND,
        `FAQ ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`FAQ ${Messages.DELETE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      MessagesKey.FAQ_DELETED_SUCCESS,
      `FAQ ${Messages.DELETE_SUCCESS}`,
    );
  }

  async updateFaq(dto: UpdateFaqDto) {
    const { faqId, question, ...faqDetails } = dto;

    if (question) {
      const duplicateQuestion = await this.faqModel.findOne({
        _id: { $ne: faqId },
        is_deleted: false,
        question: buildExactRegex(question),
      });

      if (duplicateQuestion) {
        Logger.error(`Question ${Messages.ALREADY_EXIST}`);
        return HandleResponse(
          HttpStatus.CONFLICT,
          ResponseData.ERROR,
          MessagesKey.FAQ_ALREADY_EXIST,
          `Question ${Messages.ALREADY_EXIST}`,
        );
      }
    }

    const updatedFaq = await this.faqModel.findOneAndUpdate(
      { _id: faqId, is_deleted: false },
      { $set: { question, ...faqDetails } },
      { new: true },
    );

    if (!updatedFaq) {
      Logger.error(`FAQ ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.FAQ_NOT_FOUND,
        `FAQ ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`FAQ ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.FAQ_UPDATED_SUCCESS,
      `FAQ ${Messages.UPDATED_SUCCESS}`,
    );
  }
}
