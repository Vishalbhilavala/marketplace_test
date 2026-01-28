import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  BusinessFieldsDto,
  ChangePasswordDto,
  CreateCustomerDto,
  CreatePasswordDto,
  CustomerFieldsDto,
  ForgotPasswordDto,
  LoginDto,
  ValidateBusinessDto,
  VerifyEmailDto,
  VerifyOtpDto,
} from './dto/user.dto';
import {
  BusinessStatus,
  ProjectStatus,
  ResponseData,
  Role,
} from 'src/libs/utils/constant/enum';
import { Messages, MessagesKey } from 'src/libs/utils/constant/messages';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/schema/user.schema';
import { Model, PipelineStage, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { emailSend, sendOtp } from 'src/libs/helper/mail';
import { Otp, OtpDocument } from 'src/schema/otp.schema';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import {
  checkUserStatus,
  generatePassword,
  getTemplate,
} from 'src/libs/utils/constant/common-function';
import {
  MailTemplate,
  MailTemplateDocument,
} from 'src/schema/email-template.schema';
import * as Handlebars from 'handlebars';
import { EMAIL_TEMPLATE_TYPES } from 'src/libs/utils/constant/constant';
import {
  CategoryLean,
  ProffApiResponse,
  ProffCompany,
  UserDetail,
  UserRequest,
} from 'src/libs/utils/constant/interface';
import {
  TypeDto,
  UpdateCustomerDto,
  UpdateUserDto,
} from './dto/update-user.dto';
import * as dotenv from 'dotenv';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import axios, { AxiosInstance } from 'axios';
import { Category } from 'src/schema/category.schema';
import { County } from 'src/schema/county.schema';
import { Municipality } from 'src/schema/proff-county.schema';
import {
  BusinessDemoData,
  BusinessDemoDataDocument,
} from 'src/schema/business-demo-data.schema';
dotenv.config();

@Injectable()
export class UserService {
  private readonly axiosClient: AxiosInstance = axios.create();

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    @InjectModel(MailTemplate.name)
    private readonly mailTemplateModel: Model<MailTemplateDocument>,
    private readonly jwtService: JwtService,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    @InjectModel(County.name)
    private readonly countyModel: Model<County>,
    @InjectModel(Municipality.name)
    private readonly municipalityModel: Model<Municipality>,
    @InjectModel(BusinessDemoData.name)
    private readonly businessDemoModel: Model<BusinessDemoDataDocument>,
  ) {
    this.axiosClient = axios.create({
      // baseURL: `http:/abc`,
      baseURL: `${process.env.PROFF_BASE_URL}/companies/register/${process.env.PROFF_COUNTRY}`,
      headers: {
        Authorization: `Token ${process.env.PROFF_API_TOKEN}`,
        Accept: 'application/json',
      },
      timeout: 10000,
    });
  }

  async customerRegister(dto: CustomerFieldsDto) {
    const { email, password, ...userDetails } = dto;

    const existingUser = await this.userModel.findOne({ email });

    if (existingUser) {
      Logger.error(Messages.EMAIL_ALREADY_EXIST);
      return HandleResponse(
        HttpStatus.CONFLICT,
        ResponseData.ERROR,
        MessagesKey.EMAIL_ALREADY_EXIST,
        Messages.EMAIL_ALREADY_EXIST,
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.userModel.create({
      ...userDetails,
      email,
      password: hashedPassword,
      role: Role.CUSTOMER,
      is_active: true,
      is_password: true,
    });

    Logger.log(`Account ${Messages.CREATE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.CREATED,
      ResponseData.SUCCESS,
      MessagesKey.USER_CREATED_SUCCESS,
      `Account ${Messages.CREATE_SUCCESS}`,
    );
  }

  async businessRegister(dto: BusinessFieldsDto) {
    const {
      email,
      business_name,
      org_no,
      full_name,
      phone_number,
      county,
      category,
      terms_condition,
    } = dto;

    const findUser = await this.userModel.findOne({ email });

    if (findUser) {
      Logger.error(Messages.EMAIL_ALREADY_EXIST);
      return HandleResponse(
        HttpStatus.CONFLICT,
        ResponseData.ERROR,
        MessagesKey.EMAIL_ALREADY_EXIST,
        Messages.EMAIL_ALREADY_EXIST,
      );
    }

    const existingUser = await this.userModel.findOne({ org_no });

    if (existingUser) {
      Logger.error(`Business ${Messages.ALREADY_EXIST} with org number.`);
      return HandleResponse(
        HttpStatus.CONFLICT,
        ResponseData.ERROR,
        MessagesKey.BUSINESS_ALREADY_EXIST,
        `Business ${Messages.ALREADY_EXIST} with org number.`,
      );
    }

    const counties = (await this.countyModel
      .find({ _id: { $in: county }, is_deleted: false })
      .lean()) as Array<{ _id: Types.ObjectId; name: string }>;

    if (!counties || counties.length === 0) {
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.COUNTY_NOT_FOUND,
        `County ${Messages.NOT_FOUND}`,
      );
    }

    const municipalities = (await this.municipalityModel
      .find({
        county_id: { $in: counties.map((c) => c._id) },
        is_deleted: false,
      })
      .lean()) as unknown as Array<{
      _id: Types.ObjectId;
      county_id: Types.ObjectId;
    }>;

    const municipalityAccess = counties.map((county) => {
      const municipalitiesForCounty = municipalities
        .filter((m) => m.county_id.equals(county._id))
        .map((m) => ({
          municipality_id: m._id,
          is_active: true,
        }));

      return {
        county_id: county._id,
        municipalities: municipalitiesForCounty,
        is_active: true,
      };
    });

    const categoryDocs = await this.categoryModel
      .find(
        {
          is_deleted: false,
          'category._id': { $in: category },
        },
        { 'category.$': 1 },
      )
      .lean<CategoryLean[]>();

    const businessCategories = categoryDocs.map((doc) => {
      const subCategory = doc.category[0];

      return {
        category_id: subCategory._id,
        type_of_works: (subCategory.type_of_work ?? []).map((work) => ({
          type_of_work_id: work._id,
          is_active: true,
        })),
      };
    });

    const templateName = EMAIL_TEMPLATE_TYPES.BUSINESS_REGISTRATION_EMAIL;
    const templateDoc = await getTemplate(this.mailTemplateModel, templateName);

    if (!templateDoc) {
      Logger.log(`Email template ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.EMAIL_TEMPLATE_NOT_FOUND,
        `Email template ${Messages.NOT_FOUND}`,
      );
    }
    const baseLink = templateDoc.notification_variable[0].link;

    const link = `${baseLink}?email=${encodeURIComponent(email)}`;

    const subject = templateDoc.notification_name;
    const dynamicVariables = {
      email,
      full_name,
      link,
    };

    const template = Handlebars.compile(templateDoc.template);
    const htmlContent = template(dynamicVariables);

    await emailSend(email, subject, htmlContent);

    const user = await this.userModel.create({
      email,
      full_name,
      phone_number,
      role: Role.BUSINESS,
      business_name,
      org_no,
      is_active: true,
      is_password: false,
      status: BusinessStatus.APPROVED,
      county: municipalityAccess,
      category: businessCategories,
      terms_condition,
    });

    Logger.log(`Account ${Messages.CREATE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.CREATED,
      ResponseData.SUCCESS,
      MessagesKey.USER_CREATED_SUCCESS,
      `Account ${Messages.CREATE_SUCCESS}`,
      { _id: user._id },
    );
  }

  async validateBusiness(dto: ValidateBusinessDto) {
    const { email, org_no } = dto;

    const findUser = await this.userModel.findOne({ email });

    if (findUser) {
      Logger.error(Messages.EMAIL_ALREADY_EXIST);
      return HandleResponse(
        HttpStatus.CONFLICT,
        ResponseData.ERROR,
        MessagesKey.EMAIL_ALREADY_EXIST,
        Messages.EMAIL_ALREADY_EXIST,
      );
    }

    const existingUser = await this.userModel.findOne({ org_no });

    if (existingUser) {
      Logger.error(`Business ${Messages.ALREADY_EXIST} with org number.`);
      return HandleResponse(
        HttpStatus.CONFLICT,
        ResponseData.ERROR,
        MessagesKey.BUSINESS_ALREADY_EXIST,
        `Business ${Messages.ALREADY_EXIST} with org number.`,
      );
    }

    Logger.error(`Business ${Messages.VALIDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      true,
    );
  }

  async login(dto: LoginDto) {
    const { email, newPassword, confirmPassword } = dto;

    const findUser = await this.userModel.findOne({ email });

    if (!findUser) {
      Logger.error(`User ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.USER_NOT_FOUND,
        `User ${Messages.NOT_FOUND}`,
      );
    }

    if (findUser.is_active === false) {
      Logger.log(Messages.INACTIVE_ACCOUNT);
      return HandleResponse(
        HttpStatus.FORBIDDEN,
        ResponseData.ERROR,
        MessagesKey.INACTIVE_ACCOUNT,
        Messages.INACTIVE_ACCOUNT,
      );
    }

    const user = findUser as UserDetail;

    if (
      user.role === Role.BUSINESS &&
      user.status === BusinessStatus.REJECTED
    ) {
      Logger.error(Messages.BUSINESS_REJECTED);
      return HandleResponse(
        HttpStatus.FORBIDDEN,
        ResponseData.ERROR,
        MessagesKey.BUSINESS_REJECTED,
        Messages.BUSINESS_REJECTED,
      );
    }

    if (newPassword && confirmPassword && user.is_password) {
      Logger.log(Messages.PASSWORD_ALREADY_SET);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.PASSWORD_ALREADY_SET,
        Messages.PASSWORD_ALREADY_SET,
      );
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(confirmPassword!, salt);

    if (newPassword && confirmPassword) {
      await this.userModel.updateOne(
        { email },
        { $set: { password: hashedPassword, is_password: true } },
      );

      user.password = hashedPassword;
    }

    let isPasswordValid = false;
    if (confirmPassword && user?.password) {
      isPasswordValid = await bcrypt.compare(confirmPassword, user.password);
    }

    if (!isPasswordValid) {
      Logger.error(Messages.CREDENTIAL_NOT_MATCH);
      return HandleResponse(
        HttpStatus.UNAUTHORIZED,
        ResponseData.ERROR,
        MessagesKey.CREDENTIAL_NOT_MATCH,
        Messages.CREDENTIAL_NOT_MATCH,
      );
    }

    const token = await this.jwtService.signAsync({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    Logger.log(Messages.LOGIN_SUCCESS);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      MessagesKey.LOGIN_SUCCESS,
      Messages.LOGIN_SUCCESS,
      { token },
    );
  }

  fileUpload(files: Express.Multer.File[]) {
    if (files.length === 0) {
      Logger.log(`File ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.FILE_NOT_FOUND,
        `File ${Messages.NOT_FOUND}`,
      );
    }

    const imagePath = files.map((img) => img.filename);

    Logger.log(`File ${Messages.ADD_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      MessagesKey.FILE_ADD_SUCCESS,
      `File ${Messages.ADD_SUCCESS}`,
      {
        imagePath,
      },
    );
  }

  fileUploaded(files: Express.Multer.File[]) {
    if (files.length === 0) {
      Logger.log(`File ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.FILE_NOT_FOUND,
        `File ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`This is aws S3 file upload function`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      `Dette er AWS S3-filopplastingsfunksjonen`,
      `This is aws S3 file upload function`,
    );
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const { email } = dto;

    const findUser = await this.userModel.findOne({ email });

    if (!findUser) {
      Logger.error(Messages.USER_NOT_FOUND_WITH_EMAIL);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.USER_NOT_FOUND_WITH_EMAIL,
        Messages.USER_NOT_FOUND_WITH_EMAIL,
      );
    }

    if (findUser.is_active === false) {
      Logger.log(Messages.INACTIVE_ACCOUNT);
      return HandleResponse(
        HttpStatus.FORBIDDEN,
        ResponseData.ERROR,
        MessagesKey.INACTIVE_ACCOUNT,
        Messages.INACTIVE_ACCOUNT,
      );
    }

    const otp = sendOtp();

    await new this.otpModel({
      email: email || null,
      otp,
      expire_time: new Date(Date.now() + 5 * 60 * 1000),
    }).save();

    if (email) {
      try {
        const templateName = EMAIL_TEMPLATE_TYPES.OTP_SEND;
        const templateDoc = await getTemplate(
          this.mailTemplateModel,
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

        const subject = templateName;
        const dynamicVariables = {
          otp,
          first_name: findUser.full_name,
          email: findUser.email,
          expiry_minutes: 5,
        };

        const template = Handlebars.compile(templateDoc.template);
        const htmlContent = template(dynamicVariables);

        await emailSend(email, subject, htmlContent);
      } catch (error) {
        Logger.error(`Error while sending mail: `, error);
        throw error;
      }

      Logger.log(Messages.OTP_SENT);
      return HandleResponse(
        HttpStatus.OK,
        ResponseData.SUCCESS,
        MessagesKey.OTP_SENT_SUCCESS,
        Messages.OTP_SENT,
      );
    }
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { email, otp } = dto;

    const findUser = await this.userModel.findOne({ email });

    if (!findUser) {
      Logger.error(Messages.USER_NOT_FOUND_WITH_EMAIL);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.USER_NOT_FOUND_WITH_EMAIL,
        Messages.USER_NOT_FOUND_WITH_EMAIL,
      );
    }

    if (findUser.is_active === false) {
      Logger.log(Messages.INACTIVE_ACCOUNT);
      return HandleResponse(
        HttpStatus.FORBIDDEN,
        ResponseData.ERROR,
        MessagesKey.INACTIVE_ACCOUNT,
        Messages.INACTIVE_ACCOUNT,
      );
    }

    const otpRecord = await this.otpModel
      .findOne({ email })
      .sort({ createdAt: -1 });

    if (!otpRecord || otpRecord.otp !== otp) {
      Logger.error(Messages.OTP_INVALID);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.INVALID_OTP,
        Messages.OTP_INVALID,
      );
    }

    if (otpRecord.expire_time < new Date()) {
      await this.otpModel.deleteMany({ email });

      Logger.error(Messages.OTP_EXPIRED);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.OTP_EXPIRED,
        Messages.OTP_EXPIRED,
      );
    }

    await this.otpModel.updateOne(
      { _id: otpRecord._id },
      { $set: { is_verify: true } },
    );

    Logger.log(Messages.OTP_VERIFIED_SUCCESS);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      MessagesKey.OTP_VERIFIED_SUCCESS,
      Messages.OTP_VERIFIED_SUCCESS,
    );
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const { email, newPassword, confirmPassword, otp } = dto;

    const findUser = await this.userModel.findOne({ email });

    if (!findUser) {
      Logger.error(`User ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.USER_NOT_FOUND,
        `User ${Messages.NOT_FOUND}`,
      );
    }

    if (findUser.is_active === false) {
      Logger.log(Messages.INACTIVE_ACCOUNT);
      return HandleResponse(
        HttpStatus.FORBIDDEN,
        ResponseData.ERROR,
        MessagesKey.INACTIVE_ACCOUNT,
        Messages.INACTIVE_ACCOUNT,
      );
    }

    const otpRecord = await this.otpModel
      .findOne({ email, otp, is_verify: true })
      .sort({ createdAt: -1 });

    if (!otpRecord) {
      Logger.error(Messages.OTP_INVALID);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.INVALID_OTP,
        Messages.OTP_INVALID,
      );
    }

    await this.otpModel.deleteMany({ email });

    if (newPassword && confirmPassword) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await this.userModel.updateOne(
        { email },
        { $set: { password: hashedPassword } },
      );

      Logger.log(`Password ${Messages.UPDATED_SUCCESS}`);
      return HandleResponse(
        HttpStatus.ACCEPTED,
        ResponseData.SUCCESS,
        MessagesKey.PASSWORD_UPDATE_SUCCESS,
        `Password ${Messages.UPDATED_SUCCESS}`,
      );
    }
  }

  async changePassword(req: UserRequest, dto: ChangePasswordDto) {
    const { confirmPassword, currentPassword } = dto;

    const email = req.user.email;
    const result = await checkUserStatus(this.userModel, email);

    const user = result as UserDetail;

    let isPasswordValid = false;

    if (confirmPassword && user?.password) {
      isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    }

    if (!isPasswordValid) {
      Logger.error(Messages.INVALID_CURRENT_PASSWORD);
      return HandleResponse(
        HttpStatus.UNAUTHORIZED,
        ResponseData.ERROR,
        MessagesKey.INVALID_CURRENT_PASSWORD,
        Messages.INVALID_CURRENT_PASSWORD,
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(confirmPassword!, salt);

    await this.userModel.updateOne(
      { email },
      { $set: { password: hashedPassword } },
    );
    Logger.log(`Password ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.PASSWORD_UPDATE_SUCCESS,
      `Password ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async viewProfile(req: UserRequest) {
    const userId = new Types.ObjectId(req.user.id);

    const userProfile = await this.userModel.aggregate([
      { $match: { _id: userId } },

      {
        $project: {
          password: 0,
          is_password: 0,
          __v: 0,
          createdAt: 0,
          updatedAt: 0,
        },
      },

      { $unwind: { path: '$county', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'county',
          localField: 'county.county_id',
          foreignField: '_id',
          as: 'county_info',
        },
      },
      { $unwind: { path: '$county_info', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'municipality',
          let: { countyId: '$county.county_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$county_id', '$$countyId'] },
                    { $eq: ['$is_deleted', false] },
                  ],
                },
              },
            },
            { $project: { _id: 1, name: 1 } },
          ],
          as: 'all_municipalities',
        },
      },

      /* ---------------- PROJECT COUNTS ---------------- */
      {
        $lookup: {
          from: 'project',
          pipeline: [
            { $match: { is_deleted: false, status: ProjectStatus.PUBLISHED } },
            {
              $facet: {
                county: [{ $group: { _id: '$county_id', count: { $sum: 1 } } }],
                municipality: [
                  { $group: { _id: '$municipality_id', count: { $sum: 1 } } },
                ],
                category: [
                  {
                    $group: {
                      _id: '$category.category_id',
                      count: { $sum: 1 },
                    },
                  },
                ],
                typeOfWork: [
                  { $match: { 'category.type_of_work_id': { $ne: null } } },
                  {
                    $group: {
                      _id: '$category.type_of_work_id',
                      count: { $sum: 1 },
                    },
                  },
                ],
              },
            },
          ],
          as: 'projectStats',
        },
      },

      {
        $addFields: {
          countyProjectCounts: { $arrayElemAt: ['$projectStats.county', 0] },
          municipalityProjectCounts: {
            $arrayElemAt: ['$projectStats.municipality', 0],
          },
          categoryProjectCounts: {
            $arrayElemAt: ['$projectStats.category', 0],
          },
          typeOfWorkProjectCounts: {
            $arrayElemAt: ['$projectStats.typeOfWork', 0],
          },
        },
      },

      {
        $addFields: {
          county: {
            county_id: '$county.county_id',
            county_name: '$county_info.name',
            municipalities: {
              $map: {
                input: '$all_municipalities',
                as: 'm',
                in: {
                  municipality_id: '$$m._id',
                  municipality_name: '$$m.name',
                  is_active: {
                    $ifNull: [
                      {
                        $arrayElemAt: [
                          {
                            $map: {
                              input: {
                                $filter: {
                                  input: '$county.municipalities',
                                  as: 'um',
                                  cond: {
                                    $eq: ['$$um.municipality_id', '$$m._id'],
                                  },
                                },
                              },
                              as: 'x',
                              in: '$$x.is_active',
                            },
                          },
                          0,
                        ],
                      },
                      false,
                    ],
                  },
                  project_count: {
                    $ifNull: [
                      {
                        $arrayElemAt: [
                          {
                            $map: {
                              input: {
                                $filter: {
                                  input: '$municipalityProjectCounts',
                                  as: 'mp',
                                  cond: {
                                    $eq: ['$$mp._id', '$$m._id'],
                                  },
                                },
                              },
                              as: 'y',
                              in: '$$y.count',
                            },
                          },
                          0,
                        ],
                      },
                      0,
                    ],
                  },
                },
              },
            },
          },
        },
      },

      {
        $group: {
          _id: '$_id',
          user: { $first: '$$ROOT' },
          counties: { $push: '$county' },
        },
      },

      {
        $replaceRoot: {
          newRoot: { $mergeObjects: ['$user', { county: '$counties' }] },
        },
      },

      {
        $addFields: {
          county: {
            $map: {
              input: '$county',
              as: 'c',
              in: {
                county_id: '$$c.county_id',
                county_name: '$$c.county_name',
                municipalities: '$$c.municipalities',
                project_count: {
                  $ifNull: [
                    {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: {
                              $filter: {
                                input: '$countyProjectCounts',
                                as: 'cp',
                                cond: {
                                  $eq: ['$$cp._id', '$$c.county_id'],
                                },
                              },
                            },
                            as: 'x',
                            in: '$$x.count',
                          },
                        },
                        0,
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },

      {
        $lookup: {
          from: 'category',
          let: {
            userCategories: { $ifNull: ['$category', []] },
            categoryProjectCounts: '$categoryProjectCounts',
            typeOfWorkProjectCounts: '$typeOfWorkProjectCounts',
          },
          pipeline: [
            { $unwind: '$category' },
            {
              $match: {
                $expr: {
                  $in: [
                    '$category._id',
                    {
                      $map: {
                        input: '$$userCategories',
                        as: 'uc',
                        in: '$$uc.category_id',
                      },
                    },
                  ],
                },
              },
            },
            {
              $addFields: {
                activeTypeIds: {
                  $reduce: {
                    input: {
                      $map: {
                        input: {
                          $filter: {
                            input: '$$userCategories',
                            as: 'uc',
                            cond: {
                              $eq: ['$$uc.category_id', '$category._id'],
                            },
                          },
                        },
                        as: 'cat',
                        in: {
                          $map: {
                            input: {
                              $filter: {
                                input: '$$cat.type_of_works',
                                as: 'tw',
                                cond: { $eq: ['$$tw.is_active', true] },
                              },
                            },
                            as: 'tw',
                            in: '$$tw.type_of_work_id',
                          },
                        },
                      },
                    },
                    initialValue: [],
                    in: { $concatArrays: ['$$value', '$$this'] },
                  },
                },
              },
            },
            {
              $project: {
                _id: '$category._id',
                name: '$category.name',
                type_of_work: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$category.type_of_work',
                        as: 'tw',
                        cond: { $in: ['$$tw._id', '$activeTypeIds'] },
                      },
                    },
                    as: 'tw',
                    in: {
                      _id: '$$tw._id',
                      name: '$$tw.name',
                      project_count: {
                        $ifNull: [
                          {
                            $arrayElemAt: [
                              {
                                $map: {
                                  input: {
                                    $filter: {
                                      input: '$$typeOfWorkProjectCounts',
                                      as: 'tp',
                                      cond: {
                                        $eq: ['$$tp._id', '$$tw._id'],
                                      },
                                    },
                                  },
                                  as: 'x',
                                  in: '$$x.count',
                                },
                              },
                              0,
                            ],
                          },
                          0,
                        ],
                      },
                    },
                  },
                },
              },
            },
            {
              $addFields: {
                project_count: {
                  $ifNull: [
                    {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: {
                              $filter: {
                                input: '$$categoryProjectCounts',
                                as: 'cp',
                                cond: { $eq: ['$$cp._id', '$_id'] },
                              },
                            },
                            as: 'p',
                            in: '$$p.count',
                          },
                        },
                        0,
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          ],
          as: 'category',
        },
      },

      /* ---------------- ACTIVE PLAN ---------------- */
      {
        $lookup: {
          from: 'business_clip',
          let: { businessId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$business_id', '$$businessId'] },
                    { $eq: ['$status', 'active'] },
                  ],
                },
              },
            },
            {
              $project: {
                remaining_clips: 1,
                expiry_date: 1,
                package_details: 1,
              },
            },
          ],
          as: 'activeClip',
        },
      },

      {
        $addFields: {
          plan_info: {
            $cond: {
              if: { $gt: [{ $size: '$activeClip' }, 0] },
              then: {
                plan_name: {
                  $arrayElemAt: ['$activeClip.package_details.package_name', 0],
                },
                expire_date: { $arrayElemAt: ['$activeClip.expiry_date', 0] },
                total_clips: {
                  $arrayElemAt: ['$activeClip.remaining_clips', 0],
                },
                price: {
                  $arrayElemAt: ['$activeClip.package_details.price', 0],
                },
              },
              else: {
                plan_name: null,
                expire_date: null,
                total_clips: 0,
                price: null,
              },
            },
          },
        },
      },

      {
        $project: {
          activeClip: 0,
          projectStats: 0,
          countyProjectCounts: 0,
          municipalityProjectCounts: 0,
          categoryProjectCounts: 0,
          typeOfWorkProjectCounts: 0,
          county_info: 0,
          all_municipalities: 0,
        },
      },
    ]);

    if (!userProfile.length) {
      Logger.log(`User ${Messages.NOT_EXIST}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.USER_NOT_EXIST,
        `User ${Messages.NOT_EXIST}`,
      );
    }

    if (userProfile[0].is_active === false) {
      Logger.log(Messages.INACTIVE_ACCOUNT);
      return HandleResponse(
        HttpStatus.FORBIDDEN,
        ResponseData.ERROR,
        MessagesKey.INACTIVE_ACCOUNT,
        Messages.INACTIVE_ACCOUNT,
      );
    }

    if (
      userProfile[0].role === Role.BUSINESS &&
      userProfile[0].status === BusinessStatus.REJECTED
    ) {
      Logger.log(Messages.BUSINESS_REJECTED);
      return HandleResponse(
        HttpStatus.FORBIDDEN,
        ResponseData.ERROR,
        MessagesKey.BUSINESS_REJECTED,
        Messages.BUSINESS_REJECTED,
      );
    }

    Logger.log(`Profile ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      userProfile[0],
    );
  }

  async editProfile(dto: UpdateUserDto) {
    const { email, userId, county } = dto;
    const user = await checkUserStatus(this.userModel, userId);
    if (user.status === ResponseData.ERROR) {
      return user;
    }

    if (email) {
      const duplicateEmail = await this.userModel.findOne({
        email,
        _id: { $ne: userId },
      });

      if (duplicateEmail) {
        Logger.error(`User ${Messages.ALREADY_EXIST}`);
        return HandleResponse(
          HttpStatus.BAD_REQUEST,
          ResponseData.ERROR,
          MessagesKey.USER_ALREADY_EXIST,
          `User ${Messages.ALREADY_EXIST}`,
        );
      }
    }

    let municipalityAccess:
      | {
          county_id: Types.ObjectId;
          municipalities: {
            municipality_id: Types.ObjectId;
            is_active: boolean;
          }[];
          is_active: boolean;
        }[]
      | undefined;

    if (Array.isArray(county) && county.length > 0) {
      const counties = (await this.countyModel
        .find({ _id: { $in: county }, is_deleted: false })
        .lean()) as Array<{ _id: Types.ObjectId; name: string }>;

      if (!counties || counties.length === 0) {
        return HandleResponse(
          HttpStatus.NOT_FOUND,
          ResponseData.ERROR,
          MessagesKey.COUNTY_NOT_FOUND,
          `County ${Messages.NOT_FOUND}`,
        );
      }

      const municipalities = (await this.municipalityModel
        .find({
          county_id: { $in: counties.map((c) => c._id) },
          is_deleted: false,
        })
        .lean()) as unknown as Array<{
        _id: Types.ObjectId;
        county_id: Types.ObjectId;
      }>;

      municipalityAccess = counties.map((county) => {
        const municipalitiesForCounty = municipalities
          .filter((m) => m.county_id.equals(county._id))
          .map((m) => ({
            municipality_id: m._id,
            is_active: true,
          }));

        return {
          county_id: county._id,
          municipalities: municipalitiesForCounty,
          is_active: true,
        };
      });
    }

    let categoryAccess:
      | {
          category_id: Types.ObjectId;
          type_of_works: {
            type_of_work_id: Types.ObjectId;
            is_active: boolean;
          }[];
        }[]
      | undefined;

    if (dto.category?.length) {
      const categoryDocs = await this.categoryModel.aggregate([
        { $unwind: '$category' },
        {
          $match: {
            is_deleted: false,
            'category._id': {
              $in: dto.category.map((id) => new Types.ObjectId(id)),
            },
          },
        },
        {
          $project: {
            _id: 0,
            category: 1,
          },
        },
      ]);

      categoryAccess = categoryDocs.map((doc) => {
        const subCategory = doc.category;

        return {
          category_id: subCategory._id,
          type_of_works: (subCategory.type_of_work ?? []).map((work) => ({
            type_of_work_id: work._id,
            is_active: true,
          })),
        };
      });
    }

    const { county: _county, category: _category, ...restDto } = dto;

    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          ...restDto,
          county: municipalityAccess,
          category: categoryAccess,
        },
      },
    );

    Logger.log(`Profile ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.PROFILE_UPDATE_SUCCESS,
      `Profile ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async listOfTypes(dto: TypeDto) {
    const { type } = dto;

    const listData = await this.userModel.aggregate([
      {
        $match: { role: type },
      },
      {
        $project: {
          _id: 1,
          full_name: 1,
        },
      },
    ]);

    if (listData.length === 0) {
      Logger.log(`List ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.LIST_NOT_FOUND,
        `List ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`List ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      listData,
    );
  }

  async editCustomerProfile(dto: UpdateCustomerDto) {
    const { email, userId, postal_code, ...customerDetails } = dto;

    const findCustomer = await this.userModel.findOne({
      _id: userId,
      role: Role.CUSTOMER,
    });

    if (!findCustomer) {
      Logger.log(`Customer ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.CUSTOMER_NOT_FOUND,
        `Customer ${Messages.NOT_FOUND}`,
      );
    }

    const duplicateEmail = await this.userModel.findOne({
      email,
      _id: { $ne: userId },
    });

    if (duplicateEmail) {
      Logger.error(`User ${Messages.ALREADY_EXIST}`);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.USER_ALREADY_EXIST,
        `User ${Messages.ALREADY_EXIST}`,
      );
    }

    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          email,
          postal_code,
          ...customerDetails,
        },
      },
    );

    Logger.log(`Profile ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.PROFILE_UPDATE_SUCCESS,
      `Profile ${Messages.UPDATED_SUCCESS}`,
    );
  }

  async listOfCustomer(dto: ListOfDataDto) {
    const { page = 1, limit = 10, search, sortKey, sortValue } = dto;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const sortOrder = sortValue === 'asc' ? 1 : -1;
    const sortField = sortKey || 'createdAt';

    const pipeline: PipelineStage[] = [];

    pipeline.push({
      $match: {
        role: Role.CUSTOMER,
      },
    });

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
        status: {
          $cond: [{ $eq: ['$is_active', true] }, 'active', 'inactive'],
        },
      },
    });

    // Case-insensitive sorting support
    pipeline.push({
      $addFields: {
        sortValue: {
          $cond: {
            if: { $eq: [{ $type: `$${sortField}` }, 'string'] },
            then: { $toLower: `$${sortField}` },
            else: `$${sortField}`,
          },
        },
      },
    });

    const start = (pageNumber - 1) * pageLimit;

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
              is_active: 1,
              status: 1,
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
      },
    });

    const [result] = await this.userModel.aggregate(pipeline);
    const { paginatedResults, totalCount } = result;
    const totalItems = totalCount?.length > 0 ? totalCount[0].count : 0;

    Logger.log(`Customer List ${Messages.GET_SUCCESS}`);
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

  async viewCustomer(customerId: string) {
    const [customerData] = await this.userModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(customerId),
          role: Role.CUSTOMER,
        },
      },

      {
        $project: {
          _id: 1,
          full_name: 1,
          email: 1,
          phone_number: 1,
          postal_code: 1,
          address: 1,
          location: 1,
          profile_image: 1,
          createdAt: 1,
        },
      },
    ]);

    if (!customerData) {
      Logger.error(`Customer ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.CUSTOMER_NOT_FOUND,
        `Customer ${Messages.NOT_FOUND}`,
      );
    }

    Logger.log(`Customer ${Messages.GET_SUCCESS}`);
    return HandleResponse(
      HttpStatus.OK,
      ResponseData.SUCCESS,
      undefined,
      undefined,
      customerData,
    );
  }

  async addCustomer(dto: CreateCustomerDto) {
    const { email, ...userDetails } = dto;

    const findCustomer = await this.userModel.findOne({
      email,
    });

    if (findCustomer) {
      Logger.error(Messages.EMAIL_ALREADY_EXIST);
      return HandleResponse(
        HttpStatus.CONFLICT,
        ResponseData.ERROR,
        MessagesKey.EMAIL_ALREADY_EXIST,
        Messages.EMAIL_ALREADY_EXIST,
      );
    }

    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await this.userModel.create({
      ...userDetails,
      email,
      password: hashedPassword,
      role: Role.CUSTOMER,
      is_active: true,
    });

    try {
      const templateName = EMAIL_TEMPLATE_TYPES.WELCOME_PASSWORD;
      const templateDoc = await getTemplate(
        this.mailTemplateModel,
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
        first_name: userDetails.full_name,
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

    Logger.log(`Account ${Messages.CREATE_SUCCESS}`);
    return HandleResponse(
      HttpStatus.CREATED,
      ResponseData.SUCCESS,
      MessagesKey.USER_CREATED_SUCCESS,
      `Account ${Messages.CREATE_SUCCESS}`,
      { _id: customer._id },
    );
  }

  async searchCompanies(
    query: string,
  ): Promise<{ name: string; organizationNumber: string }[]> {
    try {
      const response = await this.axiosClient.get<ProffApiResponse>('', {
        params: { query },
      });

      return response.data.companies.map((company) => ({
        name: company.name,
        organizationNumber: company.organisationNumber,
      }));
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: unknown };
        message?: string;
      };

      Logger.error(err.response?.data || err.message);
      throw error;
    }
  }

  async searchCompaniesDev(
    query: string,
  ): Promise<{ name: string; organizationNumber: string }[]> {
    const results = await this.businessDemoModel
      .find({
        name: { $regex: query, $options: 'i' },
      })
      .select({ name: 1, organizationNumber: 1, _id: 0 })
      .lean();

    return results;
  }

  async searchCompanyData(query: string): Promise<ProffCompany[]> {
    try {
      const response = await this.axiosClient.get<ProffApiResponse>('', {
        params: { query },
      });

      return response.data.companies;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: unknown };
        message?: string;
      };

      Logger.error(err.response?.data || err.message);
      throw error;
    }
  }

  async createPassword(email: string, dto: CreatePasswordDto) {
    const { newPassword } = dto;

    if (!email) {
      Logger.error(`Email ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.EMAIL_NOT_FOUND,
        `Email ${Messages.NOT_FOUND}`,
      );
    }

    const findUser = await this.userModel.findOne({ email });

    if (!findUser) {
      Logger.error(`User ${Messages.NOT_FOUND}`);
      return HandleResponse(
        HttpStatus.NOT_FOUND,
        ResponseData.ERROR,
        MessagesKey.USER_NOT_FOUND,
        `User ${Messages.NOT_FOUND}`,
      );
    }

    if (findUser.is_password) {
      Logger.error(Messages.PASSWORD_ALREADY_SET);
      return HandleResponse(
        HttpStatus.BAD_REQUEST,
        ResponseData.ERROR,
        MessagesKey.PASSWORD_ALREADY_SET,
        Messages.PASSWORD_ALREADY_SET,
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await this.userModel.updateOne(
      { email },
      { $set: { password: hashedPassword, is_password: true } },
    );

    Logger.log(`Password ${Messages.UPDATED_SUCCESS}`);
    return HandleResponse(
      HttpStatus.ACCEPTED,
      ResponseData.SUCCESS,
      MessagesKey.PASSWORD_UPDATE_SUCCESS,
      `Password ${Messages.UPDATED_SUCCESS}`,
    );
  }
}
