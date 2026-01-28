import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Category, CategoryDocument } from 'src/schema/category.schema';
import {
  AddCategoryDto,
  AddTypeOfWorkDto,
  CreateProfessionDto,
  UpdateCategoryDto,
  UpdateProfessionDto,
  UpdateTypeOfWorkDto,
} from './dto/category.dto';
import { ResponseData } from 'src/libs/utils/constant/enum';
import { Messages, MessagesKey } from 'src/libs/utils/constant/messages';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import {
  CategoryTemplate,
  CategoryTemplateDocument,
} from 'src/schema/category-template.schema';
import { Project, ProjectDocument } from 'src/schema/project.schema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(CategoryTemplate.name)
    private readonly categoryTemplateModel: Model<CategoryTemplateDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async addProfession(dto: CreateProfessionDto) {
    const { profession_name, ...professionDetails } = dto;

    const findProfession = await this.categoryModel.findOne({
      profession_name: profession_name,
      is_deleted: false,
    });

    if (findProfession) {
      Logger.error(
        `Profession name ${Messages.ALREADY_EXIST} Please choose another name.`,
      );
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.PROFESSION_ALREADY_EXIST,
        `Profession name ${Messages.ALREADY_EXIST} Please choose another name.`,
      );
    }

    await this.categoryModel.create({
      profession_name,
      ...professionDetails,
    });

    Logger.log(`Profession ${Messages.CREATE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.CREATED,
      ResponseData.SUCCESS,
      MessagesKey.PROFESSION_CREATED_SUCCESS,
      `Profession ${Messages.CREATE_SUCCESS}`,
    );
  }

  async addCategory(dto: AddCategoryDto) {
    const { professionId, categoryTypeId, name, ...rest } = dto;

    const findProfession = await this.categoryModel.findOne({
      _id: professionId,
      is_deleted: false,
    });

    if (!findProfession) {
      Logger.error(`Profession ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.PROFESSION_NOT_FOUND,
        `Profession ${Messages.NOT_FOUND}`,
      );
    }

    const findCategory = await this.categoryModel.findOne({
      'category.name': { $regex: new RegExp(`^${name}$`, 'i') },
    });

    if (findCategory) {
      Logger.error(
        `Service name ${Messages.ALREADY_EXIST} Please choose another name.`,
      );
      return HandleResponse(
        HttpStatus.CONFLICT,
        ResponseData.ERROR,
        MessagesKey.CATEGORY_ALREADY_EXIST,
        `Service name ${Messages.ALREADY_EXIST} Please choose another name.`,
      );
    }

    const categoryPayload = {
      name,
      categoryType_id: new Types.ObjectId(categoryTypeId),
      is_deleted: false,
      ...rest,
    };

    await this.categoryModel.updateOne(
      { _id: professionId },
      {
        $push: {
          category: categoryPayload,
        },
      },
    );

    Logger.log(`Service ${Messages.CREATE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.CREATED,
      ResponseData.SUCCESS,
      MessagesKey.CATEGORY_CREATED_SUCCESS,
      `Service ${Messages.CREATE_SUCCESS}`,
    );
  }

  async addTypeOfWork(dto: AddTypeOfWorkDto) {
    const { categoryId, name } = dto;

    const duplicateTypeOfWork = await this.categoryModel.findOne({
      category: {
        $elemMatch: {
          is_deleted: false,
          type_of_work: {
            $elemMatch: {
              name: { $regex: `^${name}$`, $options: 'i' },
            },
          },
        },
      },
    });

    if (duplicateTypeOfWork) {
      Logger.error(
        `Type of work ${Messages.ALREADY_EXIST} Please choose another name.`,
      );
      return HandleResponse(
        HttpStatus.CONFLICT,
        ResponseData.ERROR,
        MessagesKey.TYPE_OF_WORK_ALREADY_EXIST,
        `Type of work ${Messages.ALREADY_EXIST} Please choose another name.`,
      );
    }

    const findCategory = await this.categoryModel.findOneAndUpdate(
      {
        'category._id': categoryId,
        'category.is_deleted': false,
      },
      {
        $addToSet: {
          'category.$.type_of_work': dto,
        },
      },
    );

    if (!findCategory) {
      Logger.error(`Service ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.CATEGORY_NOT_FOUND,
        `Service ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Type Of Work ${Messages.ADD_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.TYPE_OF_WORK_ADD_SUCCESS,
      `Type Of Work ${Messages.ADD_SUCCESS}`,
    );
  }

  async viewProfession(professionId: string) {
    const professionData = await this.categoryModel.findOne({
      _id: professionId,
      is_deleted: false,
    });

    if (!professionData) {
      Logger.error(`Profession ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.PROFESSION_NOT_FOUND,
        `Profession ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Profession ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      professionData,
    );
  }

  async viewCategory(professionId: string, categoryId: string) {
    const findCategory = await this.categoryModel.findOne(
      {
        _id: professionId,
        is_deleted: false,
        'category._id': categoryId,
        'category.is_deleted': false,
      },
      { 'category.$': 1, profession_name: 1 },
    );

    if (!findCategory || !findCategory.category?.length) {
      Logger.error(`Service ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.CATEGORY_NOT_FOUND,
        `Service ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Category ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      findCategory,
    );
  }

  async listOfProfessions(dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const sortField = sortKey || 'createdAt';
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
          $or: [
            { profession_name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
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
            { $sort: { sortValue: sortOrder } },
            { $skip: start },
            { $limit: pageLimit },
            {
              $project: {
                _id: 1,
                profession_name: 1,
                description: 1,
                source: 1,
                createdAt: 1,
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    );

    const [result] = await this.categoryModel.aggregate(pipeline);
    const { paginatedResults, totalCount } = result;
    const totalItems = totalCount?.length > 0 ? totalCount[0].count : 0;

    Logger.log(`Professions ${Messages.GET_SUCCESS}`);
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

  async listOfCategory(dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const start = (pageNumber - 1) * pageLimit;
    const sortOrder = sortValue === 'asc' ? 1 : -1;

    let sortField = 'category.name';

    if (sortKey === 'type_of_work') {
      sortField = 'type_of_work_sort';
    } else if (sortKey) {
      sortField = `category.${sortKey}`;
    }

    const pipeline: PipelineStage[] = [];

    pipeline.push(
      {
        $match: { is_deleted: false },
      },
      {
        $unwind: '$category',
      },
      {
        $match: { 'category.is_deleted': false },
      },
    );

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'category.name': { $regex: search, $options: 'i' } },
            {
              'category.type_of_work': {
                $elemMatch: {
                  name: { $regex: search, $options: 'i' },
                },
              },
            },
          ],
        },
      });
    }

    pipeline.push(
      {
        $addFields: {
          type_of_work_sort: {
            $toLower: {
              $ifNull: [
                { $arrayElemAt: ['$category.type_of_work.name', 0] },
                '',
              ],
            },
          },
        },
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
        $facet: {
          paginatedResults: [
            { $sort: { sortValue: sortOrder } },
            { $skip: start },
            { $limit: pageLimit },
            {
              $project: {
                _id: '$category._id',
                category_template_id: '$category.categoryType_id',
                name: '$category.name',
                category_image: '$category.category_image',
                category_icon: '$category.category_icon',
                meta_title: '$category.meta_title',
                meta_description: '$category.meta_description',
                meta_keywords: '$category.meta_keywords',
                type_of_work: '$category.type_of_work',
                createdAt: '$category.createdAt',
                parent_profession_id: '$_id',
                parent_profession_name: '$profession_name',
                parent_profession_description: '$description',
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    );

    const [result] = await this.categoryModel.aggregate(pipeline);
    const { paginatedResults, totalCount } = result;
    const totalItems = totalCount?.length > 0 ? totalCount[0].count : 0;

    Logger.log(`Categories ${Messages.GET_SUCCESS}`);
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

  async deleteProfession(professionId: string) {
    const profession = await this.categoryModel.findOne({
      _id: professionId,
      is_deleted: false,
    });

    if (!profession) {
      Logger.error(`Profession ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.PROFESSION_NOT_FOUND,
        `Profession ${Messages.NOT_FOUND}`,
      );
    }

    if (profession.category && profession.category.length > 0) {
      Logger.error(Messages.PROFESSION_NOT_DELETED);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.PROFESSION_NOT_DELETED,
        Messages.PROFESSION_NOT_DELETED,
      );
    }

    await this.categoryModel.updateOne(
      { _id: professionId },
      { $set: { is_deleted: true } },
    );

    Logger.log(`Profession ${Messages.DELETE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.PROFESSION_DELETED_SUCCESS,
      `Profession ${Messages.DELETE_SUCCESS}`,
    );
  }

  async deleteCategory(professionId: string, categoryId: string) {
    const isServiceUsed = await this.projectModel.exists({
      'category.category_id': new Types.ObjectId(categoryId),
      is_deleted: false,
    });

    if (isServiceUsed) {
      Logger.error(Messages.CATEGORY_NOT_DELETED);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.CATEGORY_NOT_DELETED,
        Messages.CATEGORY_NOT_DELETED,
      );
    }

    const updatedCategory = await this.categoryModel.findOneAndUpdate(
      {
        _id: professionId,
        is_deleted: false,
        'category._id': categoryId,
        'category.is_deleted': false,
      },
      {
        $set: { 'category.$.is_deleted': true },
      },
      { new: true },
    );

    if (!updatedCategory) {
      Logger.error(`Service ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.CATEGORY_NOT_FOUND,
        `Service ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Service ${Messages.DELETE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.CATEGORY_DELETED_SUCCESS,
      `Service ${Messages.DELETE_SUCCESS}`,
    );
  }

  async deleteTypeOfWork(categoryId: string, typeOfWorkId: string) {
    const updated = await this.categoryModel.findOneAndUpdate(
      {
        'category._id': categoryId,
        'category.is_deleted': false,
      },
      {
        $pull: {
          'category.$.type_of_work': { _id: typeOfWorkId },
        },
      },
      { new: true },
    );

    if (!updated) {
      Logger.log(`Type Of Work ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.TYPE_OF_WORK_NOT_FOUND,
        `Type Of Work ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Type Of Work ${Messages.DELETE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.TYPE_OF_WORK_DELETED_SUCCESS,
      `Type Of Work ${Messages.DELETE_SUCCESS}`,
    );
  }

  async updateProfession(dto: UpdateProfessionDto) {
    const { professionId, profession_name, ...categoryDetails } = dto;

    if (profession_name) {
      const findProfession = await this.categoryModel.findOne({
        _id: { $ne: professionId },
        profession_name: { $regex: `^${profession_name}$`, $options: 'i' },
        is_deleted: false,
      });

      if (findProfession) {
        Logger.error(
          `Profession name ${Messages.ALREADY_EXIST} Please choose another name.`,
        );
        return HandleResponse(
          HttpStatus.BAD_REQUEST,
          ResponseData.ERROR,
          MessagesKey.PROFESSION_ALREADY_EXIST,
          `Profession name ${Messages.ALREADY_EXIST} Please choose another name.`,
        );
      }
    }

    const updatedCategory = await this.categoryModel.findByIdAndUpdate(
      professionId,
      { $set: { ...categoryDetails, profession_name } },
      { new: true },
    );

    if (!updatedCategory) {
      Logger.error(`Profession ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.PROFESSION_NOT_FOUND,
        `Profession ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Profession ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.PROFESSION_UPDATED_SUCCESS,
      `Profession ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async updateCategory(dto: UpdateCategoryDto) {
    const {
      professionId,
      categoryId,
      name,
      category_image,
      category_icon,
      meta_title,
      meta_description,
      meta_keywords,
      categoryTypeId,
      section1,
      section2,
      section3,
      section4,
      section5,
    } = dto;

    if (name) {
      const findCategory = await this.categoryModel.findOne({
        is_deleted: false,
        category: {
          $elemMatch: {
            _id: { $ne: categoryId },
            name: { $regex: `^${name}$`, $options: 'i' },
            is_deleted: false,
          },
        },
      });

      if (findCategory) {
        Logger.error(
          `Service name ${Messages.ALREADY_EXIST} Please choose another name.`,
        );
        return HandleResponse(
          HttpStatus.BAD_REQUEST,
          ResponseData.ERROR,
          MessagesKey.CATEGORY_ALREADY_EXIST,
          `Service name ${Messages.ALREADY_EXIST} Please choose another name.`,
        );
      }
    }

    const updated = await this.categoryModel.findOneAndUpdate(
      {
        _id: professionId,
        is_deleted: false,
        'category._id': categoryId,
        'category.is_deleted': false,
      },
      {
        $set: {
          'category.$.name': name,
          'category.$.category_image': category_image,
          'category.$.category_icon': category_icon,
          'category.$.meta_title': meta_title,
          'category.$.meta_description': meta_description,
          'category.$.meta_keywords': meta_keywords,
          'category.$.categoryType_id': categoryTypeId,
          'category.$.section1': section1,
          'category.$.section2': section2,
          'category.$.section3': section3,
          'category.$.section4': section4,
          'category.$.section5': section5,
        },
      },
      { new: true },
    );

    if (!updated) {
      Logger.error(`Service ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.CATEGORY_NOT_FOUND,
        `Service ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Service ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.CATEGORY_UPDATED_SUCCESS,
      `Service ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async updateTypeOfWork(dto: UpdateTypeOfWorkDto) {
    const { categoryId, typeOfWorkId, name } = dto;

    const duplicateTypeOfWork = await this.categoryModel.findOne({
      category: {
        $elemMatch: {
          is_deleted: false,
          type_of_work: {
            $elemMatch: {
              name: { $regex: `^${name}$`, $options: 'i' },
            },
          },
        },
      },
    });

    if (duplicateTypeOfWork) {
      Logger.error(
        `Type of work ${Messages.ALREADY_EXIST} Please choose another name.`,
      );
      return HandleResponse(
        HttpStatus.CONFLICT,
        ResponseData.ERROR,
        MessagesKey.TYPE_OF_WORK_ALREADY_EXIST,
        `Type of work ${Messages.ALREADY_EXIST} Please choose another name.`,
      );
    }

    const updated = await this.categoryModel.findOneAndUpdate(
      {
        'category._id': categoryId,
        'category.is_deleted': false,
      },
      {
        $set: {
          'category.$[cat].type_of_work.$[work].name': name,
        },
      },
      {
        arrayFilters: [{ 'cat._id': categoryId }, { 'work._id': typeOfWorkId }],
        new: true,
      },
    );

    if (!updated) {
      Logger.error(`Type Of Work ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.TYPE_OF_WORK_NOT_FOUND,
        `Type Of Work ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Type Of Work ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.TYPE_OF_WORK_UPDATED_SUCCESS,
      `Type Of Work ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async listOfTemplate(dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const start = (pageNumber - 1) * pageLimit;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const sortField = sortKey || 'createdAt';

    const pipeline: PipelineStage[] = [];

    if (search) {
      pipeline.push({
        $match: {
          template_name: { $regex: search, $options: 'i' },
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
            { $sort: { sortValue: sortOrder } },
            { $skip: start },
            { $limit: pageLimit },
            {
              $project: {
                _id: 1,
                template_name: 1,
                field: 1,
                createdAt: 1,
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    );

    const [result] = await this.categoryTemplateModel.aggregate(pipeline);
    const { paginatedResults, totalCount } = result;
    const totalItems = totalCount?.length > 0 ? totalCount[0].count : 0;

    Logger.log(`Templates ${Messages.GET_SUCCESS}`);
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

  async viewTemplate(templateId: string) {
    const templateData = await this.categoryTemplateModel.findOne({
      _id: templateId,
    });

    if (!templateData) {
      Logger.error(`Template ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.TEMPLATE_NOT_FOUND,
        `Template ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Template ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      templateData,
    );
  }
}
