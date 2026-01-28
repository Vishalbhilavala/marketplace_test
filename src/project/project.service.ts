import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Project, ProjectDocument } from 'src/schema/project.schema';
import { Model, PipelineStage, Types } from 'mongoose';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectStatusDto,
} from './dto/project.dto';
import { Messages, MessagesKey } from 'src/libs/utils/constant/messages';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import {
  OfferStatus,
  ProjectStatus,
  ResponseData,
  Role,
} from 'src/libs/utils/constant/enum';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { User, UserDocument } from 'src/schema/user.schema';
import { IProject, UserRequest } from 'src/libs/utils/constant/interface';
import {
  generatePassword,
  getNextIdNumber,
  getTemplate,
} from 'src/libs/utils/constant/common-function';
import * as bcrypt from 'bcryptjs';
import {
  MailTemplate,
  MailTemplateDocument,
} from 'src/schema/email-template.schema';
import { EMAIL_TEMPLATE_TYPES } from 'src/libs/utils/constant/constant';
import { emailSend } from 'src/libs/helper/mail';
import * as Handlebars from 'handlebars';
import { Municipality } from 'src/schema/proff-county.schema';
import { MunicipalityDocument } from 'src/schema/municipality.schema';
import { Offer, OfferDocument } from 'src/schema/offer.schema';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(MailTemplate.name)
    private readonly emailTemplateModel: Model<MailTemplateDocument>,
    @InjectModel(Municipality.name)
    private readonly municipalityModel: Model<MunicipalityDocument>,
    @InjectModel(Offer.name)
    private readonly offerModel: Model<OfferDocument>,
  ) {}

  async createProject(dto: CreateProjectDto) {
    const {
      customer_id,
      source,
      full_name,
      email,
      phone_number,
      postal_code,
      category,
      ...projectDetails
    } = dto;

    let municipality_id: Types.ObjectId | null = null;
    let county_id: Types.ObjectId | null = null;

    if (postal_code) {
      const location = await this.municipalityModel.findOne(
        {
          villages: { $elemMatch: { postal_code } },
        },
        {
          _id: 1,
          county_id: 1,
        },
      );

      if (!location) {
        Logger.error(Messages.INVALID_POSTAL_CODE);
        return HandleResponse(
          HttpStatus.NOT_FOUND,
          ResponseData.ERROR,
          MessagesKey.INVALID_POSTAL_CODE,
          Messages.INVALID_POSTAL_CODE,
        );
      }

      municipality_id = location._id;
      county_id = location.county_id;
    }

    const lastProject = (await this.projectModel
      .findOne({ project_id: { $exists: true } })
      .sort({ createdAt: -1 })
      .select('project_id')
      .lean()) as { project_id?: string } | null;

    const project_id = getNextIdNumber(lastProject?.project_id ?? null);

    if (email && full_name && source === Role.CUSTOMER) {
      let findCustomer = await this.userModel.findOne({ email });

      if (findCustomer) {
        Logger.error(`Account ${Messages.ALREADY_EXIST}`);
        return HandleResponse(
          HttpStatus.NOT_FOUND,
          ResponseData.ERROR,
          MessagesKey.USER_ALREADY_EXIST,
          `Account ${Messages.ALREADY_EXIST}`,
        );
      }

      if (!findCustomer) {
        const password = generatePassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        findCustomer = await this.userModel.create({
          email,
          full_name,
          phone_number,
          password: hashedPassword,
          role: Role.CUSTOMER,
        });

        try {
          const templateName = EMAIL_TEMPLATE_TYPES.WELCOME_PASSWORD;
          const templateDoc = await getTemplate(
            this.emailTemplateModel,
            templateName,
          );

          if (!templateDoc) {
            Logger.log(`Email template ${Messages.NOT_FOUND}`);
            return HandleResponse(
              HttpStatus.NOT_FOUND,
              ResponseData.ERROR,
              MessagesKey.EMAIL_TEMPLATE_NOT_FOUND,
              `Email template ${Messages.NOT_FOUND}`,
            );
          }

          const cta_link = templateDoc.notification_variable[0].link;
          const subject = templateName;
          const dynamicVariables = {
            first_name: full_name,
            email,
            password,
            cta_link,
          };

          const template = Handlebars.compile(templateDoc.template);
          const htmlContent = template(dynamicVariables);

          emailSend(email, subject, htmlContent).catch((err) =>
            Logger.error('Mail send failed', err),
          );
        } catch (error) {
          Logger.error(`Error while sending mail: `, error);
          throw error;
        }
      }

      await this.projectModel.create({
        project_id,
        customer_id: findCustomer._id,
        source,
        postal_code,
        county_id,
        municipality_id,
        category: {
          category_id: category.categoryId,
          type_of_work_id: category.typeOfWorkId || null,
        },
        ...projectDetails,
      });

      Logger.log(`Account and Project ${Messages.CREATE_SUCCESS}`);
      return HandleResponse(
        HttpStatus.CREATED,
        ResponseData.SUCCESS,
        MessagesKey.PROJECT_CREATED_SUCCESS,
        `Project ${Messages.CREATE_SUCCESS}`,
      );
    }

    /* ====================================================== */
    /* EXISTING CUSTOMER FLOW */
    /* ====================================================== */

    const findCustomer = await this.userModel.findOne({
      _id: customer_id,
      is_active: true,
      role: Role.CUSTOMER,
    });

    if (!findCustomer) {
      Logger.error(`Customer ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.CUSTOMER_NOT_FOUND,
        `Customer ${Messages.NOT_FOUND}`,
      );
    }

    await this.projectModel.create({
      project_id,
      customer_id,
      source,
      postal_code,
      county_id,
      municipality_id,
      category: {
        category_id: category.categoryId,
        type_of_work_id: category.typeOfWorkId || null,
      },
      ...projectDetails,
    });

    Logger.log(`Project ${Messages.CREATE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.CREATED,
      ResponseData.SUCCESS,
      MessagesKey.PROJECT_CREATED_SUCCESS,
      `Project ${Messages.CREATE_SUCCESS}`,
    );
  }

  async viewProject(req: UserRequest, projectId: string) {
    const businessObjectId =
      req.user.role === Role.BUSINESS ? new Types.ObjectId(req.user.id) : null;
    const [projectData] = await this.projectModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(projectId),
          is_deleted: false,
        },
      },
      {
        $lookup: {
          from: 'user',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customerInfo',
        },
      },
      { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true } },

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
          as: 'village_info',
        },
      },
      {
        $addFields: {
          village_name: {
            $arrayElemAt: ['$village_info.village_name', 0],
          },
        },
      },

      {
        $lookup: {
          from: 'offer',
          let: {
            projectId: '$_id',
            businessId: businessObjectId,
            role: req.user.role,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $cond: {
                    if: { $eq: ['$$role', Role.BUSINESS] },
                    then: {
                      $and: [
                        { $eq: ['$project_id', '$$projectId'] },
                        { $eq: ['$business_id', '$$businessId'] },
                      ],
                    },
                    else: false,
                  },
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'offer_info',
        },
      },

      {
        $project: {
          _id: 1,
          project_id: 1,
          title: 1,
          description: 1,
          address: 1,
          status: 1,
          source: 1,
          postal_code: 1,
          meta_title: 1,
          meta_description: 1,
          meta_keyword: 1,
          project_image: 1,
          project_details: 1,
          createdAt: 1,
          village_name: 1,
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
          step: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$status', ProjectStatus.PUBLISHED] },
                  then: 1,
                },
                {
                  case: { $eq: ['$status', ProjectStatus.ASSIGNED] },
                  then: 2,
                },
                {
                  case: { $eq: ['$status', ProjectStatus.COMPLETED] },
                  then: 3,
                },
              ],
              default: 0,
            },
          },
          customer: {
            _id: '$customerInfo._id',
            full_name: '$customerInfo.full_name',
            email: '$customerInfo.email',
            phone_number: '$customerInfo.phone_number',
            profile_image: '$customerInfo.profile_image',
            address: '$customerInfo.address',
          },
          offered: {
            $gt: [{ $size: '$offer_info' }, 0],
          },
          offer: {
            $cond: [
              { $gt: [{ $size: '$offer_info' }, 0] },
              {
                $let: {
                  vars: {
                    offer: { $arrayElemAt: ['$offer_info', 0] },
                  },
                  in: {
                    description: '$$offer.description',
                    estimated_duration: '$$offer.estimated_duration',
                    amount: '$$offer.amount',
                    status: '$$offer.status',
                    clips_used: '$$offer.clips_used',
                  },
                },
              },
              null,
            ],
          },
        },
      },
    ]);

    if (!projectData) {
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.PROJECT_NOT_FOUND,
        `Project ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Project ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      projectData,
    );
  }

  async listOfProject(dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const start = (pageNumber - 1) * pageLimit;

    const pipeline: PipelineStage[] = [];

    pipeline.push(
      {
        $lookup: {
          from: 'user',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customerData',
        },
      },
      {
        $unwind: {
          path: '$customerData',
          preserveNullAndEmptyArrays: true,
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
    );

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { 'customerData.full_name': { $regex: search, $options: 'i' } },
            { 'customerData.email': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
      {
        $project: {
          _id: 1,
          title: 1,
          status: {
            $cond: [{ $eq: ['$is_deleted', true] }, 'deleted', '$status'],
          },
          createdAt: 1,
          category: '$categoryInfo.category',
          category_id: '$categoryInfo._id',
          type_of_work: '$categoryInfo.type_of_work.name',
          type_of_work_id: '$categoryInfo.type_of_work._id',
          customer: {
            full_name: '$customerData.full_name',
            email: '$customerData.email',
          },
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

    const [result] = await this.projectModel.aggregate(pipeline);
    const paginatedResults = result?.paginatedResults ?? [];
    const totalItems =
      result?.totalCount?.length > 0 ? result.totalCount[0].count : 0;

    Logger.log(`Project's ${Messages.GET_SUCCESS}`);
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

  async deleteProject(req: UserRequest, projectId: string) {
    const { id, role } = req.user;

    const project = (await this.projectModel.findById(
      projectId,
    )) as unknown as IProject;

    if (!project) {
      Logger.error(`project ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.PROJECT_NOT_FOUND,
        `project ${Messages.NOT_FOUND}`,
      );
    }

    if (role === Role.CUSTOMER) {
      if (project.customer_id.toString() !== id.toString()) {
        return HandleResponse(
          HttpStatus.FORBIDDEN,
          ResponseData.ERROR,
          MessagesKey.FORBIDDEN,
          Messages.FORBIDDEN,
        );
      }
    }

    await this.projectModel.updateOne(
      { _id: projectId },
      { $set: { is_deleted: true, status: ProjectStatus.DELETED } },
    );

    await this.offerModel.updateMany(
      {
        project_id: new Types.ObjectId(projectId),
        status: {
          $in: [
            OfferStatus.ASSIGNED,
            OfferStatus.PENDING,
            OfferStatus.REJECTED,
          ],
        },
      },
      {
        $set: {
          is_deleted: true,
          status: OfferStatus.DELETED,
        },
      },
    );

    Logger.log(`Project ${Messages.DELETE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      MessagesKey.PROJECT_DELETED_SUCCESS,
      `Project ${Messages.DELETE_SUCCESS}`,
    );
  }

  async updateProject(req: UserRequest, dto: UpdateProjectDto) {
    let { project_id, category, ...projectDetails } = dto;

    const { id, role } = req.user;

    const project = (await this.projectModel.findById(
      project_id,
    )) as unknown as IProject;

    if (!project) {
      Logger.error(`project ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.PROJECT_NOT_FOUND,
        `project ${Messages.NOT_FOUND}`,
      );
    }

    if (role === Role.CUSTOMER) {
      if (project.customer_id.toString() !== id.toString()) {
        Logger.error(Messages.FORBIDDEN);
        return HandleResponse(
          HttpStatus.FORBIDDEN,
          ResponseData.ERROR,
          MessagesKey.FORBIDDEN,
          Messages.FORBIDDEN,
        );
      }
    }

    await this.projectModel.updateOne(
      { _id: project_id },
      {
        $set: {
          ...projectDetails,
          ...(category && {
            category: {
              category_id: category.categoryId,
              type_of_work_id: category.typeOfWorkId || null,
            },
          }),
        },
      },
    );

    Logger.log(`Project ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.PROJECT_UPDATED_SUCCESS,
      `Project ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async updateProjectStatus(dto: UpdateProjectStatusDto) {
    const { project_id, status } = dto;

    const project = (await this.projectModel.findById(
      project_id,
    )) as unknown as IProject;

    if (!project) {
      Logger.error(`Project ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.PROJECT_NOT_FOUND,
        `Project ${Messages.NOT_FOUND}`,
      );
    }

    await this.projectModel.updateOne(
      { _id: project_id },
      { $set: { status } },
    );

    if (status === ProjectStatus.COMPLETED) {
      await this.offerModel.updateOne(
        {
          project_id: project._id,
          status: OfferStatus.ASSIGNED,
        },
        {
          $set: {
            status: OfferStatus.COMPLETED,
          },
        },
      );
    }

    Logger.log(`Project status ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.PROJECT_STATUS_UPDATED_SUCCESS,
      `Project status ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async cancelProject(dto: UpdateProjectStatusDto) {
    const { project_id, status } = dto;

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

    await this.projectModel.updateOne(
      { _id: project_id },
      { $set: { status } },
    );

    await this.offerModel.updateOne(
      {
        project_id: project_id,
        status: OfferStatus.ASSIGNED,
      },
      {
        $set: {
          status: OfferStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      },
    );

    Logger.log(`Project ${Messages.CANCEL_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.PROJECT_CANCELED_SUCCESS,
      `Project ${Messages.CANCEL_SUCCESS}`,
    );
  }
}
