import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CountyDto, EditCountyDto } from './dto/county.dto';
import { InjectModel } from '@nestjs/mongoose';
import { County } from 'src/schema/county.schema';
import { Model, PipelineStage, Types } from 'mongoose';
import { Messages, MessagesKey } from 'src/libs/utils/constant/messages';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import { ResponseData } from 'src/libs/utils/constant/enum';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { Municipality } from 'src/schema/municipality.schema';
import { ProffCounty } from 'src/schema/proff-county.schema';
import { User } from 'src/schema/user.schema';

@Injectable()
export class CountyService {
  constructor(
    @InjectModel(County.name) private readonly countyModel: Model<County>,
    @InjectModel(Municipality.name)
    private readonly municipalityModel: Model<Municipality>,
    @InjectModel(ProffCounty.name)
    private readonly proffCountyModel: Model<ProffCounty>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async addCounty(dto: CountyDto) {
    const { name, municipalities } = dto;
    const countyName = name.trim();

    const findCounty = await this.countyModel.findOne({
      $expr: {
        $eq: [
          { $toLower: { $trim: { input: '$name' } } },
          countyName.toLowerCase(),
        ],
      },
      is_deleted: false,
    });

    if (findCounty) {
      Logger.error(`County ${Messages.ALREADY_EXIST}`);
      return HandleResponse(
        HttpStatus.CONFLICT,
        ResponseData.ERROR,
        MessagesKey.COUNTY_ALREADY_EXIST,
        `County ${Messages.ALREADY_EXIST}`,
      );
    }

    const county = await this.countyModel.create({
      name: countyName,
    });

    if (municipalities?.length) {
      const municipalityData = await Promise.all(
        municipalities.map(async (m) => {
          const municipalityName = m.name.trim();
          const proffCounty = await this.proffCountyModel.findOne({
            'municipalities.name': municipalityName,
          });

          return {
            name: municipalityName,
            county_id: county._id,
            direction: proffCounty?.direction || '',
            villages: m.villages ?? [],
          };
        }),
      );

      await this.municipalityModel.insertMany(municipalityData);
    }

    Logger.log(`County ${Messages.CREATE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.CREATED,
      ResponseData.SUCCESS,
      MessagesKey.COUNTY_CREATED_SUCCESS,
      `County ${Messages.CREATE_SUCCESS}`,
    );
  }

  async listOfCounty(dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey = 'name', sortValue } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const start = (pageNumber - 1) * pageLimit;

    const pipeline: PipelineStage[] = [];

    pipeline.push(
      {
        $match: { is_deleted: false },
      },
      {
        $lookup: {
          from: 'municipality',
          localField: '_id',
          foreignField: 'county_id',
          as: 'municipalities',
          pipeline: [
            { $match: { is_deleted: false } },
            { $project: { name: 1 } },
          ],
        },
      },
    );

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { 'municipalities.name': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
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
                name: 1,
                municipalities: {
                  $map: {
                    input: '$municipalities',
                    as: 'm',
                    in: '$$m.name',
                  },
                },
                createdAt: 1,
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    );

    const [result] = await this.countyModel.aggregate(pipeline);

    const paginatedResults = result?.paginatedResults ?? [];
    const totalItems = result?.totalCount?.[0]?.count ?? 0;

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

  async viewCounty(countyId: string) {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          _id: new Types.ObjectId(countyId),
          is_deleted: false,
        },
      },
      {
        $lookup: {
          from: 'municipality',
          localField: '_id',
          foreignField: 'county_id',
          as: 'municipalities',
          pipeline: [
            { $match: { is_deleted: false } },
            {
              $project: {
                _id: 1,
                name: 1,
                villages: 1,
              },
            },
          ],
        },
      },
    ];

    const [countyData] = await this.countyModel.aggregate(pipeline);

    if (!countyData) {
      Logger.error(`County ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.COUNTY_NOT_FOUND,
        `County ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`County ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      countyData,
    );
  }

  async updateCounty(dto: EditCountyDto) {
    const { id, name, municipalities, deleted_municipalities } = dto;

    const county = await this.countyModel.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!county) {
      Logger.error(`County ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.COUNTY_NOT_FOUND,
        `County ${Messages.NOT_FOUND}`,
      );
    }

    if (name) {
      await this.countyModel.updateOne(
        { _id: id, is_deleted: false },
        { $set: { name } },
      );
    }

    if (municipalities?.length) {
      for (const municipality of municipalities) {
        if (municipality.id) {
          await this.municipalityModel.updateOne(
            {
              _id: municipality.id,
              county_id: county._id,
              is_deleted: false,
            },
            {
              $set: {
                name: municipality.name,
                villages: municipality.villages ?? [],
              },
            },
          );
          continue;
        }

        const proffCounty = await this.proffCountyModel.findOne({
          'municipalities.name': municipality.name,
        });

        const newMunicipality = await this.municipalityModel.create({
          name: municipality.name,
          county_id: county._id,
          direction: proffCounty?.direction || '',
          villages: municipality.villages ?? [],
          is_deleted: false,
        });
        await this.userModel.updateMany(
          {
            'county.county_id': county._id,
          },
          {
            $push: {
              'county.$[countyElem].municipalities': {
                municipality_id: newMunicipality._id,
                is_active: true,
              },
            },
          },
          {
            arrayFilters: [{ 'countyElem.county_id': county._id }],
          },
        );
      }
    }

    if (deleted_municipalities?.length) {
      await this.municipalityDeletions(county._id, deleted_municipalities);
    }

    Logger.log(`County ${Messages.UPDATED_SUCCESS}`);

    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      MessagesKey.COUNTY_UPDATED_SUCCESS,
      `County ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async municipalityDeletions(
    countyId: Types.ObjectId,
    deletedMunicipalities: {
      municipality_id: string;
      village_ids?: string[];
    }[],
  ) {
    for (const item of deletedMunicipalities) {
      const municipalityId = new Types.ObjectId(item.municipality_id);

      if (item.village_ids?.length) {
        await this.municipalityModel.updateOne(
          {
            _id: municipalityId,
            county_id: countyId,
            is_deleted: false,
          },
          {
            $pull: {
              villages: {
                _id: {
                  $in: item.village_ids.map((id) => new Types.ObjectId(id)),
                },
              },
            },
          },
        );
        continue;
      }

      await this.userModel.updateMany(
        {
          'county.municipalities.municipality_id': municipalityId,
        },
        {
          $pull: {
            'county.$[].municipalities': {
              municipality_id: municipalityId,
            },
          },
        },
      );

      await this.municipalityModel.deleteOne({
        _id: municipalityId,
        county_id: countyId,
      });
    }
  }

  async deleteCounty(countyId: string) {
    const findCounty = await this.countyModel.findOne({
      _id: countyId,
      is_deleted: false,
    });

    if (!findCounty) {
      Logger.error(`County ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.COUNTY_NOT_FOUND,
        `County ${Messages.NOT_FOUND}`,
      );
    }

    await this.countyModel.updateOne(
      { _id: new Types.ObjectId(countyId), is_deleted: false },
      { is_deleted: true },
    );

    await this.userModel.updateMany(
      {
        'county.county_id': countyId,
      },
      {
        $pull: {
          county: {
            county_id: countyId,
          },
        },
      },
    );

    await this.municipalityModel.deleteMany({
      county_id: new Types.ObjectId(countyId),
    });

    Logger.log(`County ${Messages.DELETE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.COUNTY_DELETED_SUCCESS,
      `County ${Messages.DELETE_SUCCESS}`,
    );
  }
}
