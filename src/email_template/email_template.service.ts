import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  MailTemplate,
  MailTemplateDocument,
} from 'src/schema/email-template.schema';
import { Model, PipelineStage, Types } from 'mongoose';
import {
  CreateMailTemplateDto,
  UpdateMailTemplateDto,
} from './dto/email_template.dto';
import { Messages, MessagesKey } from 'src/libs/utils/constant/messages';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import { ResponseData } from 'src/libs/utils/constant/enum';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
@Injectable()
export class EmailTemplateService {
  constructor(
    @InjectModel(MailTemplate.name)
    private readonly emailTemplateModel: Model<MailTemplateDocument>,
  ) {}

  async findEmailTemplate(emailTemplateId: string) {
    const emailTemplateData = await this.emailTemplateModel.findOne({
      _id: emailTemplateId,
      is_deleted: false,
    });

    if (!emailTemplateData) {
      Logger.error(`Email Template ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.EMAIL_TEMPLATE_NOT_FOUND,
        `Email Template ${Messages.NOT_FOUND}`,
      );
    }

    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      emailTemplateData,
    );
  }

  async createEmailTemplate(dto: CreateMailTemplateDto) {
    const { notification_name } = dto;

    const emailTemplateData = await this.emailTemplateModel.findOne({
      notification_name,
      is_deleted: false,
    });

    if (emailTemplateData) {
      Logger.error(`Email Template ${Messages.ALREADY_EXIST}`);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.EMAIL_TEMPLATE_ALREADY_EXIST,
        `Email Template ${Messages.ALREADY_EXIST}`,
      );
    }

    await this.emailTemplateModel.create({
      ...dto,
    });

    Logger.log(`Email Template ${Messages.CREATE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.CREATED,
      ResponseData.SUCCESS,
      MessagesKey.EMAIL_TEMPLATE_CREATE_SUCCESS,
      `Email Template ${Messages.CREATE_SUCCESS}`,
    );
  }

  async viewEmailTemplate(emailTemplateId: string) {
    const result = await this.findEmailTemplate(emailTemplateId);

    if (result.status !== ResponseData.ERROR) {
      Logger.log(`Email Template ${Messages.GET_SUCCESS}`);
    }

    return result;
  }

  async updateEmailTemplate(dto: UpdateMailTemplateDto) {
    const { id, ...emailTemplateDetails } = dto;

    const updatedTemplate = await this.emailTemplateModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), is_deleted: false },
      { $set: emailTemplateDetails },
      { new: true },
    );

    if (!updatedTemplate) {
      Logger.error(`Email Template ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.EMAIL_TEMPLATE_NOT_FOUND,
        `Email Template ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Email Template ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.EMAIL_TEMPLATE_UPDATE_SUCCESS,
      `Email Template ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async listOfEmailTemplate(dto: ListOfDataDto) {
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
          $or: [{ notification_name: { $regex: search, $options: 'i' } }],
        },
      });
    }

    pipeline.push(
      {
        $project: {
          _id: 1,
          notification_name: 1,
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

    const [result] = await this.emailTemplateModel.aggregate(pipeline);
    const paginatedResults = result?.paginatedResults ?? [];
    const totalItems =
      result?.totalCount?.length > 0 ? result.totalCount[0].count : 0;

    Logger.log(`Email Template ${Messages.GET_SUCCESS}`);
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

  async deleteEmailTemplate(emailTemplateId: string) {
    const emailTemplateData = await this.emailTemplateModel.findOneAndUpdate(
      { _id: emailTemplateId, is_deleted: false },
      { is_deleted: true },
    );

    if (!emailTemplateData) {
      Logger.error(`Email Template ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.EMAIL_TEMPLATE_NOT_FOUND,
        `Email Template ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Email Template ${Messages.DELETE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      MessagesKey.EMAIL_TEMPLATE_DELETE_SUCCESS,
      `Email Template ${Messages.DELETE_SUCCESS}`,
    );
  }
}
