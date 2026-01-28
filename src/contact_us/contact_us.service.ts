import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { CreateContactUsDto } from './dto/contact-us.dto';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import { ResponseData } from 'src/libs/utils/constant/enum';
import { Messages, MessagesKey } from 'src/libs/utils/constant/messages';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { ContactUs, ContactUsDocument } from 'src/schema/contact-us.schema';

@Injectable()
export class ContactUsService {
  constructor(
    @InjectModel(ContactUs.name)
    private readonly contactUsModel: Model<ContactUsDocument>,
  ) {}

  async createContactUs(dto: CreateContactUsDto) {
    await this.contactUsModel.create({ ...dto });

    Logger.log(`Contact Us ${Messages.CREATE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.CREATED,
      ResponseData.SUCCESS,
      MessagesKey.CONTACT_US_CREATED_SUCCESS,
      `Contact Us ${Messages.CREATE_SUCCESS}`,
    );
  }

  async viewContactUs(contactId: string) {
    const contactData = await this.contactUsModel.findOne({
      _id: contactId,
    });

    if (!contactData) {
      Logger.error(`Contact Us ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.CONTACT_US_NOT_FOUND,
        `Contact Us ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Contact Us ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      contactData,
    );
  }

  async listOfContactUs(dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const start = (pageNumber - 1) * pageLimit;

    const pipeline: PipelineStage[] = [];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { full_name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone_number: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }
    pipeline.push({
      $addFields: {
        sortValue: {
          $cond: [
            { $eq: [{ $type: `$${sortKey}` }, 'string'] },
            { $toLower: `$${sortKey}` },
            `$${sortKey}`,
          ],
        },
      },
    });

    pipeline.push({
      $facet: {
        paginatedResults: [
          { $sort: { sortValue: sortOrder } },
          { $skip: start },
          { $limit: pageLimit },
          {
            $project: {
              _id: 1,
              full_name: 1,
              email: 1,
              phone_number: 1,
              message: 1,
              is_contacted: 1,
              createdAt: 1,
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
      },
    });

    const [result] = await this.contactUsModel.aggregate(pipeline);

    const { paginatedResults, totalCount } = result;
    const totalItems = totalCount?.length > 0 ? totalCount[0].count : 0;

    Logger.log(`Contact ${Messages.GET_SUCCESS}`);
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
